'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ScanText, QrCode, UtensilsCrossed, Coffee, Zap, Mail, ExternalLink } from 'lucide-react';
import type { PlanDefinition } from '@/lib/payments/plans';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';
import { HOMEPAGE_FAQS } from '@/content/seo-pages';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { PricingCardsClient } from './PricingCardsClient';
import { MenuPreviewClip } from './MenuPreviewClip';

interface LandingPageClientProps {
  authoritativeGeo: boolean;
  initialPlans: PlanDefinition[] | null;
}

export function LandingPageClient({ authoritativeGeo, initialPlans }: LandingPageClientProps) {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 selection:bg-terracotta-200 overflow-x-clip flex flex-col">
      <MarketingHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800 shadow-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
            <span>AI Digital Menus, 3D Dish Visuals &amp; Table QR Ordering</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-espresso-900 tracking-tight leading-[1.12]">
            Your menu deserves <br className="hidden sm:inline" />
            <span className="italic font-normal text-terracotta-600">more than a QR code.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-taupe-600 leading-relaxed font-sans px-2">
            Turn your static restaurant menu into a beautiful, interactive visual experience.
            Let diners explore dishes in 3D clay style, order straight from signed table QR codes, and ask a grounded AI waiter anything.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-espresso-900 text-white font-semibold text-sm sm:text-base hover:bg-espresso-800 active:scale-95 transition-all shadow-lifted flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href="/m/the-peddler-s-cafe-demo-18f4"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white border border-cream-300 text-espresso-900 font-semibold text-sm sm:text-base hover:bg-cream-100 transition-all shadow-soft flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Explore Live Menu Demo</span>
              <ExternalLink className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-taupe-600 pt-1">
            <span>Includes 14-day free &quot;Trial&quot; plan • No payment method required</span>
            <span className="hidden sm:inline text-taupe-400">•</span>
            <a
              href={SUPPORT_EMAIL_HREF}
              className="inline-flex items-center gap-1.5 font-semibold text-espresso-900 hover:text-terracotta transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
              <span>Setup queries: {SUPPORT_EMAIL_DISPLAY}</span>
            </a>
          </div>

          {/* Interactive Diner Preview Clip */}
          <div id="preview" className="scroll-mt-24 pt-12 sm:pt-16 max-w-5xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-[11px] sm:text-xs font-semibold text-terracotta-700">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Interactive Diner Menu &amp; AI Waiter Preview</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-espresso-900">
              See your QR menu in action in 13 seconds
            </h2>
            <p className="text-xs sm:text-sm text-taupe-600 max-w-xl mx-auto">
              Watch how diners browse 3D-styled dishes, customize orders, ask your AI host for pairings, and order directly to the kitchen.
            </p>
          </div>

          <MenuPreviewClip />
        </section>

        {/* 3-Step Hospitality Workflow */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-cream-300">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-cream-200/80 border border-cream-300/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta-700">
              Simple Hospitality Workflow
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
              From physical paper to intelligent visual dining in minutes.
            </h2>
          </div>

          <div className="menzy-card-grid">
            <article className="menzy-card group">
              <header className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cream-100 border border-cream-300/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-espresso-700 menzy-tabular">
                    Step 01
                  </span>
                  <span
                    className="w-11 h-11 rounded-2xl bg-espresso-900/5 border border-espresso-900/10 text-espresso-800 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <ScanText className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
                  Upload &amp; Gemini Vision OCR
                </h3>
              </header>

              <p className="text-sm text-taupe-600 leading-relaxed menzy-copy-pretty">
                Upload smartphone photos or PDF menus. Gemini extracts item titles, prices, descriptions, variants, and dietary tags accurately.
              </p>

              <footer className="pt-4 border-t border-cream-200/90">
                <Link
                  href="/ai-digital-menu"
                  className="menzy-card-link inline-flex items-center justify-between w-full text-sm font-semibold text-terracotta-700 hover:text-espresso-900 transition-colors"
                >
                  <span>Learn about AI Menu OCR</span>
                  <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                </Link>
              </footer>
            </article>

            <article className="menzy-card group">
              <header className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-terracotta-50 border border-terracotta-200/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-terracotta-700 menzy-tabular">
                    Step 02
                  </span>
                  <span
                    className="w-11 h-11 rounded-2xl bg-terracotta-50 border border-terracotta-200/80 text-terracotta-700 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <Sparkles className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
                  3D-Clay Food Illustrations
                </h3>
              </header>

              <p className="text-sm text-taupe-600 leading-relaxed menzy-copy-pretty">
                Dishes match against our shared canonical culinary library to reuse approved assets or generate custom 3D-styled editorial illustrations.
              </p>

              <footer className="pt-4 border-t border-cream-200/90">
                <Link
                  href="/features"
                  className="menzy-card-link inline-flex items-center justify-between w-full text-sm font-semibold text-terracotta-700 hover:text-espresso-900 transition-colors"
                >
                  <span>Explore Theme &amp; Illustration Studio</span>
                  <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                </Link>
              </footer>
            </article>

            <article className="menzy-card group">
              <header className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sage-50 border border-sage-200/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-sage-600 menzy-tabular">
                    Step 03
                  </span>
                  <span
                    className="w-11 h-11 rounded-2xl bg-sage-50 border border-sage-200/80 text-sage-600 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <QrCode className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
                  Table QR Ordering &amp; Live KDS
                </h3>
              </header>

              <p className="text-sm text-taupe-600 leading-relaxed menzy-copy-pretty">
                Print signed 4×6&quot; table tents with optional guest Wi-Fi QRs. Diners order directly to your kitchen terminal without downloading any app.
              </p>

              <footer className="pt-4 border-t border-cream-200/90">
                <Link
                  href="/table-ordering"
                  className="menzy-card-link inline-flex items-center justify-between w-full text-sm font-semibold text-terracotta-700 hover:text-espresso-900 transition-colors"
                >
                  <span>See how Table Ordering works</span>
                  <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                </Link>
              </footer>
            </article>
          </div>
        </section>

        {/* Geo-Locked Pricing */}
        <div className="border-t border-cream-300">
          <PricingCardsClient
            authoritativeGeo={authoritativeGeo}
            initialPlans={initialPlans}
            sectionId="pricing"
          />
        </div>

        {/* Built for every hospitality format */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-t border-cream-300 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-cream-200/80 border border-cream-300/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta-700">
              Hospitality Solutions
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
              Tailored workflows for dining rooms, cafés &amp; counters
            </h2>
          </div>

          <div className="menzy-card-grid">
            <article className="menzy-card group">
              <header className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cream-100 border border-cream-300/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-espresso-700">
                    Dining Rooms
                  </span>
                  <span
                    className="w-10 h-10 rounded-2xl bg-espresso-900/5 border border-espresso-900/10 text-espresso-800 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <UtensilsCrossed className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
                  Full-Service Restaurants
                </h3>
              </header>

              <p className="text-sm text-taupe-600 leading-relaxed menzy-copy-pretty">
                FSSAI Veg/Egg/Non-Veg badges, beverage pairings, waiter calls, and section-scoped table tents.
              </p>

              <footer className="pt-4 border-t border-cream-200/90">
                <Link
                  href="/digital-menu-for-restaurants"
                  className="menzy-card-link inline-flex items-center justify-between w-full text-sm font-semibold text-terracotta-700 hover:text-espresso-900 transition-colors"
                >
                  <span>Explore restaurant workflow</span>
                  <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                </Link>
              </footer>
            </article>

            <article className="menzy-card group">
              <header className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-terracotta-50 border border-terracotta-200/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-terracotta-700">
                    Cafés &amp; Bakeries
                  </span>
                  <span
                    className="w-10 h-10 rounded-2xl bg-terracotta-50 border border-terracotta-200/80 text-terracotta-700 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <Coffee className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
                  Cafés &amp; Patisseries
                </h3>
              </header>

              <p className="text-sm text-taupe-600 leading-relaxed menzy-copy-pretty">
                Botanical &amp; pastel presets, milk/roast add-on variants, daily stock toggles, and Guest Wi-Fi QR cards.
              </p>

              <footer className="pt-4 border-t border-cream-200/90">
                <Link
                  href="/digital-menu-for-cafes"
                  className="menzy-card-link inline-flex items-center justify-between w-full text-sm font-semibold text-terracotta-700 hover:text-espresso-900 transition-colors"
                >
                  <span>Explore café setup</span>
                  <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                </Link>
              </footer>
            </article>

            <article className="menzy-card group">
              <header className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sage-50 border border-sage-200/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-600">
                    Counters &amp; QSRs
                  </span>
                  <span
                    className="w-10 h-10 rounded-2xl bg-sage-50 border border-sage-200/80 text-sage-600 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <Zap className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 tracking-tight menzy-heading-balance">
                  Food Courts &amp; QSRs
                </h3>
              </header>

              <p className="text-sm text-taupe-600 leading-relaxed menzy-copy-pretty">
                Fast counter QR scanning, combo customization, real-time KDS queues, and zero per-order commission.
              </p>

              <footer className="pt-4 border-t border-cream-200/90">
                <Link
                  href="/digital-menu-for-cloud-kitchens"
                  className="menzy-card-link inline-flex items-center justify-between w-full text-sm font-semibold text-terracotta-700 hover:text-espresso-900 transition-colors"
                >
                  <span>Explore QSR &amp; KDS tools</span>
                  <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                </Link>
              </footer>
            </article>
          </div>
        </section>

        {/* Visible AEO FAQ Section matching FAQPage Schema */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-cream-300 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">
              Answers for Operators
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {HOMEPAGE_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white rounded-2xl border border-cream-200 p-5 shadow-xs"
              >
                <summary className="cursor-pointer font-semibold text-sm sm:text-base text-espresso-900 list-none flex items-center justify-between gap-3">
                  <span>{faq.question}</span>
                  <span className="text-terracotta-700 text-lg font-normal shrink-0 group-open:rotate-45 transition-transform">
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
