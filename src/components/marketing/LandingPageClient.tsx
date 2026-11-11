'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Bot,
  ExternalLink,
  ShieldCheck,
  ScanText,
  QrCode,
  UtensilsCrossed,
  Coffee,
  Zap,
  Phone,
} from 'lucide-react';
import type { PlanDefinition } from '@/lib/payments/plans';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF } from '@/lib/support/contact';
import { HOMEPAGE_FAQS } from '@/content/seo-pages';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { PricingCardsClient } from './PricingCardsClient';

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
              href="/m/chai-and-chutney"
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
              href={SUPPORT_PHONE_HREF}
              className="inline-flex items-center gap-1.5 font-semibold text-espresso-900 hover:text-terracotta transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
              <span>Setup queries: {SUPPORT_PHONE_DISPLAY}</span>
            </a>
          </div>

          {/* Interactive Diner Preview */}
          <div id="preview" className="pt-12 sm:pt-16 max-w-4xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-[11px] sm:text-xs font-semibold text-terracotta-700">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Interactive Diner Menu &amp; AI Waiter Preview</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-espresso-900">
              What your guests see when scanning your table QR
            </h2>
            <p className="text-xs sm:text-sm text-taupe-600 max-w-lg mx-auto">
              A visual-first interactive menu paired with instant, grounded dish recommendations and dietary clarity.
            </p>
          </div>

          <div className="pt-6 max-w-4xl mx-auto text-left">
            <div className="p-4 sm:p-7 bg-white rounded-3xl border border-cream-300 shadow-lifted space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-terracotta text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm"
                    aria-hidden="true"
                  >
                    C
                  </div>
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso-900">
                      Chai &amp; Chutney Craft Kitchen
                    </h3>
                    <p className="text-[11px] text-taupe-500">
                      Indiranagar, Bengaluru • Table 4
                    </p>
                  </div>
                </div>

                <Link
                  href="/m/chai-and-chutney"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-xs font-semibold text-espresso-800 transition-colors"
                >
                  <span>Open Full Menu</span>
                  <ExternalLink className="w-3.5 h-3.5 text-terracotta" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-3.5 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=300&q=80"
                      alt="Smoked Malai Paneer Tikka prepared on charcoal"
                      width={80}
                      height={80}
                      loading="lazy"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-cream-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-espresso-900 truncate">
                          Smoked Malai Paneer Tikka
                        </h4>
                        <span className="font-bold text-sm text-espresso-900 shrink-0">₹380</span>
                      </div>
                      <p className="text-xs text-taupe-500 line-clamp-1 mt-0.5">
                        Silken organic cottage cheese charred over charcoal with bell peppers.
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sage-100 text-sage-800">
                          Vegetarian
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900">
                          Gluten Free
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-3.5 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=300&q=80"
                      alt="Steaming Adrak Elaichi Kulhad Chai"
                      width={80}
                      height={80}
                      loading="lazy"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-cream-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-espresso-900 truncate">
                          Adrak Elaichi Kulhad Chai
                        </h4>
                        <span className="font-bold text-sm text-espresso-900 shrink-0">₹120</span>
                      </div>
                      <p className="text-xs text-taupe-500 line-clamp-1 mt-0.5">
                        Slow-simmered Assam orthodox blend with crushed ginger and green cardamom.
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-terracotta-100 text-terracotta-800">
                          Chef Pick
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 p-4 bg-espresso-900 text-white rounded-2xl border border-espresso-800 space-y-3 shadow-md">
                  <div className="flex items-center gap-2 pb-2 border-b border-espresso-800">
                    <div className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold text-cream-100">AI Host &amp; Sommelier</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-espresso-800 p-2.5 rounded-xl rounded-br-sm text-cream-200 ml-4 text-right">
                      &ldquo;What drink pairs with the Paneer Tikka?&rdquo;
                    </div>
                    <div className="bg-cream-100 text-espresso-900 p-2.5 rounded-xl rounded-bl-sm mr-2 leading-relaxed">
                      We recommend our <strong>Adrak Elaichi Kulhad Chai</strong> or <strong>Kokum Jeera Sparkler</strong>. Both cleanse the palate and highlight the smoky charcoal tandoor marinade!
                    </div>
                  </div>

                  <div className="pt-2 border-t border-espresso-800 flex items-center justify-between text-[11px] text-cream-300">
                    <span className="flex items-center gap-1 text-sage-400">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Allergen Safety Grounded
                    </span>
                    <Link
                      href="/m/chai-and-chutney"
                      className="text-terracotta-200 font-semibold hover:underline"
                    >
                      Try it live &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
