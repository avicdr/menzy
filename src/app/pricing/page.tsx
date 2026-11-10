import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { ChevronRight } from 'lucide-react';
import { getPlansForCountry, type PlanDefinition } from '@/lib/payments/plans';
import { resolveVisitorRegion } from '@/lib/geo/region-server';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildSoftwareApplicationSchema,
} from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { PricingCardsClient } from '@/components/marketing/PricingCardsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Digital Menu Software Pricing — Menzy',
  description:
    'Transparent monthly restaurant SaaS pricing for Starter, Growth, and Pro plans. Zero per-order commissions, regional currency billing, and predictable AI allowances.',
  path: '/pricing',
  keywords: [
    'digital menu software pricing',
    'qr menu software pricing',
    'restaurant table ordering pricing',
    'Menzy plans',
  ],
});

const PRICING_FAQS = [
  {
    question: 'Does Menzy charge per-order commission fees?',
    answer:
      'No. Menzy operates strictly on predictable flat monthly plans billed via Razorpay. You keep 100% of every table order placed through your digital menu.',
  },
  {
    question: 'Are canonical 3D dish illustrations counted against monthly image credits?',
    answer:
      'No. Reusing verified food artwork from the shared canonical library is included across all plans. Monthly custom 3D credits are only used when generating bespoke new illustrations.',
  },
  {
    question: 'Can we upgrade or change plans as our dining room grows?',
    answer:
      'Yes. Upgrade anytime inside your owner console Billing tab to unlock higher dish capacities, custom theme styling, pairing recommendations, and larger AI query allowances.',
  },
  {
    question: 'What is included with every plan?',
    answer:
      'Every plan includes Gemini Vision OCR menu extraction, mobile-first table QR menus, per-table QR studio printing tools, dietary labels, and kitchen order terminal access.',
  },
];

export default async function PricingPage() {
  const hdrs = await headers();
  const geo = await resolveVisitorRegion(hdrs);
  const initialPlans: PlanDefinition[] | null = geo.authoritative
    ? getPlansForCountry(geo.region)
    : null;

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={[
          buildSoftwareApplicationSchema({
            urlPath: '/pricing',
            pricingPlans: initialPlans || undefined,
          }),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Pricing', path: '/pricing' },
          ]),
          buildFaqSchema(PRICING_FAQS),
        ]}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe-600">
            <Link href="/" className="hover:text-espresso-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
            <span className="font-semibold text-espresso-900">Pricing</span>
          </nav>
        </div>

        <PricingCardsClient
          authoritativeGeo={geo.authoritative}
          initialPlans={initialPlans}
          sectionId="pricing-catalog"
          asH1
          heading="Predictable digital menu & QR ordering plans"
          subheading="Flat monthly software pricing with zero per-order commissions — scaled to your dish catalog, 3D artwork volume, and AI diner concierge usage."
        />

        {/* What separates Starter, Growth, and Pro */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-cream-300 space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 text-center">
            Included capabilities by plan tier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm">
            <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-xs space-y-2">
              <h3 className="font-serif text-lg font-bold text-espresso-900">Starter</h3>
              <p className="text-taupe-600 leading-relaxed">
                Designed for cozy cafés and single-page kitchens up to 50 dishes, curated presets, signed table QR tents, and essential dish analytics.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-xs space-y-2">
              <h3 className="font-serif text-lg font-bold text-espresso-900">Growth</h3>
              <p className="text-taupe-600 leading-relaxed">
                Tailored for busy full-service restaurants up to 150 dishes, custom brand palette controls, AI pairing upsells, and advanced funnel insights.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-xs space-y-2">
              <h3 className="font-serif text-lg font-bold text-espresso-900">Pro</h3>
              <p className="text-taupe-600 leading-relaxed">
                Built for large menus, food courts, and hospitality groups requiring unlimited dishes, multiple menus, and 20,000 monthly AI queries.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing FAQ */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 border-t border-cream-300 space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 text-center">
            Pricing Questions
          </h2>
          <div className="space-y-3">
            {PRICING_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white rounded-2xl border border-cream-200 p-5 shadow-xs"
              >
                <summary className="cursor-pointer font-semibold text-sm sm:text-base text-espresso-900 list-none flex items-center justify-between gap-3">
                  <span>{faq.question}</span>
                  <span className="text-terracotta text-lg font-normal shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-taupe-600 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

