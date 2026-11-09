import { describe, it, expect } from 'vitest';
import {
  extractMenuFromImages,
  normalizeExtractedMenuResponse,
  parsePriceMinor,
} from '../src/lib/gemini/vision-extractor';

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
});


