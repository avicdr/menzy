import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { getCache } from '@/lib/cache/redis';
import { normalizeGuestWifiInput } from '@/lib/wifi/wifi-qr';
import {
  extractTableSessionConfig,
  normalizeTableSessionConfigInput,
} from '@/lib/diner/table-session-config';
import {
  normalizeServiceChargeInput,
  normalizeTaxPercentageInput,
} from '@/lib/orders/tax-config';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
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

    return NextResponse.json(
      {
        settings,
        tableSession: extractTableSessionConfig(settings.notificationSettings),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
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
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
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
      tableSession,
      scanTimeoutMinutes,
      orderExtensionMinutes,
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
      const parsedTax = normalizeTaxPercentageInput(taxPercentage);
      if (!parsedTax.ok) {
        return NextResponse.json({ error: parsedTax.error }, { status: 400 });
      }
      data.taxPercentage = parsedTax.taxPercentage;
    }
    if (serviceChargePercentage !== undefined) {
      const parsedServiceCharge = normalizeServiceChargeInput(serviceChargePercentage);
      if (!parsedServiceCharge.ok) {
        return NextResponse.json({ error: parsedServiceCharge.error }, { status: 400 });
      }
      data.serviceChargePercentage = parsedServiceCharge.serviceChargePercentage;
    }
    if (maxActiveOrders !== undefined) {
      data.maxActiveOrders = Math.max(1, Math.min(500, Number(maxActiveOrders) || 50));
    }

    const hasWifiUpdate = wifi !== undefined;
    const hasTableSessionUpdate =
      tableSession !== undefined ||
      scanTimeoutMinutes !== undefined ||
      orderExtensionMinutes !== undefined;

    if (hasWifiUpdate || hasTableSessionUpdate) {
      const existing = await prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId: auth.restaurant.id },
        select: { notificationSettings: true },
      });
      const currentNotifs = (existing?.notificationSettings as Record<string, any>) || {};
      const nextNotificationSettings: Record<string, any> = {
        ...currentNotifs,
      };

      if (hasWifiUpdate) {
        if (!wifi || typeof wifi !== 'object' || Array.isArray(wifi)) {
          return NextResponse.json({ error: 'Invalid guest Wi-Fi configuration.' }, { status: 400 });
        }
        const parsedWifi = normalizeGuestWifiInput(wifi);
        if (!parsedWifi.ok) {
          return NextResponse.json({ error: parsedWifi.error }, { status: 400 });
        }
        nextNotificationSettings.wifi = parsedWifi.wifi;
      }

      if (hasTableSessionUpdate) {
        if (tableSession !== undefined && (!tableSession || typeof tableSession !== 'object' || Array.isArray(tableSession))) {
          return NextResponse.json(
            { error: 'Invalid table session timeout configuration.' },
            { status: 400 }
          );
        }

        const candidateTableSession = {
          ...(tableSession && typeof tableSession === 'object' ? tableSession : {}),
          ...(scanTimeoutMinutes !== undefined ? { scanTimeoutMinutes } : {}),
          ...(orderExtensionMinutes !== undefined ? { orderExtensionMinutes } : {}),
        };
        const currentTableSession = extractTableSessionConfig(currentNotifs);
        const parsedTableSession = normalizeTableSessionConfigInput(
          candidateTableSession,
          currentTableSession
        );
        if (!parsedTableSession.ok) {
          return NextResponse.json({ error: parsedTableSession.error }, { status: 400 });
        }
        nextNotificationSettings.tableSession = parsedTableSession.tableSession;
      }

      data.notificationSettings = nextNotificationSettings;
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
    if (auth.restaurant.slug) {
      const cache = getCache();
      await cache.del(`menu:slug:${auth.restaurant.slug}`);
    }

    return NextResponse.json(
      {
        success: true,
        settings,
        tableSession: extractTableSessionConfig(settings.notificationSettings),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Ordering settings PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

