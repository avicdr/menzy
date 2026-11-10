import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { BLOG_POSTS } from '@/content/blog-posts';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Restaurant Menu & QR Ordering Blog — Menzy',
  description:
    'Hospitality guides on creating QR code menus, India digital menu software, cryptographic table ordering, grounded AI waiters, and visual menu design.',
  path: '/blog',
  keywords: [
    'restaurant qr menu guide',
    'digital menu software india',
    'ai restaurant menu blog',
    'table ordering best practices',
  ],
});

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ])}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe-600">
              <Link href="/" className="hover:text-espresso-900 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
              <span className="font-semibold text-espresso-900">Blog</span>
            </nav>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900">
              Hospitality &amp; Digital Menu Playbooks
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm md:text-base text-taupe-600 leading-relaxed">
              Practical field notes on QR menu conversion, FSSAI dietary UX, secure table ordering, and catalog-grounded AI assistants for modern restaurants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col justify-between space-y-4 hover:border-terracotta transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-terracotta-700 uppercase tracking-wider">
                    <span>{post.category}</span>
                    <span aria-hidden="true">•</span>
                    <span className="text-taupe-500 font-normal normal-case">{post.readTime}</span>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-espresso-900 leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-terracotta transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-cream-100 text-xs">
                  <time dateTime={post.publishedAt} className="text-taupe-500">
                    {post.publishedAt}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-espresso-900 hover:text-terracotta transition-colors"
                  >
                    <span>Read guide</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

