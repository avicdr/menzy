import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { PublicationState, Role } from '@prisma/client';

let mockOwnerCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'dishora_owner_session' && mockOwnerCookieValue
        ? { name, value: mockOwnerCookieValue }
        : undefined,
  }),
}));

import { createOwnerToken } from '../src/lib/auth/owner-auth';
import {
  computeTableSessionWindow,
  DEFAULT_ORDER_EXTENSION_MINUTES,
  DEFAULT_SCAN_TIMEOUT_MINUTES,
  extractTableSessionConfig,
  formatSessionExpiredSummary,
  normalizeTableSessionConfigInput,
} from '../src/lib/diner/table-session-config';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
} from '../src/lib/diner/table-session';
import { createRestaurantTable } from '../src/lib/tables/table-service';
import { provisionTrialSubscriptionWithinTx } from '../src/lib/billing/subscription-access';
import {
  GET as orderingSettingsGet,
  PATCH as orderingSettingsPatch,
} from '../src/app/api/restaurants/[id]/ordering-settings/route';
import {
  GET as restaurantSettingsGet,
  PATCH as restaurantSettingsPatch,
} from '../src/app/api/restaurant/settings/route';
import { GET as dinerMenuGet } from '../src/app/api/diner/menu/route';
import { POST as sessionPost } from '../src/app/api/diner/session/route';
import { POST as orderPost } from '../src/app/api/diner/orders/route';
import { POST as serviceCallPost } from '../src/app/api/diner/service-calls/route';

describe('Customizable Table QR Session Scan Timeout & Order Extension', () => {
  describe('Pure configuration & window calculation', () => {
    it('defaults to 30 min scan timeout and 30 min post-order extension when unset', () => {
      expect(extractTableSessionConfig(null)).toEqual({
        scanTimeoutMinutes: DEFAULT_SCAN_TIMEOUT_MINUTES,
        orderExtensionMinutes: DEFAULT_ORDER_EXTENSION_MINUTES,
      });
      expect(extractTableSessionConfig({ wifi: { enabled: true } })).toEqual({
        scanTimeoutMinutes: 30,
        orderExtensionMinutes: 30,
      });
    });

    it('validates integer bounds (1..480 minutes) and rejects invalid values', () => {
      expect(
        normalizeTableSessionConfigInput({ scanTimeoutMinutes: 15, orderExtensionMinutes: 45 })
      ).toEqual({
        ok: true,
        tableSession: { scanTimeoutMinutes: 15, orderExtensionMinutes: 45 },
      });

      expect(
        normalizeTableSessionConfigInput({ scanTimeoutMinutes: 0, orderExtensionMinutes: 30 }).ok
      ).toBe(false);
      expect(
        normalizeTableSessionConfigInput({ scanTimeoutMinutes: 30, orderExtensionMinutes: 481 }).ok
      ).toBe(false);
      expect(
        normalizeTableSessionConfigInput({ scanTimeoutMinutes: 12.5, orderExtensionMinutes: 30 }).ok
      ).toBe(false);
      expect(
        normalizeTableSessionConfigInput({ scanTimeoutMinutes: 'abc', orderExtensionMinutes: 30 }).ok
      ).toBe(false);
      expect(normalizeTableSessionConfigInput(null).ok).toBe(false);
    });

    it('uses scanTimeoutMinutes before ordering, orderExtensionMinutes after ordering, and resets on rescan', () => {
      const scanAt = new Date('2026-11-11T12:00:00.000Z');

      // 1. Before any order: uses scanTimeoutMinutes = 12
      const initialWindow = computeTableSessionWindow({
        lastScanAt: scanAt,
        lastOrderAt: null,
        scanTimeoutMinutes: 12,
        orderExtensionMinutes: 45,
      });
      expect(initialWindow.timeoutKind).toBe('SCAN');
      expect(initialWindow.timeoutMinutes).toBe(12);
      expect(initialWindow.expiresAt.toISOString()).toBe('2026-11-11T12:12:00.000Z');

      // 2. Order placed at T+8m -> extends by orderExtensionMinutes = 45 (T+53m)
      const orderAt = new Date('2026-11-11T12:08:00.000Z');
      const extendedWindow = computeTableSessionWindow({
        lastScanAt: scanAt,
        lastOrderAt: orderAt,
        scanTimeoutMinutes: 12,
        orderExtensionMinutes: 45,
      });
      expect(extendedWindow.timeoutKind).toBe('ORDER_EXTENSION');
      expect(extendedWindow.timeoutMinutes).toBe(45);
      expect(extendedWindow.expiresAt.toISOString()).toBe('2026-11-11T12:53:00.000Z');

      // 3. Ordering immediately when orderExtensionMinutes < scanTimeoutMinutes never shortens scan window
      const immediateOrderWindow = computeTableSessionWindow({
        lastScanAt: scanAt,
        lastOrderAt: new Date('2026-11-11T12:02:00.000Z'),
        scanTimeoutMinutes: 30,
        orderExtensionMinutes: 15,
      });
      expect(immediateOrderWindow.expiresAt.toISOString()).toBe('2026-11-11T12:30:00.000Z');
      expect(immediateOrderWindow.hasOrderInCycle).toBe(true);

      // 4. Rescan after expiry (new scan > old order) restarts cleanly with scanTimeoutMinutes
      const rescanAt = new Date('2026-11-11T13:05:00.000Z');
      const rescanWindow = computeTableSessionWindow({
        lastScanAt: rescanAt,
        lastOrderAt: orderAt,
        scanTimeoutMinutes: 12,
        orderExtensionMinutes: 45,
      });
      expect(rescanWindow.hasOrderInCycle).toBe(false);
      expect(rescanWindow.timeoutKind).toBe('SCAN');
      expect(rescanWindow.timeoutMinutes).toBe(12);
      expect(rescanWindow.expiresAt.toISOString()).toBe('2026-11-11T13:17:00.000Z');
    });

    it('formats clear dynamic expiration messages', () => {
      expect(
        formatSessionExpiredSummary({
          timeoutMinutes: 12,
          timeoutKind: 'SCAN',
          tableName: 'Table 04',
        })
      ).toContain('12 minutes');

      expect(
        formatSessionExpiredSummary({
          timeoutMinutes: 45,
          timeoutKind: 'ORDER_EXTENSION',
          tableName: 'Table 04',
        })
      ).toContain('45-minute ordering window');
    });
  });

  describe('Owner dashboard persistence & end-to-end diner enforcement', () => {
    const suffix = crypto.randomBytes(4).toString('hex');
    let ownerUser: any;
    let org: any;
    let restaurant: any;
    let dish: any;
    let tableA: { id: string; name: string; rawToken: string };

    const createdSessionTokens: string[] = [];
    const createdOrderIds: string[] = [];
    const createdServiceCallIds: string[] = [];

    beforeAll(async () => {
      ownerUser = await prisma.user.create({
        data: {
          email: `timer-owner-${suffix}@menzy.test`,
          passwordHash: 'test-hash',
          name: 'Timer Owner',
        },
      });

      org = await prisma.organization.create({
        data: {
          name: `Timer Org ${suffix}`,
          ownerUserId: ownerUser.id,
          billingCountry: 'IN',
        },
      });

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

      mockOwnerCookieValue = createOwnerToken(ownerUser.id, ownerUser.email);

      restaurant = await prisma.restaurant.create({
        data: {
          organizationId: org.id,
          slug: `timer-cafe-${suffix}`,
          displayName: `Timer Cafe ${suffix}`,
          country: 'IN',
          city: 'Lucknow',
          currency: 'INR',
          publicationState: PublicationState.PUBLISHED,
          isClaimed: true,
        },
      });

      await prisma.restaurantOrderingSettings.create({
        data: {
          restaurantId: restaurant.id,
          orderingEnabled: true,
          acceptsNewOrders: true,
          taxPercentage: 5.0,
          serviceChargePercentage: 0.0,
          notificationSettings: {
            wifi: {
              enabled: true,
              ssid: 'TimerCafeGuest',
              password: '',
              security: 'nopass',
            },
          },
        },
      });

      const menu = await prisma.menu.create({
        data: {
          restaurantId: restaurant.id,
          title: 'All Day',
          active: true,
        },
      });

      const category = await prisma.menuCategory.create({
        data: {
          menuId: menu.id,
          name: 'Plates',
          sortOrder: 1,
        },
      });

      dish = await prisma.restaurantMenuItem.create({
        data: {
          restaurantId: restaurant.id,
          menuId: menu.id,
          categoryId: category.id,
          customName: 'Saffron Pasta',
          priceMinor: 32000,
          currency: 'INR',
          isPublished: true,
          isAvailable: true,
          sortOrder: 1,
        },
      });

      const createdTable = await createRestaurantTable({
        restaurantId: restaurant.id,
        name: `Table Timer ${suffix}`,
        section: 'Main',
        capacity: 4,
      });
      tableA = {
        id: createdTable.table.id,
        name: createdTable.table.name,
        rawToken: createdTable.rawToken,
      };
    });

    afterAll(async () => {
      mockOwnerCookieValue = undefined;
      if (createdServiceCallIds.length > 0) {
        await prisma
          .$executeRawUnsafe(
            `DELETE FROM "TableServiceCall" WHERE "id" = ANY($1::text[])`,
            createdServiceCallIds
          )
          .catch(() => {});
      }
      if (createdOrderIds.length > 0) {
        await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } }).catch(() => {});
      }
      if (createdSessionTokens.length > 0) {
        await prisma.scanEvent
          .deleteMany({ where: { sessionToken: { in: createdSessionTokens } } })
          .catch(() => {});
        await prisma.dinerSession
          .deleteMany({ where: { sessionToken: { in: createdSessionTokens } } })
          .catch(() => {});
      }
      if (restaurant?.id) {
        await prisma.restaurantTable
          .deleteMany({ where: { restaurantId: restaurant.id } })
          .catch(() => {});
        await prisma.restaurant
          .deleteMany({ where: { id: restaurant.id } })
          .catch(() => {});
      }
      if (org?.id) {
        await prisma.organization.deleteMany({ where: { id: org.id } }).catch(() => {});
      }
      if (ownerUser?.id) {
        await prisma.user.deleteMany({ where: { id: ownerUser.id } }).catch(() => {});
      }
    });

    it('persists custom scanTimeoutMinutes and orderExtensionMinutes via both owner endpoints without clobbering Wi-Fi', async () => {
      // 1. Update via /api/restaurants/[id]/ordering-settings
      const patchOrdRes = await orderingSettingsPatch(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableSession: {
              scanTimeoutMinutes: 12,
              orderExtensionMinutes: 45,
            },
          }),
        }),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      expect(patchOrdRes.status).toBe(200);
      const patchOrdBody = await patchOrdRes.json();
      expect(patchOrdBody.tableSession).toEqual({
        scanTimeoutMinutes: 12,
        orderExtensionMinutes: 45,
      });

      // Wi-Fi in notificationSettings must still be intact
      const getOrdRes = await orderingSettingsGet(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      const getOrdBody = await getOrdRes.json();
      expect(getOrdBody.tableSession).toEqual({
        scanTimeoutMinutes: 12,
        orderExtensionMinutes: 45,
      });
      expect(getOrdBody.settings.notificationSettings?.wifi?.ssid).toBe('TimerCafeGuest');

      // Reject out-of-range inputs cleanly
      const badPatchRes = await orderingSettingsPatch(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableSession: { scanTimeoutMinutes: 0, orderExtensionMinutes: 45 },
          }),
        }),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      expect(badPatchRes.status).toBe(400);

      // 2. Update via /api/restaurant/settings (top-level Settings tab)
      const patchRestRes = await restaurantSettingsPatch(
        new Request('http://localhost:3000/api/restaurant/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableSession: {
              scanTimeoutMinutes: 10,
              orderExtensionMinutes: 25,
            },
          }),
        })
      );
      expect(patchRestRes.status).toBe(200);
      const patchRestBody = await patchRestRes.json();
      expect(patchRestBody.tableSession).toEqual({
        scanTimeoutMinutes: 10,
        orderExtensionMinutes: 25,
      });

      // GET /api/restaurant/settings + GET /api/diner/menu reflect 10 / 25 and preserved Wi-Fi
      const getRestRes = await restaurantSettingsGet(
        new Request(`http://localhost:3000/api/restaurant/settings?restaurantId=${restaurant.id}`)
      );
      const getRestBody = await getRestRes.json();
      expect(getRestBody.tableSession).toEqual({
        scanTimeoutMinutes: 10,
        orderExtensionMinutes: 25,
      });
      expect(getRestBody.wifi?.ssid).toBe('TimerCafeGuest');

      const dinerMenuRes = await dinerMenuGet(
        new Request(`http://localhost:3000/api/diner/menu?slug=${restaurant.slug}`)
      );
      const dinerMenuBody = await dinerMenuRes.json();
      expect(dinerMenuBody.tableSession).toEqual({
        scanTimeoutMinutes: 10,
        orderExtensionMinutes: 25,
      });
    });

    it('enforces custom 10m scan timeout, extends by custom 25m on orders (allowing additional items), and expires until QR rescan', async () => {
      // Ensure DB config is 10m scan / 25m order extension
      await orderingSettingsPatch(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableSession: { scanTimeoutMinutes: 10, orderExtensionMinutes: 25 },
          }),
        }),
        { params: Promise.resolve({ id: restaurant.id }) }
      );

      // 1. Guest scans QR -> gets 10m initial scan window
      const scanRes = await sessionPost(
        new Request('http://localhost:3000/api/diner/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantSlug: restaurant.slug,
            t: tableA.rawToken,
          }),
        })
      );
      expect(scanRes.status).toBe(200);
      const scanBody = await scanRes.json();
      const sessionToken: string = scanBody.sessionToken;
      createdSessionTokens.push(sessionToken);

      expect(scanBody.tableId).toBe(tableA.id);
      expect(scanBody.timeoutMinutes).toBe(10);
      expect(scanBody.timeoutKind).toBe('SCAN');
      expect(scanBody.scanTimeoutMinutes).toBe(10);
      expect(scanBody.orderExtensionMinutes).toBe(25);
      const scanDeltaMs =
        Date.parse(scanBody.expiresAt) - Date.parse(scanBody.tableVerifiedAt);
      expect(scanDeltaMs).toBe(10 * 60 * 1000);

      const cookieName = getDinerSessionCookieName(restaurant.id);

      // 2. Backdate scan to 11m ago without an order -> MUST expire at customized 10m window
      const past11m = new Date(Date.now() - 11 * 60 * 1000);
      await prisma.scanEvent.updateMany({
        where: { sessionToken, tableId: tableA.id },
        data: { timestamp: past11m },
      });
      await prisma.dinerSession.update({
        where: { sessionToken },
        data: { lastActiveAt: past11m },
      });

      const expiredScanOrderRes = await orderPost(
        new Request('http://localhost:3000/api/diner/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableId: tableA.id,
            sessionToken,
            items: [{ menuItemId: dish.id, quantity: 1, modifierOptionIds: [] }],
          }),
        })
      );
      expect(expiredScanOrderRes.status).toBe(403);
      const expiredScanOrderBody = await expiredScanOrderRes.json();
      expect(expiredScanOrderBody.code).toBe('TABLE_SCAN_EXPIRED');
      expect(expiredScanOrderBody.timeoutMinutes).toBe(10);
      expect(expiredScanOrderBody.timeoutKind).toBe('SCAN');
      expect(expiredScanOrderBody.error).toContain('10 minutes');

      // 3. Guest rescans table QR -> fresh 10m window granted
      const rescan1Res = await sessionPost(
        new Request('http://localhost:3000/api/diner/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantSlug: restaurant.slug,
            t: tableA.rawToken,
            sessionToken,
          }),
        })
      );
      expect(rescan1Res.status).toBe(200);
      const rescan1Body = await rescan1Res.json();
      expect(rescan1Body.tableId).toBe(tableA.id);
      expect(rescan1Body.timeoutMinutes).toBe(10);

      // 4. Guest places Order #1 within scan window -> extends by customized 25m order extension!
      const order1Res = await orderPost(
        new Request('http://localhost:3000/api/diner/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableId: tableA.id,
            sessionToken,
            items: [{ menuItemId: dish.id, quantity: 1, modifierOptionIds: [] }],
          }),
        })
      );
      expect(order1Res.status).toBe(200);
      const order1Body = await order1Res.json();
      createdOrderIds.push(order1Body.order.id);
      expect(order1Body.tableSession.timeoutMinutes).toBe(25);
      expect(order1Body.tableSession.timeoutKind).toBe('ORDER_EXTENSION');
      expect(
        Date.parse(order1Body.tableSession.expiresAt) -
          Date.parse(order1Body.tableSession.lastOrderAt)
      ).toBe(25 * 60 * 1000);

      // 5. Simulate 15m elapsed (> 10m initial scan timeout, still < 25m extension)
      const past15m = new Date(Date.now() - 15 * 60 * 1000);
      await prisma.scanEvent.updateMany({
        where: { sessionToken, tableId: tableA.id },
        data: { timestamp: past15m },
      });
      await prisma.order.update({
        where: { id: order1Body.order.id },
        data: { placedAt: past15m },
      });

      const activeEval = await evaluateDeviceTableSession({
        restaurantId: restaurant.id,
        tableId: tableA.id,
        sessionToken,
      });
      expect(activeEval.valid).toBe(true);
      expect(activeEval.timeoutMinutes).toBe(25);
      expect(activeEval.timeoutKind).toBe('ORDER_EXTENSION');

      // Passive reload reflects remaining post-order extension without extending
      const reloadRes = await sessionPost(
        new Request('http://localhost:3000/api/diner/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({ restaurantSlug: restaurant.slug }),
        })
      );
      const reloadBody = await reloadRes.json();
      expect(reloadBody.tableId).toBe(tableA.id);
      expect(reloadBody.timeoutMinutes).toBe(25);
      expect(reloadBody.timeoutKind).toBe('ORDER_EXTENSION');
      expect(Date.parse(reloadBody.expiresAt)).toBe(past15m.getTime() + 25 * 60 * 1000);

      // Guest can order additional items (Order #2) and extends another 25m from Order #2
      const order2Res = await orderPost(
        new Request('http://localhost:3000/api/diner/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableId: tableA.id,
            sessionToken,
            items: [{ menuItemId: dish.id, quantity: 2, modifierOptionIds: [] }],
          }),
        })
      );
      expect(order2Res.status).toBe(200);
      const order2Body = await order2Res.json();
      createdOrderIds.push(order2Body.order.id);
      expect(order2Body.tableSession.timeoutMinutes).toBe(25);
      expect(order2Body.tableSession.timeoutKind).toBe('ORDER_EXTENSION');
      expect(
        Date.parse(order2Body.tableSession.expiresAt) -
          Date.parse(order2Body.tableSession.lastOrderAt)
      ).toBe(25 * 60 * 1000);

      // Waiter call works during extension window
      const waiterRes = await serviceCallPost(
        new Request('http://localhost:3000/api/diner/service-calls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableId: tableA.id,
            sessionToken,
            callType: 'WATER',
          }),
        })
      );
      expect(waiterRes.status).toBe(200);
      createdServiceCallIds.push((await waiterRes.json()).serviceCall.id);

      // 6. Backdate both orders + scans to 26m ago -> 25m post-order extension expires!
      const past26m = new Date(Date.now() - 26 * 60 * 1000);
      await prisma.scanEvent.updateMany({
        where: { sessionToken, tableId: tableA.id },
        data: { timestamp: past26m },
      });
      await prisma.order.updateMany({
        where: { id: { in: [order1Body.order.id, order2Body.order.id] } },
        data: { placedAt: past26m },
      });

      const expiredExtensionOrderRes = await orderPost(
        new Request('http://localhost:3000/api/diner/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableId: tableA.id,
            sessionToken,
            items: [{ menuItemId: dish.id, quantity: 1, modifierOptionIds: [] }],
          }),
        })
      );
      expect(expiredExtensionOrderRes.status).toBe(403);
      const expiredExtBody = await expiredExtensionOrderRes.json();
      expect(expiredExtBody.code).toBe('TABLE_SCAN_EXPIRED');
      expect(expiredExtBody.timeoutMinutes).toBe(25);
      expect(expiredExtBody.timeoutKind).toBe('ORDER_EXTENSION');
      expect(expiredExtBody.requiresRescan).toBe(true);

      // 7. Rescanning QR after extension expiry resets timer back to scanTimeoutMinutes (10m),
      // NOT the old 25m pre-rescan order!
      const rescanAfterOrderExpRes = await sessionPost(
        new Request('http://localhost:3000/api/diner/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({
            restaurantSlug: restaurant.slug,
            t: tableA.rawToken,
            sessionToken,
          }),
        })
      );
      expect(rescanAfterOrderExpRes.status).toBe(200);
      const rescanAfterBody = await rescanAfterOrderExpRes.json();
      expect(rescanAfterBody.timeoutMinutes).toBe(10);
      expect(rescanAfterBody.timeoutKind).toBe('SCAN');

      // Reload immediately after rescan must confirm 10m SCAN window (ignores older pre-rescan order)
      const postRescanReload = await sessionPost(
        new Request('http://localhost:3000/api/diner/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `${cookieName}=${sessionToken}`,
          },
          body: JSON.stringify({ restaurantSlug: restaurant.slug }),
        })
      );
      const postRescanReloadBody = await postRescanReload.json();
      expect(postRescanReloadBody.tableId).toBe(tableA.id);
      expect(postRescanReloadBody.timeoutMinutes).toBe(10);
      expect(postRescanReloadBody.timeoutKind).toBe('SCAN');
    });
  });
});
