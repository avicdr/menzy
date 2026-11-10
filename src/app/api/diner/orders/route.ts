import { NextResponse } from 'next/server';
import { placeTableOrder } from '@/lib/orders/order-service';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  readCookieFromRequest,
  TABLE_SESSION_TIMEOUT_MINUTES,
  TABLE_SESSION_TIMEOUT_MS,
} from '@/lib/diner/table-session';

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

    const sessionCheck = await evaluateDeviceTableSession({
      restaurantId,
      tableId,
      cookieSessionToken: cookieToken,
      sessionToken: sessionToken || null,
      dinerSessionId: dinerSessionId || null,
    });

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
    });

    const lastOrderAt = order.placedAt;
    const expiresAt = new Date(lastOrderAt.getTime() + TABLE_SESSION_TIMEOUT_MS);

    return NextResponse.json({
      success: true,
      message: 'Your order has been sent to the kitchen!',
      tableSession: {
        lastOrderAt: lastOrderAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
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
