import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sign In — Menzy',
  description: 'Sign in to manage your interactive restaurant menu, QR codes, AI waiter, and orders on Menzy.',
  path: '/login',
  index: false,
  omitCanonical: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

