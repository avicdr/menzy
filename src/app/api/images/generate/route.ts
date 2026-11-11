import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { generateOrReuseDishIllustration } from '@/lib/gemini/illustration-generator';
import { getCache } from '@/lib/cache/redis';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      menuItemId,
      dishName,
      visualDescription,
      customInstructions,
      forceRegenerate,
      applyImmediately = true,
    } = body;

    if (!restaurantId || !dishName) {
      return NextResponse.json({ error: 'restaurantId and dishName are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      includeSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const item = menuItemId
      ? await prisma.restaurantMenuItem.findUnique({ where: { id: menuItemId } })
      : null;

    const result = await generateOrReuseDishIllustration({
      restaurantId,
      organizationId: auth.restaurant.organizationId,
      menuItemId: item?.id,
      dishName,
      visualDescription: visualDescription || item?.restaurantDescription || dishName,
      canonicalId: item?.canonicalId,
      customInstructions,
      forceRegenerate: Boolean(forceRegenerate),
    });

    // If menuItemId was provided and applyImmediately is true, link asset override to dish
    if (applyImmediately && item && result.asset) {
      await prisma.restaurantMenuItem.update({
        where: { id: item.id },
        data: { imageOverrideAssetId: result.asset.id },
      });

      const cache = getCache();
      await cache.del(`menu:slug:${auth.restaurant.slug}`);
    }

    return NextResponse.json({
      success: true,
      asset: result.asset,
      isReused: result.isReused,
      creditsCharged: result.creditsCharged,
    });
  } catch (error: any) {
    console.error('Generate illustration error:', error);
    if (error.message === 'INSUFFICIENT_IMAGE_CREDITS') {
      return NextResponse.json(
        { error: 'INSUFFICIENT_IMAGE_CREDITS', message: 'You have reached your monthly custom image generation allowance.' },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

