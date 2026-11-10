import type { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';
import { buildCanonicalUrl, STATIC_INDEXABLE_ROUTES } from '@/lib/seo';
import { BLOG_POSTS } from '@/content/blog-posts';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    ...STATIC_INDEXABLE_ROUTES.map((route) => ({
      url: buildCanonicalUrl(route.path),
      lastModified: new Date(route.lastModified),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...BLOG_POSTS.map((post) => ({
      url: buildCanonicalUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];

  // Include only explicitly published public restaurant menus; gracefully skip if DB unreachable
  try {
    const publishedMenus = await prisma.restaurant.findMany({
      where: { publicationState: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    });

    for (const r of publishedMenus) {
      if (!r.slug) continue;
      entries.push({
        url: buildCanonicalUrl(`/m/${encodeURIComponent(r.slug)}`),
        lastModified: r.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // Allow build-time or offline environments to emit static marketing sitemap cleanly
  }

  return entries;
}
