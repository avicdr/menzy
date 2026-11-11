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

  // 1. Check Session rolling window
  const sessionCheck = await cache.slidingWindowCheck(sessionKey, maxLimit, windowSeconds);

  // 2. Check IP rolling window
  const ipCheck = await cache.slidingWindowCheck(ipKey, maxLimit, windowSeconds);

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

  // 3. Check Restaurant's monthly AI query limit
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      organization: {
        include: {
          subscriptions: true,
          entitlements: { where: { isActive: true, expirationDate: { gt: new Date() } } },
        },
      },
    },
  });

  if (restaurant?.organization) {
    const sub = restaurant.organization.subscriptions[0];
    const planKey = sub?.planKey || TRIAL_PLAN_KEY;
    const isTrial = planKey === TRIAL_PLAN_KEY;
    const catalogPlan = isTrial ? null : PLAN_CATALOG[planKey as PlanKey];
    const plan =
      isTrial || catalogPlan ? null : await prisma.plan.findUnique({ where: { key: planKey } });
    const baseQuota = isTrial
      ? TRIAL_PLAN.aiQuestionsMonthly
      : catalogPlan?.aiQuestionsMonthly ||
        plan?.aiQuestionsMonthly ||
        TRIAL_PLAN.aiQuestionsMonthly;

    // Check bonus entitlements
    const bonusQuestions = restaurant.organization.entitlements
      .filter((e) => e.grantType === 'BONUS_AI_QUESTIONS')
      .reduce((acc, curr) => acc + curr.quantity, 0);

    const totalAllowed = baseQuota + bonusQuestions;

    // Count this month's AI chat events
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const usedCount = await prisma.aIUsageEvent.count({
      where: {
        restaurantId,
        operationType: 'DINER_CHAT',
        createdAt: { gte: startOfMonth },
      },
    });

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

