import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { ThemePreset, LayoutMode, PublicationState, ClaimStatus } from '@prisma/client';
import { matchCanonicalDishesBatch } from '@/lib/canonical/matcher';
import { THEME_PRESETS, normalizeThemeFont } from '@/lib/theme/theme-presets';
import { generateRawClaimToken, hashClaimToken, getRequestOrigin } from '@/lib/claims/claim-service';
import {
  deduplicateDishCollection,
  isGenericCategory,
  mergeDietaryLabelsSafely,
  normalizeCategoryKey,
  resolvePrimaryDietaryBucket,
} from '@/lib/menu/deduplicate';
import { validateBannerUrlInput } from '@/lib/banner/banner-validation';
import { getCache } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      slug: true,
      displayName: true,
      description: true,
      country: true,
      city: true,
      currency: true,
      coverUrl: true,
      publicationState: true,
      isClaimed: true,
      organizationId: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          subscriptions: {
            take: 1,
            select: {
              id: true,
              planKey: true,
              status: true,
              paidThrough: true,
            },
          },
        },
      },
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

  return NextResponse.json(
    { restaurants },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const restaurantId = typeof body?.restaurantId === 'string' ? body.restaurantId.trim() : '';
    const confirmationName =
      typeof body?.confirmationName === 'string' ? body.confirmationName.trim() : '';

    if (!restaurantId || !confirmationName) {
      return NextResponse.json(
        { error: 'restaurantId and confirmationName are required.' },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        slug: true,
        displayName: true,
        organizationId: true,
        isClaimed: true,
        _count: {
          select: { menuItems: true, orders: true, tables: true, staff: true },
        },
      },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    }
    if (confirmationName !== restaurant.displayName) {
      return NextResponse.json(
        { error: 'Confirmation name does not match the restaurant name.' },
        { status: 400 }
      );
    }

    await prisma.restaurant.delete({ where: { id: restaurant.id } });
    await getCache().del(`menu:slug:${restaurant.slug}`);
    await logAdminAction({
      adminEmail: session.email,
      action: 'DELETE_RESTAURANT',
      entityType: 'RESTAURANT',
      entityId: restaurant.id,
      beforeState: restaurant,
      reason: `Founder permanently removed restaurant "${restaurant.displayName}"`,
    });

    return NextResponse.json({ success: true, deletedRestaurantId: restaurant.id });
  } catch (error: any) {
    console.error('Delete restaurant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete restaurant.' },
      { status: 500 }
    );
  }
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
      coverUrl,
      themePreset,
      tableCount,
      sampleDishes,
    } = body || {};

    const trimmedName = typeof displayName === 'string' ? displayName.trim() : '';
    if (!trimmedName) {
      return NextResponse.json({ error: 'Restaurant display name required' }, { status: 400 });
    }

    const coverUrlValidation = validateBannerUrlInput(coverUrl);
    if (!coverUrlValidation.ok) {
      return NextResponse.json({ error: coverUrlValidation.error }, { status: 400 });
    }
    const resolvedCoverUrl = coverUrlValidation.value ?? null;

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

    // Normalize dishes and match canonical imagery in a single batch prior to opening DB transaction
    const rawDishes: IncomingDemoDish[] = Array.isArray(sampleDishes) ? sampleDishes : [];
    const preparedDrafts: Array<{
      name: string;
      category: string;
      description: string | null;
      priceMinor: number;
      dietaryStatus: string[];
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

      preparedDrafts.push({
        name: dishName,
        category: catName,
        description:
          typeof dish?.description === 'string' && dish.description.trim()
            ? dish.description.trim()
            : null,
        priceMinor,
        dietaryStatus: Array.from(tagsSet),
        isPopular: Boolean(dish?.isPopular),
        chefRecommended: Boolean(dish?.chefRecommended),
      });
    }

    // Deduplicate dishes server-side before canonical matching and DB writes
    const { uniqueItems: uniqueDrafts, duplicatesRemoved: duplicatesSkippedCount } =
      deduplicateDishCollection(
        preparedDrafts,
        (d) => ({
          name: d.name,
          category: d.category,
          priceMinor: d.priceMinor,
          dietaryBucket: resolvePrimaryDietaryBucket(d.dietaryStatus),
        }),
        (existing, dup) => {
          const mergedCategory =
            isGenericCategory(existing.category) && !isGenericCategory(dup.category)
              ? dup.category
              : existing.category;
          const mergedPrice =
            existing.priceMinor > 0 ? existing.priceMinor : dup.priceMinor;
          const existingDesc = existing.description?.trim() || '';
          const dupDesc = dup.description?.trim() || '';
          const mergedDesc =
            dupDesc.length > existingDesc.length
              ? dupDesc
              : existingDesc || null;

          return {
            ...existing,
            category: mergedCategory,
            description: mergedDesc,
            priceMinor: mergedPrice,
            dietaryStatus: mergeDietaryLabelsSafely(
              existing.dietaryStatus,
              dup.dietaryStatus
            ),
            isPopular: existing.isPopular || dup.isPopular,
            chefRecommended: existing.chefRecommended || dup.chefRecommended,
          };
        }
      );

    let matchResults: Array<{ canonicalId: string | null }> = [];
    try {
      matchResults = await matchCanonicalDishesBatch(
        uniqueDrafts.map((d) => ({
          dishName: d.name,
          category: d.category,
          description: d.description || undefined,
          dietaryLabels: d.dietaryStatus,
        })),
        { useGemini: true }
      );
    } catch {
      matchResults = [];
    }

    const preparedDishes = uniqueDrafts.map((d, idx) => ({
      ...d,
      canonicalId: matchResults[idx]?.canonicalId ?? null,
    }));

    const rawClaimToken = generateRawClaimToken();
    const claimTokenHash = hashClaimToken(rawClaimToken);
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

    const restaurant = await prisma.$transaction(
      async (tx) => {
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
            coverUrl: resolvedCoverUrl,
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

        const tablesData = Array.from({ length: parsedTables }, (_, idx) => {
          const i = idx + 1;
          const rawTableToken = `tbl_${crypto.randomBytes(16).toString('hex')}`;
          const qrTokenHash = crypto.createHash('sha256').update(rawTableToken).digest('hex');
          return {
            restaurantId: createdRestaurant.id,
            name: `Table ${String(i).padStart(2, '0')}`,
            section: 'Main Dining',
            capacity: 4,
            qrTokenHash,
            qrVersion: 1,
            isActive: true,
          };
        });
        await tx.restaurantTable.createMany({ data: tablesData });

        const menu = await tx.menu.create({
          data: {
            restaurantId: createdRestaurant.id,
            title: 'Featured Menu',
            active: true,
          },
        });

        // Deduplicate categories case-insensitively and insert via single batch
        const categoryDisplayByKey = new Map<string, string>();
        for (const dish of preparedDishes) {
          const key = normalizeCategoryKey(dish.category) || 'chef specials';
          if (!categoryDisplayByKey.has(key)) {
            categoryDisplayByKey.set(key, dish.category);
          }
        }
        if (categoryDisplayByKey.size === 0) {
          categoryDisplayByKey.set('chef specials', 'Chef Specials');
        }

        const categoryEntries = Array.from(categoryDisplayByKey.entries());
        const categoryRowsToCreate = categoryEntries.map(([key, catName], idx) => ({
          id: crypto.randomUUID(),
          menuId: menu.id,
          name: catName,
          sortOrder: idx + 1,
          _key: key,
        }));

        await tx.menuCategory.createMany({
          data: categoryRowsToCreate.map(({ id, menuId, name, sortOrder }) => ({
            id,
            menuId,
            name,
            sortOrder,
          })),
        });

        const categoryIdByKey = new Map<string, string>(
          categoryRowsToCreate.map((row) => [row._key, row.id])
        );
        const fallbackCategoryId = categoryRowsToCreate[0].id;

        if (preparedDishes.length > 0) {
          const menuItemsData = preparedDishes.map((dish, idx) => {
            const catKey = normalizeCategoryKey(dish.category) || 'chef specials';
            return {
              restaurantId: createdRestaurant.id,
              menuId: menu.id,
              categoryId: categoryIdByKey.get(catKey) || fallbackCategoryId,
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
            };
          });

          const BATCH_SIZE = 250;
          for (let start = 0; start < menuItemsData.length; start += BATCH_SIZE) {
            await tx.restaurantMenuItem.createMany({
              data: menuItemsData.slice(start, start + BATCH_SIZE),
            });
          }
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
      },
      { maxWait: 10_000, timeout: 30_000 }
    );

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
        duplicatesSkippedCount,
        canonicalMatchedCount,
        themePreset: resolvedPresetKey,
        hasCoverBanner: Boolean(resolvedCoverUrl),
        coverUrl: resolvedCoverUrl,
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
      duplicatesSkippedCount,
      canonicalMatchedCount,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Create demo restaurant error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
