import prisma from '../db/prisma';

export async function trackScanEvent(params: {
  restaurantId: string;
  tableId?: string | null;
  sessionToken?: string;
  referrer?: string;
  userAgent?: string;
  ipHash?: string;
}) {
  try {
    await prisma.scanEvent.create({
      data: {
        restaurantId: params.restaurantId,
        tableId: params.tableId ?? null,
        sessionToken: params.sessionToken ?? null,
        referrer: params.referrer ?? null,
        userAgent: params.userAgent ?? null,
        ipHash: params.ipHash ?? null,
      },
    });
  } catch (err) {
    console.error('Failed to log scan event:', err);
  }
}

export async function trackDishInteraction(params: {
  restaurantId: string;
  menuItemId: string;
  eventType: 'VIEW' | 'EXPAND' | 'CHAT_QUERY' | 'PAIRING_CLICK';
  sessionId?: string;
}) {
  try {
    await prisma.dishInteractionEvent.create({
      data: {
        restaurantId: params.restaurantId,
        menuItemId: params.menuItemId,
        eventType: params.eventType,
        sessionId: params.sessionId ?? null,
      },
    });
  } catch (err) {
    console.error('Failed to log dish interaction:', err);
  }
}
