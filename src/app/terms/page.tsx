import type { Metadata } from 'next';
import Link from 'next/link';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Terms of Service — Menzy',
  description:
    'Menzy Hospitality SaaS Terms of Service covering restaurant operator responsibilities, recurring billing terms, and AI-generated dish visuals.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Terms of Service', path: '/terms' },
        ])}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-cream-300 shadow-soft space-y-6">
          <Link href="/" className="text-xs font-semibold text-terracotta-700 hover:underline">
            &larr; Back to Menzy
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">Terms of Service</h1>
          <p className="text-xs text-taupe-500">Effective Date: November 2026</p>

          <div className="prose text-xs sm:text-sm text-taupe-700 space-y-4 leading-relaxed">
            <p>
              Welcome to Menzy (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing or using our interactive digital menu platform, APIs, or services, you agree to be bound by these Terms of Service.
            </p>

            <h2 className="font-serif text-lg font-bold text-espresso-900">1. SaaS Platform &amp; Restaurant Responsibilities</h2>
            <p>
              Restaurant operators are solely responsible for verifying the accuracy of prices, ingredients, allergen statements, and nutritional representations. Menzy provides automated OCR extraction and AI culinary recommendations as tools, and does not warrant the clinical allergen-free safety of food prepared by individual establishments.
            </p>

            <h2 className="font-serif text-lg font-bold text-espresso-900">2. Subscriptions &amp; Billing</h2>
            <p>
              Menzy subscriptions are billed on a recurring monthly cycle via Razorpay in the customer&apos;s regional billing currency. Cancellations take effect at the conclusion of the paid billing period. Image credits and AI question allowances reset once per paid billing period.
            </p>

            <h2 className="font-serif text-lg font-bold text-espresso-900">3. AI-Generated Visual Illustrations</h2>
            <p>
              Illustrations generated via our 3D clay studio represent conceptual artistic depictions of dishes and should be understood as stylized culinary previews rather than contractual representations of plating.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
