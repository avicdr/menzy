import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { generateOrReuseDishIllustration } from '@/lib/gemini/illustration-generator';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, menuItemIds, forceRegenerate = false } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    // Find target dishes
    const items = await prisma.restaurantMenuItem.findMany({
      where: {
        restaurantId,
        ...(menuItemIds && menuItemIds.length > 0
          ? { id: { in: menuItemIds } }
          : forceRegenerate
          ? {}
          : { imageOverrideAssetId: null }),
      },
      include: {
        category: true,
        imageOverride: true,
      },
      take: 25, // safe batch size per call
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All dishes already have 3D illustrations.',
        updatedItemsCount: 0,
        items: [],
      });
    }

    const results = [];
    for (const item of items) {
      try {
        const genResult = await generateOrReuseDishIllustration({
          restaurantId,
          organizationId: auth.restaurant.organizationId,
          menuItemId: item.id,
          dishName: item.customName,
          visualDescription: item.restaurantDescription || item.customName,
          canonicalId: item.canonicalId,
          forceRegenerate,
        });

        if (genResult.asset) {
          const updated = await prisma.restaurantMenuItem.update({
            where: { id: item.id },
            data: { imageOverrideAssetId: genResult.asset.id },
            include: {
              category: true,
              imageOverride: true,
            },
          });
          results.push(updated);
        }
      } catch (itemErr) {
        console.warn(`Failed image generation for "${item.customName}":`, itemErr);
      }
    }

    return NextResponse.json({
      success: true,
      updatedItemsCount: results.length,
      items: results,
    });
  } catch (error: any) {
    console.error('Batch image generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

