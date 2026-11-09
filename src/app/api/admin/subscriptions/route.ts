import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession } from '@/lib/auth/admin-auth';

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter'); // 'renewing_7d', 'renewing_3d', 'renewing_24h', 'past_due', 'cancelled'

  const now = new Date();
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const in3d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  let whereClause: any = {};

  if (filter === 'renewing_24h') {
    whereClause = { paidThrough: { gte: now, lte: in24h }, status: 'ACTIVE' };
  } else if (filter === 'renewing_3d') {
    whereClause = { paidThrough: { gte: now, lte: in3d }, status: 'ACTIVE' };
  } else if (filter === 'renewing_7d') {
    whereClause = { paidThrough: { gte: now, lte: in7d }, status: 'ACTIVE' };
  } else if (filter === 'past_due') {
    whereClause = { status: 'PAST_DUE' };
  } else if (filter === 'cancelled') {
    whereClause = { status: { in: ['CANCELLED', 'CANCEL_AT_PERIOD_END'] } };
  }

  const subscriptions = await prisma.subscription.findMany({
    where: whereClause,
    include: {
      organization: {
        include: {
          restaurants: true,
          members: { include: { user: true } },
          entitlements: { where: { isActive: true } },
          creditLedgers: { take: 5, orderBy: { timestamp: 'desc' } },
        },
      },
    },
    orderBy: { paidThrough: 'asc' },
  });

  // Calculate MRR Breakdown
  const allActive = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
  });

  let inrMrr = 0;
  let usdMrr = 0;

  for (const s of allActive) {
    if (s.planKey.startsWith('IN_')) {
      if (s.planKey === 'IN_STARTER') inrMrr += 799;
      if (s.planKey === 'IN_GROWTH') inrMrr += 1499;
      if (s.planKey === 'IN_PRO') inrMrr += 3999;
    } else {
      if (s.planKey === 'US_STARTER') usdMrr += 29;
      if (s.planKey === 'US_GROWTH') usdMrr += 59;
      if (s.planKey === 'US_PRO') usdMrr += 119;
    }
  }

  return NextResponse.json({
    subscriptions,
    metrics: {
      totalActive: allActive.length,
      inrMrr,
      usdMrr,
      renewingIn7DaysCount: await prisma.subscription.count({
        where: { paidThrough: { gte: now, lte: in7d }, status: 'ACTIVE' },
      }),
      pastDueCount: await prisma.subscription.count({
        where: { status: 'PAST_DUE' },
      }),
    },
  });
}
