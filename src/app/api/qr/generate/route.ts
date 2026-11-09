import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantSlug = searchParams.get('slug');
  const tableToken = searchParams.get('table');
  const format = searchParams.get('format') || 'dataUrl'; // 'dataUrl' or 'svg'

  if (!restaurantSlug) {
    return NextResponse.json({ error: 'Restaurant slug is required' }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: { theme: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const targetUrl = tableToken
    ? `${appUrl}/m/${restaurantSlug}?table=${tableToken}`
    : `${appUrl}/m/${restaurantSlug}`;

  const darkColor = restaurant.theme?.primaryTextColor || '#35271F';
  const lightColor = restaurant.theme?.surfaceColor || '#FFFFFF';

  if (format === 'svg') {
    const svgString = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });

    return new NextResponse(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${restaurantSlug}-qr.svg"`,
      },
    });
  }

  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });

  return NextResponse.json({
    targetUrl,
    qrDataUrl,
    restaurantName: restaurant.displayName,
    accentColor: restaurant.theme?.accentColor || '#B86D52',
    tableLabel: tableToken || null,
  });
}

