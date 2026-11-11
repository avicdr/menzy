import { NextResponse } from 'next/server';
import { loadDinerMenuPayload } from '@/lib/diner/diner-menu-loader';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Restaurant slug is required' },
      { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  const result = await loadDinerMenuPayload(slug);

  if (result.status === 'NOT_FOUND') {
    return NextResponse.json(
      { error: 'Restaurant not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  if (result.status === 'PAUSED') {
    return NextResponse.json(result.pausedPayload, {
      status: 402,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }

  return NextResponse.json(result.data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
