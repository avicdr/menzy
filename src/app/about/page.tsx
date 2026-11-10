import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Sparkles, UtensilsCrossed } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildOrganizationSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Menzy — Smarter Restaurant Technology',
  description:
    'Learn how Menzy helps restaurants, cafés, and kitchens replace static PDFs with AI-powered visual menus, table QR ordering, and calm kitchen operations.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={[
          buildOrganizationSchema(),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe-600">
              <Link href="/" className="hover:text-espresso-900 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
              <span className="font-semibold text-espresso-900">About Menzy</span>
            </nav>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900 leading-[1.14]">
              Software designed to make every restaurant menu easier to see, ask about, and crave
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-taupe-700 leading-relaxed">
              Menzy was built to bridge the gap between printed paper hospitality menus and what modern dining guests actually need on their phones: appetizing food visuals, instant dietary clarity, reliable table-specific ordering, and grounded assistance that never slows down service.
            </p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
              <Sparkles className="w-6 h-6 text-terracotta" aria-hidden="true" />
              <h2 className="font-serif text-lg font-bold text-espresso-900">Visual Craft</h2>
              <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                Replace cold spreadsheet menus with warm editorial typography, accessible themes, and cohesive 3D-clay food illustrations.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
              <ShieldCheck className="w-6 h-6 text-sage-700" aria-hidden="true" />
              <h2 className="font-serif text-lg font-bold text-espresso-900">Catalog-Grounded AI</h2>
              <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                Our AI Waiter answers guest dietary, spice, pairing, and budget prompts strictly using verified dishes curated by your kitchen.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
              <UtensilsCrossed className="w-6 h-6 text-espresso-900" aria-hidden="true" />
              <h2 className="font-serif text-lg font-bold text-espresso-900">Floor-First Reliability</h2>
              <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                Cryptographic per-table QR tokens, 30-minute idle scan expiry, and a dark-mode KDS terminal built for busy Friday nights.
              </p>
            </div>
          </section>

          <section className="p-8 bg-white rounded-3xl border border-cream-300 shadow-soft space-y-4">
            <h2 className="font-serif text-2xl font-bold text-espresso-900">
              Serving hospitality operators in India &amp; worldwide
            </h2>
            <p className="text-xs sm:text-sm text-taupe-700 leading-relaxed">
              From Indiranagar craft kitchens and boutique bakeries with FSSAI Veg/Egg/Non-Veg requirements to North American neighborhood bistros, Menzy adapts currencies, tax rules, dietary standards, and table workflows cleanly per restaurant.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/features"
                className="px-5 py-2.5 rounded-full bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors"
              >
                Explore All Features
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-full bg-cream-100 border border-cream-300 text-espresso-900 text-xs sm:text-sm font-semibold hover:bg-cream-200 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

