'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
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
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">
          {eyebrow}
        </span>
        <HeadingTag
          className={
            asH1
              ? 'font-serif text-3xl sm:text-5xl font-bold text-espresso-900 tracking-tight'
              : 'font-serif text-3xl sm:text-4xl font-bold text-espresso-900'
          }
        >
          {heading}
        </HeadingTag>
        <p className="text-xs sm:text-sm text-taupe-600">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8" aria-busy={plans === null}>
        {plans === null
          ? [0, 1, 2].map((slot) => (
              <div
                key={slot}
                className="p-6 sm:p-8 bg-white rounded-3xl border border-cream-200 flex flex-col justify-between shadow-soft min-h-[340px] animate-pulse"
              >
                <div className="space-y-4">
                  <div className="h-6 w-32 bg-cream-200 rounded-lg" />
                  <div className="h-9 w-28 bg-cream-200 rounded-lg" />
                  <div className="space-y-3 pt-2">
                    <div className="h-4 w-44 bg-cream-100 rounded" />
                    <div className="h-4 w-48 bg-cream-100 rounded" />
                    <div className="h-4 w-40 bg-cream-100 rounded" />
                    <div className="h-4 w-52 bg-cream-100 rounded" />
                  </div>
                </div>
                <div className="h-11 w-full bg-cream-100 rounded-full mt-8" />
              </div>
            ))
          : plans.map((p) => {
              const CardHeadingTag = asH1 ? 'h2' : 'h3';
              return (
                <div
                  key={p.key}
                  className={`p-6 sm:p-8 bg-white rounded-3xl border flex flex-col justify-between shadow-soft ${
                    p.tier === 'GROWTH'
                      ? 'border-terracotta ring-2 ring-terracotta/20 relative'
                      : 'border-cream-200'
                  }`}
                >
                  {p.tier === 'GROWTH' && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-terracotta-700 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <CardHeadingTag className="font-serif text-xl font-bold text-espresso-900 mb-1">
                      {p.name}
                    </CardHeadingTag>
                    <div className="text-3xl font-bold text-espresso-900 mb-4">
                      {p.monthlyPriceFormatted}
                    </div>

                    <ul className="space-y-3 text-xs sm:text-sm text-taupe-600 mb-8">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" aria-hidden="true" />
                        <span>Up to {p.itemLimit > 1000 ? 'Unlimited' : p.itemLimit} menu dishes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" aria-hidden="true" />
                        <span>{p.imageCreditsMonthly} custom 3D image credits/mo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" aria-hidden="true" />
                        <span>{p.aiQuestionsMonthly.toLocaleString()} AI diner queries/mo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" aria-hidden="true" />
                        <span>Theme Studio & QR Studio Table Tents</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href={`/signup?plan=${p.tier.toLowerCase()}`}
                    className={`w-full py-3 rounded-full text-center font-semibold text-xs sm:text-sm transition-all ${
                      p.tier === 'GROWTH'
                        ? 'bg-espresso-900 text-white hover:bg-espresso-800 shadow-md'
                        : 'bg-cream-100 text-espresso-900 hover:bg-cream-200'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
      </div>
    </section>
  );
}

