import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';
import { getClaimPreviewByToken } from '../src/lib/claims/claim-service';
import {
  CUTE_AND_CUP_SLUG,
  CUTE_AND_CUP_CLAIM_TOKEN,
  seedCuteAndCupDemo,
} from '../scripts/seed-cute-and-cup';
import { EXPECTED_CATEGORIES } from '../scripts/verify-cute-and-cup';

describe('Cute & Cup Claimable Demo Restaurant', () => {
  it('seeds Cute & Cup idempotently with claimable status, coverUrl banner, and tables 1-8', async () => {
    // 1. Run seed idempotently
    await seedCuteAndCupDemo();

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [{ slug: CUTE_AND_CUP_SLUG }, { slug: 'cute-and-cup-demo' }],
      },
      include: {
        theme: true,
        settings: true,
        tables: { orderBy: { name: 'asc' } },
        claimRequests: true,
      },
    });

    expect(restaurant, 'Cute & Cup restaurant record must exist').toBeDefined();
    expect(restaurant?.displayName).toBe('Cute & Cup');
    expect(restaurant?.slug).toBe(CUTE_AND_CUP_SLUG);
    expect(restaurant?.isClaimed).toBe(false);
    expect(restaurant?.organizationId).toBeNull();
    expect(restaurant?.coverUrl).toBe('/images/cute-and-cup-banner.jpg');

    // Claim Request check
    const claimTokenHash = crypto
      .createHash('sha256')
      .update(CUTE_AND_CUP_CLAIM_TOKEN)
      .digest('hex');
    const claim = await prisma.claimRequest.findUnique({
      where: { claimTokenHash },
    });
    expect(claim, 'Founder demo claim request must exist').toBeDefined();
    expect(claim?.restaurantId).toBe(restaurant?.id);
    expect(claim?.status).toBe('UNCLAIMED');

    // Tables 1-8 check
    expect(restaurant?.tables.length).toBeGreaterThanOrEqual(8);
    const tableNames = restaurant?.tables.map((t) => t.name) || [];
    for (let i = 1; i <= 8; i++) {
      expect(tableNames).toContain(`Table ${i}`);
    }
  });

  it('contains all 15 categories and 94 items matching the user menu list images with accurate pricing', async () => {
    const restaurant = await prisma.restaurant.findFirst({
      where: { slug: CUTE_AND_CUP_SLUG },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    const menu = restaurant?.menus[0];
    expect(menu, 'Menu must exist').toBeDefined();
    expect(menu?.categories.length).toBe(15);

    const allItems = menu?.categories.flatMap((c) => c.items) || [];
    expect(allItems.length).toBe(94);

    // Verify each category and item against expected menu specs
    for (const expCat of EXPECTED_CATEGORIES) {
      const actualCat = menu?.categories.find(
        (c) => c.name.trim().toLowerCase() === expCat.name.trim().toLowerCase()
      );
      expect(actualCat, `Category "${expCat.name}" must exist`).toBeDefined();
      expect(
        actualCat?.items.length,
        `Category "${expCat.name}" items count`
      ).toBe(expCat.items.length);

      for (const expItem of expCat.items) {
        const matchNames = [expItem.name, ...(expItem.altNames || [])].map((n) =>
          n.trim().toLowerCase()
        );
        const actualItem = actualCat?.items.find((i) =>
          matchNames.includes(i.customName.trim().toLowerCase())
        );

        expect(
          actualItem,
          `Item "${expItem.name}" in category "${expCat.name}" must exist`
        ).toBeDefined();

        if (expItem.half != null && expItem.full != null) {
          // Half/Full item: base price is half in paise
          expect(actualItem?.priceMinor).toBe(expItem.half * 100);

          // Full variant supplemental price = (full - half) * 100
          const fullVariant = actualItem?.variants.find(
            (v) => v.name.toLowerCase() === 'full'
          );
          expect(
            fullVariant,
            `Item "${actualItem?.customName}" must have a Full variant`
          ).toBeDefined();
          expect(fullVariant?.supplementalPriceMinor).toBe(
            (expItem.full - expItem.half) * 100
          );
        } else {
          // Single portion item
          const expectedPrice = expItem.price ?? expItem.half ?? expItem.full;
          expect(actualItem?.priceMinor).toBe(expectedPrice! * 100);
        }
      }
    }
  });

  it('strictly guarantees no two items share the same image (all asset IDs and public URLs are unique)', async () => {
    const restaurant = await prisma.restaurant.findFirst({
      where: { slug: CUTE_AND_CUP_SLUG },
      include: {
        menus: {
          include: {
            categories: {
              include: {
                items: {
                  include: {
                    imageOverride: true,
                    canonical: {
                      include: {
                        imageAsset: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const allItems = restaurant?.menus[0]?.categories.flatMap((c) => c.items) || [];
    const usedAssetIds = new Map<string, string>();
    const usedPublicUrls = new Map<string, string>();
    let itemsWithImages = 0;

    for (const item of allItems) {
      const asset = item.imageOverride || item.canonical?.imageAsset;
      if (asset) {
        itemsWithImages++;

        // Assert assetId uniqueness
        const previousItemForAsset = usedAssetIds.get(asset.id);
        expect(
          previousItemForAsset,
          `Asset ID ${asset.id} is shared by "${previousItemForAsset}" and "${item.customName}"`
        ).toBeUndefined();
        usedAssetIds.set(asset.id, item.customName);

        // Assert publicUrl uniqueness
        if (asset.publicUrl) {
          const previousItemForUrl = usedPublicUrls.get(asset.publicUrl);
          expect(
            previousItemForUrl,
            `Public URL ${asset.publicUrl} is shared by "${previousItemForUrl}" and "${item.customName}"`
          ).toBeUndefined();
          usedPublicUrls.set(asset.publicUrl, item.customName);
        }
      }
    }

    expect(itemsWithImages).toBeGreaterThan(0);
    expect(usedAssetIds.size).toBe(itemsWithImages);
    expect(usedPublicUrls.size).toBe(itemsWithImages);
  });

  it('loads diner menu via /m/cute-and-cup and /m/cute-and-cup-demo aliases', async () => {
    const primaryResult = await loadDinerMenuPayload('cute-and-cup');
    const aliasResult = await loadDinerMenuPayload('cute-and-cup-demo');

    expect(primaryResult.status).toBe('OK');
    expect(aliasResult.status).toBe('OK');

    if (primaryResult.status !== 'OK' || aliasResult.status !== 'OK') return;

    expect(primaryResult.data.restaurant.displayName).toBe('Cute & Cup');
    expect(aliasResult.data.restaurant.displayName).toBe('Cute & Cup');
    expect(primaryResult.data.restaurant.isClaimed).toBe(false);
    expect(primaryResult.data.restaurant.coverUrl).toBe('/images/cute-and-cup-banner.jpg');

    const primaryMenu = primaryResult.data.menus[0];
    const aliasMenu = aliasResult.data.menus[0];

    expect(primaryMenu.categories.length).toBe(15);
    expect(aliasMenu.categories.length).toBe(15);

    const primaryItems = primaryMenu.categories.flatMap((c: any) => c.items);
    expect(primaryItems.length).toBe(94);
  });

  it('validates claim route preview for Cute & Cup founder demo token', async () => {
    const preview = await getClaimPreviewByToken(CUTE_AND_CUP_CLAIM_TOKEN);

    expect(preview.valid).toBe(true);
    expect(preview.state).toBe('UNCLAIMED');
    if (preview.valid) {
      expect(preview.restaurant.displayName).toBe('Cute & Cup');
      expect(preview.restaurant.slug).toBe(CUTE_AND_CUP_SLUG);
      expect(preview.restaurant.isClaimed).toBe(false);
      expect(preview.restaurant.coverUrl).toBe('/images/cute-and-cup-banner.jpg');
    }
  });
});
