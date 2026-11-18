import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { PublicationState, Role } from '@prisma/client';
import {
  computeCustomerVisitMetrics,
  normalizeCustomerMobile,
  recordCustomerRepayment,
  settleOrderPayment,
  validateCustomerInput,
} from '../src/lib/customers/customer-service';
import { placeTableOrder } from '../src/lib/orders/order-service';

let mockOwnerCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'dishora_owner_session' && mockOwnerCookieValue
        ? { name, value: mockOwnerCookieValue }
        : undefined,
  }),
}));

import { createOwnerToken } from '../src/lib/auth/owner-auth';
import { provisionTrialSubscriptionWithinTx } from '../src/lib/billing/subscription-access';
import { POST as dinerCustomerPost } from '../src/app/api/diner/customer/route';
import { GET as customersListGet } from '../src/app/api/restaurants/[id]/customers/route';
import { GET as customerDetailGet } from '../src/app/api/restaurants/[id]/customers/[customerId]/route';
import { POST as customerRepayPost } from '../src/app/api/restaurants/[id]/customers/[customerId]/repay/route';
import { POST as orderSettlePost } from '../src/app/api/restaurants/[id]/orders/[orderId]/settle/route';
import { PATCH as orderingSettingsPatch } from '../src/app/api/restaurants/[id]/ordering-settings/route';

describe('Customer CRM, Visit Frequency & Optional Credit / Loan Tab', () => {
  let ownerUser: any;
  let otherUser: any;
  let orgA: any;
  let orgB: any;
  let restA: any;
  let restB: any;
  let tableA: any;
  let itemA: any;
  let ownerTokenA: string;
  let ownerTokenB: string;

  beforeAll(async () => {
    const suffix = `cust_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;

    ownerUser = await prisma.user.create({
      data: {
        email: `owner_${suffix}@example.com`,
        name: 'Owner A',
        role: Role.OWNER,
        passwordHash: 'mock-hash',
      },
    });
    otherUser = await prisma.user.create({
      data: {
        email: `other_${suffix}@example.com`,
        name: 'Owner B',
        role: Role.OWNER,
        passwordHash: 'mock-hash',
      },
    });

    orgA = await prisma.organization.create({
      data: { name: `Org A ${suffix}`, ownerUserId: ownerUser.id },
    });
    orgB = await prisma.organization.create({
      data: { name: `Org B ${suffix}`, ownerUserId: otherUser.id },
    });

    await prisma.organizationMember.createMany({
      data: [
        { userId: ownerUser.id, organizationId: orgA.id, role: Role.OWNER },
        { userId: otherUser.id, organizationId: orgB.id, role: Role.OWNER },
      ],
    });

    await prisma.$transaction(async (tx) => {
      await provisionTrialSubscriptionWithinTx(tx, { organizationId: orgA.id, currency: 'INR' });
      await provisionTrialSubscriptionWithinTx(tx, { organizationId: orgB.id, currency: 'INR' });
    });

    restA = await prisma.restaurant.create({
      data: {
        organizationId: orgA.id,
        slug: `rest-a-${suffix}`,
        displayName: 'Cafe Alpha',
        country: 'IN',
        currency: 'INR',
        publicationState: PublicationState.PUBLISHED,
        isClaimed: true,
        orderingSettings: {
          create: {
            orderingEnabled: true,
            acceptsNewOrders: true,
            taxPercentage: 0,
            serviceChargePercentage: 0,
            customerCreditEnabled: false,
          },
        },
      },
    });

    restB = await prisma.restaurant.create({
      data: {
        organizationId: orgB.id,
        slug: `rest-b-${suffix}`,
        displayName: 'Cafe Beta',
        country: 'IN',
        currency: 'INR',
        publicationState: PublicationState.PUBLISHED,
        isClaimed: true,
      },
    });

    tableA = await prisma.restaurantTable.create({
      data: {
        restaurantId: restA.id,
        name: 'Table 1',
        qrTokenHash: crypto.createHash('sha256').update(`t_${suffix}`).digest('hex'),
        isActive: true,
      },
    });

    const menuA = await prisma.menu.create({
      data: { restaurantId: restA.id, title: 'Main', active: true },
    });
    const catA = await prisma.menuCategory.create({
      data: { menuId: menuA.id, name: 'Specials', sortOrder: 1 },
    });
    itemA = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: restA.id,
        menuId: menuA.id,
        categoryId: catA.id,
        customName: 'Paneer Platter',
        priceMinor: 50000, // ₹500
        currency: 'INR',
        isPublished: true,
        isAvailable: true,
      },
    });

    ownerTokenA = createOwnerToken(ownerUser.id, ownerUser.email);
    ownerTokenB = createOwnerToken(otherUser.id, otherUser.email);
  }, 30_000);

  afterAll(async () => {
    mockOwnerCookieValue = undefined;
    if (restA?.id) await prisma.restaurant.delete({ where: { id: restA.id } }).catch(() => {});
    if (restB?.id) await prisma.restaurant.delete({ where: { id: restB.id } }).catch(() => {});
    if (orgA?.id) await prisma.organization.delete({ where: { id: orgA.id } }).catch(() => {});
    if (orgB?.id) await prisma.organization.delete({ where: { id: orgB.id } }).catch(() => {});
    if (ownerUser?.id) await prisma.user.delete({ where: { id: ownerUser.id } }).catch(() => {});
    if (otherUser?.id) await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => {});
  }, 30_000);

  it('normalizes domestic and +91 mobile numbers identically and validates inputs', () => {
    expect(normalizeCustomerMobile('+91 98765-43210')).toBe('9876543210');
    expect(normalizeCustomerMobile('09876543210')).toBe('9876543210');
    expect(normalizeCustomerMobile('9876543210')).toBe('9876543210');
    expect(normalizeCustomerMobile('12345')).toBeNull();

    expect(validateCustomerInput({ name: 'A', mobile: '9876543210' }).ok).toBe(false);
    expect(validateCustomerInput({ name: 'Rohan Sharma', mobile: '+91 98765 43210' })).toEqual({
      ok: true,
      name: 'Rohan Sharma',
      mobile: '9876543210',
    });
  });

  it('computes visit frequency, distinct visit days, and revenue excluding cancelled orders', () => {
    const metrics = computeCustomerVisitMetrics([
      {
        status: 'COMPLETED',
        totalMinor: 50000,
        paidMinor: 50000,
        dueMinor: 0,
        paymentStatus: 'PAID',
        placedAt: '2026-11-01T12:00:00Z',
      },
      {
        status: 'COMPLETED',
        totalMinor: 30000,
        paidMinor: 30000,
        dueMinor: 0,
        paymentStatus: 'PAID',
        placedAt: '2026-11-01T12:30:00Z',
      },
      {
        status: 'COMPLETED',
        totalMinor: 40000,
        paidMinor: 20000,
        dueMinor: 20000,
        paymentStatus: 'PARTIAL',
        placedAt: '2026-11-10T18:00:00Z',
      },
      {
        status: 'CANCELLED',
        totalMinor: 99900,
        paidMinor: 0,
        dueMinor: 0,
        paymentStatus: 'PENDING',
        placedAt: '2026-11-11T18:00:00Z',
      },
    ]);

    expect(metrics.totalOrders).toBe(3);
    expect(metrics.visitCount).toBe(2); // Nov 1 + Nov 10
    expect(metrics.totalRevenueMinor).toBe(120000);
    expect(metrics.averageOrderMinor).toBe(40000);
    expect(metrics.totalCollectedMinor).toBe(100000);
  });

  it('captures diner Name & Mobile, links repeat orders, and runs the 200 paid / 300 credit / repayment lifecycle', async () => {
    // 1. Diner enters Name & Mobile on the menu app
    const captureRes = await dinerCustomerPost(
      new Request('http://localhost/api/diner/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restA.id,
          name: 'Rajesh Verma',
          mobile: '+91 98765 43210',
        }),
      })
    );
    expect(captureRes.status).toBe(200);
    const captureBody = await captureRes.json();
    expect(captureBody.customer.name).toBe('Rajesh Verma');
    expect(captureBody.customer.mobile).toBe('9876543210');
    expect(captureBody.customer.creditBalanceMinor).toBeUndefined(); // Never exposed publicly

    const customerId = captureBody.customer.id as string;

    // 2. Customer places a ₹500 order using canonical 10-digit mobile -> linked to SAME customer
    const order1 = await placeTableOrder({
      restaurantId: restA.id,
      tableId: tableA.id,
      items: [{ menuItemId: itemA.id, quantity: 1 }],
      customerName: 'Rajesh Verma',
      customerMobile: '9876543210',
    });
    expect(order1.customerId).toBe(customerId);
    expect(order1.totalMinor).toBe(50000);

    // 3. Payment cannot skip the kitchen flow and close an order before it is served
    await expect(
      settleOrderPayment({
        restaurantId: restA.id,
        orderId: order1.id,
        paidMinor: 20000,
        markCompleted: true,
      })
    ).rejects.toThrow(/must be served/i);

    await prisma.order.update({
      where: { id: order1.id },
      data: { status: 'SERVED', servedAt: new Date() },
    });

    // Partial credit settlement still fails while customerCreditEnabled is false
    await expect(
      settleOrderPayment({
        restaurantId: restA.id,
        orderId: order1.id,
        paidMinor: 20000,
        markCompleted: true,
      })
    ).rejects.toThrow(/not enabled/i);

    // 4. Owner enables Customer Credit / Loan Tab via ordering settings API
    mockOwnerCookieValue = ownerTokenA;
    const toggleRes = await orderingSettingsPatch(
      new Request(`http://localhost/api/restaurants/${restA.id}/ordering-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerCreditEnabled: true }),
      }),
      { params: Promise.resolve({ id: restA.id }) }
    );
    expect(toggleRes.status).toBe(200);
    const toggleData = await toggleRes.json();
    expect(toggleData.settings.customerCreditEnabled).toBe(true);

    // 5. Regular customer pays ₹200 now and puts ₹300 on credit/loan tab via settle endpoint
    const settleRes = await orderSettlePost(
      new Request(`http://localhost/api/restaurants/${restA.id}/orders/${order1.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidMajor: 200,
          markCompleted: true,
          note: 'Paid 200 cash, 300 later',
        }),
      }),
      { params: Promise.resolve({ id: restA.id, orderId: order1.id }) }
    );
    expect(settleRes.status).toBe(200);
    const settleData = await settleRes.json();
    expect(settleData.order.paidMinor).toBe(20000);
    expect(settleData.order.dueMinor).toBe(30000);
    expect(settleData.order.paymentStatus).toBe('PARTIAL');
    expect(settleData.order.status).toBe('COMPLETED');
    expect(settleData.customerCreditBalanceMinor).toBe(30000);

    await expect(
      settleOrderPayment({
        restaurantId: restA.id,
        orderId: order1.id,
        paidMinor: 10000,
      })
    ).rejects.toThrow(/cannot be less/i);

    // 6. Owner fetches customer list & verifies revenue, orders, and credit due
    const listRes = await customersListGet(
      new Request(`http://localhost/api/restaurants/${restA.id}/customers`),
      { params: Promise.resolve({ id: restA.id }) }
    );
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.customerCreditEnabled).toBe(true);
    expect(listData.summary.totalCustomers).toBe(1);
    expect(listData.summary.totalCustomerRevenueMinor).toBe(50000);
    expect(listData.summary.totalOutstandingCreditMinor).toBe(30000);
    expect(listData.customers[0].name).toBe('Rajesh Verma');

    // 7. Customer repays ₹100 first, then remaining ₹200 -> Order #1 automatically transitions to PAID
    const repay1Res = await customerRepayPost(
      new Request(`http://localhost/api/restaurants/${restA.id}/customers/${customerId}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMajor: 100, note: 'Partial UPI' }),
      }),
      { params: Promise.resolve({ id: restA.id, customerId }) }
    );
    expect(repay1Res.status).toBe(200);
    const repay1Data = await repay1Res.json();
    expect(repay1Data.customer.creditBalanceMinor).toBe(20000);

    const repay2 = await recordCustomerRepayment({
      restaurantId: restA.id,
      customerId,
      amountMinor: 20000,
      note: 'Final settlement',
    });
    expect(repay2.customer.creditBalanceMinor).toBe(0);

    // Verify detail endpoint reflects 0 balance, PAID order, and 3 ledger entries
    const detailRes = await customerDetailGet(
      new Request(`http://localhost/api/restaurants/${restA.id}/customers/${customerId}`),
      { params: Promise.resolve({ id: restA.id, customerId }) }
    );
    expect(detailRes.status).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.customer.creditBalanceMinor).toBe(0);
    expect(detailData.orders[0].paidMinor).toBe(50000);
    expect(detailData.orders[0].dueMinor).toBe(0);
    expect(detailData.orders[0].paymentStatus).toBe('PAID');
    expect(detailData.ledgerEntries.length).toBe(3);

    // 8. Tenant isolation: Owner B cannot access Restaurant A's customer
    mockOwnerCookieValue = ownerTokenB;
    const crossTenantRes = await customerDetailGet(
      new Request(`http://localhost/api/restaurants/${restA.id}/customers/${customerId}`),
      { params: Promise.resolve({ id: restA.id, customerId }) }
    );
    expect([401, 403]).toContain(crossTenantRes.status);
  }, 30_000);
});
