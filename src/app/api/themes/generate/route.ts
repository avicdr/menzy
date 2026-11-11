import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import {
  generateNiceThemeWithAI,
  type ThemeGenerationMode,
} from '@/lib/theme/theme-generator';

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const restaurantId =
      typeof body?.restaurantId === 'string' ? body.restaurantId.trim() : '';
    const mode: ThemeGenerationMode =
      body?.mode === 'prompt' ? 'prompt' : 'random';
    const rawPrompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const excludeSignatures = Array.isArray(body?.excludeSignatures)
      ? body.excludeSignatures
          .filter((item: unknown): item is string => typeof item === 'string')
          .slice(0, 16)
      : [];

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(
        auth,
        auth.error === 'UNAUTHENTICATED' ? 401 : 403
      );
    }

    if (mode === 'prompt' && !rawPrompt) {
      return NextResponse.json(
        { error: 'Please describe the theme vibe you want, or use Surprise Me.' },
        { status: 400 }
      );
    }

    const sampleMenuItems = await prisma.restaurantMenuItem.findMany({
      where: {
        restaurantId: auth.restaurant.id,
        isAvailable: true,
      },
      orderBy: [{ isPopular: 'desc' }, { createdAt: 'desc' }],
      take: 8,
      select: {
        customName: true,
      },
    });

    const result = await generateNiceThemeWithAI({
      mode,
      prompt: rawPrompt.slice(0, 240),
      restaurantName: auth.restaurant.displayName,
      restaurantCity: auth.restaurant.city,
      restaurantDescription: auth.restaurant.description,
      sampleDishes: sampleMenuItems.map((item) => item.customName).filter(Boolean),
      excludeSignatures,
    });

    if (result.source !== 'curated' && result.modelUsed) {
      await prisma.aIUsageEvent
        .create({
          data: {
            organizationId: auth.restaurant.organizationId,
            restaurantId: auth.restaurant.id,
            operationType: 'OTHER_AI_OPERATION',
            modelId: result.modelUsed,
            inputTokens: result.inputTokens ?? 550,
            outputTokens: result.outputTokens ?? 220,
            estimatedCostUsd: 0.00022,
            status: 'SUCCESS',
            latencyMs: Date.now() - startedAt,
          },
        })
        .catch(() => undefined);
    }

    return NextResponse.json(
      {
        success: true,
        theme: result.theme,
        themeName: result.themeName,
        rationale: result.rationale,
        source: result.source,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Generate theme error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate theme' },
      { status: 500 }
    );
  }
}

