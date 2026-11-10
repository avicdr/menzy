'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import type { PlanDefinition } from '@/lib/payments/plans';
import { trackConversionEvent } from '@/lib/analytics/events';

interface PricingCardsClientProps {
  authoritativeGeo: boolean;
  initialPlans: PlanDefinition[] | null;
  sectionId?: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  asH1?: boolean;
}

const TIER_SUBTITLES: Record<PlanDefinition['tier'], string> = {
  STARTER: 'Core AI menu extraction & QR ordering for single venues',
  GROWTH: 'Custom theme colors, dish pairings & advanced analytics',
  PRO: 'Unlimited dishes, multiple menus & high monthly allowances',
};

export function PricingCardsClient({
  authoritativeGeo,
  initialPlans,
  sectionId = 'pricing',
  eyebrow = 'Transparent Monthly Plans',
  heading = 'Predictable hospitality pricing',
  subheading = 'Simple monthly plans built for modern restaurant teams.',
  asH1 = false,
}: PricingCardsClientProps) {
  const [plans, setPlans] = useState<PlanDefinition[] | null>(initialPlans);

  useEffect(() => {
    if (authoritativeGeo && initialPlans && initialPlans.length > 0) {
      return;
    }

    const controller = new AbortController();
    let tz = '';
    let locale = '';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      locale = navigator.language || '';
    } catch {
      // Ignore client environment restrictions
    }

    fetch(
      `/api/geo/pricing?tz=${encodeURIComponent(tz)}&locale=${encodeURIComponent(locale)}`,
      {
        cache: 'no-store',
        signal: controller.signal,
      }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plans && Array.isArray(data.plans)) {
          setPlans(data.plans);
        }
      })
      .catch(() => {
        // Ignore abort/transient errors
      });

    return () => controller.abort();
  }, [authoritativeGeo, initialPlans]);

  useEffect(() => {
    const el = document.getElementById(sectionId);
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let tracked = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!tracked && entries.some((entry) => entry.isIntersecting)) {
          tracked = true;
          trackConversionEvent('pricing_viewed');
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId]);

  const HeadingTag = asH1 ? 'h1' : 'h2';

  return (
    <section
      id={sectionId}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20"
    >
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-cream-200/80 border border-cream-300/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta-700">
          {eyebrow}
        </span>
        <HeadingTag
          className={
            asH1
              ? 'font-serif text-3xl sm:text-5xl font-bold text-espresso-900 tracking-tight menzy-heading-balance'
              : 'font-serif text-3xl sm:text-4xl font-bold text-espresso-900 tracking-tight menzy-heading-balance'
          }
        >
          {heading}
        </HeadingTag>
        <p className="text-sm text-taupe-600 mx-auto menzy-copy-pretty">{subheading}</p>
      </div>

      <div className="menzy-card-grid" aria-busy={plans === null}>
        {plans === null
          ? [0, 1, 2].map((slot) => {
              const isSkeletonFeatured = slot === 1;
              return (
                <div
                  key={slot}
                  aria-hidden="true"
                  className={`menzy-card animate-pulse ${isSkeletonFeatured ? 'menzy-card--featured' : ''}`}
                >
                  <div
                    className={`space-y-4 pb-5 border-b ${
                      isSkeletonFeatured ? 'border-white/10' : 'border-cream-200'
                    }`}
                  >
                    <div
                      className={`h-6 w-32 rounded-lg ${
                        isSkeletonFeatured ? 'bg-white/15' : 'bg-cream-200'
                      }`}
                    />
                    <div
                      className={`h-4 w-48 rounded ${
                        isSkeletonFeatured ? 'bg-white/10' : 'bg-cream-100'
                      }`}
                    />
                    <div
                      className={`h-10 w-28 rounded-lg ${
                        isSkeletonFeatured ? 'bg-white/15' : 'bg-cream-200'
                      }`}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className={`h-4 w-44 rounded ${isSkeletonFeatured ? 'bg-white/10' : 'bg-cream-100'}`} />
                    <div className={`h-4 w-48 rounded ${isSkeletonFeatured ? 'bg-white/10' : 'bg-cream-100'}`} />
                    <div className={`h-4 w-40 rounded ${isSkeletonFeatured ? 'bg-white/10' : 'bg-cream-100'}`} />
                    <div className={`h-4 w-52 rounded ${isSkeletonFeatured ? 'bg-white/10' : 'bg-cream-100'}`} />
                  </div>

                  <div className="pt-2">
                    <div
                      className={`h-11 w-full rounded-full ${
                        isSkeletonFeatured ? 'bg-white/15' : 'bg-cream-100'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          : plans.map((p) => {
              const CardHeadingTag = asH1 ? 'h2' : 'h3';
              const isFeatured = p.tier === 'GROWTH';
              const slashIndex = p.monthlyPriceFormatted.indexOf('/');
              const priceAmount =
                slashIndex >= 0
                  ? p.monthlyPriceFormatted.slice(0, slashIndex)
                  : p.monthlyPriceFormatted;
              const pricePeriod =
                slashIndex >= 0 ? p.monthlyPriceFormatted.slice(slashIndex) : '';

              return (
                <article
                  key={p.key}
                  className={`menzy-card ${isFeatured ? 'menzy-card--featured' : ''}`}
                >
                  <header
                    className={`flex flex-col justify-between gap-4 pb-5 border-b ${
                      isFeatured ? 'border-white/15' : 'border-cream-200/90'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardHeadingTag
                          className={`font-serif text-xl font-bold tracking-tight menzy-heading-balance ${
                            isFeatured ? 'text-[#FAF7F2]' : 'text-espresso-900'
                          }`}
                        >
                          {p.name}
                        </CardHeadingTag>
                        {isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terracotta-500/20 border border-terracotta-300/35 text-[11px] font-semibold text-[#F5DFD6] shrink-0">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            <span>Most Popular</span>
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs leading-relaxed menzy-copy-pretty ${
                          isFeatured ? 'text-[#D9CBB9]' : 'text-taupe-600'
                        }`}
                      >
                        {TIER_SUBTITLES[p.tier]}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-1">
                      <span
                        className={`text-4xl font-bold tracking-tight menzy-tabular ${
                          isFeatured ? 'text-[#FAF7F2]' : 'text-espresso-900'
                        }`}
                      >
                        {priceAmount}
                      </span>
                      {pricePeriod && (
                        <span
                          className={`text-sm font-medium ${
                            isFeatured ? 'text-[#DFD2C2]' : 'text-taupe-600'
                          }`}
                        >
                          {pricePeriod}
                        </span>
                      )}
                    </div>
                  </header>

                  <ul className="space-y-3 text-sm menzy-copy-pretty">
                    <li className="flex items-start gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isFeatured
                            ? 'bg-terracotta-500/20 border-terracotta-300/35 text-[#F5DFD6]'
                            : 'bg-sage-50 border-sage-200/80 text-sage-600'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <span className={isFeatured ? 'text-[#EFE8DE]' : 'text-espresso-700'}>
                        Up to {p.itemLimit > 1000 ? 'Unlimited' : p.itemLimit} menu dishes
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isFeatured
                            ? 'bg-terracotta-500/20 border-terracotta-300/35 text-[#F5DFD6]'
                            : 'bg-sage-50 border-sage-200/80 text-sage-600'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <span className={isFeatured ? 'text-[#EFE8DE]' : 'text-espresso-700'}>
                        {p.imageCreditsMonthly} custom 3D image credits/mo
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isFeatured
                            ? 'bg-terracotta-500/20 border-terracotta-300/35 text-[#F5DFD6]'
                            : 'bg-sage-50 border-sage-200/80 text-sage-600'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <span className={isFeatured ? 'text-[#EFE8DE]' : 'text-espresso-700'}>
                        {p.aiQuestionsMonthly.toLocaleString()} AI diner queries/mo
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isFeatured
                            ? 'bg-terracotta-500/20 border-terracotta-300/35 text-[#F5DFD6]'
                            : 'bg-sage-50 border-sage-200/80 text-sage-600'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <span className={isFeatured ? 'text-[#EFE8DE]' : 'text-espresso-700'}>
                        Theme Studio &amp; QR Studio Table Tents
                      </span>
                    </li>
                  </ul>

                  <footer className="pt-2">
                    <Link
                      href={`/signup?plan=${p.tier.toLowerCase()}`}
                      className={`menzy-cta inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-full font-semibold text-sm ${
                        isFeatured
                          ? 'bg-[#FAF7F2] text-espresso-900 hover:bg-white shadow-lifted'
                          : 'bg-cream-100 text-espresso-900 hover:bg-cream-200 border border-cream-300'
                      }`}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4 shrink-0 menzy-card-arrow" aria-hidden="true" />
                    </Link>
                  </footer>
                </article>
              );
            })}
      </div>
    </section>
  );
}
