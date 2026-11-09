import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpayWebhookSignature } from '../src/lib/payments/razorpay';

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
});
