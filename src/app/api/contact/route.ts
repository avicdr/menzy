import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCache } from '@/lib/cache/redis';
import { createHash } from 'crypto';

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().email('Please enter a valid work email').max(160),
  restaurantName: z.string().trim().min(2, 'Please enter your restaurant or café name').max(160),
  city: z.string().trim().max(120).optional(),
  inquiryType: z.enum(['DEMO', 'MULTI_OUTLET', 'SUPPORT', 'PARTNERSHIP']).default('DEMO'),
  message: z.string().trim().min(10, 'Please share a few details about your venue').max(2000),
});

export async function POST(req: Request) {
  try {
    const rawIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';
    const ipHash = createHash('sha256').update(rawIp.trim()).digest('hex').slice(0, 16);

    const cache = getCache();
    const rate = await cache.slidingWindowCheck(`rate:contact:${ipHash}`, 5, 900);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many inquiries submitted. Please wait a few minutes before sending another message.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || 'Please check the highlighted form fields.' },
        { status: 400 }
      );
    }

    console.info('[MenzyContactInquiry]', {
      inquiryType: parsed.data.inquiryType,
      restaurantName: parsed.data.restaurantName,
      city: parsed.data.city || null,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Thank you, ${parsed.data.name}. We received your message for ${parsed.data.restaurantName} and will reply shortly.`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to submit your message right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}
