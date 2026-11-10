import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/db/prisma';
import {
  createRestaurantTable,
  resolveTableFromToken,
  rotateTableQrToken,
  bulkCreateRestaurantTables,
} from '../src/lib/tables/table-service';
import {
  hashStaffPassword,
  verifyStaffPassword,
  generateStaffSessionToken,
  hashToken,
  verifyStaffSessionToken,
  canStaffPerform,
  isAllowedStatusTransition,
} from '../src/lib/auth/staff-auth';
import {
  calculateOrderQuote,
  placeTableOrder,
  updateOrderStatus,
} from '../src/lib/orders/order-service';
import {
  createServiceCall,
  getActiveServiceCalls,
  resolveServiceCall,
} from '../src/lib/tables/service-call-service';
import {
  generateThemeVariables,
  generateStaffTypographyVars,
  normalizeThemeFont,
  THEME_PRESETS,
} from '../src/lib/theme/theme-presets';
import {
  normalizeGuestWifiInput,
  isWifiVisibleToDiners,
  buildWifiQrString,
} from '../src/lib/wifi/wifi-qr';

describe('Table QR Management, Staff Security & Ordering Engine', () => {
  let testRestaurant: any;
  let testMenuItem: any;
  let requiredModifierOptionIds: string[] = [];

  // Retrieve existing seeded restaurant & menu item for integration testing
  it('prepares test fixtures from seeded restaurant data', async () => {
    testRestaurant = await prisma.restaurant.findFirst({
      where: { slug: 'chai-and-chutney' },
      include: {
        tables: true,
        menuItems: {
          include: {
            modifierGroups: {
              include: { options: true },
            },
          },
        },
      },
    });

    expect(testRestaurant).not.toBeNull();
    expect(testRestaurant.id).toBeDefined();

    testMenuItem = testRestaurant.menuItems.find((m: any) => m.isPublished && m.isAvailable);
    expect(testMenuItem).toBeDefined();

    // Collect required modifier options if any exist
    if (testMenuItem.modifierGroups) {
      for (const grp of testMenuItem.modifierGroups) {
        if (grp.required && grp.options && grp.options.length > 0) {
          requiredModifierOptionIds.push(grp.options[0].id);
        }
      }
    }
  });

  // 1. Table QR Tokens & Unguessability
  describe('Table Token Security & Rotation', () => {
    let createdTable: any;
    let originalToken: string;
    const uniqueTableName = `Test Booth ${Date.now()}`;

    it('generates unguessable token and cryptographic SHA-256 hash on table creation', async () => {
      const res = await createRestaurantTable({
        restaurantId: testRestaurant.id,
        name: uniqueTableName,
        section: 'Patio VIP',
        capacity: 6,
      });

      expect(res.rawToken).toMatch(/^tbl_[a-f0-9]{48}$/);
      expect(res.table.id).toBeDefined();
      expect(res.table.qrTokenHash).toBeDefined();
      expect(res.table.qrTokenHash).not.toEqual(res.rawToken);
      expect(res.table.qrVersion).toBe(1);

      createdTable = res.table;
      originalToken = res.rawToken;
    });

    it('resolves the correct restaurant table using the raw unguessable token', async () => {
      const resolved = await resolveTableFromToken(originalToken);
      expect(resolved).not.toBeNull();
      expect(resolved?.table.id).toBe(createdTable.id);
      expect(resolved?.restaurant.id).toBe(testRestaurant.id);
      expect(resolved?.table.name).toBe(uniqueTableName);
    });

    it('rejects forged or tampered table tokens', async () => {
      const tampered = originalToken.slice(0, -6) + '000000';
      const resolved = await resolveTableFromToken(tampered);
      expect(resolved).toBeNull();

      const invalidLength = 'tbl_1234';
      const resolvedInvalid = await resolveTableFromToken(invalidLength);
      expect(resolvedInvalid).toBeNull();
    });

    it('rotates table QR token, instantly invalidating the previous token', async () => {
      const rotation = await rotateTableQrToken(testRestaurant.id, createdTable.id);
      expect(rotation.rawToken).toBeDefined();
      expect(rotation.rawToken).not.toEqual(originalToken);
      expect(rotation.table.qrVersion).toBe(2);

      // Old token MUST now be rejected
      const resolvedOld = await resolveTableFromToken(originalToken);
      expect(resolvedOld).toBeNull();

      // New token MUST resolve
      const resolvedNew = await resolveTableFromToken(rotation.rawToken);
      expect(resolvedNew).not.toBeNull();
      expect(resolvedNew?.table.id).toBe(createdTable.id);
      expect(resolvedNew?.table.qrVersion).toBe(2);
    });

    it('bulk creates 3 dining tables with distinct unguessable tokens', async () => {
      const result = await bulkCreateRestaurantTables({
        restaurantId: testRestaurant.id,
        count: 3,
        namingPattern: 'Deck {number}',
        section: 'Rooftop',
        capacity: 4,
      });

      expect(result.length).toBe(3);

      const tokens = result.map((t) => t.rawToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);

      // Verify each table can be resolved
      for (const t of result) {
        const resolved = await resolveTableFromToken(t.rawToken);
        expect(resolved).not.toBeNull();
        expect(resolved?.table.section).toBe('Rooftop');
      }
    });
  });

  // 2. Staff Authentication & Cryptographic Hashing
  describe('Staff Authentication & Permission Hierarchy', () => {
    it('hashes passwords using PBKDF2 with 100,000 iterations and random salt', () => {
      const plain = 'KitchenChefPass2026!';
      const hash1 = hashStaffPassword(plain);
      const hash2 = hashStaffPassword(plain);

      // Salts must differ
      expect(hash1).not.toEqual(hash2);
      expect(hash1).toContain(':');

      const [salt, key] = hash1.split(':');
      expect(salt.length).toBe(32); // 16 bytes hex
      expect(key.length).toBe(128); // 64 bytes hex (sha512)

      expect(verifyStaffPassword(plain, hash1)).toBe(true);
      expect(verifyStaffPassword(plain, hash2)).toBe(true);
      expect(verifyStaffPassword('WrongPassword!', hash1)).toBe(false);
    });

    it('generates random session tokens and verifies valid session tokens', async () => {
      const rawToken = generateStaffSessionToken();
      expect(rawToken.startsWith('stf_')).toBe(true);
      expect(rawToken.length).toBeGreaterThan(32);

      // Test with an existing staff member in database
      const staff = await prisma.restaurantStaff.findFirst({
        where: { restaurantId: testRestaurant.id, isActive: true },
      });
      expect(staff).not.toBeNull();

      if (staff) {
        const hashed = hashToken(rawToken);
        const session = await prisma.staffSession.create({
          data: {
            staffId: staff.id,
            sessionTokenHash: hashed,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          },
        });

        const verified = await verifyStaffSessionToken(rawToken);
        expect(verified).not.toBeNull();
        expect(verified?.staffId).toBe(staff.id);

        // Invalid token returns null
        const tampered = rawToken.slice(0, -4) + 'abcd';
        const fail = await verifyStaffSessionToken(tampered);
        expect(fail).toBeNull();

        // Cleanup
        await prisma.staffSession.delete({ where: { id: session.id } });
      }
    });

    it('strictly enforces role permission boundaries', () => {
      // KITCHEN
      expect(canStaffPerform('KITCHEN', 'VIEW_ORDERS')).toBe(true);
      expect(canStaffPerform('KITCHEN', 'UPDATE_PREPARATION')).toBe(true);
      expect(canStaffPerform('KITCHEN', 'ACCEPT_REJECT_ORDERS')).toBe(false);
      expect(canStaffPerform('KITCHEN', 'MANAGE_STAFF')).toBe(false);
      expect(canStaffPerform('KITCHEN', 'MANAGE_SETTINGS')).toBe(false);

      // WAITER
      expect(canStaffPerform('WAITER', 'VIEW_ORDERS')).toBe(true);
      expect(canStaffPerform('WAITER', 'MARK_SERVED')).toBe(true);
      expect(canStaffPerform('WAITER', 'CANCEL_ORDER')).toBe(false);
      expect(canStaffPerform('WAITER', 'MANAGE_SETTINGS')).toBe(false);

      // MANAGER
      expect(canStaffPerform('MANAGER', 'VIEW_ORDERS')).toBe(true);
      expect(canStaffPerform('MANAGER', 'ACCEPT_REJECT_ORDERS')).toBe(true);
      expect(canStaffPerform('MANAGER', 'UPDATE_PREPARATION')).toBe(true);
      expect(canStaffPerform('MANAGER', 'CANCEL_ORDER')).toBe(true);
      expect(canStaffPerform('MANAGER', 'VIEW_ANALYTICS')).toBe(true);

      // OWNER
      expect(canStaffPerform('OWNER', 'MANAGE_STAFF')).toBe(true);
      expect(canStaffPerform('OWNER', 'MANAGE_SETTINGS')).toBe(true);
    });

    it('strictly enforces valid order status lifecycle transitions', () => {
      // PLACED -> ACCEPTED (allowed for MANAGER / OWNER, disallowed for WAITER)
      expect(isAllowedStatusTransition('PLACED', 'ACCEPTED', 'MANAGER').allowed).toBe(true);
      expect(isAllowedStatusTransition('PLACED', 'ACCEPTED', 'OWNER').allowed).toBe(true);
      expect(isAllowedStatusTransition('PLACED', 'ACCEPTED', 'WAITER').allowed).toBe(false);

      // ACCEPTED -> PREPARING (allowed for KITCHEN)
      expect(isAllowedStatusTransition('ACCEPTED', 'PREPARING', 'KITCHEN').allowed).toBe(true);

      // PREPARING -> READY (allowed for KITCHEN)
      expect(isAllowedStatusTransition('PREPARING', 'READY', 'KITCHEN').allowed).toBe(true);

      // READY -> SERVED (allowed for WAITER)
      expect(isAllowedStatusTransition('READY', 'SERVED', 'WAITER').allowed).toBe(true);

      // Disallow illegal skips: PLACED -> SERVED
      expect(isAllowedStatusTransition('PLACED', 'SERVED', 'OWNER').allowed).toBe(false);

      // Disallow transitions from terminal states: COMPLETED -> PREPARING
      expect(isAllowedStatusTransition('COMPLETED', 'PREPARING', 'OWNER').allowed).toBe(false);
      expect(isAllowedStatusTransition('CANCELLED', 'ACCEPTED', 'OWNER').allowed).toBe(false);
    });
  });

  // 3. Server-Side Price Recalculation & Fraud Rejection
  describe('Server-Side Quote Calculation & Modifier Integrity', () => {
    it('enforces required modifier groups and rejects order if required selection is missing', async () => {
      if (requiredModifierOptionIds.length > 0) {
        // Intentionally omit required modifiers
        const quoteMissingMod = await calculateOrderQuote(testRestaurant.id, [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            modifierOptionIds: [],
          },
        ]);

        expect(quoteMissingMod.valid).toBe(false);
        expect(quoteMissingMod.error).toContain('Please select at least');
      }
    });

    it('calculates order quote from canonical dish prices in minor units with modifiers', async () => {
      const quote = await calculateOrderQuote(testRestaurant.id, [
        {
          menuItemId: testMenuItem.id,
          quantity: 2,
          modifierOptionIds: requiredModifierOptionIds,
        },
      ]);

      expect(quote.valid).toBe(true);
      expect(quote.currency).toBe(testRestaurant.currency);
      expect(quote.items.length).toBe(1);

      const item = quote.items[0];
      const expectedLineTotal = (item.unitPriceMinor + item.modifiersTotalMinor) * 2;
      expect(item.lineTotalMinor).toBe(expectedLineTotal);
      expect(quote.subtotalMinor).toBe(expectedLineTotal);

      // Tax check (default 5%)
      const expectedTax = Math.round((quote.subtotalMinor * quote.taxPercentage) / 100);
      expect(quote.taxMinor).toBe(expectedTax);
      expect(quote.totalMinor).toBe(quote.subtotalMinor + expectedTax + quote.serviceChargeMinor);
    });

    it('rejects order with non-existent or inactive dish id', async () => {
      const fakeQuote = await calculateOrderQuote(testRestaurant.id, [
        {
          menuItemId: 'non-existent-dish-id',
          quantity: 1,
        },
      ]);

      expect(fakeQuote.valid).toBe(false);
      expect(fakeQuote.error).toContain('no longer available');
    });

    it('rejects order with empty items array', async () => {
      const emptyQuote = await calculateOrderQuote(testRestaurant.id, []);
      expect(emptyQuote.valid).toBe(false);
      expect(emptyQuote.error).toContain('Cart is empty');
    });
  });

  // 4. Order Placement, Snapshots & Status Audit Trail
  describe('Transactional Order Placement & Live Workflow', () => {
    let placedOrder: any;
    let targetTable: any;

    it('places a table order with immutable snapshots and initial PLACED status', async () => {
      targetTable = await prisma.restaurantTable.findFirst({
        where: { restaurantId: testRestaurant.id, isActive: true },
      });
      expect(targetTable).not.toBeNull();

      placedOrder = await placeTableOrder({
        restaurantId: testRestaurant.id,
        tableId: targetTable.id,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 2,
            modifierOptionIds: requiredModifierOptionIds,
            specialInstructions: 'Less spicy please',
          },
        ],
        specialInstructions: 'Corner table seating',
      });

      expect(placedOrder.id).toBeDefined();
      expect(placedOrder.orderNumber).toBeDefined();
      expect(placedOrder.status).toBe('PLACED');
      expect(placedOrder.items.length).toBe(1);

      const firstItem = placedOrder.items[0];
      expect(firstItem.dishNameSnapshot).toBe(testMenuItem.customName);
      expect(firstItem.unitPriceMinor).toBe(testMenuItem.priceMinor);
      expect(firstItem.quantity).toBe(2);
      expect(firstItem.specialInstructions).toBe('Less spicy please');

      // Verify audit history was recorded
      expect(placedOrder.statusHistory.length).toBeGreaterThanOrEqual(1);
      expect(placedOrder.statusHistory[0].newStatus).toBe('PLACED');
    });

    it('advances order through kitchen workflow to ACCEPTED, PREPARING, and READY', async () => {
      // Transition to ACCEPTED (Manager)
      const accepted = await updateOrderStatus({
        orderId: placedOrder.id,
        restaurantId: testRestaurant.id,
        nextStatus: 'ACCEPTED',
        actorType: 'STAFF',
        staffRole: 'MANAGER',
        note: 'Manager accepted ticket',
      });
      expect(accepted.status).toBe('ACCEPTED');

      // Transition to PREPARING (Kitchen)
      const preparing = await updateOrderStatus({
        orderId: placedOrder.id,
        restaurantId: testRestaurant.id,
        nextStatus: 'PREPARING',
        actorType: 'STAFF',
        staffRole: 'KITCHEN',
      });
      expect(preparing.status).toBe('PREPARING');

      // Transition to READY (Kitchen)
      const ready = await updateOrderStatus({
        orderId: placedOrder.id,
        restaurantId: testRestaurant.id,
        nextStatus: 'READY',
        actorType: 'STAFF',
        staffRole: 'KITCHEN',
        note: 'Order plated and ready on pass',
      });
      expect(ready.status).toBe('READY');
    });

    it('allows floor waiter to mark order SERVED to table', async () => {
      const served = await updateOrderStatus({
        orderId: placedOrder.id,
        restaurantId: testRestaurant.id,
        nextStatus: 'SERVED',
        actorType: 'STAFF',
        staffRole: 'WAITER',
        note: 'Delivered to Table 01',
      });
      expect(served.status).toBe('SERVED');

      // Check full status history audit trail
      const reloaded = await prisma.order.findUnique({
        where: { id: placedOrder.id },
        include: { statusHistory: { orderBy: { createdAt: 'asc' } } },
      });

      const historyStatuses = reloaded?.statusHistory.map((h) => h.newStatus);
      expect(historyStatuses).toEqual(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED']);
    });

    it('prevents cross-tenant order manipulation', async () => {
      // Attempting to update the order with a foreign restaurant ID
      await expect(
        updateOrderStatus({
          orderId: placedOrder.id,
          restaurantId: 'foreign_restaurant_9999',
          nextStatus: 'COMPLETED',
          actorType: 'STAFF',
        })
      ).rejects.toThrow();
    });

    it('resolves sessionToken correctly without Order_dinerSessionId_fkey foreign key constraint violation', async () => {
      const uniqueToken = `ds_test_${Date.now()}`;
      const sessionOrder = await placeTableOrder({
        restaurantId: testRestaurant.id,
        tableId: targetTable.id,
        sessionToken: uniqueToken,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            modifierOptionIds: requiredModifierOptionIds,
          },
        ],
      });

      expect(sessionOrder.id).toBeDefined();
      expect(sessionOrder.dinerSessionId).not.toBeNull();

      // Verify the session was properly created or linked and foreign key is valid
      const linkedSession = await prisma.dinerSession.findUnique({
        where: { id: sessionOrder.dinerSessionId! },
      });
      expect(linkedSession).not.toBeNull();
      expect(linkedSession?.sessionToken).toBe(uniqueToken);
    });

    it('gracefully handles invalid/arbitrary session token without failing order placement', async () => {
      const orderWithArbitraryToken = await placeTableOrder({
        restaurantId: testRestaurant.id,
        tableId: targetTable.id,
        dinerSessionId: 'invalid-nonexistent-session-id',
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            modifierOptionIds: requiredModifierOptionIds,
          },
        ],
      });

      expect(orderWithArbitraryToken.id).toBeDefined();
      expect(orderWithArbitraryToken.status).toBe('PLACED');
    });

    it('handles stale/deleted UUID dinerSessionId and deleted-order number gaps without FK or unique constraint errors', async () => {
      const staleUuidOrder = await placeTableOrder({
        restaurantId: testRestaurant.id,
        tableId: targetTable.id,
        dinerSessionId: '00000000-0000-4000-8000-000000000099',
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            modifierOptionIds: requiredModifierOptionIds,
          },
        ],
      });
      expect(staleUuidOrder.id).toBeDefined();
      expect(staleUuidOrder.status).toBe('PLACED');

      // Delete earlier placed order to create an order count vs max orderNumber gap,
      // then verify next order still gets a unique higher orderNumber without P2002 collision.
      await prisma.order.delete({ where: { id: placedOrder.id } });

      const nextOrderAfterGap = await placeTableOrder({
        restaurantId: testRestaurant.id,
        tableId: targetTable.id,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            modifierOptionIds: requiredModifierOptionIds,
          },
        ],
      });

      expect(nextOrderAfterGap.id).toBeDefined();
      expect(parseInt(nextOrderAfterGap.orderNumber, 10)).toBeGreaterThan(
        parseInt(staleUuidOrder.orderNumber, 10)
      );

      // Clean up temporary test orders created inside this test
      await prisma.order.delete({ where: { id: nextOrderAfterGap.id } });
      await prisma.order.delete({ where: { id: staleUuidOrder.id } });
    });
  });

  // 7. Waiter Service Calls & Theme Typography Variables
  describe('Waiter Service Calls & Theme Typography Generation', () => {
    it('creates an active service call for a table and lets staff resolve it', async () => {
      const table = await prisma.restaurantTable.findFirst({
        where: { restaurantId: testRestaurant.id },
      });
      expect(table).toBeDefined();

      const call = await createServiceCall({
        restaurantId: testRestaurant.id,
        tableId: table!.id,
        tableName: table!.name,
        callType: 'WATER',
        notes: 'Extra chilled glasses',
      });

      expect(call.id).toContain('call_');
      expect(call.status).toBe('PENDING');

      const activeCalls = await getActiveServiceCalls(testRestaurant.id);
      const found = activeCalls.find((c) => c.id === call.id);
      expect(found).toBeDefined();
      expect(found?.tableName).toBe(table!.name);
      expect(found?.notes).toBe('Extra chilled glasses');

      // Waiter resolves the call
      const resolved = await resolveServiceCall(call.id, testRestaurant.id, 'Waiter Demo');
      expect(resolved).toBe(true);

      // Should no longer be returned in pending list
      const afterCalls = await getActiveServiceCalls(testRestaurant.id);
      expect(afterCalls.some((c) => c.id === call.id)).toBe(false);
    });

    it('generates valid CSS font variables for both serif and sans-serif heading selections', () => {
      const serifVars: any = generateThemeVariables({
        ...THEME_PRESETS.MIDNIGHT_ESPRESSO,
        headingFont: 'DM Serif Display',
        bodyFont: 'Manrope',
      });
      expect(serifVars['--font-serif']).toContain('DM Serif Display');
      expect(serifVars['--font-serif']).toContain('serif');
      expect(serifVars['--font-sans']).toContain('Manrope');

      const sansVars: any = generateThemeVariables({
        ...THEME_PRESETS.WARM_EDITORIAL,
        headingFont: 'DM Sans',
        bodyFont: 'Outfit',
      });
      expect(sansVars['--font-serif']).toContain('DM Sans');
      expect(sansVars['--font-serif']).toContain('sans-serif');
      expect(sansVars['--font-sans']).toContain('Outfit');
    });

    it('replaces legacy condensed fonts with non-condensed static fonts', () => {
      expect(normalizeThemeFont('Instrument Serif', 'Plus Jakarta Sans')).toBe('Lora');
      expect(normalizeThemeFont('Cormorant Garamond', 'Plus Jakarta Sans')).toBe('Playfair Display');
      expect(normalizeThemeFont('Outfit', 'Inter')).toBe('Outfit');
    });

    it('generates staff KDS typography variables synced to owner theme without overriding KDS colors', () => {
      const staffVars: any = generateStaffTypographyVars({
        headingFont: 'DM Sans',
        bodyFont: 'Outfit',
      });
      expect(staffVars['--font-serif']).toContain('DM Sans');
      expect(staffVars['--font-sans']).toContain('Outfit');
      expect(staffVars['--dishora-bg']).toBeUndefined();

      const fallbackVars: any = generateStaffTypographyVars(null);
      expect(fallbackVars['--font-serif']).toContain('Plus Jakarta Sans');
      expect(fallbackVars['--font-sans']).toContain('Inter');
    });

    it('handles concurrent service call queries and creations without 42P01 errors', async () => {
      const table = await prisma.restaurantTable.findFirst({
        where: { restaurantId: testRestaurant.id },
      });
      expect(table).toBeDefined();

      const [activeBefore, callA, callB] = await Promise.all([
        getActiveServiceCalls(testRestaurant.id),
        createServiceCall({
          restaurantId: testRestaurant.id,
          tableId: table!.id,
          tableName: table!.name,
          callType: 'ASSISTANCE',
          notes: 'Concurrent check A',
        }),
        createServiceCall({
          restaurantId: testRestaurant.id,
          tableId: table!.id,
          tableName: table!.name,
          callType: 'BILL',
          notes: 'Concurrent check B',
        }),
      ]);

      expect(Array.isArray(activeBefore)).toBe(true);
      expect(callA.id).toContain('call_');
      expect(callB.id).toContain('call_');

      await Promise.all([
        resolveServiceCall(callA.id, testRestaurant.id, 'Concurrent Tester'),
        resolveServiceCall(callB.id, testRestaurant.id, 'Concurrent Tester'),
      ]);
    });
  });

  // 8. Guest Wi-Fi Validation & QR String Generation
  describe('Guest Wi-Fi Configuration & QR Payload', () => {
    it('rejects enabling Guest Wi-Fi without an SSID and normalizes open networks', () => {
      const missingSsid = normalizeGuestWifiInput({
        enabled: true,
        ssid: '   ',
        password: 'secret',
        security: 'WPA',
      });
      expect(missingSsid.ok).toBe(false);

      const openNet = normalizeGuestWifiInput({
        enabled: true,
        ssid: '  Cafe_Free_WiFi ',
        password: 'stale-password',
        security: 'nopass',
      });
      expect(openNet.ok).toBe(true);
      if (openNet.ok) {
        expect(openNet.wifi).toEqual({
          enabled: true,
          ssid: 'Cafe_Free_WiFi',
          password: '',
          security: 'nopass',
        });
      }
    });

    it('only exposes Wi-Fi to diners when enabled with a non-empty SSID', () => {
      expect(isWifiVisibleToDiners({ enabled: false, ssid: 'Cafe_Guest' })).toBe(false);
      expect(isWifiVisibleToDiners({ enabled: true, ssid: '   ' })).toBe(false);
      expect(isWifiVisibleToDiners({ enabled: true, ssid: 'Cafe_Guest' })).toBe(true);
    });

    it('builds escaped Wi-Fi QR strings preserving WEP/WPA/nopass security types', () => {
      expect(
        buildWifiQrString({
          ssid: 'Soil;To:Soul',
          password: 'pass\\,123;',
          security: 'WEP',
        })
      ).toBe('WIFI:T:WEP;S:Soil\\;To\\:Soul;P:pass\\\\\\,123\\;;;');

      expect(
        buildWifiQrString({
          ssid: 'OpenGuest',
          password: 'ignored',
          security: 'nopass',
        })
      ).toBe('WIFI:T:nopass;S:OpenGuest;P:;;');
    });
  });
});
