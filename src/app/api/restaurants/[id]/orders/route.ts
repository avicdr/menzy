import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import { normalizeThemeFont } from '@/lib/theme/theme-presets';
import { getActiveServiceCalls } from '@/lib/tables/service-call-service';
import { buildSignedTableQrToken } from '@/lib/tables/table-service';
import { normalizeSiteUrl } from '@/lib/seo';
import { OrderStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const since = searchParams.get('since'); // ISO date string for delta sync
    const limitParam = searchParams.get('limit');
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(100, Math.max(1, parsedLimit))
        : undefined;
    const includeTheme = searchParams.get('includeTheme') !== '0';
    const includeCalls = searchParams.get('includeCalls') === '1';
    const includeTables = searchParams.get('includeTables') === '1';

    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: includeTheme,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const where: any = {
      restaurantId: auth.restaurant.id,
    };

    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim()) as OrderStatus[];
      where.status = { in: statuses };
    } else {
      // Default to active/non-terminal orders for the live board
      where.status = {
        in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'],
      };
    }

    if (tableId) {
      where.tableId = tableId;
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.updatedAt = { gt: sinceDate };
      }
    }

    const [orders, calls, rawTables] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        ...(limit ? { take: limit } : {}),
        select: {
          id: true,
          orderNumber: true,
          status: true,
          currency: true,
          subtotalMinor: true,
          taxMinor: true,
          serviceChargeMinor: true,
          totalMinor: true,
          paymentMethod: true,
          paymentStatus: true,
          specialInstructions: true,
          placedAt: true,
          acceptedAt: true,
          preparingAt: true,
          readyAt: true,
          servedAt: true,
          completedAt: true,
          updatedAt: true,
          table: {
            select: { id: true, name: true, section: true },
          },
          items: {
            select: {
              id: true,
              dishNameSnapshot: true,
              variantSnapshot: true,
              modifierSnapshot: true,
              quantity: true,
              unitPriceMinor: true,
              modifiersTotalMinor: true,
              lineTotalMinor: true,
              specialInstructions: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              newStatus: true,
              actorType: true,
              createdAt: true,
              staff: { select: { displayName: true } },
            },
          },
        },
      }),
      includeCalls
        ? getActiveServiceCalls(auth.restaurant.id).catch(() => [])
        : Promise.resolve(undefined),
      includeTables
        ? prisma.restaurantTable.findMany({
            where: {
              restaurantId: auth.restaurant.id,
              isArchived: false,
            },
            orderBy: { name: 'asc' },
            select: {
              id: true,
              restaurantId: true,
              name: true,
              section: true,
              capacity: true,
              qrTokenHash: true,
              qrVersion: true,
              isActive: true,
              createdAt: true,
              _count: {
                select: {
                  orders: {
                    where: {
                      status: {
                        in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'],
                      },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve(undefined),
    ]);

    const counts = {
      placed: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      totalActive: orders.length,
    };

    const formatted = orders.map((o) => {
      if (o.status === 'PLACED') counts.placed++;
      else if (o.status === 'ACCEPTED') counts.accepted++;
      else if (o.status === 'PREPARING') counts.preparing++;
      else if (o.status === 'READY') counts.ready++;
      else if (o.status === 'SERVED') counts.served++;

      return {
        id: o.id,
        tableId: o.table.id,
        orderNumber: o.orderNumber,
        status: o.status,
        currency: o.currency,
        subtotalMinor: o.subtotalMinor,
        taxMinor: o.taxMinor,
        serviceChargeMinor: o.serviceChargeMinor,
        totalMinor: o.totalMinor,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        specialInstructions: o.specialInstructions,
        placedAt: o.placedAt,
        acceptedAt: o.acceptedAt,
        preparingAt: o.preparingAt,
        readyAt: o.readyAt,
        servedAt: o.servedAt,
        completedAt: o.completedAt,
        updatedAt: o.updatedAt,
        table: {
          id: o.table.id,
          name: o.table.name,
          section: o.table.section,
        },
        itemCount: o.items.length,
        items: o.items.map((it) => ({
          id: it.id,
          dishName: it.dishNameSnapshot,
          variant: it.variantSnapshot,
          modifiers: it.modifierSnapshot,
          quantity: it.quantity,
          unitPriceMinor: it.unitPriceMinor,
          modifiersTotalMinor: it.modifiersTotalMinor,
          lineTotalMinor: it.lineTotalMinor,
          specialInstructions: it.specialInstructions,
        })),
        recentActivity: o.statusHistory[0]
          ? {
              status: o.statusHistory[0].newStatus,
              by: o.statusHistory[0].staff?.displayName || o.statusHistory[0].actorType,
              time: o.statusHistory[0].createdAt,
            }
          : null,
      };
    });

    const appUrl = includeTables
      ? normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : null;

    const formattedTables = rawTables?.map((t) => ({
      id: t.id,
      name: t.name,
      section: t.section,
      capacity: t.capacity,
      qrVersion: t.qrVersion,
      isActive: t.isActive,
      activeOrderCount: t._count.orders,
      scanUrl: `${appUrl}/m/${auth.restaurant.slug}?t=${encodeURIComponent(
        buildSignedTableQrToken(t)
      )}`,
      createdAt: t.createdAt,
    }));

    const rawTheme = includeTheme ? auth.restaurant.theme : null;
    const restaurantTheme = rawTheme
      ? {
          presetKey: rawTheme.presetKey,
          headingFont: normalizeThemeFont(rawTheme.headingFont, 'Plus Jakarta Sans'),
          bodyFont: normalizeThemeFont(rawTheme.bodyFont, 'Inter'),
          buttonStyle: rawTheme.buttonStyle,
          cardRadius: rawTheme.cardRadius,
        }
      : null;

    return NextResponse.json(
      {
        restaurantId: auth.restaurant.id,
        restaurantName: auth.restaurant.displayName,
        restaurantSlug: auth.restaurant.slug,
        restaurantTheme,
        actor: { role: auth.role, name: auth.actorName },
        counts,
        orders: formatted,
        ...(includeCalls ? { calls: calls ?? [] } : {}),
        ...(includeTables ? { tables: formattedTables ?? [] } : {}),
        syncedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Restaurant orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

