import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { ClaimStatus } from '@prisma/client';
import { normalizeSiteUrl } from '@/lib/seo';

export function hashClaimToken(rawClaimToken: string): string {
  return crypto.createHash('sha256').update(rawClaimToken).digest('hex');
}

export function generateRawClaimToken(): string {
  return `claim_${crypto.randomBytes(16).toString('hex')}`;
}

function isLoopbackHost(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    lower.startsWith('localhost') ||
    lower.startsWith('127.0.0.1') ||
    lower.startsWith('0.0.0.0') ||
    lower.startsWith('[::1]')
  );
}

export function getRequestOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const normalizedConfigured = configured ? normalizeSiteUrl(configured) : null;

  const forwardedHostRaw = req.headers.get('x-forwarded-host');
  const forwardedHost = forwardedHostRaw ? forwardedHostRaw.split(',')[0].trim() : '';
  const forwardedProtoRaw = req.headers.get('x-forwarded-proto');
  const forwardedProto = forwardedProtoRaw ? forwardedProtoRaw.split(',')[0].trim() : 'https';

  if (forwardedHost && !forwardedHost.startsWith('0.0.0.0')) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
  }

  const hostHeader = req.headers.get('host')?.trim() || '';
  if (hostHeader && !hostHeader.startsWith('0.0.0.0')) {
    const proto = isLoopbackHost(hostHeader) ? 'http' : forwardedProto || 'https';
    return `${proto}://${hostHeader}`.replace(/\/$/, '');
  }

  if (normalizedConfigured) {
    return normalizedConfigured;
  }

  try {
    const reqUrl = new URL(req.url);
    if (reqUrl.origin && reqUrl.origin !== 'null' && !reqUrl.hostname.startsWith('0.0.0.0')) {
      return reqUrl.origin.replace(/\/$/, '');
    }
  } catch {
    // Fallback below
  }

  return 'http://localhost:3000';
}

export type ClaimPreviewState =
  | 'UNCLAIMED'
  | 'ALREADY_CLAIMED_BY_YOU'
  | 'ALREADY_CLAIMED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'INVALID';

export interface ClaimPreviewResult {
  valid: boolean;
  state: ClaimPreviewState;
  error?: string;
  expiresAt?: string;
  restaurant?: {
    id: string;
    slug: string;
    displayName: string;
    description: string | null;
    country: string;
    city: string | null;
    currency: string;
    coverUrl: string | null;
    dishCount: number;
    sampleDishes: Array<{
      id: string;
      name: string;
      priceMinor: number | null;
      currency: string;
    }>;
  };
}

export async function getClaimPreviewByToken(
  rawClaimToken: string,
  viewerUserId?: string | null
): Promise<ClaimPreviewResult> {
  const token = String(rawClaimToken || '').trim();
  if (!token) {
    return {
      valid: false,
      state: 'INVALID',
      error: 'Claim token is missing.',
    };
  }

  const claimTokenHash = hashClaimToken(token);
  const claim = await prisma.claimRequest.findUnique({
    where: { claimTokenHash },
    include: {
      restaurant: {
        include: {
          menuItems: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
            take: 6,
            select: {
              id: true,
              customName: true,
              priceMinor: true,
              currency: true,
            },
          },
          _count: {
            select: { menuItems: true },
          },
        },
      },
    },
  });

  if (!claim || !claim.restaurant) {
    return {
      valid: false,
      state: 'INVALID',
      error: 'This invitation link is invalid or unrecognized.',
    };
  }

  const r = claim.restaurant;
  const restaurantSummary = {
    id: r.id,
    slug: r.slug,
    displayName: r.displayName,
    description: r.description,
    country: r.country,
    city: r.city,
    currency: r.currency,
    coverUrl: r.coverUrl,
    dishCount: r._count.menuItems,
    sampleDishes: r.menuItems.map((m) => ({
      id: m.id,
      name: m.customName,
      priceMinor: m.priceMinor,
      currency: m.currency,
    })),
  };

  let viewerIsOwner = false;
  if (viewerUserId && r.organizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: viewerUserId,
          organizationId: r.organizationId,
        },
      },
    });
    viewerIsOwner = Boolean(membership);
  }

  if (claim.status === ClaimStatus.REJECTED) {
    return {
      valid: false,
      state: 'REVOKED',
      error: 'This invitation link has been revoked or superseded by a newer link.',
      restaurant: restaurantSummary,
    };
  }

  if (claim.status === ClaimStatus.APPROVED || (r.isClaimed && r.organizationId)) {
    if (viewerIsOwner) {
      return {
        valid: true,
        state: 'ALREADY_CLAIMED_BY_YOU',
        expiresAt: claim.expiresAt.toISOString(),
        restaurant: restaurantSummary,
      };
    }
    return {
      valid: false,
      state: 'ALREADY_CLAIMED',
      error: 'This restaurant menu has already been claimed by an owner.',
      restaurant: restaurantSummary,
    };
  }

  if (claim.expiresAt < new Date()) {
    return {
      valid: false,
      state: 'EXPIRED',
      error: 'This claim invitation link has expired. Ask the Menzy team for a fresh link.',
      expiresAt: claim.expiresAt.toISOString(),
      restaurant: restaurantSummary,
    };
  }

  return {
    valid: true,
    state: 'UNCLAIMED',
    expiresAt: claim.expiresAt.toISOString(),
    restaurant: restaurantSummary,
  };
}

export class ClaimRedeemError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function redeemClaimWithinTransaction(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: {
    rawClaimToken: string;
    userId: string;
    email: string;
    organizationId?: string | null;
    verificationNotes?: string;
  }
) {
  const token = String(params.rawClaimToken || '').trim();
  if (!token) {
    throw new ClaimRedeemError('Claim token is required.', 400);
  }

  const claimTokenHash = hashClaimToken(token);
  const claim = await tx.claimRequest.findUnique({
    where: { claimTokenHash },
    include: { restaurant: true },
  });

  if (!claim || !claim.restaurant) {
    throw new ClaimRedeemError('Invalid or unrecognized claim link.', 404);
  }

  if (claim.status === ClaimStatus.REJECTED) {
    throw new ClaimRedeemError('This invitation link is no longer active. Please request a new link.', 410);
  }

  // If the restaurant already has an owner organization, check whether the caller already owns it
  if (claim.restaurant.isClaimed && claim.restaurant.organizationId) {
    const callerMember = await tx.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: params.userId,
          organizationId: claim.restaurant.organizationId,
        },
      },
    });
    if (callerMember) {
      return {
        restaurant: claim.restaurant,
        organizationId: claim.restaurant.organizationId,
        alreadyClaimedByUser: true,
      };
    }
    throw new ClaimRedeemError('This restaurant menu has already been claimed.', 409);
  }

  if (claim.status === ClaimStatus.APPROVED) {
    throw new ClaimRedeemError('This restaurant menu has already been claimed.', 409);
  }

  if (claim.expiresAt < new Date()) {
    throw new ClaimRedeemError('This claim invitation link has expired.', 410);
  }

  // Resolve target organization or create one for this claimant
  let targetOrgId = params.organizationId || null;
  if (!targetOrgId) {
    const existingMembership = await tx.organizationMember.findFirst({
      where: { userId: params.userId },
      orderBy: { createdAt: 'asc' },
    });
    if (existingMembership) {
      targetOrgId = existingMembership.organizationId;
    } else {
      const org = await tx.organization.create({
        data: {
          name: `${claim.restaurant.displayName} Group`,
          ownerUserId: params.userId,
          billingCountry: claim.restaurant.country,
          billingCurrency: claim.restaurant.currency,
        },
      });
      await tx.organizationMember.create({
        data: {
          userId: params.userId,
          organizationId: org.id,
          role: 'OWNER',
        },
      });
      targetOrgId = org.id;
    }
  }

  // Ensure organization has at least initial onboarding image credits
  const creditCount = await tx.creditLedger.count({
    where: { organizationId: targetOrgId, creditType: 'IMAGE_GENERATION' },
  });
  if (creditCount === 0) {
    const idempotencyKey = `onboarding_credits_${targetOrgId}`;
    const existingLedger = await tx.creditLedger.findUnique({
      where: { idempotencyKey },
    });
    if (!existingLedger) {
      await tx.creditLedger.create({
        data: {
          organizationId: targetOrgId,
          creditType: 'IMAGE_GENERATION',
          delta: 15,
          balanceAfter: 15,
          reason: 'Initial complimentary onboarding image credits',
          idempotencyKey,
        },
      });
    }
  }

  // Atomically claim the demo restaurant so concurrent claim attempts cannot race
  const restaurantLock = await tx.restaurant.updateMany({
    where: {
      id: claim.restaurantId,
      isClaimed: false,
      organizationId: null,
    },
    data: {
      organizationId: targetOrgId,
      isClaimed: true,
    },
  });

  if (restaurantLock.count === 0) {
    throw new ClaimRedeemError('This restaurant menu has already been claimed.', 409);
  }

  const updatedRestaurant = await tx.restaurant.findUniqueOrThrow({
    where: { id: claim.restaurantId },
  });

  await tx.restaurantSettings.upsert({
    where: { restaurantId: updatedRestaurant.id },
    update: {},
    create: {
      restaurantId: updatedRestaurant.id,
      welcomeMessage: `Welcome to ${updatedRestaurant.displayName}! Ask our digital waiter anything.`,
      aiTone: 'Warm Editorial & Helpful',
    },
  });

  await tx.restaurantOrderingSettings.upsert({
    where: { restaurantId: updatedRestaurant.id },
    update: {},
    create: {
      restaurantId: updatedRestaurant.id,
      orderingEnabled: true,
      acceptsNewOrders: true,
      allowSpecialInstructions: true,
      paymentMode: 'PAY_AT_COUNTER',
      taxPercentage: 5.0,
      serviceChargePercentage: 0.0,
      maxActiveOrders: 50,
    },
  });

  // Ensure at least one table exists so table QR codes work out of the box
  const existingTableCount = await tx.restaurantTable.count({
    where: { restaurantId: updatedRestaurant.id, isArchived: false },
  });
  if (existingTableCount === 0) {
    const rawTableToken = `tbl_${crypto.randomBytes(16).toString('hex')}`;
    const qrTokenHash = crypto.createHash('sha256').update(rawTableToken).digest('hex');
    await tx.restaurantTable.create({
      data: {
        restaurantId: updatedRestaurant.id,
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
  const claimLock = await tx.claimRequest.updateMany({
    where: {
      id: claim.id,
      status: {
        in: [ClaimStatus.UNCLAIMED, ClaimStatus.RESERVED, ClaimStatus.PENDING_VERIFICATION],
      },
    },
    data: {
      claimantUserId: params.userId,
      claimantEmail: params.email,
      status: ClaimStatus.APPROVED,
      verifiedAt: now,
      claimedAt: now,
      verificationNotes:
        params.verificationNotes?.trim() || 'Claimed directly via private founder invitation link.',
    },
  });

  if (claimLock.count === 0) {
    throw new ClaimRedeemError('This claim invitation link is no longer active.', 409);
  }

  // Invalidate any other open claim tokens for the same restaurant
  await tx.claimRequest.updateMany({
    where: {
      restaurantId: updatedRestaurant.id,
      id: { not: claim.id },
      status: {
        in: [ClaimStatus.UNCLAIMED, ClaimStatus.RESERVED, ClaimStatus.PENDING_VERIFICATION],
      },
    },
    data: {
      status: ClaimStatus.REJECTED,
      verificationNotes: 'Superseded after restaurant ownership claim completed.',
    },
  });

  return {
    restaurant: updatedRestaurant,
    organizationId: targetOrgId,
    alreadyClaimedByUser: false,
  };
}
