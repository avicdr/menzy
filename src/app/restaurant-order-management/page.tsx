import type { Metadata } from 'next';
import { SEO_LANDING_CONFIGS } from '@/content/seo-pages';
import { generateSEOMetadata } from '@/lib/seo';
import { SeoLandingTemplate } from '@/components/marketing/SeoLandingTemplate';

const cfg = SEO_LANDING_CONFIGS['restaurant-order-management'];

export const metadata: Metadata = generateSEOMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: cfg.path,
  keywords: cfg.keywords,
});

export default function RestaurantOrderManagementPage() {
  return <SeoLandingTemplate config={cfg} />;
}

