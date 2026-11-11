import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import {
  verifyRazorpayWebhookSignature,
  verifyRazorpaySubscriptionSignature,
  resolveRazorpayPlanId,
  getRazorpayConfig,
  createSubscriptionSession,
  confirmRazorpaySubscriptionPayment,
  processRazorpayWebhookEvent,
  RazorpayConfigError,
  RazorpayApiError,
} from '../src/lib/payments/razorpay';
import { PLAN_CATALOG } from '../src/lib/payments/plans';

describe('Razorpay Webhook Signature Verification, Checkout Verification & Idempotency', () => {
  const secret = 'test_webhook_secret_key_12345';
  const samplePayload = JSON.stringify({
    event: 'subscription.charged',
    payload: {
      subscription: {
        entity: {
          id: 'sub_test_12345',
          status: 'active',
        },
      },
    },
  });
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdEventIds: string[] = [];
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(async () => {
    process.env.RAZORPAY_KEY_ID = originalKeyId;
    process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;

    if (createdEventIds.length > 0) {
      await prisma.billingEvent
        .deleteMany({
          where: { providerEventId: { in: createdEventIds.splice(0, createdEventIds.length) } },
        })
        .catch(() => {});
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

  it('accepts valid HMAC signature computed from raw body bytes', () => {
    const validSignature = crypto.createHmac('sha256', secret).update(samplePayload).digest('hex');
    const result = verifyRazorpayWebhookSignature(samplePayload, validSignature, secret);
    expect(result).toBe(true);
  });

  it('rejects forged signature', () => {
    const forgedSignature = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const result = verifyRazorpayWebhookSignature(samplePayload, forgedSignature, secret);
    expect(result).toBe(false);
  });

  it('rejects tampered body even with original signature', () => {
    const validSignature = crypto.createHmac('sha256', secret).update(samplePayload).digest('hex');
    const tamperedPayload = samplePayload + ' ';
    const result = verifyRazorpayWebhookSignature(tamperedPayload, validSignature, secret);
    expect(result).toBe(false);
  });

  it('safely returns false on mismatched signature byte lengths without throwing RangeError', () => {
    expect(verifyRazorpayWebhookSignature(samplePayload, 'short_sig', secret)).toBe(false);
    expect(
      verifyRazorpaySubscriptionSignature({
        paymentId: 'pay_123',
        subscriptionId: 'sub_123',
        signature: 'bad',
        secret: 'key_sec',
      })
    ).toBe(false);
  });

  it('normalizes whitespace/quotes in env vars and refuses mock fallback in production or on API failure', async () => {
    process.env.RAZORPAY_KEY_ID = '  "rzp_live_trimmed123"  ';
    process.env.RAZORPAY_KEY_SECRET = "  'sec_live_trimmed456'  ";
    process.env.RAZORPAY_WEBHOOK_SECRET = ' "whsec_trimmed789" ';

    const cfg = getRazorpayConfig();
    expect(cfg).toEqual({
      keyId: 'rzp_live_trimmed123',
      keySecret: 'sec_live_trimmed456',
      webhookSecret: 'whsec_trimmed789',
      isConfigured: true,
    });

    // Missing credentials in production must throw RazorpayConfigError (never sub_mock_)
    process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_placeholder';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    await expect(
      createSubscriptionSession({
        organizationId: '00000000-0000-0000-0000-000000000001',
        planKey: 'IN_STARTER',
        customerEmail: 'prod@menzy.test',
      })
    ).rejects.toThrow(RazorpayConfigError);
  });

  it('verifies Checkout subscription signature, activates tenant once, and avoids duplicate credits on subsequent webhook', async () => {
    const suffix = crypto.randomBytes(4).toString('hex');
    const testKeySecret = 'rzp_test_checkout_verify_secret_999';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_verify999';
    process.env.RAZORPAY_KEY_SECRET = testKeySecret;

    const owner = await prisma.user.create({
      data: {
        email: `rzp-verify-${suffix}@menzy.test`,
        name: 'Verify Owner',
        emailVerified: new Date(),
      },
    });
    createdUserIds.push(owner.id);

    const org = await prisma.organization.create({
      data: {
        name: `Verify Org ${suffix}`,
        ownerUserId: owner.id,
        billingCountry: 'IN',
        billingCurrency: 'INR',
        members: { create: { userId: owner.id, role: 'OWNER' } },
      },
    });
    createdOrgIds.push(org.id);

    const subId = `sub_live_test_${suffix}`;
    const paymentId = `pay_live_test_${suffix}`;
    createdEventIds.push(`verify_${paymentId}`, paymentId);

    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        provider: 'RAZORPAY',
        planKey: 'IN_STARTER',
        providerSubscriptionId: subId,
        status: 'PENDING',
        currency: 'INR',
        billingPeriod: 'MONTHLY',
      },
    });

    // Reject forged payment signature
    await expect(
      confirmRazorpaySubscriptionPayment({
        organizationId: org.id,
        razorpayPaymentId: paymentId,
        razorpaySubscriptionId: subId,
        razorpaySignature: '0'.repeat(64),
      })
    ).rejects.toThrow(RazorpayApiError);

    // Confirm with valid HMAC signature (`${paymentId}|${subId}`)
    const validSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${paymentId}|${subId}`)
      .digest('hex');

    const confirmRes = await confirmRazorpaySubscriptionPayment({
      organizationId: org.id,
      razorpayPaymentId: paymentId,
      razorpaySubscriptionId: subId,
      razorpaySignature: validSignature,
      planKeyHint: 'IN_STARTER',
    });

    expect(confirmRes.status).toBe('ACTIVE');
    expect(confirmRes.planKey).toBe('IN_STARTER');

    const dbSubAfterConfirm = await prisma.subscription.findUnique({
      where: { organizationId: org.id },
    });
    expect(dbSubAfterConfirm?.status).toBe('ACTIVE');

    // Follow-up Razorpay webhook for the same cycle must NOT double-grant monthly credits
    const webhookRes = await processRazorpayWebhookEvent({
      event: 'subscription.charged',
      payload: {
        payment: { entity: { id: paymentId } },
        subscription: { entity: { id: subId, status: 'active' } },
      },
    });
    expect(webhookRes.status).toBe('PROCESSED_SUCCESSFULLY');

    const creditSum = await prisma.creditLedger.aggregate({
      where: { organizationId: org.id, creditType: 'IMAGE_GENERATION' },
      _sum: { delta: true },
    });
    expect(creditSum._sum.delta).toBe(PLAN_CATALOG.IN_STARTER.imageCreditsMonthly);
  });

  it('exposes configured Menzy India pricing tiers (999, 1799, 2699) and updated IN/US allowances', () => {
    expect(PLAN_CATALOG.IN_STARTER.priceMinor).toBe(99900);
    expect(PLAN_CATALOG.IN_STARTER.monthlyPriceFormatted).toBe('₹999/mo');
    expect(PLAN_CATALOG.IN_GROWTH.priceMinor).toBe(179900);
    expect(PLAN_CATALOG.IN_GROWTH.monthlyPriceFormatted).toBe('₹1,799/mo');
    expect(PLAN_CATALOG.IN_PRO.priceMinor).toBe(269900);
    expect(PLAN_CATALOG.IN_PRO.monthlyPriceFormatted).toBe('₹2,699/mo');

    for (const prefix of ['IN', 'US'] as const) {
      const growth = PLAN_CATALOG[`${prefix}_GROWTH`];
      expect(growth.itemLimit).toBe(100);
      expect(growth.imageCreditsMonthly).toBe(40);
      expect(growth.aiQuestionsMonthly).toBe(3000);

      const pro = PLAN_CATALOG[`${prefix}_PRO`];
      expect(pro.itemLimit).toBeGreaterThan(1000);
      expect(pro.imageCreditsMonthly).toBe(100);
      expect(pro.aiQuestionsMonthly).toBe(6000);
    }
  });

  it('reuses an existing matching Razorpay plan from catalog without env vars', async () => {
    const allMock = vi.fn().mockResolvedValue({
      entity: 'collection',
      count: 1,
      items: [
        {
          id: 'plan_existing_999',
          period: 'monthly',
          interval: 1,
          notes: { planKey: 'IN_STARTER' },
          item: { amount: 99900, currency: 'INR', active: true },
        },
      ],
    });
    const createMock = vi.fn();

    const planId = await resolveRazorpayPlanId(
      { plans: { all: allMock, create: createMock, fetch: vi.fn() } },
      PLAN_CATALOG.IN_STARTER,
      'test_reuse'
    );

    expect(planId).toBe('plan_existing_999');
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates a new Razorpay plan when none matches current catalog price', async () => {
    const allMock = vi.fn().mockResolvedValue({
      entity: 'collection',
      count: 1,
      items: [
        {
          id: 'plan_stale_price',
          period: 'monthly',
          interval: 1,
          notes: { planKey: 'IN_GROWTH' },
          item: { amount: 149900, currency: 'INR', active: true },
        },
      ],
    });
    const createMock = vi.fn().mockResolvedValue({ id: 'plan_created_1799' });

    const planId = await resolveRazorpayPlanId(
      { plans: { all: allMock, create: createMock, fetch: vi.fn() } },
      PLAN_CATALOG.IN_GROWTH,
      'test_create'
    );

    expect(planId).toBe('plan_created_1799');
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        period: 'monthly',
        interval: 1,
        item: expect.objectContaining({
          amount: 179900,
          currency: 'INR',
        }),
        notes: { planKey: 'IN_GROWTH' },
      })
    );
  });
});

