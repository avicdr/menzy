import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { AssetType, ModerationStatus, ReviewState } from '@prisma/client';
import prisma from '../src/lib/db/prisma';
import { CANONICAL_GALLERY_CATALOG } from '../src/lib/canonical/catalog';
import { REALISTIC_FOOD_ASSET_MANIFEST } from '../src/lib/canonical/data/realistic-food-assets';
import { normalizeDishString } from '../src/lib/canonical/matcher';
import { getCache } from '../src/lib/cache/redis';
import { uploadAssetAtStorageKey } from '../src/lib/storage/adapter';

const ASSET_DIR = path.join(process.cwd(), 'assets');

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function importOne(entry: (typeof REALISTIC_FOOD_ASSET_MANIFEST)[number], index: number) {
  const sourcePath = path.join(ASSET_DIR, entry.file);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing realistic food asset: ${sourcePath}`);
  }

  const prompt = `Imported realistic food photo: ${entry.file}`;
  const catalogItem = CANONICAL_GALLERY_CATALOG.find(
    (item) => item.normalizedName === entry.normalizedName
  );
  const storageKey = `canonical/realistic/${slugify(entry.displayName)}-${entry.file}`;
  let asset = await prisma.asset.findFirst({
    where: {
      OR: [
        { storageKey },
        { source: 'CURATED_REALISTIC', prompt },
      ],
    },
  });

  if (!asset) {
    const buffer = await fs.promises.readFile(sourcePath);
    const metadata = await sharp(buffer).metadata();
    const upload = await uploadAssetAtStorageKey(buffer, storageKey, 'image/webp');

    asset = await prisma.asset.create({
      data: {
        type: AssetType.AI_ILLUSTRATION,
        storageKey: upload.storageKey,
        publicUrl: upload.publicUrl,
        mime: 'image/webp',
        width: metadata.width || null,
        height: metadata.height || null,
        source: 'CURATED_REALISTIC',
        prompt,
        generationModel: 'asset-import',
        moderationStatus: ModerationStatus.APPROVED,
      },
    });

    await prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        versionNumber: 1,
        storageKey: upload.storageKey,
        publicUrl: upload.publicUrl,
        prompt,
      },
    });
  } else if (asset.storageKey !== storageKey) {
    const buffer = await fs.promises.readFile(sourcePath);
    const upload = await uploadAssetAtStorageKey(buffer, storageKey, 'image/webp');
    asset = await prisma.asset.update({
      where: { id: asset.id },
      data: {
        storageKey: upload.storageKey,
        publicUrl: upload.publicUrl,
        version: { increment: 1 },
      },
    });
    await prisma.assetVersion.create({
      data: {
        assetId: asset.id,
        versionNumber: asset.version,
        storageKey: upload.storageKey,
        publicUrl: upload.publicUrl,
        prompt,
      },
    });
  }

  const aliases = catalogItem?.aliases?.length
    ? catalogItem.aliases
    : [entry.normalizedName, entry.displayName.toLowerCase()];
  const description = catalogItem?.generalizedDescription ||
    `Realistic food photo reference for ${entry.displayName}.`;
  const cuisine = catalogItem?.cuisine || entry.cuisine;
  const canonical = await prisma.canonicalDish.upsert({
    where: { normalizedName: entry.normalizedName },
    update: {
      aliases,
      cuisine,
      generalizedDescription: description,
      estimatedNutrition: catalogItem?.estimatedNutrition as any,
      reviewState: ReviewState.APPROVED,
    },
    create: {
      normalizedName: entry.normalizedName,
      aliases,
      cuisine,
      generalizedDescription: description,
      estimatedNutrition: catalogItem?.estimatedNutrition as any,
      reviewState: ReviewState.APPROVED,
      provenance: 'SYSTEM_CURATED',
    },
  });

  // A corrected manifest label must not leave the same image visible under its old dish.
  await prisma.canonicalAsset.deleteMany({
    where: { assetId: asset.id, canonicalId: { not: canonical.id } },
  });

  await prisma.canonicalAsset.upsert({
    where: { canonicalId_assetId: { canonicalId: canonical.id, assetId: asset.id } },
    update: { isApproved: true },
    create: { canonicalId: canonical.id, assetId: asset.id, isApproved: true, reuseCount: 1 },
  });

  for (const alias of new Set(aliases.map(normalizeDishString).filter(Boolean))) {
    await prisma.canonicalAlias.upsert({
      where: { canonicalId_normalizedAlias: { canonicalId: canonical.id, normalizedAlias: alias } },
      update: {},
      create: { canonicalId: canonical.id, normalizedAlias: alias },
    });
  }

  console.log(`[${index}/${REALISTIC_FOOD_ASSET_MANIFEST.length}] ${entry.displayName} -> ${asset.publicUrl}`);
}

async function main() {
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required for this import.');
  }

  for (let index = 0; index < REALISTIC_FOOD_ASSET_MANIFEST.length; index += 1) {
    await importOne(REALISTIC_FOOD_ASSET_MANIFEST[index], index + 1);
  }

  await getCache().del('canonical:library:all');
  console.log(`Imported ${REALISTIC_FOOD_ASSET_MANIFEST.length} realistic food assets into the canonical library.`);
}

main()
  .then(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Realistic food asset import failed:', error);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  });
