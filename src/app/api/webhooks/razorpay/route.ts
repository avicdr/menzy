import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature, processRazorpayWebhookEvent } from '@/lib/payments/razorpay';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay signature' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const eventPayload = JSON.parse(rawBody);
    const result = await processRazorpayWebhookEvent(eventPayload);

    return NextResponse.json({ received: true, ...result });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Internal webhook error' }, { status: 500 });
  }
}

