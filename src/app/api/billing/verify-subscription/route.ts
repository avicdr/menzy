import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import {
  confirmRazorpaySubscriptionPayment,
  extractRazorpayErrorMessage,
  RazorpayApiError,
} from '@/lib/payments/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const restaurantId = typeof body?.restaurantId === 'string' ? body.restaurantId.trim() : '';
    const razorpayPaymentId =
      typeof body?.razorpay_payment_id === 'string' ? body.razorpay_payment_id.trim() : '';
    const razorpaySubscriptionId =
      typeof body?.razorpay_subscription_id === 'string'
        ? body.razorpay_subscription_id.trim()
        : '';
    const razorpaySignature =
      typeof body?.razorpay_signature === 'string' ? body.razorpay_signature.trim() : '';
    const planKeyHint = typeof body?.planKey === 'string' ? body.planKey.trim() : undefined;

    if (!restaurantId || !razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay verification fields.' },
        { status: 400 }
      );
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      allowDuringExpiredSubscription: true,
    });
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const result = await confirmRazorpaySubscriptionPayment({
      organizationId: auth.restaurant.organizationId,
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
      planKeyHint,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Verify subscription error:', error);
    if (error instanceof RazorpayApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: extractRazorpayErrorMessage(error) || 'Failed to verify subscription payment.' },
      { status: 500 }
    );
  }
}

