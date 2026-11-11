import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getStartOfDayInTimezone } from '@/lib/analytics/date-window';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      includeSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized || !auth.restaurant) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const now = new Date();
    const timeZone = auth.restaurant.timezone || 'Asia/Kolkata';
    const startOfToday = getStartOfDayInTimezone(timeZone, 0, now);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Consolidated into 6 parallel DB queries (down from 12) via PostgreSQL FILTER aggregates
    const [
      scanSummaryRows,
      aiSummaryRows,
      dishViewsTotal,
      groupedInteractions30Days,
      menuItems,
      orders30DaysRows,
    ] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          total_scans: number;
          scans_today: number;
          scans_30_days: number;
          table_scans_30_days: number;
        }>
      >`
        SELECT
          COUNT(*)::INTEGER AS total_scans,
          COUNT(*) FILTER (WHERE "timestamp" >= ${startOfToday})::INTEGER AS scans_today,
          COUNT(*) FILTER (WHERE "timestamp" >= ${thirtyDaysAgo})::INTEGER AS scans_30_days,
          COUNT(*) FILTER (WHERE "tableId" IS NOT NULL AND "timestamp" >= ${thirtyDaysAgo})::INTEGER AS table_scans_30_days
        FROM "ScanEvent"
        WHERE "restaurantId" = ${restaurantId}
      `,
      prisma.$queryRaw<
        Array<{
          chat_queries_30_days: number;
          chat_queries_total: number;
          image_gen_count: number;
        }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE "operationType"::text = 'DINER_CHAT' AND "createdAt" >= ${thirtyDaysAgo})::INTEGER AS chat_queries_30_days,
          COUNT(*) FILTER (WHERE "operationType"::text = 'DINER_CHAT')::INTEGER AS chat_queries_total,
          COUNT(*) FILTER (WHERE "operationType"::text IN ('IMAGE_GENERATION', 'IMAGE_REGENERATION') AND "createdAt" >= ${thirtyDaysAgo})::INTEGER AS image_gen_count
        FROM "AIUsageEvent"
        WHERE "restaurantId" = ${restaurantId}
      `,
      prisma.dishInteractionEvent.count({
        where: {
          restaurantId,
          eventType: { in: ['VIEW', 'EXPAND'] },
        },
      }),
      prisma.dishInteractionEvent.groupBy({
        by: ['menuItemId', 'eventType'],
        where: {
          restaurantId,
          timestamp: { gte: thirtyDaysAgo },
        },
        _count: { _all: true },
      }),
      prisma.restaurantMenuItem.findMany({
        where: { restaurantId },
        select: {
          id: true,
          customName: true,
          dietaryStatus: true,
          isPopular: true,
          chefRecommended: true,
          isPublished: true,
          category: { select: { name: true } },
        },
      }),
      prisma.order.findMany({
        where: {
          restaurantId,
          placedAt: { gte: thirtyDaysAgo },
          status: { notIn: ['CANCELLED', 'REJECTED'] },
        },
        select: {
          id: true,
          status: true,
          totalMinor: true,
          items: {
            select: {
              restaurantMenuItemId: true,
              dishNameSnapshot: true,
              quantity: true,
            },
          },
        },
      }),
    ]);

    const scanRow = scanSummaryRows[0];
    const totalScans = Number(scanRow?.total_scans ?? 0);
    const scansToday = Number(scanRow?.scans_today ?? 0);
    const scans30Days = Number(scanRow?.scans_30_days ?? 0);
    const tableScans30Days = Number(scanRow?.table_scans_30_days ?? 0);

    const aiRow = aiSummaryRows[0];
    const chatQueries30Days = Number(aiRow?.chat_queries_30_days ?? 0);
    const chatQueriesTotal = Number(aiRow?.chat_queries_total ?? 0);
    const imageGenCount = Number(aiRow?.image_gen_count ?? 0);

    let dishViews30Days = 0;

    // Dietary composition across menu items
    let vegCount = 0;
    let nonVegCount = 0;
    let eggCount = 0;
    let vegetarianOrVeganCount = 0;
    let veganCount = 0;
    let gfCount = 0;
    let dairyFreeCount = 0;

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    for (const item of menuItems) {
      const tags = ((item.dietaryStatus as string[]) || []).map((t) => String(t).toUpperCase());
      const hasVeg = tags.some((t) => ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(t));
      const hasNonVeg = tags.some((t) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(t));
      const hasEgg = tags.some((t) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(t));
      const hasVegan = tags.includes('VEGAN');
      const hasGf = tags.includes('GLUTEN_FREE') || tags.includes('GF');
      const hasDf = tags.includes('DAIRY_FREE') || tags.includes('DF');

      if (hasVeg) vegCount++;
      if (hasNonVeg) nonVegCount++;
      if (hasEgg) eggCount++;
      if (hasVegan) veganCount++;
      if (hasVeg || hasVegan) vegetarianOrVeganCount++;
      if (hasGf) gfCount++;
      if (hasDf) dairyFreeCount++;
    }

    // Aggregate per-dish engagement from real DishInteractionEvent & OrderItem rows (last 30d)
    type DishStat = {
      id: string;
      name: string;
      categoryName: string | null;
      views: number;
      chatQueries: number;
      orders: number;
      interactions: number;
      totalEngagement: number;
      isPopular: boolean;
      chefRecommended: boolean;
    };

    const dishStats = new Map<string, DishStat>();

    const ensureDishStat = (menuItemId: string, fallbackName?: string): DishStat | null => {
      const existing = dishStats.get(menuItemId);
      if (existing) return existing;
      const item = menuItemMap.get(menuItemId);
      if (!item && !fallbackName) return null;
      const entry: DishStat = {
        id: menuItemId,
        name: item?.customName || fallbackName || 'Removed Dish',
        categoryName: item?.category?.name || null,
        views: 0,
        chatQueries: 0,
        orders: 0,
        interactions: 0,
        totalEngagement: 0,
        isPopular: Boolean(item?.isPopular),
        chefRecommended: Boolean(item?.chefRecommended),
      };
      dishStats.set(menuItemId, entry);
      return entry;
    };

    for (const row of groupedInteractions30Days) {
      const count = row._count._all;
      if (row.eventType === 'VIEW' || row.eventType === 'EXPAND') {
        dishViews30Days += count;
      }
      const stat = ensureDishStat(row.menuItemId);
      if (!stat) continue;
      if (row.eventType === 'VIEW' || row.eventType === 'EXPAND') {
        stat.views += count;
      } else {
        stat.chatQueries += count;
      }
      stat.interactions += count;
      stat.totalEngagement += count;
    }

    let totalOrderedQty30Days = 0;
    let featuredOrderedQty30Days = 0;
    let completedOrders30Days = 0;
    let revenueMinor30Days = 0;

    for (const order of orders30DaysRows) {
      revenueMinor30Days += order.totalMinor;
      if (order.status === 'SERVED' || order.status === 'COMPLETED') {
        completedOrders30Days++;
      }

      for (const orderItem of order.items) {
        totalOrderedQty30Days += orderItem.quantity;
        const linkedItem = orderItem.restaurantMenuItemId
          ? menuItemMap.get(orderItem.restaurantMenuItemId)
          : undefined;
        if (linkedItem && (linkedItem.isPopular || linkedItem.chefRecommended)) {
          featuredOrderedQty30Days += orderItem.quantity;
        }

        const key = orderItem.restaurantMenuItemId || `snapshot:${orderItem.dishNameSnapshot}`;
        const stat = ensureDishStat(key, orderItem.dishNameSnapshot);
        if (stat) {
          stat.orders += orderItem.quantity;
          stat.totalEngagement += orderItem.quantity;
        }
      }
    }

    const topDishes = Array.from(dishStats.values())
      .filter((d) => d.totalEngagement > 0)
      .sort((a, b) => {
        if (b.totalEngagement !== a.totalEngagement) return b.totalEngagement - a.totalEngagement;
        if (b.orders !== a.orders) return b.orders - a.orders;
        if (b.chatQueries !== a.chatQueries) return b.chatQueries - a.chatQueries;
        return b.views - a.views;
      })
      .slice(0, 8);

    const orders30Days = orders30DaysRows.length;
    const scanToOrderRatePercent =
      scans30Days > 0 ? Math.min(100, Math.round((orders30Days / scans30Days) * 1000) / 10) : 0;
    const bestsellerSharePercent =
      totalOrderedQty30Days > 0
        ? Math.round((featuredOrderedQty30Days / totalOrderedQty30Days) * 100)
        : null;
    const viewsPerScan30Days =
      scans30Days > 0 && dishViews30Days > 0
        ? Math.round((dishViews30Days / scans30Days) * 10) / 10
        : null;

    return NextResponse.json(
      {
        success: true,
        currency: auth.restaurant.currency,
        windowDays: 30,
        generatedAt: now.toISOString(),
        scans: {
          total: totalScans,
          today: scansToday,
          last30Days: scans30Days,
          tableScans30Days,
        },
        aiUsage: {
          chatQueries30Days,
          chatQueriesTotal,
          imageGenCount,
        },
        dishViews: {
          total: dishViewsTotal,
          last30Days: dishViews30Days,
          viewsPerScan30Days,
        },
        orders: {
          total30Days: orders30Days,
          completed30Days: completedOrders30Days,
          revenueMinor30Days,
          scanToOrderRatePercent,
          bestsellerSharePercent,
        },
        dietary: {
          totalItems: menuItems.length,
          veg: vegCount,
          nonVeg: nonVegCount,
          egg: eggCount,
          vegetarianOrVegan: vegetarianOrVeganCount,
          vegan: veganCount,
          glutenFree: gfCount,
          dairyFree: dairyFreeCount,
        },
        topDishes,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Restaurant analytics GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
