import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { hashPassword, createOwnerToken, setOwnerSessionCookie } from '@/lib/auth/owner-auth';
import { getCache } from '@/lib/cache/redis';
import { ClaimRedeemError, redeemClaimWithinTransaction } from '@/lib/claims/claim-service';
import { resolveVisitorRegion } from '@/lib/geo/region-server';
import { ThemePreset, LayoutMode } from '@prisma/client';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const {
      email,
      password,
      name,
      restaurantName,
      country,
      city,
      currency,
      claimToken,
      verificationNotes,
    } = body || {};

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const trimmedClaimToken = typeof claimToken === 'string' ? claimToken.trim() : '';
    const trimmedRestaurantName = typeof restaurantName === 'string' ? restaurantName.trim() : '';
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email address and password are required.' },
        { status: 400 }
      );
    }

    if (!trimmedClaimToken && !trimmedRestaurantName) {
      return NextResponse.json(
        { error: 'Email, password, and restaurant name are required.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const geo = await resolveVisitorRegion(req.headers);
    const selectedCountry: 'IN' | 'US' = geo.authoritative
      ? geo.region
      : country === 'US'
      ? 'US'
      : 'IN';
    const selectedCurrency: 'INR' | 'USD' = selectedCountry === 'US' ? 'USD' : 'INR';

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: trimmedName || trimmedRestaurantName || normalizedEmail.split('@')[0],
          passwordHash,
          emailVerified: new Date(),
        },
      });

      // Path A: Claiming a pre-built Founder Demo directly during signup (no duplicate blank restaurant!)
      if (trimmedClaimToken) {
        const claimed = await redeemClaimWithinTransaction(tx, {
          rawClaimToken: trimmedClaimToken,
          userId: user.id,
          email: user.email,
          verificationNotes: typeof verificationNotes === 'string' ? verificationNotes : undefined,
        });

        return {
          user,
          restaurant: claimed.restaurant,
          claimed: true,
        };
      }

      // Path B: Standard self-serve restaurant signup
      const org = await tx.organization.create({
        data: {
          name: `${trimmedRestaurantName} Group`,
          ownerUserId: user.id,
          billingCountry: selectedCountry,
          billingCurrency: selectedCurrency,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      const baseSlug =
        trimmedRestaurantName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || 'venue';

      let slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await tx.restaurant.findUnique({ where: { slug }, select: { id: true } });
        if (!existing) break;
        slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
      }

      const restaurant = await tx.restaurant.create({
        data: {
          organizationId: org.id,
          slug,
          displayName: trimmedRestaurantName,
          country: selectedCountry,
          city: (typeof city === 'string' ? city.trim() : '') || (selectedCountry === 'IN' ? 'Bengaluru' : 'San Francisco'),
          currency: selectedCurrency,
          timezone: selectedCountry === 'IN' ? 'Asia/Kolkata' : 'America/New_York',
        },
      });

      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          welcomeMessage: `Welcome to ${trimmedRestaurantName}! Ask our digital waiter anything.`,
          aiTone: 'warm, hospitable, knowledgeable',
        },
      });

      await tx.restaurantOrderingSettings.create({
        data: {
          restaurantId: restaurant.id,
          orderingEnabled: true,
          acceptsNewOrders: true,
          allowSpecialInstructions: true,
          paymentMode: 'PAY_AT_COUNTER',
          taxPercentage: 5.0,
          serviceChargePercentage: 0.0,
          maxActiveOrders: 50,
        },
      });

      const rawTableToken = `tbl_${crypto.randomBytes(16).toString('hex')}`;
      const qrTokenHash = crypto.createHash('sha256').update(rawTableToken).digest('hex');
      await tx.restaurantTable.create({
        data: {
          restaurantId: restaurant.id,
          name: 'Table 01',
          section: 'Main Dining',
          capacity: 4,
          qrTokenHash,
          qrVersion: 1,
          isActive: true,
        },
      });

      await tx.restaurantTheme.create({
        data: {
          restaurantId: restaurant.id,
          presetKey: ThemePreset.WARM_EDITORIAL,
          backgroundColor: '#F7F3EC',
          surfaceColor: '#FFFFFF',
          primaryTextColor: '#35271F',
          secondaryTextColor: '#7C695C',
          accentColor: '#B86D52',
          secondaryAccentColor: '#70816B',
          headingFont: 'Lora',
          bodyFont: 'DM Sans',
          layoutMode: LayoutMode.GRID,
          cardRadius: '16px',
          buttonStyle: 'rounded',
          imageProportions: 'square',
          texture: 'none',
          isPublished: true,
        },
      });

      const menu = await tx.menu.create({
        data: {
          restaurantId: restaurant.id,
          title: 'Main Menu',
        },
      });

      await tx.menuCategory.createMany({
        data: [
          { menuId: menu.id, name: 'Beverages', sortOrder: 1 },
          { menuId: menu.id, name: 'Small Plates', sortOrder: 2 },
          { menuId: menu.id, name: 'Main Courses', sortOrder: 3 },
          { menuId: menu.id, name: 'Desserts', sortOrder: 4 },
        ],
      });

      await tx.creditLedger.create({
        data: {
          organizationId: org.id,
          creditType: 'IMAGE_GENERATION',
          delta: 15,
          balanceAfter: 15,
          reason: 'Initial complimentary onboarding image credits',
          idempotencyKey: `onboarding_credits_${org.id}`,
        },
      });

      return { user, restaurant, claimed: false };
    });

    if (result.claimed) {
      const cache = getCache();
      await cache.del(`menu:slug:${result.restaurant.slug}`);
    }

    const token = createOwnerToken(result.user.id, result.user.email);
    await setOwnerSessionCookie(token);

    return NextResponse.json({
      success: true,
      claimed: result.claimed,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      restaurant: {
        id: result.restaurant.id,
        slug: result.restaurant.slug,
        name: result.restaurant.displayName,
      },
    });
  } catch (error: any) {
    if (error instanceof ClaimRedeemError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
