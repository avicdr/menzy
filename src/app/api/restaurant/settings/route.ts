import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';
import { normalizeGuestWifiInput, type GuestWifiConfig } from '@/lib/wifi/wifi-qr';
import { validateBannerUrlInput } from '@/lib/banner/banner-validation';
import { THEME_PRESETS, normalizeThemeFont } from '@/lib/theme/theme-presets';
import {
  extractTableSessionConfig,
  normalizeTableSessionConfigInput,
  type TableSessionConfig,
} from '@/lib/diner/table-session-config';
import {
  DEFAULT_SERVICE_CHARGE_PERCENTAGE,
  normalizeServiceChargeInput,
  normalizeTaxPercentageInput,
  resolveServiceChargePercentageValue,
  resolveTaxPercentageValue,
} from '@/lib/orders/tax-config';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized || !auth.restaurant) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const hasEmbeddedSettings =
      'settings' in auth.restaurant && 'theme' in auth.restaurant;

    const [orderingSettings, hydratedRestaurant] = await Promise.all([
      prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId: auth.restaurant.id },
        select: {
          notificationSettings: true,
          taxPercentage: true,
          serviceChargePercentage: true,
        },
      }),
      hasEmbeddedSettings
        ? Promise.resolve(null)
        : prisma.restaurant.findUnique({
            where: { id: auth.restaurant.id },
            include: { settings: true, theme: true },
          }),
    ]);

    const restaurantRecord = hydratedRestaurant || auth.restaurant;
    const rawTheme = restaurantRecord.theme || THEME_PRESETS.WARM_EDITORIAL;
    const theme = {
      ...rawTheme,
      headingFont: normalizeThemeFont(rawTheme.headingFont, 'Plus Jakarta Sans'),
      bodyFont: normalizeThemeFont(rawTheme.bodyFont, 'Inter'),
    };

    const { organization: _org, theme: _theme, ...restaurant } = restaurantRecord;
    const notifSettings = (orderingSettings?.notificationSettings as Record<string, any>) || {};
    const showLogo = notifSettings?.showLogo !== false;
    const wifi = notifSettings?.wifi || { enabled: false, ssid: '', password: '', security: 'WPA' };
    const tableSession = extractTableSessionConfig(notifSettings);
    const taxPercentage = resolveTaxPercentageValue(orderingSettings?.taxPercentage);
    const serviceChargePercentage = resolveServiceChargePercentageValue(
      orderingSettings?.serviceChargePercentage,
      DEFAULT_SERVICE_CHARGE_PERCENTAGE
    );

    return NextResponse.json(
      {
        restaurant,
        showLogo,
        wifi,
        tableSession,
        taxPercentage,
        serviceChargePercentage,
        theme,
        settings: restaurantRecord.settings || {
          welcomeMessage: 'Welcome! Explore our dishes or ask our AI waiter anything.',
          aiTone: 'Warm Editorial & Helpful',
          allowDinerChat: true,
          allowPairings: true,
          maxDinerChatPerSession: 25,
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Restaurant settings GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      displayName,
      description,
      city,
      country,
      currency,
      timezone,
      address,
      phone,
      email,
      googleReviewUrl,
      coverUrl,
      logoUrl,
      showLogo,
      wifi,
      tableSession,
      taxPercentage,
      serviceChargePercentage,
      welcomeMessage,
      aiTone,
      allowDinerChat,
      allowPairings,
      maxDinerChatPerSession,
    } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      includeSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized || !auth.restaurant) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const targetRestaurantId = auth.restaurant.id;

    // Validate tax & service charge percentages before mutating records
    let savedTaxPercentage: number | undefined;
    if (taxPercentage !== undefined) {
      const parsedTax = normalizeTaxPercentageInput(taxPercentage);
      if (!parsedTax.ok) {
        return NextResponse.json({ error: parsedTax.error }, { status: 400 });
      }
      savedTaxPercentage = parsedTax.taxPercentage;
    }

    let savedServiceChargePercentage: number | undefined;
    if (serviceChargePercentage !== undefined) {
      const parsedService = normalizeServiceChargeInput(serviceChargePercentage);
      if (!parsedService.ok) {
        return NextResponse.json({ error: parsedService.error }, { status: 400 });
      }
      savedServiceChargePercentage = parsedService.serviceChargePercentage;
    }

    // Validate Wi-Fi configuration before mutating restaurant or settings records
    let savedWifi: GuestWifiConfig | undefined;
    if (wifi !== undefined) {
      if (!wifi || typeof wifi !== 'object' || Array.isArray(wifi)) {
        return NextResponse.json({ error: 'Invalid guest Wi-Fi configuration.' }, { status: 400 });
      }
      const parsedWifi = normalizeGuestWifiInput(wifi);
      if (!parsedWifi.ok) {
        return NextResponse.json({ error: parsedWifi.error }, { status: 400 });
      }
      savedWifi = parsedWifi.wifi;
    }

    // Validate Table Session timeout configuration before mutating records
    let savedTableSession: TableSessionConfig | undefined;
    let existingNotifSettings: Record<string, any> | undefined;
    if (tableSession !== undefined) {
      const existingOrd = await prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId: targetRestaurantId },
        select: { notificationSettings: true },
      });
      existingNotifSettings = (existingOrd?.notificationSettings as Record<string, any>) || {};
      const parsedTableSession = normalizeTableSessionConfigInput(
        tableSession,
        extractTableSessionConfig(existingNotifSettings)
      );
      if (!parsedTableSession.ok) {
        return NextResponse.json({ error: parsedTableSession.error }, { status: 400 });
      }
      savedTableSession = parsedTableSession.tableSession;
    }

    // 1. Update Restaurant base attributes
    const restaurantUpdates: any = {};
    if (displayName !== undefined) restaurantUpdates.displayName = displayName;
    if (description !== undefined) restaurantUpdates.description = description;
    if (city !== undefined) restaurantUpdates.city = city;
    if (country !== undefined) restaurantUpdates.country = country;
    if (currency !== undefined) restaurantUpdates.currency = currency;
    if (timezone !== undefined) restaurantUpdates.timezone = timezone;
    if (address !== undefined) restaurantUpdates.address = address;
    if (phone !== undefined) restaurantUpdates.phone = phone;
    if (email !== undefined) restaurantUpdates.email = email;
    if (googleReviewUrl !== undefined) restaurantUpdates.googleReviewUrl = googleReviewUrl;
    if (coverUrl !== undefined) {
      const parsedCover = validateBannerUrlInput(coverUrl);
      if (!parsedCover.ok) {
        return NextResponse.json({ error: parsedCover.error }, { status: 400 });
      }
      restaurantUpdates.coverUrl = parsedCover.value;
    }
    if (logoUrl !== undefined) {
      const parsedLogo = validateBannerUrlInput(logoUrl);
      if (!parsedLogo.ok) {
        return NextResponse.json({ error: parsedLogo.error }, { status: 400 });
      }
      restaurantUpdates.logoUrl = parsedLogo.value;
    }

    // 2. Prepare RestaurantSettings updates
    const settingsUpdates: any = {};
    if (welcomeMessage !== undefined) settingsUpdates.welcomeMessage = welcomeMessage;
    if (aiTone !== undefined) settingsUpdates.aiTone = aiTone;
    if (allowDinerChat !== undefined) settingsUpdates.allowDinerChat = Boolean(allowDinerChat);
    if (allowPairings !== undefined) settingsUpdates.allowPairings = Boolean(allowPairings);
    if (maxDinerChatPerSession !== undefined) settingsUpdates.maxDinerChatPerSession = Number(maxDinerChatPerSession);

    const resolveOrderingUpdate = async () => {
      const hasNotifUpdate = Boolean(savedWifi || savedTableSession || showLogo !== undefined);
      const hasChargeUpdate =
        savedTaxPercentage !== undefined || savedServiceChargePercentage !== undefined;
      if (!hasNotifUpdate && !hasChargeUpdate) return null;

      let nextNotifs: Record<string, any> | undefined;
      if (hasNotifUpdate) {
        const currentNotifs =
          existingNotifSettings ??
          ((
            await prisma.restaurantOrderingSettings.findUnique({
              where: { restaurantId: targetRestaurantId },
              select: { notificationSettings: true },
            })
          )?.notificationSettings as Record<string, any>) ??
          {};
        nextNotifs = {
          ...currentNotifs,
          ...(savedWifi ? { wifi: savedWifi } : {}),
          ...(savedTableSession ? { tableSession: { ...savedTableSession } } : {}),
          ...(showLogo !== undefined ? { showLogo: Boolean(showLogo) } : {}),
        };
      }

      const orderingUpdates: any = {
        ...(savedTaxPercentage !== undefined ? { taxPercentage: savedTaxPercentage } : {}),
        ...(savedServiceChargePercentage !== undefined
          ? { serviceChargePercentage: savedServiceChargePercentage }
          : {}),
        ...(nextNotifs ? { notificationSettings: nextNotifs as any } : {}),
      };

      return prisma.restaurantOrderingSettings.upsert({
        where: { restaurantId: targetRestaurantId },
        create: {
          restaurantId: targetRestaurantId,
          ...orderingUpdates,
        },
        update: orderingUpdates,
      });
    };

    const [updatedRestaurant, updatedSettings, updatedOrderingSettings] = await Promise.all([
      prisma.restaurant.update({
        where: { id: targetRestaurantId },
        data: restaurantUpdates,
      }),
      prisma.restaurantSettings.upsert({
        where: { restaurantId: targetRestaurantId },
        create: {
          restaurantId: targetRestaurantId,
          welcomeMessage: welcomeMessage ?? 'Welcome! Explore our dishes or ask our AI waiter anything.',
          aiTone: aiTone ?? 'Warm Editorial & Helpful',
          allowDinerChat: allowDinerChat ?? true,
          allowPairings: allowPairings ?? true,
          maxDinerChatPerSession: maxDinerChatPerSession ? Number(maxDinerChatPerSession) : 25,
        },
        update: settingsUpdates,
      }),
      resolveOrderingUpdate(),
    ]);

    // Invalidate public diner and restaurant cache
    const cache = getCache();
    await Promise.allSettled([
      cache.del(`menu:slug:${updatedRestaurant.slug}`),
      cache.del(`menzy:restaurant:${targetRestaurantId}`),
      cache.del(`menzy:restaurant:slug:${updatedRestaurant.slug}`),
      cache.del(`menzy:diner:menu:${updatedRestaurant.slug}`),
      cache.del(`menzy:diner:menu:${targetRestaurantId}`),
    ]);

    const finalNotifSettings =
      (updatedOrderingSettings?.notificationSettings as Record<string, any>) ||
      existingNotifSettings ||
      {};
    const finalShowLogo = finalNotifSettings?.showLogo !== false;

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
      showLogo: finalShowLogo,
      settings: updatedSettings,
      ...(savedWifi ? { wifi: savedWifi } : {}),
      ...(savedTableSession ? { tableSession: savedTableSession } : {}),
      ...(updatedOrderingSettings
        ? {
            taxPercentage: resolveTaxPercentageValue(updatedOrderingSettings.taxPercentage),
            serviceChargePercentage: resolveServiceChargePercentageValue(
              updatedOrderingSettings.serviceChargePercentage,
              DEFAULT_SERVICE_CHARGE_PERCENTAGE
            ),
          }
        : {}),
    });
  } catch (error: any) {
    console.error('Restaurant settings PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

