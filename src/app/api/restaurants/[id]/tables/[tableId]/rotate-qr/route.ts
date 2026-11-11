import { NextResponse } from 'next/server';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { rotateTableQrToken } from '@/lib/tables/table-service';
import { normalizeSiteUrl } from '@/lib/seo';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const result = await rotateTableQrToken(tableId, id);

    const appUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const scanUrl = `${appUrl}/m/${auth.restaurant.slug}?t=${result.rawToken}`;

    return NextResponse.json({
      success: true,
      message: 'Table QR rotated. Previous QR codes have been invalidated.',
      table: {
        id: result.table.id,
        name: result.table.name,
        qrVersion: result.table.qrVersion,
        scanUrl,
        rawToken: result.rawToken,
      },
    });
  } catch (error: any) {
    console.error('Rotate QR error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

