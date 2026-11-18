import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatus } from '@prisma/client';

const mockFindMany = vi.fn();
const mockVerifyRestaurantOwnerAccess = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  default: {
    restaurantTable: {
      findMany: (...args: any[]) => mockFindMany(...args),
    },
  },
}));

vi.mock('@/lib/auth/tenant-verify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/tenant-verify')>();
  return {
    ...actual,
    verifyRestaurantOwnerAccess: (...args: any[]) => mockVerifyRestaurantOwnerAccess(...args),
  };
});

import { GET } from '../src/app/api/restaurants/[id]/tables/route';

interface MockTableSeed {
  id: string;
  restaurantId: string;
  name: string;
  section: string;
  capacity: number;
  qrTokenHash: string;
  qrVersion: number;
  isActive: boolean;
  createdAt: Date;
  allOrders: Array<{ status: OrderStatus; totalMinor: number; placedAt: Date }>;
}

function applyPrismaOrderStatusFilter(seeds: MockTableSeed[], queryArgs: any) {
  const allowedStatuses: OrderStatus[] =
    queryArgs?.select?.orders?.where?.status?.in ?? [];

  return seeds.map(({ allOrders, ...table }) => ({
    ...table,
    orders: allOrders
      .filter((order) => allowedStatuses.includes(order.status))
      .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
      .map(({ status, totalMinor }) => ({ status, totalMinor })),
  }));
}

describe('GET /api/restaurants/[id]/tables active-order summary', () => {
  const restaurantId = 'rest-tables-test-1';

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyRestaurantOwnerAccess.mockResolvedValue({
      authorized: true,
      restaurant: {
        id: restaurantId,
        slug: 'bistro-aurora',
        displayName: 'Bistro Aurora',
      },
    });
  });

  it('aggregates active orders (including SERVED) and excludes completed, cancelled, and rejected orders', async () => {
    const now = Date.now();
    const seededTables: MockTableSeed[] = [
      {
        id: 'tbl-1',
        restaurantId,
        name: 'Table 01',
        section: 'Main Dining',
        capacity: 4,
        qrTokenHash: 'hash-tbl-1',
        qrVersion: 1,
        isActive: true,
        createdAt: new Date(now - 86_400_000),
        allOrders: [
          { status: 'SERVED', totalMinor: 65000, placedAt: new Date(now - 20 * 60_000) },
          { status: 'PLACED', totalMinor: 25000, placedAt: new Date(now - 2 * 60_000) },
          { status: 'COMPLETED', totalMinor: 99900, placedAt: new Date(now - 90 * 60_000) },
        ],
      },
      {
        id: 'tbl-2',
        restaurantId,
        name: 'Table 02',
        section: 'Patio',
        capacity: 2,
        qrTokenHash: 'hash-tbl-2',
        qrVersion: 2,
        isActive: true,
        createdAt: new Date(now - 86_400_000),
        allOrders: [
          { status: 'SERVED', totalMinor: 42000, placedAt: new Date(now - 15 * 60_000) },
          { status: 'CANCELLED', totalMinor: 18000, placedAt: new Date(now - 10 * 60_000) },
        ],
      },
      {
        id: 'tbl-3',
        restaurantId,
        name: 'Table 03',
        section: 'Patio',
        capacity: 6,
        qrTokenHash: 'hash-tbl-3',
        qrVersion: 1,
        isActive: true,
        createdAt: new Date(now - 86_400_000),
        allOrders: [
          { status: 'COMPLETED', totalMinor: 50000, placedAt: new Date(now - 45 * 60_000) },
          { status: 'REJECTED', totalMinor: 12000, placedAt: new Date(now - 30 * 60_000) },
        ],
      },
      {
        id: 'tbl-4',
        restaurantId,
        name: 'Table 04',
        section: 'Main Dining',
        capacity: 4,
        qrTokenHash: 'hash-tbl-4',
        qrVersion: 1,
        isActive: false,
        createdAt: new Date(now - 86_400_000),
        allOrders: [],
      },
    ];

    mockFindMany.mockImplementation(async (args: any) =>
      applyPrismaOrderStatusFilter(seededTables, args)
    );

    const res = await GET(new Request(`http://localhost/api/restaurants/${restaurantId}/tables`), {
      params: Promise.resolve({ id: restaurantId }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store, max-age=0');

    // Confirm tenant scoping and exact active status list passed to Prisma
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const prismaArgs = mockFindMany.mock.calls[0][0];
    expect(prismaArgs.where).toEqual({
      restaurantId,
      isArchived: false,
    });
    expect(prismaArgs.select.orders.where.status.in).toEqual([
      'PLACED',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'SERVED',
    ]);

    const body = await res.json();
    expect(body.totalTables).toBe(4);
    expect(body.activeTablesCount).toBe(2);
    expect(body.tables).toHaveLength(4);

    const [t1, t2, t3, t4] = body.tables;

    expect(t1).toMatchObject({
      id: 'tbl-1',
      name: 'Table 01',
      activeOrderCount: 2,
      activeOrdersTotalMinor: 90000,
      latestOrderStatus: 'PLACED',
      hasActiveOrders: true,
    });
    expect(t1.scanUrl).toContain('/m/bistro-aurora?t=');

    expect(t2).toMatchObject({
      id: 'tbl-2',
      name: 'Table 02',
      activeOrderCount: 1,
      activeOrdersTotalMinor: 42000,
      latestOrderStatus: 'SERVED',
      hasActiveOrders: true,
    });

    expect(t3).toMatchObject({
      id: 'tbl-3',
      name: 'Table 03',
      activeOrderCount: 0,
      activeOrdersTotalMinor: 0,
      latestOrderStatus: null,
      hasActiveOrders: false,
    });

    expect(t4).toMatchObject({
      id: 'tbl-4',
      name: 'Table 04',
      isActive: false,
      activeOrderCount: 0,
      activeOrdersTotalMinor: 0,
      latestOrderStatus: null,
      hasActiveOrders: false,
    });
  });

  it('picks the highest-priority active status when a table has multiple in-flight orders', async () => {
    const now = Date.now();
    const seededTables: MockTableSeed[] = [
      {
        id: 'tbl-priority',
        restaurantId,
        name: 'Table 09',
        section: 'Bar',
        capacity: 2,
        qrTokenHash: 'hash-tbl-9',
        qrVersion: 1,
        isActive: true,
        createdAt: new Date(now - 86_400_000),
        allOrders: [
          { status: 'ACCEPTED', totalMinor: 15000, placedAt: new Date(now - 1 * 60_000) },
          { status: 'READY', totalMinor: 30000, placedAt: new Date(now - 8 * 60_000) },
          { status: 'PREPARING', totalMinor: 20000, placedAt: new Date(now - 4 * 60_000) },
        ],
      },
    ];

    mockFindMany.mockImplementation(async (args: any) =>
      applyPrismaOrderStatusFilter(seededTables, args)
    );

    const res = await GET(new Request(`http://localhost/api/restaurants/${restaurantId}/tables`), {
      params: Promise.resolve({ id: restaurantId }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalTables).toBe(1);
    expect(body.activeTablesCount).toBe(1);
    expect(body.tables[0]).toMatchObject({
      activeOrderCount: 3,
      activeOrdersTotalMinor: 65000,
      latestOrderStatus: 'READY',
      hasActiveOrders: true,
    });
  });

  it('blocks unauthorized tenant access before querying tables', async () => {
    mockVerifyRestaurantOwnerAccess.mockResolvedValue({
      authorized: false,
      status: 403,
      error: 'Forbidden',
    });

    const res = await GET(new Request(`http://localhost/api/restaurants/${restaurantId}/tables`), {
      params: Promise.resolve({ id: restaurantId }),
    });

    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
