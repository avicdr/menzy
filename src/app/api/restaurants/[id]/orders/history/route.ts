import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import { normalizeThemeFont } from '@/lib/theme/theme-presets';
import { OrderStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_HISTORY');
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const tableId = searchParams.get('tableId');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const staffId = searchParams.get('staffId');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));

    const where: any = { restaurantId: auth.restaurant.id };

    // Date range
    const now = new Date();
    if (startDateParam && endDateParam) {
      where.placedAt = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam),
      };
    } else if (range === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      where.placedAt = { gte: startOfDay };
    } else if (range === 'yesterday') {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      where.placedAt = { gte: yesterdayStart, lte: yesterdayEnd };
    } else if (range === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.placedAt = { gte: sevenDaysAgo };
    } else if (range === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.placedAt = { gte: thirtyDaysAgo };
    }

    if (tableId) where.tableId = tableId;
    if (statusParam) where.status = statusParam as OrderStatus;

    if (minAmount) {
      const minMinor = parseInt(minAmount, 10);
      if (!isNaN(minMinor)) where.totalMinor = { ...(where.totalMinor || {}), gte: minMinor };
    }
    if (maxAmount) {
      const maxMinor = parseInt(maxAmount, 10);
      if (!isNaN(maxMinor)) where.totalMinor = { ...(where.totalMinor || {}), lte: maxMinor };
    }

    if (staffId) {
      where.statusHistory = { some: { changedByStaffId: staffId } };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { items: { some: { dishNameSnapshot: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Sort order
    let orderBy: any = { placedAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { placedAt: 'asc' };
    else if (sortBy === 'amount_high') orderBy = { totalMinor: 'desc' };
    else if (sortBy === 'amount_low') orderBy = { totalMinor: 'asc' };

    const [totalCount, orders, aggregated] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
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
          placedAt: true,
          completedAt: true,
          table: { select: { id: true, name: true, section: true } },
          items: {
            select: {
              quantity: true,
              dishNameSnapshot: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              staff: { select: { displayName: true } },
            },
          },
        },
      }),
      prisma.order.aggregate({
        where,
        _sum: { totalMinor: true },
        _avg: { totalMinor: true },
      }),
    ]);

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
      placedAt: o.placedAt,
      completedAt: o.completedAt,
      tableName: o.table.name,
      tableSection: o.table.section,
      itemCount: o.items.reduce((acc, it) => acc + it.quantity, 0),
      itemsSummary: o.items.map((it) => `${it.quantity}x ${it.dishNameSnapshot}`).join(', '),
      handledBy: o.statusHistory[0]?.staff?.displayName || '—',
    }));

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
      restaurantTheme,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      metrics: {
        totalOrderValueMinor: aggregated._sum.totalMinor || 0,
        averageOrderValueMinor: Math.round(aggregated._avg.totalMinor || 0),
        currency: auth.restaurant.currency,
      },
      orders: formatted,
    });
  } catch (error: any) {
    console.error('Order history GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

