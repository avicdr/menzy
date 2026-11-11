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
      category,
      ingredients,
      dietaryLabels,
      portionSize,
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

    const targetRestaurantId = auth.restaurant.id;

    let item = null;
    if (menuItemId) {
      item = await prisma.restaurantMenuItem.findFirst({
        where: { id: menuItemId, restaurantId: targetRestaurantId },
        include: {
          category: { select: { name: true } },
        },
      });
      if (!item) {
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
      }
    }

    const resolvedDescription =
      typeof visualDescription === 'string' && visualDescription.trim().length > 0
        ? visualDescription.trim()
        : item?.restaurantDescription || '';

    const resolvedIngredients = Array.isArray(ingredients)
      ? ingredients
      : Array.isArray(item?.ingredients)
      ? (item.ingredients as string[])
      : undefined;

    const resolvedDietaryLabels = Array.isArray(dietaryLabels)
      ? dietaryLabels
      : Array.isArray(item?.dietaryStatus)
      ? (item.dietaryStatus as string[])
      : undefined;

    const result = await generateOrReuseDishIllustration({
      restaurantId: targetRestaurantId,
      organizationId: auth.restaurant.organizationId,
      menuItemId: item?.id,
      dishName: String(dishName).trim(),
      visualDescription: resolvedDescription,
      category: category || item?.category?.name || null,
      ingredients: resolvedIngredients,
      dietaryLabels: resolvedDietaryLabels,
      portionSize: portionSize || item?.portionSize || null,
      canonicalId: item?.canonicalId,
      customInstructions,
      forceRegenerate: Boolean(forceRegenerate),
    });

    // If menuItemId was provided and applyImmediately is true, link asset override to dish
    if (applyImmediately && item && result.asset) {
      await prisma.restaurantMenuItem.update({
        where: { id: item.id, restaurantId: targetRestaurantId },
        data: { imageOverrideAssetId: result.asset.id },
      });

      const cache = getCache();
      await cache.del(`menu:slug:${auth.restaurant.slug}`);
    }

    return NextResponse.json(
      {
        success: true,
        asset: result.asset,
        isReused: result.isReused,
        creditsCharged: result.creditsCharged,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Generate illustration error:', error);
    const msg = String(error?.message || '');
    if (msg === 'INSUFFICIENT_IMAGE_CREDITS') {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_IMAGE_CREDITS',
          message: 'You have reached your monthly custom image generation allowance.',
        },
        { status: 402, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
    if (msg.startsWith('IMAGE_PROVIDER_UNAVAILABLE:')) {
      return NextResponse.json(
        {
          error: 'IMAGE_PROVIDER_UNAVAILABLE',
          message: msg.replace('IMAGE_PROVIDER_UNAVAILABLE:', '').trim(),
        },
        { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
    return NextResponse.json(
      { error: msg || 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

