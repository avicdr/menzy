import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { trackDishInteraction } from '@/lib/analytics/tracker';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

const DishInteractionSchema = z.object({
  restaurantId: z.string().min(1),
  menuItemId: z.string().min(1),
  eventType: z.enum(['VIEW', 'EXPAND', 'CHAT_QUERY', 'PAIRING_CLICK']),
  sessionToken: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = DishInteractionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid interaction payload' }, { status: 400 });
    }

    const { restaurantId, menuItemId, eventType, sessionToken } = parsed.data;

    // Exclude internal owner playground test sessions from diner telemetry
    if (sessionToken === 'owner-test-session') {
      return NextResponse.json({ success: true, ignored: true });
    }

    const subAccess = await checkRestaurantSubscriptionAccess(restaurantId, { byIdOnly: true });
    if (subAccess.found && !subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || restaurantId,
        restaurantSlug: subAccess.restaurant?.slug,
        restaurantName: subAccess.restaurant?.displayName,
        audience: 'DINER',
      });
    }

    // Verify the menu item belongs to the target restaurant and is published
    const menuItem = await prisma.restaurantMenuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId,
        isPublished: true,
      },
      select: { id: true },
    });

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found for restaurant' }, { status: 404 });
    }

    let dinerSessionId: string | undefined;
    if (sessionToken) {
      const dinerSession = await prisma.dinerSession.findUnique({
        where: { sessionToken },
        select: { id: true, restaurantId: true },
      });
      if (dinerSession && dinerSession.restaurantId === restaurantId) {
        dinerSessionId = dinerSession.id;
      }
    }

    await trackDishInteraction({
      restaurantId,
      menuItemId: menuItem.id,
      eventType,
      sessionId: dinerSessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Diner dish interaction POST error:', error);
    return NextResponse.json({ error: 'Failed to record dish interaction' }, { status: 500 });
  }
}

