import type { Metadata } from 'next';
import Link from 'next/link';
import { MenzyLogo } from '@/components/brand/MenzyLogo';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Page Not Found — Menzy',
  description: 'The requested page could not be found on Menzy. Explore interactive digital menus, features, or pricing.',
  path: '/404',
  index: false,
  omitCanonical: true,
});

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-5">
        <div className="flex justify-center">
          <MenzyLogo size={44} showWordmark />
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-cream-100 border border-cream-200 text-[11px] font-mono uppercase tracking-wider text-terracotta">
          404 • Page Not Found
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
          This page is off the menu
        </h1>
        <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
          The page you requested does not exist or may have moved. Explore Menzy digital menus, features, or pricing below.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors"
          >
            Go to Home
          </Link>
          <Link
            href="/features"
            className="px-5 py-2.5 rounded-full bg-cream-100 border border-cream-300 text-espresso-900 text-xs sm:text-sm font-semibold hover:bg-cream-200 transition-colors"
          >
            Explore Features
          </Link>
          <Link
            href="/demo"
            className="px-5 py-2.5 rounded-full bg-white border border-cream-300 text-espresso-800 text-xs sm:text-sm font-semibold hover:bg-cream-50 transition-colors"
          >
            Live Menus
          </Link>
        </div>
      </div>
    </main>
  );
}
