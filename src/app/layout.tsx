import type { Metadata, Viewport } from 'next';
import {
  DM_Sans,
  DM_Serif_Display,
  Inter,
  Lora,
  Manrope,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';
import { generateSEOMetadata } from '@/lib/seo';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-next-plus-jakarta-sans',
  display: 'swap',
  preload: true,
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-next-inter',
  display: 'swap',
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-next-dm-sans',
  display: 'swap',
  preload: false,
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-next-lora',
  display: 'swap',
  preload: false,
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-next-dm-serif-display',
  display: 'swap',
  preload: false,
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-next-playfair-display',
  display: 'swap',
  preload: false,
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-next-manrope',
  display: 'swap',
  preload: false,
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-next-outfit',
  display: 'swap',
  preload: false,
});

const fontVariablesClass = [
  plusJakartaSans.variable,
  inter.variable,
  dmSans.variable,
  lora.variable,
  dmSerifDisplay.variable,
  playfairDisplay.variable,
  manrope.variable,
  outfit.variable,
].join(' ');

export const metadata: Metadata = generateSEOMetadata({
  path: '/',
  omitCanonical: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#21150F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariablesClass}>
      <body className="min-h-screen antialiased selection:bg-terracotta-200 selection:text-espresso-900">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
