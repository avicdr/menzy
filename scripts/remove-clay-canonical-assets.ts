import 'dotenv/config';
import prisma from '../src/lib/db/prisma';
import { getCanonicalVisualStyle } from '../src/lib/canonical/visual-style';
import { deleteAsset } from '../src/lib/storage/adapter';
import { getCache } from '../src/lib/cache/redis';

async function main() {
  const execute = process.argv.includes('--execute');
  const assets = await prisma.asset.findMany({
    where: {
      OR: [
        { canonicalAssets: { some: {} } },
        { canonicalDishes: { some: {} } },
      ],
    },
    select: {
      id: true,
      storageKey: true,
      publicUrl: true,
      source: true,
      prompt: true,
      canonicalAssets: { select: { canonicalId: true } },
      canonicalDishes: { select: { id: true } },
    },
  });

  const clayAssets = assets.filter((asset) => getCanonicalVisualStyle(asset) === 'CLAY');
  console.log(`Found ${clayAssets.length} clay canonical assets out of ${assets.length} canonical assets.`);
  for (const asset of clayAssets) {
    console.log(`${asset.id} ${asset.source} ${asset.storageKey}`);
  }

  if (!execute) {
    console.log('Dry run only. Re-run with --execute to delete these assets from the database and bucket.');
    return;
  }

  let deleted = 0;
  for (const asset of clayAssets) {
    await prisma.asset.delete({ where: { id: asset.id } });
    await deleteAsset(asset.storageKey);
    deleted += 1;
  }

  await getCache().del('canonical:library:all');
  console.log(`Deleted ${deleted} clay canonical assets from the database and bucket.`);
}

main()
  .then(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Clay canonical asset removal failed:', error);
    await prisma.$disconnect().catch(() => undefined);
    process.exit(1);
  });
