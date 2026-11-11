import { NextResponse } from 'next/server';
import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import { getActiveServiceCalls, resolveServiceCall } from '@/lib/tables/service-call-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, undefined, { includeDetails: false });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const calls = await getActiveServiceCalls(auth.restaurant.id);
    return NextResponse.json({
      success: true,
      calls,
      restaurantId: auth.restaurant.id,
      restaurantName: auth.restaurant.displayName,
    });
  } catch (error: any) {
    console.error('Service calls GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch service calls' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, undefined, { includeDetails: false });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const body = await req.json();
    const { callId } = body;

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 });
    }

    const resolved = await resolveServiceCall(
      callId,
      auth.restaurant.id,
      auth.actorName || 'Staff'
    );

    return NextResponse.json({
      success: resolved,
      message: resolved ? 'Service call resolved' : 'Call not found or already attended',
    });
  } catch (error: any) {
    console.error('Service call PATCH error:', error);
    return NextResponse.json({ error: 'Failed to resolve service call' }, { status: 500 });
  }
}

