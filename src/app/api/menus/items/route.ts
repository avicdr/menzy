import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';
import { matchCanonicalDish } from '@/lib/canonical/matcher';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurantId');

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
  }

  const auth = await requireRestaurantAccess(restaurantId);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
  }

  const items = await prisma.restaurantMenuItem.findMany({
    where: { restaurantId },
    include: {
      category: true,
      canonical: {
        include: { imageAsset: true },
      },
      imageOverride: true,
      variants: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      categoryId,
      categoryName,
      customName,
      priceMinor,
      currency,
      description,
      dietaryStatus,
      ingredients,
      isPopular,
      chefRecommended,
    } = body;

    if (!restaurantId || !customName) {
      return NextResponse.json({ error: 'restaurantId and customName are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    let menu = await prisma.menu.findFirst({
      where: { restaurantId, active: true },
    });

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          restaurantId,
          title: 'Main Menu',
        },
      });
    }

    let targetCategoryId = categoryId;
    if (categoryName && categoryName.trim()) {
      let existingCat = await prisma.menuCategory.findFirst({
        where: { menuId: menu.id, name: categoryName.trim() },
      });
      if (!existingCat) {
        existingCat = await prisma.menuCategory.create({
          data: {
            menuId: menu.id,
            name: categoryName.trim(),
            sortOrder: 99,
          },
        });
      }
      targetCategoryId = existingCat.id;
    }

    if (!targetCategoryId) {
      const firstCat = await prisma.menuCategory.findFirst({
        where: { menuId: menu.id },
      });
      if (firstCat) {
        targetCategoryId = firstCat.id;
      } else {
        const newCat = await prisma.menuCategory.create({
          data: { menuId: menu.id, name: 'Main Dishes', sortOrder: 1 },
        });
        targetCategoryId = newCat.id;
      }
    }

    let canonicalId: string | null = null;
    try {
      const matched = await matchCanonicalDish({
        dishName: customName,
        category: categoryName || undefined,
        description: description || undefined,
        dietaryLabels: Array.isArray(dietaryStatus) ? dietaryStatus : undefined,
        useGemini: true,
        restaurantId,
        organizationId: auth.restaurant.organizationId,
      });
      canonicalId = matched.canonicalId;
    } catch {
      canonicalId = null;
    }

    const item = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId,
        menuId: menu.id,
        categoryId: targetCategoryId,
        canonicalId,
        customName,
        priceMinor: priceMinor || 0,
        currency: currency || auth.restaurant.currency,
        restaurantDescription: description || null,
        dietaryStatus: dietaryStatus || [],
        ingredients: ingredients || [],
        isAvailable: true,
        isPublished: true,
        isPopular: Boolean(isPopular),
        chefRecommended: Boolean(chefRecommended),
      },
      include: {
        category: true,
        canonical: {
          include: { imageAsset: true },
        },
        imageOverride: true,
      },
    });

    // Invalidate menu cache
    const cache = getCache();
    await cache.del(`menu:slug:${auth.restaurant.slug}`);

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { itemId, restaurantId, ...rawUpdates } = body;

    if (!itemId || !restaurantId) {
      return NextResponse.json({ error: 'itemId and restaurantId are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const existing = await prisma.restaurantMenuItem.findFirst({
      where: { id: itemId, restaurantId },
      include: { category: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    const normalizedUpdates: Record<string, any> = {};
    if ('description' in rawUpdates) {
      normalizedUpdates.restaurantDescription = rawUpdates.description;
    }

    const ALLOWED_PATCH_FIELDS = [
      'customName',
      'restaurantDescription',
      'priceMinor',
      'categoryId',
      'isAvailable',
      'isPublished',
      'isPopular',
      'chefRecommended',
      'dietaryStatus',
      'canonicalId',
      'imageOverrideAssetId',
      'ingredients',
      'portionSize',
      'preparationDetails',
      'allergenVerification',
      'nutritionFields',
      'sortOrder',
    ] as const;

    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in rawUpdates && rawUpdates[key] !== undefined) {
        normalizedUpdates[key] = rawUpdates[key];
      }
    }

    // Re-match canonical dish automatically when an unlinked dish's name or description is edited
    const textChanged =
      normalizedUpdates.customName !== undefined ||
      normalizedUpdates.restaurantDescription !== undefined;

    if (
      textChanged &&
      !existing.canonicalId &&
      !existing.imageOverrideAssetId &&
      !('canonicalId' in normalizedUpdates)
    ) {
      try {
        const nextName =
          typeof normalizedUpdates.customName === 'string' && normalizedUpdates.customName.trim()
            ? normalizedUpdates.customName.trim()
            : existing.customName;
        const nextDescription =
          normalizedUpdates.restaurantDescription !== undefined
            ? normalizedUpdates.restaurantDescription
            : existing.restaurantDescription;
        const nextDietary = Array.isArray(normalizedUpdates.dietaryStatus)
          ? normalizedUpdates.dietaryStatus
          : Array.isArray(existing.dietaryStatus)
          ? (existing.dietaryStatus as string[])
          : undefined;

        const matched = await matchCanonicalDish({
          dishName: nextName,
          category: existing.category?.name,
          description: nextDescription || undefined,
          dietaryLabels: nextDietary,
          useGemini: true,
          restaurantId,
          organizationId: auth.restaurant.organizationId,
        });
        if (matched.canonicalId) {
          normalizedUpdates.canonicalId = matched.canonicalId;
        }
      } catch {
        // Non-fatal if auto-matching fails during edit
      }
    }

    const updatedItem = await prisma.restaurantMenuItem.update({
      where: { id: itemId, restaurantId },
      data: normalizedUpdates,
      include: {
        category: true,
        canonical: {
          include: { imageAsset: true },
        },
        imageOverride: true,
        variants: true,
      },
    });

    // Invalidate public menu cache immediately
    const cache = getCache();
    await cache.del(`menu:slug:${auth.restaurant.slug}`);

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const restaurantId = searchParams.get('restaurantId');

    if (!itemId || !restaurantId) {
      return NextResponse.json({ error: 'itemId and restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    await prisma.restaurantMenuItem.delete({
      where: { id: itemId, restaurantId },
    });

    const cache = getCache();
    await cache.del(`menu:slug:${auth.restaurant.slug}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
