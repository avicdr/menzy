import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Owner Console — Menzy',
  description: 'Manage your digital menu, 3D dish visuals, theme settings, table QR codes, and orders in Menzy.',
  path: '/dashboard',
  index: false,
  omitCanonical: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

