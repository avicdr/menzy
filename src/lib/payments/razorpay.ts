import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../db/prisma';
import { getCache } from '../cache/redis';
import { PLAN_CATALOG, PlanDefinition, PlanKey } from './plans';
import { SubscriptionStatus } from '@prisma/client';

let razorpayClient: Razorpay | null = null;
let cachedClientSignature: string | null = null;
const resolvedPlanIdCache = new Map<string, string>();

const PLACEHOLDER_SECRETS = new Set([
  'rzp_test_placeholder',
  'rzp_secret_placeholder',
  'rzp_webhook_secret_placeholder',
  'rzp_test_mock',
]);

function normalizeEnvValue(raw?: string | null): string {
  if (!raw) return '';
  let trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isPlaceholderSecret(value: string): boolean {
  return !value || PLACEHOLDER_SECRETS.has(value);
}

export class RazorpayConfigError extends Error {
  readonly code = 'RAZORPAY_NOT_CONFIGURED';
  constructor(message: string) {
    super(message);
    this.name = 'RazorpayConfigError';
  }
}

export class RazorpayApiError extends Error {
  readonly code = 'RAZORPAY_API_ERROR';
  readonly statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'RazorpayApiError';
    this.statusCode = statusCode;
  }
}

export function extractRazorpayErrorMessage(err: unknown): string {
  if (!err) return 'Unknown Razorpay API error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const record = err as Record<string, any>;
    const desc =
      record.error?.description ||
      record.description ||
      record.error?.reason ||
      record.message;
    const code = record.error?.code || record.statusCode;
    if (desc && code) return `${desc} (${code})`;
    if (desc) return String(desc);
  }
  return String(err);
}

export function getRazorpayConfig(): {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isConfigured: boolean;
} {
  const keyId = normalizeEnvValue(process.env.RAZORPAY_KEY_ID);
  const keySecret = normalizeEnvValue(process.env.RAZORPAY_KEY_SECRET);
  const webhookSecret = normalizeEnvValue(process.env.RAZORPAY_WEBHOOK_SECRET);
  const isConfigured = !isPlaceholderSecret(keyId) && !isPlaceholderSecret(keySecret);
  return { keyId, keySecret, webhookSecret, isConfigured };
}

export function getRazorpayClient(): Razorpay | null {
  const { keyId, keySecret, isConfigured } = getRazorpayConfig();

  if (!isConfigured) {
    return null;
  }

  const signature = `${keyId}:${keySecret}`;
  if (!razorpayClient || cachedClientSignature !== signature) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    cachedClientSignature = signature;
  }

  return razorpayClient;
}

/**
 * Resolves (or lazily creates) the Razorpay Plan ID directly from PLAN_CATALOG
 * so operators don't have to manually maintain per-plan RAZORPAY_PLAN_* env vars.
 */
export async function resolveRazorpayPlanId(
  client: Pick<Razorpay, 'plans'>,
  plan: PlanDefinition,
  cacheKeyPrefix = 'default'
): Promise<string> {
  const cacheKey = `${cacheKeyPrefix}:${plan.key}:${plan.priceMinor}:${plan.currency}`;
  const cached = resolvedPlanIdCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pageSize = 100;
  for (let page = 0; page < 5; page++) {
    const res = await client.plans.all({ count: pageSize, skip: page * pageSize });
    const items = res?.items || [];
    const match = items.find((p) => {
      const notes = p.notes as Record<string, string | number> | undefined;
      return (
        notes?.planKey === plan.key &&
        p.period === 'monthly' &&
        Number(p.interval) === 1 &&
        Number(p.item?.amount) === plan.priceMinor &&
        String(p.item?.currency || '').toUpperCase() === plan.currency &&
        p.item?.active !== false
      );
    });
    if (match?.id) {
      resolvedPlanIdCache.set(cacheKey, match.id);
      return match.id;
    }
    if (items.length < pageSize) {
      break;
    }
  }

  const created = await client.plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name: `Menzy ${plan.name}`,
      amount: plan.priceMinor,
      currency: plan.currency,
      description: `${plan.itemLimit > 1000 ? 'Unlimited' : plan.itemLimit} dishes, ${plan.imageCreditsMonthly} image credits/mo, ${plan.aiQuestionsMonthly.toLocaleString()} AI queries/mo`,
    },
    notes: {
      planKey: plan.key,
    },
  });

  resolvedPlanIdCache.set(cacheKey, created.id);
  return created.id;
}

/**
 * Initializes a subscription on Razorpay server-side
 */
export async function createSubscriptionSession(params: {
  organizationId: string;
  planKey: PlanKey;
  customerEmail: string;
  customerName?: string;
}): Promise<{
  subscriptionId: string;
  keyId: string;
  planKey: PlanKey;
  amountMinor: number;
  currency: string;
  shortUrl: string | null;
  isMock: boolean;
}> {
  const plan = PLAN_CATALOG[params.planKey];
  if (!plan) {
    throw new Error('INVALID_PLAN_KEY');
  }

  const client = getRazorpayClient();
  const { keyId } = getRazorpayConfig();

  const existingSub = await prisma.subscription.findUnique({
    where: { organizationId: params.organizationId },
    select: { status: true, paidThrough: true, planKey: true },
  });
  const hasActivePaidPeriod =
    existingSub?.status === SubscriptionStatus.ACTIVE &&
    existingSub.planKey !== 'FREE_TRIAL' &&
    (!existingSub.paidThrough || existingSub.paidThrough.getTime() > Date.now());

  if (client) {
    let sub: { id: string; short_url?: string };
    try {
      const planId = await resolveRazorpayPlanId(client, plan, keyId);
      sub = await client.subscriptions.create({
        plan_id: planId,
        total_count: 12, // 12 monthly billing cycles
        quantity: 1,
        customer_notify: 1,
        notes: {
          organizationId: params.organizationId,
          planKey: plan.key,
          customerEmail: params.customerEmail,
        },
      });
    } catch (err) {
      console.error('Razorpay API subscription create error:', err);
      const detail = extractRazorpayErrorMessage(err);
      const rawStatus = (err as any)?.statusCode;
      const statusCode = typeof rawStatus === 'number' && rawStatus >= 400 ? rawStatus : 502;
      throw new RazorpayApiError(
        `Razorpay subscription creation failed: ${detail}`,
        statusCode
      );
    }

    // Preserve active paid plan / existing paidThrough until checkout payment actually settles
    await prisma.subscription.upsert({
      where: { organizationId: params.organizationId },
      update: {
        provider: 'RAZORPAY',
        planKey: hasActivePaidPeriod ? existingSub.planKey : plan.key,
        providerSubscriptionId: sub.id,
        status: hasActivePaidPeriod ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
        currency: plan.currency,
        billingPeriod: 'MONTHLY',
      },
      create: {
        organizationId: params.organizationId,
        provider: 'RAZORPAY',
        planKey: plan.key,
        providerSubscriptionId: sub.id,
        status: SubscriptionStatus.PENDING,
        currency: plan.currency,
        billingPeriod: 'MONTHLY',
      },
    });

    return {
      subscriptionId: sub.id,
      keyId,
      planKey: plan.key,
      amountMinor: plan.priceMinor,
      currency: plan.currency,
      shortUrl: typeof sub.short_url === 'string' ? sub.short_url : null,
      isMock: false,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new RazorpayConfigError(
      'Razorpay credentials are missing or still placeholders on hosting. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET and redeploy.'
    );
  }

  // Realistic Sandbox adapter only when offline / unconfigured in non-production
  const mockSubId = `sub_mock_${Date.now()}`;
  await prisma.subscription.upsert({
    where: { organizationId: params.organizationId },
    update: {
      provider: 'RAZORPAY',
      planKey: hasActivePaidPeriod ? existingSub.planKey : plan.key,
      providerSubscriptionId: mockSubId,
      status: hasActivePaidPeriod ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      currency: plan.currency,
      billingPeriod: 'MONTHLY',
    },
    create: {
      organizationId: params.organizationId,
      provider: 'RAZORPAY',
      planKey: plan.key,
      providerSubscriptionId: mockSubId,
      status: SubscriptionStatus.PENDING,
      currency: plan.currency,
      billingPeriod: 'MONTHLY',
    },
  });

  return {
    subscriptionId: mockSubId,
    keyId: 'rzp_test_mock',
    planKey: plan.key,
    amountMinor: plan.priceMinor,
    currency: plan.currency,
    shortUrl: null,
    isMock: true,
  };
}

function timingSafeHexEqual(receivedSignature: string, expectedHex: string): boolean {
  const actualBuf = Buffer.from(receivedSignature);
  const expectedBuf = Buffer.from(expectedHex);
  if (actualBuf.length !== expectedBuf.length || actualBuf.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Validates Razorpay webhook raw body signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret?: string
): boolean {
  const normalizedOverride = normalizeEnvValue(secret);
  const webhookSecret =
    normalizedOverride || getRazorpayConfig().webhookSecret || 'rzp_webhook_secret_placeholder';
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return timingSafeHexEqual(signature, expected);
}

/**
 * Validates Razorpay Standard Checkout subscription payment signature:
 * HMAC-SHA256(`${razorpay_payment_id}|${razorpay_subscription_id}`, key_secret)
 */
export function verifyRazorpaySubscriptionSignature(params: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  secret?: string;
}): boolean {
  const keySecret = normalizeEnvValue(params.secret) || getRazorpayConfig().keySecret;
  if (!keySecret || !params.paymentId || !params.subscriptionId || !params.signature) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.paymentId}|${params.subscriptionId}`)
    .digest('hex');
  return timingSafeHexEqual(params.signature, expected);
}

async function invalidateOrganizationMenuCaches(organizationId: string): Promise<void> {
  const orgRestaurants = await prisma.restaurant.findMany({
    where: { organizationId },
    select: { slug: true },
  });
  if (orgRestaurants.length > 0) {
    const cache = getCache();
    await Promise.all(orgRestaurants.map((r) => cache.del(`menu:slug:${r.slug}`)));
  }
}

async function activateSubscriptionCycle(params: {
  subscription: {
    id: string;
    organizationId: string;
    planKey: string;
  };
  targetPlanKey?: string | null;
}): Promise<{ planKey: string; paidThrough: Date }> {
  const resolvedPlanKey =
    params.targetPlanKey && PLAN_CATALOG[params.targetPlanKey as PlanKey]
      ? (params.targetPlanKey as PlanKey)
      : (params.subscription.planKey as PlanKey);
  const plan = PLAN_CATALOG[resolvedPlanKey];
  const paidThrough = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.update({
    where: { id: params.subscription.id },
    data: {
      provider: 'RAZORPAY',
      billingPeriod: 'MONTHLY',
      planKey: resolvedPlanKey,
      currency: plan?.currency || undefined,
      status: SubscriptionStatus.ACTIVE,
      paidThrough,
      cancelAtPeriodEnd: false,
    },
  });

  // Allocate plan credits once per paid renewal period
  if (plan) {
    const creditKey = `renewal_${params.subscription.id}_${paidThrough.toISOString().slice(0, 7)}`;
    const renewalReason = `Monthly renewal: ${plan.name}`;
    const twentyFiveDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);

    const [existingCredit, recentSamePlanCredit] = await Promise.all([
      prisma.creditLedger.findUnique({
        where: { idempotencyKey: creditKey },
        select: { id: true },
      }),
      prisma.creditLedger.findFirst({
        where: {
          subscriptionId: params.subscription.id,
          creditType: 'IMAGE_GENERATION',
          reason: renewalReason,
          timestamp: { gte: twentyFiveDaysAgo },
        },
        select: { id: true },
      }),
    ]);

    if (!existingCredit && !recentSamePlanCredit) {
      const currentBalance = await prisma.creditLedger.aggregate({
        where: {
          organizationId: params.subscription.organizationId,
          creditType: 'IMAGE_GENERATION',
        },
        _sum: { delta: true },
      });
      const balanceAfter = (currentBalance._sum.delta ?? 0) + plan.imageCreditsMonthly;

      await prisma.creditLedger.create({
        data: {
          organizationId: params.subscription.organizationId,
          subscriptionId: params.subscription.id,
          creditType: 'IMAGE_GENERATION',
          delta: plan.imageCreditsMonthly,
          balanceAfter,
          reason: renewalReason,
          idempotencyKey: creditKey,
        },
      });
    }
  }

  await invalidateOrganizationMenuCaches(params.subscription.organizationId);
  return { planKey: resolvedPlanKey, paidThrough };
}

/**
 * Verifies Razorpay Checkout handler callback and activates the tenant subscription immediately.
 */
export async function confirmRazorpaySubscriptionPayment(params: {
  organizationId: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
  planKeyHint?: string;
}): Promise<{ status: 'ACTIVE'; planKey: string; paidThrough: Date }> {
  const isValid = verifyRazorpaySubscriptionSignature({
    paymentId: params.razorpayPaymentId,
    subscriptionId: params.razorpaySubscriptionId,
    signature: params.razorpaySignature,
  });

  if (!isValid) {
    throw new RazorpayApiError('Invalid Razorpay payment signature.', 400);
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId: params.organizationId,
      providerSubscriptionId: params.razorpaySubscriptionId,
    },
  });

  if (!subscription) {
    throw new RazorpayApiError('Subscription session not found for this organization.', 404);
  }

  let remotePlanKey: string | undefined;
  const client = getRazorpayClient();
  if (client && !params.razorpaySubscriptionId.startsWith('sub_mock_')) {
    try {
      const remoteSub = await client.subscriptions.fetch(params.razorpaySubscriptionId);
      const notes = (remoteSub as any)?.notes as Record<string, any> | undefined;
      if (notes?.organizationId && notes.organizationId !== params.organizationId) {
        throw new RazorpayApiError('Subscription does not belong to this organization.', 403);
      }
      if (typeof notes?.planKey === 'string' && PLAN_CATALOG[notes.planKey as PlanKey]) {
        remotePlanKey = notes.planKey;
      }
    } catch (err) {
      if (err instanceof RazorpayApiError) throw err;
      console.warn('Razorpay subscription fetch fallback during confirm:', err);
    }
  }

  const verifyEventId = `verify_${params.razorpayPaymentId}`;
  const existingVerifyEvent = await prisma.billingEvent.findUnique({
    where: { providerEventId: verifyEventId },
    select: { id: true },
  });

  if (!existingVerifyEvent) {
    await prisma.billingEvent.create({
      data: {
        providerEventId: verifyEventId,
        provider: 'RAZORPAY',
        eventType: 'checkout.payment_verified',
        payload: {
          paymentId: params.razorpayPaymentId,
          subscriptionId: params.razorpaySubscriptionId,
          organizationId: params.organizationId,
        },
        processingStatus: 'PROCESSED',
      },
    });
  }

  const targetPlanKey =
    remotePlanKey ||
    (params.planKeyHint && PLAN_CATALOG[params.planKeyHint as PlanKey]
      ? params.planKeyHint
      : undefined);

  const activated = await activateSubscriptionCycle({
    subscription,
    targetPlanKey,
  });

  return {
    status: 'ACTIVE',
    planKey: activated.planKey,
    paidThrough: activated.paidThrough,
  };
}

/**
 * Idempotently processes verified Razorpay webhook events
 */
export async function processRazorpayWebhookEvent(event: {
  event: string;
  payload: any;
}): Promise<{ status: string; reason?: string }> {
  const eventId = event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || `evt_${Date.now()}`;

  // Idempotency check
  const existing = await prisma.billingEvent.findUnique({
    where: { providerEventId: eventId },
  });

  if (existing) {
    return { status: 'DUPLICATE_EVENT_IGNORED' };
  }

  // Record billing event
  await prisma.billingEvent.create({
    data: {
      providerEventId: eventId,
      provider: 'RAZORPAY',
      eventType: event.event,
      payload: event.payload,
      processingStatus: 'PROCESSED',
    },
  });

  const subEntity = event.payload?.subscription?.entity;
  const subId = subEntity?.id;

  if (!subId) {
    return { status: 'NO_SUBSCRIPTION_IN_PAYLOAD' };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId: subId },
  });

  if (!subscription) {
    return { status: 'SUBSCRIPTION_NOT_FOUND_IN_DB' };
  }

  const notesPlanKey =
    typeof subEntity?.notes?.planKey === 'string' && PLAN_CATALOG[subEntity.notes.planKey as PlanKey]
      ? (subEntity.notes.planKey as string)
      : null;

  switch (event.event) {
    case 'subscription.authenticated':
    case 'subscription.activated':
    case 'subscription.charged': {
      await activateSubscriptionCycle({
        subscription,
        targetPlanKey: notesPlanKey,
      });
      return { status: 'PROCESSED_SUCCESSFULLY' };
    }

    case 'subscription.halted':
    case 'subscription.pending': {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
      break;
    }

    case 'subscription.cancelled': {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
      break;
    }
  }

  await invalidateOrganizationMenuCaches(subscription.organizationId);

  return { status: 'PROCESSED_SUCCESSFULLY' };
}

