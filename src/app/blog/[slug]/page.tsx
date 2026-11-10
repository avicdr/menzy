import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { BLOG_POSTS, getBlogPostBySlug } from '@/content/blog-posts';
import { generateSEOMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
} from '@/lib/seo-schema';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return generateSEOMetadata({
      title: 'Article Not Found — Menzy',
      description: 'Explore hospitality and digital menu guides on the Menzy blog.',
      path: `/blog/${slug}`,
      index: false,
      omitCanonical: true,
    });
  }

  return generateSEOMetadata({
    title: `${post.title} — Menzy`,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: [post.authorName],
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex flex-col">
      <JsonLd
        data={[
          buildArticleSchema(post),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          ...(post.faqs.length > 0 ? [buildFaqSchema(post.faqs)] : []),
        ]}
      />
      <MarketingHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto space-y-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-taupe-600">
            <Link href="/" className="hover:text-espresso-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
            <Link href="/blog" className="hover:text-espresso-900 transition-colors">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-taupe-400" aria-hidden="true" />
            <span className="font-semibold text-espresso-900 truncate max-w-[260px] sm:max-w-none">
              {post.category}
            </span>
          </nav>

          <header className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-terracotta-700 uppercase tracking-wider">
              <span>{post.category}</span>
              <span aria-hidden="true">•</span>
              <span className="text-taupe-500 font-normal normal-case">{post.readTime}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-espresso-900 leading-[1.15]">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-taupe-700 leading-relaxed">
              {post.description}
            </p>

            <div className="text-xs text-taupe-500 flex items-center gap-3 pt-1">
              <span>By {post.authorName}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={post.publishedAt}>{post.publishedAt}</time>
            </div>
          </header>

          <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-10 shadow-soft space-y-8">
            {post.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-xs sm:text-sm md:text-base text-taupe-700 leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm md:text-base text-taupe-700">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {post.faqs.length > 0 && (
              <section className="pt-6 border-t border-cream-200 space-y-4">
                <h2 className="font-serif text-xl font-bold text-espresso-900">
                  Quick Answers
                </h2>
                <div className="space-y-3">
                  {post.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="group bg-cream-50 rounded-2xl border border-cream-200 p-4"
                    >
                      <summary className="cursor-pointer font-semibold text-xs sm:text-sm text-espresso-900 list-none flex items-center justify-between gap-2">
                        <span>{faq.question}</span>
                        <span className="text-terracotta-700 text-base shrink-0 group-open:rotate-45 transition-transform">
                          +
                        </span>
                      </summary>
                      <p className="mt-2.5 text-xs sm:text-sm text-taupe-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-6 border-t border-cream-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-serif text-base font-bold text-espresso-900">
                  See this workflow live on Menzy
                </div>
                <p className="text-xs text-taupe-600">
                  Set up your menu in minutes with 3D dish visuals and signed table QR codes.
                </p>
              </div>
              <Link
                href={post.ctaPath}
                className="px-5 py-2.5 rounded-full bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <span>{post.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {relatedPosts.length > 0 && (
            <section className="space-y-4 pt-4">
              <h2 className="font-serif text-xl font-bold text-espresso-900">
                More from the Menzy Blog
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="p-5 bg-white rounded-2xl border border-cream-200 hover:border-terracotta transition-colors space-y-1.5"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-terracotta-700">
                      {rp.category}
                    </div>
                    <div className="font-serif text-base font-bold text-espresso-900 leading-snug">
                      {rp.title}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <MarketingFooter />
    </div>
  );
}

