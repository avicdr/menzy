import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import {
  PLAN_CATALOG,
  PlanKey,
  TRIAL_PLAN,
  TRIAL_PLAN_KEY,
  getPlansForCountry,
} from '@/lib/payments/plans';
import { evaluateOrganizationAccess } from '@/lib/billing/subscription-access';
import { SUPPORT_PHONE } from '@/lib/support/contact';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      allowDuringExpiredSubscription: true,
    });
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const orgId = auth.restaurant.organizationId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const hasLoadedSubscriptions = Array.isArray(auth.restaurant.organization?.subscriptions);
    const preloadedSubscription = auth.restaurant.organization?.subscriptions?.[0] ?? null;
    const hasLoadedGrants = Array.isArray(auth.restaurant.organization?.entitlements);
    const preloadedGrants = auth.restaurant.organization?.entitlements ?? [];

    const [subscriptionResult, creditSum, chatQueriesThisMonth, activeGrants] = await Promise.all([
      hasLoadedSubscriptions
        ? Promise.resolve(preloadedSubscription)
        : prisma.subscription.findUnique({ where: { organizationId: orgId } }),
      prisma.creditLedger.aggregate({
        where: { organizationId: orgId, creditType: 'IMAGE_GENERATION' },
        _sum: { delta: true },
      }),
      prisma.aIUsageEvent.count({
        where: {
          restaurantId: auth.restaurant.id,
          operationType: 'DINER_CHAT',
          createdAt: { gte: startOfMonth },
        },
      }),
      hasLoadedGrants
        ? Promise.resolve(preloadedGrants)
        : prisma.entitlementGrant.findMany({
            where: {
              organizationId: orgId,
              isActive: true,
              expirationDate: { gt: now },
            },
          }),
    ]);

    const subscription = subscriptionResult || null;
    const access = evaluateOrganizationAccess({
      organizationId: orgId,
      isClaimed: auth.restaurant.isClaimed,
      subscription,
      activeGrants,
      now,
    });

    const rawCountry = (
      auth.restaurant.organization?.billingCountry ||
      auth.restaurant.country ||
      'IN'
    ).toUpperCase();
    const billingCountry: 'IN' | 'US' = rawCountry === 'US' ? 'US' : 'IN';

    const complimentaryGrant = activeGrants.find(
      (g: any) => g.grantType === 'COMPLIMENTARY_PLAN' && g.tierOrValue
    );
    const effectivePlanKey = complimentaryGrant?.tierOrValue || subscription?.planKey || TRIAL_PLAN_KEY;
    const catalogPlan =
      effectivePlanKey !== TRIAL_PLAN_KEY ? PLAN_CATALOG[effectivePlanKey as PlanKey] : undefined;
    const normalizedComplimentaryKey = complimentaryGrant?.tierOrValue
      ? (`${billingCountry}_${String(complimentaryGrant.tierOrValue).replace(/^(IN|US)_/, '')}` as PlanKey)
      : undefined;
    const resolvedPaidPlan =
      catalogPlan && catalogPlan.country === billingCountry
        ? catalogPlan
        : normalizedComplimentaryKey
        ? PLAN_CATALOG[normalizedComplimentaryKey]
        : undefined;

    const isTrial = !resolvedPaidPlan && (effectivePlanKey === TRIAL_PLAN_KEY || access.isTrial);
    const plan = resolvedPaidPlan || TRIAL_PLAN;
    const availablePlans = getPlansForCountry(billingCountry);
    const remainingImageCredits = creditSum._sum.delta ?? 0;
    const bonusQuestions = activeGrants
      .filter((e: any) => e.grantType === 'BONUS_AI_QUESTIONS')
      .reduce((acc: number, curr: any) => acc + (curr.quantity || 0), 0);

    return NextResponse.json(
      {
        plan,
        trialPlan: TRIAL_PLAN,
        isTrial,
        access,
        billingCountry,
        availablePlans,
        subscription,
        remainingImageCredits: Math.max(0, remainingImageCredits),
        chatQueriesThisMonth,
        maxChatQueries: (plan?.aiQuestionsMonthly || TRIAL_PLAN.aiQuestionsMonthly) + bonusQuestions,
        activeGrants,
        supportPhone: SUPPORT_PHONE,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Billing usage GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load billing usage details.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

