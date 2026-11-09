import { describe, it, expect } from 'vitest';
import { extractMenuFromImages } from '../src/lib/gemini/vision-extractor';

describe('Menu Extraction Strict Error Handling', () => {
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
});

