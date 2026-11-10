import type { Metadata } from 'next';
import prisma from '@/lib/db/prisma';
import { generateSEOMetadata, SITE_NAME, SITE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';

export const dynamic = 'force-dynamic';

interface MenuSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function fetchPublicRestaurantMeta(slug: string) {
  if (!slug) return null;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        slug: true,
        displayName: true,
        city: true,
        country: true,
        description: true,
        publicationState: true,
      },
    });
    if (!restaurant || restaurant.publicationState !== 'PUBLISHED') {
      return null;
    }
    return restaurant;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || '').trim();
  const canonicalPath = `/m/${encodeURIComponent(slug)}`;

  const restaurant = await fetchPublicRestaurantMeta(slug);
  if (!restaurant) {
    return generateSEOMetadata({
      title: 'Interactive Restaurant Menu — Menzy',
      description:
        'Explore interactive digital menus with 3D dish visuals, dietary clarity, and table QR ordering powered by Menzy.',
      path: canonicalPath,
      index: false,
      omitCanonical: true,
    });
  }

  const locationLabel = [restaurant.city, restaurant.country === 'US' ? 'USA' : 'India']
    .filter(Boolean)
    .join(', ');

  const descriptionSource = (restaurant.description || '').trim();
  const fallbackDescription = `Explore ${restaurant.displayName}${
    locationLabel ? ` (${locationLabel})` : ''
  } digital menu with 3D dish visuals, dietary filters, and AI menu concierge on Menzy.`;

  const description =
    descriptionSource.length > 20
      ? descriptionSource.slice(0, 158)
      : fallbackDescription;

  return generateSEOMetadata({
    title: `${restaurant.displayName} — Interactive Digital Menu | ${SITE_NAME}`,
    description,
    path: canonicalPath,
    index: true,
  });
}

export default async function MenuSlugLayout({ children, params }: MenuSlugLayoutProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || '').trim();
  const canonicalPath = `/m/${encodeURIComponent(slug)}`;
  const restaurant = await fetchPublicRestaurantMeta(slug);

  const menuUrl = new URL(canonicalPath, SITE_URL).toString();

  return (
    <>
      {restaurant && (
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: restaurant.displayName,
              url: menuUrl,
              hasMenu: menuUrl,
              ...(restaurant.description ? { description: restaurant.description } : {}),
              ...(restaurant.city || restaurant.country
                ? {
                    address: {
                      '@type': 'PostalAddress',
                      ...(restaurant.city ? { addressLocality: restaurant.city } : {}),
                      addressCountry: restaurant.country || 'IN',
                    },
                  }
                : {}),
            },
            buildBreadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Live Menus', path: '/demo' },
              { name: restaurant.displayName, path: canonicalPath },
            ]),
          ]}
        />
      )}
      {children}
    </>
  );
}

