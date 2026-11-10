export type IndianFssaiMarker = 'VEG' | 'NON_VEG' | 'EGG';

export interface ResolvedDishDietarySignals {
  indianMarker: IndianFssaiMarker | null;
  displayLabels: string[];
  containsEgg: boolean;
  containsDairy: boolean;
  containsGluten: boolean;
  containsNuts: boolean;
  containsMeatOrSeafood: boolean;
  isVeganSafe: boolean;
  isVegSafe: boolean;
  isVegetarianSafe: boolean;
  isNonVeg: boolean;
  isEggDish: boolean;
}

const EGG_RE = /\b(eggs?|egg yolk|egg white)\b/i;
const DAIRY_RE = /\b(dairy|milk|lactose|butter|ghee|cheese|feta|cream|yogurt|curd|paneer|whey|casein|mozzarella|parmesan|mascarpone|ricotta)\b/i;
const GLUTEN_RE = /\b(gluten|wheat|barley|rye|spelt|semolina)\b/i;
const NUT_RE = /\b(nuts?|tree nuts?|peanuts?|almonds?|cashews?|walnuts?|pistachios?|hazelnuts?|pecans?)\b/i;
const MEAT_SEAFOOD_RE = /\b(meat|chicken|murgh|mutton|lamb|beef|pork|bacon|ham|fish|shellfish|crustacean|prawns?|shrimp|crab|lobster|salmon|tuna|squid|calamari|anchov)\b/i;

function normalizeLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((l) => String(l ?? '').toUpperCase().trim().replace(/[\s-]+/g, '_'))
        .filter(Boolean)
    )
  );
}

export function resolveDishDietarySignals(item: any): ResolvedDishDietarySignals {
  const rawLabels = normalizeLabels(item?.dietaryStatus);
  const containsList: string[] = Array.isArray(item?.allergenVerification?.contains)
    ? item.allergenVerification.contains.map((c: any) => String(c ?? ''))
    : [];
  const containsJoined = containsList.join(' | ');

  const containsEgg =
    EGG_RE.test(containsJoined) ||
    rawLabels.some((l) => l === 'EGG' || l === 'CONTAINS_EGG' || l === 'EGGETARIAN');
  const containsDairy = DAIRY_RE.test(containsJoined);
  const containsGluten = GLUTEN_RE.test(containsJoined);
  const containsNuts = NUT_RE.test(containsJoined);
  const containsMeatOrSeafood =
    MEAT_SEAFOOD_RE.test(containsJoined) ||
    rawLabels.some((l) => l === 'NON_VEG' || l === 'NONVEG');

  const isNonVeg = containsMeatOrSeafood;
  const isEggDish = !isNonVeg && containsEgg;
  const hasVegLabel = rawLabels.some((l) =>
    ['VEG', 'VEGETARIAN', 'PURE_VEG', 'JAIN', 'VEGAN'].includes(l)
  );

  const indianMarker: IndianFssaiMarker | null = isNonVeg
    ? 'NON_VEG'
    : isEggDish
    ? 'EGG'
    : hasVegLabel
    ? 'VEG'
    : null;

  const isVeganSafe =
    !isNonVeg && !containsEgg && !containsDairy && rawLabels.includes('VEGAN');
  const isVegSafe = !isNonVeg && !containsEgg && hasVegLabel;
  const isVegetarianSafe =
    !isNonVeg && (rawLabels.includes('VEGETARIAN') || rawLabels.includes('VEG') || rawLabels.includes('PURE_VEG') || rawLabels.includes('VEGAN') || rawLabels.includes('JAIN'));

  const cleaned: string[] = [];
  for (const label of rawLabels) {
    if (isNonVeg && ['VEG', 'PURE_VEG', 'VEGETARIAN', 'VEGAN', 'JAIN', 'EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(label)) {
      continue;
    }
    if (label === 'VEGAN' && !isVeganSafe) {
      continue;
    }
    if ((label === 'VEG' || label === 'PURE_VEG') && containsEgg) {
      continue;
    }
    if ((label === 'GLUTEN_FREE' || label === 'GF') && containsGluten) {
      continue;
    }
    if ((label === 'DAIRY_FREE' || label === 'DF') && containsDairy) {
      continue;
    }
    if (label === 'NUT_FREE' && containsNuts) {
      continue;
    }
    cleaned.push(label);
  }

  if (isNonVeg && !cleaned.includes('NON_VEG')) {
    cleaned.unshift('NON_VEG');
  }
  if (isEggDish && !cleaned.some((l) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l))) {
    cleaned.push('EGG');
  }

  return {
    indianMarker,
    displayLabels: Array.from(new Set(cleaned)),
    containsEgg,
    containsDairy,
    containsGluten,
    containsNuts,
    containsMeatOrSeafood,
    isVeganSafe,
    isVegSafe,
    isVegetarianSafe,
    isNonVeg,
    isEggDish,
  };
}

export function matchesDietaryFilter(item: any, filterId: string): boolean {
  const norm = filterId.toUpperCase().trim();
  if (!norm || norm === 'ALL') return true;
  const signals = resolveDishDietarySignals(item);

  if (norm === 'NON_VEG') return signals.isNonVeg;
  if (norm === 'EGG') return signals.isEggDish;
  if (norm === 'VEG') return signals.isVegSafe;
  if (norm === 'VEGAN') return signals.isVeganSafe;
  if (norm === 'VEGETARIAN') return signals.isVegetarianSafe;
  if (norm === 'GLUTEN_FREE') {
    return signals.displayLabels.some((l) => l === 'GLUTEN_FREE' || l === 'GF');
  }
  if (norm === 'DAIRY_FREE') {
    return signals.displayLabels.some((l) => l === 'DAIRY_FREE' || l === 'DF');
  }

  return signals.displayLabels.includes(norm);
}

