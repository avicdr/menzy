import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Restaurant slug is required' }, { status: 400 });
  }

  const cache = getCache();
  const cacheKey = `menu:slug:${slug}`;

  // Check Redis cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    try {
      return NextResponse.json(JSON.parse(cached));
    } catch {}
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      settings: true,
      theme: true,
      menus: {
        where: { active: true },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: {
                where: { isPublished: true },
                orderBy: { sortOrder: 'asc' },
                include: {
                  canonical: {
                    include: {
                      imageAsset: true,
                    },
                  },
                  imageOverride: true,
                  variants: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const responseData = {
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      displayName: restaurant.displayName,
      description: restaurant.description,
      country: restaurant.country,
      city: restaurant.city,
      currency: restaurant.currency,
      address: restaurant.address,
      phone: restaurant.phone,
      logoUrl: restaurant.logoUrl,
      coverUrl: restaurant.coverUrl,
      googleReviewUrl: restaurant.googleReviewUrl,
      publicationState: restaurant.publicationState,
    },
    settings: restaurant.settings,
    theme: restaurant.theme,
    menus: restaurant.menus,
  };

  // Cache for 60 seconds
  await cache.set(cacheKey, JSON.stringify(responseData), 'EX', 60);

  return NextResponse.json(responseData);
}

