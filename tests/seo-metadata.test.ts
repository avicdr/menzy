import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  GLOBAL_OG_IMAGE,
  SITE_URL,
  STATIC_INDEXABLE_ROUTES,
  buildCanonicalUrl,
  generateSEOMetadata,
  normalizeCanonicalPath,
  normalizeSiteUrl,
} from '@/lib/seo';
import { buildSoftwareApplicationSchema } from '@/lib/seo-schema';
import { getPlansForCountry } from '@/lib/payments/plans';
import robots from '@/app/robots';
import manifest from '@/app/manifest';

const { findUniqueMock, findManyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    restaurant: {
      findUnique: findUniqueMock,
      findMany: findManyMock,
    },
  },
}));

describe('Menzy SEO Metadata & Universal Brand Assets', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    findManyMock.mockReset();
  });

  it('normalizes domain strings safely into HTTPS absolute URLs', () => {
    expect(normalizeSiteUrl('menzy.arenova.in')).toBe('https://menzy.arenova.in');
    expect(normalizeSiteUrl('https://menzy.arenova.in/')).toBe('https://menzy.arenova.in');
    expect(normalizeSiteUrl('localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeCanonicalPath('/pricing/')).toBe('/pricing');
    expect(normalizeCanonicalPath('/m/chai?t=tq_abc#menu')).toBe('/m/chai');
  });

  it('provides valid 1200x630 PNG /public/og-image.png and brand icons', () => {
    const ogPath = path.join(process.cwd(), 'public', 'og-image.png');
    expect(fs.existsSync(ogPath)).toBe(true);

    const buf = fs.readFileSync(ogPath);
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);

    for (const file of [
      'favicon.ico',
      'icon.png',
      'icon-192.png',
      'icon-512.png',
      'apple-touch-icon.png',
      'logo.png',
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', file))).toBe(true);
    }
  });

  it('always binds GLOBAL_OG_IMAGE on both OpenGraph and Twitter cards', () => {
    const publicMeta = generateSEOMetadata({
      title: 'Features — Menzy',
      description: 'Interactive menu features.',
      path: '/features/',
      index: true,
    });
    expect(publicMeta.alternates?.canonical).toBe(`${SITE_URL}/features`);
    expect(publicMeta.openGraph?.images).toEqual([
      expect.objectContaining({
        url: GLOBAL_OG_IMAGE,
        width: 1200,
        height: 630,
        type: 'image/png',
      }),
    ]);
    expect(publicMeta.twitter?.images).toEqual([GLOBAL_OG_IMAGE]);

    const privateMeta = generateSEOMetadata({
      title: 'Dashboard',
      path: '/dashboard',
      index: false,
      omitCanonical: true,
    });
    expect((privateMeta.robots as { index?: boolean })?.index).toBe(false);
    expect(privateMeta.alternates).toBeUndefined();
    expect(privateMeta.twitter?.images).toEqual([GLOBAL_OG_IMAGE]);
    expect(privateMeta.openGraph?.images).toEqual([
      expect.objectContaining({ url: GLOBAL_OG_IMAGE }),
    ]);
  });

  it('keeps SoftwareApplication JSON-LD offers strictly geo-isolated between IN and US', () => {
    const indiaJson = JSON.stringify(
      buildSoftwareApplicationSchema({
        urlPath: '/pricing',
        pricingPlans: getPlansForCountry('IN'),
      })
    );
    expect(indiaJson).toContain('"priceCurrency":"INR"');
    expect(indiaJson).not.toContain('"priceCurrency":"USD"');

    const usJson = JSON.stringify(
      buildSoftwareApplicationSchema({
        urlPath: '/pricing',
        pricingPlans: getPlansForCountry('US'),
      })
    );
    expect(usJson).toContain('"priceCurrency":"USD"');
    expect(usJson).not.toContain('"priceCurrency":"INR"');
  });

  it('generates clean indexable metadata for PUBLISHED menus while preserving universal OG banner', async () => {
    const { generateMetadata } = await import('@/app/m/[slug]/layout');

    findUniqueMock.mockResolvedValueOnce({
      slug: 'chai-and-chutney',
      displayName: 'Chai & Chutney',
      city: 'Bengaluru',
      country: 'IN',
      description: 'Progressive Indian small plates and artisanal chais.',
      publicationState: 'PUBLISHED',
    });

    const pubMeta = await generateMetadata({
      params: Promise.resolve({ slug: 'chai-and-chutney' }),
    });
    expect(pubMeta.title).toContain('Chai & Chutney');
    expect(pubMeta.alternates?.canonical).toBe(`${SITE_URL}/m/chai-and-chutney`);
    expect((pubMeta.robots as { index?: boolean })?.index).toBe(true);
    expect(pubMeta.twitter?.images).toEqual([GLOBAL_OG_IMAGE]);

    findUniqueMock.mockResolvedValueOnce({
      slug: 'secret-draft',
      displayName: 'Unreleased Kitchen',
      city: 'Mumbai',
      country: 'IN',
      description: 'Secret internal draft menu.',
      publicationState: 'DRAFT',
    });

    const draftMeta = await generateMetadata({
      params: Promise.resolve({ slug: 'secret-draft' }),
    });
    expect(draftMeta.title).toBe('Interactive Restaurant Menu — Menzy');
    expect(draftMeta.description).not.toContain('Secret internal draft');
    expect((draftMeta.robots as { index?: boolean })?.index).toBe(false);
    expect(draftMeta.alternates).toBeUndefined();
    expect(draftMeta.twitter?.images).toEqual([GLOBAL_OG_IMAGE]);
  });

  it('emits valid sitemap and robots blocking internal/auth routes while keeping public menus', async () => {
    findManyMock.mockResolvedValueOnce([
      { slug: 'chai-and-chutney', updatedAt: new Date('2026-11-01T00:00:00Z') },
    ]);
    const { default: sitemap } = await import('@/app/sitemap');
    const urls = (await sitemap()).map((u) => u.url);

    for (const r of STATIC_INDEXABLE_ROUTES) {
      expect(urls).toContain(buildCanonicalUrl(r.path));
    }
    expect(urls).toContain(`${SITE_URL}/m/chai-and-chutney`);
    expect(urls.some((u) => u.includes('/dashboard') || u.includes('/admin') || u.includes('/login'))).toBe(false);

    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    const appManifest = manifest();
    expect(appManifest.name).toContain('Menzy');
  });

  it('validates and accepts genuine contact inquiries while enforcing bad payload errors', async () => {
    const { POST } = await import('@/app/api/contact/route');

    const badReq = new Request('https://menzy.arenova.in/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({
        name: 'A',
        email: 'not-an-email',
        restaurantName: 'B',
        message: 'hi',
      }),
    });
    const badRes = await POST(badReq);
    expect(badRes.status).toBe(400);

    const goodReq = new Request('https://menzy.arenova.in/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.11',
      },
      body: JSON.stringify({
        name: 'Rohan Mehta',
        email: 'rohan@bistroexample.in',
        restaurantName: 'Bistro Saffron',
        city: 'Pune',
        inquiryType: 'DEMO',
        message: 'Looking for table QR ordering across 18 tables.',
      }),
    });
    const goodRes = await POST(goodReq);
    expect(goodRes.status).toBe(200);
    const goodJson = await goodRes.json();
    expect(goodJson.success).toBe(true);
    expect(goodJson.message).toContain('Bistro Saffron');

    // Enforce rate limit (5 requests / 15 min window per IP)
    let rateLimitedStatus = 200;
    for (let i = 0; i < 6; i++) {
      const r = await POST(
        new Request('https://menzy.arenova.in/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '203.0.113.99',
          },
          body: JSON.stringify({
            name: 'Anita Rao',
            email: 'anita@cafeexample.in',
            restaurantName: 'Cafe Filter',
            inquiryType: 'DEMO',
            message: 'Interested in digital menu and QR codes for 12 tables.',
          }),
        })
      );
      rateLimitedStatus = r.status;
    }
    expect(rateLimitedStatus).toBe(429);
  });
});
