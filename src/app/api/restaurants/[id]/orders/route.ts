import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import { normalizeThemeFont } from '@/lib/theme/theme-presets';
import { OrderStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const since = searchParams.get('since'); // ISO date string for delta sync

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

    const orders = await prisma.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      include: {
        table: {
          select: { id: true, name: true, section: true },
        },
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            staff: { select: { displayName: true, role: true } },
          },
        },
      },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
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
    }));

    // Metrics summary for live board
    const counts = {
      placed: orders.filter((o) => o.status === 'PLACED').length,
      accepted: orders.filter((o) => o.status === 'ACCEPTED').length,
      preparing: orders.filter((o) => o.status === 'PREPARING').length,
      ready: orders.filter((o) => o.status === 'READY').length,
      served: orders.filter((o) => o.status === 'SERVED').length,
      totalActive: orders.length,
    };

    const rawTheme = auth.restaurant.theme;
    const restaurantTheme = rawTheme
      ? {
          presetKey: rawTheme.presetKey,
          headingFont: normalizeThemeFont(rawTheme.headingFont, 'Plus Jakarta Sans'),
          bodyFont: normalizeThemeFont(rawTheme.bodyFont, 'Inter'),
          buttonStyle: rawTheme.buttonStyle,
          cardRadius: rawTheme.cardRadius,
        }
      : null;

    return NextResponse.json({
      restaurantId: auth.restaurant.id,
      restaurantName: auth.restaurant.displayName,
      restaurantSlug: auth.restaurant.slug,
      restaurantTheme,
      actor: { role: auth.role, name: auth.actorName },
      counts,
      orders: formatted,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Restaurant orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

