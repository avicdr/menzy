import { describe, it, expect } from 'vitest';
import { normalizeDishString, matchCanonicalDish } from '../src/lib/canonical/matcher';
import prisma from '../src/lib/db/prisma';

describe('Shared Canonical Knowledge Matching', () => {
  it('normalizes dish strings cleanly', () => {
    expect(normalizeDishString('  Classic Cappuccino!!  ')).toBe('classic cappuccino');
    expect(normalizeDishString('Murgh Makhani (Butter Chicken)')).toBe('murgh makhani butter chicken');
  });

  it('matches exact canonical dishes in database', async () => {
    const result = await matchCanonicalDish({
      dishName: 'Cappuccino',
    });

    expect(result.canonicalId).toBeDefined();
    expect(result.normalizedName).toBe('cappuccino');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('resolves known aliases', async () => {
    const result = await matchCanonicalDish({
      dishName: 'Karak Chai',
    });

    expect(result.canonicalId).toBeDefined();
    expect(result.normalizedName).toBe('masala chai');
  });

  it('never merges vegetarian and meat dishes', async () => {
    const result = await matchCanonicalDish({
      dishName: 'Paneer Butter Masala',
    });

    // Should NOT match butter chicken
    if (result.canonicalId) {
      expect(result.normalizedName).not.toBe('butter chicken');
    }
  });
});

