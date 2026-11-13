import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { SeoLandingConfig } from '@/content/seo-pages';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildFaqSchema, buildSoftwareApplicationSchema } from '@/lib/seo-schema';

interface SeoLandingTemplateProps { config: SeoLandingConfig; }

export function SeoLandingTemplate({ config }: SeoLandingTemplateProps) {
  const schemas = [
    buildSoftwareApplicationSchema({ urlPath: config.path, description: config.seoDescription }),
    buildBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: config.breadcrumbName, path: config.path }]),
    ...(config.faqs.length > 0 ? [buildFaqSchema(config.faqs)] : []),
  ];

  return (
    <div className="marketing-site subpage-site">
      <JsonLd data={schemas} />
      <MarketingHeader />
      <main id="main-content">
        <section className="subpage-hero" data-enter>
          <div className="marketing-frame subpage-hero-grid">
            <div className="subpage-hero-copy">
              <nav aria-label="Breadcrumb" className="subpage-breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" /><span>{config.breadcrumbName}</span></nav>
              <p className="eyebrow"><span className="eyebrow-mark" /> {config.eyebrow}</p>
              <h1>{config.h1}</h1>
              <p className="subpage-intro">{config.intro}</p>
              <div className="hero-actions"><Link href={config.primaryCtaHref} className="button button-primary">{config.primaryCtaLabel} <ArrowRight size={16} /></Link><Link href={config.secondaryCtaHref} className="button button-secondary">{config.secondaryCtaLabel} <ExternalLink size={15} /></Link></div>
            </div>
            <div className="subpage-signal" aria-label={`${config.breadcrumbName} workflow overview`}><div className="signal-head"><span>Menzy workflow</span><span>Built for service</span></div><div className="signal-line" />{config.workflowSteps.slice(0, 3).map((step, index) => <div className="signal-row" key={step.step}><span className="signal-index">{String(index + 1).padStart(2, '0')}</span><div><b>{step.title}</b><small>{step.detail}</small></div><ArrowRight size={16} /></div>)}</div>
          </div>
        </section>

        <section className="subpage-capabilities"><div className="marketing-frame"><div className="subpage-section-heading"><p className="section-kicker">What the workspace handles</p><div><h2>{config.capabilitiesHeading}</h2><p className="section-intro">{config.capabilitiesSubheading}</p></div></div><div className="capability-list">{config.capabilities.map((cap, index) => <article className="capability-row" key={cap.title}><span className="capability-index">{String(index + 1).padStart(2, '0')}</span><h3>{cap.title}</h3><p>{cap.description}</p><ArrowRight size={18} aria-hidden="true" /></article>)}</div></div></section>

        <section className="subpage-workflow"><div className="marketing-frame subpage-workflow-grid"><div><p className="section-kicker">A clear operating rhythm</p><h2>{config.workflowHeading}</h2><p className="section-intro">The parts of the service stay connected, from the first upload to the last ticket.</p></div><ol className="workflow-list">{config.workflowSteps.map((step) => <li key={step.step}><span>{step.step}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div></li>)}</ol></div></section>

        <section className="subpage-checklist"><div className="marketing-frame checklist-grid"><div><p className="section-kicker">The useful detail</p><h2>{config.checklistHeading}</h2></div><ul>{config.checklistItems.map((item) => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul></div></section>

        {config.faqs.length > 0 && <section className="subpage-faq"><div className="marketing-frame faq-grid"><div><p className="section-kicker">Practical answers</p><h2>Questions operators ask first.</h2></div><div className="faq-list">{config.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div></div></section>}

        <section className="subpage-related"><div className="marketing-frame"><div className="subpage-related-head"><p className="section-kicker">Keep exploring</p><h2>More ways Menzy fits the room.</h2></div><div className="related-list">{config.relatedLinks.map((link) => <Link href={link.href} key={link.href}><span><b>{link.title}</b><small>{link.description}</small></span><ArrowRight size={18} /></Link>)}</div></div></section>

        <section className="subpage-close"><div className="marketing-frame subpage-close-inner"><div><p className="section-kicker section-kicker-light">Ready when your menu is</p><h2>Make the next service feel lighter.</h2></div><Link href="/signup" className="button button-primary">Create your menu <ArrowRight size={16} /></Link></div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
