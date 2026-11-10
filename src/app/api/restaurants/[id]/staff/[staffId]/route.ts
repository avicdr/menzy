import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { StaffRole } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id, staffId } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const staff = await prisma.restaurantStaff.findFirst({
      where: { id: staffId, restaurantId: id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { displayName, role, isActive } = body;

    const updateData: any = {};
    if (displayName !== undefined && displayName.trim()) updateData.displayName = displayName.trim();
    if (role !== undefined) {
      const validRoles: StaffRole[] = ['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'];
      if (validRoles.includes(role)) updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      // If deactivating, revoke all active sessions immediately
      if (!isActive) {
        await prisma.staffSession.updateMany({
          where: { staffId },
          data: { revokedAt: new Date() },
        });
      }
    }

    const updated = await prisma.restaurantStaff.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        loginId: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    console.error('Staff PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id, staffId } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Revoke sessions and deactivate
    await prisma.$transaction([
      prisma.staffSession.updateMany({
        where: { staffId },
        data: { revokedAt: new Date() },
      }),
      prisma.restaurantStaff.update({
        where: { id: staffId },
        data: { isActive: false },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Staff access deactivated.' });
  } catch (error: any) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

