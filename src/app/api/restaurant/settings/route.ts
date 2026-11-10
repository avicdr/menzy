import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';
import { normalizeGuestWifiInput, type GuestWifiConfig } from '@/lib/wifi/wifi-qr';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        settings: true,
        orderingSettings: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const notifSettings = (restaurant.orderingSettings?.notificationSettings as Record<string, any>) || {};
    const wifi = notifSettings?.wifi || { enabled: false, ssid: '', password: '', security: 'WPA' };

    return NextResponse.json({
      restaurant,
      wifi,
      settings: restaurant.settings || {
        welcomeMessage: 'Welcome! Explore our dishes or ask our AI waiter anything.',
        aiTone: 'Warm Editorial & Helpful',
        allowDinerChat: true,
        allowPairings: true,
        maxDinerChatPerSession: 25,
      },
    });
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
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
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
      if (coverUrl === null || (typeof coverUrl === 'string' && coverUrl.trim() === '')) {
        restaurantUpdates.coverUrl = null;
      } else if (typeof coverUrl === 'string') {
        const trimmedUrl = coverUrl.trim();
        if (
          !trimmedUrl.startsWith('/uploads/') &&
          !trimmedUrl.startsWith('https://') &&
          !trimmedUrl.startsWith('http://')
        ) {
          return NextResponse.json(
            { error: 'Banner image URL must be an uploaded asset path or a valid http(s) URL.' },
            { status: 400 }
          );
        }
        restaurantUpdates.coverUrl = trimmedUrl;
      } else {
        return NextResponse.json({ error: 'Invalid banner image URL' }, { status: 400 });
      }
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: restaurantUpdates,
    });

    // Update organization billing region if country or currency changed
    if (updatedRestaurant.organizationId && (country || currency)) {
      await prisma.organization.update({
        where: { id: updatedRestaurant.organizationId },
        data: {
          ...(country ? { billingCountry: country } : {}),
          ...(currency ? { billingCurrency: currency } : {}),
        },
      });
    }

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

    if (savedWifi) {
      const existingOrd = await prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId },
        select: { notificationSettings: true },
      });
      const currentNotifs = (existingOrd?.notificationSettings as Record<string, any>) || {};
      await prisma.restaurantOrderingSettings.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          notificationSettings: {
            ...currentNotifs,
            wifi: savedWifi,
          },
        },
        update: {
          notificationSettings: {
            ...currentNotifs,
            wifi: savedWifi,
          },
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
    });
  } catch (error: any) {
    console.error('Restaurant settings PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

