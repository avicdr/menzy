import { NextResponse } from 'next/server';
import { GrantType, SubscriptionStatus } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import {
  FREE_TRIAL_DAYS,
  PLAN_CATALOG,
  PlanKey,
  TRIAL_PLAN,
  TRIAL_PLAN_KEY,
} from '@/lib/payments/plans';
import { SUPPORT_PHONE } from '@/lib/support/contact';

type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type OrganizationAccessMode =
  | 'UNCLAIMED_DEMO'
  | 'TRIAL'
  | 'PAID'
  | 'GRANT'
  | 'EXPIRED';

export type OrganizationAccessReason =
  | 'UNCLAIMED_DEMO'
  | 'ACTIVE_TRIAL'
  | 'ACTIVE_SUBSCRIPTION'
  | 'FOUNDER_GRANT'
  | 'TRIAL_EXPIRED'
  | 'SUBSCRIPTION_INACTIVE'
  | 'SUBSCRIPTION_REQUIRED';

export interface SubscriptionSnapshotInput {
  planKey?: string | null;
  status?: SubscriptionStatus | string | null;
  provider?: string | null;
  billingPeriod?: string | null;
  paidThrough?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
  createdAt?: Date | string | null;
}

export interface EntitlementGrantInput {
  grantType: GrantType | string;
  tierOrValue?: string | null;
  isActive: boolean;
  expirationDate: Date | string;
}

export interface OrganizationAccessStatus {
  allowed: boolean;
  expired: boolean;
  requiresSubscription: boolean;
  mode: OrganizationAccessMode;
  reason: OrganizationAccessReason;
  isTrial: boolean;
  isTrialExpired: boolean;
  planKey: string;
  planName: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  paidThrough: string | null;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  supportPhone: string;
}

function toValidDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getDisplayPlanName(planKey?: string | null): string {
  if (!planKey || planKey === TRIAL_PLAN_KEY) {
    return TRIAL_PLAN.name;
  }
  const catalogPlan = PLAN_CATALOG[planKey as PlanKey];
  if (catalogPlan) {
    return catalogPlan.name;
  }
  return planKey;
}

/**
 * Idempotently provisions a 14-day Free Trial subscription for an organization
 * with zero payment method / checkout required. Never overwrites existing subscriptions.
 */
export async function provisionTrialSubscriptionWithinTx(
  tx: PrismaTransactionClient,
  params: {
    organizationId: string;
    currency?: string | null;
    trialDays?: number;
  }
) {
  const existing = await tx.subscription.findUnique({
    where: { organizationId: params.organizationId },
  });

  if (existing) {
    return { subscription: existing, created: false as const };
  }

  const trialDays = params.trialDays ?? FREE_TRIAL_DAYS;
  const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  const resolvedCurrency = params.currency === 'USD' ? 'USD' : 'INR';

  const subscription = await tx.subscription.create({
    data: {
      organizationId: params.organizationId,
      provider: 'TRIAL',
      planKey: TRIAL_PLAN_KEY,
      status: SubscriptionStatus.TRIAL,
      currency: resolvedCurrency,
      billingPeriod: 'TRIAL_14D',
      paidThrough: trialEndsAt,
      cancelAtPeriodEnd: false,
    },
  });

  return { subscription, created: true as const };
}

/**
 * Computes deterministic subscription & 14-day trial access state for a restaurant / organization.
 */
export function evaluateOrganizationAccess(params: {
  organizationId?: string | null;
  isClaimed?: boolean;
  subscription?: SubscriptionSnapshotInput | null;
  activeGrants?: EntitlementGrantInput[] | null;
  now?: Date;
}): OrganizationAccessStatus {
  const nowDate = params.now ?? new Date();
  const nowMs = nowDate.getTime();

  // Unclaimed founder demo restaurants stay previewable until claimed
  if (!params.organizationId && params.isClaimed === false) {
    return {
      allowed: true,
      expired: false,
      requiresSubscription: false,
      mode: 'UNCLAIMED_DEMO',
      reason: 'UNCLAIMED_DEMO',
      isTrial: false,
      isTrialExpired: false,
      planKey: TRIAL_PLAN_KEY,
      planName: TRIAL_PLAN.name,
      subscriptionStatus: null,
      trialEndsAt: null,
      paidThrough: null,
      daysRemaining: null,
      hoursRemaining: null,
      supportPhone: SUPPORT_PHONE,
    };
  }

  if (!params.organizationId) {
    return {
      allowed: false,
      expired: true,
      requiresSubscription: true,
      mode: 'EXPIRED',
      reason: 'SUBSCRIPTION_REQUIRED',
      isTrial: false,
      isTrialExpired: false,
      planKey: TRIAL_PLAN_KEY,
      planName: TRIAL_PLAN.name,
      subscriptionStatus: 'INACTIVE',
      trialEndsAt: null,
      paidThrough: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      supportPhone: SUPPORT_PHONE,
    };
  }

  const sub = params.subscription ?? null;
  const subPaidThrough = toValidDate(sub?.paidThrough);
  const subPaidThroughIso = subPaidThrough ? subPaidThrough.toISOString() : null;
  const subPlanKey = sub?.planKey || TRIAL_PLAN_KEY;
  const subStatus = sub?.status ? String(sub.status) : null;
  const isTrialSub =
    subPlanKey === TRIAL_PLAN_KEY ||
    subStatus === 'TRIAL' ||
    sub?.provider === 'TRIAL' ||
    sub?.billingPeriod === 'TRIAL_14D';

  // 1. Check active Paid Subscription first
  if (
    sub &&
    subPlanKey !== TRIAL_PLAN_KEY &&
    (subStatus === 'ACTIVE' || subStatus === 'CANCEL_AT_PERIOD_END')
  ) {
    if (!subPaidThrough || subPaidThrough.getTime() > nowMs) {
      const remainingMs = subPaidThrough ? Math.max(0, subPaidThrough.getTime() - nowMs) : null;
      return {
        allowed: true,
        expired: false,
        requiresSubscription: false,
        mode: 'PAID',
        reason: 'ACTIVE_SUBSCRIPTION',
        isTrial: false,
        isTrialExpired: false,
        planKey: subPlanKey,
        planName: getDisplayPlanName(subPlanKey),
        subscriptionStatus: subStatus,
        trialEndsAt: null,
        paidThrough: subPaidThroughIso,
        daysRemaining: remainingMs !== null ? Math.max(1, Math.ceil(remainingMs / 86_400_000)) : null,
        hoursRemaining: remainingMs !== null ? Math.max(1, Math.ceil(remainingMs / 3_600_000)) : null,
        supportPhone: SUPPORT_PHONE,
      };
    }
  }

  // 2. Check active Founder EntitlementGrant (COMPLIMENTARY_PLAN or EXTENSION)
  let latestUnlockGrant: { grant: EntitlementGrantInput; expDate: Date } | null = null;
  for (const grant of params.activeGrants || []) {
    if (!grant.isActive) continue;
    if (grant.grantType !== 'COMPLIMENTARY_PLAN' && grant.grantType !== 'EXTENSION') continue;
    const expDate = toValidDate(grant.expirationDate);
    if (!expDate || expDate.getTime() <= nowMs) continue;
    if (!latestUnlockGrant || expDate.getTime() > latestUnlockGrant.expDate.getTime()) {
      latestUnlockGrant = { grant, expDate };
    }
  }

  if (latestUnlockGrant) {
    const expMs = latestUnlockGrant.expDate.getTime();
    const effectiveEndMs =
      subPaidThrough && subPaidThrough.getTime() > expMs ? subPaidThrough.getTime() : expMs;
    const effectiveEndIso = new Date(effectiveEndMs).toISOString();
    const remainingMs = Math.max(0, effectiveEndMs - nowMs);
    const grantTierKey =
      latestUnlockGrant.grant.grantType === 'COMPLIMENTARY_PLAN' &&
      latestUnlockGrant.grant.tierOrValue
        ? latestUnlockGrant.grant.tierOrValue
        : subPlanKey;

    return {
      allowed: true,
      expired: false,
      requiresSubscription: false,
      mode: 'GRANT',
      reason: 'FOUNDER_GRANT',
      isTrial: isTrialSub && latestUnlockGrant.grant.grantType === 'EXTENSION',
      isTrialExpired: false,
      planKey: grantTierKey,
      planName: getDisplayPlanName(grantTierKey),
      subscriptionStatus: subStatus || 'ACTIVE',
      trialEndsAt:
        isTrialSub && latestUnlockGrant.grant.grantType === 'EXTENSION'
          ? effectiveEndIso
          : null,
      paidThrough: effectiveEndIso,
      daysRemaining: Math.max(1, Math.ceil(remainingMs / 86_400_000)),
      hoursRemaining: Math.max(1, Math.ceil(remainingMs / 3_600_000)),
      supportPhone: SUPPORT_PHONE,
    };
  }

  // 3. Check Active 14-Day Trial (including PENDING checkout initiated while trial is still valid)
  const isBlockedStatus =
    subStatus === 'CANCELLED' ||
    subStatus === 'EXPIRED' ||
    subStatus === 'PAST_DUE' ||
    subStatus === 'INACTIVE';

  if (
    sub &&
    !isBlockedStatus &&
    (subStatus === 'TRIAL' ||
      subPlanKey === TRIAL_PLAN_KEY ||
      (subStatus === 'PENDING' && subPaidThrough !== null))
  ) {
    if (subPaidThrough && subPaidThrough.getTime() > nowMs) {
      const remainingMs = subPaidThrough.getTime() - nowMs;
      return {
        allowed: true,
        expired: false,
        requiresSubscription: false,
        mode: 'TRIAL',
        reason: 'ACTIVE_TRIAL',
        isTrial: true,
        isTrialExpired: false,
        planKey: TRIAL_PLAN_KEY,
        planName: TRIAL_PLAN.name,
        subscriptionStatus: subStatus || 'TRIAL',
        trialEndsAt: subPaidThroughIso,
        paidThrough: subPaidThroughIso,
        daysRemaining: Math.max(1, Math.ceil(remainingMs / 86_400_000)),
        hoursRemaining: Math.max(1, Math.ceil(remainingMs / 3_600_000)),
        supportPhone: SUPPORT_PHONE,
      };
    }

    return {
      allowed: false,
      expired: true,
      requiresSubscription: true,
      mode: 'EXPIRED',
      reason: 'TRIAL_EXPIRED',
      isTrial: true,
      isTrialExpired: true,
      planKey: TRIAL_PLAN_KEY,
      planName: TRIAL_PLAN.name,
      subscriptionStatus: 'EXPIRED',
      trialEndsAt: subPaidThroughIso,
      paidThrough: subPaidThroughIso,
      daysRemaining: 0,
      hoursRemaining: 0,
      supportPhone: SUPPORT_PHONE,
    };
  }

  // 4. Everything else (no subscription, cancelled, past_due, inactive, lapsed paid period)
  const reason: OrganizationAccessReason = !sub
    ? 'SUBSCRIPTION_REQUIRED'
    : isTrialSub
    ? 'TRIAL_EXPIRED'
    : 'SUBSCRIPTION_INACTIVE';

  return {
    allowed: false,
    expired: true,
    requiresSubscription: true,
    mode: 'EXPIRED',
    reason,
    isTrial: isTrialSub,
    isTrialExpired: reason === 'TRIAL_EXPIRED',
    planKey: subPlanKey,
    planName: getDisplayPlanName(subPlanKey),
    subscriptionStatus: subStatus || 'INACTIVE',
    trialEndsAt: isTrialSub ? subPaidThroughIso : null,
    paidThrough: subPaidThroughIso,
    daysRemaining: 0,
    hoursRemaining: 0,
    supportPhone: SUPPORT_PHONE,
  };
}

/**
 * Lightweight database check for any restaurant ID or slug.
 * Uses a minimal select so cached public/operational routes never rely on stale cache after expiry.
 */
export async function checkRestaurantSubscriptionAccess(
  restaurantIdOrSlug: string,
  options?: { bySlug?: boolean; byIdOnly?: boolean }
): Promise<{
  found: boolean;
  restaurant?: {
    id: string;
    slug: string;
    displayName: string;
    isClaimed: boolean;
    organizationId: string | null;
  };
  access: OrganizationAccessStatus;
}> {
  const now = new Date();
  const restaurant = await prisma.restaurant.findFirst({
    where: options?.bySlug
      ? { slug: restaurantIdOrSlug }
      : options?.byIdOnly
      ? { id: restaurantIdOrSlug }
      : { OR: [{ id: restaurantIdOrSlug }, { slug: restaurantIdOrSlug }] },
    select: {
      id: true,
      slug: true,
      displayName: true,
      isClaimed: true,
      organizationId: true,
      organization: {
        select: {
          subscriptions: {
            take: 1,
            select: {
              planKey: true,
              status: true,
              provider: true,
              billingPeriod: true,
              paidThrough: true,
              cancelAtPeriodEnd: true,
              createdAt: true,
            },
          },
          entitlements: {
            where: {
              isActive: true,
              expirationDate: { gt: now },
            },
            select: {
              grantType: true,
              tierOrValue: true,
              isActive: true,
              expirationDate: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return {
      found: false,
      access: evaluateOrganizationAccess({ organizationId: null, isClaimed: true, now }),
    };
  }

  const access = evaluateOrganizationAccess({
    organizationId: restaurant.organizationId,
    isClaimed: restaurant.isClaimed,
    subscription: restaurant.organization?.subscriptions?.[0] ?? null,
    activeGrants: restaurant.organization?.entitlements ?? [],
    now,
  });

  return {
    found: true,
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      displayName: restaurant.displayName,
      isClaimed: restaurant.isClaimed,
      organizationId: restaurant.organizationId,
    },
    access,
  };
}

export function buildSubscriptionExpiredPayload(
  access: OrganizationAccessStatus,
  options?: {
    restaurantId?: string;
    restaurantSlug?: string;
    restaurantName?: string;
    audience?: 'OWNER' | 'STAFF' | 'DINER';
  }
) {
  const audience = options?.audience || 'OWNER';
  const code = access.reason === 'TRIAL_EXPIRED' ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_REQUIRED';

  let error: string;
  if (audience === 'DINER') {
    error =
      access.reason === 'TRIAL_EXPIRED'
        ? "This restaurant's 14-day free trial has ended. Live menu viewing and ordering will resume as soon as the restaurant activates a subscription."
        : 'This digital menu is currently paused pending subscription activation by the restaurant.';
  } else if (audience === 'STAFF') {
    error =
      access.reason === 'TRIAL_EXPIRED'
        ? "Operations are paused because the restaurant's 14-day free trial has ended. Please ask the restaurant owner to buy a subscription in the Billing panel."
        : 'Operations are paused because the restaurant subscription is inactive. Ask the owner to activate a plan in the Billing panel.';
  } else {
    error =
      access.reason === 'TRIAL_EXPIRED'
        ? 'Your 14-day free trial has ended. Please buy a subscription plan in the Billing panel to continue using your workspace.'
        : 'An active subscription is required to continue. Please choose a plan in the Billing panel.';
  }

  return {
    error,
    code,
    paused: true,
    subscriptionRequired: true,
    trialExpired: access.isTrialExpired,
    trialEndsAt: access.trialEndsAt,
    planKey: access.planKey,
    planName: access.planName,
    billingUrl: options?.restaurantId
      ? `/dashboard/${options.restaurantId}?tab=billing`
      : '/login',
    supportPhone: SUPPORT_PHONE,
    supportMessage: `For setup-related queries or assistance activating your plan, contact ${SUPPORT_PHONE}.`,
    ...(options?.restaurantName || options?.restaurantSlug
      ? {
          restaurant: {
            id: options.restaurantId,
            slug: options.restaurantSlug,
            displayName: options.restaurantName,
          },
        }
      : {}),
  };
}

export function createSubscriptionExpiredResponse(
  access: OrganizationAccessStatus,
  options?: {
    restaurantId?: string;
    restaurantSlug?: string;
    restaurantName?: string;
    audience?: 'OWNER' | 'STAFF' | 'DINER';
  }
) {
  return NextResponse.json(buildSubscriptionExpiredPayload(access, options), {
    status: 402,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

