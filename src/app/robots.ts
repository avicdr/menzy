import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/api/',
          '/admin',
          '/dashboard',
          '/orders',
          '/claim',
          '/login',
          '/signup',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/favicon.ico', '/icon.png', '/icon-*.png', '/apple-touch-icon.png', '/logo.png', '/og-image.png'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

