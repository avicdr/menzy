import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getPlansForCountry, type PlanDefinition } from '@/lib/payments/plans';
import { resolveVisitorRegion } from '@/lib/geo/region-server';
import { LandingPageClient } from '@/components/marketing/LandingPageClient';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildFaqSchema,
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  buildWebSiteSchema,
} from '@/lib/seo-schema';
import { HOMEPAGE_FAQS } from '@/content/seo-pages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Menzy — AI Digital Menu & QR Ordering Software',
  description:
    'Turn paper or PDF restaurant menus into interactive visual QR menus with 3D dish visuals, table-specific QR ordering, a grounded AI waiter, and live kitchen order management.',
  path: '/',
  keywords: [
    'AI digital menu',
    'QR code menu generator',
    'restaurant table ordering system',
    'AI waiter for restaurants',
    'digital restaurant menu software',
    'Menzy',
  ],
});

export default async function MarketingLandingPage() {
  const hdrs = await headers();
  const geo = await resolveVisitorRegion(hdrs);
  const initialPlans: PlanDefinition[] | null = geo.authoritative
    ? getPlansForCountry(geo.region)
    : null;

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationSchema(),
          buildWebSiteSchema(),
          buildSoftwareApplicationSchema({
            urlPath: '/',
            pricingPlans: initialPlans || undefined,
          }),
          buildFaqSchema(HOMEPAGE_FAQS),
        ]}
      />
      <LandingPageClient
        authoritativeGeo={geo.authoritative}
        initialPlans={initialPlans}
      />
    </>
  );
}
