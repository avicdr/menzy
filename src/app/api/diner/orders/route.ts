import { NextResponse } from 'next/server';
import { placeTableOrder } from '@/lib/orders/order-service';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  readCookieFromRequest,
} from '@/lib/diner/table-session';
import {
  computeTableSessionWindow,
  DEFAULT_ORDER_EXTENSION_MINUTES,
  DEFAULT_SCAN_TIMEOUT_MINUTES,
} from '@/lib/diner/table-session-config';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      tableId,
      dinerSessionId,
      sessionToken,
      items,
      specialInstructions,
      idempotencyKey,
    } = body;

    if (!restaurantId || !tableId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'restaurantId, tableId, and items array are required.' },
        { status: 400 }
      );
    }

    const cookieName = getDinerSessionCookieName(restaurantId);
    const cookieToken = readCookieFromRequest(req, cookieName);

    const [subAccess, sessionCheck] = await Promise.all([
      checkRestaurantSubscriptionAccess(restaurantId, { byIdOnly: true }),
      evaluateDeviceTableSession({
        restaurantId,
        tableId,
        cookieSessionToken: cookieToken,
        sessionToken: sessionToken || null,
        dinerSessionId: dinerSessionId || null,
      }),
    ]);

    if (subAccess.found && !subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || restaurantId,
        restaurantSlug: subAccess.restaurant?.slug,
        restaurantName: subAccess.restaurant?.displayName,
        audience: 'DINER',
      });
    }

    if (!sessionCheck.valid || !sessionCheck.session) {
      const isTableMismatch = sessionCheck.code === 'TABLE_MISMATCH';
      return NextResponse.json(
        {
          error:
            sessionCheck.error ||
            'Your table session has expired. Please rescan your table QR code to order.',
          code: sessionCheck.code || 'TABLE_SCAN_EXPIRED',
          tableName: sessionCheck.tableName || null,
          currentTableName: sessionCheck.currentTableName || null,
          currentTable: sessionCheck.currentTable || null,
          timeoutMinutes: sessionCheck.timeoutMinutes ?? null,
          timeoutKind: sessionCheck.timeoutKind ?? null,
          scanTimeoutMinutes: sessionCheck.scanTimeoutMinutes ?? null,
          orderExtensionMinutes: sessionCheck.orderExtensionMinutes ?? null,
          requiresRescan: !isTableMismatch || !sessionCheck.currentTable,
        },
        { status: 403 }
      );
    }

    const order = await placeTableOrder({
      restaurantId,
      tableId,
      dinerSessionId: sessionCheck.session.id,
      sessionToken: sessionCheck.session.sessionToken,
      items,
      specialInstructions,
      idempotencyKey,
      preverifiedTable: sessionCheck.table
        ? { id: sessionCheck.table.id, name: sessionCheck.table.name }
        : undefined,
      preverifiedDinerSessionId: sessionCheck.session.id,
    });

    const scanTimeoutMinutes =
      sessionCheck.scanTimeoutMinutes ?? DEFAULT_SCAN_TIMEOUT_MINUTES;
    const orderExtensionMinutes =
      sessionCheck.orderExtensionMinutes ?? DEFAULT_ORDER_EXTENSION_MINUTES;
    const lastOrderAt = order.placedAt;
    const renewedWindow = computeTableSessionWindow({
      lastScanAt: sessionCheck.lastScanAt ?? lastOrderAt,
      lastOrderAt,
      scanTimeoutMinutes,
      orderExtensionMinutes,
    });

    return NextResponse.json({
      success: true,
      message: 'Your order has been sent to the kitchen!',
      tableSession: {
        lastOrderAt: lastOrderAt.toISOString(),
        expiresAt: renewedWindow.expiresAt.toISOString(),
        timeoutMinutes: renewedWindow.timeoutMinutes,
        timeoutKind: renewedWindow.timeoutKind,
        scanTimeoutMinutes: renewedWindow.scanTimeoutMinutes,
        orderExtensionMinutes: renewedWindow.orderExtensionMinutes,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        currency: order.currency,
        subtotalMinor: order.subtotalMinor,
        taxMinor: order.taxMinor,
        serviceChargeMinor: order.serviceChargeMinor,
        totalMinor: order.totalMinor,
        placedAt: order.placedAt,
        tableName: order.table.name,
        itemCount: order.items.length,
        items: order.items.map((it) => ({
          dishName: it.dishNameSnapshot,
          variant: it.variantSnapshot,
          quantity: it.quantity,
          lineTotalMinor: it.lineTotalMinor,
        })),
      },
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    const rawMessage = String(error?.message || '');
    const isPrismaInternal =
      typeof error?.code === 'string' ||
      rawMessage.includes('prisma.') ||
      rawMessage.includes('invocation');
    return NextResponse.json(
      {
        error: isPrismaInternal
          ? 'Could not submit your order right now. Please refresh the menu and try again.'
          : rawMessage || 'Failed to place table order. Please try again.',
      },
      { status: 400 }
    );
  }
}
