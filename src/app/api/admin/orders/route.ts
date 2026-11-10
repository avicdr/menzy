import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession } from '@/lib/auth/admin-auth';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized founder access' }, { status: 401 });
    }

    const [
      totalOrders,
      totalTables,
      totalStaff,
      statusCounts,
      recentOrders,
      ordersAgg,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.restaurantTable.count({ where: { isArchived: false } }),
      prisma.restaurantStaff.count({ where: { isActive: true } }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.order.findMany({
        take: 20,
        orderBy: { placedAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalMinor: true,
          currency: true,
          placedAt: true,
          restaurant: {
            select: { id: true, displayName: true, slug: true, city: true, country: true },
          },
          table: {
            select: { name: true, section: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.aggregate({
        _sum: {
          totalMinor: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusMap[item.status] = item._count.status;
    }

    const activeOrdersCount =
      (statusMap['PENDING'] || 0) +
      (statusMap['CONFIRMED'] || 0) +
      (statusMap['PREPARING'] || 0) +
      (statusMap['READY'] || 0);

    return NextResponse.json({
      metrics: {
        totalOrders,
        activeOrdersCount,
        totalTables,
        totalStaff,
        grossVolumeMinor: ordersAgg._sum.totalMinor || 0,
        statusBreakdown: statusMap,
      },
      recentOrders,
    });
  } catch (error: any) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

