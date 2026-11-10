import type { Metadata } from 'next';

export function normalizeSiteUrl(raw?: string | null): string {
  const value = (raw || '').trim();
  if (!value) return 'https://menzy.arenova.in';
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/+$/, '');
  }
  const cleanHost = value.replace(/^\/+|\/+$/g, '');
  if (cleanHost.startsWith('localhost') || cleanHost.startsWith('127.0.0.1')) {
    return `http://${cleanHost}`;
  }
  return `https://${cleanHost}`;
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://menzy.arenova.in'
);

export const SITE_NAME = 'Menzy';

export const DEFAULT_TITLE = 'Menzy — AI Digital Menu & QR Ordering Software';

export const DEFAULT_DESCRIPTION =
  'Transform printed or PDF menus into interactive digital restaurant menus with 3D dish visuals, table-specific QR ordering, a menu-grounded AI waiter, and kitchen order management.';

export const GLOBAL_OG_IMAGE_PATH = '/og-image.png';
export const GLOBAL_OG_IMAGE = new URL(GLOBAL_OG_IMAGE_PATH, SITE_URL).toString();

export const GLOBAL_OG_IMAGE_DESCRIPTOR = {
  url: GLOBAL_OG_IMAGE,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Menzy AI-Powered Digital Menus, 3D Dish Visuals & Table QR Ordering',
} as const;

export function normalizeCanonicalPath(path = '/'): string {
  const withoutQuery = path.split('?')[0]?.split('#')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (withLeadingSlash === '/') return '/';
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

export function buildCanonicalUrl(path = '/'): string {
  const normalizedPath = normalizeCanonicalPath(path);
  if (normalizedPath === '/') return SITE_URL;
  return new URL(normalizedPath, SITE_URL).toString();
}

export interface SEOMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
  omitCanonical?: boolean;
  keywords?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

export function generateSEOMetadata({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  index = true,
  omitCanonical = false,
  keywords,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
}: SEOMetadataOptions = {}): Metadata {
  const canonicalUrl = buildCanonicalUrl(path);

  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

  const verification: Metadata['verification'] | undefined =
    googleVerification || bingVerification
      ? {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
        }
      : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: SITE_NAME,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    ...(verification ? { verification } : {}),
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '512x512' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      shortcut: ['/favicon.ico'],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.webmanifest',
    ...(index && !omitCanonical
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
        }
      : {}),
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: GLOBAL_OG_IMAGE_DESCRIPTOR.url,
          width: GLOBAL_OG_IMAGE_DESCRIPTOR.width,
          height: GLOBAL_OG_IMAGE_DESCRIPTOR.height,
          type: GLOBAL_OG_IMAGE_DESCRIPTOR.type,
          alt: GLOBAL_OG_IMAGE_DESCRIPTOR.alt,
        },
      ],
      ...(type === 'article' && publishedTime
        ? {
            publishedTime,
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors ? { authors } : {}),
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [GLOBAL_OG_IMAGE],
    },
  };
}

export interface StaticPublicRouteEntry {
  path: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
  lastModified: string;
}

export const STATIC_INDEXABLE_ROUTES: StaticPublicRouteEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0, lastModified: '2026-11-10' },
  { path: '/features', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-11-10' },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-11-10' },
  { path: '/qr-code-menu', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-11-10' },
  { path: '/table-ordering', changeFrequency: 'weekly', priority: 0.85, lastModified: '2026-11-10' },
  { path: '/restaurant-order-management', changeFrequency: 'weekly', priority: 0.85, lastModified: '2026-11-10' },
  { path: '/ai-digital-menu', changeFrequency: 'weekly', priority: 0.85, lastModified: '2026-11-10' },
  { path: '/restaurant-automation', changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-11-10' },
  { path: '/digital-menu-for-restaurants', changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-11-10' },
  { path: '/digital-menu-for-cafes', changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-11-10' },
  { path: '/digital-menu-for-cloud-kitchens', changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-11-10' },
  { path: '/demo', changeFrequency: 'weekly', priority: 0.8, lastModified: '2026-11-10' },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8, lastModified: '2026-11-10' },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-11-10' },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7, lastModified: '2026-11-10' },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.4, lastModified: '2026-11-10' },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.4, lastModified: '2026-11-10' },
];
