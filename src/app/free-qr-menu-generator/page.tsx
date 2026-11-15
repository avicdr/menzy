import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { FreeQrMenuGenerator } from '@/components/marketing/FreeQrMenuGenerator';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildSoftwareApplicationSchema } from '@/lib/seo-schema';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Free QR Code Menu Generator for Restaurants — Menzy',
  description: 'Generate and download a restaurant QR code for any menu URL or text in your browser. No signup required. Connect it to Menzy for live digital menus and table ordering.',
  path: '/free-qr-menu-generator',
  keywords: ['free QR code menu generator', 'restaurant QR code generator', 'QR code for restaurant menu', 'download QR menu'],
});

export default function FreeQrMenuGeneratorPage() {
  return (
    <div className="marketing-site subpage-site">
      <JsonLd data={[buildSoftwareApplicationSchema({ urlPath: '/free-qr-menu-generator', description: 'A browser-based QR code generator for restaurant menu URLs or text.' }), buildBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Free QR Menu Generator', path: '/free-qr-menu-generator' }])]} />
      <MarketingHeader />
      <main id="main-content">
        <section className="subpage-hero free-tool-hero" data-enter>
          <div className="marketing-frame free-tool-hero-inner">
            <div className="subpage-hero-copy free-tool-hero-copy">
              <nav aria-label="Breadcrumb" className="subpage-breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" /><span>Free QR Menu Generator</span></nav>
              <p className="eyebrow"><span className="eyebrow-mark" /> Free restaurant tool</p>
              <h1>Generate a QR code for your restaurant menu.</h1>
              <p className="subpage-intro">Paste a menu URL or any short text, generate a QR code in your browser, and download it as a PNG. No account or Menzy subscription is required.</p>
            </div>
            <div className="free-tool-stage">
              <FreeQrMenuGenerator />
            </div>
          </div>
        </section>
        <section className="subpage-capabilities"><div className="marketing-frame"><div className="subpage-section-heading"><p className="section-kicker">How to use it</p><div><h2>Make a scannable menu link in three steps.</h2><p className="section-intro">Use the tool for a temporary menu link, a printed table card, or a quick QR prototype before setting up a complete digital menu.</p></div></div><div className="capability-list"><article className="capability-row"><span className="capability-index">01</span><h3>Paste your destination</h3><p>Use a public menu URL or short text that guests should see after scanning.</p></article><article className="capability-row"><span className="capability-index">02</span><h3>Check the preview</h3><p>Scan the generated code with a phone before printing so you can confirm the destination.</p></article><article className="capability-row"><span className="capability-index">03</span><h3>Download the PNG</h3><p>Place the downloaded image on a table card, poster, receipt, or menu insert.</p></article></div></div></section>
        <section className="subpage-close"><div className="marketing-frame subpage-close-inner"><div><p className="section-kicker section-kicker-light">Need more than a static link?</p><h2>Turn the QR code into a live restaurant menu.</h2></div><Link href="/qr-code-menu" className="button button-primary">Explore Menzy QR menus</Link></div></section>
      </main>
      <MarketingFooter />
    </div>
  );
}
