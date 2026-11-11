import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import QRCode from 'qrcode';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { buildSignedTableQrToken } from '@/lib/tables/table-service';
import { normalizeSiteUrl } from '@/lib/seo';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId: id, isArchived: false, isActive: true },
      orderBy: { name: 'asc' },
    });

    const appUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const darkColor = auth.restaurant.theme?.primaryTextColor || '#35271F';
    const lightColor = auth.restaurant.theme?.surfaceColor || '#FFFFFF';

    const qrItems = await Promise.all(
      tables.map(async (table) => {
        // Signed, version-bound unguessable QR token (invalidated automatically upon QR rotation)
        const signedToken = buildSignedTableQrToken(table);
        const scanUrl = `${appUrl}/m/${auth.restaurant.slug}?t=${encodeURIComponent(signedToken)}`;

        const qrDataUrl = await QRCode.toDataURL(scanUrl, {
          width: 500,
          margin: 2,
          color: {
            dark: darkColor,
            light: lightColor,
          },
        });

        return {
          id: table.id,
          name: table.name,
          section: table.section,
          capacity: table.capacity,
          scanUrl,
          qrDataUrl,
        };
      })
    );

    return NextResponse.json({
      restaurantName: auth.restaurant.displayName,
      restaurantSlug: auth.restaurant.slug,
      themeColors: {
        dark: darkColor,
        light: lightColor,
        accent: auth.restaurant.theme?.accentColor || '#B86D52',
      },
      tables: qrItems,
    });
  } catch (error: any) {
    console.error('QR Export error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

