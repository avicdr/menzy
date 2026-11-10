import React from 'react';
import Link from 'next/link';
import { MenzyLogo } from '@/components/brand/MenzyLogo';

export function MarketingHeader() {
  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/qr-code-menu', label: 'QR Menu' },
    { href: '/table-ordering', label: 'Ordering' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/demo', label: 'Live Demo' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7F3EC]/95 backdrop-blur-md border-b border-cream-300/70">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-espresso-900 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Primary"
        className="max-w-7xl mx-auto px-3.5 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4"
      >
        <Link href="/" className="flex items-center shrink-0">
          <MenzyLogo size={36} showWordmark />
        </Link>

        <div className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-taupe-700">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-espresso-900 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-espresso-800 hover:text-espresso-950 transition-colors whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 active:scale-95 transition-all shadow-sm whitespace-nowrap"
          >
            Create Menu
          </Link>
        </div>
      </nav>

      {/* Accessible mobile quick navigation strip */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden border-t border-cream-200/70 px-3.5 py-1.5 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs font-medium text-taupe-700"
      >
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="py-1 px-1 hover:text-espresso-900 transition-colors whitespace-nowrap shrink-0"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

