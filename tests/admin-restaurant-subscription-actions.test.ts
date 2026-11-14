import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: { email: 'founder@example.com' },
  prisma: {
    restaurant: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  logAdminAction: vi.fn(async () => undefined),
  cacheDel: vi.fn(async () => 1),
}));

vi.mock('../src/lib/db/prisma', () => ({ default: mocks.prisma }));
vi.mock('../src/lib/auth/admin-auth', () => ({
  getAdminSession: vi.fn(async () => mocks.session),
  logAdminAction: mocks.logAdminAction,
}));
vi.mock('../src/lib/cache/redis', () => ({
  getCache: () => ({ del: mocks.cacheDel }),
}));

import { DELETE as deleteRestaurant } from '../src/app/api/admin/restaurants/route';
import { PATCH as patchSubscription } from '../src/app/api/admin/subscriptions/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('founder restaurant and subscription controls', () => {
  it('deletes only an exactly confirmed restaurant and records an audit event', async () => {
    mocks.prisma.restaurant.findUnique.mockResolvedValueOnce({
      id: 'restaurant-1',
      slug: 'sample-cafe',
      displayName: 'Sample Cafe',
      organizationId: 'org-1',
      isClaimed: true,
      _count: { menuItems: 10, orders: 3, tables: 2, staff: 1 },
    });
    mocks.prisma.restaurant.delete.mockResolvedValueOnce({ id: 'restaurant-1' });

    const response = await deleteRestaurant(
      new Request('http://localhost/api/admin/restaurants', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurantId: 'restaurant-1',
          confirmationName: 'Sample Cafe',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.prisma.restaurant.delete).toHaveBeenCalledWith({
      where: { id: 'restaurant-1' },
    });
    expect(mocks.cacheDel).toHaveBeenCalledWith('menu:slug:sample-cafe');
    expect(mocks.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE_RESTAURANT', entityId: 'restaurant-1' })
    );
  });

  it('refuses deletion when the confirmation name does not match', async () => {
    mocks.prisma.restaurant.findUnique.mockResolvedValueOnce({
      id: 'restaurant-1',
      slug: 'sample-cafe',
      displayName: 'Sample Cafe',
      organizationId: 'org-1',
      isClaimed: true,
      _count: { menuItems: 0, orders: 0, tables: 0, staff: 0 },
    });

    const response = await deleteRestaurant(
      new Request('http://localhost/api/admin/restaurants', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ restaurantId: 'restaurant-1', confirmationName: 'Wrong' }),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.prisma.restaurant.delete).not.toHaveBeenCalled();
  });

  it('changes an organization to a matching regional plan as a founder override', async () => {
    const current = {
      id: 'subscription-1',
      organizationId: 'org-1',
      provider: 'RAZORPAY',
      providerSubscriptionId: 'sub_old',
      providerCustomerId: 'cust_old',
      planKey: 'IN_STARTER',
      status: 'ACTIVE',
      currency: 'INR',
      paidThrough: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      organization: {
        id: 'org-1',
        billingCountry: 'IN',
        billingCurrency: 'INR',
        restaurants: [{ country: 'IN', slug: 'sample-cafe' }],
      },
    };
    mocks.prisma.subscription.findUnique.mockResolvedValueOnce(current);
    mocks.prisma.subscription.update.mockImplementationOnce(async ({ data }: any) => ({
      ...current,
      ...data,
    }));

    const response = await patchSubscription(
      new Request('http://localhost/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: 'subscription-1',
          planKey: 'IN_PRO',
          founderReason: 'Manual upgrade approved by founder',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'subscription-1' },
      data: expect.objectContaining({
        planKey: 'IN_PRO',
        provider: 'FOUNDER_OVERRIDE',
        providerSubscriptionId: null,
        providerCustomerId: null,
        status: 'ACTIVE',
        currency: 'INR',
        cancelAtPeriodEnd: false,
      }),
    });
    expect(mocks.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CHANGE_SUBSCRIPTION_PLAN' })
    );
  });

  it('rejects a plan from the wrong billing region', async () => {
    mocks.prisma.subscription.findUnique.mockResolvedValueOnce({
      id: 'subscription-1',
      planKey: 'IN_STARTER',
      currency: 'INR',
      paidThrough: null,
      organization: {
        id: 'org-1',
        billingCountry: 'IN',
        billingCurrency: 'INR',
        restaurants: [{ country: 'IN', slug: 'sample-cafe' }],
      },
    });

    const response = await patchSubscription(
      new Request('http://localhost/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: 'subscription-1',
          planKey: 'US_PRO',
          founderReason: 'Invalid region test',
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.prisma.subscription.update).not.toHaveBeenCalled();
  });
});
