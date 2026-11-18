import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { buildSignedTableQrToken, createRestaurantTable } from '@/lib/tables/table-service';
import { normalizeSiteUrl } from '@/lib/seo';

const ACTIVE_TABLE_ORDER_STATUSES: OrderStatus[] = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'SERVED',
];

const ACTIVE_ORDER_STATUS_PRIORITY: Partial<Record<OrderStatus, number>> = {
  PLACED: 5,
  READY: 4,
  PREPARING: 3,
  ACCEPTED: 2,
  SERVED: 1,
};

function resolveLatestActiveOrderStatus(
  orders: Array<{ status: OrderStatus }>
): OrderStatus | null {
  let bestStatus: OrderStatus | null = null;
  let bestPriority = -1;

  for (const order of orders) {
    const priority = ACTIVE_ORDER_STATUS_PRIORITY[order.status] ?? 0;
    if (priority > bestPriority) {
      bestStatus = order.status;
      bestPriority = priority;
    }
  }

  return bestStatus;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const tables = await prisma.restaurantTable.findMany({
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
        orders: {
          where: {
            status: {
              in: ACTIVE_TABLE_ORDER_STATUSES,
            },
          },
          orderBy: { placedAt: 'desc' },
          select: {
            status: true,
            totalMinor: true,
          },
        },
      },
    });

    const appUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    let activeTablesCount = 0;

    const formatted = tables.map((t) => {
      const signedToken = buildSignedTableQrToken(t);
      const activeOrderCount = t.orders.length;
      const activeOrdersTotalMinor = t.orders.reduce((sum, order) => sum + order.totalMinor, 0);
      const latestOrderStatus = resolveLatestActiveOrderStatus(t.orders);
      const hasActiveOrders = activeOrderCount > 0;
      if (hasActiveOrders) activeTablesCount += 1;

      return {
        id: t.id,
        name: t.name,
        section: t.section,
        capacity: t.capacity,
        qrVersion: t.qrVersion,
        isActive: t.isActive,
        activeOrderCount,
        activeOrdersTotalMinor,
        latestOrderStatus,
        hasActiveOrders,
        scanUrl: `${appUrl}/m/${auth.restaurant.slug}?t=${encodeURIComponent(signedToken)}`,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json(
      {
        tables: formatted,
        totalTables: formatted.length,
        activeTablesCount,
      },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Tables GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const body = await req.json();
    const { name, section, capacity } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Table name is required.' }, { status: 400 });
    }

    // Check duplicate name
    const existing = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId: id,
        name: name.trim(),
        isArchived: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A table named "${name.trim()}" already exists in this restaurant.` },
        { status: 400 }
      );
    }

    const result = await createRestaurantTable({
      restaurantId: id,
      name: name.trim(),
      section: section?.trim() || 'Main Dining',
      capacity: parseInt(capacity || 4, 10),
    });

    const appUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const scanUrl = `${appUrl}/m/${auth.restaurant.slug}?t=${result.rawToken}`;

    return NextResponse.json({
      success: true,
      table: {
        id: result.table.id,
        name: result.table.name,
        section: result.table.section,
        capacity: result.table.capacity,
        qrVersion: result.table.qrVersion,
        isActive: result.table.isActive,
        scanUrl,
        rawToken: result.rawToken,
      },
    });
  } catch (error: any) {
    console.error('Table POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

