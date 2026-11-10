import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Menzy — AI Digital Menus & QR Ordering',
    short_name: 'Menzy',
    description:
      'AI-powered digital restaurant menus, 3D dish visuals, table-specific QR ordering, and real-time kitchen order management.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F3EC',
    theme_color: '#21150F',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}

