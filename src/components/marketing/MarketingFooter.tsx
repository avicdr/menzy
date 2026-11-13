import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MenzyLogo } from '@/components/brand/MenzyLogo';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-frame footer-top"><div className="footer-brand"><Link href="/" aria-label="Menzy home"><MenzyLogo size={32} showWordmark wordmarkClassName="footer-wordmark" /></Link><p>A calmer digital layer for the places people love to eat.</p><a href={SUPPORT_EMAIL_HREF}>{SUPPORT_EMAIL_DISPLAY} <ArrowUpRight size={14} /></a></div><div className="footer-links"><div><span>Product</span><Link href="/features">Features</Link><Link href="/qr-code-menu">QR menus</Link><Link href="/table-ordering">Table ordering</Link><Link href="/restaurant-order-management">Staff terminal</Link></div><div><span>Company</span><Link href="/demo">Live demo</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></div><div><span>Access</span><Link href="/login">Sign in</Link><Link href="/signup">Create your menu</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div></div>
      <div className="marketing-frame footer-bottom"><span>© {new Date().getFullYear()} Menzy Hospitality AI</span><span>Built for restaurants in India and worldwide.</span></div>
    </footer>
  );
}
