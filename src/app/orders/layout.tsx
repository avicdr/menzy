import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { ManagementLanguageProvider } from '@/lib/i18n/management-i18n';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Kitchen & Staff Terminal — Menzy',
  description: 'Restricted kitchen display system (KDS) and floor waitstaff terminal for Menzy partner restaurants.',
  path: '/orders',
  index: false,
  omitCanonical: true,
});

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <ManagementLanguageProvider defaultLang="en">{children}</ManagementLanguageProvider>;
}

