import prisma from '@/lib/db/prisma';
import { CustomerLedgerType, PaymentStatus, Prisma } from '@prisma/client';

export class CustomerServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Normalize a customer mobile number so "+91 98765 43210", "09876543210", and "9876543210"
 * resolve to the same customer record within a restaurant.
 */
export function normalizeCustomerMobile(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;

  let normalized = digits;
  // Normalize 11-digit leading-zero domestic numbers (e.g. 09876543210 -> 9876543210)
  if (normalized.length === 11 && normalized.startsWith('0')) {
    normalized = normalized.slice(1);
  }
  // Normalize +91 Indian mobile numbers to canonical 10 digits
  if (normalized.length === 12 && normalized.startsWith('91') && /^[6-9]/.test(normalized.slice(2))) {
    normalized = normalized.slice(2);
  }

  if (normalized.length < 7 || normalized.length > 15) {
    return null;
  }
  return normalized;
}

export function validateCustomerInput(input: {
  name?: string | null;
  mobile?: string | null;
}): { ok: true; name: string; mobile: string } | { ok: false; error: string } {
  const cleanName = String(input.name || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleanName || cleanName.length < 2) {
    return { ok: false, error: 'Please enter your name (at least 2 characters).' };
  }
  if (cleanName.length > 80) {
    return { ok: false, error: 'Name must be 80 characters or fewer.' };
  }

  const normalizedMobile = normalizeCustomerMobile(String(input.mobile || ''));
  if (!normalizedMobile) {
    return { ok: false, error: 'Please enter a valid mobile number (7–15 digits).' };
  }

  return { ok: true, name: cleanName, mobile: normalizedMobile };
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function upsertRestaurantCustomer(
  db: DbClient,
  params: {
    restaurantId: string;
    name: string;
    mobile: string;
  }
) {
  const validated = validateCustomerInput({ name: params.name, mobile: params.mobile });
  if (!validated.ok) {
    throw new CustomerServiceError(validated.error, 400);
  }

  return db.customer.upsert({
    where: {
      restaurantId_mobile: {
        restaurantId: params.restaurantId,
        mobile: validated.mobile,
      },
    },
    update: {
      name: validated.name,
    },
    create: {
      restaurantId: params.restaurantId,
      name: validated.name,
      mobile: validated.mobile,
    },
  });
}

export interface CustomerOrderSummaryInput {
  status: string;
  totalMinor: number;
  paidMinor: number;
  dueMinor: number;
  paymentStatus: string;
  placedAt: Date | string;
}

export interface CustomerVisitMetrics {
  totalOrders: number;
  visitCount: number;
  visitsPerMonth: number;
  frequencyLabel: string;
  totalRevenueMinor: number;
  totalCollectedMinor: number;
  averageOrderMinor: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
}

export function computeCustomerVisitMetrics(
  orders: CustomerOrderSummaryInput[],
  now = new Date()
): CustomerVisitMetrics {
  const validOrders = orders.filter(
    (o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED'
  );

  if (validOrders.length === 0) {
    return {
      totalOrders: 0,
      visitCount: 0,
      visitsPerMonth: 0,
      frequencyLabel: 'No orders yet',
      totalRevenueMinor: 0,
      totalCollectedMinor: 0,
      averageOrderMinor: 0,
      firstVisitAt: null,
      lastVisitAt: null,
    };
  }

  let totalRevenueMinor = 0;
  let totalCollectedMinor = 0;
  let firstMs = Infinity;
  let lastMs = -Infinity;
  const distinctDays = new Set<string>();

  for (const ord of validOrders) {
    totalRevenueMinor += ord.totalMinor;
    if (ord.paidMinor > 0) {
      totalCollectedMinor += ord.paidMinor;
    } else if (ord.paymentStatus === 'PAID') {
      totalCollectedMinor += ord.totalMinor;
    } else if (ord.dueMinor === 0 && ord.status === 'COMPLETED') {
      totalCollectedMinor += ord.totalMinor;
    }

    const d = ord.placedAt instanceof Date ? ord.placedAt : new Date(ord.placedAt);
    const ms = d.getTime();
    if (!Number.isNaN(ms)) {
      if (ms < firstMs) firstMs = ms;
      if (ms > lastMs) lastMs = ms;
      distinctDays.add(d.toISOString().slice(0, 10));
    }
  }

  const visitCount = Math.max(1, distinctDays.size);
  const spanDays = Number.isFinite(firstMs)
    ? Math.max(30, (now.getTime() - firstMs) / 86_400_000)
    : 30;
  const visitsPerMonth = Number((visitCount / (spanDays / 30)).toFixed(1));

  let frequencyLabel: string;
  if (visitCount === 1) {
    frequencyLabel = validOrders.length > 1 ? `1 visit (${validOrders.length} orders)` : '1st visit';
  } else {
    frequencyLabel = `${visitCount} visits • ${visitsPerMonth}/mo`;
  }

  return {
    totalOrders: validOrders.length,
    visitCount,
    visitsPerMonth,
    frequencyLabel,
    totalRevenueMinor,
    totalCollectedMinor,
    averageOrderMinor: Math.round(totalRevenueMinor / validOrders.length),
    firstVisitAt: Number.isFinite(firstMs) ? new Date(firstMs).toISOString() : null,
    lastVisitAt: Number.isFinite(lastMs) ? new Date(lastMs).toISOString() : null,
  };
}

/**
 * Settle payment on an order — supports full payment or partial payment + remaining balance on customer credit/loan tab.
 * Example: On a ₹500 bill (50000 minor), customer pays ₹200 (20000 minor) now and ₹300 (30000 minor) goes on their tab.
 */
export async function settleOrderPayment(params: {
  restaurantId: string;
  orderId: string;
  paidMinor: number;
  markCompleted?: boolean;
  customerName?: string | null;
  customerMobile?: string | null;
  note?: string | null;
  recordedBy?: string | null;
  staffId?: string | null;
}) {
  const paidMinor = Math.round(Number(params.paidMinor));
  if (!Number.isFinite(paidMinor) || paidMinor < 0) {
    throw new CustomerServiceError('Paid amount must be a valid non-negative number.', 400);
  }

  return prisma.$transaction(async (tx) => {
    const [order, orderingSettings] = await Promise.all([
      tx.order.findFirst({
        where: { id: params.orderId, restaurantId: params.restaurantId },
        include: {
          customer: true,
          table: { select: { name: true } },
        },
      }),
      tx.restaurantOrderingSettings.findUnique({
        where: { restaurantId: params.restaurantId },
        select: { customerCreditEnabled: true },
      }),
    ]);

    if (!order) {
      throw new CustomerServiceError('Order not found for this restaurant.', 404);
    }

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      throw new CustomerServiceError('Cannot settle payment on a cancelled or rejected order.', 400);
    }

    if (order.status !== 'SERVED' && order.status !== 'COMPLETED') {
      throw new CustomerServiceError(
        'Order must be served before its payment can be settled.',
        400
      );
    }

    if (paidMinor > order.totalMinor) {
      throw new CustomerServiceError('Paid amount cannot exceed the total bill amount.', 400);
    }

    const previouslyPaidMinor =
      order.paymentStatus === PaymentStatus.PAID && order.paidMinor === 0
        ? order.totalMinor
        : order.paidMinor;
    if (paidMinor < previouslyPaidMinor) {
      throw new CustomerServiceError(
        'Total paid cannot be less than the amount already recorded.',
        400
      );
    }

    const newDueMinor = order.totalMinor - paidMinor;

    // If remaining balance is going onto customer credit/loan, require credit feature enabled + linked customer
    let customerId = order.customerId;
    let customerNameSnapshot = order.customerNameSnapshot;
    let customerMobileSnapshot = order.customerMobileSnapshot;

    if (!customerId && params.customerName && params.customerMobile) {
      const linked = await upsertRestaurantCustomer(tx, {
        restaurantId: params.restaurantId,
        name: params.customerName,
        mobile: params.customerMobile,
      });
      customerId = linked.id;
      customerNameSnapshot = linked.name;
      customerMobileSnapshot = linked.mobile;
    }

    if (newDueMinor > 0) {
      if (!orderingSettings?.customerCreditEnabled) {
        throw new CustomerServiceError(
          'Customer credit/tab is not enabled for this restaurant. Turn it on in Customers & Credit first.',
          400
        );
      }
      if (!customerId) {
        throw new CustomerServiceError(
          'Customer name and mobile number are required to put a remaining balance on credit.',
          400
        );
      }
    }

    const previousDueMinor = order.dueMinor;
    const dueDelta = newDueMinor - previousDueMinor;

    let nextPaymentStatus: PaymentStatus;
    if (newDueMinor === 0) {
      nextPaymentStatus = PaymentStatus.PAID;
    } else if (paidMinor > 0) {
      nextPaymentStatus = PaymentStatus.PARTIAL;
    } else {
      nextPaymentStatus = PaymentStatus.PENDING;
    }

    const now = new Date();
    const shouldComplete = Boolean(params.markCompleted) && order.status !== 'COMPLETED';

    let updatedCustomerBalance: number | null = null;
    if (customerId && dueDelta !== 0) {
      const currentCustomer = await tx.customer.findFirst({
        where: { id: customerId, restaurantId: params.restaurantId },
        select: { id: true, creditBalanceMinor: true },
      });
      if (!currentCustomer) {
        throw new CustomerServiceError('Customer record not found.', 404);
      }

      const nextBalance = Math.max(0, currentCustomer.creditBalanceMinor + dueDelta);
      await tx.customer.update({
        where: { id: currentCustomer.id },
        data: { creditBalanceMinor: nextBalance },
      });
      updatedCustomerBalance = nextBalance;

      await tx.customerCreditLedger.create({
        data: {
          restaurantId: params.restaurantId,
          customerId: currentCustomer.id,
          orderId: order.id,
          type:
            dueDelta > 0
              ? CustomerLedgerType.CREDIT_ADDED
              : CustomerLedgerType.PAYMENT_RECEIVED,
          amountMinor: Math.abs(dueDelta),
          balanceAfterMinor: nextBalance,
          note:
            params.note?.trim() ||
            (dueDelta > 0
              ? `Order #${order.orderNumber} split payment (remaining balance added to tab)`
              : `Order #${order.orderNumber} payment updated`),
          recordedBy: params.recordedBy || null,
        },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        customerId,
        customerNameSnapshot,
        customerMobileSnapshot,
        paidMinor,
        dueMinor: newDueMinor,
        paymentStatus: nextPaymentStatus,
        ...(shouldComplete
          ? {
              status: 'COMPLETED',
              completedAt: now,
              statusHistory: {
                create: {
                  previousStatus: order.status,
                  newStatus: 'COMPLETED',
                  changedByStaffId: params.staffId || null,
                  actorType: 'STAFF',
                  reason:
                    newDueMinor > 0
                      ? `Bill settled with partial payment (balance added to customer tab)`
                      : 'Bill paid in full & closed out',
                },
              },
            }
          : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            creditBalanceMinor: true,
          },
        },
        table: { select: { id: true, name: true, section: true } },
        items: true,
      },
    });

    return {
      order: updatedOrder,
      customerCreditBalanceMinor:
        updatedCustomerBalance ?? updatedOrder.customer?.creditBalanceMinor ?? 0,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/**
 * Record a customer's later repayment against their outstanding credit/loan balance.
 * Automatically reconciles unpaid orders FIFO so order payment statuses stay accurate.
 */
export async function recordCustomerRepayment(params: {
  restaurantId: string;
  customerId: string;
  amountMinor: number;
  note?: string | null;
  recordedBy?: string | null;
}) {
  const amountMinor = Math.round(Number(params.amountMinor));
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new CustomerServiceError('Repayment amount must be greater than zero.', 400);
  }

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: params.customerId, restaurantId: params.restaurantId },
    });
    if (!customer) {
      throw new CustomerServiceError('Customer not found.', 404);
    }

    if (customer.creditBalanceMinor <= 0) {
      throw new CustomerServiceError('This customer has no outstanding credit balance.', 400);
    }

    if (amountMinor > customer.creditBalanceMinor) {
      throw new CustomerServiceError(
        'Repayment amount exceeds the customer’s outstanding credit balance.',
        400
      );
    }

    const nextBalance = customer.creditBalanceMinor - amountMinor;

    const updatedCustomer = await tx.customer.update({
      where: { id: customer.id },
      data: { creditBalanceMinor: nextBalance },
    });

    const ledgerEntry = await tx.customerCreditLedger.create({
      data: {
        restaurantId: params.restaurantId,
        customerId: customer.id,
        type: CustomerLedgerType.PAYMENT_RECEIVED,
        amountMinor,
        balanceAfterMinor: nextBalance,
        note: params.note?.trim() || 'Credit balance repayment received',
        recordedBy: params.recordedBy || null,
      },
    });

    // Allocate repayment FIFO across orders with dueMinor > 0
    const dueOrders = await tx.order.findMany({
      where: {
        restaurantId: params.restaurantId,
        customerId: customer.id,
        dueMinor: { gt: 0 },
      },
      orderBy: { placedAt: 'asc' },
      select: { id: true, totalMinor: true, paidMinor: true, dueMinor: true },
    });

    let remaining = amountMinor;
    for (const ord of dueOrders) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, ord.dueMinor);
      const nextDue = ord.dueMinor - applied;
      const nextPaid = Math.min(ord.totalMinor, ord.paidMinor + applied);
      await tx.order.update({
        where: { id: ord.id },
        data: {
          paidMinor: nextPaid,
          dueMinor: nextDue,
          paymentStatus: nextDue === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        },
      });
      remaining -= applied;
    }

    return {
      customer: updatedCustomer,
      ledgerEntry,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
