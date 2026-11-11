import { describe, it, expect } from 'vitest';
import {
  extractMenuFromImages,
  normalizeExtractedMenuResponse,
  parsePriceMinor,
} from '../src/lib/gemini/vision-extractor';
import {
  areDishesLikelyDuplicate,
  deduplicateDishCollection,
  mergeDietaryLabelsSafely,
  normalizeDishNameKey,
  resolvePrimaryDietaryBucket,
} from '../src/lib/menu/deduplicate';

describe('Menu Extraction Strict Error Handling & Normalization', () => {
  it('throws an error and never populates dummy dishes when image extraction fails', async () => {
    // When called with empty or invalid images
    await expect(
      extractMenuFromImages({
        images: [],
        restaurantId: 'test-restaurant-id',
        currencyDefault: 'INR',
      })
    ).rejects.toThrow();
  });

  it('rejects with a user-friendly error message rather than returning simulated data', async () => {
    try {
      await extractMenuFromImages({
        images: [],
        restaurantId: 'test-restaurant-id',
        currencyDefault: 'INR',
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.message).toBeDefined();
      // Ensure it is not returning simulated dishes
      expect(err.message).not.toContain('Filter Coffee Cappuccino');
    }
  });

  it('correctly parses hierarchical Gemini response with categories containing items', () => {
    // Exact response structure returned by Gemini for the user's Indian menu:
    const geminiHierarchicalOutput = {
      restaurantName: 'Indian Flavours',
      categories: [
        {
          name: 'Indian Meals',
          items: [
            {
              name: 'Classic Delhi Meal',
              price: 435,
              description: 'Paneer Butter Masala, Dal Makhani and Laccha Paratha/ Naan',
              dietaryLabels: ['VEG'],
            },
            {
              name: 'Classic Chicken Punjabi Meal',
              price: '465/-',
              description: 'Amritsari butter Chicken, Dal Makhani and Laccha Paratha/ Naan',
              dietaryLabels: ['NON_VEG'],
            },
          ],
        },
        {
          name: 'Biryani & Rice',
          items: [
            {
              name: 'Veg Dum Biryani',
              price: 395,
              description: 'Aromatic long grain basmati rice flavoured with spices',
              dietaryLabels: ['VEG'],
            },
          ],
        },
      ],
    };

    const normalized = normalizeExtractedMenuResponse(geminiHierarchicalOutput, 'INR');

    expect(normalized.categories).toEqual(['Indian Meals', 'Biryani & Rice']);
    expect(normalized.items).toHaveLength(3);

    // Item 1: Classic Delhi Meal
    expect(normalized.items[0].sourceName).toBe('Classic Delhi Meal');
    expect(normalized.items[0].category).toBe('Indian Meals');
    expect(normalized.items[0].priceMinor).toBe(43500); // 435 Rs -> 43500 paise
    expect(normalized.items[0].dietaryLabels).toContain('VEG');

    // Item 2: Classic Chicken Punjabi Meal
    expect(normalized.items[1].sourceName).toBe('Classic Chicken Punjabi Meal');
    expect(normalized.items[1].category).toBe('Indian Meals');
    expect(normalized.items[1].priceMinor).toBe(46500); // 465/- -> 46500 paise
    expect(normalized.items[1].dietaryLabels).toContain('NON_VEG');

    // Item 3: Veg Dum Biryani
    expect(normalized.items[2].sourceName).toBe('Veg Dum Biryani');
    expect(normalized.items[2].category).toBe('Biryani & Rice');
    expect(normalized.items[2].priceMinor).toBe(39500);
    expect(normalized.items[2].dietaryLabels).toContain('VEG');
  });

  it('correctly converts various price notations to minor currency units', () => {
    // INR conversion
    expect(parsePriceMinor(435, 'INR')).toBe(43500);
    expect(parsePriceMinor('465/-', 'INR')).toBe(46500);
    expect(parsePriceMinor('₹395.00', 'INR')).toBe(39500);
    expect(parsePriceMinor(43500, 'INR')).toBe(43500); // Already minor

    // USD conversion
    expect(parsePriceMinor(14.5, 'USD')).toBe(1450);
    expect(parsePriceMinor('$26.00', 'USD')).toBe(2600);
    expect(parsePriceMinor(2600, 'USD')).toBe(2600);
  });

  it('deduplicates overlapping dishes across categories, punctuation variants, and Format A+B responses while preserving distinct dietary/portion variants', () => {
    const overlappingOutput = {
      restaurantName: 'Spice Route',
      categories: [
        {
          name: 'Chinese Starters',
          items: [
            {
              name: 'Dragon Chicken',
              price: 295,
              description: '',
              dietaryLabels: ['NON_VEG'],
            },
            {
              name: 'Spring Roll',
              price: 210,
              dietaryLabels: ['VEG'],
            },
            {
              name: 'Spring Roll',
              price: 260,
              dietaryLabels: ['NON_VEG'],
            },
            {
              name: 'Paneer Tikka (Half)',
              price: 180,
              dietaryLabels: ['VEG'],
            },
            {
              name: 'Paneer Tikka (Full)',
              price: 320,
              dietaryLabels: ['VEG'],
            },
          ],
        },
        {
          name: 'Chef Specials',
          items: [
            {
              name: 'dragon   chicken!',
              price: 295,
              description: 'Crispy wok-tossed chicken strips in spicy red chili glaze',
              dietaryLabels: ['NON_VEG', 'VEG'],
              isPopular: true,
            },
          ],
        },
      ],
      items: [
        {
          name: 'Dragon Chicken',
          category: 'Chinese Starters',
          price: 295,
          dietaryLabels: ['NON_VEG'],
        },
      ],
    };

    const normalized = normalizeExtractedMenuResponse(overlappingOutput, 'INR');

    expect(normalized.items).toHaveLength(5);
    const dragonItems = normalized.items.filter(
      (i) => normalizeDishNameKey(i.sourceName) === 'dragon chicken'
    );
    expect(dragonItems).toHaveLength(1);
    expect(dragonItems[0].category).toBe('Chinese Starters');
    expect(dragonItems[0].description).toContain('Crispy wok-tossed chicken');
    expect(dragonItems[0].isPopular).toBe(true);
    // Conflicting VEG tag dropped from NON_VEG item safely
    expect(dragonItems[0].dietaryLabels).toContain('NON_VEG');
    expect(dragonItems[0].dietaryLabels).not.toContain('VEG');
    // Chef Specials had no unique items left so empty category is omitted
    expect(normalized.categories).toEqual(['Chinese Starters']);
  });

  it('safely deduplicates draft collections without collapsing non-veg and veg dishes with the same name', () => {
    const vegRoll = {
      name: 'Hakka Noodles',
      category: 'Chinese',
      priceMinor: 22000,
      dietaryBucket: resolvePrimaryDietaryBucket(['VEG']),
    };
    const nonVegRoll = {
      name: 'Hakka Noodles',
      category: 'Chinese',
      priceMinor: 26000,
      dietaryBucket: resolvePrimaryDietaryBucket(['NON_VEG']),
    };
    expect(areDishesLikelyDuplicate(vegRoll, nonVegRoll)).toBe(false);

    const { uniqueItems, duplicatesRemoved } = deduplicateDishCollection(
      [
        { name: 'Chilli Chicken Dry/Gravy', category: 'CHINESE', priceMinor: 29500, dietaryLabels: ['NON_VEG'] },
        { name: 'Chilli Chicken Dry Gravy', category: 'General', priceMinor: 0, dietaryLabels: ['NON_VEG', 'VEG'] },
        { name: 'Hakka Noodles', category: 'CHINESE', priceMinor: 22000, dietaryLabels: ['VEG'] },
        { name: 'Hakka Noodles', category: 'CHINESE', priceMinor: 26000, dietaryLabels: ['NON_VEG'] },
      ],
      (d) => ({
        name: d.name,
        category: d.category,
        priceMinor: d.priceMinor,
        dietaryBucket: resolvePrimaryDietaryBucket(d.dietaryLabels),
      }),
      (existing, dup) => ({
        ...existing,
        priceMinor: existing.priceMinor > 0 ? existing.priceMinor : dup.priceMinor,
        dietaryLabels: mergeDietaryLabelsSafely(existing.dietaryLabels, dup.dietaryLabels),
      })
    );

    expect(duplicatesRemoved).toBe(1);
    expect(uniqueItems).toHaveLength(3);
  });
});


