import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Claim Restaurant Menu — Menzy',
  description: 'Private invitation link to claim and manage your pre-built Menzy digital restaurant menu.',
  path: '/claim',
  index: false,
  omitCanonical: true,
});

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return children;
}

