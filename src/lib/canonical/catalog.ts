import {
  CANONICAL_CATEGORY_ORDER,
  type CanonicalCatalogItem,
  type CanonicalGalleryCategory,
  type CanonicalNutritionEstimate,
} from './types';
import { COFFEES_CATALOG } from './data/coffees';
import { TEAS_AND_DRINKS_CATALOG } from './data/teas-and-drinks';
import { BREAKFAST_AND_BAKERY_CATALOG } from './data/breakfast-and-bakery';
import { SANDWICHES_AND_STARTERS_CATALOG } from './data/sandwiches-and-starters';
import { PIZZAS_AND_MAINS_CATALOG } from './data/pizzas-and-mains';
import { DESSERTS_CATALOG } from './data/desserts';
import { AWADHI_MUGHLAI_CATALOG } from './data/awadhi-mughlai';
import { NORTH_INDIAN_TANDOOR_CATALOG } from './data/north-indian-tandoor';
import { STREET_FOOD_SOUTH_INDIAN_CATALOG } from './data/street-food-south-indian';
import { PAN_ASIAN_CATALOG } from './data/pan-asian';
import { CONTINENTAL_MEDITERRANEAN_CATALOG } from './data/continental-mediterranean';
import { PATISSERIE_FROZEN_CATALOG } from './data/patisserie-frozen';
import { COCKTAILS_CRAFT_DRINKS_CATALOG } from './data/cocktails-craft-drinks';

export {
  CANONICAL_CATEGORY_ORDER,
  type CanonicalCatalogItem,
  type CanonicalGalleryCategory,
  type CanonicalNutritionEstimate,
};

export const CANONICAL_GALLERY_CATALOG: CanonicalCatalogItem[] = [
  ...COFFEES_CATALOG,
  ...TEAS_AND_DRINKS_CATALOG,
  ...BREAKFAST_AND_BAKERY_CATALOG,
  ...SANDWICHES_AND_STARTERS_CATALOG,
  ...PIZZAS_AND_MAINS_CATALOG,
  ...DESSERTS_CATALOG,
  ...AWADHI_MUGHLAI_CATALOG,
  ...NORTH_INDIAN_TANDOOR_CATALOG,
  ...STREET_FOOD_SOUTH_INDIAN_CATALOG,
  ...PAN_ASIAN_CATALOG,
  ...CONTINENTAL_MEDITERRANEAN_CATALOG,
  ...PATISSERIE_FROZEN_CATALOG,
  ...COCKTAILS_CRAFT_DRINKS_CATALOG,
];

const CATALOG_BY_NORMALIZED = new Map<string, CanonicalCatalogItem>(
  CANONICAL_GALLERY_CATALOG.map((item) => [item.normalizedName, item])
);

if (CATALOG_BY_NORMALIZED.size !== CANONICAL_GALLERY_CATALOG.length) {
  throw new Error(
    `Duplicate normalizedName detected in CANONICAL_GALLERY_CATALOG (${CANONICAL_GALLERY_CATALOG.length} entries vs ${CATALOG_BY_NORMALIZED.size} unique)`
  );
}

export function sortCanonicalCategories(categories: string[]): string[] {
  const rankMap = new Map<string, number>(
    CANONICAL_CATEGORY_ORDER.map((category, idx) => [category, idx])
  );
  return [...categories].sort((a, b) => {
    const rankA = rankMap.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rankMap.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b);
  });
}

export function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCanonicalDisplayMeta(normalizedName: string, dbCuisine?: string | null): {
  displayName: string;
  category: string;
  cuisine: string;
} {
  const key = normalizedName.toLowerCase().trim();
  const catalogMatch = CATALOG_BY_NORMALIZED.get(key);
  if (catalogMatch) {
    return {
      displayName: catalogMatch.displayName,
      category: catalogMatch.category,
      cuisine: dbCuisine || catalogMatch.cuisine,
    };
  }

  return {
    displayName: toTitleCase(normalizedName),
    category: dbCuisine || 'Curated Dish',
    cuisine: dbCuisine || 'Global',
  };
}
