import prisma from '../db/prisma';

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

export async function calculateRestaurantCosts(
  restaurantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RestaurantCostSummary> {
  const from = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = endDate || new Date();

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      organization: {
        include: { subscriptions: true },
      },
    },
  });

  if (!restaurant) {
    throw new Error('RESTAURANT_NOT_FOUND');
  }

  const events = await prisma.aIUsageEvent.findMany({
    where: {
      restaurantId,
      createdAt: { gte: from, lte: to },
    },
  });

  let totalAiRequests = events.length;
  let inputTokens = 0;
  let outputTokens = 0;
  let imagesGenerated = 0;
  let aiOperatingCostUsd = 0;

  for (const ev of events) {
    inputTokens += ev.inputTokens;
    outputTokens += ev.outputTokens;
    imagesGenerated += ev.imageCount;
    aiOperatingCostUsd += ev.estimatedCostUsd;
  }

  // Calculate canonical image reuse count
  const menuItems = await prisma.restaurantMenuItem.findMany({
    where: {
      restaurantId,
      canonicalId: { not: null },
      imageOverrideAssetId: null,
    },
  });
  const canonicalReuses = menuItems.length;

  // Subscription revenue
  const sub = restaurant.organization?.subscriptions[0];
  const planKey = sub?.planKey || 'IN_STARTER';
  const plan = await prisma.plan.findUnique({ where: { key: planKey } });
  const subscriptionRevenue = (plan?.priceMinor || 0) / 100;

  // Estimated margin in USD (rough INR to USD conversion for aggregation: 1 USD = ~85 INR)
  const revenueUsd = plan?.currency === 'INR' ? subscriptionRevenue / 85 : subscriptionRevenue;
  const estimatedMarginUsd = Math.max(0, revenueUsd - aiOperatingCostUsd);

  return {
    restaurantId,
    restaurantName: restaurant.displayName,
    country: restaurant.country,
    currency: restaurant.currency,
    subscriptionPlan: plan?.name || 'Starter',
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
