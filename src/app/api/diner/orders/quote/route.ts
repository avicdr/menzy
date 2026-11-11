import { NextResponse } from 'next/server';
import { calculateOrderQuote } from '@/lib/orders/order-service';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, items } = body;

    if (!restaurantId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'restaurantId and items array are required.' },
        { status: 400 }
      );
    }

    const [subAccess, quote] = await Promise.all([
      checkRestaurantSubscriptionAccess(restaurantId, { byIdOnly: true }),
      calculateOrderQuote(restaurantId, items),
    ]);
    if (subAccess.found && !subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || restaurantId,
        restaurantSlug: subAccess.restaurant?.slug,
        restaurantName: subAccess.restaurant?.displayName,
        audience: 'DINER',
      });
    }

    return NextResponse.json(quote, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: any) {
    console.error('Order quote error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

