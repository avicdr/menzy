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
        select: { notificationSettings: true },
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
    const wifi = notifSettings?.wifi || { enabled: false, ssid: '', password: '', security: 'WPA' };
    const tableSession = extractTableSessionConfig(notifSettings);

    return NextResponse.json(
      {
        restaurant,
        wifi,
        tableSession,
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
      wifi,
      tableSession,
      welcomeMessage,
      aiTone,
      allowDinerChat,
      allowPairings,
      maxDinerChatPerSession,
    } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(auth, 403);
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
        where: { restaurantId },
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

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: restaurantUpdates,
    });

    // 2. Upsert RestaurantSettings
    const settingsUpdates: any = {};
    if (welcomeMessage !== undefined) settingsUpdates.welcomeMessage = welcomeMessage;
    if (aiTone !== undefined) settingsUpdates.aiTone = aiTone;
    if (allowDinerChat !== undefined) settingsUpdates.allowDinerChat = Boolean(allowDinerChat);
    if (allowPairings !== undefined) settingsUpdates.allowPairings = Boolean(allowPairings);
    if (maxDinerChatPerSession !== undefined) settingsUpdates.maxDinerChatPerSession = Number(maxDinerChatPerSession);

    const updatedSettings = await prisma.restaurantSettings.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        welcomeMessage: welcomeMessage ?? 'Welcome! Explore our dishes or ask our AI waiter anything.',
        aiTone: aiTone ?? 'Warm Editorial & Helpful',
        allowDinerChat: allowDinerChat ?? true,
        allowPairings: allowPairings ?? true,
        maxDinerChatPerSession: maxDinerChatPerSession ? Number(maxDinerChatPerSession) : 25,
      },
      update: settingsUpdates,
    });

    if (savedWifi || savedTableSession) {
      const currentNotifs =
        existingNotifSettings ??
        ((
          await prisma.restaurantOrderingSettings.findUnique({
            where: { restaurantId },
            select: { notificationSettings: true },
          })
        )?.notificationSettings as Record<string, any>) ??
        {};
      const nextNotifs: Record<string, any> = {
        ...currentNotifs,
        ...(savedWifi ? { wifi: savedWifi } : {}),
        ...(savedTableSession ? { tableSession: { ...savedTableSession } } : {}),
      };
      await prisma.restaurantOrderingSettings.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          notificationSettings: nextNotifs as any,
        },
        update: {
          notificationSettings: nextNotifs as any,
        },
      });
    }

    // Invalidate public diner cache
    const cache = getCache();
    await cache.del(`menu:slug:${updatedRestaurant.slug}`);

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
      settings: updatedSettings,
      ...(savedWifi ? { wifi: savedWifi } : {}),
      ...(savedTableSession ? { tableSession: savedTableSession } : {}),
    });
  } catch (error: any) {
    console.error('Restaurant settings PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

