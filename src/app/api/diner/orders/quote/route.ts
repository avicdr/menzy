import { NextResponse } from 'next/server';
import { calculateOrderQuote } from '@/lib/orders/order-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, items } = body;

    if (!restaurantId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'restaurantId and items array are required.' },
        { status: 400 }
      );
    }

    const quote = await calculateOrderQuote(restaurantId, items);

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Order quote error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

