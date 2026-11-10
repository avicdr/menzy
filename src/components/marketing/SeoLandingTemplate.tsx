import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import type { SeoLandingConfig } from '@/content/seo-pages';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildSoftwareApplicationSchema,
} from '@/lib/seo-schema';

interface SeoLandingTemplateProps {
  config: SeoLandingConfig;
}

export function SeoLandingTemplate({ config }: SeoLandingTemplateProps) {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: config.breadcrumbName, path: config.path },
  ];

  const schemas = [
    buildSoftwareApplicationSchema({
      urlPath: config.path,
      description: config.seoDescription,
    }),
    buildBreadcrumbSchema(breadcrumbs),
    ...(config.faqs.length > 0 ? [buildFaqSchema(config.faqs)] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col overflow-x-clip">
      <JsonLd data={schemas} />
      <MarketingHeader />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-14 space-y-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe-600">
            <Link href="/" className="hover:text-espresso-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
            <span className="font-semibold text-espresso-900">{config.breadcrumbName}</span>
          </nav>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
              <span>{config.eyebrow}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900 tracking-tight leading-[1.14]">
              {config.h1}
            </h1>

            <p className="max-w-3xl text-sm sm:text-base md:text-lg text-taupe-700 leading-relaxed">
              {config.intro}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              href={config.primaryCtaHref}
              className="px-6 py-3.5 rounded-full bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 transition-all shadow-lifted flex items-center justify-center gap-2"
            >
              <span>{config.primaryCtaLabel}</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href={config.secondaryCtaHref}
              className="px-6 py-3.5 rounded-full bg-white border border-cream-300 text-espresso-900 font-semibold text-sm hover:bg-cream-100 transition-all shadow-soft flex items-center justify-center gap-2"
            >
              <span>{config.secondaryCtaLabel}</span>
              <ExternalLink className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-cream-300">
          <div className="max-w-2xl space-y-2 mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              {config.capabilitiesHeading}
            </h2>
            <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
              {config.capabilitiesSubheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.capabilities.map((cap) => (
              <div
                key={cap.title}
                className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-2.5"
              >
                <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso-900">
                  {cap.title}
                </h3>
                <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Steps & Checklist */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-cream-300 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              {config.workflowHeading}
            </h2>
            <ol className="space-y-4">
              {config.workflowSteps.map((st) => (
                <li
                  key={st.step}
                  className="p-5 bg-white rounded-2xl border border-cream-200 shadow-xs flex items-start gap-4"
                >
                  <span className="w-10 h-10 rounded-xl bg-cream-100 border border-cream-300 text-terracotta-700 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                    {st.step}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-espresso-900">
                      {st.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                      {st.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-cream-200 p-6 sm:p-8 shadow-soft space-y-5 self-start">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">
              {config.checklistHeading}
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-taupe-700">
              {config.checklistItems.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-terracotta-700 hover:underline"
              >
                <span>Compare plans &amp; monthly allowances</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Visible FAQ Section */}
        {config.faqs.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 border-t border-cream-300 space-y-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {config.faqs.map((faq) => (
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
        )}

        {/* Related Solutions */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-cream-300 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-espresso-900">
            Explore related Menzy tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {config.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="p-5 bg-white rounded-2xl border border-cream-200 hover:border-terracotta transition-colors shadow-xs space-y-1.5 group"
              >
                <div className="font-serif text-base font-bold text-espresso-900 group-hover:text-terracotta transition-colors">
                  {link.title}
                </div>
                <p className="text-xs text-taupe-600 leading-relaxed">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="p-8 sm:p-12 rounded-3xl bg-espresso-900 text-cream-50 text-center space-y-4 shadow-lifted">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold">
              Ready to upgrade your dining room?
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-cream-200 leading-relaxed">
              Upload your menu, customize your restaurant theme, and publish signed table QR codes in minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-full bg-terracotta-700 text-white font-semibold text-xs sm:text-sm hover:bg-terracotta-600 transition-colors shadow"
              >
                Create Your Menu Free
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-xs sm:text-sm hover:bg-white/20 transition-colors"
              >
                Talk to Our Team
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

