import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { getCache } from '@/lib/cache/redis';
import { ClaimStatus } from '@prisma/client';
import { generateRawClaimToken, hashClaimToken, getRequestOrigin } from '@/lib/claims/claim-service';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const claims = await prisma.claimRequest.findMany({
    include: {
      restaurant: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          city: true,
          country: true,
          isClaimed: true,
          organizationId: true,
        },
      },
      claimantUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ claims });
}

class AdminClaimActionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { action, claimId, restaurantId, verificationNotes } = body || {};

    if (action === 'CREATE_INVITATION' && restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, displayName: true, slug: true, isClaimed: true, organizationId: true },
      });

      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }

      if (restaurant.isClaimed || restaurant.organizationId) {
        return NextResponse.json(
          { error: 'This restaurant has already been claimed and cannot receive a new claim invitation.' },
          { status: 409 }
        );
      }

      const rawClaimToken = generateRawClaimToken();
      const claimTokenHash = hashClaimToken(rawClaimToken);
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

      const claim = await prisma.$transaction(async (tx) => {
        // Supersede any existing unclaimed/open tokens so only the latest link remains active
        await tx.claimRequest.updateMany({
          where: {
            restaurantId,
            status: {
              in: [ClaimStatus.UNCLAIMED, ClaimStatus.RESERVED, ClaimStatus.PENDING_VERIFICATION],
            },
          },
          data: {
            status: ClaimStatus.REJECTED,
            verificationNotes: 'Superseded by newly generated founder invitation link.',
          },
        });

        return tx.claimRequest.create({
          data: {
            restaurantId,
            claimTokenHash,
            status: ClaimStatus.UNCLAIMED,
            expiresAt,
            verificationNotes: verificationNotes || 'Founder generated private invitation link.',
          },
        });
      });

      await logAdminAction({
        adminEmail: session.email,
        action: 'CREATE_CLAIM_INVITATION',
        entityType: 'CLAIM_REQUEST',
        entityId: claim.id,
        afterState: { restaurantId, restaurantSlug: restaurant.slug, expiresAt },
        reason: 'Generated secure claim URL for restaurant owner',
      });

      const origin = getRequestOrigin(req);
      return NextResponse.json({
        success: true,
        claimId: claim.id,
        claimToken: rawClaimToken,
        claimUrl: `${origin}/claim/${rawClaimToken}`,
        expiresAt: expiresAt.toISOString(),
      });
    }

    if (action === 'APPROVE_CLAIM' && claimId) {
      const result = await prisma.$transaction(async (tx) => {
        const claim = await tx.claimRequest.findUnique({
          where: { id: claimId },
          include: {
            restaurant: true,
            claimantUser: { include: { memberships: true } },
          },
        });

        if (!claim || !claim.restaurant) {
          throw new AdminClaimActionError('Claim request not found', 404);
        }
        if (!claim.claimantUserId) {
          throw new AdminClaimActionError(
            'No claimant user is attached to this claim link yet. Share the claim link with the owner first.',
            400
          );
        }
        if (claim.status === ClaimStatus.REJECTED) {
          throw new AdminClaimActionError('A rejected or superseded claim cannot be approved.', 410);
        }
        if (claim.restaurant.isClaimed && claim.restaurant.organizationId) {
          throw new AdminClaimActionError('This restaurant has already been claimed by an organization.', 409);
        }

        let orgId = claim.claimantUser?.memberships?.[0]?.organizationId;
        if (!orgId) {
          const newOrg = await tx.organization.create({
            data: {
              name: `${claim.restaurant.displayName} Group`,
              ownerUserId: claim.claimantUserId,
              billingCountry: claim.restaurant.country,
              billingCurrency: claim.restaurant.currency,
            },
          });
          await tx.organizationMember.create({
            data: {
              userId: claim.claimantUserId,
              organizationId: newOrg.id,
              role: 'OWNER',
            },
          });
          orgId = newOrg.id;
        }

        const creditCount = await tx.creditLedger.count({
          where: { organizationId: orgId, creditType: 'IMAGE_GENERATION' },
        });
        if (creditCount === 0) {
          const idempotencyKey = `onboarding_credits_${orgId}`;
          const existingKey = await tx.creditLedger.findUnique({ where: { idempotencyKey } });
          if (!existingKey) {
            await tx.creditLedger.create({
              data: {
                organizationId: orgId,
                creditType: 'IMAGE_GENERATION',
                delta: 15,
                balanceAfter: 15,
                reason: 'Initial complimentary onboarding image credits',
                idempotencyKey,
              },
            });
          }
        }

        const restaurantLock = await tx.restaurant.updateMany({
          where: {
            id: claim.restaurantId,
            isClaimed: false,
            organizationId: null,
          },
          data: {
            organizationId: orgId,
            isClaimed: true,
          },
        });

        if (restaurantLock.count === 0) {
          throw new AdminClaimActionError('This restaurant has already been claimed.', 409);
        }

        await tx.restaurantSettings.upsert({
          where: { restaurantId: claim.restaurantId },
          update: {},
          create: {
            restaurantId: claim.restaurantId,
            welcomeMessage: `Welcome to ${claim.restaurant.displayName}! Ask our digital waiter anything.`,
            aiTone: 'Warm Editorial & Helpful',
          },
        });

        await tx.restaurantOrderingSettings.upsert({
          where: { restaurantId: claim.restaurantId },
          update: {},
          create: {
            restaurantId: claim.restaurantId,
            orderingEnabled: true,
            acceptsNewOrders: true,
            allowSpecialInstructions: true,
            paymentMode: 'PAY_AT_COUNTER',
            taxPercentage: 5.0,
            serviceChargePercentage: 0.0,
            maxActiveOrders: 50,
          },
        });

        const existingTableCount = await tx.restaurantTable.count({
          where: { restaurantId: claim.restaurantId, isArchived: false },
        });
        if (existingTableCount === 0) {
          const rawTableToken = `tbl_${crypto.randomBytes(16).toString('hex')}`;
          const qrTokenHash = crypto.createHash('sha256').update(rawTableToken).digest('hex');
          await tx.restaurantTable.create({
            data: {
              restaurantId: claim.restaurantId,
              name: 'Table 01',
              section: 'Main Dining',
              capacity: 4,
              qrTokenHash,
              qrVersion: 1,
              isActive: true,
            },
          });
        }

        const now = new Date();
        await tx.claimRequest.update({
          where: { id: claim.id },
          data: {
            status: ClaimStatus.APPROVED,
            verifiedAt: now,
            claimedAt: now,
            ...(verificationNotes ? { verificationNotes } : {}),
          },
        });

        await tx.claimRequest.updateMany({
          where: {
            restaurantId: claim.restaurantId,
            id: { not: claim.id },
            status: {
              in: [ClaimStatus.UNCLAIMED, ClaimStatus.RESERVED, ClaimStatus.PENDING_VERIFICATION],
            },
          },
          data: {
            status: ClaimStatus.REJECTED,
            verificationNotes: 'Superseded after ownership claim approval.',
          },
        });

        return { claim, slug: claim.restaurant.slug };
      });

      const cache = getCache();
      await cache.del(`menu:slug:${result.slug}`);

      await logAdminAction({
        adminEmail: session.email,
        action: 'APPROVE_CLAIM',
        entityType: 'CLAIM_REQUEST',
        entityId: result.claim.id,
        reason: verificationNotes || 'Verified restaurant ownership and transferred venue',
      });

      return NextResponse.json({
        success: true,
        message: 'Restaurant successfully claimed and transferred.',
      });
    }

    if (action === 'REJECT_CLAIM' && claimId) {
      const claim = await prisma.claimRequest.findUnique({ where: { id: claimId } });
      if (!claim) {
        return NextResponse.json({ error: 'Claim request not found' }, { status: 404 });
      }
      if (claim.status === ClaimStatus.APPROVED) {
        return NextResponse.json(
          { error: 'An already approved claim cannot be rejected.' },
          { status: 409 }
        );
      }

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
    if (error instanceof AdminClaimActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Claim admin error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
