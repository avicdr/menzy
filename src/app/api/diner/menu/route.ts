import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';
import { normalizeThemeFont } from '@/lib/theme/theme-presets';
import { isWifiVisibleToDiners } from '@/lib/wifi/wifi-qr';
import { extractTableSessionConfig } from '@/lib/diner/table-session-config';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Restaurant slug is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  // Enforce active trial or subscription BEFORE serving Redis-cached menu payloads
  const subAccess = await checkRestaurantSubscriptionAccess(slug, { bySlug: true });
  if (!subAccess.found || !subAccess.restaurant) {
    return NextResponse.json(
      { error: 'Restaurant not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
  if (!subAccess.access.allowed) {
    return createSubscriptionExpiredResponse(subAccess.access, {
      restaurantId: subAccess.restaurant.id,
      restaurantSlug: subAccess.restaurant.slug,
      restaurantName: subAccess.restaurant.displayName,
      audience: 'DINER',
    });
  }

  const cache = getCache();
  const cacheKey = `menu:slug:${slug}`;

  // Check Redis cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    try {
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    } catch {}
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      settings: true,
      theme: true,
      orderingSettings: true,
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
                  modifierGroups: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                      options: {
                        orderBy: { sortOrder: 'asc' },
                      },
                    },
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

  const notifSettings = (restaurant.orderingSettings?.notificationSettings as Record<string, any>) || {};
  const wifiConfig = isWifiVisibleToDiners(notifSettings?.wifi) ? notifSettings.wifi : null;
  const tableSessionConfig = extractTableSessionConfig(notifSettings);

  const normalizedTheme = restaurant.theme
    ? {
        ...restaurant.theme,
        headingFont: normalizeThemeFont(restaurant.theme.headingFont, 'Plus Jakarta Sans'),
        bodyFont: normalizeThemeFont(restaurant.theme.bodyFont, 'Inter'),
      }
    : null;

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
      theme: normalizedTheme,
    },
    settings: restaurant.settings,
    theme: normalizedTheme,
    orderingSettings: restaurant.orderingSettings,
    tableSession: tableSessionConfig,
    wifi: wifiConfig,
    menus: restaurant.menus,
  };

  // Cache for 60 seconds
  await cache.set(cacheKey, JSON.stringify(responseData), 'EX', 60);

  return NextResponse.json(responseData, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

