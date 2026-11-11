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
import { provisionTrialSubscriptionWithinTx } from '../src/lib/billing/subscription-access';
import {
  DEFAULT_SERVICE_CHARGE_PERCENTAGE,
  DEFAULT_TAX_PERCENTAGE,
  normalizeServiceChargeInput,
  normalizeTaxPercentageInput,
  resolveServiceChargePercentageValue,
  resolveTaxPercentageValue,
} from '../src/lib/orders/tax-config';
import { calculateOrderQuote } from '../src/lib/orders/order-service';
import {
  GET as restaurantSettingsGet,
  PATCH as restaurantSettingsPatch,
} from '../src/app/api/restaurant/settings/route';
import {
  GET as orderingSettingsGet,
  PATCH as orderingSettingsPatch,
} from '../src/app/api/restaurants/[id]/ordering-settings/route';
import { POST as quotePost } from '../src/app/api/diner/orders/quote/route';

describe('Owner-Configurable Restaurant Tax Percentage', () => {
  describe('Pure tax & service charge validation helpers', () => {
    it('preserves explicit 0% instead of falling back to default 5%', () => {
      expect(resolveTaxPercentageValue(0)).toBe(0);
      expect(resolveTaxPercentageValue('0')).toBe(0);
      expect(resolveTaxPercentageValue(12.5)).toBe(12.5);
      expect(resolveTaxPercentageValue(undefined)).toBe(DEFAULT_TAX_PERCENTAGE);
      expect(resolveTaxPercentageValue(null)).toBe(DEFAULT_TAX_PERCENTAGE);

      expect(resolveServiceChargePercentageValue(0)).toBe(0);
      expect(resolveServiceChargePercentageValue(undefined)).toBe(
        DEFAULT_SERVICE_CHARGE_PERCENTAGE
      );
    });

    it('accepts valid tax percentages [0..100] with up to 2 decimals and rejects invalid values', () => {
      expect(normalizeTaxPercentageInput(0)).toEqual({ ok: true, taxPercentage: 0 });
      expect(normalizeTaxPercentageInput('0')).toEqual({ ok: true, taxPercentage: 0 });
      expect(normalizeTaxPercentageInput('18')).toEqual({ ok: true, taxPercentage: 18 });
      expect(normalizeTaxPercentageInput('8.25')).toEqual({ ok: true, taxPercentage: 8.25 });
      expect(normalizeTaxPercentageInput('2.556')).toEqual({ ok: true, taxPercentage: 2.56 });

      expect(normalizeTaxPercentageInput('').ok).toBe(false);
      expect(normalizeTaxPercentageInput(null).ok).toBe(false);
      expect(normalizeTaxPercentageInput(-1).ok).toBe(false);
      expect(normalizeTaxPercentageInput(100.5).ok).toBe(false);
      expect(normalizeTaxPercentageInput('abc').ok).toBe(false);

      expect(normalizeServiceChargeInput(0)).toEqual({
        ok: true,
        serviceChargePercentage: 0,
      });
      expect(normalizeServiceChargeInput(10)).toEqual({
        ok: true,
        serviceChargePercentage: 10,
      });
      expect(normalizeServiceChargeInput(-2).ok).toBe(false);
    });
  });

  describe('Owner API persistence & Diner Cart quote integration', () => {
    let ownerUser: any;
    let org: any;
    let restaurant: any;
    let dish: any;

    beforeAll(async () => {
      const suffix = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      ownerUser = await prisma.user.create({
        data: {
          email: `tax-owner-${suffix}@menzy.test`,
          passwordHash: 'test_hash_not_used',
          name: 'Tax Test Owner',
        },
      });

      org = await prisma.organization.create({
        data: {
          name: `Tax Org ${suffix}`,
          ownerUserId: ownerUser.id,
          billingCountry: 'IN',
          billingCurrency: 'INR',
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

      restaurant = await prisma.restaurant.create({
        data: {
          organizationId: org.id,
          slug: `tax-cafe-${suffix}`,
          displayName: `Tax Cafe ${suffix}`,
          country: 'IN',
          city: 'Pune',
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
              ssid: 'TaxCafeWifi',
              password: '',
              security: 'nopass',
            },
          },
        },
      });

      const menu = await prisma.menu.create({
        data: {
          restaurantId: restaurant.id,
          title: 'Main Menu',
          active: true,
        },
      });

      const category = await prisma.menuCategory.create({
        data: {
          menuId: menu.id,
          name: 'Pasta',
          sortOrder: 1,
        },
      });

      dish = await prisma.restaurantMenuItem.create({
        data: {
          restaurantId: restaurant.id,
          menuId: menu.id,
          categoryId: category.id,
          customName: 'Arrabiata Pasta',
          priceMinor: 55000, // ₹550
          currency: 'INR',
          isPublished: true,
          isAvailable: true,
          sortOrder: 1,
        },
      });

      mockOwnerCookieValue = createOwnerToken(ownerUser.id, ownerUser.email);
    });

    afterAll(async () => {
      mockOwnerCookieValue = undefined;
      if (restaurant?.id) {
        await prisma.restaurant.deleteMany({ where: { id: restaurant.id } }).catch(() => {});
      }
      if (org?.id) {
        await prisma.organization.deleteMany({ where: { id: org.id } }).catch(() => {});
      }
      if (ownerUser?.id) {
        await prisma.user.deleteMany({ where: { id: ownerUser.id } }).catch(() => {});
      }
    });

    it('lets owner update tax percentage via /api/restaurant/settings and /ordering-settings, preserves 0%, and reflects immediately in diner quotes', async () => {
      // 1. Default quote starts at 5% on ₹550 => ₹27.5 (2750 paise) tax, ₹577.5 total
      const initialQuoteRes = await quotePost(
        new Request('http://localhost:3000/api/diner/orders/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            items: [{ menuItemId: dish.id, quantity: 1 }],
          }),
        })
      );
      expect(initialQuoteRes.status).toBe(200);
      const initialQuote = await initialQuoteRes.json();
      expect(initialQuote.taxPercentage).toBe(5);
      expect(initialQuote.taxMinor).toBe(2750);
      expect(initialQuote.totalMinor).toBe(57750);

      // 2. Owner updates taxPercentage to 12.5% from top-level Dashboard Settings API
      const patchSettingsRes = await restaurantSettingsPatch(
        new Request('http://localhost:3000/api/restaurant/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            taxPercentage: 12.5,
            serviceChargePercentage: 5,
          }),
        })
      );
      expect(patchSettingsRes.status).toBe(200);
      const patchSettingsBody = await patchSettingsRes.json();
      expect(patchSettingsBody.taxPercentage).toBe(12.5);
      expect(patchSettingsBody.serviceChargePercentage).toBe(5);

      // 3. GET /api/restaurant/settings & /ordering-settings reflect 12.5% and preserve Wi-Fi
      const [getSettingsRes, getOrdRes] = await Promise.all([
        restaurantSettingsGet(
          new Request(`http://localhost:3000/api/restaurant/settings?restaurantId=${restaurant.id}`)
        ),
        orderingSettingsGet(
          new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`),
          { params: Promise.resolve({ id: restaurant.id }) }
        ),
      ]);
      expect(getSettingsRes.status).toBe(200);
      expect(getOrdRes.status).toBe(200);
      const getSettingsBody = await getSettingsRes.json();
      const getOrdBody = await getOrdRes.json();
      expect(getSettingsBody.taxPercentage).toBe(12.5);
      expect(getSettingsBody.wifi?.ssid).toBe('TaxCafeWifi');
      expect(getOrdBody.settings.taxPercentage).toBe(12.5);

      // 4. Diner quote calculates 12.5% tax + 5% service charge
      const updatedQuoteRes = await quotePost(
        new Request('http://localhost:3000/api/diner/orders/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            items: [{ menuItemId: dish.id, quantity: 1 }],
          }),
        })
      );
      const updatedQuote = await updatedQuoteRes.json();
      expect(updatedQuote.taxPercentage).toBe(12.5);
      expect(updatedQuote.taxMinor).toBe(6875); // 55000 * 12.5% = 6875
      expect(updatedQuote.serviceChargeMinor).toBe(2750);
      expect(updatedQuote.totalMinor).toBe(64625);

      // 5. Setting taxPercentage = 0 persists cleanly across both endpoints and zero-taxes quotes (never resets to 5%)
      const zeroOrdRes = await orderingSettingsPatch(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taxPercentage: 0,
            serviceChargePercentage: 0,
          }),
        }),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      expect(zeroOrdRes.status).toBe(200);
      const zeroOrdBody = await zeroOrdRes.json();
      expect(zeroOrdBody.settings.taxPercentage).toBe(0);

      const getAfterZero = await restaurantSettingsGet(
        new Request(`http://localhost:3000/api/restaurant/settings?restaurantId=${restaurant.id}`)
      );
      const afterZeroBody = await getAfterZero.json();
      expect(afterZeroBody.taxPercentage).toBe(0);

      const zeroQuote = await calculateOrderQuote(restaurant.id, [
        { menuItemId: dish.id, quantity: 1 },
      ]);
      expect(zeroQuote.taxPercentage).toBe(0);
      expect(zeroQuote.taxMinor).toBe(0);
      expect(zeroQuote.totalMinor).toBe(55000);

      // Also verify 0% preserved on disabled-ordering quote branch
      await prisma.restaurantOrderingSettings.update({
        where: { restaurantId: restaurant.id },
        data: { acceptsNewOrders: false },
      });
      const disabledQuote = await calculateOrderQuote(restaurant.id, [
        { menuItemId: dish.id, quantity: 1 },
      ]);
      expect(disabledQuote.valid).toBe(false);
      expect(disabledQuote.taxPercentage).toBe(0);

      await prisma.restaurantOrderingSettings.update({
        where: { restaurantId: restaurant.id },
        data: { acceptsNewOrders: true },
      });

      // 6. Reject out-of-range tax values with 400
      const invalidSettingsRes = await restaurantSettingsPatch(
        new Request('http://localhost:3000/api/restaurant/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant.id,
            taxPercentage: 150,
          }),
        })
      );
      expect(invalidSettingsRes.status).toBe(400);

      const invalidOrdRes = await orderingSettingsPatch(
        new Request(`http://localhost:3000/api/restaurants/${restaurant.id}/ordering-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taxPercentage: -5,
          }),
        }),
        { params: Promise.resolve({ id: restaurant.id }) }
      );
      expect(invalidOrdRes.status).toBe(400);
    });
  });
});
