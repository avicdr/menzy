import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';

export async function PATCH(
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

    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId: id },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { name, section, capacity, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'Table name cannot be empty.' }, { status: 400 });
      }
      // Check duplicate name
      const duplicate = await prisma.restaurantTable.findFirst({
        where: {
          restaurantId: id,
          name: trimmed,
          id: { not: tableId },
          isArchived: false,
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Another table named "${trimmed}" already exists.` },
          { status: 400 }
        );
      }
      updateData.name = trimmed;
    }

    if (section !== undefined) updateData.section = section?.trim() || 'Main Dining';
    if (capacity !== undefined) updateData.capacity = parseInt(capacity, 10) || 4;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: updateData,
    });

    return NextResponse.json({ success: true, table: updated });
  } catch (error: any) {
    console.error('Table PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, restaurantId: id },
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found.' }, { status: 404 });
    }

    // Soft-archive to preserve order history
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        isArchived: true,
        isActive: false,
      },
    });

    return NextResponse.json({ success: true, message: 'Table archived successfully.' });
  } catch (error: any) {
    console.error('Table DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

