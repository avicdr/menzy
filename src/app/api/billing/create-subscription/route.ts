import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { createSubscriptionSession } from '@/lib/payments/razorpay';
import { PLAN_CATALOG, PlanKey, TRIAL_PLAN_KEY } from '@/lib/payments/plans';

export async function POST(req: Request) {
  try {
    const { restaurantId, planKey } = await req.json();

    if (!restaurantId || !planKey) {
      return NextResponse.json({ error: 'restaurantId and planKey are required' }, { status: 400 });
    }

    if (planKey === TRIAL_PLAN_KEY) {
      return NextResponse.json(
        { error: 'Trial plan is activated automatically for 14 days with no payment method required.' },
        { status: 400 }
      );
    }

    const plan = PLAN_CATALOG[planKey as PlanKey];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid subscription plan key.' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      allowDuringExpiredSubscription: true,
    });
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const accountCountry = (
      auth.restaurant.organization?.billingCountry ||
      auth.restaurant.country ||
      'IN'
    ).toUpperCase();
    const allowedRegion: 'IN' | 'US' = accountCountry === 'US' ? 'US' : 'IN';

    if (plan.country !== allowedRegion) {
      return NextResponse.json(
        { error: 'Selected plan is not available in your billing region.' },
        { status: 403 }
      );
    }

    const session = await createSubscriptionSession({
      organizationId: auth.restaurant.organizationId,
      planKey: plan.key,
      customerEmail: auth.user?.email || 'customer@example.com',
      customerName: auth.user?.name || undefined,
    });

    return NextResponse.json({ success: true, ...session });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
