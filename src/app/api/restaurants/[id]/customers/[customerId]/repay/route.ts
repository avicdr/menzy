import { NextResponse } from 'next/server';
import {
  createTenantAccessDeniedResponse,
  verifyStaffOrOwnerAccess,
} from '@/lib/auth/tenant-verify';
import {
  CustomerServiceError,
  recordCustomerRepayment,
} from '@/lib/customers/customer-service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const { id, customerId } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    if (auth.role !== 'OWNER' && auth.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only owners or managers can record credit repayments.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    let amountMinor: number;
    if (body?.amountMinor !== undefined) {
      amountMinor = Math.round(Number(body.amountMinor));
    } else if (body?.amountMajor !== undefined) {
      amountMinor = Math.round(Number(body.amountMajor) * 100);
    } else {
      return NextResponse.json({ error: 'amountMinor or amountMajor is required.' }, { status: 400 });
    }

    const result = await recordCustomerRepayment({
      restaurantId: auth.restaurant.id,
      customerId,
      amountMinor,
      note: typeof body?.note === 'string' ? body.note : null,
      recordedBy: auth.actorName || auth.role,
    });

    return NextResponse.json({
      success: true,
      customer: result.customer,
      ledgerEntry: result.ledgerEntry,
    });
  } catch (error: any) {
    if (error instanceof CustomerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Customer repayment error:', error);
    return NextResponse.json({ error: 'Failed to record repayment.' }, { status: 500 });
  }
}
