import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { getOwnerSession } from '@/lib/auth/owner-auth';
import { ClaimStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { rawClaimToken, verificationNotes } = await req.json();

    if (!rawClaimToken) {
      return NextResponse.json({ error: 'Claim token is required' }, { status: 400 });
    }

    const session = await getOwnerSession();
    if (!session) {
      return NextResponse.json({ error: 'Please sign in or register to claim this menu' }, { status: 401 });
    }

    const claimTokenHash = crypto.createHash('sha256').update(rawClaimToken).digest('hex');

    const claim = await prisma.claimRequest.findUnique({
      where: { claimTokenHash },
      include: { restaurant: true },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Invalid or unrecognized claim link' }, { status: 404 });
    }

    if (claim.status === ClaimStatus.APPROVED) {
      return NextResponse.json({ error: 'This restaurant menu has already been claimed.' }, { status: 409 });
    }

    if (claim.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This claim invitation link has expired.' }, { status: 410 });
    }

    // Set claimant to current user & mark status PENDING_VERIFICATION or RESERVED
    await prisma.claimRequest.update({
      where: { id: claim.id },
      data: {
        claimantUserId: session.userId,
        claimantEmail: session.email,
        status: ClaimStatus.PENDING_VERIFICATION,
        verificationNotes: verificationNotes || 'Owner initiated claim from private invitation link.',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Claim submitted for verification. You can preview the menu in your dashboard.',
      restaurant: claim.restaurant,
    });
  } catch (error: any) {
    console.error('Redeem claim error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

