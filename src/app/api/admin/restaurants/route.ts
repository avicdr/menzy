import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { ThemePreset, LayoutMode, PublicationState, ClaimStatus } from '@prisma/client';
import crypto from 'crypto';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    include: {
      organization: {
        include: {
          subscriptions: true,
          members: { include: { user: true } },
          entitlements: { where: { isActive: true } },
        },
      },
      menus: {
        include: {
          _count: { select: { items: true } },
        },
      },
      theme: true,
      _count: {
        select: {
          scanEvents: true,
          chatMessages: true,
          menuItems: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ restaurants });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { displayName, country, city, currency, description, sampleDishes } = body;

    if (!displayName) {
      return NextResponse.json({ error: 'Restaurant display name required' }, { status: 400 });
    }

    const baseSlug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-demo-${Math.random().toString(36).substring(2, 6)}`;

    const restaurant = await prisma.restaurant.create({
      data: {
        slug,
        displayName,
        country: country || 'IN',
        city: city || 'Mumbai',
        currency: currency || (country === 'US' ? 'USD' : 'INR'),
        description: description || 'Artisanal demo menu created by Dishora founders.',
        publicationState: PublicationState.PUBLISHED,
        isClaimed: false, // Unclaimed demo
      },
    });

    // Create default theme
    await prisma.restaurantTheme.create({
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
        isPublished: true,
      },
    });

    // Create main menu & category
    const menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        title: 'Featured Menu',
      },
    });

    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: 'Chef Specials',
        sortOrder: 1,
      },
    });

    if (Array.isArray(sampleDishes) && sampleDishes.length > 0) {
      for (const dish of sampleDishes) {
        await prisma.restaurantMenuItem.create({
          data: {
            restaurantId: restaurant.id,
            menuId: menu.id,
            categoryId: category.id,
            customName: dish.name,
            restaurantDescription: dish.description || null,
            priceMinor: dish.priceMinor || 25000,
            currency: restaurant.currency,
            isAvailable: true,
            isPublished: true,
          },
        });
      }
    }

    // Create secure claim token & request
    const rawClaimToken = `claim_${crypto.randomBytes(16).toString('hex')}`;
    const claimTokenHash = crypto.createHash('sha256').update(rawClaimToken).digest('hex');

    await prisma.claimRequest.create({
      data: {
        restaurantId: restaurant.id,
        claimTokenHash,
        status: ClaimStatus.UNCLAIMED,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        verificationNotes: 'Founder created demo menu.',
      },
    });

    await logAdminAction({
      adminEmail: session.email,
      action: 'CREATE_DEMO_RESTAURANT',
      entityType: 'RESTAURANT',
      entityId: restaurant.id,
      afterState: { id: restaurant.id, slug: restaurant.slug, name: restaurant.displayName },
      reason: 'Created authorized demo menu for prospective venue',
    });

    return NextResponse.json({
      success: true,
      restaurant,
      claimToken: rawClaimToken,
      claimUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/claim/${rawClaimToken}`,
      publicMenuUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/m/${restaurant.slug}`,
    });
  } catch (error: any) {
    console.error('Create demo restaurant error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

