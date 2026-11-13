import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '../src/lib/db/prisma';

let mockOwnerCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'dishora_owner_session' && mockOwnerCookieValue
        ? { value: mockOwnerCookieValue }
        : undefined,
  }),
}));

import { createOwnerToken } from '../src/lib/auth/owner-auth';
import {
  buildSignedTableQrToken,
  createRestaurantTable,
  resolveTableFromToken,
  rotateTableQrToken,
} from '../src/lib/tables/table-service';
import { getDinerSessionCookieName } from '../src/lib/diner/table-session';
import { placeTableOrder } from '../src/lib/orders/order-service';
import { POST as sessionPost } from '../src/app/api/diner/session/route';
import { POST as orderPost } from '../src/app/api/diner/orders/route';
import { GET as orderGet } from '../src/app/api/diner/orders/[orderId]/route';
import { POST as serviceCallPost } from '../src/app/api/diner/service-calls/route';
import { GET as qrGenerateGet } from '../src/app/api/qr/generate/route';
import { GET as tablesGet } from '../src/app/api/restaurants/[id]/tables/route';
import { GET as qrExportGet } from '../src/app/api/restaurants/[id]/tables/qr-export/route';

describe('Cross-Table Ordering & Waiter-Call Isolation (Table 3 vs Table 5)', () => {
  let restaurant: any;
  let ownerToken: string | null = null;
  let menuItem: any;
  const requiredModifierIds: string[] = [];

  let table3: { id: string; name: string; rawToken: string; signedToken: string };
  let table5: { id: string; name: string; rawToken: string; signedToken: string };

  const createdTableIds: string[] = [];
  const createdSessionTokens: string[] = [];
  const createdOrderIds: string[] = [];
  const createdServiceCallIds: string[] = [];

  beforeAll(async () => {
    restaurant = await prisma.restaurant.findFirst({
      where: { slug: 'chai-and-chutney' },
      include: {
        organization: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
        menuItems: {
          where: { isPublished: true, isAvailable: true },
          include: {
            modifierGroups: {
              include: { options: true },
            },
          },
        },
      },
    });

    expect(restaurant).not.toBeNull();
    menuItem = restaurant.menuItems[0];
    expect(menuItem).toBeDefined();

    for (const grp of menuItem.modifierGroups || []) {
      if (grp.required && grp.options?.length > 0) {
        requiredModifierIds.push(grp.options[0].id);
      }
    }

    const ownerUser = restaurant.organization?.members?.[0]?.user;
    if (ownerUser) {
      ownerToken = createOwnerToken(ownerUser.id, ownerUser.email);
    }

    const t3 = await createRestaurantTable({
      restaurantId: restaurant.id,
      name: `Table 03 Isolation ${Date.now()}`,
      section: 'Main Dining',
      capacity: 4,
    });
    createdTableIds.push(t3.table.id);
    table3 = {
      id: t3.table.id,
      name: t3.table.name,
      rawToken: t3.rawToken,
      signedToken: buildSignedTableQrToken(t3.table),
    };

    const t5 = await createRestaurantTable({
      restaurantId: restaurant.id,
      name: `Table 05 Isolation ${Date.now()}`,
      section: 'Patio',
      capacity: 4,
    });
    createdTableIds.push(t5.table.id);
    table5 = {
      id: t5.table.id,
      name: t5.table.name,
      rawToken: t5.rawToken,
      signedToken: buildSignedTableQrToken(t5.table),
    };
  });

  afterAll(async () => {
    mockOwnerCookieValue = undefined;
    if (createdServiceCallIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "TableServiceCall" WHERE "id" = ANY($1::text[])`,
        createdServiceCallIds
      ).catch(() => {});
    }
    if (createdOrderIds.length > 0) {
      await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } }).catch(() => {});
    }
    if (createdTableIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "TableServiceCall" WHERE "tableId" = ANY($1::text[])`,
        createdTableIds
      ).catch(() => {});
      await prisma.order
        .deleteMany({ where: { tableId: { in: createdTableIds } } })
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
      await prisma.scanEvent
        .deleteMany({ where: { tableId: { in: createdTableIds } } })
        .catch(() => {});
      await prisma.restaurantTable
        .deleteMany({ where: { id: { in: createdTableIds } } })
        .catch(() => {});
    }
  });

  it('blocks a person checked in at Table 3 from placing orders or calling a waiter for Table 5 across all API vectors', async () => {
    const cookieName = getDinerSessionCookieName(restaurant.id);

    // 1. Person sits at Table 3 and scans Table 3's QR
    const scan3Res = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: table3.rawToken,
        }),
      })
    );
    expect(scan3Res.status).toBe(200);
    const scan3Body = await scan3Res.json();
    expect(scan3Body.tableId).toBe(table3.id);

    const session3Token: string = scan3Body.sessionToken;
    const session3Id: string = scan3Body.sessionId;
    createdSessionTokens.push(session3Token);

    // Also create a legitimate independent diner session sitting at Table 5
    const scan5Res = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: table5.rawToken,
        }),
      })
    );
    expect(scan5Res.status).toBe(200);
    const scan5Body = await scan5Res.json();
    const session5Token: string = scan5Body.sessionToken;
    const session5Id: string = scan5Body.sessionId;
    createdSessionTokens.push(session5Token);

    // 2. Tampered order payload: Table 3 device submits tableId = table5.id
    const spoofOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${session3Token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table5.id,
          sessionToken: session3Token,
          dinerSessionId: session3Id,
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
    expect(spoofOrderRes.status).toBe(403);
    const spoofOrderBody = await spoofOrderRes.json();
    expect(spoofOrderBody.code).toBe('TABLE_MISMATCH');
    expect(spoofOrderBody.currentTable?.tableId).toBe(table3.id);
    expect(spoofOrderBody.currentTable?.tableName).toBe(table3.name);

    // 3. Tampered waiter call: Table 3 device submits call for Table 5
    const spoofCallRes = await serviceCallPost(
      new Request('http://localhost:3000/api/diner/service-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${session3Token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table5.id,
          sessionToken: session3Token,
          dinerSessionId: session3Id,
          callType: 'BILL',
        }),
      })
    );
    expect(spoofCallRes.status).toBe(403);
    const spoofCallBody = await spoofCallRes.json();
    expect(spoofCallBody.code).toBe('TABLE_MISMATCH');

    // 4. Body session spoofing while holding Table 3's HttpOnly cookie (even if Table 5's sessionToken or ID were leaked)
    const hijackBodyRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${session3Token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table5.id,
          sessionToken: session5Token,
          dinerSessionId: session5Id,
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
    expect(hijackBodyRes.status).toBe(403);
    const hijackBody = await hijackBodyRes.json();
    expect(hijackBody.code).toBe('TABLE_MISMATCH');

    // 5. Guessing/swapping only dinerSessionId with Table 3 cookie + Table 3 token also fails
    const hijackIdRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${session3Token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table5.id,
          sessionToken: session3Token,
          dinerSessionId: session5Id,
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
    expect(hijackIdRes.status).toBe(403);
    expect((await hijackIdRes.json()).code).toBe('TABLE_MISMATCH');

    // 6. Verify direct service layer also refuses binding Table 3's session to Table 5
    await expect(
      placeTableOrder({
        restaurantId: restaurant.id,
        tableId: table5.id,
        sessionToken: session3Token,
        dinerSessionId: session3Id,
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 1,
            modifierOptionIds: requiredModifierIds,
          },
        ],
      })
    ).rejects.toThrow(/bound to another table/i);

    // Confirm ZERO orders and ZERO service calls were ever recorded on Table 5
    const table5Orders = await prisma.order.count({ where: { tableId: table5.id } });
    expect(table5Orders).toBe(0);
    const table5Calls = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS count FROM "TableServiceCall" WHERE "tableId" = $1`,
      table5.id
    );
    expect(Number(table5Calls[0]?.count || 0)).toBe(0);

    // Table 3 CAN still order legitimately for Table 3 itself
    const ownOrderRes = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${session3Token}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table3.id,
          sessionToken: session3Token,
          dinerSessionId: session3Id,
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
    expect(ownOrderRes.status).toBe(200);
    const ownOrderBody = await ownOrderRes.json();
    createdOrderIds.push(ownOrderBody.order.id);

    const ownOrderRead = await orderGet(
      new Request(`http://localhost:3000/api/diner/orders/${ownOrderBody.order.id}`, {
        headers: { Cookie: `${cookieName}=${session3Token}` },
      }),
      { params: Promise.resolve({ orderId: ownOrderBody.order.id }) }
    );
    expect(ownOrderRead.status).toBe(200);

    const crossSessionRead = await orderGet(
      new Request(`http://localhost:3000/api/diner/orders/${ownOrderBody.order.id}`, {
        headers: { Cookie: `${cookieName}=${session5Token}` },
      }),
      { params: Promise.resolve({ orderId: ownOrderBody.order.id }) }
    );
    expect(crossSessionRead.status).toBe(404);

    const anonymousRead = await orderGet(
      new Request(`http://localhost:3000/api/diner/orders/${ownOrderBody.order.id}`),
      { params: Promise.resolve({ orderId: ownOrderBody.order.id }) }
    );
    expect(anonymousRead.status).toBe(404);
  });

  it('rejects raw ?tableId= UUID switching and forged/rotated signed QR tokens', async () => {
    const cookieName = getDinerSessionCookieName(restaurant.id);

    // Guest starts on Table 3
    const initRes = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: table3.rawToken,
        }),
      })
    );
    const initBody = await initRes.json();
    const attackerSession = initBody.sessionToken as string;
    createdSessionTokens.push(attackerSession);
    expect(initBody.tableId).toBe(table3.id);

    // Attack A: Guest visits /m/<slug>?tableId=<table5.id> or POSTs { tableId: table5.id } to session endpoint
    const rawTableIdRes = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${attackerSession}`,
        },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          tableId: table5.id,
          sessionToken: attackerSession,
        }),
      })
    );
    expect(rawTableIdRes.status).toBe(200);
    const rawTableIdBody = await rawTableIdRes.json();
    expect(rawTableIdBody.invalidTableToken).toBe(true);
    expect(rawTableIdBody.tableId).toBeNull();

    // Even after raw tableId attempt, ordering for Table 5 is rejected
    const afterRawIdOrder = await orderPost(
      new Request('http://localhost:3000/api/diner/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${attackerSession}`,
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table5.id,
          sessionToken: attackerSession,
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
    expect(afterRawIdOrder.status).toBe(403);

    // Attack B: Guest tries forging a tq_ signed token by swapping payload to table5.id while keeping table3's MAC
    const [, sig3] = table3.signedToken.slice(3).split('.');
    const forgedPayload = Buffer.from(`${table5.id}:1`, 'utf8').toString('base64url');
    const forgedSignedToken = `tq_${forgedPayload}.${sig3}`;

    const forgedResolved = await resolveTableFromToken(restaurant.slug, forgedSignedToken);
    expect(forgedResolved).toBeNull();

    const forgedScanRes = await sessionPost(
      new Request('http://localhost:3000/api/diner/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${cookieName}=${attackerSession}`,
        },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          t: forgedSignedToken,
        }),
      })
    );
    const forgedScanBody = await forgedScanRes.json();
    expect(forgedScanBody.invalidTableToken).toBe(true);
    expect(forgedScanBody.tableId).toBeNull();

    // Attack C: Valid signed tq_ token IS invalidated immediately when Table 5 QR is rotated
    const validPreRotation = await resolveTableFromToken(restaurant.slug, table5.signedToken);
    expect(validPreRotation?.table.id).toBe(table5.id);

    const rotated = await rotateTableQrToken(restaurant.id, table5.id);
    const postRotationOldSigned = await resolveTableFromToken(restaurant.slug, table5.signedToken);
    expect(postRotationOldSigned).toBeNull();

    const newSigned = buildSignedTableQrToken(rotated.table);
    const postRotationNewSigned = await resolveTableFromToken(restaurant.slug, newSigned);
    expect(postRotationNewSigned?.table.id).toBe(table5.id);
    expect(postRotationNewSigned?.table.qrVersion).toBe(2);
    table5.rawToken = rotated.rawToken;
    table5.signedToken = newSigned;
  });

  it('issues only signed ?t=tq_ URLs from owner endpoints and blocks unauthenticated /api/qr/generate table requests', async () => {
    mockOwnerCookieValue = undefined;

    const unauthQr = await qrGenerateGet(
      new Request(
        `http://localhost:3000/api/qr/generate?slug=${encodeURIComponent(restaurant.slug)}&tableId=${encodeURIComponent(table5.id)}`
      )
    );
    expect(unauthQr.status).toBe(401);

    const unauthExport = await qrExportGet(
      new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/tables/qr-export`),
      { params: Promise.resolve({ id: restaurant.id }) }
    );
    expect(unauthExport.status).toBe(401);

    if (ownerToken) {
      mockOwnerCookieValue = ownerToken;

      const authQr = await qrGenerateGet(
        new Request(
          `http://localhost:3000/api/qr/generate?slug=${encodeURIComponent(restaurant.slug)}&tableId=${encodeURIComponent(table5.id)}`
        )
      );
      expect(authQr.status).toBe(200);
      const authQrBody = await authQr.json();
      expect(authQrBody.targetUrl).toContain('?t=tq_');
      expect(authQrBody.targetUrl).not.toContain('tableId=');

      const authExport = await qrExportGet(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/tables/qr-export`),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      expect(authExport.status).toBe(200);
      const exportBody = await authExport.json();
      const exportedT5 = exportBody.tables.find((t: any) => t.id === table5.id);
      expect(exportedT5).toBeDefined();
      expect(exportedT5.scanUrl).toContain('?t=tq_');
      expect(exportedT5.scanUrl).not.toContain('tableId=');

      const authTables = await tablesGet(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/tables`),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      expect(authTables.status).toBe(200);
      const tablesBody = await authTables.json();
      const listedT5 = tablesBody.tables.find((t: any) => t.id === table5.id);
      expect(listedT5?.scanUrl).toContain('?t=tq_');
      expect(listedT5?.scanUrl).not.toContain('tableId=');
    }
  });
});
