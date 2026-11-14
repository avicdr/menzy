import { describe, expect, it } from 'vitest';
import { REALISTIC_FOOD_ASSET_MANIFEST } from '../src/lib/canonical/data/realistic-food-assets';
import {
  getCanonicalVisualStyle,
  getCanonicalVisualStyleLabel,
} from '../src/lib/canonical/visual-style';

describe('realistic food asset catalog', () => {
  it('has a unique food label and source file for every imported asset', () => {
    expect(REALISTIC_FOOD_ASSET_MANIFEST).toHaveLength(36);
    expect(new Set(REALISTIC_FOOD_ASSET_MANIFEST.map((item) => item.file)).size).toBe(36);
    for (const item of REALISTIC_FOOD_ASSET_MANIFEST) {
      expect(item.normalizedName).toMatch(/^[a-z0-9][a-z0-9 -]*$/);
      expect(item.displayName.length).toBeGreaterThan(2);
      expect(item.category.length).toBeGreaterThan(2);
    }
  });

  it('keeps imported photo assets separate from clay artwork', () => {
    expect(getCanonicalVisualStyle({ source: 'CURATED_REALISTIC' })).toBe('REALISTIC');
    expect(getCanonicalVisualStyle({ source: 'CURATED_CLAY' })).toBe('CLAY');
    expect(getCanonicalVisualStyle({ source: 'CANONICAL_LIBRARY' })).toBe('CLAY');
    expect(getCanonicalVisualStyleLabel('REALISTIC')).toBe('Realistic food photo');
    expect(getCanonicalVisualStyleLabel('CLAY')).toBe('3D clay artwork');
  });
});
