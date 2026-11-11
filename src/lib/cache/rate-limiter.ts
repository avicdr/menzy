import crypto from 'crypto';
import { getCache } from './redis';
import prisma from '../db/prisma';
import { PLAN_CATALOG, PlanKey, TRIAL_PLAN, TRIAL_PLAN_KEY } from '../payments/plans';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  retryAt: string | null;
  error?: 'RATE_LIMITED' | 'MONTHLY_QUOTA_EXHAUSTED';
  message?: string;
}

const PLAN_QUOTA_CACHE_TTL_MS = 5 * 60 * 1000;
const globalPlanQuotaCache = globalThis as typeof globalThis & {
  __menzyPlanQuotaCache?: Map<string, { quota: number; expiresAt: number }>;
};

async function getPlanMonthlyQuota(planKey: string): Promise<number> {
  if (planKey === TRIAL_PLAN_KEY) {
    return TRIAL_PLAN.aiQuestionsMonthly;
  }
  const catalogPlan = PLAN_CATALOG[planKey as PlanKey];
  if (catalogPlan?.aiQuestionsMonthly) {
    return catalogPlan.aiQuestionsMonthly;
  }

  const cacheMap =
    globalPlanQuotaCache.__menzyPlanQuotaCache ??
    (globalPlanQuotaCache.__menzyPlanQuotaCache = new Map());
  const now = Date.now();
  const cached = cacheMap.get(planKey);
  if (cached && cached.expiresAt > now) {
    return cached.quota;
  }

  const plan = await prisma.plan.findUnique({
    where: { key: planKey },
    select: { aiQuestionsMonthly: true },
  });
  const quota = plan?.aiQuestionsMonthly || TRIAL_PLAN.aiQuestionsMonthly;
  cacheMap.set(planKey, { quota, expiresAt: now + PLAN_QUOTA_CACHE_TTL_MS });
  return quota;
}

export async function checkDinerAIRateLimit(
  sessionToken: string,
  clientIp: string,
  restaurantId: string
): Promise<RateLimitResult> {
  const cache = getCache();
  const maxLimit = parseInt(process.env.DINER_RATE_LIMIT_REQUESTS || '25', 10);
  const windowSeconds = parseInt(process.env.DINER_RATE_LIMIT_WINDOW_SECONDS || '300', 10);

  // Privacy-preserving hash of session and IP
  const sessionHash = crypto.createHash('sha256').update(sessionToken || 'anonymous-session').digest('hex').substring(0, 16);
  const ipHash = crypto.createHash('sha256').update(clientIp || '127.0.0.1').digest('hex').substring(0, 16);

  const sessionKey = `rl:session:${sessionHash}`;
  const ipKey = `rl:ip:${ipHash}`;

  // 1 & 2. Check Session and IP rolling windows concurrently
  const [sessionCheck, ipCheck] = await Promise.all([
    cache.slidingWindowCheck(sessionKey, maxLimit, windowSeconds),
    cache.slidingWindowCheck(ipKey, maxLimit, windowSeconds),
  ]);

  const isSessionAllowed = sessionCheck.allowed;
  const isIpAllowed = ipCheck.allowed;

  if (!isSessionAllowed || !isIpAllowed) {
    const retryAfterSeconds = Math.max(sessionCheck.retryAfterSeconds, ipCheck.retryAfterSeconds) || windowSeconds;
    const retryAt = new Date(Date.now() + retryAfterSeconds * 1000).toISOString();

    return {
      allowed: false,
      limit: maxLimit,
      remaining: 0,
      retryAfterSeconds,
      retryAt,
      error: 'RATE_LIMITED',
      message: "You've reached the AI chat limit for now. Feel free to keep exploring the menu.",
    };
  }

  // 3. Check Restaurant's monthly AI query limit (subscription/entitlements + monthly usage in parallel)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [restaurant, usedCount] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        organization: {
          select: {
            subscriptions: {
              take: 1,
              select: { planKey: true },
            },
            entitlements: {
              where: { isActive: true, expirationDate: { gt: now } },
              select: { grantType: true, quantity: true },
            },
          },
        },
      },
    }),
    prisma.aIUsageEvent.count({
      where: {
        restaurantId,
        operationType: 'DINER_CHAT',
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  if (restaurant?.organization) {
    const sub = restaurant.organization.subscriptions[0];
    const planKey = sub?.planKey || TRIAL_PLAN_KEY;
    const baseQuota = await getPlanMonthlyQuota(planKey);

    // Check bonus entitlements
    const bonusQuestions = restaurant.organization.entitlements
      .filter((e) => e.grantType === 'BONUS_AI_QUESTIONS')
      .reduce((acc, curr) => acc + curr.quantity, 0);

    const totalAllowed = baseQuota + bonusQuestions;

    if (usedCount >= totalAllowed) {
      return {
        allowed: false,
        limit: totalAllowed,
        remaining: 0,
        retryAfterSeconds: 3600,
        retryAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        error: 'MONTHLY_QUOTA_EXHAUSTED',
        message: "The restaurant's AI concierge quota has been reached for this billing cycle.",
      };
    }
  }

  const currentCount = Math.max(sessionCheck.count, ipCheck.count);
  const remaining = Math.max(0, maxLimit - currentCount);

  return {
    allowed: true,
    limit: maxLimit,
    remaining,
    retryAfterSeconds: 0,
    retryAt: null,
  };
}

