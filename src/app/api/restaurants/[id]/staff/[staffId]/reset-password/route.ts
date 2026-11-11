import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { hashStaffPassword } from '@/lib/auth/staff-auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id, staffId } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const staff = await prisma.restaurantStaff.findFirst({
      where: { id: staffId, restaurantId: id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const passwordHash = hashStaffPassword(newPassword);

    // Update password and revoke all existing sessions to enforce re-login
    await prisma.$transaction([
      prisma.restaurantStaff.update({
        where: { id: staffId },
        data: { passwordHash },
      }),
      prisma.staffSession.updateMany({
        where: { staffId },
        data: { revokedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Staff password reset successfully. All previous sessions revoked.',
    });
  } catch (error: any) {
    console.error('Reset staff password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

