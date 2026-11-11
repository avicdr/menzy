import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { buildSignedTableQrToken, createRestaurantTable } from '@/lib/tables/table-service';
import { normalizeSiteUrl } from '@/lib/seo';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const tables = await prisma.restaurantTable.findMany({
      where: {
        restaurantId: auth.restaurant.id,
        isArchived: false,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'],
                },
              },
            },
          },
        },
      },
    });

    const appUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const formatted = tables.map((t) => {
      const signedToken = buildSignedTableQrToken(t);
      return {
        id: t.id,
        name: t.name,
        section: t.section,
        capacity: t.capacity,
        qrVersion: t.qrVersion,
        isActive: t.isActive,
        activeOrderCount: t._count.orders,
        scanUrl: `${appUrl}/m/${auth.restaurant.slug}?t=${encodeURIComponent(signedToken)}`,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json({ tables: formatted });
  } catch (error: any) {
    console.error('Tables GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id, {
      includeOrderingSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const body = await req.json();
    const { name, section, capacity } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Table name is required.' }, { status: 400 });
    }

    // Check duplicate name
    const existing = await prisma.restaurantTable.findFirst({
      where: {
        restaurantId: id,
        name: name.trim(),
        isArchived: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A table named "${name.trim()}" already exists in this restaurant.` },
        { status: 400 }
      );
    }

    const result = await createRestaurantTable({
      restaurantId: id,
      name: name.trim(),
      section: section?.trim() || 'Main Dining',
      capacity: parseInt(capacity || 4, 10),
    });

    const appUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const scanUrl = `${appUrl}/m/${auth.restaurant.slug}?t=${result.rawToken}`;

    return NextResponse.json({
      success: true,
      table: {
        id: result.table.id,
        name: result.table.name,
        section: result.table.section,
        capacity: result.table.capacity,
        qrVersion: result.table.qrVersion,
        isActive: result.table.isActive,
        scanUrl,
        rawToken: result.rawToken,
      },
    });
  } catch (error: any) {
    console.error('Table POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

