import crypto from 'crypto';
import prisma from '../db/prisma';

const SIGNED_QR_TOKEN_PREFIX = 'tq_';

function getTableQrSigningKey(): string {
  return (
    process.env.QR_SIGNING_SECRET ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.STAFF_SESSION_SECRET ||
    'menzy-table-qr-signing-v1'
  );
}

function buildSignedTableQrSignature(table: {
  id: string;
  restaurantId: string;
  qrVersion: number;
  qrTokenHash: string;
}): string {
  return crypto
    .createHmac('sha256', `${getTableQrSigningKey()}:${table.qrTokenHash}`)
    .update(`${table.restaurantId}:${table.id}:${table.qrVersion}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Generates an unguessable, version-bound, revocable table QR token (`tq_...`)
 * derived deterministically from the server's secret and the table's DB `qrTokenHash` + `qrVersion`.
 * Rotating the table QR (`qrTokenHash` & `qrVersion`) immediately invalidates prior `tq_...` tokens.
 */
export function buildSignedTableQrToken(table: {
  id: string;
  restaurantId: string;
  qrVersion: number;
  qrTokenHash: string;
}): string {
  const payload = Buffer.from(`${table.id}:${table.qrVersion}`, 'utf8').toString('base64url');
  const signature = buildSignedTableQrSignature(table);
  return `${SIGNED_QR_TOKEN_PREFIX}${payload}.${signature}`;
}

export function isSignedTableQrToken(token: string): boolean {
  return token.trim().startsWith(SIGNED_QR_TOKEN_PREFIX);
}

function parseSignedTableQrToken(token: string): {
  tableId: string;
  qrVersion: number;
  signature: string;
} | null {
  const trimmed = token.trim();
  if (!trimmed.startsWith(SIGNED_QR_TOKEN_PREFIX)) return null;

  const rest = trimmed.slice(SIGNED_QR_TOKEN_PREFIX.length);
  const dotIdx = rest.indexOf('.');
  if (dotIdx <= 0) return null;

  const payloadB64 = rest.slice(0, dotIdx);
  const signature = rest.slice(dotIdx + 1);
  if (!payloadB64 || !/^[a-f0-9]{32}$/i.test(signature)) return null;

  try {
    const decoded = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const sepIdx = decoded.lastIndexOf(':');
    if (sepIdx <= 0) return null;

    const tableId = decoded.slice(0, sepIdx).trim();
    const versionStr = decoded.slice(sepIdx + 1).trim();
    const qrVersion = Number(versionStr);

    if (!tableId || !Number.isInteger(qrVersion) || qrVersion < 1) {
      return null;
    }

    return {
      tableId,
      qrVersion,
      signature: signature.toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function generateRawTableToken(): string {
  return `tbl_${crypto.randomBytes(24).toString('hex')}`;
}

export function hashQrToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Resolve table by raw (`tbl_...`) or HMAC-signed (`tq_...`) cryptographic token,
 * optionally scoped to a restaurant slug. Never resolves raw database `table.id` UUIDs.
 */
export async function resolveTableFromToken(
  restaurantSlugOrToken: string,
  rawToken?: string
) {
  const isSingleArg = rawToken === undefined;
  const token = (isSingleArg ? restaurantSlugOrToken : rawToken)?.trim();
  const restaurantSlug = isSingleArg ? undefined : restaurantSlugOrToken;

  if (!token) return null;

  if (isSignedTableQrToken(token)) {
    const parsed = parseSignedTableQrToken(token);
    if (!parsed) return null;

    const table = await prisma.restaurantTable.findFirst({
      where: {
        id: parsed.tableId,
        ...(restaurantSlug ? { restaurant: { slug: restaurantSlug } } : {}),
        isActive: true,
        isArchived: false,
      },
      include: {
        restaurant: {
          select: { id: true, slug: true, displayName: true, currency: true },
        },
      },
    });

    if (!table || table.qrVersion !== parsed.qrVersion) {
      return null;
    }

    const expectedSig = buildSignedTableQrSignature(table);
    const sigBuf = Buffer.from(parsed.signature, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    return {
      restaurant: table.restaurant,
      table,
    };
  }

  const qrTokenHash = hashQrToken(token);

  if (restaurantSlug) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      select: { id: true, slug: true, displayName: true, currency: true },
    });

    if (!restaurant) return null;

    const table = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId: restaurant.id,
        qrTokenHash,
        isActive: true,
        isArchived: false,
      },
    });

    if (!table) return null;

    return {
      restaurant,
      table,
    };
  } else {
    const table = await prisma.restaurantTable.findFirst({
      where: {
        qrTokenHash,
        isActive: true,
        isArchived: false,
      },
      include: {
        restaurant: {
          select: { id: true, slug: true, displayName: true, currency: true },
        },
      },
    });

    if (!table) return null;

    return {
      restaurant: table.restaurant,
      table,
    };
  }
}

/**
 * Create an individual dining table
 */
export async function createRestaurantTable(data: {
  restaurantId: string;
  name: string;
  section?: string;
  capacity?: number;
}) {
  const rawToken = generateRawTableToken();
  const qrTokenHash = hashQrToken(rawToken);

  const table = await prisma.restaurantTable.create({
    data: {
      restaurantId: data.restaurantId,
      name: data.name.trim(),
      section: data.section?.trim() || 'Main Dining',
      capacity: data.capacity || 4,
      qrTokenHash,
      qrVersion: 1,
      isActive: true,
      isArchived: false,
    },
  });

  return {
    table,
    rawToken,
  };
}

/**
 * Bulk create tables with numbering pattern
 */
export async function bulkCreateRestaurantTables(data: {
  restaurantId: string;
  count: number;
  namingPattern?: string; // e.g. "Table {number}" or "Patio {number}"
  section?: string;
  capacity?: number;
}) {
  const pattern = data.namingPattern || 'Table {number}';
  const count = Math.min(Math.max(1, data.count), 50); // limit 1-50 per batch
  const created: Array<{ table: any; rawToken: string }> = [];

  // Find existing table count or max number to avoid naming conflicts
  const existingTables = await prisma.restaurantTable.findMany({
    where: { restaurantId: data.restaurantId, isArchived: false },
    select: { name: true },
  });
  const existingNames = new Set(existingTables.map((t) => t.name.toLowerCase()));

  let currentNum = 1;
  while (created.length < count && currentNum <= 100) {
    const formattedNum = currentNum < 10 ? `0${currentNum}` : `${currentNum}`;
    const tableName = pattern.replace('{number}', formattedNum).replace('{n}', `${currentNum}`);

    if (!existingNames.has(tableName.toLowerCase())) {
      const rawToken = generateRawTableToken();
      const qrTokenHash = hashQrToken(rawToken);

      const table = await prisma.restaurantTable.create({
        data: {
          restaurantId: data.restaurantId,
          name: tableName,
          section: data.section || 'Main Dining',
          capacity: data.capacity || 4,
          qrTokenHash,
          qrVersion: 1,
          isActive: true,
        },
      });

      existingNames.add(tableName.toLowerCase());
      created.push({ table, rawToken });
    }
    currentNum++;
  }

  return created;
}

/**
 * Rotate table QR token to invalidate old QR code
 */
export async function rotateTableQrToken(firstId: string, secondId: string) {
  let table = await prisma.restaurantTable.findFirst({
    where: { id: firstId, restaurantId: secondId },
  });

  if (!table) {
    table = await prisma.restaurantTable.findFirst({
      where: { id: secondId, restaurantId: firstId },
    });
  }

  if (!table) {
    throw new Error('Table not found or does not belong to this restaurant');
  }

  const tableId = table.id;
  const newRawToken = generateRawTableToken();
  const newHash = hashQrToken(newRawToken);

  const updated = await prisma.restaurantTable.update({
    where: { id: tableId },
    data: {
      qrTokenHash: newHash,
      qrVersion: { increment: 1 },
    },
  });

  return {
    table: updated,
    rawToken: newRawToken,
  };
}
