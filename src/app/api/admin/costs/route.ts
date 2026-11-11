import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { calculateAllRestaurantCosts } from '@/lib/analytics/cost-calculator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await calculateAllRestaurantCosts();

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

