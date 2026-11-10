import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import {
  getHourInTimezone,
  getStartOfDayInTimezone,
  getStartOfMonthInTimezone,
} from '@/lib/analytics/date-window';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ANALYTICS');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const now = new Date();
    const timeZone = auth.restaurant.timezone || 'Asia/Kolkata';
    const startOfToday = getStartOfDayInTimezone(timeZone, 0, now);
    const startOfWeek = getStartOfDayInTimezone(timeZone, 6, now);
    const startOfMonth = getStartOfMonthInTimezone(timeZone, now);

    const [todayCount, weekCount, monthCount, allOrders] = await Promise.all([
      prisma.order.count({
        where: { restaurantId: auth.restaurant.id, placedAt: { gte: startOfToday } },
      }),
      prisma.order.count({
        where: { restaurantId: auth.restaurant.id, placedAt: { gte: startOfWeek } },
      }),
      prisma.order.count({
        where: { restaurantId: auth.restaurant.id, placedAt: { gte: startOfMonth } },
      }),
      prisma.order.findMany({
        where: { restaurantId: auth.restaurant.id },
        select: {
          id: true,
          status: true,
          totalMinor: true,
          paymentStatus: true,
          placedAt: true,
          tableId: true,
          table: { select: { name: true } },
          items: {
            select: { dishNameSnapshot: true, quantity: true },
          },
        },
      }),
    ]);

    const totalOrdersCount = allOrders.length;
    let totalRecordedValueMinor = 0;
    let completedOrderValueMinor = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let rejectedCount = 0;

    const dishCounts = new Map<string, number>();
    const tableCounts = new Map<string, { name: string; count: number }>();
    const hourlyCounts = new Array(24).fill(0);

    for (const order of allOrders) {
      totalRecordedValueMinor += order.totalMinor;

      if (order.status === 'COMPLETED' || order.status === 'SERVED') {
        completedCount++;
        completedOrderValueMinor += order.totalMinor;
      } else if (order.status === 'CANCELLED') {
        cancelledCount++;
      } else if (order.status === 'REJECTED') {
        rejectedCount++;
      }

      // Hour bucket in restaurant local timezone (0-23)
      const hour = getHourInTimezone(new Date(order.placedAt), timeZone);
      hourlyCounts[hour]++;

      // Table bucket
      const tblName = order.table?.name || 'Table';
      const currentTbl = tableCounts.get(tblName) || { name: tblName, count: 0 };
      currentTbl.count++;
      tableCounts.set(tblName, currentTbl);

      // Dishes bucket
      for (const item of order.items) {
        dishCounts.set(
          item.dishNameSnapshot,
          (dishCounts.get(item.dishNameSnapshot) || 0) + item.quantity
        );
      }
    }

    const activeOrdersCount = allOrders.filter((o) =>
      ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
    ).length;
    const nonCancelledOrdersCount = Math.max(0, totalOrdersCount - cancelledCount - rejectedCount);
    const activeOrderValueMinor = allOrders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((acc, o) => acc + o.totalMinor, 0);
    const aovMinor =
      nonCancelledOrdersCount > 0 ? Math.round(activeOrderValueMinor / nonCancelledOrdersCount) : 0;
    const cancelledOrdersCount = cancelledCount + rejectedCount;
    const cancellationRatePercent =
      totalOrdersCount > 0
        ? Math.round((cancelledOrdersCount / totalOrdersCount) * 1000) / 10
        : 0;

    // Top 5 dishes
    const topDishes = Array.from(dishCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Orders per table sorted
    const ordersPerTable = Array.from(tableCounts.values()).sort((a, b) => b.count - a.count);

    // Busiest hours formatted
    const busiestHours = hourlyCounts.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      count,
    }));

    return NextResponse.json({
      currency: auth.restaurant.currency,
      summary: {
        ordersToday: todayCount,
        ordersThisWeek: weekCount,
        ordersThisMonth: monthCount,
        totalOrdersCount,
        activeOrdersCount,
        completedOrdersCount: completedCount,
        cancelledOrdersCount,
        totalRecordedValueMinor,
        completedOrderValueMinor,
        averageOrderValueMinor: aovMinor,
        cancellationRatePercent,
      },
      topDishes,
      ordersPerTable,
      busiestHours,
    });
  } catch (error: any) {
    console.error('Order analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
