import prisma from '../db/prisma';
import { TRIAL_PLAN_KEY } from '../payments/plans';

export interface RestaurantCostSummary {
  restaurantId: string;
  restaurantName: string;
  country: string;
  currency: string;
  subscriptionPlan: string;
  subscriptionRevenue: number;
  totalAiRequests: number;
  inputTokens: number;
  outputTokens: number;
  imagesGenerated: number;
  canonicalReuses: number;
  aiOperatingCostUsd: number;
  estimatedMarginUsd: number;
}

export interface AdminCostBreakdownResult {
  global: {
    totalAiCostUsd: number;
    totalAiRequests: number;
    totalTokens: number;
    totalImages: number;
  };
  byModel: Array<{
    modelId: string;
    _sum: {
      inputTokens: number | null;
      outputTokens: number | null;
      imageCount: number | null;
      estimatedCostUsd: number | null;
    };
    _count: {
      id: number;
    };
  }>;
  restaurants: RestaurantCostSummary[];
}

export async function calculateRestaurantCosts(
  restaurantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RestaurantCostSummary> {
  const from = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = endDate || new Date();

  const [restaurant, eventAgg, canonicalReuses] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        displayName: true,
        country: true,
        currency: true,
        organization: {
          select: {
            subscriptions: {
              take: 1,
              select: { planKey: true },
            },
          },
        },
      },
    }),
    prisma.aIUsageEvent.aggregate({
      where: {
        restaurantId,
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        imageCount: true,
        estimatedCostUsd: true,
      },
    }),
    prisma.restaurantMenuItem.count({
      where: {
        restaurantId,
        canonicalId: { not: null },
        imageOverrideAssetId: null,
      },
    }),
  ]);

  if (!restaurant) {
    throw new Error('RESTAURANT_NOT_FOUND');
  }

  const totalAiRequests = eventAgg._count.id;
  const inputTokens = eventAgg._sum.inputTokens ?? 0;
  const outputTokens = eventAgg._sum.outputTokens ?? 0;
  const imagesGenerated = eventAgg._sum.imageCount ?? 0;
  const aiOperatingCostUsd = eventAgg._sum.estimatedCostUsd ?? 0;

  // Subscription revenue
  const sub = restaurant.organization?.subscriptions[0];
  const planKey = sub?.planKey || null;
  const isTrial = planKey === TRIAL_PLAN_KEY;
  const plan =
    planKey && !isTrial
      ? await prisma.plan.findUnique({
          where: { key: planKey },
          select: { name: true, priceMinor: true, currency: true },
        })
      : null;
  const subscriptionRevenue = isTrial || !plan ? 0 : (plan.priceMinor || 0) / 100;

  // Estimated margin in USD (rough INR to USD conversion for aggregation: 1 USD = ~85 INR)
  const revenueUsd =
    isTrial || !plan ? 0 : plan.currency === 'INR' ? subscriptionRevenue / 85 : subscriptionRevenue;
  const estimatedMarginUsd = Math.max(0, revenueUsd - aiOperatingCostUsd);

  return {
    restaurantId,
    restaurantName: restaurant.displayName,
    country: restaurant.country,
    currency: restaurant.currency,
    subscriptionPlan: isTrial ? 'Trial (14-Day Free)' : plan?.name || (planKey || 'No Active Plan'),
    subscriptionRevenue,
    totalAiRequests,
    inputTokens,
    outputTokens,
    imagesGenerated,
    canonicalReuses,
    aiOperatingCostUsd: Number(aiOperatingCostUsd.toFixed(4)),
    estimatedMarginUsd: Number(estimatedMarginUsd.toFixed(2)),
  };
}

/**
 * Computes global & per-restaurant AI operating cost intelligence in constant query count (O(1) queries)
 * via parallel aggregates instead of an N+1 loop.
 */
export async function calculateAllRestaurantCosts(
  startDate?: Date,
  endDate?: Date
): Promise<AdminCostBreakdownResult> {
  const from = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = endDate || new Date();

  const [restaurants, usageByRestaurant, canonicalReuseByRestaurant, plans, eventsByModel] =
    await Promise.all([
      prisma.restaurant.findMany({
        select: {
          id: true,
          displayName: true,
          country: true,
          currency: true,
          organization: {
            select: {
              subscriptions: {
                take: 1,
                select: { planKey: true },
              },
            },
          },
        },
      }),
      prisma.aIUsageEvent.groupBy({
        by: ['restaurantId'],
        where: {
          restaurantId: { not: null },
          createdAt: { gte: from, lte: to },
        },
        _count: { id: true },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          imageCount: true,
          estimatedCostUsd: true,
        },
      }),
      prisma.restaurantMenuItem.groupBy({
        by: ['restaurantId'],
        where: {
          canonicalId: { not: null },
          imageOverrideAssetId: null,
        },
        _count: { id: true },
      }),
      prisma.plan.findMany({
        select: { key: true, name: true, priceMinor: true, currency: true },
      }),
      prisma.aIUsageEvent.groupBy({
        by: ['modelId'],
        _sum: {
          inputTokens: true,
          outputTokens: true,
          imageCount: true,
          estimatedCostUsd: true,
        },
        _count: { id: true },
      }),
    ]);

  const usageMap = new Map(
    usageByRestaurant
      .filter((row): row is typeof row & { restaurantId: string } => Boolean(row.restaurantId))
      .map((row) => [row.restaurantId, row])
  );
  const reuseMap = new Map(
    canonicalReuseByRestaurant.map((row) => [row.restaurantId, row._count.id])
  );
  const planMap = new Map(plans.map((p) => [p.key, p]));

  let globalAiCostUsd = 0;
  let globalAiRequests = 0;
  let globalTokens = 0;
  let globalImages = 0;

  const costBreakdowns: RestaurantCostSummary[] = restaurants.map((r) => {
    const usage = usageMap.get(r.id);
    const totalAiRequests = usage?._count.id ?? 0;
    const inputTokens = usage?._sum.inputTokens ?? 0;
    const outputTokens = usage?._sum.outputTokens ?? 0;
    const imagesGenerated = usage?._sum.imageCount ?? 0;
    const rawAiOperatingCostUsd = usage?._sum.estimatedCostUsd ?? 0;
    const canonicalReuses = reuseMap.get(r.id) ?? 0;

    const sub = r.organization?.subscriptions?.[0];
    const planKey = sub?.planKey || null;
    const isTrial = planKey === TRIAL_PLAN_KEY;
    const plan = planKey && !isTrial ? planMap.get(planKey) : undefined;
    const subscriptionRevenue = isTrial || !plan ? 0 : (plan.priceMinor || 0) / 100;
    const revenueUsd =
      isTrial || !plan ? 0 : plan.currency === 'INR' ? subscriptionRevenue / 85 : subscriptionRevenue;

    const aiOperatingCostUsd = Number(rawAiOperatingCostUsd.toFixed(4));
    const estimatedMarginUsd = Number(Math.max(0, revenueUsd - rawAiOperatingCostUsd).toFixed(2));

    globalAiCostUsd += aiOperatingCostUsd;
    globalAiRequests += totalAiRequests;
    globalTokens += inputTokens + outputTokens;
    globalImages += imagesGenerated;

    return {
      restaurantId: r.id,
      restaurantName: r.displayName,
      country: r.country,
      currency: r.currency,
      subscriptionPlan: isTrial ? 'Trial (14-Day Free)' : plan?.name || (planKey || 'No Active Plan'),
      subscriptionRevenue,
      totalAiRequests,
      inputTokens,
      outputTokens,
      imagesGenerated,
      canonicalReuses,
      aiOperatingCostUsd,
      estimatedMarginUsd,
    };
  });

  return {
    global: {
      totalAiCostUsd: Number(globalAiCostUsd.toFixed(4)),
      totalAiRequests: globalAiRequests,
      totalTokens: globalTokens,
      totalImages: globalImages,
    },
    byModel: eventsByModel,
    restaurants: costBreakdowns,
  };
}

