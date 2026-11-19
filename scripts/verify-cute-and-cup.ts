import prisma from '../src/lib/db/prisma';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';

export async function verifyCuteAndCup() {
  const rest = await prisma.restaurant.findFirst({
    where: { slug: 'cute-and-cup' },
    include: {
      menus: {
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  variants: { orderBy: { sortOrder: 'asc' } },
                  imageOverride: true,
                  canonical: { include: { imageAsset: true } },
                },
              },
            },
          },
        },
      },
      tables: { orderBy: { name: 'asc' } },
      claimRequests: true,
      theme: true,
      settings: true,
      orderingSettings: true,
    },
  });

  if (!rest) {
    throw new Error('Restaurant with slug "cute-and-cup" not found!');
  }

  console.log(`\n==============================================`);
  console.log(`Verified Restaurant: ${rest.displayName} (${rest.id})`);
  console.log(`Slug: ${rest.slug} | CoverUrl: ${rest.coverUrl}`);
  console.log(`Claimed: ${rest.isClaimed} | OrgId: ${rest.organizationId}`);
  console.log(`ClaimRequests: ${rest.claimRequests.length} (Status: ${rest.claimRequests[0]?.status})`);
  console.log(`Tables count: ${rest.tables.length} (Table names: ${rest.tables.map((t) => t.name).join(', ')})`);

  const menu = rest.menus[0];
  if (!menu) throw new Error('No menu found for restaurant!');
  console.log(`\nCategories count: ${menu.categories.length}`);

  let totalItems = 0;
  let itemsWithImages = 0;
  let totalVariants = 0;
  let itemsWithVariants = 0;
  const assignedAssetIds = new Map<string, string>();
  const assignedUrls = new Map<string, string>();
  const duplicates: string[] = [];

  for (const cat of menu.categories) {
    console.log(`  [Category] ${cat.name} (${cat.items.length} items)`);
    for (const item of cat.items) {
      totalItems++;
      if (item.variants.length > 0) {
        itemsWithVariants++;
        totalVariants += item.variants.length;
      }

      const asset = item.imageOverride || item.canonical?.imageAsset;
      if (asset) {
        itemsWithImages++;
        if (assignedAssetIds.has(asset.id)) {
          duplicates.push(`Item "${item.customName}" duplicates assetId ${asset.id} with "${assignedAssetIds.get(asset.id)}"`);
        }
        if (assignedUrls.has(asset.publicUrl)) {
          duplicates.push(`Item "${item.customName}" duplicates publicUrl ${asset.publicUrl} with "${assignedUrls.get(asset.publicUrl)}"`);
        }
        assignedAssetIds.set(asset.id, item.customName);
        assignedUrls.set(asset.publicUrl, item.customName);
      }
    }
  }

  console.log(`\nTotal items: ${totalItems}`);
  console.log(`Dishes with unique images: ${itemsWithImages} (Unique Assets: ${assignedAssetIds.size})`);
  console.log(`Dishes with variants: ${itemsWithVariants} (Total variant records: ${totalVariants})`);
  console.log(`Image duplicates: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.error('DUPLICATES DETECTED:', duplicates);
  }

  // Verify diner loader works for both slugs
  const res1 = await loadDinerMenuPayload('cute-and-cup');
  const res2 = await loadDinerMenuPayload('cute-and-cup-demo');
  console.log(`\nLoader test /m/cute-and-cup: status=${res1.status}`);
  console.log(`Loader test /m/cute-and-cup-demo: status=${res2.status}`);

  if (res1.status !== 'OK' || res2.status !== 'OK') {
    throw new Error('Diner menu loader failed for cute-and-cup or cute-and-cup-demo');
  }

  return {
    restaurant: rest,
    totalItems,
    itemsWithImages,
    uniqueAssetsCount: assignedAssetIds.size,
    duplicatesCount: duplicates.length,
    itemsWithVariants,
    totalVariants,
  };
}

if (require.main === module || process.argv[1]?.endsWith('verify-cute-and-cup.ts')) {
  verifyCuteAndCup()
    .then(() => {
      console.log('\nAll checks passed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nVerification failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
