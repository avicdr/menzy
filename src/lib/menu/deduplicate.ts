export type PrimaryDietaryBucket = 'VEG' | 'NON_VEG' | 'EGG' | 'UNSPECIFIED';

const GENERIC_CATEGORY_KEYS = new Set([
  '',
  'general',
  'main menu',
  'featured menu',
  'chef specials',
  'chefs specials',
  'chef special',
  'specials',
  'other',
  'menu',
]);

export function normalizeDishNameKey(name: string | null | undefined): string {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCategoryKey(category: string | null | undefined): string {
  return String(category || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isGenericCategory(category: string | null | undefined): boolean {
  return GENERIC_CATEGORY_KEYS.has(normalizeCategoryKey(category));
}

export function resolvePrimaryDietaryBucket(
  labels?: Array<string | null | undefined> | null,
  foodType?: string | null
): PrimaryDietaryBucket {
  const combined: string[] = [];
  if (foodType) combined.push(foodType);
  if (Array.isArray(labels)) {
    for (const l of labels) {
      if (l) combined.push(String(l));
    }
  }

  let hasNonVeg = false;
  let hasEgg = false;
  let hasVeg = false;

  for (const raw of combined) {
    const token = raw.toUpperCase().trim().replace(/[\s-]+/g, '_');
    if (!token) continue;
    if (token === 'NON_VEG' || token === 'NONVEG' || token.includes('NON_VEG')) {
      hasNonVeg = true;
    } else if (token === 'EGG' || token === 'EGGETARIAN' || token === 'CONTAINS_EGG') {
      hasEgg = true;
    } else if (
      token === 'VEG' ||
      token === 'PURE_VEG' ||
      token === 'VEGETARIAN' ||
      token === 'VEGAN' ||
      token === 'JAIN'
    ) {
      hasVeg = true;
    }
  }

  if (hasNonVeg) return 'NON_VEG';
  if (hasEgg) return 'EGG';
  if (hasVeg) return 'VEG';
  return 'UNSPECIFIED';
}

export interface DishComparable {
  name: string;
  category?: string | null;
  priceMinor?: number | null;
  dietaryBucket?: PrimaryDietaryBucket;
}

export function areDishesLikelyDuplicate(a: DishComparable, b: DishComparable): boolean {
  const nameA = normalizeDishNameKey(a.name);
  const nameB = normalizeDishNameKey(b.name);
  if (!nameA || !nameB || nameA !== nameB) {
    return false;
  }

  const bucketA = a.dietaryBucket || 'UNSPECIFIED';
  const bucketB = b.dietaryBucket || 'UNSPECIFIED';
  if (bucketA !== 'UNSPECIFIED' && bucketB !== 'UNSPECIFIED' && bucketA !== bucketB) {
    return false;
  }

  const catA = normalizeCategoryKey(a.category);
  const catB = normalizeCategoryKey(b.category);

  if (catA && catB && catA === catB) {
    return true;
  }

  if (isGenericCategory(a.category) || isGenericCategory(b.category)) {
    return true;
  }

  const hasValidPriceA = typeof a.priceMinor === 'number' && Number.isFinite(a.priceMinor) && a.priceMinor > 0;
  const hasValidPriceB = typeof b.priceMinor === 'number' && Number.isFinite(b.priceMinor) && b.priceMinor > 0;

  if (!hasValidPriceA || !hasValidPriceB) {
    return true;
  }

  return Math.round(a.priceMinor!) === Math.round(b.priceMinor!);
}

export function mergeDietaryLabelsSafely(
  existing: string[],
  incoming: string[]
): string[] {
  const bucketExisting = resolvePrimaryDietaryBucket(existing);
  const combined = new Set(existing.map((s) => String(s).trim()).filter(Boolean));

  for (const tagRaw of incoming) {
    const tag = String(tagRaw).trim();
    if (!tag) continue;
    const upper = tag.toUpperCase().replace(/[\s-]+/g, '_');

    // Never introduce contradictory VEG/VEGAN/JAIN tags onto a NON_VEG or EGG item
    if (
      (bucketExisting === 'NON_VEG' || bucketExisting === 'EGG') &&
      ['VEG', 'PURE_VEG', 'VEGETARIAN', 'VEGAN', 'JAIN'].includes(upper)
    ) {
      continue;
    }

    combined.add(tag);
  }

  return Array.from(combined);
}

export function deduplicateDishCollection<T>(
  items: T[],
  toComparable: (item: T) => DishComparable,
  mergePair: (existing: T, duplicate: T) => T
): {
  uniqueItems: T[];
  duplicatesRemoved: number;
} {
  const uniqueItems: T[] = [];
  const comparables: DishComparable[] = [];
  let duplicatesRemoved = 0;

  for (const item of items) {
    const comp = toComparable(item);
    const existingIdx = comparables.findIndex((existingComp) =>
      areDishesLikelyDuplicate(existingComp, comp)
    );

    if (existingIdx >= 0) {
      const merged = mergePair(uniqueItems[existingIdx], item);
      uniqueItems[existingIdx] = merged;
      comparables[existingIdx] = toComparable(merged);
      duplicatesRemoved++;
    } else {
      uniqueItems.push(item);
      comparables.push(comp);
    }
  }

  return { uniqueItems, duplicatesRemoved };
}

