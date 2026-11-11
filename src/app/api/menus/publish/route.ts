import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';
import { PublicationState } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { restaurantId, publishState } = await req.json();

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const state = publishState || PublicationState.PUBLISHED;

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { publicationState: state },
    });

    // Invalidate public Redis cache
    const cache = getCache();
    await cache.del(`menu:slug:${restaurant.slug}`);

    return NextResponse.json({
      success: true,
      publicationState: restaurant.publicationState,
      publicUrl: `/m/${restaurant.slug}`,
    });
  } catch (error: any) {
    console.error('Publish menu error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

