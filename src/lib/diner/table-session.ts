import prisma from '../db/prisma';

export const TABLE_SESSION_TIMEOUT_MINUTES = 30;
export const TABLE_SESSION_TIMEOUT_MS = TABLE_SESSION_TIMEOUT_MINUTES * 60 * 1000;

export function getDinerSessionCookieName(restaurantId: string): string {
  const safeId = restaurantId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `menzy_ds_${safeId}`;
}

export function readCookieFromRequest(req: Request, cookieName: string): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    const key = pair.slice(0, eqIndex).trim();
    if (key !== cookieName) continue;
    const rawVal = pair.slice(eqIndex + 1).trim();
    if (!rawVal) return null;
    try {
      return decodeURIComponent(rawVal);
    } catch {
      return rawVal;
    }
  }

  return null;
}

export type TableSessionFailureCode =
  | 'TABLE_SCAN_REQUIRED'
  | 'TABLE_SCAN_EXPIRED'
  | 'TABLE_MISMATCH';

export interface ActiveBoundTableSummary {
  tableId: string;
  tableName: string;
  tableSection: string | null;
  tableCapacity: number | null;
  verifiedAt: string;
  lastOrderAt: string | null;
  expiresAt: string;
}

export interface EvaluateDeviceTableSessionResult {
  valid: boolean;
  code?: TableSessionFailureCode;
  error?: string;
  tableName?: string | null;
  currentTableName?: string | null;
  currentTable?: ActiveBoundTableSummary | null;
  lastScanAt?: Date;
  lastOrderAt?: Date | null;
  anchorAt?: Date;
  expiresAt?: Date;
  expiredAt?: Date;
  timeoutMinutes?: number;
  session?: {
    id: string;
    sessionToken: string;
    restaurantId: string;
    tableId: string | null;
    lastActiveAt: Date;
  };
  table?: {
    id: string;
    name: string;
    section: string | null;
    capacity: number | null;
  };
}

/**
 * Evaluates whether a device's scanned table session is currently valid for a given table.
 *
 * Security invariants enforced:
 *   1. Cookie token (`HttpOnly`) and body `sessionToken`/`dinerSessionId` must belong to the same device session.
 *   2. Lookup uses the cryptographic `sessionToken` (`ds_...`), never trusting raw table IDs from client state.
 *   3. A session checked in at Table A is strictly rejected (`TABLE_MISMATCH`) for Table B.
 *   4. A table session remains valid for 30 minutes from whichever happened later on that device
 *      for that table (`ScanEvent.timestamp` or `Order.placedAt`); once idle past 30 minutes,
 *      `DinerSession.tableId` is cleared and the guest must rescan the table QR.
 */
export async function evaluateDeviceTableSession(params: {
  restaurantId: string;
  tableId: string;
  sessionToken?: string | null;
  cookieSessionToken?: string | null;
  dinerSessionId?: string | null;
  now?: Date;
  timeoutMs?: number;
  clearTableOnExpiry?: boolean;
}): Promise<EvaluateDeviceTableSessionResult> {
  const timeoutMs = params.timeoutMs ?? TABLE_SESSION_TIMEOUT_MS;
  const now = params.now ?? new Date();
  const clearTableOnExpiry = params.clearTableOnExpiry !== false;

  const cookieToken = params.cookieSessionToken?.trim() || null;
  const bodyToken = params.sessionToken?.trim() || null;
  const bodySessionId = params.dinerSessionId?.trim() || null;

  // Guard: If the browser holds an HttpOnly session cookie AND sends a conflicting body token,
  // reject immediately so a Table 3 device cannot spoof another table's sessionToken.
  if (cookieToken && bodyToken && cookieToken !== bodyToken) {
    return {
      valid: false,
      code: 'TABLE_MISMATCH',
      error: 'Device session mismatch detected. Please reload the menu and scan your table QR code.',
    };
  }

  const lookupToken = cookieToken || bodyToken;
  if (!lookupToken) {
    return {
      valid: false,
      code: 'TABLE_SCAN_REQUIRED',
      error: 'Please scan the QR code on your table before ordering or calling a waiter.',
    };
  }

  const session = await prisma.dinerSession.findFirst({
    where: {
      restaurantId: params.restaurantId,
      sessionToken: lookupToken,
    },
    select: {
      id: true,
      sessionToken: true,
      restaurantId: true,
      tableId: true,
      lastActiveAt: true,
    },
  });

  if (!session) {
    return {
      valid: false,
      code: 'TABLE_SCAN_REQUIRED',
      error: 'No active table scan found on this device. Please scan your table QR code.',
    };
  }

  // Guard: If client sent an explicit dinerSessionId that does not belong to this cryptographic session
  if (bodySessionId && bodySessionId !== session.id && bodySessionId !== session.sessionToken) {
    return {
      valid: false,
      code: 'TABLE_MISMATCH',
      error: 'Device session identity mismatch. Please scan your table QR code to continue.',
    };
  }

  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: params.tableId,
      restaurantId: params.restaurantId,
      isActive: true,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      section: true,
      capacity: true,
    },
  });

  if (!table) {
    return {
      valid: false,
      code: 'TABLE_SCAN_REQUIRED',
      error: 'This dining table is unavailable or inactive. Please scan a valid table QR code.',
    };
  }

  // Strictly block placing orders or calling a waiter for a DIFFERENT table than the one this device scanned.
  if (session.tableId && session.tableId !== params.tableId) {
    const currentTable = await prisma.restaurantTable.findFirst({
      where: {
        id: session.tableId,
        restaurantId: params.restaurantId,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        section: true,
        capacity: true,
      },
    });

    let activeCurrentSummary: ActiveBoundTableSummary | null = null;
    if (currentTable) {
      const [currScan, currOrder] = await Promise.all([
        prisma.scanEvent.findFirst({
          where: {
            restaurantId: params.restaurantId,
            tableId: currentTable.id,
            sessionToken: session.sessionToken,
          },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        }),
        prisma.order.findFirst({
          where: {
            restaurantId: params.restaurantId,
            tableId: currentTable.id,
            dinerSessionId: session.id,
          },
          orderBy: { placedAt: 'desc' },
          select: { placedAt: true },
        }),
      ]);

      const verifiedAt = currScan?.timestamp ?? session.lastActiveAt;
      const lastOrderAt = currOrder?.placedAt ?? null;
      const anchorAt =
        lastOrderAt && lastOrderAt.getTime() > verifiedAt.getTime() ? lastOrderAt : verifiedAt;
      const expiresAt = new Date(anchorAt.getTime() + timeoutMs);

      if (now.getTime() <= expiresAt.getTime()) {
        activeCurrentSummary = {
          tableId: currentTable.id,
          tableName: currentTable.name,
          tableSection: currentTable.section,
          tableCapacity: currentTable.capacity,
          verifiedAt: verifiedAt.toISOString(),
          lastOrderAt: lastOrderAt?.toISOString() ?? null,
          expiresAt: expiresAt.toISOString(),
        };
      }
    }

    return {
      valid: false,
      code: 'TABLE_MISMATCH',
      tableName: table.name,
      currentTableName: currentTable?.name ?? null,
      currentTable: activeCurrentSummary,
      error: currentTable
        ? `Your device is checked in at ${currentTable.name} and cannot place orders or call staff for ${table.name}.`
        : `Your device is connected to another table. Please scan the QR code on ${table.name} to order here.`,
    };
  }

  const [latestScan, latestOrder] = await Promise.all([
    prisma.scanEvent.findFirst({
      where: {
        restaurantId: params.restaurantId,
        tableId: params.tableId,
        sessionToken: session.sessionToken,
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
    prisma.order.findFirst({
      where: {
        restaurantId: params.restaurantId,
        tableId: params.tableId,
        dinerSessionId: session.id,
      },
      orderBy: { placedAt: 'desc' },
      select: { placedAt: true },
    }),
  ]);

  // If tableId was already cleared from DinerSession, determine whether it had previously
  // scanned this table (and expired) vs never scanned this table at all.
  if (!session.tableId) {
    if (latestScan || latestOrder) {
      const lastScanAt = latestScan?.timestamp ?? session.lastActiveAt;
      const lastOrderAt = latestOrder?.placedAt ?? null;
      const anchorAt =
        lastOrderAt && lastOrderAt.getTime() > lastScanAt.getTime() ? lastOrderAt : lastScanAt;
      const expiredAt = new Date(anchorAt.getTime() + timeoutMs);

      return {
        valid: false,
        code: 'TABLE_SCAN_EXPIRED',
        tableName: table.name,
        lastScanAt,
        lastOrderAt,
        anchorAt,
        expiredAt,
        timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
        error: `No order has been placed from your device in the last ${TABLE_SESSION_TIMEOUT_MINUTES} minutes. Please rescan the QR code on ${table.name} to continue.`,
      };
    }

    return {
      valid: false,
      code: 'TABLE_SCAN_REQUIRED',
      tableName: table.name,
      error: 'Your table session has ended. Please scan your table QR code to continue.',
    };
  }

  // Session is bound to this table: require a scan event or fallback session activity timestamp
  const lastScanAt = latestScan?.timestamp ?? session.lastActiveAt;
  const lastOrderAt = latestOrder?.placedAt ?? null;
  const anchorAt =
    lastOrderAt && lastOrderAt.getTime() > lastScanAt.getTime() ? lastOrderAt : lastScanAt;
  const expiresAt = new Date(anchorAt.getTime() + timeoutMs);

  if (now.getTime() > expiresAt.getTime()) {
    if (clearTableOnExpiry) {
      await prisma.dinerSession.updateMany({
        where: {
          id: session.id,
          tableId: params.tableId,
        },
        data: {
          tableId: null,
        },
      });
    }

    return {
      valid: false,
      code: 'TABLE_SCAN_EXPIRED',
      tableName: table.name,
      lastScanAt,
      lastOrderAt,
      anchorAt,
      expiredAt: expiresAt,
      timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
      error: `No order has been placed from your device in the last ${TABLE_SESSION_TIMEOUT_MINUTES} minutes. Please rescan the QR code on ${table.name} to continue.`,
    };
  }

  return {
    valid: true,
    tableName: table.name,
    lastScanAt,
    lastOrderAt,
    anchorAt,
    expiresAt,
    timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
    session,
    table,
  };
}
