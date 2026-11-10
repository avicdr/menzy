import { NextResponse } from 'next/server';
import { verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { bulkCreateRestaurantTables } from '@/lib/tables/table-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { count, namingPattern, section, capacity } = body;

    const parsedCount = parseInt(count, 10);
    if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      return NextResponse.json({ error: 'Count must be between 1 and 50.' }, { status: 400 });
    }

    const created = await bulkCreateRestaurantTables({
      restaurantId: id,
      count: parsedCount,
      namingPattern: namingPattern || 'Table {number}',
      section: section || 'Main Dining',
      capacity: parseInt(capacity || 4, 10),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const formatted = created.map((c) => ({
      id: c.table.id,
      name: c.table.name,
      section: c.table.section,
      capacity: c.table.capacity,
      qrVersion: c.table.qrVersion,
      isActive: c.table.isActive,
      scanUrl: `${appUrl}/m/${auth.restaurant.slug}?t=${c.rawToken}`,
      rawToken: c.rawToken,
    }));

    return NextResponse.json({
      success: true,
      createdCount: formatted.length,
      tables: formatted,
    });
  } catch (error: any) {
    console.error('Bulk tables error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

