import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { OrderStatus, StaffRole, SubscriptionStatus } from '@prisma/client';

let mockOwnerCookieValue: string | undefined;
let mockStaffCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'dishora_owner_session' && mockOwnerCookieValue) {
        return { value: mockOwnerCookieValue };
      }
      if (name === 'dishora_staff_session' && mockStaffCookieValue) {
        return { value: mockStaffCookieValue };
      }
      return undefined;
    },
    set: () => {},
    delete: () => {},
  }),
}));

import { createOwnerToken } from '../src/lib/auth/owner-auth';
import { generateStaffSessionToken, hashToken, hashStaffPassword } from '../src/lib/auth/staff-auth';
import { createServiceCall } from '../src/lib/tables/service-call-service';
import { GET as tablesGet } from '../src/app/api/restaurants/[id]/tables/route';
import { GET as staffGet } from '../src/app/api/restaurants/[id]/staff/route';
import { GET as restaurantOrdersGet } from '../src/app/api/restaurants/[id]/orders/route';
import { GET as autoOrdersGet } from '../src/app/api/restaurants/_auto/orders/route';
import { GET as ordersHistoryGet } from '../src/app/api/restaurants/[id]/orders/history/route';
import {
  SESSION_CACHE_TTLS,
  cacheKeys,
  clearAllDashboardSessionCaches,
  dedupeClientRequest,
  invalidateRestaurantSessionCache,
  isCacheFresh,
  readSessionCache,
  setSessionCacheScope,
  syncCachedTablesActiveOrderCounts,
  writeSessionCache,
} from '../src/lib/cache/dashboard-session-cache';

class MemorySessionStorage implements Storage {
  private map = new Map<string, string>();
  public quotaLimitEntries: number | null = null;

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    if (
      this.quotaLimitEntries !== null &&
      !this.map.has(key) &&
      this.map.size >= this.quotaLimitEntries
    ) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this.map.set(key, value);
  }
}

describe('Dashboard Session Cache & Consolidated Order/Table/Staff APIs', () => {
  const createdServiceCallIds: string[] = [];
  const createdOrderIds: string[] = [];
  const createdRestaurantIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdPlanKeys: string[] = [];

  afterEach(async () => {
    clearAllDashboardSessionCaches();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    mockOwnerCookieValue = undefined;
    mockStaffCookieValue = undefined;

    if (createdServiceCallIds.length > 0) {
      for (const id of createdServiceCallIds.splice(0, createdServiceCallIds.length)) {
        await prisma.$executeRawUnsafe(`DELETE FROM "TableServiceCall" WHERE "id" = $1`, id).catch(() => {});
      }
    }
    if (createdOrderIds.length > 0) {
      await prisma.order
        .deleteMany({ where: { id: { in: createdOrderIds.splice(0, createdOrderIds.length) } } })
        .catch(() => {});
    }
    if (createdRestaurantIds.length > 0) {
      const rIds = createdRestaurantIds.splice(0, createdRestaurantIds.length);
      await prisma.order.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => {});
      await prisma.staffSession
        .deleteMany({ where: { staff: { restaurantId: { in: rIds } } } })
        .catch(() => {});
      await prisma.restaurantStaff.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => {});
      await prisma.restaurantTable.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => {});
      await prisma.restaurant.deleteMany({ where: { id: { in: rIds } } }).catch(() => {});
    }
    if (createdOrgIds.length > 0) {
      await prisma.organization
        .deleteMany({ where: { id: { in: createdOrgIds.splice(0, createdOrgIds.length) } } })
        .catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user
        .deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } })
        .catch(() => {});
    }
    if (createdPlanKeys.length > 0) {
      await prisma.plan
        .deleteMany({ where: { key: { in: createdPlanKeys.splice(0, createdPlanKeys.length) } } })
        .catch(() => {});
    }
  });

  function installMockSessionStorage() {
    const storage = new MemorySessionStorage();
    vi.stubGlobal('window', { sessionStorage: storage });
    return storage;
  }

  async function seedTenantWithOperations(options?: { expired?: boolean }) {
    const suffix = crypto.randomBytes(4).toString('hex');
    const orgCreatedAt = options?.expired
      ? new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      : new Date();

    const user = await prisma.user.create({
      data: {
        email: `sess-owner-${suffix}@menzy.local`,
        name: `Session Owner ${suffix}`,
        passwordHash: 'hashed_secret_sentinel',
      },
    });
    createdUserIds.push(user.id);

    const org = await prisma.organization.create({
      data: {
        name: `Session Org ${suffix}`,
        ownerUserId: user.id,
        billingCountry: 'IN',
        billingCurrency: 'INR',
        createdAt: orgCreatedAt,
      },
    });
    createdOrgIds.push(org.id);

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        organizationId: org.id,
        slug: `sess-rest-${suffix}`,
        displayName: `Session Kitchen ${suffix}`,
        country: 'IN',
        city: 'Bengaluru',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        isClaimed: true,
      },
    });
    createdRestaurantIds.push(restaurant.id);

    await prisma.restaurantTheme.create({
      data: {
        restaurantId: restaurant.id,
        presetKey: 'WARM_EDITORIAL',
        backgroundColor: '#FAF7F2',
        surfaceColor: '#FFFFFF',
        primaryTextColor: '#2B231D',
        secondaryTextColor: '#7C695C',
        accentColor: '#C86A4B',
        secondaryAccentColor: '#7A9175',
        headingFont: 'Playfair Display',
        bodyFont: 'Plus Jakarta Sans',
        layoutMode: 'GRID',
      },
    });

    if (!options?.expired) {
      const existingPlan = await prisma.plan.findUnique({ where: { key: 'IN_GROWTH' } });
      if (!existingPlan) {
        await prisma.plan.create({
          data: {
            key: 'IN_GROWTH',
            tier: 'GROWTH',
            name: 'Growth',
            country: 'IN',
            currency: 'INR',
            priceMinor: 179900,
            itemLimit: 250,
            imageCreditsMonthly: 50,
            aiQuestionsMonthly: 5000,
          },
        });
        createdPlanKeys.push('IN_GROWTH');
      }
      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          planKey: 'IN_GROWTH',
          status: SubscriptionStatus.ACTIVE,
          currency: 'INR',
          billingPeriod: 'MONTHLY',
          paidThrough: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const table1 = await prisma.restaurantTable.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Table 1',
        section: 'Patio',
        capacity: 4,
        qrTokenHash: crypto.randomBytes(16).toString('hex'),
      },
    });
    const table2 = await prisma.restaurantTable.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Table 2',
        section: 'Inside',
        capacity: 2,
        qrTokenHash: crypto.randomBytes(16).toString('hex'),
      },
    });

    const staff = await prisma.restaurantStaff.create({
      data: {
        restaurantId: restaurant.id,
        displayName: `Chef ${suffix}`,
        loginId: `chef-${suffix}`,
        passwordHash: await hashStaffPassword('KitchenPass#1'),
        role: StaffRole.MANAGER,
      },
    });
    const rawStaffToken = generateStaffSessionToken();
    await prisma.staffSession.create({
      data: {
        staffId: staff.id,
        sessionTokenHash: hashToken(rawStaffToken),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    return { suffix, user, org, restaurant, table1, table2, staff, rawStaffToken };
  }

  async function seedOrderForTable(params: {
    restaurantId: string;
    tableId: string;
    orderNumber: string;
    status: OrderStatus;
    dishName: string;
    placedOffsetMs?: number;
  }) {
    const order = await prisma.order.create({
      data: {
        restaurantId: params.restaurantId,
        tableId: params.tableId,
        orderNumber: params.orderNumber,
        status: params.status,
        currency: 'INR',
        subtotalMinor: 35000,
        taxMinor: 1750,
        serviceChargeMinor: 0,
        totalMinor: 36750,
        placedAt: new Date(Date.now() - (params.placedOffsetMs ?? 0)),
        items: {
          create: [
            {
              dishNameSnapshot: params.dishName,
              quantity: 1,
              unitPriceMinor: 35000,
              modifiersTotalMinor: 0,
              lineTotalMinor: 35000,
            },
          ],
        },
      },
    });
    createdOrderIds.push(order.id);
    return order;
  }

  describe('Client sessionStorage cache utility contracts', () => {
    it('reads, writes, validates TTL/freshness, and isolates/wipes scopes cleanly', () => {
      const storage = installMockSessionStorage();

      setSessionCacheScope('owner-alpha');
      const tablesKey = cacheKeys.tables('rest-1');
      writeSessionCache(tablesKey, [{ id: 't1', name: 'Table 1', activeOrderCount: 1 }], {
        updatedAt: Date.now() - 10_000,
      });

      const cached = readSessionCache<any[]>(tablesKey, SESSION_CACHE_TTLS.TABLES_MAX_MS);
      expect(cached?.data).toHaveLength(1);
      expect(isCacheFresh(cached, 60_000)).toBe(true);
      expect(isCacheFresh(cached, 5_000)).toBe(false);

      // Expired read clears entry automatically
      expect(readSessionCache(tablesKey, 5_000)).toBeNull();
      expect(storage.getItem('menzy:sess:v1:' + tablesKey)).toBeNull();

      // Write fresh entries for multiple scopes and confirm prefix invalidation
      writeSessionCache(cacheKeys.ordersHistory('rest-1', '7d:ALL:1:'), { orders: ['a'] });
      writeSessionCache(cacheKeys.ordersHistory('rest-1', '30d:COMPLETED:2:dosa'), { orders: ['b'] });
      writeSessionCache(cacheKeys.staff('rest-1'), [{ id: 's1' }]);

      invalidateRestaurantSessionCache('rest-1', ['ordersHistory']);
      expect(readSessionCache(cacheKeys.ordersHistory('rest-1', '7d:ALL:1:'))).toBeNull();
      expect(readSessionCache(cacheKeys.ordersHistory('rest-1', '30d:COMPLETED:2:dosa'))).toBeNull();
      expect(readSessionCache(cacheKeys.staff('rest-1'))?.data).toHaveLength(1);

      // Switching user scope wipes previous user's cached tenant data immediately
      setSessionCacheScope('owner-beta');
      expect(readSessionCache(cacheKeys.staff('rest-1'))).toBeNull();
    });

    it('evicts oldest sessionStorage entries when QuotaExceededError occurs', () => {
      const storage = installMockSessionStorage();
      setSessionCacheScope('owner-quota');

      const base = Date.now() - 100_000;
      for (let i = 0; i < 6; i++) {
        writeSessionCache(`old:item:${i}`, { index: i }, { updatedAt: base + i * 1000 });
      }
      // Next new key would exceed quota unless eviction removes oldest entries
      storage.quotaLimitEntries = storage.length;

      const freshEnvelope = writeSessionCache('new:critical', { ok: true }, { updatedAt: Date.now() });
      expect(freshEnvelope.data).toEqual({ ok: true });
      expect(readSessionCache('new:critical')?.data).toEqual({ ok: true });
      // Oldest entry (index 0) was evicted to make room
      expect(readSessionCache('old:item:0')).toBeNull();
    });

    it('dedupes concurrent in-flight requests and syncs active table counts cleanly', async () => {
      installMockSessionStorage();
      setSessionCacheScope('owner-sync');

      let calls = 0;
      const runFetch = () =>
        dedupeClientRequest('req:tables', async () => {
          calls += 1;
          await new Promise((r) => setTimeout(r, 15));
          return { ok: true, n: calls };
        });

      const [r1, r2, r3] = await Promise.all([runFetch(), runFetch(), runFetch()]);
      expect(calls).toBe(1);
      expect(r1).toEqual(r2);
      expect(r2).toEqual(r3);

      // Next call after completion runs fresh
      const r4 = await runFetch();
      expect(calls).toBe(2);
      expect(r4.n).toBe(2);

      // Table active order sync across live order statuses
      const tablesKey = cacheKeys.tables('rest-sync');
      const seededAt = Date.now() - 20_000;
      writeSessionCache(
        tablesKey,
        [
          { id: 't1', name: 'Table 1', activeOrderCount: 0 },
          { id: 't2', name: 'Table 2', activeOrderCount: 4 },
        ],
        { updatedAt: seededAt }
      );

      const changed = syncCachedTablesActiveOrderCounts('rest-sync', [
        { status: 'PLACED', tableId: 't1' },
        { status: 'READY', table: { id: 't1' } },
        { status: 'SERVED', tableId: 't2' }, // Served does not increment active kitchen badge
        { status: 'COMPLETED', tableId: 't2' },
      ]);
      expect(changed).toBe(true);

      const updated = readSessionCache<any[]>(tablesKey);
      expect(updated?.updatedAt).toBe(seededAt);
      expect(updated?.data).toEqual([
        { id: 't1', name: 'Table 1', activeOrderCount: 2 },
        { id: 't2', name: 'Table 2', activeOrderCount: 0 },
      ]);

      // Calling again with identical counts is a no-op
      expect(
        syncCachedTablesActiveOrderCounts('rest-sync', [
          { status: 'PLACED', tableId: 't1' },
          { status: 'READY', table: { id: 't1' } },
        ])
      ).toBe(false);
    });
  });

  describe('Fast Combined Orders, Tables & Staff APIs + Tenant Isolation', () => {
    it('serves combined owner orders payload with calls + tables and omits theme when includeTheme=0', async () => {
      const tenantA = await seedTenantWithOperations();
      const tenantB = await seedTenantWithOperations();

      await seedOrderForTable({
        restaurantId: tenantA.restaurant.id,
        tableId: tenantA.table1.id,
        orderNumber: 'ORD-S101',
        status: OrderStatus.PLACED,
        dishName: 'Truffle Naan',
        placedOffsetMs: 30_000,
      });
      await seedOrderForTable({
        restaurantId: tenantA.restaurant.id,
        tableId: tenantA.table1.id,
        orderNumber: 'ORD-S102',
        status: OrderStatus.PREPARING,
        dishName: 'Paneer Tikka',
        placedOffsetMs: 20_000,
      });
      await seedOrderForTable({
        restaurantId: tenantA.restaurant.id,
        tableId: tenantA.table2.id,
        orderNumber: 'ORD-S103',
        status: OrderStatus.SERVED,
        dishName: 'Mango Lassi',
        placedOffsetMs: 10_000,
      });

      const callResult = await createServiceCall({
        restaurantId: tenantA.restaurant.id,
        tableId: tenantA.table2.id,
        tableName: tenantA.table2.name,
        tableSection: tenantA.table2.section,
        callType: 'WATER',
        notes: 'Extra chilled glasses',
      });
      createdServiceCallIds.push(callResult.id);

      // Owner A fetches 1-request combined snapshot
      mockOwnerCookieValue = createOwnerToken(tenantA.user.id, tenantA.user.email);
      const res = await restaurantOrdersGet(
        new Request(
          `http://localhost/api/restaurants/${tenantA.restaurant.id}/orders?limit=2&includeCalls=1&includeTables=1&includeTheme=0`
        ),
        { params: Promise.resolve({ id: tenantA.restaurant.id }) }
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('private, no-store, max-age=0');

      const data = await res.json();
      expect(data.orders).toHaveLength(2);
      expect(data.orders[0].tableId).toBe(tenantA.table2.id);
      expect(data.restaurantTheme).toBeNull();
      expect(Array.isArray(data.calls)).toBe(true);
      expect(data.calls.some((c: any) => c.id === callResult.id)).toBe(true);
      expect(Array.isArray(data.tables)).toBe(true);
      expect(data.tables).toHaveLength(2);
      const t1 = data.tables.find((t: any) => t.id === tenantA.table1.id);
      const t2 = data.tables.find((t: any) => t.id === tenantA.table2.id);
      expect(t1.activeOrderCount).toBe(2); // PLACED + PREPARING
      expect(t2.activeOrderCount).toBe(0); // SERVED not counted in active badge
      expect(t1.scanUrl).toContain(tenantA.restaurant.slug);

      // Tables & Staff endpoints set private no-store headers and hide passwordHash
      const [tablesRes, staffRes] = await Promise.all([
        tablesGet(new Request(`http://localhost/api/restaurants/${tenantA.restaurant.id}/tables`), {
          params: Promise.resolve({ id: tenantA.restaurant.id }),
        }),
        staffGet(new Request(`http://localhost/api/restaurants/${tenantA.restaurant.id}/staff`), {
          params: Promise.resolve({ id: tenantA.restaurant.id }),
        }),
      ]);
      expect(tablesRes.status).toBe(200);
      expect(tablesRes.headers.get('cache-control')).toBe('private, no-store, max-age=0');
      const tablesJson = await tablesRes.json();
      expect(tablesJson.tables).toHaveLength(2);

      expect(staffRes.status).toBe(200);
      expect(staffRes.headers.get('cache-control')).toBe('private, no-store, max-age=0');
      const staffJson = await staffRes.json();
      expect(staffJson.staff).toHaveLength(1);
      expect(staffJson.staff[0].passwordHash).toBeUndefined();

      // Tenant isolation: Owner B and Staff B cannot access Tenant A's tables, staff, or orders
      mockOwnerCookieValue = createOwnerToken(tenantB.user.id, tenantB.user.email);
      const [crossTables, crossStaff, crossOrders] = await Promise.all([
        tablesGet(new Request(`http://localhost/api/restaurants/${tenantA.restaurant.id}/tables`), {
          params: Promise.resolve({ id: tenantA.restaurant.id }),
        }),
        staffGet(new Request(`http://localhost/api/restaurants/${tenantA.restaurant.id}/staff`), {
          params: Promise.resolve({ id: tenantA.restaurant.id }),
        }),
        restaurantOrdersGet(
          new Request(`http://localhost/api/restaurants/${tenantA.restaurant.id}/orders`),
          { params: Promise.resolve({ id: tenantA.restaurant.id }) }
        ),
      ]);
      expect(crossTables.status).toBe(403);
      expect(crossStaff.status).toBe(403);
      expect([401, 403]).toContain(crossOrders.status);

      mockOwnerCookieValue = undefined;
      mockStaffCookieValue = tenantB.rawStaffToken;
      const crossStaffOrders = await restaurantOrdersGet(
        new Request(`http://localhost/api/restaurants/${tenantA.restaurant.id}/orders`),
        { params: Promise.resolve({ id: tenantA.restaurant.id }) }
      );
      expect(crossStaffOrders.status).toBe(403);
    });

    it('resolves staff _auto orders (with optional calls/theme/limit) and _auto order history in 1 request', async () => {
      const tenant = await seedTenantWithOperations();
      await seedOrderForTable({
        restaurantId: tenant.restaurant.id,
        tableId: tenant.table1.id,
        orderNumber: 'ORD-A201',
        status: OrderStatus.PLACED,
        dishName: 'Butter Chicken',
        placedOffsetMs: 25_000,
      });
      await seedOrderForTable({
        restaurantId: tenant.restaurant.id,
        tableId: tenant.table1.id,
        orderNumber: 'ORD-A202',
        status: OrderStatus.ACCEPTED,
        dishName: 'Garlic Naan',
        placedOffsetMs: 15_000,
      });
      await seedOrderForTable({
        restaurantId: tenant.restaurant.id,
        tableId: tenant.table2.id,
        orderNumber: 'ORD-A203',
        status: OrderStatus.COMPLETED,
        dishName: 'Gulab Jamun',
        placedOffsetMs: 5_000,
      });

      const callResult = await createServiceCall({
        restaurantId: tenant.restaurant.id,
        tableId: tenant.table1.id,
        tableName: tenant.table1.name,
        tableSection: tenant.table1.section,
        callType: 'BILL',
      });
      createdServiceCallIds.push(callResult.id);

      mockStaffCookieValue = tenant.rawStaffToken;

      // Initial KDS fetch with includeCalls=1 & includeTheme=1 & limit=1
      const firstAutoRes = await autoOrdersGet(
        new Request('http://localhost/api/restaurants/_auto/orders?limit=1&includeCalls=1&includeTheme=1')
      );
      expect(firstAutoRes.status).toBe(200);
      expect(firstAutoRes.headers.get('cache-control')).toBe('private, no-store, max-age=0');
      const firstData = await firstAutoRes.json();
      expect(firstData.restaurantId).toBe(tenant.restaurant.id);
      expect(firstData.orders).toHaveLength(1);
      expect(firstData.orders[0].tableId).toBe(tenant.table1.id);
      expect(firstData.restaurantTheme?.presetKey).toBe('WARM_EDITORIAL');
      expect(firstData.calls).toHaveLength(1);

      // Subsequent poll omits includeTheme=1 -> skips theme lookup
      const pollAutoRes = await autoOrdersGet(
        new Request('http://localhost/api/restaurants/_auto/orders?limit=60&includeCalls=1')
      );
      expect(pollAutoRes.status).toBe(200);
      const pollData = await pollAutoRes.json();
      expect(pollData.orders).toHaveLength(2); // PLACED + ACCEPTED (excludes COMPLETED)
      expect(pollData.restaurantTheme).toBeUndefined();
      expect(pollData.calls).toHaveLength(1);

      // Direct _auto history call without preflight _auto/orders fetch
      const historyRes = await ordersHistoryGet(
        new Request('http://localhost/api/restaurants/_auto/orders/history?range=7d&page=1&pageSize=25'),
        { params: Promise.resolve({ id: '_auto' }) }
      );
      expect(historyRes.status).toBe(200);
      expect(historyRes.headers.get('cache-control')).toBe('private, no-store, max-age=0');
      const historyData = await historyRes.json();
      expect(historyData.restaurantId).toBe(tenant.restaurant.id);
      expect(historyData.restaurantTheme?.presetKey).toBe('WARM_EDITORIAL');
      expect(historyData.orders).toHaveLength(3);
    });

    it('rejects expired trial tenants with 402 across cached table/order routes', async () => {
      const expiredTenant = await seedTenantWithOperations({ expired: true });

      mockOwnerCookieValue = createOwnerToken(expiredTenant.user.id, expiredTenant.user.email);
      const tablesRes = await tablesGet(
        new Request(`http://localhost/api/restaurants/${expiredTenant.restaurant.id}/tables`),
        { params: Promise.resolve({ id: expiredTenant.restaurant.id }) }
      );
      expect(tablesRes.status).toBe(402);

      mockOwnerCookieValue = undefined;
      mockStaffCookieValue = expiredTenant.rawStaffToken;
      const autoRes = await autoOrdersGet(
        new Request('http://localhost/api/restaurants/_auto/orders?includeCalls=1')
      );
      expect(autoRes.status).toBe(402);
    });
  });
});
