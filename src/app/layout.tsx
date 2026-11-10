import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Menzy — See it. Ask it. Crave it.',
  description: 'Menzy converts static restaurant menus into beautiful, interactive AI-powered visual menus with 3D-styled food illustrations and an intelligent AI waiter.',
  icons: {
    icon: '/favicon.ico',
  },
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
      </body>
    </html>
  );
}

