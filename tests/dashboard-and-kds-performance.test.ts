import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { OrderStatus, StaffRole, SubscriptionStatus } from '@prisma/client';

let mockAdminCookieValue: string | undefined;
let mockOwnerCookieValue: string | undefined;
let mockStaffCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'dishora_admin_session' && mockAdminCookieValue) {
        return { value: mockAdminCookieValue };
      }
      if (name === 'dishora_owner_session' && mockOwnerCookieValue) {
        return { value: mockOwnerCookieValue };
      }
      if (name === 'dishora_staff_session' && mockStaffCookieValue) {
        return { value: mockStaffCookieValue };
      }
      return undefined;
    },
    set: () => { },
    delete: () => { },
  }),
}));
import { createAdminToken } from '../src/lib/auth/admin-auth';
import { createOwnerToken } from '../src/lib/auth/owner-auth';
import { generateStaffSessionToken, hashToken, hashStaffPassword } from '../src/lib/auth/staff-auth';
import { verifyStaffOrOwnerAccess } from '../src/lib/auth/tenant-verify';
import {
  calculateAllRestaurantCosts,
  calculateRestaurantCosts,
} from '../src/lib/analytics/cost-calculator';
import { updateOrderStatus } from '../src/lib/orders/order-service';
import {
  createServiceCall,
  getActiveServiceCalls,
} from '../src/lib/tables/service-call-service';
import { GET as adminCostsGet } from '../src/app/api/admin/costs/route';
import { GET as adminRestaurantsGet } from '../src/app/api/admin/restaurants/route';
import { GET as adminSubscriptionsGet } from '../src/app/api/admin/subscriptions/route';
import { GET as adminCanonicalGet } from '../src/app/api/admin/canonical/route';
import { GET as ownerMeGet } from '../src/app/api/auth/me/route';
import { GET as restaurantSettingsGet } from '../src/app/api/restaurant/settings/route';
import { GET as billingUsageGet } from '../src/app/api/billing/usage/route';
import { PATCH as orderStatusPatch } from '../src/app/api/restaurants/[id]/orders/[orderId]/status/route';
import {
  GET as serviceCallsGet,
  PATCH as serviceCallsPatch,
} from '../src/app/api/restaurants/[id]/service-calls/route';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';
import { getCache } from '../src/lib/cache/redis';

describe('Dashboard, Founder Portal & KDS Action Performance Contracts', () => {
  const createdOrderIds: string[] = [];
  const createdAiEventIds: string[] = [];
  const createdCanonicalIds: string[] = [];
  const createdServiceCallIds: string[] = [];
  const createdRestaurantSlugs: string[] = [];
  const createdRestaurantIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdPlanKeys: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    mockAdminCookieValue = undefined;
    mockOwnerCookieValue = undefined;
    mockStaffCookieValue = undefined;

    if (createdRestaurantSlugs.length > 0) {
      const cache = getCache();
      await Promise.all(
        createdRestaurantSlugs.splice(0, createdRestaurantSlugs.length).map((s) =>
          cache.del(`menu:slug:${s}`).catch(() => {})
        )
      );
    }

    if (createdServiceCallIds.length > 0) {
      const ids = createdServiceCallIds.splice(0, createdServiceCallIds.length);
      for (const id of ids) {
        await prisma.$executeRawUnsafe(`DELETE FROM "TableServiceCall" WHERE "id" = $1`, id).catch(() => { });
      }
    }
    if (createdOrderIds.length > 0) {
      await prisma.order
        .deleteMany({ where: { id: { in: createdOrderIds.splice(0, createdOrderIds.length) } } })
        .catch(() => { });
    }
    if (createdAiEventIds.length > 0) {
      await prisma.aIUsageEvent
        .deleteMany({ where: { id: { in: createdAiEventIds.splice(0, createdAiEventIds.length) } } })
        .catch(() => { });
    }
    if (createdRestaurantIds.length > 0) {
      const rIds = createdRestaurantIds.splice(0, createdRestaurantIds.length);
      await prisma.order.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => { });
      await prisma.restaurant.deleteMany({ where: { id: { in: rIds } } }).catch(() => { });
    }
    if (createdCanonicalIds.length > 0) {
      await prisma.canonicalDish
        .deleteMany({ where: { id: { in: createdCanonicalIds.splice(0, createdCanonicalIds.length) } } })
        .catch(() => { });
    }
    if (createdOrgIds.length > 0) {
      await prisma.organization
        .deleteMany({ where: { id: { in: createdOrgIds.splice(0, createdOrgIds.length) } } })
        .catch(() => { });
    }
    if (createdUserIds.length > 0) {
      await prisma.user
        .deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } })
        .catch(() => { });
    }
    if (createdPlanKeys.length > 0) {
      await prisma.plan
        .deleteMany({ where: { key: { in: createdPlanKeys.splice(0, createdPlanKeys.length) } } })
        .catch(() => { });
    }
  });

  async function seedTenantFixture(options?: {
    withSubscription?: boolean;
    country?: 'IN' | 'US';
    planKey?: 'IN_GROWTH' | 'US_PRO';
    passwordHash?: string;
  }) {
    const suffix = crypto.randomBytes(4).toString('hex');
    const country = options?.country ?? 'IN';
    const currency = country === 'US' ? 'USD' : 'INR';
    const planKey = options?.planKey ?? (country === 'US' ? 'US_PRO' : 'IN_GROWTH');

    const user = await prisma.user.create({
      data: {
        email: `perf-owner-${suffix}@menzy.local`,
        name: `Perf Owner ${suffix}`,
        passwordHash: options?.passwordHash ?? 'hashed_secret_sentinel_owner_999',
      },
    });
    createdUserIds.push(user.id);

    const org = await prisma.organization.create({
      data: {
        name: `Perf Org ${suffix}`,
        ownerUserId: user.id,
        billingCountry: country,
        billingCurrency: currency,
      },
    });
    createdOrgIds.push(org.id);

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        organizationId: org.id,
        slug: `perf-rest-${suffix}`,
        displayName: `Perf Kitchen ${suffix}`,
        country,
        city: country === 'US' ? 'Austin' : 'Bengaluru',
        currency,
        timezone: country === 'US' ? 'America/Chicago' : 'Asia/Kolkata',
      },
    });
    createdRestaurantIds.push(restaurant.id);
    createdRestaurantSlugs.push(restaurant.slug);

    await prisma.restaurantTheme.create({
      data: {
        restaurantId: restaurant.id,
        presetKey: 'WARM_EDITORIAL',
        backgroundColor: '#FAF7F2',
        surfaceColor: '#FFFFFF',
        primaryTextColor: '#2B231D',
        secondaryTextColor: '#7C695C',
        accentColor: '#C86A4B',
        secondaryAccentColor: '#7A9175',
        headingFont: 'Plus Jakarta Sans',
        bodyFont: 'Inter',
        layoutMode: 'GRID',
      },
    });

    await prisma.restaurantSettings.create({
      data: {
        restaurantId: restaurant.id,
        welcomeMessage: 'Fast dashboard test welcome!',
        aiTone: 'Warm Editorial & Helpful',
        allowDinerChat: true,
        allowPairings: true,
        maxDinerChatPerSession: 20,
      },
    });

    if (options?.withSubscription) {
      const existingPlan = await prisma.plan.findUnique({ where: { key: planKey } });
      if (!existingPlan) {
        await prisma.plan.create({
          data:
            planKey === 'US_PRO'
              ? {
                key: 'US_PRO',
                tier: 'PRO',
                name: 'Pro',
                country: 'US',
                currency: 'USD',
                priceMinor: 11900,
                itemLimit: 1000,
                imageCreditsMonthly: 200,
                aiQuestionsMonthly: 15000,
              }
              : {
                key: 'IN_GROWTH',
                tier: 'GROWTH',
                name: 'Growth',
                country: 'IN',
                currency: 'INR',
                priceMinor: 179900,
                itemLimit: 250,
                imageCreditsMonthly: 50,
                aiQuestionsMonthly: 5000,
              },
        });
        createdPlanKeys.push(planKey);
      }

      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          planKey,
          status: SubscriptionStatus.ACTIVE,
          currency,
          billingPeriod: 'MONTHLY',
          paidThrough: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { suffix, user, org, restaurant };
  }

  it('computes founder cost intelligence in bulk with exact parity to single-restaurant calculations', async () => {
    const inFixture = await seedTenantFixture({ withSubscription: true, country: 'IN' });
    const usFixture = await seedTenantFixture({ withSubscription: true, country: 'US' });

    const canonical = await prisma.canonicalDish.create({
      data: {
        normalizedName: `perf canonical dosa ${inFixture.suffix}`,
        cuisine: 'South Indian',
        generalizedDescription: 'Crispy fermented crepe.',
        aliases: [`perf dosa ${inFixture.suffix}`],
      },
    });
    createdCanonicalIds.push(canonical.id);

    const menu = await prisma.menu.create({
      data: { restaurantId: inFixture.restaurant.id, title: 'Main Menu', active: true },
    });
    const category = await prisma.menuCategory.create({
      data: { menuId: menu.id, name: 'Specials', sortOrder: 1 },
    });
    await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: inFixture.restaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        canonicalId: canonical.id,
        customName: 'Masala Dosa',
        priceMinor: 18000,
        currency: 'INR',
        imageOverrideAssetId: null,
      },
    });

    const inAiEvent = await prisma.aIUsageEvent.create({
      data: {
        restaurantId: inFixture.restaurant.id,
        operationType: 'DINER_CHAT',
        modelId: 'gemini-2.5-flash',
        inputTokens: 1200,
        outputTokens: 350,
        imageCount: 0,
        estimatedCostUsd: 0.0145,
        status: 'SUCCESS',
      },
    });
    const usAiEvent = await prisma.aIUsageEvent.create({
      data: {
        restaurantId: usFixture.restaurant.id,
        operationType: 'IMAGE_GENERATION',
        modelId: 'gemini-2.5-flash-image',
        inputTokens: 400,
        outputTokens: 100,
        imageCount: 2,
        estimatedCostUsd: 0.062,
        status: 'SUCCESS',
      },
    });
    createdAiEventIds.push(inAiEvent.id, usAiEvent.id);

    // Unauthorized request must return 401 before returning cost metrics
    const unauthRes = await adminCostsGet();
    expect(unauthRes.status).toBe(401);

    const [bulkResult, inSingle, usSingle] = await Promise.all([
      calculateAllRestaurantCosts(),
      calculateRestaurantCosts(inFixture.restaurant.id),
      calculateRestaurantCosts(usFixture.restaurant.id),
    ]);

    const matchedIn = bulkResult.restaurants.find((r) => r.restaurantId === inFixture.restaurant.id);
    const matchedUs = bulkResult.restaurants.find((r) => r.restaurantId === usFixture.restaurant.id);

    expect(matchedIn).toEqual(inSingle);
    expect(matchedUs).toEqual(usSingle);
    expect(matchedIn?.totalAiRequests).toBe(1);
    expect(matchedIn?.canonicalReuses).toBe(1);
    expect(matchedUs?.imagesGenerated).toBe(2);
    expect(bulkResult.global.totalAiRequests).toBeGreaterThanOrEqual(2);
    expect(bulkResult.global.totalImages).toBeGreaterThanOrEqual(2);

    mockAdminCookieValue = createAdminToken('founder@menzy.app');
    const apiRes = await adminCostsGet();
    expect(apiRes.status).toBe(200);
    const apiBody = await apiRes.json();
    expect(apiBody.restaurants.find((r: any) => r.restaurantId === inFixture.restaurant.id)).toEqual(
      inSingle
    );
    expect(apiBody.restaurants.find((r: any) => r.restaurantId === usFixture.restaurant.id)).toEqual(
      usSingle
    );
  });

  it('returns slim founder payloads without leaking passwordHash or member/asset bloat', async () => {
    const secretSentinel = 'password_hash_sentinel_do_not_expose_8842';
    const { suffix, restaurant } = await seedTenantFixture({
      withSubscription: true,
      passwordHash: secretSentinel,
    });

    const canonical = await prisma.canonicalDish.create({
      data: {
        normalizedName: `perf truffle pasta ${suffix}`,
        cuisine: 'Italian',
        generalizedDescription: 'Silky pasta with truffle butter.',
        aliases: [`truffle fettuccine ${suffix}`],
      },
    });
    createdCanonicalIds.push(canonical.id);

    mockAdminCookieValue = createAdminToken('founder@menzy.app');

    const [restRes, subRes, canRes] = await Promise.all([
      adminRestaurantsGet(),
      adminSubscriptionsGet(
        new Request('http://localhost/api/admin/subscriptions?filter=renewing_7d')
      ),
      adminCanonicalGet(),
    ]);

    expect(restRes.status).toBe(200);
    expect(subRes.status).toBe(200);
    expect(canRes.status).toBe(200);

    const restBody = await restRes.json();
    const subBody = await subRes.json();
    const canBody = await canRes.json();

    const restRaw = JSON.stringify(restBody);
    const subRaw = JSON.stringify(subBody);
    expect(restRaw).not.toContain(secretSentinel);
    expect(restRaw).not.toContain('passwordHash');
    expect(restRaw).not.toContain('"members"');
    expect(subRaw).not.toContain(secretSentinel);
    expect(subRaw).not.toContain('passwordHash');
    expect(subRaw).not.toContain('"members"');

    const foundRest = restBody.restaurants.find((r: any) => r.id === restaurant.id);
    expect(foundRest).toBeDefined();
    expect(foundRest._count).toMatchObject({
      scanEvents: 0,
      chatMessages: 0,
      menuItems: 0,
      tables: 0,
    });
    expect(foundRest.organization.subscriptions[0]?.planKey).toBe('IN_GROWTH');

    expect(subBody.metrics.renewingIn7DaysCount).toBeGreaterThanOrEqual(1);
    const foundSub = subBody.subscriptions.find(
      (s: any) => s.organizationId === restaurant.organizationId
    );
    expect(foundSub).toBeDefined();
    expect(foundSub.organization.restaurants[0]?.id).toBe(restaurant.id);

    const foundDish = canBody.dishes.find((d: any) => d.id === canonical.id);
    expect(foundDish).toBeDefined();
    expect(foundDish.canonicalName).toBeDefined();
    expect(foundDish.category).toBeDefined();
    expect(foundDish.aliases).toContain(`truffle fettuccine ${suffix}`);
    expect(foundDish.canonicalAssets).toBeUndefined();
    expect(foundDish._count).toBeUndefined();
  });

  it('serves owner /api/auth/me, combined /api/restaurant/settings, and /api/billing/usage cleanly', async () => {
    const secretSentinel = 'owner_hash_sentinel_7711';
    const { user, restaurant } = await seedTenantFixture({
      withSubscription: true,
      passwordHash: secretSentinel,
    });

    mockOwnerCookieValue = createOwnerToken(user.id, user.email);

    const [meRes, settingsRes, billingRes] = await Promise.all([
      ownerMeGet(),
      restaurantSettingsGet(
        new Request(`http://localhost/api/restaurant/settings?restaurantId=${restaurant.slug}`)
      ),
      billingUsageGet(
        new Request(`http://localhost/api/billing/usage?restaurantId=${restaurant.id}`)
      ),
    ]);

    expect(meRes.status).toBe(200);
    expect(settingsRes.status).toBe(200);
    expect(billingRes.status).toBe(200);

    const meBody = await meRes.json();
    const settingsBody = await settingsRes.json();
    const billingBody = await billingRes.json();

    expect(JSON.stringify(meBody)).not.toContain(secretSentinel);
    expect(JSON.stringify(meBody)).not.toContain('passwordHash');
    expect(meBody.authenticated).toBe(true);
    expect(meBody.user.organizations[0].restaurants.some((r: any) => r.id === restaurant.id)).toBe(
      true
    );

    expect(settingsBody.restaurant.id).toBe(restaurant.id);
    expect(settingsBody.theme.headingFont).toBe('Plus Jakarta Sans');
    expect(settingsBody.theme.bodyFont).toBe('Inter');
    expect(settingsBody.settings.welcomeMessage).toBe('Fast dashboard test welcome!');
    expect(settingsBody.tableSession).toMatchObject({
      scanTimeoutMinutes: 30,
      orderExtensionMinutes: 30,
    });
    expect(settingsBody.wifi).toBeDefined();

    expect(billingBody.plan.key).toBe('IN_GROWTH');
    expect(billingBody.billingCountry).toBe('IN');
    expect(billingBody.chatQueriesThisMonth).toBe(0);
  });

  it('executes KDS order status lifecycle atomically, keeps same-status idempotent, and handles service calls cleanly', async () => {
    const { suffix, user, restaurant } = await seedTenantFixture({ withSubscription: true });

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId: restaurant.id,
        name: `Table KDS ${suffix}`,
        qrTokenHash: crypto.randomBytes(16).toString('hex'),
      },
    });

    const menu = await prisma.menu.create({
      data: { restaurantId: restaurant.id, title: 'Main Menu', active: true },
    });
    const category = await prisma.menuCategory.create({
      data: { menuId: menu.id, name: 'Starters', sortOrder: 1 },
    });
    const dish = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: restaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        customName: 'Paneer Pakora',
        priceMinor: 24000,
        currency: 'INR',
      },
    });

    const staff = await prisma.restaurantStaff.create({
      data: {
        restaurantId: restaurant.id,
        displayName: `Chef ${suffix}`,
        loginId: `chef_${suffix}`,
        passwordHash: hashStaffPassword('KitchenPass123!'),
        role: StaffRole.KITCHEN,
        isActive: true,
      },
    });
    const rawStaffToken = generateStaffSessionToken();
    await prisma.staffSession.create({
      data: {
        staffId: staff.id,
        sessionTokenHash: hashToken(rawStaffToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Verify slim staff & owner auth paths return lightweight tenant metadata
    mockStaffCookieValue = rawStaffToken;
    const staffAuth = await verifyStaffOrOwnerAccess(restaurant.id, undefined, {
      includeDetails: false,
    });
    expect(staffAuth.authorized).toBe(true);
    if (staffAuth.authorized) {
      expect(staffAuth.actorType).toBe('STAFF');
      expect(staffAuth.role).toBe('KITCHEN');
      expect(staffAuth.restaurant.id).toBe(restaurant.id);
    }
    mockStaffCookieValue = undefined;

    const ownerToken = createOwnerToken(user.id, user.email);
    mockOwnerCookieValue = ownerToken;
    const ownerAuth = await verifyStaffOrOwnerAccess(restaurant.id, undefined, {
      includeDetails: false,
    });
    expect(ownerAuth.authorized).toBe(true);
    if (ownerAuth.authorized) {
      expect(ownerAuth.actorType).toBe('OWNER');
      expect(ownerAuth.restaurant.id).toBe(restaurant.id);
    }

    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        orderNumber: `999${suffix.slice(0, 4)}`,
        status: OrderStatus.PLACED,
        currency: 'INR',
        subtotalMinor: 24000,
        taxMinor: 1200,
        serviceChargeMinor: 0,
        totalMinor: 25200,
        items: {
          create: [
            {
              restaurantMenuItemId: dish.id,
              dishNameSnapshot: dish.customName,
              quantity: 1,
              unitPriceMinor: 24000,
              modifiersTotalMinor: 0,
              lineTotalMinor: 24000,
            },
          ],
        },
      },
    });
    createdOrderIds.push(order.id);

    const transitions: OrderStatus[] = ['ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
    for (const nextStatus of transitions) {
      if (nextStatus === 'PREPARING' || nextStatus === 'READY') {
        mockOwnerCookieValue = undefined;
        mockStaffCookieValue = rawStaffToken;
      } else {
        mockStaffCookieValue = undefined;
        mockOwnerCookieValue = ownerToken;
      }

      const patchRes = await orderStatusPatch(
        new Request(`http://localhost/api/restaurants/${restaurant.id}/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        }),
        { params: Promise.resolve({ id: restaurant.id, orderId: order.id }) }
      );
      expect(patchRes.status).toBe(200);
      const patchJson = await patchRes.json();
      expect(patchJson.success).toBe(true);
      expect(patchJson.order.status).toBe(nextStatus);
    }
    mockStaffCookieValue = undefined;
    mockOwnerCookieValue = ownerToken;

    const completedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { statusHistory: true, events: true },
    });
    expect(completedOrder?.acceptedAt).not.toBeNull();
    expect(completedOrder?.preparingAt).not.toBeNull();
    expect(completedOrder?.readyAt).not.toBeNull();
    expect(completedOrder?.servedAt).not.toBeNull();
    expect(completedOrder?.completedAt).not.toBeNull();
    expect(completedOrder?.statusHistory.length).toBe(5);
    expect(completedOrder?.events.length).toBe(5);

    // Invalid transition from terminal COMPLETED state returns 400
    const invalidRes = await orderStatusPatch(
      new Request(`http://localhost/api/restaurants/${restaurant.id}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY' }),
      }),
      { params: Promise.resolve({ id: restaurant.id, orderId: order.id }) }
    );
    expect(invalidRes.status).toBe(400);

    // Verify same-status idempotent update skips extra history writes
    const secondOrder = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        orderNumber: `998${suffix.slice(0, 4)}`,
        status: OrderStatus.PREPARING,
        currency: 'INR',
        subtotalMinor: 24000,
        taxMinor: 1200,
        serviceChargeMinor: 0,
        totalMinor: 25200,
      },
    });
    createdOrderIds.push(secondOrder.id);

    const idempotentRes = await updateOrderStatus({
      orderId: secondOrder.id,
      restaurantId: restaurant.id,
      targetStatus: 'PREPARING',
      staffRole: 'MANAGER',
    });
    expect(idempotentRes.status).toBe('PREPARING');
    expect(idempotentRes.statusHistory.length).toBe(0);

    // Verify query-first service call create, read, and resolution lifecycle
    const serviceCall = await createServiceCall({
      restaurantId: restaurant.id,
      tableId: table.id,
      tableName: table.name,
      callType: 'WATER',
      notes: 'Cold bottle',
    });
    createdServiceCallIds.push(serviceCall.id);

    const callsBefore = await getActiveServiceCalls(restaurant.id);
    expect(callsBefore.some((c) => c.id === serviceCall.id)).toBe(true);

    const getCallsRes = await serviceCallsGet(
      new Request(`http://localhost/api/restaurants/${restaurant.id}/service-calls`),
      { params: Promise.resolve({ id: restaurant.id }) }
    );
    expect(getCallsRes.status).toBe(200);
    const getCallsBody = await getCallsRes.json();
    expect(getCallsBody.calls.some((c: any) => c.id === serviceCall.id)).toBe(true);

    const resolveRes = await serviceCallsPatch(
      new Request(`http://localhost/api/restaurants/${restaurant.id}/service-calls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: serviceCall.id }),
      }),
      { params: Promise.resolve({ id: restaurant.id }) }
    );
    expect(resolveRes.status).toBe(200);
    const resolveBody = await resolveRes.json();
    expect(resolveBody.success).toBe(true);

    const callsAfter = await getActiveServiceCalls(restaurant.id);
    expect(callsAfter.some((c) => c.id === serviceCall.id)).toBe(false);
  });

  it('loads slim SSR diner menu payload, hits cache without re-querying menus, and enforces expiry pause', async () => {
    const { suffix, restaurant } = await seedTenantFixture({ withSubscription: true });

    const menu = await prisma.menu.create({
      data: { restaurantId: restaurant.id, title: 'All Day Cafe', active: true },
    });
    const category = await prisma.menuCategory.create({
      data: { menuId: menu.id, name: 'Coffee & Bakes', sortOrder: 1 },
    });
    await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: restaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        customName: `Cortado ${suffix}`,
        restaurantDescription: 'Double ristretto with warm microfoam',
        priceMinor: 21000,
        currency: 'INR',
        isPublished: true,
        isAvailable: true,
        variants: {
          create: [
            { name: 'Regular', supplementalPriceMinor: 0, sortOrder: 1 },
            { name: 'Oat Milk', supplementalPriceMinor: 4000, sortOrder: 2 },
          ],
        },
        modifierGroups: {
          create: [
            {
              name: 'Roast Profile',
              required: true,
              minSelections: 1,
              maxSelections: 1,
              sortOrder: 1,
              options: {
                create: [{ name: 'House Medium Roast', priceMinor: 0, sortOrder: 1 }],
              },
            },
          ],
        },
      },
    });

    await prisma.restaurantTheme.update({
      where: { restaurantId: restaurant.id },
      data: {
        draftSettings: { unusedHugeDraftBlob: 'should_not_be_in_diner_payload' },
        publishedSettings: { unusedPublishedBlob: 'should_not_be_in_diner_payload' },
      },
    });

    const firstLoad = await loadDinerMenuPayload(restaurant.slug);
    expect(firstLoad.status).toBe('OK');
    if (firstLoad.status === 'OK') {
      expect(firstLoad.data.restaurant.slug).toBe(restaurant.slug);
      expect(firstLoad.data.menus).toHaveLength(1);
      expect(firstLoad.data.menus[0].title).toBe('All Day Cafe');
      expect(firstLoad.data.menus[0].categories[0].items[0].customName).toBe(`Cortado ${suffix}`);
      expect(firstLoad.data.menus[0].categories[0].items[0].variants).toHaveLength(2);
      expect(firstLoad.data.menus[0].categories[0].items[0].modifierGroups[0].required).toBe(true);
      expect(JSON.stringify(firstLoad.data)).not.toContain('should_not_be_in_diner_payload');
    }

    // Warm cache hit MUST return menu without executing a full menu join query again
    const findUniqueSpy = vi.spyOn(prisma.restaurant, 'findUnique');
    const cachedLoad = await loadDinerMenuPayload(restaurant.slug);
    expect(cachedLoad.status).toBe('OK');
    expect(findUniqueSpy).not.toHaveBeenCalled();

    // Unknown slug returns NOT_FOUND
    const missingLoad = await loadDinerMenuPayload(`missing-${suffix}`);
    expect(missingLoad.status).toBe('NOT_FOUND');

    // Unsubscribed / expired tenant returns PAUSED even when menu cache is warm
    await prisma.subscription.updateMany({
      where: { organizationId: restaurant.organizationId! },
      data: { paidThrough: new Date(Date.now() - 60_000) },
    });
    const pausedLoad = await loadDinerMenuPayload(restaurant.slug);
    expect(pausedLoad.status).toBe('PAUSED');
    if (pausedLoad.status === 'PAUSED') {
      expect(pausedLoad.pausedPayload.paused).toBe(true);
    }
  });
});
