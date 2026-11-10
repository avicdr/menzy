import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/db/prisma';
import { verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { buildSignedTableQrToken } from '@/lib/tables/table-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantSlug = searchParams.get('slug');
  const tableToken = searchParams.get('t') || searchParams.get('table');
  const tableId = searchParams.get('tableId');
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

  // Generating or fetching a table-specific QR requires verified restaurant owner access
  // so diners at one table cannot obtain or mint QR tokens for other tables.
  if (tableId || tableToken) {
    const auth = await verifyRestaurantOwnerAccess(restaurant.id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  let tableLabel: string | null = null;
  let effectiveTableToken = tableToken || null;

  if (tableId) {
    const tbl = await prisma.restaurantTable.findFirst({
      where: {
        id: tableId,
        restaurantId: restaurant.id,
        isArchived: false,
      },
    });
    if (!tbl) {
      return NextResponse.json({ error: 'Table not found for this restaurant' }, { status: 404 });
    }
    tableLabel = tbl.name;
    if (!effectiveTableToken) {
      effectiveTableToken = buildSignedTableQrToken(tbl);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const targetUrl = effectiveTableToken
    ? `${appUrl}/m/${restaurantSlug}?t=${encodeURIComponent(effectiveTableToken)}`
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
        'Content-Disposition': `attachment; filename="${restaurantSlug}-${tableLabel || 'menu'}-qr.svg"`,
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
    tableLabel: tableLabel || null,
  });
}
