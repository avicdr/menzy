import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dishora — See it. Ask it. Crave it.',
  description: 'Dishora converts static restaurant menus into beautiful, interactive AI-powered visual menus with 3D-styled food illustrations and an intelligent AI waiter.',
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
      <body className="min-h-screen antialiased selection:bg-terracotta-200 selection:text-espresso-900">
        {children}
      </body>
    </html>
  );
}

