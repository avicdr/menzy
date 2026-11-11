import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { generateSEOMetadata } from '@/lib/seo';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

const plusJakartaSans = localFont({
  src: './fonts/plus-jakarta-sans.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-next-plus-jakarta-sans',
  display: 'swap',
  preload: true,
});

const inter = localFont({
  src: './fonts/inter.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-next-inter',
  display: 'swap',
  preload: true,
});

const dmSans = localFont({
  src: './fonts/dm-sans.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-next-dm-sans',
  display: 'swap',
  preload: false,
});

const lora = localFont({
  src: './fonts/lora.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-next-lora',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

const dmSerifDisplay = localFont({
  src: './fonts/dm-serif-display.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-next-dm-serif-display',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

const playfairDisplay = localFont({
  src: './fonts/playfair-display.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-next-playfair-display',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
});

const manrope = localFont({
  src: './fonts/manrope.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-next-manrope',
  display: 'swap',
  preload: false,
});

const outfit = localFont({
  src: './fonts/outfit.woff2',
  weight: '400 700',
  style: 'normal',
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
