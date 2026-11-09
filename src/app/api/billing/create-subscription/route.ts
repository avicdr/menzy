import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { createSubscriptionSession } from '@/lib/payments/razorpay';
import { PlanKey } from '@/lib/payments/plans';

export async function POST(req: Request) {
  try {
    const { restaurantId, planKey } = await req.json();

    if (!restaurantId || !planKey) {
      return NextResponse.json({ error: 'restaurantId and planKey are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const session = await createSubscriptionSession({
      organizationId: auth.restaurant.organizationId,
      planKey: planKey as PlanKey,
      customerEmail: auth.user?.email || 'customer@example.com',
      customerName: auth.user?.name || undefined,
    });

    return NextResponse.json({ success: true, ...session });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
