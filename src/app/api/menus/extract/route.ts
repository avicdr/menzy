import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { extractMenuFromImages } from '@/lib/gemini/vision-extractor';
import { matchCanonicalDishesBatch } from '@/lib/canonical/matcher';
import { readAssetFromUrl } from '@/lib/storage/adapter';
import { getCache } from '@/lib/cache/redis';
import prisma from '@/lib/db/prisma';
import {
  areDishesLikelyDuplicate,
  normalizeCategoryKey,
  resolvePrimaryDietaryBucket,
} from '@/lib/menu/deduplicate';
import { resolveMenuMimeForExtraction, type SupportedMenuMime } from '@/lib/menu/menu-file-validator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { restaurantId, jobId, uploadId } = await req.json();

    if (!restaurantId || !uploadId) {
      return NextResponse.json({ error: 'restaurantId and uploadId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      includeSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const upload = await prisma.menuUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload || upload.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    const restaurant = auth.restaurant;
    const fileKeys = upload.fileKeys as string[];

    // Read files concurrently (from S3/Supabase Storage or local fallback) and normalize MIME via magic bytes
    const fileLoads = await Promise.all(
      fileKeys.map(async (fileUrl) => {
        try {
          const loaded = await readAssetFromUrl(fileUrl);
          if (loaded && loaded.buffer.length > 0) {
            const resolvedMime = resolveMenuMimeForExtraction(
              loaded.buffer,
              loaded.mimeType,
              fileUrl
            );
            if (resolvedMime) {
              return { buffer: loaded.buffer, mimeType: resolvedMime };
            }
            console.warn('Skipping unsupported uploaded menu file:', fileUrl, loaded.mimeType);
          }
        } catch (err) {
          console.warn('Failed to load uploaded menu file:', fileUrl, err);
        }
        return null;
      })
    );
    const images = fileLoads.filter(
      (entry): entry is { buffer: Buffer; mimeType: SupportedMenuMime } => entry !== null
    );

    if (images.length === 0) {
      await prisma.menuUpload.update({
        where: { id: upload.id },
        data: { status: 'FAILED' },
      });
      if (jobId) {
        await prisma.extractionJob.update({
          where: { id: jobId },
          data: { status: 'FAILED', error: 'No readable menu photos or PDFs found in uploaded files' },
        });
      }
      return NextResponse.json({
        success: false,
        error: 'No readable menu photos or PDFs found. Please upload clear menu photos (JPG, PNG, WebP, HEIC) or a PDF.',
      }, { status: 400 });
    }

    // Run extraction with strict error propagation - NEVER populate dummy data on failure!
    let extracted;
    try {
      extracted = await extractMenuFromImages({
        images,
        restaurantId,
        currencyDefault: restaurant.currency === 'USD' ? 'USD' : 'INR',
      });
    } catch (extractErr: any) {
      console.error('Menu extraction failed:', extractErr);
      await prisma.menuUpload.update({
        where: { id: upload.id },
        data: { status: 'FAILED' },
      });
      if (jobId) {
        await prisma.extractionJob.update({
          where: { id: jobId },
          data: { status: 'FAILED', error: extractErr?.message || 'Extraction failed' },
        });
      }
      return NextResponse.json({
        success: false,
        error: extractErr?.message || 'Menu extraction failed. Please try again later.',
      }, { status: 422 });
    }

    if (!extracted || !extracted.items || extracted.items.length === 0) {
      await prisma.menuUpload.update({
        where: { id: upload.id },
        data: { status: 'FAILED' },
      });
      if (jobId) {
        await prisma.extractionJob.update({
          where: { id: jobId },
          data: { status: 'FAILED', error: 'No dishes detected in menu upload' },
        });
      }
      return NextResponse.json({
        success: false,
        error: 'No dishes or prices could be detected in the uploaded menu photos or PDF. Please ensure the menu is clear, focused, and not password-protected.',
      }, { status: 422 });
    }

    // Ensure a default Menu exists
    let menu = await prisma.menu.findFirst({
      where: { restaurantId, active: true },
    });

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          restaurantId,
          title: 'Main Menu',
        },
      });
    }

    // Load existing dishes in the active menu to avoid creating duplicates on incremental scans
    const existingMenuItems = await prisma.restaurantMenuItem.findMany({
      where: { restaurantId, menuId: menu.id },
      include: { category: { select: { name: true } } },
    });

    const existingComparables = existingMenuItems.map((existing) => ({
      name: existing.customName,
      category: existing.category?.name || null,
      priceMinor: existing.priceMinor,
      dietaryBucket: resolvePrimaryDietaryBucket(
        Array.isArray(existing.dietaryStatus) ? (existing.dietaryStatus as string[]) : []
      ),
    }));

    const itemsToInsert = extracted.items.filter((item) => {
      const candidateComparable = {
        name: item.sourceName || item.normalizedName,
        category: item.category,
        priceMinor: item.priceMinor,
        dietaryBucket: resolvePrimaryDietaryBucket(item.dietaryLabels),
      };
      return !existingComparables.some((ex) =>
        areDishesLikelyDuplicate(ex, candidateComparable)
      );
    });

    const duplicatesSkippedCount = extracted.items.length - itemsToInsert.length;

    // Process categories case-insensitively
    const existingCategories = await prisma.menuCategory.findMany({
      where: { menuId: menu.id },
      orderBy: { sortOrder: 'asc' },
    });
    const categoryMap = new Map<string, string>();
    const categoryIdByNormKey = new Map<string, string>();
    for (const c of existingCategories) {
      categoryMap.set(c.name, c.id);
      const norm = normalizeCategoryKey(c.name);
      if (norm && !categoryIdByNormKey.has(norm)) {
        categoryIdByNormKey.set(norm, c.id);
      }
    }

    const categoriesToCreate: Array<{ id: string; menuId: string; name: string; sortOrder: number }> = [];
    const neededCategoryNames = new Set<string>([
      ...extracted.categories,
      ...itemsToInsert.map((it) => it.category),
    ]);
    let nextCatSortOrder = existingCategories.length + 1;
    for (const rawCatName of neededCategoryNames) {
      const catName = String(rawCatName || '').trim() || 'Chef Specials';
      const norm = normalizeCategoryKey(catName) || 'chef specials';
      if (!categoryIdByNormKey.has(norm)) {
        const newCatId = crypto.randomUUID();
        categoriesToCreate.push({
          id: newCatId,
          menuId: menu.id,
          name: catName,
          sortOrder: nextCatSortOrder++,
        });
        categoryMap.set(catName, newCatId);
        categoryIdByNormKey.set(norm, newCatId);
      }
    }

    if (categoriesToCreate.length > 0) {
      await prisma.menuCategory.createMany({ data: categoriesToCreate });
    }

    // Single batched canonical matching across new unique extracted items
    const canonicalMatches =
      itemsToInsert.length > 0
        ? await matchCanonicalDishesBatch(
            itemsToInsert.map((item) => ({
              dishName: item.sourceName || item.normalizedName,
              category: item.category,
              description: item.description || undefined,
              dietaryLabels: item.dietaryLabels,
            })),
            {
              useGemini: true,
              restaurantId,
              organizationId: restaurant.organizationId,
            }
          )
        : [];

    // Save unique new dishes in fast batched inserts
    const fallbackCategoryId =
      Array.from(categoryIdByNormKey.values())[0] ||
      Array.from(categoryMap.values())[0];

    const itemsToCreateData: Array<any> = [];
    const variantsToCreateData: Array<any> = [];
    const createdItemIds: string[] = [];
    let canonicalMatchedCount = 0;

    for (let itemIdx = 0; itemIdx < itemsToInsert.length; itemIdx++) {
      const item = itemsToInsert[itemIdx];
      const canonicalMatch = canonicalMatches[itemIdx];
      const normCat = normalizeCategoryKey(item.category);
      const categoryId =
        (normCat && categoryIdByNormKey.get(normCat)) ||
        categoryMap.get(item.category) ||
        fallbackCategoryId;

      if (canonicalMatch?.canonicalId) {
        canonicalMatchedCount++;
      }

      const menuItemId = crypto.randomUUID();
      createdItemIds.push(menuItemId);

      itemsToCreateData.push({
        id: menuItemId,
        restaurantId,
        menuId: menu.id,
        categoryId,
        canonicalId: canonicalMatch?.canonicalId ?? null,
        customName: item.sourceName,
        restaurantDescription: item.description,
        priceMinor: item.priceMinor,
        currency: item.currency,
        ingredients: item.explicitIngredients,
        dietaryStatus: item.dietaryLabels,
        allergenVerification: {
          statements: item.allergenStatements,
          verified: false,
        },
        preparationDetails: item.visualDescription,
        isAvailable: true,
        isPublished: true,
        isPopular: Boolean(item.isPopular),
        chefRecommended: Boolean(item.chefRecommended),
        sortOrder: existingMenuItems.length + itemIdx + 1,
      });

      if (item.variants && item.variants.length > 0) {
        for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
          const v = item.variants[vIdx];
          variantsToCreateData.push({
            menuItemId,
            name: v.name,
            supplementalPriceMinor: v.priceMinor || 0,
            sortOrder: vIdx + 1,
          });
        }
      }
    }

    if (itemsToCreateData.length > 0) {
      const BATCH_SIZE = 250;
      for (let start = 0; start < itemsToCreateData.length; start += BATCH_SIZE) {
        await prisma.restaurantMenuItem.createMany({
          data: itemsToCreateData.slice(start, start + BATCH_SIZE),
        });
      }
    }

    if (variantsToCreateData.length > 0) {
      await prisma.dishVariant.createMany({ data: variantsToCreateData });
    }

    const createdItems =
      createdItemIds.length > 0
        ? await prisma.restaurantMenuItem.findMany({
            where: { id: { in: createdItemIds } },
            orderBy: { sortOrder: 'asc' },
          })
        : [];

    // Invalidate live diner menu cache and persist upload/job states in parallel
    const cache = getCache();
    await Promise.all([
      cache.del(`menu:slug:${restaurant.slug}`),
      prisma.menuUpload.update({
        where: { id: upload.id },
        data: { status: 'COMPLETED', reviewStatus: 'REVIEWED' },
      }),
      ...(jobId
        ? [
            prisma.extractionJob.update({
              where: { id: jobId },
              data: {
                status: 'COMPLETED',
                extractedJson: extracted as any,
                extractionConfidence: 0.94,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      extractedCategories: neededCategoryNames.size,
      totalExtractedCount: extracted.items.length,
      extractedItemsCount: createdItems.length,
      duplicatesSkippedCount,
      canonicalMatchedCount,
      unmatchedCount: createdItems.length - canonicalMatchedCount,
      items: createdItems,
    });
  } catch (error: any) {
    console.error('Menu extract error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

