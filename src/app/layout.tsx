import type { Metadata, Viewport } from 'next';
import './globals.css';
import { generateSEOMetadata } from '@/lib/seo';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-terracotta-200 selection:text-espresso-900">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
