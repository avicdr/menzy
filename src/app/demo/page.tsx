import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Sparkles } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: "The Peddler's Cafe — Live Interactive Restaurant Menu Demo — Menzy",
  description:
    "Explore The Peddler's Cafe live interactive digital menu with 3D dish visuals, dietary filters, grounded AI waiter Q&A, guest Wi-Fi QR cards, and table ordering.",
  path: '/demo',
  keywords: [
    'interactive digital menu demo',
    'restaurant qr menu example',
    'ai waiter live demo',
  ],
});

export default function DemoPage() {
  const demo = {
    title: "The Peddler's Cafe",
    slug: 'the-peddler-s-cafe-demo-18f4',
    location: 'India',
    currency: 'INR (₹)',
    theme: 'Warm Editorial',
    description:
      'Interactive visual café & restaurant menu with 3D-styled dish previews, dietary filters, grounded AI pairing answers, and table ordering.',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Live Demo', path: '/demo' },
        ])}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800">
              <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
              <span>Working Venue Demo</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900">
              Interactive Live Menu
            </h1>
            <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
              Open The Peddler&apos;s Cafe below to explore 3D dish visuals, grounded AI pairing answers, and table QR ordering directly in your browser.
            </p>
          </div>

          <article className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-soft grid grid-cols-1 md:grid-cols-12">
            <div className="relative md:col-span-6 aspect-video md:aspect-auto md:min-h-[280px] bg-cream-100">
              <img
                src={demo.imageUrl}
                alt={`${demo.title} dining interior`}
                width={900}
                height={600}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-espresso-800 shadow-sm">
                  {demo.currency}
                </span>
              </div>
            </div>

            <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-terracotta-50 border border-terracotta-200/80 text-[11px] font-semibold uppercase tracking-wider text-terracotta-700">
                  Featured Demo Venue
                </span>
                <h2 className="font-serif text-2xl font-bold text-espresso-900">{demo.title}</h2>
                <p className="text-xs text-taupe-500">
                  {demo.location} • {demo.theme}
                </p>
                <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed pt-1">
                  {demo.description}
                </p>
              </div>

              <Link
                href={`/m/${demo.slug}`}
                className="w-full py-3 px-5 rounded-xl bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors flex items-center justify-center gap-2 shadow"
              >
                <span>Open Diner Menu</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

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
