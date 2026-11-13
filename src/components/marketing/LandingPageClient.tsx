'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDownRight, ArrowRight, Check, ChevronDown, ExternalLink, ScanLine } from 'lucide-react';
import type { PlanDefinition } from '@/lib/payments/plans';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';
import { HOMEPAGE_FAQS } from '@/content/seo-pages';
import { PricingCardsClient } from './PricingCardsClient';
import { MarketingFooter } from './MarketingFooter';
import { MarketingHeader } from './MarketingHeader';

interface LandingPageClientProps {
  authoritativeGeo: boolean;
  initialPlans: PlanDefinition[] | null;
}

function HeroPreview() {
  const [view, setView] = useState<'guest' | 'staff'>('guest');

  return (
    <div className="hero-preview" aria-label="Menzy product preview">
      <div className="preview-toolbar">
        <div className="preview-dots" aria-hidden="true"><i /><i /><i /></div>
        <span className="preview-url">menzy.app/m/saffron</span>
        <span className="preview-live"><span /> Live preview</span>
      </div>
      <div className="preview-tabs" role="tablist" aria-label="Product preview views">
        <button type="button" role="tab" aria-controls="guest-preview" aria-selected={view === 'guest'} className={view === 'guest' ? 'is-active' : ''} onClick={() => setView('guest')}>Guest menu</button>
        <button type="button" role="tab" aria-controls="staff-preview" aria-selected={view === 'staff'} className={view === 'staff' ? 'is-active' : ''} onClick={() => setView('staff')}>Staff terminal</button>
      </div>
      {view === 'guest' ? (
        <div className="preview-guest" id="guest-preview" role="tabpanel">
          <div className="preview-phone">
            <div className="phone-topline"><span>9:41</span><span>Table 04 · Saffron</span><span>•••</span></div>
            <div className="phone-brand"><span>SAFFRON</span><small>courtyard café</small></div>
            <div className="phone-search">Search the menu <span>⌕</span></div>
            <div className="phone-filters"><span className="selected">All</span><span>Veg</span><span>Small plates</span></div>
            <div className="phone-dish-image"><Image src="/media/menu-preview-poster.webp" alt="Menzy mobile menu preview" fill sizes="(max-width: 640px) 72vw, 250px" priority /></div>
            <div className="phone-dish-copy"><div><b>Tandoori paneer tikka</b><small>Charred paneer · mint chutney</small></div><strong>₹380</strong></div>
            <div className="phone-ai"><span>✦</span><div><b>Ask the AI waiter</b><small>What pairs well with this?</small></div><ArrowRight size={14} /></div>
            <div className="phone-cart"><span>2 items</span><b>View order · ₹540</b><ArrowRight size={14} /></div>
          </div>
          <div className="preview-note"><ScanLine size={16} /><span>Scanned from a table QR code. No app download.</span></div>
        </div>
      ) : (
        <div className="preview-staff" id="staff-preview" role="tabpanel">
          <div className="staff-window-top"><span>Staff order terminal</span><span className="staff-status"><i /> Syncing live</span></div>
          <div className="staff-summary"><div><small>Today</small><strong>Table service</strong></div><span>Sample interface</span></div>
          <div className="staff-columns">
            <div className="staff-column"><div className="staff-column-head"><span>New</span><b>02</b></div><div className="ticket"><strong>#104 · Table 04</strong><span>Tandoori paneer tikka × 1</span><span>Masala chai · regular × 1</span><button type="button">Accept order</button></div></div>
            <div className="staff-column staff-column-muted"><div className="staff-column-head"><span>Preparing</span><b>01</b></div><div className="ticket"><strong>#103 · Table 02</strong><span>Butter chicken × 2</span><span>Garlic naan × 2</span><em>08 min</em></div></div>
          </div>
          <div className="staff-footnote"><Check size={15} /> Order statuses move from placed to preparing, ready, served, and completed.</div>
        </div>
      )}
    </div>
  );
}

const experience = [
  ['Scan', 'A table-specific QR code opens the right menu and table session.'],
  ['Explore', 'Guests browse categories, variants, photos, and dietary labels on their phone.'],
  ['Ask', 'The menu-grounded AI waiter answers pairing and ingredient questions from your published catalog.'],
  ['Order', 'A dine-in order arrives in the browser-based staff terminal with its table identity attached.'],
];

export function LandingPageClient({ authoritativeGeo, initialPlans }: LandingPageClientProps) {
  return (
    <div className="marketing-site">
      <MarketingHeader />
      <main id="main-content">
        <section className="hero-section" data-enter>
          <div className="marketing-frame hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-mark" /> Digital menus for independent restaurants</p>
              <h1>Your menu. Their phone.<br /><em>A smoother service.</em></h1>
              <p className="hero-lede">Turn a printed menu into a branded digital experience. Guests scan their table QR code, explore dishes, ask the AI waiter questions, and send orders to your staff.</p>
              <div className="hero-actions"><Link href="/m/the-peddler-s-cafe-demo-18f4" className="button button-primary">Try the interactive menu <ExternalLink size={16} /></Link><Link href="/signup" className="button button-secondary">Create your menu <ArrowRight size={16} /></Link></div>
              <p className="hero-note">14-day free trial · no payment method required · <a href={SUPPORT_EMAIL_HREF}>{SUPPORT_EMAIL_DISPLAY}</a></p>
            </div>
            <HeroPreview />
          </div>
          <div className="hero-bottom marketing-frame"><span>Built for cafés, restaurants, and quick-service teams.</span><span className="hero-scroll">Scroll to see the service flow <ArrowDownRight size={16} /></span></div>
        </section>

        <section className="statement-section" id="how-it-works">
          <div className="marketing-frame statement-grid"><p className="section-kicker">The guest experience</p><div><h2>Less friction at the table. More room for hospitality.</h2><p className="section-intro">Menzy keeps the experience simple for guests and legible for the people running service.</p></div></div>
          <div className="marketing-frame ruled-list">{experience.map(([title, detail]) => <div className="ruled-row" key={title}><span className="row-label">{title}</span><p>{detail}</p><ArrowRight size={18} aria-hidden="true" /></div>)}</div>
        </section>

        <section className="setup-section"><div className="marketing-frame split-grid"><div className="split-copy"><p className="section-kicker">The owner setup</p><h2>From menu file to live service in one clear pass.</h2><p className="section-intro">Review what Menzy extracts, make the decisions that matter, then publish once. Your menu, prices, availability, and brand stay in one workspace.</p><Link href="/ai-digital-menu" className="text-link">See menu digitization <ArrowRight size={16} /></Link></div><div className="setup-visual"><div className="upload-sheet"><div className="upload-head"><span>Menu Studio</span><span className="upload-state">Ready to review</span></div><div className="upload-file"><div className="file-icon">PDF</div><div><b>summer-menu-2026.pdf</b><small>18 dishes · 4 categories · extracted</small></div><Check size={18} /></div><div className="upload-rule" /><div className="upload-item"><span className="dish-dot dish-dot-orange" /><div><b>Tandoori paneer tikka</b><small>₹380 · Veg · Small plates</small></div><span className="review-tag">Reviewed</span></div><div className="upload-item"><span className="dish-dot dish-dot-green" /><div><b>Classic masala chai</b><small>₹160 · Beverage · Variants</small></div><span className="review-tag">Reviewed</span></div><div className="upload-footer"><span>All changes saved locally</span><button type="button">Publish menu <ArrowRight size={14} /></button></div></div></div></div></section>

        <section className="visuals-section"><div className="marketing-frame visuals-grid"><div className="visuals-copy"><p className="section-kicker">A menu worth opening</p><h2>Useful information can still feel inviting.</h2><p className="section-intro">Use your own photography, approved canonical visuals, or generated dish artwork to help guests decide with confidence.</p><Link href="/features" className="text-link">Explore the feature set <ArrowRight size={16} /></Link></div><div className="dish-gallery"><div className="dish-image dish-image-large"><Image src="/uploads/illustrations/1794263392050-paneer-butter-masala.jpg" alt="Paneer butter masala dish visual" fill sizes="(max-width: 900px) 80vw, 420px" /></div><div className="dish-image"><Image src="/uploads/illustrations/1794251490842-black-truffle-tagliatelle.webp" alt="Black truffle tagliatelle dish visual" fill sizes="(max-width: 900px) 40vw, 210px" /></div><div className="dish-image dish-image-dark"><Image src="/uploads/illustrations/1794282866377-classic-chicken-punjabi-meal.jpg" alt="Classic chicken Punjabi meal visual" fill sizes="(max-width: 900px) 40vw, 210px" /></div></div></div></section>

        <section className="operations-section"><div className="marketing-frame operations-grid"><div className="operations-copy"><p className="section-kicker section-kicker-light">The staff view</p><h2>Every order arrives with the context your team needs.</h2><p className="section-intro section-intro-light">Table identity, line items, notes, totals, and a clear status path — in a browser-based terminal built for service.</p><Link href="/restaurant-order-management" className="button button-inverse">See order management <ArrowRight size={16} /></Link></div><div className="operations-panel"><div className="ops-panel-head"><span>Order management</span><span className="ops-live"><i /> Live queue</span></div><div className="ops-stage"><span>New</span><b>02</b><span>Preparing</span><b>01</b><span>Ready</span><b>03</b><span>Served</span><b>08</b></div><div className="ops-ticket"><div><strong>#104 · Table 04</strong><small>Just now · 2 items</small></div><span className="ops-badge">PLACED</span><div className="ops-ticket-items"><span>1 × Tandoori paneer tikka</span><span>1 × Masala chai · regular</span></div><div className="ops-ticket-foot"><span>₹540 · INR</span><button type="button">Accept order</button></div></div><p className="ops-caption">Sample terminal view. Live staff access is protected at <Link href="/orders/login">Staff Terminal</Link>.</p></div></div></section>

        <section className="pricing-section"><div className="marketing-frame pricing-intro"><p className="section-kicker">Plans for real service teams</p><h2>Start small. Keep the system clear.</h2><p className="section-intro">Regional monthly plans in INR and USD, with a 14-day trial and no per-order commission.</p></div><PricingCardsClient authoritativeGeo={authoritativeGeo} initialPlans={initialPlans} sectionId="pricing" eyebrow="" heading="" subheading="" /></section>

        <section className="faq-section"><div className="marketing-frame faq-grid"><div><p className="section-kicker">Practical answers</p><h2>Questions before you put a QR on the table?</h2><p className="section-intro">A few details owners usually want to know first.</p></div><div className="faq-list">{HOMEPAGE_FAQS.slice(0, 4).map((faq) => <details key={faq.question}><summary>{faq.question}<ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div></div></section>

        <section className="closing-section"><div className="marketing-frame closing-inner"><div><p className="section-kicker section-kicker-light">Ready when your menu is</p><h2>Give guests a better way to order.</h2></div><div className="closing-actions"><Link href="/signup" className="button button-primary">Create your menu <ArrowRight size={16} /></Link><a href={SUPPORT_EMAIL_HREF} className="closing-contact">Talk to the team <span>{SUPPORT_EMAIL_DISPLAY}</span></a></div></div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
