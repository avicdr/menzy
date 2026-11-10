import { NextResponse } from 'next/server';
import { verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { rotateTableQrToken } from '@/lib/tables/table-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await rotateTableQrToken(tableId, id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

