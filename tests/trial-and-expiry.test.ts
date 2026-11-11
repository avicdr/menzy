import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { PublicationState, Role, StaffRole } from '@prisma/client';

let mockAdminCookieValue: string | undefined;
let mockOwnerCookieValue: string | undefined;
let mockStaffCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'dishora_admin_session' && mockAdminCookieValue) {
        return { name, value: mockAdminCookieValue };
      }
      if (name === 'dishora_owner_session' && mockOwnerCookieValue) {
        return { name, value: mockOwnerCookieValue };
      }
      if (name === 'dishora_staff_session' && mockStaffCookieValue) {
        return { name, value: mockStaffCookieValue };
      }
      return undefined;
    },
    set: (name: string, value: string) => {
      if (name === 'dishora_owner_session') mockOwnerCookieValue = value;
      if (name === 'dishora_staff_session') mockStaffCookieValue = value;
      if (name === 'dishora_admin_session') mockAdminCookieValue = value;
    },
    delete: (name: string) => {
      if (name === 'dishora_owner_session') mockOwnerCookieValue = undefined;
      if (name === 'dishora_staff_session') mockStaffCookieValue = undefined;
      if (name === 'dishora_admin_session') mockAdminCookieValue = undefined;
    },
  }),
}));

import { createAdminToken } from '../src/lib/auth/admin-auth';
import { createOwnerToken } from '../src/lib/auth/owner-auth';
import { hashStaffPassword } from '../src/lib/auth/staff-auth';
import { getCache } from '../src/lib/cache/redis';
import {
  generateRawClaimToken,
  hashClaimToken,
  redeemClaimWithinTransaction,
} from '../src/lib/claims/claim-service';
import { processRazorpayWebhookEvent } from '../src/lib/payments/razorpay';
import { SUPPORT_PHONE } from '../src/lib/support/contact';
import { TRIAL_PLAN_KEY } from '../src/lib/payments/plans';
import { POST as signupPost } from '../src/app/api/auth/signup/route';
import { GET as authMeGet } from '../src/app/api/auth/me/route';
import { GET as billingUsageGet } from '../src/app/api/billing/usage/route';
import { POST as createSubPost } from '../src/app/api/billing/create-subscription/route';
import { GET as menuItemsGet } from '../src/app/api/menus/items/route';
import { GET as dinerMenuGet } from '../src/app/api/diner/menu/route';
import { POST as dinerSessionPost } from '../src/app/api/diner/session/route';
import { GET as qrGenerateGet } from '../src/app/api/qr/generate/route';
import { POST as staffLoginPost } from '../src/app/api/staff/login/route';
import { GET as staffAutoOrdersGet } from '../src/app/api/restaurants/_auto/orders/route';
import { POST as adminGrantPost } from '../src/app/api/admin/entitlements/grant/route';

describe('14-Day Free Trial, Hard Subscription Cutoff & Setup Support Helpline', () => {
  const createdRestaurantSlugs: string[] = [];
  const createdRestaurantIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdBillingEventIds: string[] = [];
  const createdGrantIds: string[] = [];
  const originalRzpKeyId = process.env.RAZORPAY_KEY_ID;
  const originalRzpSecret = process.env.RAZORPAY_KEY_SECRET;

  afterEach(async () => {
    mockAdminCookieValue = undefined;
    mockOwnerCookieValue = undefined;
    mockStaffCookieValue = undefined;
    process.env.RAZORPAY_KEY_ID = originalRzpKeyId;
    process.env.RAZORPAY_KEY_SECRET = originalRzpSecret;

    if (createdRestaurantSlugs.length > 0) {
      const cache = getCache();
      await Promise.all(
        createdRestaurantSlugs.splice(0, createdRestaurantSlugs.length).map((s) =>
          cache.del(`menu:slug:${s}`).catch(() => {})
        )
      );
    }
    if (createdGrantIds.length > 0) {
      await prisma.adminAuditLog
        .deleteMany({
          where: {
            entityType: 'ENTITLEMENT_GRANT',
            entityId: { in: createdGrantIds.splice(0, createdGrantIds.length) },
          },
        })
        .catch(() => {});
    }
    if (createdBillingEventIds.length > 0) {
      await prisma.billingEvent
        .deleteMany({
          where: {
            providerEventId: { in: createdBillingEventIds.splice(0, createdBillingEventIds.length) },
          },
        })
        .catch(() => {});
    }
    if (createdRestaurantIds.length > 0) {
      const rIds = createdRestaurantIds.splice(0, createdRestaurantIds.length);
      await prisma.scanEvent.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => {});
      await prisma.dinerSession.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => {});
      await prisma.order.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => {});
      await prisma.restaurant.deleteMany({ where: { id: { in: rIds } } }).catch(() => {});
    }
    if (createdOrgIds.length > 0) {
      await prisma.organization
        .deleteMany({ where: { id: { in: createdOrgIds.splice(0, createdOrgIds.length) } } })
        .catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user
        .deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } })
        .catch(() => {});
    }
  });

  it('auto-provisions 14-day Trial without payment method on signup, blocks checkout for Trial, enforces hard 402 cutoff despite warm Redis cache, and restores on webhook activation', async () => {
    const suffix = crypto.randomBytes(4).toString('hex');
    const signupEmail = `trial-signup-${suffix}@menzy.test`;

    // Force offline Razorpay sandbox session creation
    process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_placeholder';

    // 1. Signup auto-provisions 14-day FREE_TRIAL without card/payment method
    const signupRes = await signupPost(
      new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-ipcountry': 'IN',
        },
        body: JSON.stringify({
          name: `Trial Owner ${suffix}`,
          email: signupEmail,
          password: 'TrialPassword123!',
          restaurantName: `Trial Bistro ${suffix}`,
          city: 'Lucknow',
        }),
      })
    );

    expect(signupRes.status).toBe(200);
    const signupJson = await signupRes.json();
    expect(signupJson.success).toBe(true);
    expect(signupJson.trial).toMatchObject({
      planKey: TRIAL_PLAN_KEY,
      name: 'Trial',
      days: 14,
      requiresPaymentMethod: false,
    });
    expect(signupJson.supportPhone).toBe(SUPPORT_PHONE);

    const userId = signupJson.user.id as string;
    const restaurantId = signupJson.restaurant.id as string;
    const restaurantSlug = signupJson.restaurant.slug as string;
    createdUserIds.push(userId);
    createdRestaurantIds.push(restaurantId);
    createdRestaurantSlugs.push(restaurantSlug);

    const dbRestaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    expect(dbRestaurant?.organizationId).toBeTruthy();
    const orgId = dbRestaurant!.organizationId!;
    createdOrgIds.push(orgId);

    const trialSub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
    expect(trialSub).not.toBeNull();
    expect(trialSub?.planKey).toBe('FREE_TRIAL');
    expect(trialSub?.status).toBe('TRIAL');
    expect(trialSub?.provider).toBe('TRIAL');
    expect(trialSub?.billingPeriod).toBe('TRIAL_14D');
    expect(trialSub?.providerSubscriptionId).toBeNull();

    // Purchasing FREE_TRIAL via Razorpay checkout endpoint is rejected with 400
    mockOwnerCookieValue = createOwnerToken(userId, signupEmail);
    const trialCheckoutRes = await createSubPost(
      new Request('http://localhost:3000/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, planKey: 'FREE_TRIAL' }),
      })
    );
    expect(trialCheckoutRes.status).toBe(400);

    // Prepare published menu + category + dish + table + staff so all surfaces operate normally during trial
    const menu = await prisma.menu.findFirst({ where: { restaurantId } });
    const category = await prisma.menuCategory.findFirst({ where: { menuId: menu!.id } });
    await prisma.restaurantMenuItem.create({
      data: {
        restaurantId,
        menuId: menu!.id,
        categoryId: category!.id,
        customName: 'Cardamom Cold Brew',
        priceMinor: 22000,
        currency: 'INR',
        isPublished: true,
        isAvailable: true,
        sortOrder: 1,
      },
    });
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { publicationState: PublicationState.PUBLISHED },
    });

    const table = await prisma.restaurantTable.findFirst({ where: { restaurantId } });
    expect(table).not.toBeNull();

    const staffLoginId = `kitchen_${suffix}`;
    await prisma.restaurantStaff.create({
      data: {
        restaurantId,
        displayName: 'Chef Trial',
        loginId: staffLoginId,
        passwordHash: hashStaffPassword('KitchenPass123!'),
        role: StaffRole.KITCHEN,
        isActive: true,
      },
    });

    // 2. Active trial permits owner /api/auth/me, owner APIs, diner menu (warms Redis cache), QR generate, and staff KDS
    const [activeAuthMeRes, activeItemsRes, activeDinerMenuRes, activeQrRes, activeStaffLoginRes] = await Promise.all([
      authMeGet(),
      menuItemsGet(new Request(`http://localhost:3000/api/menus/items?restaurantId=${restaurantId}`)),
      dinerMenuGet(new Request(`http://localhost:3000/api/diner/menu?slug=${restaurantSlug}`)),
      qrGenerateGet(new Request(`http://localhost:3000/api/qr/generate?slug=${restaurantSlug}`)),
      staffLoginPost(
        new Request('http://localhost:3000/api/staff/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId: staffLoginId, password: 'KitchenPass123!' }),
        })
      ),
    ]);
    expect(activeAuthMeRes.status).toBe(200);
    const activeAuthMeBody = await activeAuthMeRes.json();
    expect(activeAuthMeBody.authenticated).toBe(true);
    expect(activeAuthMeBody.user.organizations[0].access).toMatchObject({
      allowed: true,
      expired: false,
      mode: 'TRIAL',
      planName: 'Trial',
      supportPhone: SUPPORT_PHONE,
    });
    expect(activeItemsRes.status).toBe(200);
    expect(activeDinerMenuRes.status).toBe(200);
    expect(activeQrRes.status).toBe(200);
    expect(activeStaffLoginRes.status).toBe(200);

    const activeOrdersRes = await staffAutoOrdersGet(
      new Request('http://localhost:3000/api/restaurants/_auto/orders')
    );
    expect(activeOrdersRes.status).toBe(200);

    // 3. Expire the 14-day trial
    await prisma.subscription.update({
      where: { organizationId: orgId },
      data: { paidThrough: new Date(Date.now() - 60 * 60 * 1000) },
    });

    // Even with warm Redis cache `menu:slug:<slug>`, diner menu MUST return 402 TRIAL_EXPIRED + no-store
    const expiredDinerMenuRes = await dinerMenuGet(
      new Request(`http://localhost:3000/api/diner/menu?slug=${restaurantSlug}`)
    );
    expect(expiredDinerMenuRes.status).toBe(402);
    expect(expiredDinerMenuRes.headers.get('cache-control')).toContain('no-store');
    const expiredMenuBody = await expiredDinerMenuRes.json();
    expect(expiredMenuBody.code).toBe('TRIAL_EXPIRED');
    expect(expiredMenuBody.paused).toBe(true);
    expect(expiredMenuBody.subscriptionRequired).toBe(true);
    expect(expiredMenuBody.supportPhone).toBe(SUPPORT_PHONE);

    const [
      expiredSessionRes,
      expiredQrRes,
      expiredOwnerItemsRes,
      expiredStaffOrdersRes,
      expiredStaffLoginRes,
    ] = await Promise.all([
      dinerSessionPost(
        new Request('http://localhost:3000/api/diner/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantSlug }),
        })
      ),
      qrGenerateGet(new Request(`http://localhost:3000/api/qr/generate?slug=${restaurantSlug}`)),
      menuItemsGet(new Request(`http://localhost:3000/api/menus/items?restaurantId=${restaurantId}`)),
      staffAutoOrdersGet(new Request('http://localhost:3000/api/restaurants/_auto/orders')),
      staffLoginPost(
        new Request('http://localhost:3000/api/staff/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId: staffLoginId, password: 'KitchenPass123!' }),
        })
      ),
    ]);

    expect(expiredSessionRes.status).toBe(402);
    expect(expiredQrRes.status).toBe(402);
    expect(expiredOwnerItemsRes.status).toBe(402);
    expect(expiredStaffOrdersRes.status).toBe(402);
    expect(expiredStaffLoginRes.status).toBe(402);

    // Owner auth & billing panel MUST stay accessible so the owner can buy a subscription
    const [meWhileExpiredRes, billingWhileExpiredRes, paidCheckoutRes] = await Promise.all([
      authMeGet(),
      billingUsageGet(new Request(`http://localhost:3000/api/billing/usage?restaurantId=${restaurantId}`)),
      createSubPost(
        new Request('http://localhost:3000/api/billing/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, planKey: 'IN_STARTER' }),
        })
      ),
    ]);

    expect(meWhileExpiredRes.status).toBe(200);
    const meBody = await meWhileExpiredRes.json();
    expect(meBody.user.organizations[0].access).toMatchObject({
      allowed: false,
      expired: true,
      isTrialExpired: true,
      supportPhone: SUPPORT_PHONE,
    });

    expect(billingWhileExpiredRes.status).toBe(200);
    const billingBody = await billingWhileExpiredRes.json();
    expect(billingBody.plan.name).toBe('Trial');
    expect(billingBody.access.expired).toBe(true);
    expect(billingBody.supportPhone).toBe(SUPPORT_PHONE);

    expect(paidCheckoutRes.status).toBe(200);
    const paidCheckoutBody = await paidCheckoutRes.json();
    expect(paidCheckoutBody.subscriptionId).toBeTruthy();

    // 4. Razorpay subscription.activated webhook restores access & invalidates Redis menu cache
    const providerEventId = `pay_trial_activate_${suffix}`;
    createdBillingEventIds.push(providerEventId);
    const webhookRes = await processRazorpayWebhookEvent({
      event: 'subscription.activated',
      payload: {
        payment: { entity: { id: providerEventId } },
        subscription: { entity: { id: paidCheckoutBody.subscriptionId, status: 'active' } },
      },
    });
    expect(webhookRes.status).toBe('PROCESSED_SUCCESSFULLY');

    const [restoredDinerRes, restoredOwnerItemsRes, restoredStaffOrdersRes] = await Promise.all([
      dinerMenuGet(new Request(`http://localhost:3000/api/diner/menu?slug=${restaurantSlug}`)),
      menuItemsGet(new Request(`http://localhost:3000/api/menus/items?restaurantId=${restaurantId}`)),
      staffAutoOrdersGet(new Request('http://localhost:3000/api/restaurants/_auto/orders')),
    ]);

    expect(restoredDinerRes.status).toBe(200);
    expect(restoredOwnerItemsRes.status).toBe(200);
    expect(restoredStaffOrdersRes.status).toBe(200);
  });

  it('keeps unclaimed demos previewable until claimed, blocks on claim trial expiry, and restores via Founder EXTENSION grant', async () => {
    const suffix = crypto.randomBytes(4).toString('hex');
    const rawClaimToken = generateRawClaimToken();

    const demoRestaurant = await prisma.restaurant.create({
      data: {
        slug: `unclaimed-trial-demo-${suffix}`,
        displayName: `Unclaimed Demo ${suffix}`,
        country: 'IN',
        city: 'Jaipur',
        currency: 'INR',
        publicationState: PublicationState.PUBLISHED,
        isClaimed: false,
      },
    });
    createdRestaurantIds.push(demoRestaurant.id);
    createdRestaurantSlugs.push(demoRestaurant.slug);

    await prisma.claimRequest.create({
      data: {
        restaurantId: demoRestaurant.id,
        claimTokenHash: hashClaimToken(rawClaimToken),
        status: 'UNCLAIMED',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Unclaimed demo stays publicly previewable
    const unclaimedRes = await dinerMenuGet(
      new Request(`http://localhost:3000/api/diner/menu?slug=${demoRestaurant.slug}`)
    );
    expect(unclaimedRes.status).toBe(200);

    // Owner signs up & claims -> receives 14-day FREE_TRIAL
    const owner = await prisma.user.create({
      data: {
        email: `claim-trial-${suffix}@menzy.test`,
        name: 'Claim Trial Owner',
        emailVerified: new Date(),
      },
    });
    createdUserIds.push(owner.id);

    const claimResult = await prisma.$transaction(
      (tx) =>
        redeemClaimWithinTransaction(tx, {
          rawClaimToken,
          userId: owner.id,
          email: owner.email,
        }),
      { maxWait: 10_000, timeout: 20_000 }
    );
    createdOrgIds.push(claimResult.organizationId);

    const orgSub = await prisma.subscription.findUnique({
      where: { organizationId: claimResult.organizationId },
    });
    expect(orgSub?.planKey).toBe('FREE_TRIAL');
    expect(orgSub?.status).toBe('TRIAL');

    // Expire claimed demo's trial -> menu stops with 402
    await prisma.subscription.update({
      where: { organizationId: claimResult.organizationId },
      data: { paidThrough: new Date(Date.now() - 5 * 60 * 1000) },
    });

    const expiredClaimRes = await dinerMenuGet(
      new Request(`http://localhost:3000/api/diner/menu?slug=${demoRestaurant.slug}`)
    );
    expect(expiredClaimRes.status).toBe(402);

    // Founder grants EXTENSION -> immediately restores access
    mockAdminCookieValue = createAdminToken('founder@menzy.app');
    const grantRes = await adminGrantPost(
      new Request('http://localhost:3000/api/admin/entitlements/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: claimResult.organizationId,
          grantType: 'EXTENSION',
          durationDays: 7,
          founderReason: 'VIP trial extension test',
        }),
      })
    );
    expect(grantRes.status).toBe(200);
    const grantJson = await grantRes.json();
    createdGrantIds.push(grantJson.grant.id);

    const restoredClaimRes = await dinerMenuGet(
      new Request(`http://localhost:3000/api/diner/menu?slug=${demoRestaurant.slug}`)
    );
    expect(restoredClaimRes.status).toBe(200);
  });

  it('handles unauthenticated, malformed, deleted-user, active-trial, and DB-error cases on GET /api/auth/me without empty 500 responses', async () => {
    // 1. No cookie -> 401 JSON
    mockOwnerCookieValue = undefined;
    const unauthRes = await authMeGet();
    expect(unauthRes.status).toBe(401);
    expect(await unauthRes.json()).toEqual({ authenticated: false, user: null });

    // 2. Tampered / malformed cookie -> 401 JSON
    mockOwnerCookieValue = 'not-a-valid-token.sig';
    const invalidRes = await authMeGet();
    expect(invalidRes.status).toBe(401);
    expect(await invalidRes.json()).toEqual({ authenticated: false, user: null });

    // 3. Valid cookie referencing non-existent / deleted user -> 401 JSON
    mockOwnerCookieValue = createOwnerToken(crypto.randomUUID(), 'deleted@menzy.test');
    const deletedUserRes = await authMeGet();
    expect(deletedUserRes.status).toBe(401);
    expect(await deletedUserRes.json()).toEqual({ authenticated: false, user: null });

    // 4. Unexpected DB error -> structured 500 JSON (never empty body)
    const suffix = crypto.randomBytes(4).toString('hex');
    const ownerId = crypto.randomUUID();
    mockOwnerCookieValue = createOwnerToken(ownerId, `err-${suffix}@menzy.test`);
    const findUniqueSpy = vi
      .spyOn(prisma.user, 'findUnique')
      .mockRejectedValueOnce(new Error('Simulated Postgres transient error'));
    try {
      const dbErrRes = await authMeGet();
      expect(dbErrRes.status).toBe(500);
      const dbErrBody = await dbErrRes.json();
      expect(dbErrBody).toMatchObject({
        authenticated: false,
        user: null,
        error: 'Failed to load authenticated session.',
      });
    } finally {
      findUniqueSpy.mockRestore();
    }
  });
});

