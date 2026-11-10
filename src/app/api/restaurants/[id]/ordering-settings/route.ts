import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { getCache } from '@/lib/cache/redis';
import { normalizeGuestWifiInput } from '@/lib/wifi/wifi-qr';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.restaurantOrderingSettings.upsert({
      where: { restaurantId: auth.restaurant.id },
      create: {
        restaurantId: auth.restaurant.id,
        orderingEnabled: true,
        acceptsNewOrders: true,
        allowSpecialInstructions: true,
        paymentMode: 'PAY_AT_COUNTER',
        taxPercentage: 5.0,
        serviceChargePercentage: 0.0,
        maxActiveOrders: 50,
      },
      update: {},
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Ordering settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      orderingEnabled,
      acceptsNewOrders,
      allowSpecialInstructions,
      paymentMode,
      taxPercentage,
      serviceChargePercentage,
      maxActiveOrders,
      wifi,
    } = body;

    const data: any = {};
    if (orderingEnabled !== undefined) data.orderingEnabled = Boolean(orderingEnabled);
    if (acceptsNewOrders !== undefined) data.acceptsNewOrders = Boolean(acceptsNewOrders);
    if (allowSpecialInstructions !== undefined) data.allowSpecialInstructions = Boolean(allowSpecialInstructions);
    if (paymentMode !== undefined) {
      const valid = ['PAY_AT_COUNTER', 'PAY_AT_TABLE', 'BOTH'];
      if (valid.includes(paymentMode)) data.paymentMode = paymentMode;
    }
    if (taxPercentage !== undefined) {
      data.taxPercentage = Math.max(0, Math.min(100, Number(taxPercentage) || 0));
    }
    if (serviceChargePercentage !== undefined) {
      data.serviceChargePercentage = Math.max(0, Math.min(100, Number(serviceChargePercentage) || 0));
    }
    if (maxActiveOrders !== undefined) {
      data.maxActiveOrders = Math.max(1, Math.min(500, Number(maxActiveOrders) || 50));
    }
    if (wifi !== undefined) {
      if (!wifi || typeof wifi !== 'object' || Array.isArray(wifi)) {
        return NextResponse.json({ error: 'Invalid guest Wi-Fi configuration.' }, { status: 400 });
      }
      const parsedWifi = normalizeGuestWifiInput(wifi);
      if (!parsedWifi.ok) {
        return NextResponse.json({ error: parsedWifi.error }, { status: 400 });
      }

      const existing = await prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId: auth.restaurant.id },
        select: { notificationSettings: true },
      });
      const currentNotifs = (existing?.notificationSettings as Record<string, any>) || {};
      data.notificationSettings = {
        ...currentNotifs,
        wifi: parsedWifi.wifi,
      };
    }

    const settings = await prisma.restaurantOrderingSettings.upsert({
      where: { restaurantId: auth.restaurant.id },
      create: {
        restaurantId: auth.restaurant.id,
        ...data,
      },
      update: data,
    });

    // Invalidate restaurant diner cache if exists
    const rest = await prisma.restaurant.findUnique({
      where: { id: auth.restaurant.id },
      select: { slug: true },
    });
    if (rest?.slug) {
      const cache = getCache();
      await cache.del(`menu:slug:${rest.slug}`);
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Ordering settings PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

