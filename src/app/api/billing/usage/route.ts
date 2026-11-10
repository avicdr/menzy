import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { PLAN_CATALOG, PlanKey, getPlansForCountry } from '@/lib/payments/plans';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurantId');

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
  }

  const auth = await requireRestaurantAccess(restaurantId);
  if (!auth.authorized || !auth.restaurant?.organizationId) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
  }

  const orgId = auth.restaurant.organizationId;
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });

  const rawCountry = (
    auth.restaurant.organization?.billingCountry ||
    auth.restaurant.country ||
    'IN'
  ).toUpperCase();
  const billingCountry: 'IN' | 'US' = rawCountry === 'US' ? 'US' : 'IN';

  const subPlanKey = subscription?.planKey as PlanKey | undefined;
  const subPlan = subPlanKey ? PLAN_CATALOG[subPlanKey] : undefined;
  const planKey: PlanKey =
    subPlan && subPlan.country === billingCountry
      ? subPlan.key
      : billingCountry === 'US'
      ? 'US_STARTER'
      : 'IN_STARTER';
  const plan = PLAN_CATALOG[planKey];
  const availablePlans = getPlansForCountry(billingCountry);

  // Calculate image credit balance from CreditLedger
  const creditEntries = await prisma.creditLedger.findMany({
    where: { organizationId: orgId, creditType: 'IMAGE_GENERATION' },
  });
  const remainingImageCredits = creditEntries.reduce((acc, c) => acc + c.delta, 0);

  // Count AI queries this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const chatQueriesThisMonth = await prisma.aIUsageEvent.count({
    where: {
      restaurantId,
      operationType: 'DINER_CHAT',
      createdAt: { gte: startOfMonth },
    },
  });

  // Check active complimentary grants
  const activeGrants = await prisma.entitlementGrant.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      expirationDate: { gt: new Date() },
    },
  });

  return NextResponse.json({
    plan,
    billingCountry,
    availablePlans,
    subscription,
    remainingImageCredits: Math.max(0, remainingImageCredits),
    chatQueriesThisMonth,
    maxChatQueries: plan?.aiQuestionsMonthly || 1000,
    activeGrants,
  });
}

