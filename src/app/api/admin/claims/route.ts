import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { ClaimStatus } from '@prisma/client';
import crypto from 'crypto';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const claims = await prisma.claimRequest.findMany({
    include: {
      restaurant: true,
      claimantUser: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ claims });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, claimId, restaurantId, verificationNotes } = body;

    if (action === 'CREATE_INVITATION' && restaurantId) {
      const rawClaimToken = `claim_${crypto.randomBytes(16).toString('hex')}`;
      const claimTokenHash = crypto.createHash('sha256').update(rawClaimToken).digest('hex');

      const claim = await prisma.claimRequest.create({
        data: {
          restaurantId,
          claimTokenHash,
          status: ClaimStatus.UNCLAIMED,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          verificationNotes: verificationNotes || 'Founder generated private invitation link.',
        },
      });

      await logAdminAction({
        adminEmail: session.email,
        action: 'CREATE_CLAIM_INVITATION',
        entityType: 'CLAIM_REQUEST',
        entityId: claim.id,
        reason: 'Generated secure claim URL for restaurant owner',
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.json({
        success: true,
        claimToken: rawClaimToken,
        claimUrl: `${appUrl}/claim/${rawClaimToken}`,
      });
    }

    if (action === 'APPROVE_CLAIM' && claimId) {
      const claim = await prisma.claimRequest.findUnique({
        where: { id: claimId },
        include: { restaurant: true, claimantUser: { include: { memberships: true } } },
      });

      if (!claim || !claim.claimantUserId) {
        return NextResponse.json({ error: 'Claim or claimant user not found' }, { status: 404 });
      }

      // Find claimant's organization or create one
      let orgId = claim.claimantUser?.memberships?.[0]?.organizationId;

      if (!orgId) {
        const newOrg = await prisma.organization.create({
          data: {
            name: `${claim.restaurant.displayName} Group`,
            ownerUserId: claim.claimantUserId,
            billingCountry: claim.restaurant.country,
            billingCurrency: claim.restaurant.currency,
          },
        });
        await prisma.organizationMember.create({
          data: {
            userId: claim.claimantUserId,
            organizationId: newOrg.id,
            role: 'OWNER',
          },
        });
        orgId = newOrg.id;
      }

      // Associate restaurant with the organization & mark claimed
      await prisma.$transaction([
        prisma.restaurant.update({
          where: { id: claim.restaurantId },
          data: {
            organizationId: orgId,
            isClaimed: true,
          },
        }),
        prisma.claimRequest.update({
          where: { id: claim.id },
          data: {
            status: ClaimStatus.APPROVED,
            verifiedAt: new Date(),
            claimedAt: new Date(),
          },
        }),
      ]);

      await logAdminAction({
        adminEmail: session.email,
        action: 'APPROVE_CLAIM',
        entityType: 'CLAIM_REQUEST',
        entityId: claim.id,
        reason: verificationNotes || 'Verified restaurant ownership and transferred venue',
      });

      return NextResponse.json({ success: true, message: 'Restaurant successfully claimed and transferred.' });
    }

    if (action === 'REJECT_CLAIM' && claimId) {
      await prisma.claimRequest.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.REJECTED,
          verificationNotes: verificationNotes || 'Rejected by founder.',
        },
      });

      await logAdminAction({
        adminEmail: session.email,
        action: 'REJECT_CLAIM',
        entityType: 'CLAIM_REQUEST',
        entityId: claimId,
        reason: verificationNotes || 'Rejected ownership claim',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid claim action' }, { status: 400 });
  } catch (error: any) {
    console.error('Claim admin error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
