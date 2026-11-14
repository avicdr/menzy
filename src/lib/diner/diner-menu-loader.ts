import * as React from 'react';
import prisma from '@/lib/db/prisma';
import { getCache, withSingleflight } from '@/lib/cache/redis';
import { normalizeThemeFont } from '@/lib/theme/theme-presets';
import { isWifiVisibleToDiners } from '@/lib/wifi/wifi-qr';
import { extractTableSessionConfig } from '@/lib/diner/table-session-config';
import {
  buildSubscriptionExpiredPayload,
  checkRestaurantSubscriptionAccess,
  evaluateOrganizationAccess,
} from '@/lib/billing/subscription-access';

export type DinerMenuLoadResult =
  | { status: 'NOT_FOUND' }
  | {
      status: 'PAUSED';
      pausedPayload: ReturnType<typeof buildSubscriptionExpiredPayload>;
    }
  | {
      status: 'OK';
      data: Record<string, any>;
    };

export async function loadDinerMenuPayload(rawSlug: string): Promise<DinerMenuLoadResult> {
  let slug = (rawSlug || '').trim();
  if (!slug) {
    return { status: 'NOT_FOUND' };
  }

  // Alias acai-theory to acai-theory-demo if requested
  if (slug === 'acai-theory') {
    const directMatch = await prisma.restaurant.findUnique({
      where: { slug: 'acai-theory' },
      select: { id: true },
    });
    if (!directMatch) {
      slug = 'acai-theory-demo';
    }
  }

  const cache = getCache();
  const cacheKey = `menu:slug:${slug}`;
  const cached = await cache.get(cacheKey).catch(() => null);

  if (cached) {
    try {
      const parsedData = JSON.parse(cached) as Record<string, any>;
      // Verify live subscription cutoff on cache hits via lightweight indexed findFirst
      const subAccess = await checkRestaurantSubscriptionAccess(slug, { bySlug: true });
      if (!subAccess.found || !subAccess.restaurant) {
        return { status: 'NOT_FOUND' };
      }
      if (!subAccess.access.allowed) {
        return {
          status: 'PAUSED',
          pausedPayload: buildSubscriptionExpiredPayload(subAccess.access, {
            restaurantId: subAccess.restaurant.id,
            restaurantSlug: subAccess.restaurant.slug,
            restaurantName: subAccess.restaurant.displayName,
            audience: 'DINER',
          }),
        };
      }
      return {
        status: 'OK',
        data: parsedData,
      };
    } catch {
      // Corrupted cache entry — regenerate from DB cleanly
    }
  }

  return withSingleflight(`diner-menu-load:${slug}`, async () => {
    const now = new Date();
    // Single-round-trip fetch combining organization subscription/grants and menu hierarchy
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        displayName: true,
        description: true,
        country: true,
        city: true,
        currency: true,
        address: true,
        phone: true,
        logoUrl: true,
        coverUrl: true,
        googleReviewUrl: true,
        publicationState: true,
        isClaimed: true,
        organizationId: true,
        organization: {
          select: {
            subscriptions: {
              take: 1,
              select: {
                planKey: true,
                status: true,
                provider: true,
                billingPeriod: true,
                paidThrough: true,
                cancelAtPeriodEnd: true,
                createdAt: true,
              },
            },
            entitlements: {
              where: {
                isActive: true,
                expirationDate: { gt: now },
              },
              select: {
                grantType: true,
                tierOrValue: true,
                isActive: true,
                expirationDate: true,
              },
            },
          },
        },
        settings: {
          select: {
            id: true,
            restaurantId: true,
            welcomeMessage: true,
            aiTone: true,
            allowDinerChat: true,
            allowPairings: true,
            maxDinerChatPerSession: true,
          },
        },
        theme: {
          select: {
            id: true,
            presetKey: true,
            backgroundColor: true,
            surfaceColor: true,
            primaryTextColor: true,
            secondaryTextColor: true,
            accentColor: true,
            secondaryAccentColor: true,
            headingFont: true,
            bodyFont: true,
            layoutMode: true,
            cardRadius: true,
            buttonStyle: true,
            imageProportions: true,
            texture: true,
            publishedSettings: true,
          },
        },
        orderingSettings: {
          select: {
            notificationSettings: true,
          },
        },
        menus: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            visibility: true,
            sortOrder: true,
            active: true,
            categories: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                name: true,
                sortOrder: true,
                items: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    id: true,
                    categoryId: true,
                    canonicalId: true,
                    customName: true,
                    priceMinor: true,
                    currency: true,
                    restaurantDescription: true,
                    ingredients: true,
                    portionSize: true,
                    dietaryStatus: true,
                    allergenVerification: true,
                    nutritionFields: true,
                    nutritionSource: true,
                    chefRecommended: true,
                    isPopular: true,
                    isAvailable: true,
                    sortOrder: true,
                    imageOverride: {
                      select: {
                        publicUrl: true,
                      },
                    },
                    canonical: {
                      select: {
                        id: true,
                        normalizedName: true,
                        imageAsset: {
                          select: {
                            publicUrl: true,
                          },
                        },
                      },
                    },
                    variants: {
                      orderBy: { sortOrder: 'asc' },
                      select: {
                        id: true,
                        name: true,
                        choiceGroup: true,
                        supplementalPriceMinor: true,
                        isRequired: true,
                        sortOrder: true,
                      },
                    },
                    modifierGroups: {
                      orderBy: { sortOrder: 'asc' },
                      select: {
                        id: true,
                        name: true,
                        required: true,
                        minSelections: true,
                        maxSelections: true,
                        sortOrder: true,
                        options: {
                          orderBy: { sortOrder: 'asc' },
                          select: {
                            id: true,
                            name: true,
                            priceMinor: true,
                            isAvailable: true,
                            sortOrder: true,
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
      },
    });

    if (!restaurant) {
      return { status: 'NOT_FOUND' };
    }

    const access = evaluateOrganizationAccess({
      organizationId: restaurant.organizationId,
      isClaimed: restaurant.isClaimed,
      subscription: restaurant.organization?.subscriptions?.[0] ?? null,
      activeGrants: restaurant.organization?.entitlements ?? [],
      now,
    });

    if (!access.allowed) {
      return {
        status: 'PAUSED',
        pausedPayload: buildSubscriptionExpiredPayload(access, {
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
          restaurantName: restaurant.displayName,
          audience: 'DINER',
        }),
      };
    }

    const notifSettings =
      (restaurant.orderingSettings?.notificationSettings as Record<string, any>) || {};
    const showLogo = notifSettings?.showLogo !== false;
    const wifiConfig = isWifiVisibleToDiners(notifSettings?.wifi) ? notifSettings.wifi : null;
    const tableSessionConfig = extractTableSessionConfig(notifSettings);

    const normalizedTheme = restaurant.theme
      ? {
          ...restaurant.theme,
          mobileGridColumns:
            (restaurant.theme.publishedSettings as Record<string, any> | null)?.mobileGridColumns ?? 1,
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
        showLogo,
        coverUrl: restaurant.coverUrl,
        googleReviewUrl: restaurant.googleReviewUrl,
        publicationState: restaurant.publicationState,
        isClaimed: restaurant.isClaimed,
        theme: normalizedTheme,
      },
      showLogo,
      settings: restaurant.settings,
      theme: normalizedTheme,
      tableSession: tableSessionConfig,
      wifi: wifiConfig,
      menus: restaurant.menus,
    };

    // Warm cache without blocking response if remote Redis is momentarily slow
    await Promise.race([
      cache.set(cacheKey, JSON.stringify(responseData), 'EX', 60).catch(() => 'ERR'),
      new Promise((resolve) => setTimeout(resolve, 60)),
    ]);

    return {
      status: 'OK',
      data: responseData,
    };
  });
}

const wrapPerRequestCache =
  typeof (React as any).cache === 'function'
    ? ((React as any).cache as typeof loadDinerMenuPayload extends infer F ? (fn: F) => F : never)
    : <T extends (...args: any[]) => any>(fn: T) => fn;

export const loadDinerMenuPayloadCached = wrapPerRequestCache(loadDinerMenuPayload);
