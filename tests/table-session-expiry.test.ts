import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PublicationState, Role } from '@prisma/client';
import prisma from '../src/lib/db/prisma';
import { provisionTrialSubscriptionWithinTx } from '../src/lib/billing/subscription-access';

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  TABLE_SESSION_TIMEOUT_MS,
} from '../src/lib/diner/table-session';
import {
  buildSignedTableQrToken,
  createRestaurantTable,
  resolveTableFromToken,
} from '../src/lib/tables/table-service';
import { POST as sessionPost } from '../src/app/api/diner/session/route';
import { POST as orderPost } from '../src/app/api/diner/orders/route';
import { POST as serviceCallPost } from '../src/app/api/diner/service-calls/route';
import { GET as qrGenerateGet } from '../src/app/api/qr/generate/route';
import { normalizeSiteUrl } from '../src/lib/seo';

describe('Table Session 30-Minute Idle Expiry & Rescan Enforcement', () => {
  let restaurant: any;
  let menuItem: any;
  let requiredModifierIds: string[] = [];
  let tableOne: { id: string; name: string; rawToken: string };
  let tableTwo: { id: string; name: string; rawToken: string };

  const createdTableIds: string[] = [];
  const createdSessionTokens: string[] = [];
  const createdOrderIds: string[] = [];
  const createdServiceCallIds: string[] = [];
  let createdRestaurantId: string | null = null;
  let createdOrgId: string | null = null;
  let createdOwnerUserId: string | null = null;

  beforeAll(async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ownerUser = await prisma.user.create({
      data: {
        email: `expiry-owner-${suffix}@menzy.test`,
        name: 'Expiry Test Owner',
        passwordHash: 'test-hash',
      },
    });
    createdOwnerUserId = ownerUser.id;

    const org = await prisma.organization.create({
      data: {
        name: `Expiry Test Org ${suffix}`,
        ownerUserId: ownerUser.id,
        billingCountry: 'IN',
        billingCurrency: 'INR',
      },
    });
    createdOrgId = org.id;

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: ownerUser.id,
        role: Role.OWNER,
      },
    });

    await provisionTrialSubscriptionWithinTx(prisma, {
      organizationId: org.id,
      currency: 'INR',
    });

    const createdRestaurant = await prisma.restaurant.create({
      data: {
        organizationId: org.id,
        slug: `test-session-expiry-${suffix}`,
        displayName: `Test Session Expiry ${suffix}`,
        country: 'IN',
        city: 'Bengaluru',
        currency: 'INR',
        publicationState: PublicationState.PUBLISHED,
        isClaimed: true,
      },
    });
    createdRestaurantId = createdRestaurant.id;

    const menu = await prisma.menu.create({
      data: {
        restaurantId: createdRestaurant.id,
        title: 'Test Menu',
        active: true,
      },
    });
    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: 'Mains',
        sortOrder: 1,
      },
    });
    menuItem = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: createdRestaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        customName: 'Masala Chai',
        priceMinor: 12000,
        currency: 'INR',
        isPublished: true,
        isAvailable: true,
        sortOrder: 1,
      },
    });
    restaurant = createdRestaurant;

    const t1 = await createRestaurantTable({
      restaurantId: restaurant.id,
      name: `Timeout Test A ${Date.now()}`,
      section: 'Patio',
      capacity: 4,
    });
    tableOne = { id: t1.table.id, name: t1.table.name, rawToken: t1.rawToken };
    createdTableIds.push(t1.table.id);

    const t2 = await createRestaurantTable({
      restaurantId: restaurant.id,
      name: `Timeout Test B ${Date.now()}`,
      section: 'Patio',
      capacity: 4,
    });
    tableTwo = { id: t2.table.id, name: t2.table.name, rawToken: t2.rawToken };
    createdTableIds.push(t2.table.id);
  });

  afterAll(async () => {
    if (createdServiceCallIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "TableServiceCall" WHERE "id" = ANY($1::text[])`,
        createdServiceCallIds
      ).catch(() => {});
    }
    if (createdOrderIds.length > 0) {
      await prisma.order
        .deleteMany({ where: { id: { in: createdOrderIds } } })
        .catch(() => {});
    }
    if (createdSessionTokens.length > 0) {
      await prisma.scanEvent
        .deleteMany({ where: { sessionToken: { in: createdSessionTokens } } })
        .catch(() => {});
      await prisma.dinerSession
        .deleteMany({ where: { sessionToken: { in: createdSessionTokens } } })
        .catch(() => {});
    }
    if (createdTableIds.length > 0) {
      await prisma.restaurantTable
        .deleteMany({ where: { id: { in: createdTableIds } } })
        .catch(() => {});
    }
    if (createdRestaurantId) {
      await prisma.restaurant
        .deleteMany({ where: { id: createdRestaurantId } })
        .catch(() => {});
    }
    if (createdOrgId) {
      await prisma.organization
        .deleteMany({ where: { id: createdOrgId } })
        .catch(() => {});
    }
    if (createdOwnerUserId) {
      await prisma.user
        .deleteMany({ where: { id: createdOwnerUserId } })
        .catch(() => {});
    }
  });

  it('expires an idle device session 30 minutes after scan and clears DinerSession.tableId', async () => {
    const scanTime = new Date(Date.now() - 25 * 60 * 1000);
    const token = `ds_idle_unit_${Date.now()}`;
    createdSessionTokens.push(token);

    await prisma.dinerSession.create({
      data: {
        sessionToken: token,
        restaurantId: restaurant.id,
        tableId: tableOne.id,
        lastActiveAt: scanTime,
      },
    });
    await prisma.scanEvent.create({
      data: {
        restaurantId: restaurant.id,
        tableId: tableOne.id,
        sessionToken: token,
        timestamp: scanTime,
      },
    });

    // At 29m59s after scan -> still valid
    const stillValid = await evaluateDeviceTableSession({
      restaurantId: restaurant.id,
      tableId: tableOne.id,
      sessionToken: token,
      now: new Date(scanTime.getTime() + TABLE_SESSION_TIMEOUT_MS - 1000),
    });
    expect(stillValid.valid).toBe(true);
    expect(stillValid.expiresAt?.getTime()).toBe(scanTime.getTime() + TABLE_SESSION_TIMEOUT_MS);

    // At 30m01s after scan with no order -> expired and tableId cleared
    const expired = await evaluateDeviceTableSession({
      restaurantId: restaurant.id,
      tableId: tableOne.id,
      sessionToken: token,
      now: new Date(scanTime.getTime() + TABLE_SESSION_TIMEOUT_MS + 1000),
    });
    expect(expired.valid).toBe(false);
    expect(expired.code).toBe('TABLE_SCAN_EXPIRED');

    const refreshedSession = await prisma.dinerSession.findUnique({
      where: { sessionToken: token },
    });
    expect(refreshedSession?.tableId).toBeNull();
  });

  it('extends the 30-minute timer from the most recent order placed on that device', async () => {
    const t0 = new Date('2026-11-10T10:00:00.000Z');
    const orderPlacedAt = new Date(t0.getTime() + 20 * 60 * 1000); // T+20m
    const token = `ds_order_extend_${Date.now()}`;
    createdSessionTokens.push(token);

    const session = await prisma.dinerSession.create({
      data: {
        sessionToken: token,
        restaurantId: restaurant.id,
        tableId: tableOne.id,
        lastActiveAt: t0,
      },
    });
    await prisma.scanEvent.create({
      data: {
        restaurantId: restaurant.id,
        tableId: tableOne.id,
        sessionToken: token,
        timestamp: t0,
      },
    });

    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: tableOne.id,
        dinerSessionId: session.id,
        orderNumber: `99${Date.now().toString().slice(-6)}`,
        status: 'PLACED',
        currency: restaurant.currency,
        subtotalMinor: menuItem.priceMinor || 1000,
        taxMinor: 0,
        serviceChargeMinor: 0,
        totalMinor: menuItem.priceMinor || 1000,
        placedAt: orderPlacedAt,
      },
    });
    createdOrderIds.push(order.id);

    // At T+35m (>30m since scan, only 15m since order) -> MUST remain VALID
    const atT35 = await evaluateDeviceTableSession({
      restaurantId: restaurant.id,
      tableId: tableOne.id,
      sessionToken: token,
      now: new Date(t0.getTime() + 35 * 60 * 1000),
    });
    expect(atT35.valid).toBe(true);
    expect(atT35.expiresAt?.getTime()).toBe(orderPlacedAt.getTime() + TABLE_SESSION_TIMEOUT_MS);

    // At T+50m01s (30m01s since last order) -> MUST expire
    const atT51 = await evaluateDeviceTableSession({
      restaurantId: restaurant.id,
      tableId: tableOne.id,
      sessionToken: token,
      now: new Date(orderPlacedAt.getTime() + TABLE_SESSION_TIMEOUT_MS + 1000),
    });
    expect(atT51.valid).toBe(false);
    expect(atT51.code).toBe('TABLE_SCAN_EXPIRED');
  });

  it('enforces scan & 30-min timeout across HTTP session, order, and waiter-call endpoints without extending on reload', async () => {
    // 1. Fresh scan via POST /api/diner/session
    const scanRes = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: tableOne.rawToken,
        }),
      })
    );
    expect(scanRes.status).toBe(200);
    const scanBody = await scanRes.json();
    expect(scanBody.tableId).toBe(tableOne.id);
    expect(scanBody.tableName).toBe(tableOne.name);
    expect(scanBody.expiresAt).toBeDefined();
    expect(scanBody.sessionExpired).toBe(false);

    const sessionToken: string = scanBody.sessionToken;
    createdSessionTokens.push(sessionToken);
    const initialExpiresAt = scanBody.expiresAt;

    // Cookie should be issued for the restaurant
    const setCookieHeader = scanRes.headers.get('set-cookie') || '';
    const cookieName = getDinerSessionCookieName(restaurant.id);
    expect(setCookieHeader).toContain(`${cookieName}=${sessionToken}`);

    // 2. Passive reload without `?t=` must NOT extend expiresAt or bump lastActiveAt
    await new Promise((r) => setTimeout(r, 30));
    const reloadRes = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${sessionToken}`,
        },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
        }),
      })
    );
    expect(reloadRes.status).toBe(200);
    const reloadBody = await reloadRes.json();
    expect(reloadBody.tableId).toBe(tableOne.id);
    expect(reloadBody.expiresAt).toBe(initialExpiresAt);

    // 3. Ordering for a DIFFERENT table from this session is rejected (403 TABLE_MISMATCH)
    const crossTableOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableTwo.id,
          sessionToken,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              modifierOptionIds: requiredModifierIds,
            },
          ],
        }),
      })
    );
    expect(crossTableOrderRes.status).toBe(403);
    const crossTableBody = await crossTableOrderRes.json();
    expect(crossTableBody.code).toBe('TABLE_MISMATCH');
    expect(crossTableBody.currentTable?.tableId).toBe(tableOne.id);
    expect(crossTableBody.currentTable?.tableName).toBe(tableOne.name);

    // 4. Ordering WITHOUT a session is rejected
    const anonOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableOne.id,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              modifierOptionIds: requiredModifierIds,
            },
          ],
        }),
      })
    );
    expect(anonOrderRes.status).toBe(403);

    // 5. Valid order via HttpOnly cookie resets/extends 30-min session window
    const validOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${sessionToken}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableOne.id,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              modifierOptionIds: requiredModifierIds,
            },
          ],
        }),
      })
    );
    expect(validOrderRes.status).toBe(200);
    const validOrderBody = await validOrderRes.json();
    createdOrderIds.push(validOrderBody.order.id);
    expect(validOrderBody.tableSession?.expiresAt).toBeDefined();
    expect(Date.parse(validOrderBody.tableSession.expiresAt)).toBeGreaterThan(
      Date.parse(initialExpiresAt)
    );

    // 6. Calling waiter succeeds while session is active
    const activeCallRes = await serviceCallPost(
      new Request('http://localhost:3000/api/diner/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableOne.id,
          sessionToken,
          callType: 'WATER',
        }),
      })
    );
    expect(activeCallRes.status).toBe(200);
    const activeCallBody = await activeCallRes.json();
    createdServiceCallIds.push(activeCallBody.serviceCall.id);

    // 7. Backdate ScanEvent + Order + lastActiveAt to 35 minutes ago (simulating 35 min idle)
    const past35m = new Date(Date.now() - 35 * 60 * 1000);
    await prisma.scanEvent.updateMany({
      where: { sessionToken, tableId: tableOne.id },
      data: { timestamp: past35m },
    });
    await prisma.order.update({
      where: { id: validOrderBody.order.id },
      data: { placedAt: past35m },
    });
    await prisma.dinerSession.update({
      where: { sessionToken },
      data: { lastActiveAt: past35m },
    });

    // Placing an order after 35 min idle MUST fail with 403 TABLE_SCAN_EXPIRED
    const expiredOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableOne.id,
          sessionToken,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              modifierOptionIds: requiredModifierIds,
            },
          ],
        }),
      })
    );
    expect(expiredOrderRes.status).toBe(403);
    const expiredOrderBody = await expiredOrderRes.json();
    expect(expiredOrderBody.code).toBe('TABLE_SCAN_EXPIRED');
    expect(expiredOrderBody.requiresRescan).toBe(true);

    // Calling waiter after expiry MUST also fail with 403 TABLE_SCAN_EXPIRED
    const expiredCallRes = await serviceCallPost(
      new Request('http://localhost:3000/api/diner/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableOne.id,
          sessionToken,
          callType: 'BILL',
        }),
      })
    );
    expect(expiredCallRes.status).toBe(403);
    const expiredCallBody = await expiredCallRes.json();
    expect(expiredCallBody.code).toBe('TABLE_SCAN_EXPIRED');

    // 8. Rescanning the table QR restores valid ordering access
    const rescanRes = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: tableOne.rawToken,
          sessionToken,
        }),
      })
    );
    expect(rescanRes.status).toBe(200);
    const rescanBody = await rescanRes.json();
    expect(rescanBody.tableId).toBe(tableOne.id);
    expect(rescanBody.sessionExpired).toBe(false);

    const postRescanOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: tableOne.id,
          sessionToken,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 1,
              modifierOptionIds: requiredModifierIds,
            },
          ],
        }),
      })
    );
    expect(postRescanOrderRes.status).toBe(200);
    const postRescanOrderBody = await postRescanOrderRes.json();
    createdOrderIds.push(postRescanOrderBody.order.id);
  });

  it('rejects invalid/rotated QR tokens without keeping stale table access and blocks unauthenticated table QR generation', async () => {
    const token = `ds_invalid_qr_${Date.now()}`;
    createdSessionTokens.push(token);

    // First scan valid tableOne
    const firstScan = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: tableOne.rawToken,
          sessionToken: token,
        }),
      })
    );
    expect((await firstScan.json()).tableId).toBe(tableOne.id);

    // Then scan forged/rotated token -> invalidTableToken: true and tableId cleared
    const badScan = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: 'tbl_forged_or_rotated_token_0000',
          sessionToken: token,
        }),
      })
    );
    const badBody = await badScan.json();
    expect(badBody.invalidTableToken).toBe(true);
    expect(badBody.tableId).toBeNull();

    // Unauthenticated callers cannot mint table-specific QR codes on /api/qr/generate
    const unauthTableQrRes = await qrGenerateGet(
      new Request(
        `http://localhost:3000/api/qr/generate?slug=${encodeURIComponent(restaurant.slug)}&tableId=${encodeURIComponent(tableOne.id)}`
      )
    );
    expect(unauthTableQrRes.status).toBe(401);

    // Signed token resolves cleanly and public restaurant-level QR still succeeds without table privilege
    const dbTableOne = await prisma.restaurantTable.findUnique({ where: { id: tableOne.id } });
    expect(dbTableOne).not.toBeNull();
    const signedToken = buildSignedTableQrToken(dbTableOne!);
    const resolvedSigned = await resolveTableFromToken(restaurant.slug, signedToken);
    expect(resolvedSigned?.table.id).toBe(tableOne.id);

    const publicQrRes = await qrGenerateGet(
      new Request(
        `http://localhost:3000/api/qr/generate?slug=${encodeURIComponent(restaurant.slug)}`
      )
    );
    expect(publicQrRes.status).toBe(200);
    const publicQrBody = await publicQrRes.json();
    const expectedBaseUrl = normalizeSiteUrl(
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    );
    expect(publicQrBody.targetUrl).toBe(`${expectedBaseUrl}/m/${restaurant.slug}`);
  });
});

