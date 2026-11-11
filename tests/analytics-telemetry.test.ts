import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';
import prisma from '../src/lib/db/prisma';
import * as ownerAuth from '../src/lib/auth/owner-auth';
import * as tenantVerify from '../src/lib/auth/tenant-verify';
import {
  evaluateOrganizationAccess,
  provisionTrialSubscriptionWithinTx,
} from '../src/lib/billing/subscription-access';
import {
  getHourInTimezone,
  getStartOfDayInTimezone,
  getStartOfMonthInTimezone,
} from '../src/lib/analytics/date-window';
import { POST as postDishInteraction } from '../src/app/api/diner/interactions/route';
import { GET as getRestaurantAnalytics } from '../src/app/api/restaurant/analytics/route';
import { GET as getOrderAnalytics } from '../src/app/api/restaurants/[id]/orders/analytics/route';

describe('Real Analytics & Dish Interaction Telemetry Pipeline', () => {
  const createdOrgIds: string[] = [];
  const createdRestaurantIds: string[] = [];
  const createdUserIds: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    for (const restaurantId of createdRestaurantIds) {
      await prisma.order.deleteMany({ where: { restaurantId } }).catch(() => {});
      await prisma.restaurant.delete({ where: { id: restaurantId } }).catch(() => {});
    }
    for (const orgId of createdOrgIds) {
      await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    }
    for (const userId of createdUserIds) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it('computes start-of-day, start-of-month, and local hour accurately in Asia/Kolkata', () => {
    // 2026-11-10T20:00:00Z is 2026-11-11 01:30:00 IST (+05:30)
    const sampleUtc = new Date('2026-11-10T20:00:00.000Z');
    const startOfTodayIst = getStartOfDayInTimezone('Asia/Kolkata', 0, sampleUtc);
    // 2026-11-11 00:00:00 IST == 2026-11-10T18:30:00Z
    expect(startOfTodayIst.toISOString()).toBe('2026-11-10T18:30:00.000Z');

    const startOfMonthIst = getStartOfMonthInTimezone('Asia/Kolkata', sampleUtc);
    // 2026-11-01 00:00:00 IST == 2026-10-31T18:30:00Z
    expect(startOfMonthIst.toISOString()).toBe('2026-10-31T18:30:00.000Z');

    expect(getHourInTimezone(sampleUtc, 'Asia/Kolkata')).toBe(1);
    expect(getHourInTimezone(sampleUtc, 'UTC')).toBe(20);
  });

  it('returns real zero-states for a new restaurant and increments accurately from DB events', async () => {
    const suffix = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `analytics-test-${suffix}@menzy.local`,
        name: 'Analytics Verifier',
      },
    });
    createdUserIds.push(user.id);
    const org = await prisma.organization.create({
      data: {
        name: `Analytics Test Org ${suffix}`,
        ownerUserId: user.id,
        billingCountry: 'IN',
        billingCurrency: 'INR',
      },
    });
    createdOrgIds.push(org.id);

    await provisionTrialSubscriptionWithinTx(prisma, {
      organizationId: org.id,
      currency: 'INR',
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        organizationId: org.id,
        slug: `analytics-test-${suffix}`,
        displayName: 'Analytics Test Kitchen',
        country: 'IN',
        city: 'Pune',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });
    createdRestaurantIds.push(restaurant.id);

    const activeTrialAccess = evaluateOrganizationAccess({
      organizationId: org.id,
      isClaimed: true,
      subscription: {
        planKey: 'FREE_TRIAL',
        status: 'TRIAL',
        provider: 'TRIAL',
        billingPeriod: 'TRIAL_14D',
        paidThrough: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    vi.spyOn(ownerAuth, 'requireRestaurantAccess').mockResolvedValue({
      authorized: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        organizations: [{ id: org.id, name: org.name, role: 'OWNER' }],
      },
      restaurant,
      access: activeTrialAccess,
    });

    vi.spyOn(tenantVerify, 'verifyStaffOrOwnerAccess').mockResolvedValue({
      authorized: true,
      actorType: 'OWNER',
      role: 'OWNER',
      actorId: user.id,
      actorName: user.name || user.email,
      access: activeTrialAccess,
      restaurant: {
        ...restaurant,
        theme: null,
        organization: org,
        orderingSettings: null,
      },
    });

    // 1. Empty restaurant must return genuine zeros and empty arrays (no dummy 142/84%/45)
    const emptyRes = await getRestaurantAnalytics(
      new Request(`http://localhost/api/restaurant/analytics?restaurantId=${restaurant.id}`)
    );
    expect(emptyRes.status).toBe(200);
    const emptyJson = await emptyRes.json();

    expect(emptyJson.success).toBe(true);
    expect(emptyJson.scans.total).toBe(0);
    expect(emptyJson.scans.today).toBe(0);
    expect(emptyJson.scans.last30Days).toBe(0);
    expect(emptyJson.aiUsage.chatQueries30Days).toBe(0);
    expect(emptyJson.dishViews.last30Days).toBe(0);
    expect(emptyJson.dishViews.viewsPerScan30Days).toBeNull();
    expect(emptyJson.orders.total30Days).toBe(0);
    expect(emptyJson.orders.bestsellerSharePercent).toBeNull();
    expect(emptyJson.dietary.totalItems).toBe(0);
    expect(emptyJson.topDishes).toEqual([]);

    // 2. Seed real menu items, table, diner session, scan, interactions, AI usage & order
    const menu = await prisma.menu.create({
      data: { restaurantId: restaurant.id, title: 'Main Menu' },
    });
    const category = await prisma.menuCategory.create({
      data: { menuId: menu.id, name: 'Small Plates', sortOrder: 1 },
    });
    const vegDish = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: restaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        customName: 'Paneer Tikka',
        priceMinor: 32000,
        currency: 'INR',
        dietaryStatus: ['VEG'],
        isPopular: true,
        isPublished: true,
        isAvailable: true,
      },
    });
    const nonVegDish = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: restaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        customName: 'Tandoori Chicken',
        priceMinor: 38000,
        currency: 'INR',
        dietaryStatus: ['NON_VEG'],
        isPublished: true,
        isAvailable: true,
      },
    });

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Table T-1',
        qrTokenHash: `hash_${suffix}`,
      },
    });

    const dinerSession = await prisma.dinerSession.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        sessionToken: `ds_analytics_${suffix}`,
      },
    });

    await prisma.scanEvent.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        sessionToken: dinerSession.sessionToken,
      },
    });

    // Reject forged cross-tenant interaction and ignore owner test session
    const badInteraction = await postDishInteraction(
      new Request('http://localhost/api/diner/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: 'wrong-restaurant-id',
          menuItemId: vegDish.id,
          eventType: 'EXPAND',
        }),
      })
    );
    expect(badInteraction.status).toBe(404);

    const ownerIgnored = await postDishInteraction(
      new Request('http://localhost/api/diner/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          menuItemId: vegDish.id,
          eventType: 'EXPAND',
          sessionToken: 'owner-test-session',
        }),
      })
    );
    expect(ownerIgnored.status).toBe(200);
    expect((await ownerIgnored.json()).ignored).toBe(true);

    // Record real EXPAND dish view via API
    const realExpand = await postDishInteraction(
      new Request('http://localhost/api/diner/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          menuItemId: vegDish.id,
          eventType: 'EXPAND',
          sessionToken: dinerSession.sessionToken,
        }),
      })
    );
    expect(realExpand.status).toBe(200);

    // Also record 1 CHAT_QUERY + 1 AIUsageEvent + 1 COMPLETED Order
    await prisma.dishInteractionEvent.create({
      data: {
        restaurantId: restaurant.id,
        menuItemId: vegDish.id,
        eventType: 'CHAT_QUERY',
        sessionId: dinerSession.id,
      },
    });

    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: restaurant.id,
        operationType: 'DINER_CHAT',
        modelId: 'gemini-3-flash-preview',
        inputTokens: 400,
        outputTokens: 120,
        estimatedCostUsd: 0.0002,
      },
    });

    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        dinerSessionId: dinerSession.id,
        orderNumber: '0001',
        status: 'COMPLETED',
        currency: 'INR',
        subtotalMinor: 64000,
        taxMinor: 3200,
        totalMinor: 67200,
        items: {
          create: [
            {
              restaurantMenuItemId: vegDish.id,
              dishNameSnapshot: vegDish.customName,
              quantity: 2,
              unitPriceMinor: 32000,
              lineTotalMinor: 64000,
            },
          ],
        },
      },
    });

    // 3. Re-query Restaurant Analytics -> exact real telemetry
    const liveRes = await getRestaurantAnalytics(
      new Request(`http://localhost/api/restaurant/analytics?restaurantId=${restaurant.id}`)
    );
    expect(liveRes.status).toBe(200);
    const liveJson = await liveRes.json();

    expect(liveJson.scans.total).toBe(1);
    expect(liveJson.scans.today).toBe(1);
    expect(liveJson.aiUsage.chatQueries30Days).toBe(1);
    expect(liveJson.dishViews.last30Days).toBe(1);
    expect(liveJson.dishViews.viewsPerScan30Days).toBe(1);
    expect(liveJson.orders.total30Days).toBe(1);
    expect(liveJson.orders.completed30Days).toBe(1);
    expect(liveJson.orders.revenueMinor30Days).toBe(67200);
    expect(liveJson.orders.scanToOrderRatePercent).toBe(100);
    expect(liveJson.orders.bestsellerSharePercent).toBe(100);
    expect(liveJson.dietary).toMatchObject({
      totalItems: 2,
      veg: 1,
      nonVeg: 1,
      egg: 0,
    });
    expect(liveJson.topDishes).toHaveLength(1);
    expect(liveJson.topDishes[0]).toMatchObject({
      id: vegDish.id,
      name: 'Paneer Tikka',
      views: 1,
      chatQueries: 1,
      orders: 2,
      totalEngagement: 4,
    });

    // 4. Verify Ordering Analytics returns aligned keys expected by OrdersManagementView
    const ordRes = await getOrderAnalytics(
      new Request(`http://localhost/api/restaurants/${restaurant.id}/orders/analytics`),
      { params: Promise.resolve({ id: restaurant.id }) }
    );
    expect(ordRes.status).toBe(200);
    const ordJson = await ordRes.json();

    expect(ordJson.summary).toMatchObject({
      ordersToday: 1,
      ordersThisWeek: 1,
      ordersThisMonth: 1,
      totalOrdersCount: 1,
      activeOrdersCount: 0,
      completedOrdersCount: 1,
      cancelledOrdersCount: 0,
      completedOrderValueMinor: 67200,
      averageOrderValueMinor: 67200,
      cancellationRatePercent: 0,
    });
    expect(ordJson.topDishes).toEqual([{ name: 'Paneer Tikka', count: 2 }]);
    expect(ordJson.ordersPerTable).toEqual([{ name: 'Table T-1', count: 1 }]);

    // Cleanup handled in afterAll
  }, 30000);
});
