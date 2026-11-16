import { describe, expect, it, vi } from 'vitest';
import { provisionTrialSubscriptionWithinTx } from '../src/lib/billing/subscription-access';

function createTx(options?: { existing?: any; enabled?: boolean }) {
  return {
    subscription: {
      findUnique: vi.fn(async () => options?.existing ?? null),
      create: vi.fn(async ({ data }: any) => ({ id: 'trial-1', ...data })),
    },
    featureFlag: {
      findUnique: vi.fn(async () =>
        typeof options?.enabled === 'boolean' ? { isEnabled: options.enabled } : null
      ),
    },
  };
}

describe('founder-controlled free-trial availability', () => {
  it('does not issue a new trial when the founder switch is off', async () => {
    const tx = createTx({ enabled: false });

    const result = await provisionTrialSubscriptionWithinTx(tx as any, {
      organizationId: 'org-1',
      currency: 'USD',
    });

    expect(result).toEqual({ subscription: null, created: false, trialEnabled: false });
    expect(tx.subscription.create).not.toHaveBeenCalled();
  });

  it('issues a trial by default when no feature-flag row exists', async () => {
    const tx = createTx();

    const result = await provisionTrialSubscriptionWithinTx(tx as any, {
      organizationId: 'org-1',
      currency: 'USD',
    });

    expect(result.created).toBe(true);
    expect(result.trialEnabled).toBe(true);
    expect(result.subscription).toMatchObject({
      organizationId: 'org-1',
      planKey: 'FREE_TRIAL',
      status: 'TRIAL',
      currency: 'USD',
    });
  });

  it('preserves an existing trial when new trial claims are switched off', async () => {
    const existing = { id: 'trial-existing', organizationId: 'org-1', planKey: 'FREE_TRIAL' };
    const tx = createTx({ existing, enabled: false });

    const result = await provisionTrialSubscriptionWithinTx(tx as any, {
      organizationId: 'org-1',
      currency: 'INR',
    });

    expect(result).toEqual({ subscription: existing, created: false, trialEnabled: true });
    expect(tx.featureFlag.findUnique).not.toHaveBeenCalled();
    expect(tx.subscription.create).not.toHaveBeenCalled();
  });
});
