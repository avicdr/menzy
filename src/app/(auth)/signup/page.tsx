import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { resolveVisitorRegion } from '@/lib/geo/region-server';
import { SignupFormClient } from '@/components/auth/SignupFormClient';
import { generateSEOMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Create Account — Menzy',
  description:
    'Create your Menzy workspace to convert paper or PDF menus into interactive digital menus and table QR ordering.',
  path: '/signup',
  index: false,
  omitCanonical: true,
});

export default async function SignupPage() {
  const hdrs = await headers();
  const geo = await resolveVisitorRegion(hdrs);

  return (
    <SignupFormClient
      initialRegion={geo.region}
      authoritativeGeo={geo.authoritative}
    />
  );
}
