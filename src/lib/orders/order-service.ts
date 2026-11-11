import prisma from '../db/prisma';
import { OrderStatus, StaffRole, OrderActorType } from '@prisma/client';
import { isAllowedStatusTransition } from '../auth/staff-auth';

export interface CartItemInput {
  menuItemId: string;
  variantId?: string | null;
  modifierOptionIds?: string[];
  quantity: number;
  specialInstructions?: string | null;
}

export interface CalculatedOrderItem {
  menuItemId: string;
  dishNameSnapshot: string;
  variantSnapshot?: string | null;
  modifierSnapshot?: Array<{
    groupName: string;
    optionName: string;
    priceMinor: number;
  }>;
  quantity: number;
  unitPriceMinor: number;
  modifiersTotalMinor: number;
  lineTotalMinor: number;
  specialInstructions?: string | null;
}

export interface OrderQuoteResult {
  valid: boolean;
  error?: string;
  currency: string;
  items: CalculatedOrderItem[];
  subtotalMinor: number;
  taxMinor: number;
  serviceChargeMinor: number;
  totalMinor: number;
  taxPercentage: number;
  serviceChargePercentage: number;
  orderingEnabled: boolean;
}

/**
 * Server-side calculation and revalidation of cart quote
 * Never trusts frontend prices or modifiers
 */
export async function calculateOrderQuote(
  restaurantId: string,
  items: CartItemInput[]
): Promise<OrderQuoteResult> {
  if (!items || items.length === 0) {
    return {
      valid: false,
      error: 'Cart is empty. Please select at least one dish.',
      currency: 'INR',
      items: [],
      subtotalMinor: 0,
      taxMinor: 0,
      serviceChargeMinor: 0,
      totalMinor: 0,
      taxPercentage: 0,
      serviceChargePercentage: 0,
      orderingEnabled: false,
    };
  }

  // Load restaurant settings
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { orderingSettings: true },
  });

  if (!restaurant) {
    return {
      valid: false,
      error: 'Restaurant not found.',
      currency: 'INR',
      items: [],
      subtotalMinor: 0,
      taxMinor: 0,
      serviceChargeMinor: 0,
      totalMinor: 0,
      taxPercentage: 0,
      serviceChargePercentage: 0,
      orderingEnabled: false,
    };
  }

  const settings = restaurant.orderingSettings;
  const isEnabled = settings ? settings.orderingEnabled && settings.acceptsNewOrders : true;

  if (!isEnabled) {
    return {
      valid: false,
      error: 'This restaurant is currently not accepting new table orders.',
      currency: restaurant.currency,
      items: [],
      subtotalMinor: 0,
      taxMinor: 0,
      serviceChargeMinor: 0,
      totalMinor: 0,
      taxPercentage: settings?.taxPercentage || 5.0,
      serviceChargePercentage: settings?.serviceChargePercentage || 0.0,
      orderingEnabled: false,
    };
  }

  const taxPercentage = settings?.taxPercentage ?? 5.0;
  const serviceChargePercentage = settings?.serviceChargePercentage ?? 0.0;
  const calculatedItems: CalculatedOrderItem[] = [];
  let subtotalMinor = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.min(item.quantity || 1, 50)); // limits quantity to 1-50

    // Fetch published menu item from DB
    const dish = await prisma.restaurantMenuItem.findFirst({
      where: {
        id: item.menuItemId,
        restaurantId,
        isPublished: true,
      },
      include: {
        variants: true,
        modifierGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!dish) {
      return {
        valid: false,
        error: `Dish "${item.menuItemId}" is no longer available on the menu.`,
        currency: restaurant.currency,
        items: [],
        subtotalMinor: 0,
        taxMinor: 0,
        serviceChargeMinor: 0,
        totalMinor: 0,
        taxPercentage,
        serviceChargePercentage,
        orderingEnabled: true,
      };
    }

    if (!dish.isAvailable) {
      return {
        valid: false,
        error: `Dish "${dish.customName}" is currently out of stock.`,
        currency: restaurant.currency,
        items: [],
        subtotalMinor: 0,
        taxMinor: 0,
        serviceChargeMinor: 0,
        totalMinor: 0,
        taxPercentage,
        serviceChargePercentage,
        orderingEnabled: true,
      };
    }

    let unitPriceMinor = dish.priceMinor || 0;
    let variantSnapshot: string | null = null;

    // Check variant
    if (item.variantId) {
      const variant = dish.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return {
          valid: false,
          error: `Selected option for "${dish.customName}" is invalid.`,
          currency: restaurant.currency,
          items: [],
          subtotalMinor: 0,
          taxMinor: 0,
          serviceChargeMinor: 0,
          totalMinor: 0,
          taxPercentage,
          serviceChargePercentage,
          orderingEnabled: true,
        };
      }
      unitPriceMinor += variant.supplementalPriceMinor || 0;
      variantSnapshot = variant.name;
    }

    // Check modifiers
    let modifiersTotalMinor = 0;
    const modifierSnapshot: Array<{ groupName: string; optionName: string; priceMinor: number }> = [];

    if (item.modifierOptionIds && item.modifierOptionIds.length > 0) {
      // Find all options in dish modifier groups
      const allOptionsMap = new Map<string, { option: any; group: any }>();
      for (const group of dish.modifierGroups) {
        for (const opt of group.options) {
          allOptionsMap.set(opt.id, { option: opt, group });
        }
      }

      for (const optId of item.modifierOptionIds) {
        const found = allOptionsMap.get(optId);
        if (!found || !found.option.isAvailable) {
          return {
            valid: false,
            error: `Selected modifier for "${dish.customName}" is invalid or unavailable.`,
            currency: restaurant.currency,
            items: [],
            subtotalMinor: 0,
            taxMinor: 0,
            serviceChargeMinor: 0,
            totalMinor: 0,
            taxPercentage,
            serviceChargePercentage,
            orderingEnabled: true,
          };
        }

        modifiersTotalMinor += found.option.priceMinor || 0;
        modifierSnapshot.push({
          groupName: found.group.name,
          optionName: found.option.name,
          priceMinor: found.option.priceMinor || 0,
        });
      }
    }

    // Check required modifier groups
    for (const group of dish.modifierGroups) {
      if (group.required) {
        const selectedCount = (item.modifierOptionIds || []).filter((optId) =>
          group.options.some((o) => o.id === optId)
        ).length;
        if (selectedCount < group.minSelections) {
          return {
            valid: false,
            error: `Please select at least ${group.minSelections} option for "${group.name}" on ${dish.customName}.`,
            currency: restaurant.currency,
            items: [],
            subtotalMinor: 0,
            taxMinor: 0,
            serviceChargeMinor: 0,
            totalMinor: 0,
            taxPercentage,
            serviceChargePercentage,
            orderingEnabled: true,
          };
        }
      }
    }

    const lineTotalMinor = (unitPriceMinor + modifiersTotalMinor) * qty;
    subtotalMinor += lineTotalMinor;

    calculatedItems.push({
      menuItemId: dish.id,
      dishNameSnapshot: dish.customName,
      variantSnapshot,
      modifierSnapshot: modifierSnapshot.length > 0 ? modifierSnapshot : undefined,
      quantity: qty,
      unitPriceMinor,
      modifiersTotalMinor,
      lineTotalMinor,
      specialInstructions: item.specialInstructions?.trim() || null,
    });
  }

  // Calculate tax and service charge
  const taxMinor = Math.round((subtotalMinor * taxPercentage) / 100);
  const serviceChargeMinor = Math.round((subtotalMinor * serviceChargePercentage) / 100);
  const totalMinor = subtotalMinor + taxMinor + serviceChargeMinor;

  return {
    valid: true,
    currency: restaurant.currency,
    items: calculatedItems,
    subtotalMinor,
    taxMinor,
    serviceChargeMinor,
    totalMinor,
    taxPercentage,
    serviceChargePercentage,
    orderingEnabled: true,
  };
}

/**
 * Generate sequential, restaurant-scoped order number (e.g. 1001, 1002)
 * Uses max numeric orderNumber rather than row count so deleted orders cannot cause collisions.
 */
async function generateNextOrderNumber(restaurantId: string, offset = 0): Promise<string> {
  const existing = await prisma.order.findMany({
    where: { restaurantId },
    select: { orderNumber: true },
  });

  let maxNum = 1000;
  for (const row of existing) {
    const parsed = parseInt(row.orderNumber, 10);
    if (!Number.isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  return `${maxNum + 1 + offset}`;
}

/**
 * Create a new table order with server recalculation and idempotency
 */
export async function placeTableOrder(data: {
  restaurantId: string;
  tableId: string;
  dinerSessionId?: string | null;
  sessionToken?: string | null;
  items: CartItemInput[];
  specialInstructions?: string | null;
  idempotencyKey?: string | null;
}) {
  // 1. Verify active table belongs to this restaurant
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: data.tableId,
      restaurantId: data.restaurantId,
      isActive: true,
      isArchived: false,
    },
  });

  if (!table) {
    throw new Error('Dining table not found, inactive, or not authorized for this restaurant.');
  }

  // 2. Resolve valid DinerSession ID (accepts DinerSession.id OR sessionToken)
  let validDinerSessionId: string | null = null;
  const candidateSession = data.dinerSessionId || data.sessionToken;

  if (candidateSession) {
    // Explicitly check existing session first so a cross-table mismatch is NEVER swallowed
    const existingSession = await prisma.dinerSession.findFirst({
      where: {
        restaurantId: data.restaurantId,
        OR: [
          { id: candidateSession },
          { sessionToken: candidateSession },
        ],
      },
      select: { id: true, tableId: true },
    });

    if (existingSession) {
      if (existingSession.tableId && existingSession.tableId !== data.tableId) {
        throw new Error('This device session is bound to another table and cannot place an order here.');
      }
      validDinerSessionId = existingSession.id;
    } else {
      try {
        // Safe upsert if candidate is a session token so foreign key constraint is satisfied
        const newSession = await prisma.dinerSession.upsert({
          where: { sessionToken: candidateSession },
          update: {
            lastActiveAt: new Date(),
            tableId: data.tableId,
          },
          create: {
            sessionToken: candidateSession,
            restaurantId: data.restaurantId,
            tableId: data.tableId,
          },
          select: { id: true },
        });
        validDinerSessionId = newSession.id;
      } catch (sessionErr) {
        console.warn('Could not associate diner session with order, falling back to null:', sessionErr);
        validDinerSessionId = null;
      }
    }
  }

  // 3. Revalidate and calculate server-side quote
  const quote = await calculateOrderQuote(data.restaurantId, data.items);
  if (!quote.valid) {
    throw new Error(quote.error || 'Invalid order items or pricing.');
  }

  // 4. Create Order and its line items inside a database transaction (with safe retry for session FK or orderNumber race)
  let sessionIdForOrder = validDinerSessionId;

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = await generateNextOrderNumber(data.restaurantId, attempt);

    try {
      const order = await prisma.$transaction(async (tx) => {
        // Re-verify session existence inside the transaction to guarantee FK integrity
        let confirmedSessionId: string | null = null;
        if (sessionIdForOrder) {
          const verified = await tx.dinerSession.findUnique({
            where: { id: sessionIdForOrder },
            select: { id: true },
          });
          confirmedSessionId = verified?.id || null;
        }

        const orderPlacedAt = new Date();
        const createdOrder = await tx.order.create({
          data: {
            restaurantId: data.restaurantId,
            tableId: data.tableId,
            dinerSessionId: confirmedSessionId,
            orderNumber,
            status: 'PLACED',
            currency: quote.currency,
            subtotalMinor: quote.subtotalMinor,
            taxMinor: quote.taxMinor,
            serviceChargeMinor: quote.serviceChargeMinor,
            totalMinor: quote.totalMinor,
            paymentMethod: 'PAY_AT_COUNTER',
            paymentStatus: 'PENDING',
            specialInstructions: data.specialInstructions?.trim() || null,
            placedAt: orderPlacedAt,
            items: {
              create: quote.items.map((item) => ({
                restaurantMenuItemId: item.menuItemId,
                dishNameSnapshot: item.dishNameSnapshot,
                variantSnapshot: item.variantSnapshot || null,
                modifierSnapshot: item.modifierSnapshot || undefined,
                quantity: item.quantity,
                unitPriceMinor: item.unitPriceMinor,
                modifiersTotalMinor: item.modifiersTotalMinor,
                lineTotalMinor: item.lineTotalMinor,
                specialInstructions: item.specialInstructions || null,
              })),
            },
            statusHistory: {
              create: {
                previousStatus: null,
                newStatus: 'PLACED',
                actorType: 'DINER',
                reason: `Order placed from ${table.name}`,
              },
            },
            events: {
              create: {
                restaurantId: data.restaurantId,
                eventType: 'ORDER_PLACED',
                payload: {
                  orderNumber,
                  tableName: table.name,
                  totalMinor: quote.totalMinor,
                  itemCount: quote.items.length,
                },
              },
            },
          },
          include: {
            items: true,
            table: true,
            statusHistory: true,
          },
        });

        if (confirmedSessionId) {
          await tx.dinerSession.update({
            where: { id: confirmedSessionId },
            data: {
              lastActiveAt: orderPlacedAt,
              tableId: data.tableId,
            },
          });
        }

        return createdOrder;
      });

      return order;
    } catch (err: any) {
      const errMsg = String(err?.message || '');
      const isSessionFkError =
        (err?.code === 'P2003' || errMsg.includes('Order_dinerSessionId_fkey')) &&
        sessionIdForOrder !== null;
      const isOrderNumberCollision =
        err?.code === 'P2002' && errMsg.includes('orderNumber');

      if (isSessionFkError && attempt < 2) {
        console.warn('Order_dinerSessionId_fkey encountered; retrying order creation without dinerSessionId.');
        sessionIdForOrder = null;
        continue;
      }

      if (isOrderNumberCollision && attempt < 2) {
        continue;
      }

      throw err;
    }
  }

  throw new Error('Failed to place table order after retry. Please try again.');
}

/**
 * Transition order status with permission enforcement & audit trail
 */
export async function updateOrderStatus(data: {
  orderId: string;
  restaurantId: string;
  targetStatus?: OrderStatus;
  nextStatus?: OrderStatus;
  staffId?: string | null;
  staffRole?: StaffRole;
  actorType?: OrderActorType;
  reason?: string;
  note?: string;
}) {
  const target = data.targetStatus || data.nextStatus;
  if (!target) {
    throw new Error('targetStatus or nextStatus must be provided.');
  }

  const reasonText = data.reason || data.note || null;

  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      restaurantId: data.restaurantId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      table: {
        select: { name: true },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found or not authorized.');
  }

  // Validate status transition
  const check = isAllowedStatusTransition(order.status, target, data.staffRole || 'MANAGER');
  if (!check.allowed) {
    throw new Error(check.error || 'Invalid order status transition.');
  }

  // Idempotent no-op if the ticket is already at the requested status
  if (order.status === target) {
    const existing = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        table: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { staff: { select: { displayName: true, role: true } } },
        },
      },
    });
    if (!existing) {
      throw new Error('Order not found or not authorized.');
    }
    return existing;
  }

  // Determine timestamp to update
  const timestampUpdates: any = {};
  const now = new Date();
  if (target === 'ACCEPTED') timestampUpdates.acceptedAt = now;
  else if (target === 'PREPARING') timestampUpdates.preparingAt = now;
  else if (target === 'READY') timestampUpdates.readyAt = now;
  else if (target === 'SERVED') timestampUpdates.servedAt = now;
  else if (target === 'COMPLETED') timestampUpdates.completedAt = now;
  else if (target === 'CANCELLED' || target === 'REJECTED') timestampUpdates.cancelledAt = now;

  // Nested Prisma update already executes in an atomic DB transaction without interactive tx overhead
  const updated = await prisma.order.update({
    where: { id: data.orderId },
    data: {
      status: target,
      ...timestampUpdates,
      statusHistory: {
        create: {
          previousStatus: order.status,
          newStatus: target,
          changedByStaffId: data.staffId || null,
          actorType: data.actorType || (data.staffId ? 'STAFF' : 'SYSTEM'),
          reason: reasonText || `Status updated to ${target}`,
        },
      },
      events: {
        create: {
          restaurantId: data.restaurantId,
          eventType: 'ORDER_STATUS_CHANGED',
          payload: {
            previousStatus: order.status,
            newStatus: target,
            orderNumber: order.orderNumber,
            tableName: order.table.name,
          },
        },
      },
    },
    include: {
      items: true,
      table: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { staff: { select: { displayName: true, role: true } } },
      },
    },
  });

  return updated;
}
