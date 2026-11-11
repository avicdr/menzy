import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';

let mockOwnerCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'dishora_owner_session' && mockOwnerCookieValue
        ? { value: mockOwnerCookieValue }
        : undefined,
    set: () => {},
    delete: () => {},
  }),
}));

import { createOwnerToken } from '../src/lib/auth/owner-auth';
import {
  detectRegionFromTimezoneAndLocale,
  detectRegionFromAcceptLanguage,
  countryCodeToBillingRegion,
} from '../src/lib/geo/region-shared';
import {
  resolveVisitorRegion,
  extractClientIpFromHeaders,
  isPublicIp,
  clearIpGeoMemoryCache,
} from '../src/lib/geo/region-server';
import { GET as geoPricingGet } from '../src/app/api/geo/pricing/route';
import { POST as signupPost } from '../src/app/api/auth/signup/route';
import { GET as billingUsageGet } from '../src/app/api/billing/usage/route';
import { POST as createSubscriptionPost } from '../src/app/api/billing/create-subscription/route';

describe('Geolocation-Based Regional Pricing & Enforcement', () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdRestaurantIds: string[] = [];

  beforeAll(() => {
    clearIpGeoMemoryCache();
  });

  afterEach(async () => {
    mockOwnerCookieValue = undefined;
    if (createdRestaurantIds.length > 0) {
      await prisma.restaurant
        .deleteMany({
          where: { id: { in: createdRestaurantIds.splice(0, createdRestaurantIds.length) } },
        })
        .catch(() => {});
    }
    if (createdOrgIds.length > 0) {
      await prisma.organization
        .deleteMany({
          where: { id: { in: createdOrgIds.splice(0, createdOrgIds.length) } },
        })
        .catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user
        .deleteMany({
          where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } },
        })
        .catch(() => {});
    }
  });

  it('resolves timezones & locales accurately (India browsers with en-US UI still resolve IN)', () => {
    expect(detectRegionFromTimezoneAndLocale('Asia/Kolkata', 'en-US')).toBe('IN');
    expect(detectRegionFromTimezoneAndLocale('Asia/Calcutta', 'en-US')).toBe('IN');
    expect(detectRegionFromTimezoneAndLocale('America/New_York', 'en-US')).toBe('US');
    expect(detectRegionFromTimezoneAndLocale('America/Los_Angeles', 'en-US')).toBe('US');
    expect(detectRegionFromTimezoneAndLocale('Pacific/Honolulu', 'en-US')).toBe('US');
    expect(detectRegionFromTimezoneAndLocale('Europe/London', 'en-GB')).toBe('US');
    expect(detectRegionFromTimezoneAndLocale('UTC', 'en-IN')).toBe('IN');
    expect(detectRegionFromTimezoneAndLocale('UTC', 'hi-IN')).toBe('IN');
    expect(detectRegionFromAcceptLanguage('hi-IN,hi;q=0.9,en-US;q=0.8')).toBe('IN');
    expect(countryCodeToBillingRegion('IN')).toBe('IN');
    expect(countryCodeToBillingRegion('US')).toBe('US');
    expect(countryCodeToBillingRegion('GB')).toBe('US');
    expect(countryCodeToBillingRegion('XX')).toBeNull();
  });

  it('resolves CDN/proxy geo headers authoritatively and extracts only public client IPs', async () => {
    const inRes = await resolveVisitorRegion(new Headers({ 'cf-ipcountry': 'IN' }));
    expect(inRes).toEqual({
      region: 'IN',
      countryCode: 'IN',
      source: 'header',
      authoritative: true,
    });

    const usRes = await resolveVisitorRegion(new Headers({ 'x-vercel-ip-country': 'US' }));
    expect(usRes).toEqual({
      region: 'US',
      countryCode: 'US',
      source: 'header',
      authoritative: true,
    });

    const intlRes = await resolveVisitorRegion(new Headers({ 'cloudfront-viewer-country': 'CA' }));
    expect(intlRes).toEqual({
      region: 'US',
      countryCode: 'CA',
      source: 'header',
      authoritative: true,
    });

    expect(isPublicIp('127.0.0.1')).toBe(false);
    expect(isPublicIp('192.168.1.42')).toBe(false);
    expect(isPublicIp('10.24.0.5')).toBe(false);
    expect(isPublicIp('::1')).toBe(false);
    expect(isPublicIp('49.36.120.10')).toBe(true);

    const extracted = extractClientIpFromHeaders(
      new Headers({ 'x-forwarded-for': '10.0.0.1, 49.36.120.10:51234' })
    );
    expect(extracted).toBe('49.36.120.10');

    const ipLookupMock = vi.fn().mockResolvedValue('IN');
    const ipRes = await resolveVisitorRegion(
      new Headers({ 'x-forwarded-for': '10.0.0.1, 49.36.120.10' }),
      { ipLookup: ipLookupMock }
    );
    expect(ipLookupMock).toHaveBeenCalledWith('49.36.120.10');
    expect(ipRes).toEqual({
      region: 'IN',
      countryCode: 'IN',
      source: 'ip',
      authoritative: true,
    });

    const loopbackLookupMock = vi.fn().mockResolvedValue('US');
    const localRes = await resolveVisitorRegion(
      new Headers({ 'x-forwarded-for': '127.0.0.1' }),
      { ipLookup: loopbackLookupMock }
    );
    expect(loopbackLookupMock).not.toHaveBeenCalled();
    expect(localRes.authoritative).toBe(false);
  });

  it('GET /api/geo/pricing returns only one region and ignores spoofed tz when geo headers exist', async () => {
    // Indian visitor attempting to inspect US prices via ?tz=America/New_York
    const inReq = new Request('http://localhost/api/geo/pricing?tz=America/New_York&locale=en-US', {
      headers: { 'cf-ipcountry': 'IN' },
    });
    const inResp = await geoPricingGet(inReq);
    const inData = await inResp.json();
    expect(inResp.status).toBe(200);
    expect(inData.region).toBe('IN');
    expect(inData.authoritative).toBe(true);
    expect(inData.plans.map((p: any) => p.key)).toEqual(['IN_STARTER', 'IN_GROWTH', 'IN_PRO']);
    expect(inData.plans.every((p: any) => p.country === 'IN' && p.currency === 'INR')).toBe(true);

    // US visitor attempting to inspect India prices via ?tz=Asia/Kolkata
    const usReq = new Request('http://localhost/api/geo/pricing?tz=Asia/Kolkata&locale=en-IN', {
      headers: { 'x-vercel-ip-country': 'US' },
    });
    const usResp = await geoPricingGet(usReq);
    const usData = await usResp.json();
    expect(usResp.status).toBe(200);
    expect(usData.region).toBe('US');
    expect(usData.authoritative).toBe(true);
    expect(usData.plans.map((p: any) => p.key)).toEqual(['US_STARTER', 'US_GROWTH', 'US_PRO']);
    expect(usData.plans.every((p: any) => p.country === 'US' && p.currency === 'USD')).toBe(true);

    // Localhost (non-authoritative) falls back to browser timezone cleanly
    const localInReq = new Request('http://localhost/api/geo/pricing?tz=Asia/Calcutta&locale=en-US');
    const localInData = await (await geoPricingGet(localInReq)).json();
    expect(localInData.region).toBe('IN');
    expect(localInData.plans.every((p: any) => p.country === 'IN')).toBe(true);

    const localUsReq = new Request('http://localhost/api/geo/pricing?tz=America/Chicago&locale=en-US');
    const localUsData = await (await geoPricingGet(localUsReq)).json();
    expect(localUsData.region).toBe('US');
    expect(localUsData.plans.every((p: any) => p.country === 'US')).toBe(true);
  });

  it('POST /api/auth/signup enforces authoritative geo country over tampered request body', async () => {
    const suffix = crypto.randomBytes(4).toString('hex');
    const email = `geo.signup.${suffix}@menzy.test`;

    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-ipcountry': 'IN',
      },
      body: JSON.stringify({
        name: 'Geo Locked Owner',
        email,
        password: 'Password123!',
        restaurantName: `Geo Bistro ${suffix}`,
        country: 'US', // Tampered attempt by an India visitor
        currency: 'USD',
      }),
    });

    const res = await signupPost(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    createdUserIds.push(data.user.id);
    createdRestaurantIds.push(data.restaurant.id);

    const createdRest = await prisma.restaurant.findUnique({
      where: { id: data.restaurant.id },
      include: { organization: true },
    });
    expect(createdRest?.country).toBe('IN');
    expect(createdRest?.currency).toBe('INR');
    expect(createdRest?.organization?.billingCountry).toBe('IN');
    expect(createdRest?.organization?.billingCurrency).toBe('INR');
    if (createdRest?.organizationId) {
      createdOrgIds.push(createdRest.organizationId);
    }
  });

  it('blocks cross-region plans in /api/billing/usage and /api/billing/create-subscription', async () => {
    const suffix = crypto.randomBytes(4).toString('hex');

    const inUser = await prisma.user.create({
      data: {
        email: `geo.in.owner.${suffix}@menzy.test`,
        name: 'India Geo Owner',
        emailVerified: new Date(),
      },
    });
    createdUserIds.push(inUser.id);

    const inOrg = await prisma.organization.create({
      data: {
        name: `IN Geo Org ${suffix}`,
        ownerUserId: inUser.id,
        billingCountry: 'IN',
        billingCurrency: 'INR',
        members: { create: { userId: inUser.id, role: 'OWNER' } },
      },
    });
    createdOrgIds.push(inOrg.id);

    const indianRest = await prisma.restaurant.create({
      data: {
        organizationId: inOrg.id,
        slug: `geo-in-rest-${suffix}`,
        displayName: `Geo India Kitchen ${suffix}`,
        country: 'IN',
        currency: 'INR',
      },
    });
    createdRestaurantIds.push(indianRest.id);

    const usUser = await prisma.user.create({
      data: {
        email: `geo.us.owner.${suffix}@menzy.test`,
        name: 'US Geo Owner',
        emailVerified: new Date(),
      },
    });
    createdUserIds.push(usUser.id);

    const usOrg = await prisma.organization.create({
      data: {
        name: `US Geo Org ${suffix}`,
        ownerUserId: usUser.id,
        billingCountry: 'US',
        billingCurrency: 'USD',
        members: { create: { userId: usUser.id, role: 'OWNER' } },
      },
    });
    createdOrgIds.push(usOrg.id);

    const usRest = await prisma.restaurant.create({
      data: {
        organizationId: usOrg.id,
        slug: `geo-us-rest-${suffix}`,
        displayName: `Geo US Kitchen ${suffix}`,
        country: 'US',
        currency: 'USD',
      },
    });
    createdRestaurantIds.push(usRest.id);

    // India owner only receives INR plans and gets 403 trying to subscribe to US plan
    mockOwnerCookieValue = createOwnerToken(inUser.id, inUser.email);

    const inUsageRes = await billingUsageGet(
      new Request(`http://localhost/api/billing/usage?restaurantId=${indianRest.id}`)
    );
    const inUsage = await inUsageRes.json();
    expect(inUsageRes.status).toBe(200);
    expect(inUsage.billingCountry).toBe('IN');
    expect(inUsage.availablePlans.every((p: any) => p.country === 'IN' && p.currency === 'INR')).toBe(true);

    const crossToUsRes = await createSubscriptionPost(
      new Request('http://localhost/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: indianRest.id, planKey: 'US_STARTER' }),
      })
    );
    expect(crossToUsRes.status).toBe(403);

    // US owner only receives USD plans and gets 403 trying to subscribe to India plan
    mockOwnerCookieValue = createOwnerToken(usUser.id, usUser.email);

    const usUsageRes = await billingUsageGet(
      new Request(`http://localhost/api/billing/usage?restaurantId=${usRest.id}`)
    );
    const usUsage = await usUsageRes.json();
    expect(usUsageRes.status).toBe(200);
    expect(usUsage.billingCountry).toBe('US');
    expect(usUsage.availablePlans.every((p: any) => p.country === 'US' && p.currency === 'USD')).toBe(true);

    const crossToInRes = await createSubscriptionPost(
      new Request('http://localhost/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: usRest.id, planKey: 'IN_PRO' }),
      })
    );
    expect(crossToInRes.status).toBe(403);
  });
});

