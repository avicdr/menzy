import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';

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
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      restaurant,
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

    // Invalidate public diner cache
    const cache = getCache();
    await cache.del(`menu:slug:${updatedRestaurant.slug}`);

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant,
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Restaurant settings PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
