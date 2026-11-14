import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { AssetType, ModerationStatus, ReviewState } from '@prisma/client';
import prisma from '../src/lib/db/prisma';
import { CAFE_SPECIALTIES_CATALOG } from '../src/lib/canonical/data/cafe-specialties';
import { normalizeDishString } from '../src/lib/canonical/matcher';
import { getCache } from '../src/lib/cache/redis';

const FILE_MAP: Record<string, string> = {
  'hazelnut cold coffee': 'hazelnut-cold-coffee.webp',
  'oreo shake': 'oreo-shake.webp',
  'mint mojito': 'mint-mojito.webp',
  'white sauce pasta': 'white-sauce-pasta.webp',
  'grilled paneer tortilla': 'grilled-paneer-tortilla.webp',
  'paneer momos': 'paneer-momos.webp',
  'grilled paneer cheese sandwich': 'grilled-paneer-cheese-sandwich.webp',
  'masala french fries': 'masala-french-fries.webp',
  'double cheese pizza': 'double-cheese-pizza.webp',
  'bun makhan masala with masala tea': 'bun-makhan-masala-with-masala-tea.webp',
  'cheese maggi': 'cheese-maggi.webp',
  'mexican cheese burger': 'mexican-cheese-burger.webp',
};

export async function seedCafeSpecialties() {
  console.log('🍽️  Seeding 12 Cafe Specialties into Canonical Library category-wise...');

  const canonicalDir = path.join(process.cwd(), 'public', 'images', 'canonical');
  if (!fs.existsSync(canonicalDir)) {
    fs.mkdirSync(canonicalDir, { recursive: true });
  }

  for (const item of CAFE_SPECIALTIES_CATALOG) {
    const filename = FILE_MAP[item.normalizedName];
    if (!filename) {
      console.warn(`No file mapped for "${item.normalizedName}"`);
      continue;
    }

    const publicUrl = `/images/canonical/${filename}`;
    const storageKey = `canonical/${filename}`;

    // Verify file exists on disk
    const diskPath = path.join(canonicalDir, filename);
    if (!fs.existsSync(diskPath)) {
      throw new Error(`Asset file missing at ${diskPath}`);
    }

    // 1. Find or create Asset
    let asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { publicUrl },
          { storageKey },
        ],
      },
    });

    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          type: AssetType.AI_ILLUSTRATION,
          storageKey,
          publicUrl,
          mime: 'image/webp',
          width: 1024,
          height: 1024,
          source: 'CURATED_CLAY',
          prompt: item.visualPrompt,
          generationModel: 'gemini-3.8-flash',
          moderationStatus: ModerationStatus.APPROVED,
        },
      });

      await prisma.assetVersion.create({
        data: {
          assetId: asset.id,
          versionNumber: 1,
          storageKey,
          publicUrl,
          prompt: item.visualPrompt,
        },
      });
    }

    // 2. Upsert CanonicalDish
    const canonical = await prisma.canonicalDish.upsert({
      where: { normalizedName: item.normalizedName },
      update: {
        aliases: item.aliases,
        cuisine: item.category,
        generalizedDescription: item.generalizedDescription,
        estimatedNutrition: item.estimatedNutrition as any,
        imageAssetId: asset.id,
        confidence: 1.0,
        reviewState: ReviewState.APPROVED,
        provenance: 'SYSTEM_CURATED',
      },
      create: {
        normalizedName: item.normalizedName,
        aliases: item.aliases,
        cuisine: item.category,
        generalizedDescription: item.generalizedDescription,
        estimatedNutrition: item.estimatedNutrition as any,
        imageAssetId: asset.id,
        confidence: 1.0,
        reviewState: ReviewState.APPROVED,
        provenance: 'SYSTEM_CURATED',
      },
    });

    // 3. Link Asset to Canonical Dish
    if (asset.canonicalId !== canonical.id) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { canonicalId: canonical.id },
      });
    }

    // 4. Link CanonicalAsset
    await prisma.canonicalAsset.upsert({
      where: {
        canonicalId_assetId: {
          canonicalId: canonical.id,
          assetId: asset.id,
        },
      },
      update: { isApproved: true },
      create: {
        canonicalId: canonical.id,
        assetId: asset.id,
        isApproved: true,
        reuseCount: 1,
      },
    });

    // 5. Sync Aliases
    const normalizedAliases = new Set<string>();
    normalizedAliases.add(item.normalizedName);
    for (const a of item.aliases) {
      const clean = normalizeDishString(a);
      if (clean) normalizedAliases.add(clean);
    }

    for (const normalizedAlias of normalizedAliases) {
      await prisma.canonicalAlias.upsert({
        where: {
          canonicalId_normalizedAlias: {
            canonicalId: canonical.id,
            normalizedAlias,
          },
        },
        update: {},
        create: {
          canonicalId: canonical.id,
          normalizedAlias,
        },
      });
    }

    console.log(`✅ [${item.category}] ${item.displayName} -> ${publicUrl}`);
  }

  // Clear Redis library cache
  try {
    const cache = getCache();
    await cache.del('canonical:library:all');
  } catch {
    // Non-blocking if redis isn't connected
  }

  console.log('🎉 All 12 dishes added category-wise to canonical library!');
}

if (require.main === module) {
  seedCafeSpecialties()
    .catch((err) => {
      console.error('Failed to seed cafe specialties:', err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
