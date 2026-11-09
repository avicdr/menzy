'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Palette,
  QrCode,
  Bot,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PLAN_CATALOG } from '@/lib/payments/plans';

export default function MarketingLandingPage() {
  const [pricingCountry, setPricingCountry] = useState<'IN' | 'US'>('IN');

  const plans = Object.values(PLAN_CATALOG).filter((p) => p.country === pricingCountry);

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 selection:bg-terracotta-200">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-xl font-bold shadow-sm">
            D
          </div>
          <span className="font-serif text-2xl font-bold text-espresso-900 tracking-tight">Dishora</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-taupe-700">
          <Link href="#how-it-works" className="hover:text-espresso-900 transition-colors">How It Works</Link>
          <Link href="#showcase" className="hover:text-espresso-900 transition-colors">3D Visual Studio</Link>
          <Link href="#pricing" className="hover:text-espresso-900 transition-colors">Pricing</Link>
          <Link href="/m/chai-and-chutney" className="hover:text-espresso-900 transition-colors">Live Menu Demo</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-espresso-800 hover:text-espresso-950 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 active:scale-95 transition-all shadow-sm"
          >
            Create Your Menu
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800 shadow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-terracotta" />
          <span>Next-Generation Visual Menus for Hospitality</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-espresso-900 tracking-tight leading-[1.08]">
          Your menu deserves <br className="hidden sm:inline" />
          <span className="italic font-normal text-terracotta">more than a QR code.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-taupe-600 leading-relaxed font-sans">
          Turn your static restaurant menu into a beautiful, interactive visual experience.
          Let diners explore dishes in 3D clay style, check kitchen-verified nutrition, and ask our AI waiter anything.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-espresso-900 text-white font-semibold text-sm sm:text-base hover:bg-espresso-800 active:scale-95 transition-all shadow-lifted flex items-center justify-center gap-2.5"
          >
            <span>Create Your Menu Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/m/chai-and-chutney"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-cream-300 text-espresso-900 font-semibold text-sm sm:text-base hover:bg-cream-100 transition-all shadow-soft"
          >
            Explore Live Diner Menu &rarr;
          </Link>
        </div>

        {/* Live Product Showcase Mockup */}
        <div className="pt-12 max-w-4xl mx-auto">
          <div className="p-4 sm:p-6 bg-white rounded-3xl border border-cream-300 shadow-lifted">
            <div className="relative rounded-2xl overflow-hidden border border-cream-200 bg-cream-50 aspect-video sm:aspect-[16/9]">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80"
                alt="Interactive Restaurant Menu"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/80 via-espresso-950/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-left text-white">
                <span className="px-3 py-1 rounded-full bg-terracotta text-white text-xs font-bold uppercase tracking-wider inline-block w-max mb-2">
                  Diner Experience
                </span>
                <h3 className="font-serif text-2xl sm:text-4xl font-bold">
                  "What drink pairs with the Truffle Pasta?"
                </h3>
                <p className="text-xs sm:text-sm text-cream-200 mt-1 max-w-lg">
                  Instant grounded recommendations from your real beverage menu, nutrition breakdowns, and allergen clarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-cream-300">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">Simple Hospitality Workflow</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
            From physical paper to intelligent visual dining in minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-espresso-900 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">Upload & Gemini Vision OCR</h3>
            <p className="text-sm text-taupe-600 leading-relaxed">
              Upload smartphone photos or PDF menus. Gemini extracts item titles, prices, descriptions, variants, and dietary tags accurately.
            </p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-terracotta flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">3D-Clay Food Illustrations</h3>
            <p className="text-sm text-taupe-600 leading-relaxed">
              Dishes match against our shared canonical culinary library to reuse approved assets or generate custom 3D-styled editorial illustrations.
            </p>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 text-sage-700 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">Publish & Download Table QRs</h3>
            <p className="text-sm text-taupe-600 leading-relaxed">
              Personalize your restaurant's theme colors and print high-resolution 4x6" table tents. Diners scan and browse without downloading any app.
            </p>
          </div>
        </div>
      </section>

      {/* Regional Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-cream-300">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">Transparent Monthly Plans</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
            Predictable hospitality pricing
          </h2>
          <p className="text-sm text-taupe-600">Choose your billing region</p>

          <div className="inline-flex p-1 bg-cream-200 rounded-full border border-cream-300">
            <button
              onClick={() => setPricingCountry('IN')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pricingCountry === 'IN' ? 'bg-white text-espresso-900 shadow-sm' : 'text-taupe-600'
              }`}
            >
              🇮🇳 India (INR ₹)
            </button>
            <button
              onClick={() => setPricingCountry('US')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pricingCountry === 'US' ? 'bg-white text-espresso-900 shadow-sm' : 'text-taupe-600'
              }`}
            >
              🇺🇸 United States (USD $)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.key}
              className={`p-8 bg-white rounded-3xl border flex flex-col justify-between shadow-soft ${
                p.tier === 'GROWTH' ? 'border-terracotta ring-2 ring-terracotta/20 relative' : 'border-cream-200'
              }`}
            >
              {p.tier === 'GROWTH' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-terracotta text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
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
      <footer className="border-t border-cream-300 bg-cream-50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-taupe-500">
          <div className="flex items-center gap-2 font-serif text-base font-bold text-espresso-900">
            <span>Dishora</span>
            <span className="text-xs font-sans font-normal text-taupe-500">
              — See it. Ask it. Crave it.
            </span>
          </div>

          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-espresso-900">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-espresso-900">Privacy Notice</Link>
            <Link href="/admin/login" className="hover:text-espresso-900">Founder Login</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Dishora Hospitality AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
