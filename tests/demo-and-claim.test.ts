import { describe, it, expect, afterEach } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { ClaimStatus, PublicationState } from '@prisma/client';
import {
  ClaimRedeemError,
  generateRawClaimToken,
  getClaimPreviewByToken,
  hashClaimToken,
  redeemClaimWithinTransaction,
} from '../src/lib/claims/claim-service';

describe('Demo Claim Preview & Atomic Redemption Service', () => {
  const createdRestaurantIds: string[] = [];
  const createdOrganizationIds: string[] = [];
  const createdUserIds: string[] = [];

  afterEach(async () => {
    if (createdRestaurantIds.length > 0) {
      await prisma.restaurant
        .deleteMany({
          where: { id: { in: createdRestaurantIds.splice(0, createdRestaurantIds.length) } },
        })
        .catch(() => {});
    }
    if (createdOrganizationIds.length > 0) {
      await prisma.organization
        .deleteMany({
          where: { id: { in: createdOrganizationIds.splice(0, createdOrganizationIds.length) } },
        })
        .catch(() => {});
    }
    if (createdUserIds.length > 0) {
      await prisma.user
        .deleteMany({
          where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } },
        })
        .catch(() => {});
    }
  });

  async function seedUnclaimedDemo(options?: {
    expired?: boolean;
    rejected?: boolean;
    withExtraOpenToken?: boolean;
  }) {
    const suffix = crypto.randomBytes(4).toString('hex');
    const rawToken = generateRawClaimToken();
    const extraRawToken = options?.withExtraOpenToken ? generateRawClaimToken() : null;

    const restaurant = await prisma.restaurant.create({
      data: {
        slug: `test-demo-${suffix}`,
        displayName: `Test Cafe ${suffix}`,
        country: 'IN',
        city: 'Bengaluru',
        currency: 'INR',
        description: 'Artisanal sourdough and single-origin espresso.',
        publicationState: PublicationState.PUBLISHED,
        isClaimed: false,
      },
    });
    createdRestaurantIds.push(restaurant.id);

    const menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        title: 'Featured Menu',
        active: true,
      },
    });

    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: 'Small Plates',
        sortOrder: 1,
      },
    });

    await prisma.restaurantMenuItem.createMany({
      data: [
        {
          restaurantId: restaurant.id,
          menuId: menu.id,
          categoryId: category.id,
          customName: 'Paneer Tikka',
          priceMinor: 32000,
          currency: 'INR',
          isPublished: true,
          sortOrder: 1,
        },
        {
          restaurantId: restaurant.id,
          menuId: menu.id,
          categoryId: category.id,
          customName: 'Seasonal Tasting Board',
          priceMinor: null,
          currency: 'INR',
          isPublished: true,
          sortOrder: 2,
        },
      ],
    });

    await prisma.claimRequest.create({
      data: {
        restaurantId: restaurant.id,
        claimTokenHash: hashClaimToken(rawToken),
        status: options?.rejected ? ClaimStatus.REJECTED : ClaimStatus.UNCLAIMED,
        expiresAt: options?.expired
          ? new Date(Date.now() - 60 * 60 * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (extraRawToken) {
      await prisma.claimRequest.create({
        data: {
          restaurantId: restaurant.id,
          claimTokenHash: hashClaimToken(extraRawToken),
          status: ClaimStatus.UNCLAIMED,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { restaurant, rawToken, extraRawToken };
  }

  async function seedUser(prefix = 'owner') {
    const suffix = crypto.randomBytes(4).toString('hex');
    const user = await prisma.user.create({
      data: {
        email: `${prefix}.${suffix}@menzy.test`,
        name: `Test ${prefix}`,
        emailVerified: new Date(),
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  it('returns proper preview states for invalid, unclaimed, expired, revoked, and claimed tokens', async () => {
    const missing = await getClaimPreviewByToken('');
    expect(missing.valid).toBe(false);
    expect(missing.state).toBe('INVALID');

    const unknown = await getClaimPreviewByToken('claim_nonexistent_token_1234');
    expect(unknown.valid).toBe(false);
    expect(unknown.state).toBe('INVALID');

    const expiredDemo = await seedUnclaimedDemo({ expired: true });
    const expiredPreview = await getClaimPreviewByToken(expiredDemo.rawToken);
    expect(expiredPreview.valid).toBe(false);
    expect(expiredPreview.state).toBe('EXPIRED');

    const rejectedDemo = await seedUnclaimedDemo({ rejected: true });
    const rejectedPreview = await getClaimPreviewByToken(rejectedDemo.rawToken);
    expect(rejectedPreview.valid).toBe(false);
    expect(rejectedPreview.state).toBe('REVOKED');

    const validDemo = await seedUnclaimedDemo({ withExtraOpenToken: true });
    const validPreview = await getClaimPreviewByToken(validDemo.rawToken);
    expect(validPreview.valid).toBe(true);
    expect(validPreview.state).toBe('UNCLAIMED');
    expect(validPreview.restaurant?.id).toBe(validDemo.restaurant.id);
    expect(validPreview.restaurant?.dishCount).toBe(2);
    expect(validPreview.restaurant?.sampleDishes.some((d) => d.priceMinor === null)).toBe(true);

    // Redeem valid token and ensure preview updates accurately per viewer and revoked sibling stays REVOKED
    const owner = await seedUser('first');
    const redeemed = await prisma.$transaction((tx) =>
      redeemClaimWithinTransaction(tx, {
        rawClaimToken: validDemo.rawToken,
        userId: owner.id,
        email: owner.email,
      })
    );
    createdOrganizationIds.push(redeemed.organizationId);

    const ownerPreview = await getClaimPreviewByToken(validDemo.rawToken, owner.id);
    expect(ownerPreview.valid).toBe(true);
    expect(ownerPreview.state).toBe('ALREADY_CLAIMED_BY_YOU');

    const strangerPreview = await getClaimPreviewByToken(validDemo.rawToken, null);
    expect(strangerPreview.valid).toBe(false);
    expect(strangerPreview.state).toBe('ALREADY_CLAIMED');

    // Superseded sibling token must still report REVOKED, never ALREADY_CLAIMED_BY_YOU
    const siblingPreview = await getClaimPreviewByToken(validDemo.extraRawToken!, owner.id);
    expect(siblingPreview.valid).toBe(false);
    expect(siblingPreview.state).toBe('REVOKED');
  });

  it('atomically creates org, credits, settings, starter table, and supersedes open links on claim', async () => {
    const demo = await seedUnclaimedDemo({ withExtraOpenToken: true });
    const owner = await seedUser('newowner');

    const res = await prisma.$transaction((tx) =>
      redeemClaimWithinTransaction(tx, {
        rawClaimToken: demo.rawToken,
        userId: owner.id,
        email: owner.email,
        verificationNotes: 'Verified via unit test',
      })
    );
    createdOrganizationIds.push(res.organizationId);

    expect(res.alreadyClaimedByUser).toBe(false);
    expect(res.restaurant.isClaimed).toBe(true);
    expect(res.restaurant.organizationId).toBe(res.organizationId);

    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: owner.id,
          organizationId: res.organizationId,
        },
      },
    });
    expect(membership?.role).toBe('OWNER');

    const credits = await prisma.creditLedger.findMany({
      where: { organizationId: res.organizationId, creditType: 'IMAGE_GENERATION' },
    });
    expect(credits.reduce((sum, entry) => sum + entry.delta, 0)).toBe(15);

    const [settings, orderingSettings, tableCount, claims] = await Promise.all([
      prisma.restaurantSettings.findUnique({ where: { restaurantId: demo.restaurant.id } }),
      prisma.restaurantOrderingSettings.findUnique({ where: { restaurantId: demo.restaurant.id } }),
      prisma.restaurantTable.count({ where: { restaurantId: demo.restaurant.id, isArchived: false } }),
      prisma.claimRequest.findMany({ where: { restaurantId: demo.restaurant.id } }),
    ]);

    expect(settings).not.toBeNull();
    expect(orderingSettings).not.toBeNull();
    expect(tableCount).toBe(1);
    expect(claims.filter((c) => c.status === ClaimStatus.APPROVED)).toHaveLength(1);
    expect(claims.filter((c) => c.status === ClaimStatus.REJECTED)).toHaveLength(1);

    // Same user redeeming again is idempotent
    const repeat = await prisma.$transaction((tx) =>
      redeemClaimWithinTransaction(tx, {
        rawClaimToken: demo.rawToken,
        userId: owner.id,
        email: owner.email,
      })
    );
    expect(repeat.alreadyClaimedByUser).toBe(true);

    // Second user attempting to hijack the claimed token receives 409
    const intruder = await seedUser('intruder');
    await expect(
      prisma.$transaction((tx) =>
        redeemClaimWithinTransaction(tx, {
          rawClaimToken: demo.rawToken,
          userId: intruder.id,
          email: intruder.email,
        })
      )
    ).rejects.toMatchObject({ status: 409 });
  });

  it('attaches demo restaurant into an existing owner organization without duplicating orgs or failing idempotency', async () => {
    const owner = await seedUser('existingorg');
    const org = await prisma.organization.create({
      data: {
        name: 'Existing Multi-Outlet Group',
        ownerUserId: owner.id,
        billingCountry: 'IN',
        billingCurrency: 'INR',
      },
    });
    createdOrganizationIds.push(org.id);

    await prisma.organizationMember.create({
      data: {
        userId: owner.id,
        organizationId: org.id,
        role: 'OWNER',
      },
    });

    await prisma.creditLedger.create({
      data: {
        organizationId: org.id,
        creditType: 'IMAGE_GENERATION',
        delta: 15,
        balanceAfter: 15,
        reason: 'Existing credits',
        idempotencyKey: `onboarding_credits_${org.id}`,
      },
    });

    const demo = await seedUnclaimedDemo();
    const res = await prisma.$transaction((tx) =>
      redeemClaimWithinTransaction(tx, {
        rawClaimToken: demo.rawToken,
        userId: owner.id,
        email: owner.email,
      })
    );

    expect(res.organizationId).toBe(org.id);
    expect(res.restaurant.organizationId).toBe(org.id);

    const memberCount = await prisma.organizationMember.count({
      where: { userId: owner.id },
    });
    expect(memberCount).toBe(1);
  });

  it('rejects expired and revoked tokens during redemption with HTTP 410', async () => {
    const owner = await seedUser('expirycheck');
    const expiredDemo = await seedUnclaimedDemo({ expired: true });
    const rejectedDemo = await seedUnclaimedDemo({ rejected: true });

    await expect(
      prisma.$transaction((tx) =>
        redeemClaimWithinTransaction(tx, {
          rawClaimToken: expiredDemo.rawToken,
          userId: owner.id,
          email: owner.email,
        })
      )
    ).rejects.toBeInstanceOf(ClaimRedeemError);

    await expect(
      prisma.$transaction((tx) =>
        redeemClaimWithinTransaction(tx, {
          rawClaimToken: rejectedDemo.rawToken,
          userId: owner.id,
          email: owner.email,
        })
      )
    ).rejects.toMatchObject({ status: 410 });
  });
});

