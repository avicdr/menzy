import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getOwnerSession } from '@/lib/auth/owner-auth';
import { getCache } from '@/lib/cache/redis';
import { ClaimRedeemError, redeemClaimWithinTransaction } from '@/lib/claims/claim-service';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { rawClaimToken, verificationNotes } = body || {};
    if (!rawClaimToken || typeof rawClaimToken !== 'string' || !rawClaimToken.trim()) {
      return NextResponse.json({ error: 'Claim token is required' }, { status: 400 });
    }

    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in or register to claim this menu' },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction((tx) =>
      redeemClaimWithinTransaction(tx, {
        rawClaimToken: rawClaimToken.trim(),
        userId: session.userId,
        email: session.email,
        verificationNotes: typeof verificationNotes === 'string' ? verificationNotes : undefined,
      })
    );

    const cache = getCache();
    await cache.del(`menu:slug:${result.restaurant.slug}`);

    return NextResponse.json({
      success: true,
      alreadyClaimedByUser: result.alreadyClaimedByUser,
      message: result.alreadyClaimedByUser
        ? 'You already own this restaurant menu. Opening your workspace...'
        : 'Ownership claimed! Full menu editing and billing controls are now unlocked.',
      restaurant: {
        id: result.restaurant.id,
        slug: result.restaurant.slug,
        displayName: result.restaurant.displayName,
        isClaimed: result.restaurant.isClaimed,
        organizationId: result.organizationId,
      },
    });
  } catch (error: any) {
    if (error instanceof ClaimRedeemError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Redeem claim error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
