import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import {
  MAX_BATCH_GENERATION,
  generateOrReuseDishIllustration,
} from '@/lib/gemini/illustration-generator';
import { matchCanonicalDishesBatch } from '@/lib/canonical/matcher';
import { getCache } from '@/lib/cache/redis';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, menuItemIds, forceRegenerate = false } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const hasExplicitIds = Array.isArray(menuItemIds) && menuItemIds.length > 0;

    // 1. Query items lacking usable imagery (neither imageOverrideAssetId nor canonical.imageAssetId)
    const items = await prisma.restaurantMenuItem.findMany({
      where: {
        restaurantId,
        ...(hasExplicitIds
          ? { id: { in: menuItemIds } }
          : forceRegenerate
          ? {}
          : {
              imageOverrideAssetId: null,
              OR: [{ canonicalId: null }, { canonical: { imageAssetId: null } }],
            }),
      },
      include: {
        category: true,
        canonical: {
          include: { imageAsset: true },
        },
        imageOverride: true,
      },
      orderBy: { sortOrder: 'asc' },
      take: 60,
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All dishes already have 3D illustrations.',
        canonicalLinkedCount: 0,
        generatedCount: 0,
        remainingUnillustratedCount: 0,
        maxCustomPerBatch: MAX_BATCH_GENERATION,
        updatedItemsCount: 0,
        items: [],
      });
    }

    const updatedItemsMap = new Map<string, any>();
    let canonicalLinkedCount = 0;

    // 2. Link closest canonical illustrations FIRST (0 credit cost) before spending custom generation quota
    if (!forceRegenerate) {
      const itemsNeedingCanonicalMatch = items.filter(
        (it) => !it.imageOverrideAssetId && (!it.canonicalId || !it.canonical?.imageAssetId)
      );

      if (itemsNeedingCanonicalMatch.length > 0) {
        try {
          const matches = await matchCanonicalDishesBatch(
            itemsNeedingCanonicalMatch.map((it) => ({
              dishName: it.customName,
              category: it.category?.name,
              description: it.restaurantDescription || undefined,
              dietaryLabels: Array.isArray(it.dietaryStatus)
                ? (it.dietaryStatus as string[])
                : undefined,
            })),
            {
              useGemini: true,
              restaurantId,
              organizationId: auth.restaurant.organizationId,
            }
          );

          for (let idx = 0; idx < itemsNeedingCanonicalMatch.length; idx++) {
            const targetItem = itemsNeedingCanonicalMatch[idx];
            const match = matches[idx];
            if (!match?.canonicalId || match.canonicalId === targetItem.canonicalId) {
              continue;
            }

            const linked = await prisma.restaurantMenuItem.update({
              where: { id: targetItem.id },
              data: { canonicalId: match.canonicalId },
              include: {
                category: true,
                canonical: {
                  include: { imageAsset: true },
                },
                imageOverride: true,
              },
            });

            updatedItemsMap.set(linked.id, linked);
            if (linked.canonical?.imageAssetId) {
              canonicalLinkedCount++;
            }
          }
        } catch (canonErr) {
          console.warn('Batch canonical closest-matching warning:', canonErr);
        }
      }
    }

    // 3. Strictly cap custom image generation to MAX_BATCH_GENERATION (5) per batch
    const itemsNeedingCustomGen = items
      .map((it) => updatedItemsMap.get(it.id) || it)
      .filter(
        (it) =>
          Boolean(forceRegenerate) ||
          (!it.imageOverrideAssetId && !it.canonical?.imageAssetId)
      );

    const customGenBatch = itemsNeedingCustomGen.slice(0, MAX_BATCH_GENERATION);
    let generatedCount = 0;
    let creditsExhausted = false;

    for (const item of customGenBatch) {
      try {
        const genResult = await generateOrReuseDishIllustration({
          restaurantId,
          organizationId: auth.restaurant.organizationId,
          menuItemId: item.id,
          dishName: item.customName,
          visualDescription: item.restaurantDescription || item.customName,
          canonicalId: item.canonicalId,
          forceRegenerate: Boolean(forceRegenerate),
        });

        if (genResult.asset) {
          const updated = await prisma.restaurantMenuItem.update({
            where: { id: item.id },
            data: { imageOverrideAssetId: genResult.asset.id },
            include: {
              category: true,
              canonical: {
                include: { imageAsset: true },
              },
              imageOverride: true,
            },
          });
          updatedItemsMap.set(updated.id, updated);
          generatedCount++;
        }
      } catch (itemErr: any) {
        if (itemErr?.message === 'INSUFFICIENT_IMAGE_CREDITS') {
          creditsExhausted = true;
          break;
        }
        console.warn(`Failed image generation for "${item.customName}":`, itemErr);
      }
    }

    const updatedItems = Array.from(updatedItemsMap.values());
    if (updatedItems.length > 0) {
      const cache = getCache();
      await cache.del(`menu:slug:${auth.restaurant.slug}`);
    }

    return NextResponse.json({
      success: true,
      canonicalLinkedCount,
      generatedCount,
      creditsExhausted,
      maxCustomPerBatch: MAX_BATCH_GENERATION,
      remainingUnillustratedCount: Math.max(0, itemsNeedingCustomGen.length - generatedCount),
      updatedItemsCount: updatedItems.length,
      items: updatedItems,
    });
  } catch (error: any) {
    console.error('Batch image generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
