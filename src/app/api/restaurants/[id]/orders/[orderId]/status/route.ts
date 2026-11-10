import { NextResponse } from 'next/server';
import { verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import { updateOrderStatus } from '@/lib/orders/order-service';
import { OrderStatus } from '@prisma/client';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const auth = await verifyStaffOrOwnerAccess(id);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { status: targetStatus, reason } = body;

    const validStatuses: OrderStatus[] = [
      'PLACED',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'SERVED',
      'COMPLETED',
      'REJECTED',
      'CANCELLED',
    ];

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatus({
      orderId,
      restaurantId: auth.restaurant.id,
      targetStatus,
      staffId: auth.actorType === 'STAFF' ? auth.actorId : null,
      staffRole: auth.role,
      reason: reason || `Updated by ${auth.actorName} (${auth.role})`,
    });

    return NextResponse.json({
      success: true,
      message: `Order #${updated.orderNumber} updated to ${updated.status}.`,
      order: updated,
    });
  } catch (error: any) {
    console.error('Order status PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status.' },
      { status: 400 }
    );
  }
}

