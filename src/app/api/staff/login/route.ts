import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  verifyStaffPassword,
  generateStaffSessionToken,
  hashToken,
  setStaffSessionCookie,
} from '@/lib/auth/staff-auth';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { loginId, password } = body;

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Staff Login ID and password are required.' },
        { status: 400 }
      );
    }

    const staff = await prisma.restaurantStaff.findUnique({
      where: { loginId: loginId.trim().toLowerCase() },
      include: {
        restaurant: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            publicationState: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Invalid staff credentials.' }, { status: 401 });
    }

    if (!staff.isActive) {
      return NextResponse.json(
        { error: 'This staff account has been deactivated by the restaurant owner.' },
        { status: 403 }
      );
    }

    const isValid = verifyStaffPassword(password, staff.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid staff credentials.' }, { status: 401 });
    }

    const subAccess = await checkRestaurantSubscriptionAccess(staff.restaurantId, { byIdOnly: true });
    if (subAccess.found && !subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || staff.restaurantId,
        restaurantSlug: subAccess.restaurant?.slug || staff.restaurant.slug,
        restaurantName: subAccess.restaurant?.displayName || staff.restaurant.displayName,
        audience: 'STAFF',
      });
    }

    // Generate secure session
    const rawToken = generateStaffSessionToken();
    const sessionTokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.staffSession.create({
      data: {
        staffId: staff.id,
        sessionTokenHash,
        expiresAt,
      },
    });

    // Update last login
    await prisma.restaurantStaff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    // Set HTTP-only cookie
    await setStaffSessionCookie(rawToken, expiresAt);

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        displayName: staff.displayName,
        loginId: staff.loginId,
        role: staff.role,
        restaurantId: staff.restaurantId,
        restaurantSlug: staff.restaurant.slug,
        restaurantName: staff.restaurant.displayName,
      },
    });
  } catch (error: any) {
    console.error('Staff login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

