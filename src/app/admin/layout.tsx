import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Founder Portal — Menzy',
  description: 'Restricted Menzy platform operations portal.',
  path: '/admin',
  index: false,
  omitCanonical: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

