import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { logAdminAction } from '@/lib/auth/admin-auth';
import { PLAN_CATALOG, PlanKey, TRIAL_PLAN_KEY } from '@/lib/payments/plans';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'renewing_7d', 'renewing_3d', 'renewing_24h', 'past_due', 'cancelled', 'trial', 'trial_expired'

    const now = new Date();
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in3d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let whereClause: any = {};

    if (filter === 'renewing_24h') {
      whereClause = { paidThrough: { gte: now, lte: in24h }, status: 'ACTIVE', planKey: { not: TRIAL_PLAN_KEY } };
    } else if (filter === 'renewing_3d') {
      whereClause = { paidThrough: { gte: now, lte: in3d }, status: 'ACTIVE', planKey: { not: TRIAL_PLAN_KEY } };
    } else if (filter === 'renewing_7d') {
      whereClause = { paidThrough: { gte: now, lte: in7d }, status: 'ACTIVE', planKey: { not: TRIAL_PLAN_KEY } };
    } else if (filter === 'past_due') {
      whereClause = { status: 'PAST_DUE' };
    } else if (filter === 'cancelled') {
      whereClause = { status: { in: ['CANCELLED', 'CANCEL_AT_PERIOD_END'] } };
    } else if (filter === 'trial') {
      whereClause = { status: 'TRIAL', paidThrough: { gt: now } };
    } else if (filter === 'trial_expired') {
      whereClause = {
        planKey: TRIAL_PLAN_KEY,
        OR: [{ status: 'EXPIRED' }, { status: 'TRIAL', paidThrough: { lte: now } }],
      };
    }

    const [subscriptions, allActive, pastDueCount, activeTrialsCount, expiredTrialsCount] = await Promise.all([
      prisma.subscription.findMany({
        where: whereClause,
        select: {
          id: true,
          organizationId: true,
          provider: true,
          planKey: true,
          status: true,
          currency: true,
          billingPeriod: true,
          paidThrough: true,
          cancelAtPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              restaurants: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                  country: true,
                },
              },
            },
          },
        },
        orderBy: { paidThrough: 'asc' },
      }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE', planKey: { not: TRIAL_PLAN_KEY } },
        select: { planKey: true, paidThrough: true },
      }),
      prisma.subscription.count({
        where: { status: 'PAST_DUE' },
      }),
      prisma.subscription.count({
        where: { status: 'TRIAL', paidThrough: { gt: now } },
      }),
      prisma.subscription.count({
        where: {
          planKey: TRIAL_PLAN_KEY,
          OR: [{ status: 'EXPIRED' }, { status: 'TRIAL', paidThrough: { lte: now } }],
        },
      }),
    ]);

    let inrMrr = 0;
    let usdMrr = 0;
    let renewingIn7DaysCount = 0;

    for (const s of allActive) {
      if (s.paidThrough && s.paidThrough >= now && s.paidThrough <= in7d) {
        renewingIn7DaysCount++;
      }
      const planDef = PLAN_CATALOG[s.planKey as PlanKey];
      const majorAmount = planDef ? Math.round(planDef.priceMinor / 100) : 0;
      if (s.planKey.startsWith('IN_')) {
        inrMrr += majorAmount || (s.planKey === 'IN_STARTER' ? 999 : s.planKey === 'IN_GROWTH' ? 1799 : s.planKey === 'IN_PRO' ? 2699 : 0);
      } else {
        usdMrr += majorAmount || (s.planKey === 'US_STARTER' ? 29 : s.planKey === 'US_GROWTH' ? 59 : s.planKey === 'US_PRO' ? 119 : 0);
      }
    }

    return NextResponse.json(
      {
        subscriptions,
        metrics: {
          totalActive: allActive.length,
          activeTrialsCount,
          expiredTrialsCount,
          inrMrr,
          usdMrr,
          renewingIn7DaysCount,
          pastDueCount,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load subscriptions.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const subscriptionId =
      typeof body?.subscriptionId === 'string' ? body.subscriptionId.trim() : '';
    const planKey = typeof body?.planKey === 'string' ? body.planKey.trim() : '';
    const founderReason =
      typeof body?.founderReason === 'string' ? body.founderReason.trim() : '';

    if (!subscriptionId || !planKey || !founderReason) {
      return NextResponse.json(
        { error: 'subscriptionId, planKey, and founderReason are required.' },
        { status: 400 }
      );
    }

    const validPlanKeys = new Set<string>([TRIAL_PLAN_KEY, ...Object.keys(PLAN_CATALOG)]);
    if (!validPlanKeys.has(planKey)) {
      return NextResponse.json({ error: 'Unsupported subscription plan.' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: {
          select: {
            id: true,
            billingCountry: true,
            billingCurrency: true,
            restaurants: { take: 1, select: { country: true, slug: true } },
          },
        },
      },
    });
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    }

    const plan = planKey === TRIAL_PLAN_KEY ? null : PLAN_CATALOG[planKey as PlanKey];
    const organizationCountry =
      subscription.organization.billingCountry ||
      subscription.organization.restaurants[0]?.country ||
      'IN';
    if (plan && plan.country !== organizationCountry) {
      return NextResponse.json(
        { error: `Choose a ${organizationCountry} plan for this organization.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const isTrial = planKey === TRIAL_PLAN_KEY;
    const paidThrough = isTrial
      ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      : subscription.paidThrough && subscription.paidThrough > now
      ? subscription.paidThrough
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planKey,
        provider: isTrial ? 'TRIAL' : 'FOUNDER_OVERRIDE',
        providerSubscriptionId: null,
        providerCustomerId: null,
        status: isTrial ? 'TRIAL' : 'ACTIVE',
        currency: plan?.currency || subscription.organization.billingCurrency || subscription.currency,
        paidThrough,
        cancelAtPeriodEnd: false,
      },
    });

    await logAdminAction({
      adminEmail: session.email,
      action: 'CHANGE_SUBSCRIPTION_PLAN',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      beforeState: subscription,
      afterState: updated,
      reason: founderReason,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    console.error('Admin subscription PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
