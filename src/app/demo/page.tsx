import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: "The Peddler's Cafe — Live Interactive Restaurant Menu Demo — Menzy",
  description: "Explore The Peddler's Cafe live interactive digital menu with 3D dish visuals, dietary filters, grounded AI waiter Q&A, guest Wi-Fi QR cards, and table ordering.",
  path: '/demo',
  keywords: ['interactive digital menu demo', 'restaurant qr menu example', 'ai waiter live demo'],
});

export default function DemoPage() {
  const demo = { title: "The Peddler's Cafe", slug: 'the-peddler-s-cafe-demo-18f4', location: 'India', currency: 'INR (₹)', theme: 'Warm Editorial', description: 'Interactive visual café & restaurant menu with 3D-styled dish previews, dietary filters, grounded AI pairing answers, and table ordering.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85' };

  return (
    <div className="marketing-site demo-page">
      <JsonLd data={buildBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Live Demo', path: '/demo' }])} />
      <MarketingHeader />
      <main id="main-content">
        <section className="demo-hero" data-enter><div className="marketing-frame demo-hero-inner"><div><p className="eyebrow"><span className="eyebrow-mark" /> Working venue demo</p><h1>See the menu<br /><em>guests actually use.</em></h1><p>Open The Peddler&apos;s Cafe to explore the live diner experience: visual dishes, dietary filters, grounded AI pairing answers, and table ordering in the browser.</p></div><div className="demo-meta"><span>Venue</span><strong>{demo.title}</strong><span>{demo.location} · {demo.theme}</span><span>{demo.currency}</span></div></div></section>
        <section className="demo-stage"><div className="marketing-frame demo-stage-grid"><div className="demo-photo"><img src={demo.imageUrl} alt={`${demo.title} dining interior`} width={1200} height={800} /></div><div className="demo-panel"><p className="section-kicker">Live menu</p><h2>{demo.title}</h2><p>{demo.description}</p><div className="demo-facts"><span><b>01</b> Scan a table QR</span><span><b>02</b> Ask the AI waiter</span><span><b>03</b> Send an order to staff</span></div><Link href={`/m/${demo.slug}`} className="button button-primary">Open the diner menu <ExternalLink size={16} /></Link></div></div></section>
        <section className="demo-lower"><div className="marketing-frame demo-lower-grid"><div><p className="section-kicker">A working example, not a mockup</p><h2>Bring the same clarity to your own menu.</h2></div><div><p className="section-intro">Create a workspace, upload your existing menu, and shape the experience around your venue. If you want help migrating a menu, the team can guide the setup.</p><div className="demo-actions"><Link href="/signup" className="button button-primary">Create your menu <ArrowRight size={16} /></Link><Link href="/contact" className="button button-secondary">Request a tailored demo <ArrowRight size={16} /></Link></div></div></div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
