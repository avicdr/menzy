import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { ThemePreset, LayoutMode, PublicationState, ClaimStatus } from '@prisma/client';
import { matchCanonicalDish } from '@/lib/canonical/matcher';
import { THEME_PRESETS, normalizeThemeFont } from '@/lib/theme/theme-presets';
import { generateRawClaimToken, hashClaimToken, getRequestOrigin } from '@/lib/claims/claim-service';

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
      claimRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          expiresAt: true,
          claimantEmail: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          scanEvents: true,
          chatMessages: true,
          menuItems: true,
          tables: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ restaurants });
}

interface IncomingDemoDish {
  name: string;
  category?: string;
  description?: string;
  priceMinor?: number;
  foodType?: string;
  dietaryLabels?: string[];
  isPopular?: boolean;
  chefRecommended?: boolean;
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

    const {
      displayName,
      country,
      city,
      currency,
      description,
      themePreset,
      tableCount,
      sampleDishes,
    } = body || {};

    const trimmedName = typeof displayName === 'string' ? displayName.trim() : '';
    if (!trimmedName) {
      return NextResponse.json({ error: 'Restaurant display name required' }, { status: 400 });
    }

    const selectedCountry = country === 'US' ? 'US' : 'IN';
    const selectedCurrency =
      currency === 'USD' || currency === 'INR'
        ? currency
        : selectedCountry === 'US'
        ? 'USD'
        : 'INR';

    const rawPreset = typeof themePreset === 'string' ? themePreset : 'WARM_EDITORIAL';
    const validPresetKeys = ['WARM_EDITORIAL', 'MIDNIGHT_ESPRESSO', 'BOTANICAL_CAFE', 'PASTEL_PATISSERIE'] as const;
    const resolvedPresetKey = (validPresetKeys as readonly string[]).includes(rawPreset)
      ? (rawPreset as (typeof validPresetKeys)[number])
      : 'WARM_EDITORIAL';
    const presetConfig = THEME_PRESETS[resolvedPresetKey] || THEME_PRESETS.WARM_EDITORIAL;

    const baseSlug =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'venue';

    let slug = `${baseSlug}-demo-${crypto.randomBytes(2).toString('hex')}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) break;
      slug = `${baseSlug}-demo-${crypto.randomBytes(3).toString('hex')}`;
    }

    const parsedTables = Math.min(20, Math.max(1, Number.parseInt(String(tableCount ?? 1), 10) || 1));

    // Normalize dishes and match canonical imagery safely prior to opening DB transaction
    const rawDishes: IncomingDemoDish[] = Array.isArray(sampleDishes) ? sampleDishes : [];
    const preparedDishes: Array<{
      name: string;
      category: string;
      description: string | null;
      priceMinor: number;
      dietaryStatus: string[];
      canonicalId: string | null;
      isPopular: boolean;
      chefRecommended: boolean;
    }> = [];

    for (const dish of rawDishes) {
      const dishName = typeof dish?.name === 'string' ? dish.name.trim() : '';
      if (!dishName) continue;

      const catName =
        typeof dish?.category === 'string' && dish.category.trim()
          ? dish.category.trim()
          : 'Chef Specials';

      const numericPrice = Number(dish?.priceMinor);
      const priceMinor =
        Number.isFinite(numericPrice) && numericPrice >= 0
          ? Math.round(numericPrice)
          : selectedCurrency === 'USD'
          ? 1400
          : 25000;

      const tagsSet = new Set<string>();
      if (typeof dish?.foodType === 'string' && dish.foodType.trim()) {
        tagsSet.add(dish.foodType.trim().toUpperCase());
      }
      if (Array.isArray(dish?.dietaryLabels)) {
        for (const label of dish.dietaryLabels) {
          if (typeof label === 'string' && label.trim()) {
            tagsSet.add(label.trim().toUpperCase());
          }
        }
      }

      let canonicalId: string | null = null;
      try {
        const matched = await matchCanonicalDish({
          dishName,
          category: catName,
          description: typeof dish?.description === 'string' ? dish.description.trim() : undefined,
        });
        canonicalId = matched.canonicalId;
      } catch {
        canonicalId = null;
      }

      preparedDishes.push({
        name: dishName,
        category: catName,
        description:
          typeof dish?.description === 'string' && dish.description.trim()
            ? dish.description.trim()
            : null,
        priceMinor,
        dietaryStatus: Array.from(tagsSet),
        canonicalId,
        isPopular: Boolean(dish?.isPopular),
        chefRecommended: Boolean(dish?.chefRecommended),
      });
    }

    const rawClaimToken = generateRawClaimToken();
    const claimTokenHash = hashClaimToken(rawClaimToken);
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

    const restaurant = await prisma.$transaction(async (tx) => {
      const createdRestaurant = await tx.restaurant.create({
        data: {
          slug,
          displayName: trimmedName,
          country: selectedCountry,
          city:
            (typeof city === 'string' ? city.trim() : '') ||
            (selectedCountry === 'IN' ? 'Mumbai' : 'Austin'),
          currency: selectedCurrency,
          timezone: selectedCountry === 'IN' ? 'Asia/Kolkata' : 'America/New_York',
          description:
            (typeof description === 'string' ? description.trim() : '') ||
            'Artisanal demo menu curated by the Menzy team.',
          publicationState: PublicationState.PUBLISHED,
          isClaimed: false,
        },
      });

      await tx.restaurantTheme.create({
        data: {
          restaurantId: createdRestaurant.id,
          presetKey: ThemePreset[resolvedPresetKey],
          backgroundColor: presetConfig.backgroundColor,
          surfaceColor: presetConfig.surfaceColor,
          primaryTextColor: presetConfig.primaryTextColor,
          secondaryTextColor: presetConfig.secondaryTextColor,
          accentColor: presetConfig.accentColor,
          secondaryAccentColor: presetConfig.secondaryAccentColor,
          headingFont: normalizeThemeFont(presetConfig.headingFont, 'Lora'),
          bodyFont: normalizeThemeFont(presetConfig.bodyFont, 'DM Sans'),
          layoutMode:
            presetConfig.layoutMode === 'LIST' ? LayoutMode.LIST : LayoutMode.GRID,
          cardRadius: presetConfig.cardRadius,
          buttonStyle: presetConfig.buttonStyle,
          imageProportions: presetConfig.imageProportions,
          texture: presetConfig.texture,
          isPublished: true,
        },
      });

      await tx.restaurantSettings.create({
        data: {
          restaurantId: createdRestaurant.id,
          welcomeMessage: `Welcome to ${trimmedName}! Explore our interactive menu or ask our digital waiter anything.`,
          aiTone: 'Warm Editorial & Helpful',
        },
      });

      await tx.restaurantOrderingSettings.create({
        data: {
          restaurantId: createdRestaurant.id,
          orderingEnabled: true,
          acceptsNewOrders: true,
          allowSpecialInstructions: true,
          paymentMode: 'PAY_AT_COUNTER',
          taxPercentage: 5.0,
          serviceChargePercentage: 0.0,
          maxActiveOrders: 50,
        },
      });

      for (let i = 1; i <= parsedTables; i++) {
        const rawTableToken = `tbl_${crypto.randomBytes(16).toString('hex')}`;
        const qrTokenHash = crypto.createHash('sha256').update(rawTableToken).digest('hex');
        const label = `Table ${String(i).padStart(2, '0')}`;
        await tx.restaurantTable.create({
          data: {
            restaurantId: createdRestaurant.id,
            name: label,
            section: 'Main Dining',
            capacity: 4,
            qrTokenHash,
            qrVersion: 1,
            isActive: true,
          },
        });
      }

      const menu = await tx.menu.create({
        data: {
          restaurantId: createdRestaurant.id,
          title: 'Featured Menu',
          active: true,
        },
      });

      const categoryNames = Array.from(
        new Set(
          preparedDishes.length > 0
            ? preparedDishes.map((d) => d.category)
            : ['Chef Specials']
        )
      );

      const categoryMap = new Map<string, string>();
      for (let idx = 0; idx < categoryNames.length; idx++) {
        const catName = categoryNames[idx];
        const createdCategory = await tx.menuCategory.create({
          data: {
            menuId: menu.id,
            name: catName,
            sortOrder: idx + 1,
          },
        });
        categoryMap.set(catName, createdCategory.id);
      }

      for (let idx = 0; idx < preparedDishes.length; idx++) {
        const dish = preparedDishes[idx];
        const categoryId =
          categoryMap.get(dish.category) || Array.from(categoryMap.values())[0];

        await tx.restaurantMenuItem.create({
          data: {
            restaurantId: createdRestaurant.id,
            menuId: menu.id,
            categoryId,
            canonicalId: dish.canonicalId,
            customName: dish.name,
            restaurantDescription: dish.description,
            priceMinor: dish.priceMinor,
            currency: selectedCurrency,
            dietaryStatus: dish.dietaryStatus,
            isAvailable: true,
            isPublished: true,
            isPopular: dish.isPopular,
            chefRecommended: dish.chefRecommended,
            sortOrder: idx + 1,
          },
        });
      }

      await tx.claimRequest.create({
        data: {
          restaurantId: createdRestaurant.id,
          claimTokenHash,
          status: ClaimStatus.UNCLAIMED,
          expiresAt,
          verificationNotes: 'Founder created demo menu.',
        },
      });

      return createdRestaurant;
    });

    const canonicalMatchedCount = preparedDishes.filter((d) => Boolean(d.canonicalId)).length;

    await logAdminAction({
      adminEmail: session.email,
      action: 'CREATE_DEMO_RESTAURANT',
      entityType: 'RESTAURANT',
      entityId: restaurant.id,
      afterState: {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.displayName,
        dishCount: preparedDishes.length,
        canonicalMatchedCount,
        themePreset: resolvedPresetKey,
      },
      reason: 'Created authorized demo menu for prospective venue',
    });

    const origin = getRequestOrigin(req);

    return NextResponse.json({
      success: true,
      restaurant,
      claimToken: rawClaimToken,
      claimUrl: `${origin}/claim/${rawClaimToken}`,
      publicMenuUrl: `${origin}/m/${restaurant.slug}`,
      dishCount: preparedDishes.length,
      canonicalMatchedCount,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Create demo restaurant error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
