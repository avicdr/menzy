import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyRestaurantOwnerAccess } from '@/lib/auth/tenant-verify';
import { hashStaffPassword } from '@/lib/auth/staff-auth';
import { StaffRole } from '@prisma/client';

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

    const staffMembers = await prisma.restaurantStaff.findMany({
      where: { restaurantId: auth.restaurant.id },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ staff: staffMembers });
  } catch (error: any) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyRestaurantOwnerAccess(id);
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const body = await req.json();
    const { displayName, loginId, password, role } = body;

    if (!displayName || !loginId || !password) {
      return NextResponse.json(
        { error: 'Display name, Login ID, and password are required.' },
        { status: 400 }
      );
    }

    const normalizedLoginId = loginId.trim().toLowerCase();
    if (normalizedLoginId.length < 3) {
      return NextResponse.json(
        { error: 'Login ID must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check unique loginId
    const existing = await prisma.restaurantStaff.findUnique({
      where: { loginId: normalizedLoginId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Login ID "${normalizedLoginId}" is already taken. Please choose another.` },
        { status: 400 }
      );
    }

    const validRoles: StaffRole[] = ['OWNER', 'MANAGER', 'KITCHEN', 'WAITER'];
    const assignedRole: StaffRole = validRoles.includes(role) ? role : 'KITCHEN';

    const passwordHash = hashStaffPassword(password);

    const newStaff = await prisma.restaurantStaff.create({
      data: {
        restaurantId: auth.restaurant.id,
        displayName: displayName.trim(),
        loginId: normalizedLoginId,
        passwordHash,
        role: assignedRole,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
        loginId: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error: any) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

