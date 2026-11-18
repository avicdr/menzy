import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  CustomerServiceError,
  upsertRestaurantCustomer,
} from '@/lib/customers/customer-service';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const restaurantId = typeof body?.restaurantId === 'string' ? body.restaurantId.trim() : '';
    const name = typeof body?.name === 'string' ? body.name : '';
    const mobile = typeof body?.mobile === 'string' ? body.mobile : '';

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required.' }, { status: 400 });
    }

    const subAccess = await checkRestaurantSubscriptionAccess(restaurantId, { byIdOnly: true });
    if (!subAccess.found) {
      return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    }
    if (!subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || restaurantId,
        restaurantSlug: subAccess.restaurant?.slug,
        restaurantName: subAccess.restaurant?.displayName,
        audience: 'DINER',
      });
    }

    const customer = await upsertRestaurantCustomer(prisma, {
      restaurantId,
      name,
      mobile,
    });

    // Return only public identity fields (never leak order history or credit balances to unauthenticated callers)
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
      },
    });
  } catch (error: any) {
    if (error instanceof CustomerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Diner customer upsert error:', error);
    return NextResponse.json({ error: 'Failed to save customer details.' }, { status: 500 });
  }
}
