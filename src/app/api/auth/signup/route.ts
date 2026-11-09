import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword, createOwnerToken, setOwnerSessionCookie } from '@/lib/auth/owner-auth';
import { ThemePreset, LayoutMode } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, restaurantName, country, city, currency } = body;

    if (!email || !password || !restaurantName) {
      return NextResponse.json(
        { error: 'Email, password, and restaurant name are required.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const selectedCountry = country === 'US' ? 'US' : 'IN';
    const selectedCurrency = currency || (selectedCountry === 'US' ? 'USD' : 'INR');

    // Create user, organization, membership, and initial restaurant in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || restaurantName,
          passwordHash,
          emailVerified: new Date(),
        },
      });

      const org = await tx.organization.create({
        data: {
          name: `${restaurantName} Group`,
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

      // Generate clean unique slug
      const baseSlug = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug || 'venue'}-${uniqueSuffix}`;

      const restaurant = await tx.restaurant.create({
        data: {
          organizationId: org.id,
          slug,
          displayName: restaurantName,
          country: selectedCountry,
          city: city || (selectedCountry === 'IN' ? 'Bengaluru' : 'San Francisco'),
          currency: selectedCurrency,
          timezone: selectedCountry === 'IN' ? 'Asia/Kolkata' : 'America/New_York',
        },
      });

      // Default settings & theme
      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          welcomeMessage: `Welcome to ${restaurantName}! Ask our digital waiter anything.`,
          aiTone: 'warm, hospitable, knowledgeable',
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
          headingFont: 'Instrument Serif',
          bodyFont: 'DM Sans',
          layoutMode: LayoutMode.GRID,
          cardRadius: '16px',
          buttonStyle: 'rounded',
          imageProportions: 'square',
          texture: 'none',
          isPublished: true,
        },
      });

      // Default menu & starter categories
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

      // Initial free onboarding image credit ledger (15 credits)
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

      return { user, org, restaurant };
    });

    const token = createOwnerToken(result.user.id, result.user.email);
    await setOwnerSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      restaurant: { id: result.restaurant.id, slug: result.restaurant.slug, name: result.restaurant.displayName },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
