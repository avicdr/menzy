import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createServiceCall } from '@/lib/tables/service-call-service';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  readCookieFromRequest,
} from '@/lib/diner/table-session';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      restaurantSlug,
      tableId,
      sessionToken,
      dinerSessionId,
      callType,
      notes,
    } = body;

    // Resolve restaurant
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId && restaurantSlug) {
      const rest = await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        select: { id: true },
      });
      targetRestaurantId = rest?.id;
    }

    if (!targetRestaurantId) {
      return NextResponse.json({ error: 'restaurantId or restaurantSlug is required' }, { status: 400 });
    }

    const cookieName = getDinerSessionCookieName(targetRestaurantId);
    const cookieToken = readCookieFromRequest(req, cookieName);

    const [subAccess, resolvedTable, sessionCheck] = await Promise.all([
      checkRestaurantSubscriptionAccess(targetRestaurantId, { byIdOnly: true }),
      tableId
        ? prisma.restaurantTable.findFirst({
            where: {
              id: tableId,
              restaurantId: targetRestaurantId,
              isActive: true,
              isArchived: false,
            },
            select: { id: true, name: true, section: true },
          })
        : Promise.resolve(null),
      tableId
        ? evaluateDeviceTableSession({
            restaurantId: targetRestaurantId,
            tableId,
            cookieSessionToken: cookieToken,
            sessionToken: sessionToken || null,
            dinerSessionId: dinerSessionId || null,
          })
        : Promise.resolve(null),
    ]);

    if (subAccess.found && !subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || targetRestaurantId,
        restaurantSlug: subAccess.restaurant?.slug,
        restaurantName: subAccess.restaurant?.displayName,
        audience: 'DINER',
      });
    }

    if (!resolvedTable) {
      return NextResponse.json(
        {
          error: 'A valid table session is required to call a waiter. Please re-scan your table QR.',
          code: 'TABLE_SCAN_REQUIRED',
          requiresRescan: true,
        },
        { status: 403 }
      );
    }

    if (!sessionCheck || !sessionCheck.valid) {
      const isTableMismatch = sessionCheck?.code === 'TABLE_MISMATCH';
      return NextResponse.json(
        {
          error:
            sessionCheck?.error ||
            'Your table session has expired. Please rescan your table QR code to call a waiter.',
          code: sessionCheck?.code || 'TABLE_SCAN_EXPIRED',
          tableName: resolvedTable.name,
          currentTableName: sessionCheck?.currentTableName || null,
          currentTable: sessionCheck?.currentTable || null,
          timeoutMinutes: sessionCheck?.timeoutMinutes ?? null,
          timeoutKind: sessionCheck?.timeoutKind ?? null,
          scanTimeoutMinutes: sessionCheck?.scanTimeoutMinutes ?? null,
          orderExtensionMinutes: sessionCheck?.orderExtensionMinutes ?? null,
          requiresRescan: !isTableMismatch || !sessionCheck?.currentTable,
        },
        { status: 403 }
      );
    }

    const serviceCall = await createServiceCall({
      restaurantId: targetRestaurantId,
      tableId: resolvedTable.id,
      tableName: resolvedTable.name,
      tableSection: resolvedTable.section,
      callType: ['ASSISTANCE', 'WATER', 'CUTLERY', 'BILL'].includes(callType) ? callType : 'ASSISTANCE',
      notes,
    });

    return NextResponse.json({
      success: true,
      serviceCall,
      message: `Waiter alerted for ${resolvedTable.name}. Staff is on the way!`,
    });
  } catch (error: any) {
    console.error('Diner service call error:', error);
    return NextResponse.json({ error: error.message || 'Failed to call waiter' }, { status: 500 });
  }
}
