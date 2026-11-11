import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import {
  getStartOfDayInTimezone,
  getStartOfMonthInTimezone,
} from '@/lib/analytics/date-window';

function resolveValidTimeZone(raw?: string | null): string {
  const candidate = (raw || '').trim() || 'Asia/Kolkata';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return 'Asia/Kolkata';
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ANALYTICS', { includeDetails: false });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const now = new Date();
    const timeZone = resolveValidTimeZone(auth.restaurant.timezone);
    const startOfToday = getStartOfDayInTimezone(timeZone, 0, now);
    const startOfWeek = getStartOfDayInTimezone(timeZone, 6, now);
    const startOfMonth = getStartOfMonthInTimezone(timeZone, now);
    const restaurantId = auth.restaurant.id;

    // 4 bounded SQL aggregation queries instead of streaming full order history into JS
    const [summaryRows, hourlyRows, tableRows, topDishRows] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          today_count: number;
          week_count: number;
          month_count: number;
          total_orders_count: number;
          active_orders_count: number;
          completed_count: number;
          cancelled_count: number;
          rejected_count: number;
          total_recorded_value_minor: number;
          completed_order_value_minor: number;
          active_order_value_minor: number;
        }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE "placedAt" >= ${startOfToday})::INTEGER AS today_count,
          COUNT(*) FILTER (WHERE "placedAt" >= ${startOfWeek})::INTEGER AS week_count,
          COUNT(*) FILTER (WHERE "placedAt" >= ${startOfMonth})::INTEGER AS month_count,
          COUNT(*)::INTEGER AS total_orders_count,
          COUNT(*) FILTER (WHERE "status"::text IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY'))::INTEGER AS active_orders_count,
          COUNT(*) FILTER (WHERE "status"::text IN ('COMPLETED', 'SERVED'))::INTEGER AS completed_count,
          COUNT(*) FILTER (WHERE "status"::text = 'CANCELLED')::INTEGER AS cancelled_count,
          COUNT(*) FILTER (WHERE "status"::text = 'REJECTED')::INTEGER AS rejected_count,
          COALESCE(SUM("totalMinor"), 0)::DOUBLE PRECISION AS total_recorded_value_minor,
          COALESCE(SUM("totalMinor") FILTER (WHERE "status"::text IN ('COMPLETED', 'SERVED')), 0)::DOUBLE PRECISION AS completed_order_value_minor,
          COALESCE(SUM("totalMinor") FILTER (WHERE "status"::text NOT IN ('CANCELLED', 'REJECTED')), 0)::DOUBLE PRECISION AS active_order_value_minor
        FROM "Order"
        WHERE "restaurantId" = ${restaurantId}
      `,
      prisma.$queryRaw<Array<{ hr: number; cnt: number }>>`
        SELECT
          EXTRACT(HOUR FROM ("placedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone})::INTEGER AS hr,
          COUNT(*)::INTEGER AS cnt
        FROM "Order"
        WHERE "restaurantId" = ${restaurantId}
        GROUP BY 1
      `,
      prisma.$queryRaw<Array<{ name: string; count: number }>>`
        SELECT
          COALESCE(t."name", 'Table') AS name,
          COUNT(*)::INTEGER AS count
        FROM "Order" o
        LEFT JOIN "RestaurantTable" t ON t."id" = o."tableId"
        WHERE o."restaurantId" = ${restaurantId}
        GROUP BY 1
        ORDER BY count DESC
      `,
      prisma.$queryRaw<Array<{ name: string; count: number }>>`
        SELECT
          oi."dishNameSnapshot" AS name,
          COALESCE(SUM(oi."quantity"), 0)::INTEGER AS count
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON o."id" = oi."orderId"
        WHERE o."restaurantId" = ${restaurantId}
        GROUP BY oi."dishNameSnapshot"
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

    const s = summaryRows[0];
    const todayCount = Number(s?.today_count ?? 0);
    const weekCount = Number(s?.week_count ?? 0);
    const monthCount = Number(s?.month_count ?? 0);
    const totalOrdersCount = Number(s?.total_orders_count ?? 0);
    const activeOrdersCount = Number(s?.active_orders_count ?? 0);
    const completedCount = Number(s?.completed_count ?? 0);
    const cancelledCount = Number(s?.cancelled_count ?? 0);
    const rejectedCount = Number(s?.rejected_count ?? 0);
    const totalRecordedValueMinor = Math.round(Number(s?.total_recorded_value_minor ?? 0));
    const completedOrderValueMinor = Math.round(Number(s?.completed_order_value_minor ?? 0));
    const activeOrderValueMinor = Math.round(Number(s?.active_order_value_minor ?? 0));

    const nonCancelledOrdersCount = Math.max(0, totalOrdersCount - cancelledCount - rejectedCount);
    const aovMinor =
      nonCancelledOrdersCount > 0 ? Math.round(activeOrderValueMinor / nonCancelledOrdersCount) : 0;
    const cancelledOrdersCount = cancelledCount + rejectedCount;
    const cancellationRatePercent =
      totalOrdersCount > 0
        ? Math.round((cancelledOrdersCount / totalOrdersCount) * 1000) / 10
        : 0;

    const hourlyCounts = new Array(24).fill(0);
    for (const row of hourlyRows) {
      const hr = Number(row.hr);
      if (Number.isInteger(hr) && hr >= 0 && hr < 24) {
        hourlyCounts[hr] = Number(row.cnt || 0);
      }
    }

    const topDishes = topDishRows.map((row) => ({
      name: row.name,
      count: Number(row.count || 0),
    }));

    const ordersPerTable = tableRows.map((row) => ({
      name: row.name,
      count: Number(row.count || 0),
    }));

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
