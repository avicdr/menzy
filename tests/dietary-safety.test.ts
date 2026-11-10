import { describe, it, expect } from 'vitest';
import { resolveDishDietarySignals, matchesDietaryFilter } from '../src/lib/diner/dietary';
import { normalizeItem } from '../src/lib/gemini/vision-extractor';

describe('Dietary Safety & Consistency Helpers', () => {
  it('never shows Green Pure-Veg or Vegan badges when allergen info declares eggs or dairy', () => {
    const eggPasta = {
      dietaryStatus: ['VEGETARIAN', 'VEGAN'],
      allergenVerification: { contains: ['Gluten', 'Eggs', 'Dairy'], freeOf: ['Peanuts'] },
    };

    const signals = resolveDishDietarySignals(eggPasta);
    expect(signals.containsEgg).toBe(true);
    expect(signals.containsDairy).toBe(true);
    expect(signals.isVeganSafe).toBe(false);
    expect(signals.isVegSafe).toBe(false);
    expect(signals.indianMarker).toBe('EGG');
    expect(signals.displayLabels).not.toContain('VEGAN');
    expect(signals.displayLabels).toContain('EGG');
    expect(matchesDietaryFilter(eggPasta, 'VEGAN')).toBe(false);
    expect(matchesDietaryFilter(eggPasta, 'VEG')).toBe(false);
    expect(matchesDietaryFilter(eggPasta, 'EGG')).toBe(true);
  });

  it('strips contradictory Gluten-Free, Dairy-Free, or Veg claims when allergens conflict', () => {
    const sourdoughFetaToast = {
      dietaryStatus: ['VEGETARIAN', 'GLUTEN_FREE', 'DAIRY_FREE'],
      allergenVerification: { contains: ['Gluten', 'Dairy', 'Sesame'], freeOf: ['Eggs'] },
    };

    const signals = resolveDishDietarySignals(sourdoughFetaToast);
    expect(signals.containsGluten).toBe(true);
    expect(signals.containsDairy).toBe(true);
    expect(signals.containsEgg).toBe(false);
    expect(signals.indianMarker).toBe('VEG');
    expect(signals.displayLabels).toEqual(['VEGETARIAN']);
    expect(matchesDietaryFilter(sourdoughFetaToast, 'GLUTEN_FREE')).toBe(false);
    expect(matchesDietaryFilter(sourdoughFetaToast, 'DAIRY_FREE')).toBe(false);
  });

  it('prioritizes NON_VEG over EGG over VEG when conflicting tags exist', () => {
    const mixed = {
      dietaryStatus: ['VEG', 'EGG', 'NON_VEG'],
      allergenVerification: { contains: [] },
    };

    const signals = resolveDishDietarySignals(mixed);
    expect(signals.indianMarker).toBe('NON_VEG');
    expect(signals.displayLabels).toEqual(['NON_VEG']);
  });

  it('preserves VEGAN separately from VEG during menu OCR extraction', () => {
    const item = normalizeItem(
      {
        sourceName: 'Oat Milk Latte',
        price: 6.5,
        dietaryLabels: ['Vegan', 'Dairy-Free'],
      },
      'Coffee',
      'USD'
    );
    expect(item.dietaryLabels).toContain('VEGAN');
    expect(item.dietaryLabels).not.toContain('VEG');
  });
});

