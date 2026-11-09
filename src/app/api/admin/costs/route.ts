import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { calculateRestaurantCosts } from '@/lib/analytics/cost-calculator';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, displayName: true },
  });

  const costBreakdowns = [];
  let globalAiCostUsd = 0;
  let globalAiRequests = 0;
  let globalTokens = 0;
  let globalImages = 0;

  for (const r of restaurants) {
    try {
      const summary = await calculateRestaurantCosts(r.id);
      costBreakdowns.push(summary);
      globalAiCostUsd += summary.aiOperatingCostUsd;
      globalAiRequests += summary.totalAiRequests;
      globalTokens += summary.inputTokens + summary.outputTokens;
      globalImages += summary.imagesGenerated;
    } catch {}
  }

  // Model-level usage
  const eventsByModel = await prisma.aIUsageEvent.groupBy({
    by: ['modelId'],
    _sum: {
      inputTokens: true,
      outputTokens: true,
      imageCount: true,
      estimatedCostUsd: true,
    },
    _count: { id: true },
  });

  return NextResponse.json({
    global: {
      totalAiCostUsd: Number(globalAiCostUsd.toFixed(4)),
      totalAiRequests: globalAiRequests,
      totalTokens: globalTokens,
      totalImages: globalImages,
    },
    byModel: eventsByModel,
    restaurants: costBreakdowns,
  });
}
