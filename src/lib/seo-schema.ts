import type { PlanDefinition } from '@/lib/payments/plans';
import { SUPPORT_PHONE_DISPLAY } from '@/lib/support/contact';
import {
  GLOBAL_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  DEFAULT_DESCRIPTION,
  buildCanonicalUrl,
} from './seo';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: new URL('/logo.png', SITE_URL).toString(),
    image: GLOBAL_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    areaServed: ['IN', 'US'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SUPPORT_PHONE_DISPLAY,
      contactType: 'customer support',
      areaServed: ['IN', 'US'],
    },
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildSoftwareApplicationSchema(options?: {
  urlPath?: string;
  description?: string;
  pricingPlans?: PlanDefinition[];
}) {
  const url = buildCanonicalUrl(options?.urlPath || '/');
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url,
    image: GLOBAL_OG_IMAGE,
    description: options?.description || DEFAULT_DESCRIPTION,
    featureList: [
      'AI-powered menu photo and PDF extraction (OCR)',
      '3D-clay styled food dish illustrations and canonical library',
      'Menu-grounded AI waiter and sommelier assistant',
      'Signed table-specific QR code generator and printable table tents',
      'Direct contactless table QR ordering with 30-minute session protection',
      'Real-time Kitchen Display System (KDS) and waiter service call alerts',
    ],
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  if (options?.pricingPlans && options.pricingPlans.length > 0) {
    schema.offers = options.pricingPlans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: (plan.priceMinor / 100).toFixed(2),
      priceCurrency: plan.currency,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: (plan.priceMinor / 100).toFixed(2),
        priceCurrency: plan.currency,
        unitText: 'MONTH',
      },
      url: new URL('/pricing', SITE_URL).toString(),
    }));
  }

  return schema;
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

export function buildFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildArticleSchema(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  authorName: string;
}) {
  const url = new URL(`/blog/${article.slug}`, SITE_URL).toString();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: [GLOBAL_OG_IMAGE],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: {
      '@type': 'Organization',
      name: article.authorName,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/logo.png', SITE_URL).toString(),
      },
    },
  };
}
