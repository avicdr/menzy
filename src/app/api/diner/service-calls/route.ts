import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createServiceCall } from '@/lib/tables/service-call-service';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  readCookieFromRequest,
} from '@/lib/diner/table-session';

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

    // Resolve table
    let resolvedTable: any = null;
    if (tableId) {
      resolvedTable = await prisma.restaurantTable.findFirst({
        where: {
          id: tableId,
          restaurantId: targetRestaurantId,
          isActive: true,
          isArchived: false,
        },
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

    const cookieName = getDinerSessionCookieName(targetRestaurantId);
    const cookieToken = readCookieFromRequest(req, cookieName);

    const sessionCheck = await evaluateDeviceTableSession({
      restaurantId: targetRestaurantId,
      tableId: resolvedTable.id,
      cookieSessionToken: cookieToken,
      sessionToken: sessionToken || null,
      dinerSessionId: dinerSessionId || null,
    });

    if (!sessionCheck.valid) {
      const isTableMismatch = sessionCheck.code === 'TABLE_MISMATCH';
      return NextResponse.json(
        {
          error:
            sessionCheck.error ||
            'Your table session has expired. Please rescan your table QR code to call a waiter.',
          code: sessionCheck.code || 'TABLE_SCAN_EXPIRED',
          tableName: resolvedTable.name,
          currentTableName: sessionCheck.currentTableName || null,
          currentTable: sessionCheck.currentTable || null,
          requiresRescan: !isTableMismatch || !sessionCheck.currentTable,
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
