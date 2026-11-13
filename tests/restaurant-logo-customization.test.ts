import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { PublicationState, Role } from '@prisma/client';
import {
  validateBannerUrlInput,
  resolveLandingHeroMedia,
} from '../src/lib/banner/banner-validation';

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
  GET as restaurantSettingsGet,
  PATCH as restaurantSettingsPatch,
} from '../src/app/api/restaurant/settings/route';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';

describe('Restaurant Logo Customization & Diner Menu Visibility', () => {
  let testUser: any;
  let testOrg: any;
  let testRestaurant: any;

  beforeAll(async () => {
    const unique = `logo_test_${Date.now()}`;
    testUser = await prisma.user.create({
      data: {
        email: `${unique}@example.com`,
        role: Role.OWNER,
        passwordHash: 'mock-hash',
      },
    });

    testOrg = await prisma.organization.create({
      data: {
        name: `Org ${unique}`,
        ownerUserId: testUser.id,
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: testUser.id,
        organizationId: testOrg.id,
        role: Role.OWNER,
      },
    });

    await provisionTrialSubscriptionWithinTx(prisma, {
      organizationId: testOrg.id,
      currency: 'INR',
    });

    testRestaurant = await prisma.restaurant.create({
      data: {
        slug: `logo-cafe-${Date.now()}`,
        displayName: 'Logo Cafe',
        description: 'Test cafe for logo customization',
        country: 'IN',
        city: 'Bengaluru',
        currency: 'INR',
        organizationId: testOrg.id,
        publicationState: PublicationState.PUBLISHED,
        logoUrl: '/images/test-logo.png',
        orderingSettings: {
          create: {
            notificationSettings: {
              showLogo: true,
            },
          },
        },
      },
    });

    mockOwnerCookieValue = createOwnerToken(testUser.id, testUser.email);
  });

  afterAll(async () => {
    if (testRestaurant) {
      await prisma.restaurant.deleteMany({ where: { id: testRestaurant.id } });
    }
    if (testOrg) {
      await prisma.organization.deleteMany({ where: { id: testOrg.id } });
    }
    if (testUser) {
      await prisma.user.deleteMany({ where: { id: testUser.id } });
    }
  });

  describe('Validation & Media Resolution', () => {
    it('accepts local /images/ paths, uploaded paths, and http(s) URLs while rejecting unsafe paths', () => {
      expect(validateBannerUrlInput('/images/acai-theory-logo.png')).toEqual({
        ok: true,
        value: '/images/acai-theory-logo.png',
      });
      expect(validateBannerUrlInput('/uploads/logos/brand-123.png')).toEqual({
        ok: true,
        value: '/uploads/logos/brand-123.png',
      });
      expect(validateBannerUrlInput('https://cdn.example.com/logo.webp')).toEqual({
        ok: true,
        value: 'https://cdn.example.com/logo.webp',
      });
      expect(validateBannerUrlInput('')).toEqual({
        ok: true,
        value: null,
      });
      expect(validateBannerUrlInput(null)).toEqual({
        ok: true,
        value: null,
      });

      // Path traversal rejected
      expect(validateBannerUrlInput('/images/../../../etc/passwd')).toMatchObject({
        ok: false,
      });
      // Non-http URLs rejected
      expect(validateBannerUrlInput('ftp://evil.com/logo.png')).toMatchObject({
        ok: false,
      });
    });

    it('resolves hero logo only when showLogo is true or unset, and returns null when disabled', () => {
      const visible = resolveLandingHeroMedia({
        logoUrl: '/images/test.png',
        showLogo: true,
      });
      expect(visible.logoUrl).toBe('/images/test.png');

      const defaultVisible = resolveLandingHeroMedia({
        logoUrl: '/images/test.png',
      });
      expect(defaultVisible.logoUrl).toBe('/images/test.png');

      const disabled = resolveLandingHeroMedia({
        logoUrl: '/images/test.png',
        showLogo: false,
      });
      expect(disabled.logoUrl).toBeNull();

      const errored = resolveLandingHeroMedia({
        logoUrl: '/images/test.png',
        logoError: true,
        showLogo: true,
      });
      expect(errored.logoUrl).toBeNull();
    });
  });

  describe('Settings API (GET & PATCH) & Diner Menu Sync', () => {
    it('serves current logoUrl and showLogo in GET /api/restaurant/settings', async () => {
      const getRes = await restaurantSettingsGet(
        new Request(`http://localhost:3000/api/restaurant/settings?restaurantId=${testRestaurant.id}`)
      );
      expect(getRes.status).toBe(200);
      const body = await getRes.json();
      expect(body.restaurant.logoUrl).toBe('/images/test-logo.png');
      expect(body.showLogo).toBe(true);
    });

    it('allows owner to disable logo view on the menu via PATCH /api/restaurant/settings', async () => {
      const patchRes = await restaurantSettingsPatch(
        new Request('http://localhost:3000/api/restaurant/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: testRestaurant.id,
            showLogo: false,
          }),
        })
      );
      expect(patchRes.status).toBe(200);
      const patchBody = await patchRes.json();
      expect(patchBody.showLogo).toBe(false);

      // Verify GET returns showLogo: false
      const getRes = await restaurantSettingsGet(
        new Request(`http://localhost:3000/api/restaurant/settings?restaurantId=${testRestaurant.id}`)
      );
      const getBody = await getRes.json();
      expect(getBody.showLogo).toBe(false);

      // Verify Diner menu payload reflects showLogo: false
      const dinerPayload = await loadDinerMenuPayload(testRestaurant.slug);
      expect(dinerPayload.status).toBe('OK');
      if (dinerPayload.status === 'OK') {
        expect(dinerPayload.data.restaurant.showLogo).toBe(false);
        expect(dinerPayload.data.showLogo).toBe(false);
      }
    });

    it('allows owner to customize logoUrl and re-enable logo view on the menu', async () => {
      const patchRes = await restaurantSettingsPatch(
        new Request('http://localhost:3000/api/restaurant/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: testRestaurant.id,
            logoUrl: 'https://cdn.example.com/fresh-insignia.png',
            showLogo: true,
          }),
        })
      );
      expect(patchRes.status).toBe(200);
      const patchBody = await patchRes.json();
      expect(patchBody.restaurant.logoUrl).toBe('https://cdn.example.com/fresh-insignia.png');
      expect(patchBody.showLogo).toBe(true);

      // Verify Diner menu payload reflects the updated logo and visibility
      const dinerPayload = await loadDinerMenuPayload(testRestaurant.slug);
      expect(dinerPayload.status).toBe('OK');
      if (dinerPayload.status === 'OK') {
        expect(dinerPayload.data.restaurant.logoUrl).toBe('https://cdn.example.com/fresh-insignia.png');
        expect(dinerPayload.data.restaurant.showLogo).toBe(true);
        expect(dinerPayload.data.showLogo).toBe(true);
      }
    });

    it('allows owner to remove custom logoUrl cleanly', async () => {
      const patchRes = await restaurantSettingsPatch(
        new Request('http://localhost:3000/api/restaurant/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: testRestaurant.id,
            logoUrl: null,
          }),
        })
      );
      expect(patchRes.status).toBe(200);
      const patchBody = await patchRes.json();
      expect(patchBody.restaurant.logoUrl).toBeNull();
    });
  });
});
