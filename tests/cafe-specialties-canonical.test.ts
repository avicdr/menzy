import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/db/prisma';
import { CANONICAL_GALLERY_CATALOG, getCanonicalDisplayMeta } from '../src/lib/canonical/catalog';
import { CAFE_SPECIALTIES_CATALOG } from '../src/lib/canonical/data/cafe-specialties';
import { normalizeDishString } from '../src/lib/canonical/matcher';

describe('12 Cafe Specialties Canonical Library', () => {
  const expectedItems = [
    { name: 'Hazelnut Cold Coffee', category: 'Cold Coffee', file: 'hazelnut-cold-coffee.webp' },
    { name: 'Oreo Shake', category: 'Shakes', file: 'oreo-shake.webp' },
    { name: 'Mint Mojito', category: 'Mojitos', file: 'mint-mojito.webp' },
    { name: 'White Sauce Pasta', category: 'Pasta', file: 'white-sauce-pasta.webp' },
    { name: 'Grilled Paneer Tortilla', category: 'Wraps', file: 'grilled-paneer-tortilla.webp' },
    { name: 'Paneer Momos', category: 'Momos', file: 'paneer-momos.webp' },
    { name: 'Grilled Paneer Cheese Sandwich', category: 'Sandwiches', file: 'grilled-paneer-cheese-sandwich.webp' },
    { name: 'Masala French Fries', category: 'Snacks', file: 'masala-french-fries.webp' },
    { name: 'Double Cheese Pizza', category: 'Pizza', file: 'double-cheese-pizza.webp' },
    { name: 'Bun Makhan (Masala) with Masala Tea', category: 'Tea & Bun', file: 'bun-makhan-masala-with-masala-tea.webp' },
    { name: 'Cheese Maggi', category: 'Maggi', file: 'cheese-maggi.webp' },
    { name: 'Mexican Cheese Burger', category: 'Burgers', file: 'mexican-cheese-burger.webp' },
  ];

  it('contains exactly 12 items in CAFE_SPECIALTIES_CATALOG with required fields', () => {
    expect(CAFE_SPECIALTIES_CATALOG).toHaveLength(12);

    for (const expected of expectedItems) {
      const match = CAFE_SPECIALTIES_CATALOG.find((item) => item.displayName === expected.name);
      expect(match, `Item "${expected.name}" not found in CAFE_SPECIALTIES_CATALOG`).toBeDefined();
      expect(match?.category).toBe(expected.category);
      expect(match?.aliases.length).toBeGreaterThan(0);
      expect(match?.estimatedNutrition.calories).toBeGreaterThan(0);
      expect(match?.generalizedDescription).toBeTruthy();
      expect(match?.visualPrompt).toBeTruthy();
    }
  });

  it('preserves uniqueness across all items in CANONICAL_GALLERY_CATALOG', () => {
    const normalizedSet = new Set(CANONICAL_GALLERY_CATALOG.map((i) => i.normalizedName));
    expect(normalizedSet.size).toBe(CANONICAL_GALLERY_CATALOG.length);
  });

  it('ensures all 12 WebP image assets exist and are non-empty in public/images/canonical/', () => {
    const canonicalDir = path.join(process.cwd(), 'public', 'images', 'canonical');

    for (const item of expectedItems) {
      const filePath = path.join(canonicalDir, item.file);
      expect(fs.existsSync(filePath), `Missing asset: ${filePath}`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(50_000); // High-res WebP (> 50KB)
    }
  });

  it('persists all 12 dishes category-wise in CanonicalDish with image assets and aliases in database', async () => {
    for (const expected of expectedItems) {
      const normalizedName = normalizeDishString(expected.name);
      const dish = await prisma.canonicalDish.findUnique({
        where: { normalizedName },
        include: {
          imageAsset: true,
          canonicalAliases: true,
          canonicalAssets: true,
        },
      });

      expect(dish, `Canonical dish "${normalizedName}" not found in database`).toBeDefined();
      expect(dish?.cuisine).toBe(expected.category);
      expect(dish?.reviewState).toBe('APPROVED');
      expect(dish?.imageAsset?.publicUrl).toBe(`/images/canonical/${expected.file}`);
      expect(dish?.canonicalAliases.length).toBeGreaterThan(0);

      // Verify display meta resolves category properly
      const meta = getCanonicalDisplayMeta(normalizedName, dish?.cuisine);
      expect(meta.category).toBe(expected.category);
      expect(meta.displayName).toBe(expected.name);
    }
  });
});

