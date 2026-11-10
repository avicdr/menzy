import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Live Interactive Restaurant Menu Demos — Menzy',
  description:
    'Explore working Menzy restaurant menus with 3D dish visuals, dietary filters, grounded AI waiter Q&A, guest Wi-Fi QR cards, and table ordering.',
  path: '/demo',
  keywords: [
    'interactive digital menu demo',
    'restaurant qr menu example',
    'ai waiter live demo',
  ],
});

export default function DemoPage() {
  const demos = [
    {
      title: 'Chai & Chutney Craft Kitchen',
      slug: 'chai-and-chutney',
      location: 'Bengaluru, India',
      currency: 'INR (₹)',
      theme: 'Warm Editorial',
      description: 'Progressive Indian small plates, claypot biryanis, and artisanal house-brewed chais in Indiranagar.',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'The Gilded Fork Café & Bistro',
      slug: 'the-gilded-fork',
      location: 'San Francisco, USA',
      currency: 'USD ($)',
      theme: 'Botanical Café',
      description: 'Artisanal espresso, fresh-baked morning pastries, and Northern California seasonal comfort plates in Presidio Heights.',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Bakehouse 72 Artisan Bakery',
      slug: 'bakehouse-72-demo',
      location: 'Mumbai, India (Founder Demo)',
      currency: 'INR (₹)',
      theme: 'Pastel Patisserie',
      description: 'Claimable founder demo restaurant showcasing twice-baked almond croissants and single-origin pour-overs.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Live Menus', path: '/demo' },
        ])}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800">
              <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
              <span>Working Venue Demos</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900">
              Interactive Live Menus
            </h1>
            <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
              Tap any demo venue below to inspect 3D dish visuals, grounded AI pairing answers, and custom hospitality themes directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demos.map((d) => (
              <article
                key={d.slug}
                className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-soft flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full bg-cream-100">
                  <img
                    src={d.imageUrl}
                    alt={`${d.title} dining interior`}
                    width={600}
                    height={338}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-espresso-800 shadow-sm">
                      {d.currency}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-espresso-900">{d.title}</h2>
                    <p className="text-xs text-taupe-500 mt-0.5">{d.location} • {d.theme}</p>
                    <p className="text-xs text-taupe-600 line-clamp-2 mt-2 leading-relaxed">{d.description}</p>
                  </div>

                  <Link
                    href={`/m/${d.slug}`}
                    className="w-full py-2.5 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Open Diner Menu</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-espresso-900">
                Want a pre-built demo menu for your own restaurant?
              </h2>
              <p className="text-xs sm:text-sm text-taupe-600">
                Create your workspace in minutes or request a tailored demo menu curated from your website or PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-full bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 transition-colors"
              >
                Create Menu Free
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-full bg-cream-100 border border-cream-300 text-espresso-900 text-xs font-semibold hover:bg-cream-200 transition-colors"
              >
                Request Custom Demo
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
