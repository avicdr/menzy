import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { MenzyLogo } from '@/components/brand/MenzyLogo';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';

export function MarketingFooter() {
  return (
    <footer className="border-t border-cream-300 bg-cream-50 py-14 px-4 sm:px-8 text-taupe-600">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Summary */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center">
              <MenzyLogo size={32} showWordmark />
            </Link>
            <p className="text-xs leading-relaxed text-taupe-600 max-w-xs">
              AI-powered interactive digital restaurant menus with 3D-clay dish visuals, table-specific QR ordering, grounded AI concierge, and live KDS.
            </p>
            <p className="text-[11px] font-medium text-espresso-800">
              See it. Ask it. Crave it.
            </p>
            <div className="pt-1">
              <a
                href={SUPPORT_EMAIL_HREF}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso-900 hover:text-terracotta transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-terracotta shrink-0" aria-hidden="true" />
                <span>Setup Queries: {SUPPORT_EMAIL_DISPLAY}</span>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-espresso-900">
              Platform
            </div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/features" className="hover:text-espresso-900 transition-colors">All Features</Link></li>
              <li><Link href="/ai-digital-menu" className="hover:text-espresso-900 transition-colors">AI Digital Menu</Link></li>
              <li><Link href="/qr-code-menu" className="hover:text-espresso-900 transition-colors">QR Code Menu Generator</Link></li>
              <li><Link href="/table-ordering" className="hover:text-espresso-900 transition-colors">Table QR Ordering</Link></li>
              <li><Link href="/restaurant-order-management" className="hover:text-espresso-900 transition-colors">Order Management & KDS</Link></li>
              <li><Link href="/restaurant-automation" className="hover:text-espresso-900 transition-colors">Restaurant Automation</Link></li>
            </ul>
          </div>

          {/* Hospitality Solutions */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-espresso-900">
              Solutions
            </div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/digital-menu-for-restaurants" className="hover:text-espresso-900 transition-colors">For Restaurants</Link></li>
              <li><Link href="/digital-menu-for-cafes" className="hover:text-espresso-900 transition-colors">For Cafés & Bakeries</Link></li>
              <li><Link href="/digital-menu-for-cloud-kitchens" className="hover:text-espresso-900 transition-colors">For QSR & Food Courts</Link></li>
              <li><Link href="/pricing" className="hover:text-espresso-900 transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-espresso-900 transition-colors">Live Interactive Menus</Link></li>
            </ul>
          </div>

          {/* Resources & Company */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-espresso-900">
              Company & Resources
            </div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/blog" className="hover:text-espresso-900 transition-colors">Hospitality Blog</Link></li>
              <li><Link href="/about" className="hover:text-espresso-900 transition-colors">About Menzy</Link></li>
              <li><Link href="/contact" className="hover:text-espresso-900 transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-espresso-900 transition-colors">Privacy Notice</Link></li>
              <li><Link href="/terms" className="hover:text-espresso-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/orders/login" className="hover:text-espresso-900 transition-colors">Staff Terminal</Link></li>
              <li><Link href="/admin/login" className="hover:text-espresso-900 transition-colors">Founder Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-taupe-500">
          <div>
            &copy; {new Date().getFullYear()} Menzy Hospitality AI. Built for restaurants in India &amp; worldwide.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sitemap.xml" className="hover:text-espresso-900 transition-colors">Sitemap</Link>
            <Link href="/privacy" className="hover:text-espresso-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-espresso-900 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

