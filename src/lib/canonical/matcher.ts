import prisma from '../db/prisma';

export interface CanonicalMatchResult {
  canonicalId: string | null;
  normalizedName: string;
  confidence: number;
  isAutoLinked: boolean;
  explanation: string;
}

export function normalizeDishString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a restaurant dish against the shared canonical database
 */
export async function matchCanonicalDish(params: {
  dishName: string;
  category?: string;
  description?: string;
  cuisine?: string;
}): Promise<CanonicalMatchResult> {
  const normalized = normalizeDishString(params.dishName);

  // 1. Direct normalized name match
  const directMatch = await prisma.canonicalDish.findUnique({
    where: { normalizedName: normalized },
  });

  if (directMatch) {
    return {
      canonicalId: directMatch.id,
      normalizedName: directMatch.normalizedName,
      confidence: 1.0,
      isAutoLinked: true,
      explanation: 'Exact canonical archetype match',
    };
  }

  // 2. Known alias match
  const aliasMatch = await prisma.canonicalAlias.findFirst({
    where: { normalizedAlias: normalized },
    include: { canonical: true },
  });

  if (aliasMatch?.canonical) {
    return {
      canonicalId: aliasMatch.canonical.id,
      normalizedName: aliasMatch.canonical.normalizedName,
      confidence: 0.95,
      isAutoLinked: true,
      explanation: `Matched known alias: "${aliasMatch.normalizedAlias}"`,
    };
  }

  // 3. Substring / Archetypal Keyword Matching
  // Ensure we don't accidentally merge chicken with vegan/paneer, etc.
  const isVegetarianOrVegan =
    normalized.includes('paneer') ||
    normalized.includes('tofu') ||
    normalized.includes('vegan') ||
    normalized.includes('vegetarian');

  const isChickenOrMeat =
    normalized.includes('chicken') ||
    normalized.includes('murgh') ||
    normalized.includes('beef') ||
    normalized.includes('pork') ||
    normalized.includes('bacon');

  const canonicals = await prisma.canonicalDish.findMany();

  for (const c of canonicals) {
    const cNorm = c.normalizedName;

    // Safety checks against conflating meats and vegetarian dishes
    if (isVegetarianOrVegan && (cNorm.includes('chicken') || cNorm.includes('meat'))) {
      continue;
    }
    if (isChickenOrMeat && (cNorm.includes('paneer') || cNorm.includes('vegan'))) {
      continue;
    }

    // Check if the canonical name is contained within the restaurant's dish title
    if (normalized.includes(cNorm) || cNorm.includes(normalized)) {
      const confidence = 0.88;
      return {
        canonicalId: c.id,
        normalizedName: c.normalizedName,
        confidence,
        isAutoLinked: true,
        explanation: `Contextual archetype match with "${c.normalizedName}"`,
      };
    }
  }

  // No high-confidence match found — dish remains venue-specific
  return {
    canonicalId: null,
    normalizedName: normalized,
    confidence: 0.0,
    isAutoLinked: false,
    explanation: 'Distinct dish or house special — no canonical match',
  };
}

