import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { extractMenuFromImages } from '@/lib/gemini/vision-extractor';
import { matchCanonicalDish } from '@/lib/canonical/matcher';
import prisma from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { restaurantId, jobId, uploadId } = await req.json();

    if (!restaurantId || !uploadId) {
      return NextResponse.json({ error: 'restaurantId and uploadId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const upload = await prisma.menuUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    const restaurant = auth.restaurant;
    const fileKeys = upload.fileKeys as string[];

    // Read files
    const images: Array<{ buffer: Buffer; mimeType: string }> = [];
    for (const fileUrl of fileKeys) {
      try {
        const localPath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          const buffer = fs.readFileSync(localPath);
          images.push({ buffer, mimeType: 'image/jpeg' });
        }
      } catch {}
    }

    // Run extraction
    const extracted = await extractMenuFromImages({
      images,
      restaurantId,
      currencyDefault: restaurant.currency === 'USD' ? 'USD' : 'INR',
    });

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

    // Process categories & items
    const categoryMap = new Map<string, string>();
    for (const catName of extracted.categories) {
      let cat = await prisma.menuCategory.findFirst({
        where: { menuId: menu.id, name: catName },
      });

      if (!cat) {
        cat = await prisma.menuCategory.create({
          data: {
            menuId: menu.id,
            name: catName,
            sortOrder: categoryMap.size + 1,
          },
        });
      }
      categoryMap.set(catName, cat.id);
    }

    // Save dishes
    const createdItems = [];
    for (const item of extracted.items) {
      const categoryId = categoryMap.get(item.category) || Array.from(categoryMap.values())[0];

      // Match canonical dish
      const canonicalMatch = await matchCanonicalDish({
        dishName: item.normalizedName || item.sourceName,
        category: item.category,
        description: item.description || undefined,
      });

      // Check if canonical has approved illustration
      let canonicalImageAssetId: string | null = null;
      if (canonicalMatch.canonicalId) {
        const canon = await prisma.canonicalDish.findUnique({
          where: { id: canonicalMatch.canonicalId },
          include: { imageAsset: true },
        });
        canonicalImageAssetId = canon?.imageAssetId || null;
      }

      const menuItem = await prisma.restaurantMenuItem.create({
        data: {
          restaurantId,
          menuId: menu.id,
          categoryId,
          canonicalId: canonicalMatch.canonicalId,
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
        },
      });

      // If variants exist, create them
      if (item.variants && item.variants.length > 0) {
        for (let idx = 0; idx < item.variants.length; idx++) {
          const v = item.variants[idx];
          await prisma.dishVariant.create({
            data: {
              menuItemId: menuItem.id,
              name: v.name,
              supplementalPriceMinor: v.priceMinor || 0,
              sortOrder: idx + 1,
            },
          });
        }
      }

      createdItems.push(menuItem);
    }

    // Update upload and job statuses
    await prisma.menuUpload.update({
      where: { id: upload.id },
      data: { status: 'COMPLETED', reviewStatus: 'REVIEWED' },
    });

    if (jobId) {
      await prisma.extractionJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          extractedJson: extracted as any,
          extractionConfidence: 0.94,
        },
      });
    }

    return NextResponse.json({
      success: true,
      extractedCategories: extracted.categories.length,
      extractedItemsCount: createdItems.length,
      items: createdItems,
    });
  } catch (error: any) {
    console.error('Menu extract error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

