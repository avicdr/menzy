import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS');
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId: id },
      include: {
        table: true,
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            staff: { select: { displayName: true, role: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Restaurant single order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

