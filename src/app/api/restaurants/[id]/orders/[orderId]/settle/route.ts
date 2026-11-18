import { NextResponse } from 'next/server';
import {
  createTenantAccessDeniedResponse,
  verifyStaffOrOwnerAccess,
} from '@/lib/auth/tenant-verify';
import {
  CustomerServiceError,
  settleOrderPayment,
} from '@/lib/customers/customer-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    if (auth.role !== 'OWNER' && auth.role !== 'MANAGER' && auth.role !== 'WAITER') {
      return NextResponse.json(
        { error: 'Only owners, managers, or floor staff can settle order payments.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    let paidMinor: number;
    if (body?.paidMinor !== undefined) {
      paidMinor = Math.round(Number(body.paidMinor));
    } else if (body?.paidMajor !== undefined) {
      paidMinor = Math.round(Number(body.paidMajor) * 100);
    } else {
      return NextResponse.json({ error: 'paidMinor or paidMajor is required.' }, { status: 400 });
    }

    const result = await settleOrderPayment({
      restaurantId: auth.restaurant.id,
      orderId,
      paidMinor,
      markCompleted: body?.markCompleted !== false,
      customerName: typeof body?.customerName === 'string' ? body.customerName : null,
      customerMobile: typeof body?.customerMobile === 'string' ? body.customerMobile : null,
      note: typeof body?.note === 'string' ? body.note : null,
      recordedBy: auth.actorName || auth.role,
      staffId: auth.actorType === 'STAFF' ? auth.actorId : null,
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      customerCreditBalanceMinor: result.customerCreditBalanceMinor,
    });
  } catch (error: any) {
    if (error instanceof CustomerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Order settle payment error:', error);
    return NextResponse.json({ error: 'Failed to settle order payment.' }, { status: 500 });
  }
}
