import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { headers } from 'next/headers';
import { getPlansForCountry, type PlanDefinition } from '@/lib/payments/plans';
import { resolveVisitorRegion } from '@/lib/geo/region-server';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildFaqSchema, buildSoftwareApplicationSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { PricingCardsClient } from '@/components/marketing/PricingCardsClient';
import { SUPPORT_EMAIL_DISPLAY } from '@/lib/support/contact';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Digital Menu Software Pricing — Menzy',
  description: 'Transparent monthly restaurant SaaS pricing for Starter, Growth, and Pro plans. Zero per-order commissions, regional currency billing, and predictable AI allowances.',
  path: '/pricing',
  keywords: ['digital menu software pricing', 'qr menu software pricing', 'restaurant table ordering pricing', 'Menzy plans'],
});

const PRICING_FAQS = [
  { question: 'How does the 14-day free Trial plan work?', answer: 'Every new venue signup or claimed demo starts automatically on our 14-day free Trial plan with zero card or payment method required. Once the 14 days end, ordering and dashboard features pause until you buy a Starter, Growth, or Pro subscription inside the Billing panel.' },
  { question: 'Does Menzy charge per-order commission fees?', answer: 'No. Menzy operates strictly on predictable flat monthly plans billed via Razorpay. You keep 100% of every table order placed through your digital menu.' },
  { question: 'Who can I contact for setup or onboarding queries?', answer: `For setup assistance, demo menu migration, or billing help, email our setup support team at ${SUPPORT_EMAIL_DISPLAY}.` },
  { question: 'Are canonical 3D dish illustrations counted against monthly image credits?', answer: 'No. Reusing verified food artwork from the shared canonical library is included across all plans. Monthly custom 3D credits are only used when generating bespoke new illustrations.' },
  { question: 'Can we upgrade or change plans as our dining room grows?', answer: 'Yes. Upgrade anytime inside your owner console Billing tab to unlock higher dish capacities, custom theme styling, pairing recommendations, and larger AI query allowances.' },
  { question: 'What is included with every plan?', answer: 'Every plan includes Gemini Vision OCR menu extraction, mobile-first table QR menus, per-table QR studio printing tools, dietary labels, and kitchen order terminal access.' },
];

const tierNotes = [
  ['Starter', 'For a focused menu and a single venue: 50 dishes, signed QR tents, curated presets, and essential analytics.'],
  ['Growth', 'For a busy dining room: 100 dishes, custom brand controls, pairing recommendations, and advanced insights.'],
  ['Pro', 'For larger menus and hospitality groups: unlimited dishes, multiple menus, and higher monthly AI allowances.'],
];

export default async function PricingPage() {
  const geo = await resolveVisitorRegion(await headers());
  const initialPlans: PlanDefinition[] | null = geo.authoritative ? getPlansForCountry(geo.region) : null;

  return (
    <div className="marketing-site pricing-page">
      <JsonLd data={[buildSoftwareApplicationSchema({ urlPath: '/pricing', pricingPlans: initialPlans || undefined }), buildBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }]), buildFaqSchema(PRICING_FAQS)]} />
      <MarketingHeader />
      <main id="main-content">
        <section className="pricing-hero" data-enter><div className="marketing-frame pricing-hero-inner"><nav aria-label="Breadcrumb" className="subpage-breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" /><span>Pricing</span></nav><div className="pricing-hero-copy"><p className="eyebrow"><span className="eyebrow-mark" /> Plans for real service teams</p><h1>Start small.<br /><em>Keep the system clear.</em></h1><p>Regional monthly plans in INR and USD, with a 14-day trial and no per-order commission.</p></div></div></section>
        <PricingCardsClient authoritativeGeo={geo.authoritative} initialPlans={initialPlans} sectionId="pricing-catalog" asH1 heading="" subheading="" eyebrow="" />
        <section className="pricing-tier-section"><div className="marketing-frame"><div className="subpage-section-heading"><p className="section-kicker">What changes as you grow</p><div><h2>One operating system, three sensible steps.</h2><p className="section-intro">Pick the allowance that matches the menu and service you run today.</p></div></div><div className="pricing-tier-list">{tierNotes.map(([name, detail], index) => <div key={name}><span>{String(index + 1).padStart(2, '0')}</span><h3>{name}</h3><p>{detail}</p></div>)}</div></div></section>
        <section className="pricing-faq"><div className="marketing-frame faq-grid"><div><p className="section-kicker">Pricing questions</p><h2>Clear answers before you commit.</h2></div><div className="faq-list">{PRICING_FAQS.map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div></div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
