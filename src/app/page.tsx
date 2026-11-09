'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Palette,
  QrCode,
  Bot,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import { PLAN_CATALOG } from '@/lib/payments/plans';

export default function MarketingLandingPage() {
  const [pricingCountry, setPricingCountry] = useState<'IN' | 'US'>('IN');

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const lang = navigator.language || '';
      if (
        tz.includes('America') ||
        tz.includes('US/') ||
        tz.includes('Pacific') ||
        tz.includes('New_York') ||
        tz.includes('Chicago') ||
        tz.includes('Denver') ||
        tz.includes('Los_Angeles') ||
        lang === 'en-US'
      ) {
        setPricingCountry('US');
      } else {
        setPricingCountry('IN');
      }
    } catch (e) {}
  }, []);

  const plans = Object.values(PLAN_CATALOG).filter((p) => p.country === pricingCountry);

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 selection:bg-terracotta-200 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-3.5 sm:px-8 py-3.5 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-lg sm:text-xl font-bold shadow-sm">
            D
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 tracking-tight">Dishora</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-taupe-700">
          <Link href="#how-it-works" className="hover:text-espresso-900 transition-colors">How It Works</Link>
          <Link href="#preview" className="hover:text-espresso-900 transition-colors">Diner Preview</Link>
          <Link href="#pricing" className="hover:text-espresso-900 transition-colors">Pricing</Link>
          <Link href="/m/chai-and-chutney" className="hover:text-espresso-900 transition-colors">Live Menu</Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-espresso-800 hover:text-espresso-950 transition-colors whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            Create Menu
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800 shadow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" />
          <span>Next-Generation Visual Menus for Hospitality</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-espresso-900 tracking-tight leading-[1.12]">
          Your menu deserves <br className="hidden sm:inline" />
          <span className="italic font-normal text-terracotta">more than a QR code.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-taupe-600 leading-relaxed font-sans px-2">
          Turn your static restaurant menu into a beautiful, interactive visual experience.
          Let diners explore dishes in 3D clay style, check kitchen-verified nutrition, and ask our AI waiter anything.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-espresso-900 text-white font-semibold text-sm sm:text-base hover:bg-espresso-800 active:scale-95 transition-all shadow-lifted flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Create Your Menu Free</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
          <Link
            href="/m/chai-and-chutney"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white border border-cream-300 text-espresso-900 font-semibold text-sm sm:text-base hover:bg-cream-100 transition-all shadow-soft flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Explore Live Menu Demo</span>
            <ExternalLink className="w-3.5 h-3.5 text-terracotta shrink-0" />
          </Link>
        </div>

        {/* =====================================================================
            SECTION: WHAT DINERS SEE - CLEAR PROMINENT HEADER ABOVE THE IMAGE
        ===================================================================== */}
        <div id="preview" className="pt-12 sm:pt-16 max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-[11px] sm:text-xs font-semibold text-terracotta">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Interactive Diner Menu & AI Waiter Preview</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-espresso-900">
            What your guests see when scanning your table QR
          </h2>
          <p className="text-xs sm:text-sm text-taupe-600 max-w-lg mx-auto">
            A visual-first interactive menu paired with instant, grounded dish recommendations and dietary clarity.
          </p>
        </div>

        {/* Live Interactive Product Showcase Preview */}
        <div className="pt-6 max-w-4xl mx-auto text-left">
          <div className="p-4 sm:p-7 bg-white rounded-3xl border border-cream-300 shadow-lifted space-y-5">
            {/* Mockup Top Brand Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-cream-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
                  C
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso-900">
                    Chai & Chutney Craft Kitchen
                  </h3>
                  <p className="text-[11px] text-taupe-500">
                    Indiranagar, Bengaluru • Table 4
                  </p>
                </div>
              </div>

              <Link
                href="/m/chai-and-chutney"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-xs font-semibold text-espresso-800 transition-colors"
              >
                <span>Open Full Menu</span>
                <ExternalLink className="w-3.5 h-3.5 text-terracotta" />
              </Link>
            </div>

            {/* Menu Mockup Body: Visual Dishes & AI Chat Conversation */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column: Sample Dish Cards */}
              <div className="md:col-span-7 space-y-3">
                {/* Dish 1 */}
                <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-3.5 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=300&q=80"
                    alt="Smoked Malai Paneer Tikka"
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

                {/* Dish 2 */}
                <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-3.5 shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=300&q=80"
                    alt="Adrak Elaichi Kulhad Chai"
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

              {/* Right Column: Grounded AI Sommelier Chat Bubble */}
              <div className="md:col-span-5 p-4 bg-espresso-900 text-white rounded-2xl border border-espresso-800 space-y-3 shadow-md">
                <div className="flex items-center gap-2 pb-2 border-b border-espresso-800">
                  <div className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-cream-100">AI Host & Sommelier</span>
                </div>

                {/* Simulated conversation */}
                <div className="space-y-2 text-xs">
                  <div className="bg-espresso-800 p-2.5 rounded-xl rounded-br-sm text-cream-200 ml-4 text-right">
                    "What drink pairs with the Paneer Tikka?"
                  </div>
                  <div className="bg-cream-100 text-espresso-900 p-2.5 rounded-xl rounded-bl-sm mr-2 leading-relaxed">
                    We recommend our <strong>Adrak Elaichi Kulhad Chai</strong> or <strong>Kokum Jeera Sparkler</strong>. Both cleanse the palate and highlight the smoky charcoal tandoor marinade!
                  </div>
                </div>

                <div className="pt-2 border-t border-espresso-800 flex items-center justify-between text-[11px] text-cream-300">
                  <span className="flex items-center gap-1 text-sage-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Allergen Safety Grounded
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
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">Simple Hospitality Workflow</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
            From physical paper to intelligent visual dining in minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-espresso-900 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">Upload & Gemini Vision OCR</h3>
            <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
              Upload smartphone photos or PDF menus. Gemini extracts item titles, prices, descriptions, variants, and dietary tags accurately.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-terracotta flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">3D-Clay Food Illustrations</h3>
            <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
              Dishes match against our shared canonical culinary library to reuse approved assets or generate custom 3D-styled editorial illustrations.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-sage-700 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">Publish & Download Table QRs</h3>
            <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
              Personalize your restaurant's theme colors and print high-resolution 4x6" table tents. Diners scan and browse without downloading any app.
            </p>
          </div>
        </div>
      </section>

      {/* Regional Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-cream-300">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">Transparent Monthly Plans</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
            Predictable hospitality pricing
          </h2>
          <p className="text-xs sm:text-sm text-taupe-600">Choose your billing region</p>

          <div className="inline-flex p-1 bg-cream-200 rounded-full border border-cream-300">
            <button
              onClick={() => setPricingCountry('IN')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                pricingCountry === 'IN' ? 'bg-white text-espresso-900 shadow-sm' : 'text-taupe-600'
              }`}
            >
              🇮🇳 India (INR ₹)
            </button>
            <button
              onClick={() => setPricingCountry('US')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                pricingCountry === 'US' ? 'bg-white text-espresso-900 shadow-sm' : 'text-taupe-600'
              }`}
            >
              🇺🇸 United States (USD $)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`p-6 sm:p-8 bg-white rounded-3xl border flex flex-col justify-between shadow-soft ${
                p.tier === 'GROWTH' ? 'border-terracotta ring-2 ring-terracotta/20 relative' : 'border-cream-200'
              }`}
            >
              {p.tier === 'GROWTH' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-terracotta text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-serif text-xl font-bold text-espresso-900 mb-1">{p.name}</h3>
                <div className="text-3xl font-bold text-espresso-900 mb-4">{p.monthlyPriceFormatted}</div>

                <ul className="space-y-3 text-xs sm:text-sm text-taupe-600 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                    <span>Up to {p.itemLimit > 1000 ? 'Unlimited' : p.itemLimit} menu dishes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                    <span>{p.imageCreditsMonthly} custom 3D image credits/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                    <span>{p.aiQuestionsMonthly.toLocaleString()} AI diner queries/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                    <span>Theme Studio & QR Studio Table Tents</span>
                  </li>
                </ul>
              </div>

              <Link
                href={`/signup?plan=${p.key}&country=${pricingCountry}`}
                className={`w-full py-3 rounded-full text-center font-semibold text-xs sm:text-sm transition-all ${
                  p.tier === 'GROWTH'
                    ? 'bg-espresso-900 text-white hover:bg-espresso-800 shadow-md'
                    : 'bg-cream-100 text-espresso-900 hover:bg-cream-200'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cream-300 bg-cream-50 py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-taupe-500 text-center sm:text-left">
          <div className="flex items-center gap-2 font-serif text-base font-bold text-espresso-900">
            <span>Dishora</span>
            <span className="text-xs font-sans font-normal text-taupe-500">
              — See it. Ask it. Crave it.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-espresso-900">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-espresso-900">Privacy Notice</Link>
            <Link href="/admin/login" className="hover:text-espresso-900">Founder Login</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Dishora Hospitality AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
