import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpayWebhookSignature, resolveRazorpayPlanId } from '../src/lib/payments/razorpay';
import { PLAN_CATALOG } from '../src/lib/payments/plans';

describe('Razorpay Webhook Signature Verification & Idempotency', () => {
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

  it('exposes configured Menzy India pricing tiers (999, 1799, 2699)', () => {
    expect(PLAN_CATALOG.IN_STARTER.priceMinor).toBe(99900);
    expect(PLAN_CATALOG.IN_STARTER.monthlyPriceFormatted).toBe('₹999/mo');
    expect(PLAN_CATALOG.IN_GROWTH.priceMinor).toBe(179900);
    expect(PLAN_CATALOG.IN_GROWTH.monthlyPriceFormatted).toBe('₹1,799/mo');
    expect(PLAN_CATALOG.IN_PRO.priceMinor).toBe(269900);
    expect(PLAN_CATALOG.IN_PRO.monthlyPriceFormatted).toBe('₹2,699/mo');
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

