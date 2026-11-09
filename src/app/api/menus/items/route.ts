import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';

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

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, categoryId, customName, priceMinor, currency, description, dietaryStatus, ingredients } = body;

    if (!restaurantId || !categoryId || !customName) {
      return NextResponse.json({ error: 'restaurantId, categoryId, and customName are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const menu = await prisma.menu.findFirst({
      where: { restaurantId, active: true },
    });

    if (!menu) {
      return NextResponse.json({ error: 'No active menu found' }, { status: 400 });
    }

    const item = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId,
        menuId: menu.id,
        categoryId,
        customName,
        priceMinor: priceMinor || 0,
        currency: currency || auth.restaurant.currency,
        restaurantDescription: description || null,
        dietaryStatus: dietaryStatus || [],
        ingredients: ingredients || [],
        isAvailable: true,
        isPublished: true,
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
    const { itemId, restaurantId, ...updates } = body;

    if (!itemId || !restaurantId) {
      return NextResponse.json({ error: 'itemId and restaurantId are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const updatedItem = await prisma.restaurantMenuItem.update({
      where: { id: itemId, restaurantId },
      data: updates,
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
