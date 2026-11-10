import prisma from '@/lib/db/prisma';
import crypto from 'crypto';

let isTableInitialized = false;
let initPromise: Promise<void> | null = null;

function isRelationMissingError(err: any): boolean {
  const code = err?.code || err?.meta?.code;
  const msg = String(err?.message || '') + ' ' + String(err?.meta?.message || '');
  return (
    code === '42P01' ||
    msg.includes('42P01') ||
    (msg.includes('TableServiceCall') && msg.includes('does not exist'))
  );
}

/**
 * Ensures TableServiceCall table exists in PostgreSQL without breaking Prisma schema generation.
 * Uses an in-flight promise lock so concurrent requests never race or silently skip creation.
 */
export async function ensureServiceCallTableExists(force = false): Promise<void> {
  if (isTableInitialized && !force) return;
  if (initPromise && !force) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TableServiceCall" (
          "id" VARCHAR(64) PRIMARY KEY,
          "restaurantId" VARCHAR(64) NOT NULL,
          "tableId" VARCHAR(64) NOT NULL,
          "tableName" VARCHAR(128) NOT NULL,
          "tableSection" VARCHAR(128),
          "callType" VARCHAR(32) NOT NULL DEFAULT 'ASSISTANCE',
          "notes" TEXT,
          "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "attendedAt" TIMESTAMPTZ,
          "attendedBy" VARCHAR(128)
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_service_call_rest_status"
          ON "TableServiceCall" ("restaurantId", "status", "requestedAt" DESC)
      `);
      isTableInitialized = true;
    } catch (err) {
      isTableInitialized = false;
      console.error('Failed to initialize TableServiceCall table:', err);
      throw err;
    } finally {
      initPromise = null;
    }
  })();

  await initPromise;
}

/**
 * Executes a TableServiceCall query with automatic 42P01 self-healing initialization and one retry.
 */
async function withServiceCallTable<T>(fn: () => Promise<T>): Promise<T> {
  await ensureServiceCallTableExists();
  try {
    return await fn();
  } catch (err: any) {
    if (isRelationMissingError(err)) {
      isTableInitialized = false;
      await ensureServiceCallTableExists(true);
      return await fn();
    }
    throw err;
  }
}

export interface ServiceCallRecord {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  tableSection: string | null;
  callType: 'ASSISTANCE' | 'WATER' | 'CUTLERY' | 'BILL';
  notes: string | null;
  status: 'PENDING' | 'ATTENDED' | 'CANCELLED';
  requestedAt: Date;
  attendedAt: Date | null;
  attendedBy: string | null;
}

/**
 * Creates a new waiter call from a dining table
 */
export async function createServiceCall(params: {
  restaurantId: string;
  tableId: string;
  tableName: string;
  tableSection?: string | null;
  callType?: 'ASSISTANCE' | 'WATER' | 'CUTLERY' | 'BILL';
  notes?: string | null;
}): Promise<ServiceCallRecord> {
  const id = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const callType = params.callType || 'ASSISTANCE';
  const notes = params.notes?.trim() || null;
  const section = params.tableSection || null;

  await withServiceCallTable(() =>
    prisma.$executeRawUnsafe(
      `INSERT INTO "TableServiceCall"
        ("id", "restaurantId", "tableId", "tableName", "tableSection", "callType", "notes", "status", "requestedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW())`,
      id,
      params.restaurantId,
      params.tableId,
      params.tableName,
      section,
      callType,
      notes
    )
  );

  return {
    id,
    restaurantId: params.restaurantId,
    tableId: params.tableId,
    tableName: params.tableName,
    tableSection: section,
    callType,
    notes,
    status: 'PENDING',
    requestedAt: new Date(),
    attendedAt: null,
    attendedBy: null,
  };
}

/**
 * Retrieves all active (PENDING) waiter service calls for a restaurant
 */
export async function getActiveServiceCalls(restaurantId: string): Promise<ServiceCallRecord[]> {
  const rows = await withServiceCallTable(() =>
    prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "restaurantId", "tableId", "tableName", "tableSection", "callType", "notes", "status", "requestedAt", "attendedAt", "attendedBy"
       FROM "TableServiceCall"
       WHERE "restaurantId" = $1 AND "status" = 'PENDING'
       ORDER BY "requestedAt" DESC
       LIMIT 50`,
      restaurantId
    )
  );

  return rows.map((r) => ({
    id: r.id,
    restaurantId: r.restaurantId,
    tableId: r.tableId,
    tableName: r.tableName,
    tableSection: r.tableSection,
    callType: r.callType,
    notes: r.notes,
    status: r.status,
    requestedAt: new Date(r.requestedAt),
    attendedAt: r.attendedAt ? new Date(r.attendedAt) : null,
    attendedBy: r.attendedBy,
  }));
}

/**
 * Marks a waiter call as attended / resolved
 */
export async function resolveServiceCall(
  callId: string,
  restaurantId: string,
  staffName?: string
): Promise<boolean> {
  const res = await withServiceCallTable(() =>
    prisma.$executeRawUnsafe(
      `UPDATE "TableServiceCall"
       SET "status" = 'ATTENDED', "attendedAt" = NOW(), "attendedBy" = $3
       WHERE "id" = $1 AND "restaurantId" = $2 AND "status" = 'PENDING'`,
      callId,
      restaurantId,
      staffName || 'Staff'
    )
  );

  return Number(res) > 0;
}

