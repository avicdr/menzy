import { ThinkingLevel } from '@google/genai';
import prisma from '../db/prisma';
import {
  getGenAIClient,
  getTextModelCandidates,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from '../gemini/client';
import { callOpenAIChatJson, hasOpenAIFallback } from '../ai/openai-fallback';

export type CanonicalMatchSource =
  | 'EXACT'
  | 'ALIAS'
  | 'PHRASE'
  | 'TOKEN'
  | 'GEMINI_SEMANTIC'
  | 'NONE';

export interface CanonicalMatchResult {
  canonicalId: string | null;
  normalizedName: string;
  confidence: number;
  isAutoLinked: boolean;
  explanation: string;
  matchedSource?: CanonicalMatchSource;
}

export interface CanonicalBatchInput {
  dishName: string;
  category?: string;
  description?: string;
  cuisine?: string;
  dietaryLabels?: string[];
}

export interface CanonicalBatchOptions {
  useGemini?: boolean;
  restaurantId?: string | null;
  organizationId?: string | null;
  timeoutMs?: number;
}

export function normalizeDishString(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PLANT_OR_VEG_RE =
  /\b(paneer|cottage cheese|tofu|vegan|vegetarian|veg|veggie|vegetables?|jackfruit|kathal|halloumi|soya|soy|subz|plant-based|dairy-free)\b/i;

const EXPLICIT_VEG_WORD_RE = /\b(veg|vegetarian|vegan|jain|plant-based)\b/i;

const MEAT_OR_SEAFOOD_RE =
  /\b(chicken|murgh|mutton|lamb|gosht|keema|kheema|fish|machhli|machli|pomfret|surmai|bhetki|prawns?|shrimp|ebi|crab|crabstick|kani|salmon|tuna|eel|unagi|squid|calamari|octopus|pepperoni|bacon|ham|beef|buff|buffalo|pork|chashu|salami|duck|turkey|trotters|paya|brain|bheja|kidney|gurda|liver|kaleji|sausage|meatball|chorizo|prosciutto|anchovy|anchovies|lobster|scallops?)\b/i;

const RAW_EGG_RE =
  /\b(eggs?|omelettes?|omelets?|bhurji|shakshuka|frittata|poached|benedict|sunny side up|scrambled)\b/i;

const EGGLESS_RE = /\b(eggless|egg-free|no egg|without egg)\b/i;

const VEGAN_MARKER_RE = /\b(vegan|plant-based|dairy-free)\b/i;

const JAIN_MARKER_RE = /\bjain\b/i;

const JAIN_FORBIDDEN_RE =
  /\b(garlic|onion|onions|shallot|shallots|scallion|scallions|leek|leeks|lehsun|lasoon|pyaaz|pyaz|potato|potatoes|aloo|alu)\b/i;

const DAIRY_WORD_RE =
  /\b(milk|cheese|paneer|butter|ghee|cream|curd|yogurt|mascarpone|ricotta|feta|mozzarella|parmesan|whey|rabri|khoya|mawa|malai)\b/i;

const DRINK_WORD_RE =
  /\b(espresso|latte|cappuccino|mocha|macchiato|cortado|ristretto|lungo|americano|flat white|cold brew|pour-over|coffee|chai|tea|matcha|shake|smoothie|mojito|soda|cooler|juice|cocktail|martini|mule|sangria|spritz|negroni|beer|brew|frappe|hot chocolate|haldi doodh|lemonade|lassi|thandai|sharbat|drink|beverage|refresher|elixir|fizz|tonic|sip|cider|limonana|boba|bubble tea)\b/i;

const STRUCTURAL_FOOD_WORD_RE =
  /\b(cake|tart|pie|brownie|cookie|biscuit|muffin|croissant|cheesecake|pudding|gelato|ice cream|sundae|mousse|donut|doughnut|waffle|pancake|toast|sauce|glaze|rub|braised|pastry|crepe|macaron|truffle|pizza|pasta|penne|spaghetti|risotto|burger|sandwich|panini|wrap|roll|kathi|taco|burrito|quesadilla|nachos|fries|biryani|pulao|curry|korma|masala|kebab|tikka|nihari|dal|paneer|chicken|mutton|lamb|fish|prawns|shrimp|salmon|steak|salad|bowl|noodles|ramen|pho|sushi|sashimi|dumpling|dim sum|momos|bao|dosa|idli|vada|samosa|kachori|chaat|pakora|paratha|naan|roti|kulcha|omelette|shakshuka|eggs|bhurji|soup|shorba|halwa|gulab jamun|kulfi|kheer|falooda)\b/i;

const SPECIAL_DESSERT_WORD_RE =
  /\b(tiramisu|baklava|cannoli|profiterole|eclair|churros)\b/i;

const DRINK_CATEGORY_RE =
  /\b(coffee|coffees|tea|teas|shake|shakes|smoothie|smoothies|mocktail|mocktails|cocktail|cocktails|drink|drinks|beverage|beverages|brew|brews|juice|juices|elixir|elixirs|bar)\b/i;

const FOOD_CATEGORY_RE =
  /\b(pizza|pasta|burger|burgers|sandwich|sandwiches|bakery|bread|breads|pastry|pastries|cake|cakes|dessert|desserts|breakfast|starter|starters|small plate|small plates|main|mains|curry|curries|biryani|kebab|kebabs|chaat|sushi|asian|mexican|salad|salads|patisserie)\b/i;

const STOP_AND_FLUFF_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'with',
  'in',
  'on',
  'over',
  'by',
  'for',
  'to',
  'style',
  'styled',
  'classic',
  'signature',
  'special',
  'specials',
  'chefs',
  'chef',
  'house',
  'homemade',
  'artisanal',
  'artisan',
  'authentic',
  'traditional',
  'royal',
  'fresh',
  'freshly',
  'twice',
  'baked',
  'our',
]);

function hasEggIndicator(str: string): boolean {
  return Boolean(str) && RAW_EGG_RE.test(str) && !EGGLESS_RE.test(str);
}

function classifyDrinkOrSolidFood(str: string): { isDrink: boolean; isSolidFood: boolean } {
  if (!str) return { isDrink: false, isSolidFood: false };
  const hasDrinkToken = DRINK_WORD_RE.test(str);
  const hasStructuralFood = STRUCTURAL_FOOD_WORD_RE.test(str);
  const hasSpecialDessertWithoutDrink =
    SPECIAL_DESSERT_WORD_RE.test(str) &&
    !/\b(latte|espresso|coffee|mocha|frappe|martini|cocktail|shake|tea|chai|cooler|spritz|drink|beverage|sip|elixir)\b/i.test(
      str
    );

  const isSolidFood = hasStructuralFood || hasSpecialDessertWithoutDrink;
  const isDrink = !hasStructuralFood && hasDrinkToken;
  return { isDrink, isSolidFood };
}

function singularizeToken(token: string): string {
  if (token.length <= 4) return token;
  if (/(?:ss|us|is|os)$/.test(token)) return token;
  if (token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenizeDishName(normalized: string): Set<string> {
  const tokens = normalized
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !STOP_AND_FLUFF_WORDS.has(t))
    .map(singularizeToken)
    .filter((t) => t.length >= 2 && !STOP_AND_FLUFF_WORDS.has(t));

  return new Set(tokens);
}

function containsWholePhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  if (haystack === needle) return true;
  const pattern = new RegExp(`(?:^|[\\s-])${escapeRegExp(needle)}(?:$|[\\s-])`, 'i');
  return pattern.test(haystack);
}

interface IndexedCanonical {
  id: string;
  normalizedName: string;
  cuisine: string | null;
  imageAssetId: string | null;
  terms: string[];
  termTokens: Map<string, Set<string>>;
}

function buildIndexedCanonicals(
  canonicals: Array<{
    id: string;
    normalizedName: string;
    cuisine: string | null;
    imageAssetId: string | null;
    canonicalAliases?: Array<{ normalizedAlias: string }>;
  }>
): {
  indexed: IndexedCanonical[];
  byNorm: Map<string, IndexedCanonical>;
  byAlias: Map<string, IndexedCanonical>;
} {
  const byNorm = new Map<string, IndexedCanonical>();
  const byAlias = new Map<string, IndexedCanonical>();
  const indexed: IndexedCanonical[] = [];

  for (const c of canonicals) {
    const termsSet = new Set<string>([c.normalizedName]);
    for (const a of c.canonicalAliases || []) {
      if (a.normalizedAlias) {
        termsSet.add(a.normalizedAlias);
      }
    }
    const terms = Array.from(termsSet);
    const termTokens = new Map<string, Set<string>>();
    for (const term of terms) {
      termTokens.set(term, tokenizeDishName(term));
    }

    const entry: IndexedCanonical = {
      id: c.id,
      normalizedName: c.normalizedName,
      cuisine: c.cuisine || null,
      imageAssetId: c.imageAssetId || null,
      terms,
      termTokens,
    };

    indexed.push(entry);
    byNorm.set(c.normalizedName, entry);
    for (const a of c.canonicalAliases || []) {
      if (a.normalizedAlias && !byAlias.has(a.normalizedAlias)) {
        byAlias.set(a.normalizedAlias, entry);
      }
    }
  }

  return { indexed, byNorm, byAlias };
}

type CanonicalIndexData = ReturnType<typeof buildIndexedCanonicals>;

const CANONICAL_INDEX_CACHE_TTL_MS = 60_000;
const globalMatcherCache = globalThis as typeof globalThis & {
  __menzyCanonicalIndexCache?: {
    expiresAt: number;
    data: CanonicalIndexData;
  } | null;
  __menzyCanonicalIndexPromise?: Promise<CanonicalIndexData> | null;
};

export function invalidateCanonicalIndexCache(): void {
  globalMatcherCache.__menzyCanonicalIndexCache = null;
  globalMatcherCache.__menzyCanonicalIndexPromise = null;
}

async function loadCanonicalIndex(forceRefresh = false): Promise<CanonicalIndexData> {
  const now = Date.now();
  const cached = globalMatcherCache.__menzyCanonicalIndexCache;
  if (!forceRefresh && cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (!forceRefresh && globalMatcherCache.__menzyCanonicalIndexPromise) {
    return globalMatcherCache.__menzyCanonicalIndexPromise;
  }

  const fetchPromise = prisma.canonicalDish
    .findMany({
      select: {
        id: true,
        normalizedName: true,
        cuisine: true,
        imageAssetId: true,
        canonicalAliases: { select: { normalizedAlias: true } },
      },
    })
    .then((rows) => {
      const data = buildIndexedCanonicals(rows);
      globalMatcherCache.__menzyCanonicalIndexCache = {
        data,
        expiresAt: Date.now() + CANONICAL_INDEX_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      globalMatcherCache.__menzyCanonicalIndexPromise = null;
    });

  globalMatcherCache.__menzyCanonicalIndexPromise = fetchPromise;
  return fetchPromise;
}

export function isDietaryAndCategoryCompatible(params: {
  inputNorm: string;
  inputDescriptionNorm?: string;
  inputCategoryNorm?: string;
  inputDietaryLabels?: string[];
  canonNorm: string;
  termNorm: string;
  strictMode?: boolean;
}): boolean {
  const {
    inputNorm,
    inputDescriptionNorm = '',
    inputCategoryNorm = '',
    inputDietaryLabels = [],
    canonNorm,
    termNorm,
    strictMode = false,
  } = params;

  const normalizedLabels = new Set(
    inputDietaryLabels.map((l) => String(l ?? '').toUpperCase().trim())
  );
  const labelSaysNonVeg =
    normalizedLabels.has('NON_VEG') ||
    normalizedLabels.has('NON-VEG') ||
    normalizedLabels.has('NONVEG');
  const labelSaysEgg =
    normalizedLabels.has('EGG') ||
    normalizedLabels.has('CONTAINS_EGG') ||
    normalizedLabels.has('EGGETARIAN');
  const labelSaysVegan = normalizedLabels.has('VEGAN');
  const labelSaysJain = normalizedLabels.has('JAIN');
  const labelSaysVeg =
    !labelSaysNonVeg &&
    (normalizedLabels.has('VEG') ||
      normalizedLabels.has('VEGETARIAN') ||
      normalizedLabels.has('PURE_VEG') ||
      labelSaysJain ||
      labelSaysVegan);

  const isVegetarianOrVegan = PLANT_OR_VEG_RE.test(inputNorm);
  const isChickenOrMeat = MEAT_OR_SEAFOOD_RE.test(inputNorm);
  const isStrictVeg = (isVegetarianOrVegan || labelSaysVeg) && !isChickenOrMeat && !labelSaysNonVeg;
  const isStrictMeat = (isChickenOrMeat || labelSaysNonVeg) && !isVegetarianOrVegan && !labelSaysVeg;

  const cHasPlant = PLANT_OR_VEG_RE.test(canonNorm);
  const cHasMeat = MEAT_OR_SEAFOOD_RE.test(canonNorm);
  const cNormIsDualOption = cHasPlant && cHasMeat;

  if (!cNormIsDualOption) {
    if (isStrictVeg && cHasMeat) return false;
    if (isStrictMeat && cHasPlant) return false;
  }

  if (isStrictVeg && MEAT_OR_SEAFOOD_RE.test(termNorm)) return false;
  if (isStrictMeat && PLANT_OR_VEG_RE.test(termNorm)) return false;

  // Prevent "Vegetarian Salmon Bowl" or veg-labeled entrées from matching meat/seafood terms
  if (
    EXPLICIT_VEG_WORD_RE.test(inputNorm) &&
    MEAT_OR_SEAFOOD_RE.test(termNorm) &&
    !EXPLICIT_VEG_WORD_RE.test(termNorm)
  ) {
    return false;
  }

  // Prevent Eggless items (or explicitly non-egg strict Veg dishes in token/AI matching) matching egg dishes
  const inputIsEggless =
    EGGLESS_RE.test(inputNorm) ||
    EGGLESS_RE.test(inputDescriptionNorm);
  const canonHasEgg = hasEggIndicator(canonNorm) || hasEggIndicator(termNorm);

  if (inputIsEggless && canonHasEgg) {
    return false;
  }

  if (strictMode) {
    // Wait: don't map explicitly Veg / Vegan dish onto egg-based canonicals (e.g., shakshuka, omelette)
    const inputMentionsEgg = hasEggIndicator(inputNorm) || hasEggIndicator(inputDescriptionNorm) || labelSaysEgg;
    if ((isStrictVeg || labelSaysVegan) && !inputMentionsEgg && canonHasEgg) {
      return false;
    }

    // Prevent Vegan items from matching animal dairy / egg / meat canonicals unless explicitly vegan/plant
    const isVeganInput = VEGAN_MARKER_RE.test(inputNorm) || labelSaysVegan;
    if (isVeganInput) {
      if (cHasMeat || canonHasEgg) return false;
      if (DAIRY_WORD_RE.test(canonNorm) && !VEGAN_MARKER_RE.test(canonNorm)) {
        return false;
      }
    }

    // Egg-containing dish must not match a vegan canonical
    if (inputMentionsEgg && VEGAN_MARKER_RE.test(canonNorm)) {
      return false;
    }

    // Prevent Jain items from matching onion/garlic/potato canonicals
    const isJainInput = JAIN_MARKER_RE.test(inputNorm) || labelSaysJain;
    if (
      isJainInput &&
      (JAIN_FORBIDDEN_RE.test(canonNorm) || JAIN_FORBIDDEN_RE.test(termNorm)) &&
      !JAIN_MARKER_RE.test(canonNorm)
    ) {
      return false;
    }
  }

  // Prevent Food <-> Drink cross-pollution across phrase, token, and semantic steps
  const inputKind = classifyDrinkOrSolidFood(inputNorm);
  const canonKind = classifyDrinkOrSolidFood(canonNorm);
  const termKind = classifyDrinkOrSolidFood(termNorm);

  if (
    (inputKind.isDrink && (canonKind.isSolidFood || termKind.isSolidFood)) ||
    (inputKind.isSolidFood && (canonKind.isDrink || termKind.isDrink))
  ) {
    return false;
  }

  if (strictMode && inputCategoryNorm) {
    const catIsDrink = DRINK_CATEGORY_RE.test(inputCategoryNorm) && !FOOD_CATEGORY_RE.test(inputCategoryNorm);
    const catIsFood = FOOD_CATEGORY_RE.test(inputCategoryNorm) && !DRINK_CATEGORY_RE.test(inputCategoryNorm);
    if (catIsDrink && !inputKind.isSolidFood && (canonKind.isSolidFood || termKind.isSolidFood)) {
      return false;
    }
    if (catIsFood && !inputKind.isDrink && (canonKind.isDrink || termKind.isDrink)) {
      return false;
    }
  }

  return true;
}

function matchDeterministically(
  input: CanonicalBatchInput,
  indexData: {
    indexed: IndexedCanonical[];
    byNorm: Map<string, IndexedCanonical>;
    byAlias: Map<string, IndexedCanonical>;
  }
): CanonicalMatchResult {
  const normalized = normalizeDishString(input.dishName);
  if (!normalized) {
    return {
      canonicalId: null,
      normalizedName: '',
      confidence: 0.0,
      isAutoLinked: false,
      explanation: 'Distinct dish or house special — no canonical match',
      matchedSource: 'NONE',
    };
  }

  const inputDescNorm = normalizeDishString(input.description || '');
  const inputCatNorm = normalizeDishString(input.category || '');

  // 1. Direct normalized name match
  const directMatch = indexData.byNorm.get(normalized);
  if (directMatch) {
    return {
      canonicalId: directMatch.id,
      normalizedName: directMatch.normalizedName,
      confidence: 1.0,
      isAutoLinked: true,
      explanation: 'Exact canonical archetype match',
      matchedSource: 'EXACT',
    };
  }

  // 2. Known alias match
  const aliasMatch = indexData.byAlias.get(normalized);
  if (aliasMatch) {
    return {
      canonicalId: aliasMatch.id,
      normalizedName: aliasMatch.normalizedName,
      confidence: 0.95,
      isAutoLinked: true,
      explanation: `Matched known alias: "${normalized}"`,
      matchedSource: 'ALIAS',
    };
  }

  // 3. Substring / Archetypal Whole-Phrase Matching (longest phrase match across names & aliases)
  const phraseCandidates: Array<{
    canonicalId: string;
    normalizedName: string;
    matchedTerm: string;
    score: number;
  }> = [];

  for (const c of indexData.indexed) {
    for (const term of c.terms) {
      if (term.length < 4) continue;
      if (
        !isDietaryAndCategoryCompatible({
          inputNorm: normalized,
          inputDescriptionNorm: inputDescNorm,
          inputCategoryNorm: inputCatNorm,
          inputDietaryLabels: input.dietaryLabels,
          canonNorm: c.normalizedName,
          termNorm: term,
          strictMode: false,
        })
      ) {
        continue;
      }

      const termInsideInput = containsWholePhrase(normalized, term);
      const inputInsideTerm = normalized.length >= 5 && containsWholePhrase(term, normalized);
      if (termInsideInput || inputInsideTerm) {
        const isPrimary = term === c.normalizedName;
        const assetBonus = c.imageAssetId ? 2 : 0;
        const score = termInsideInput
          ? 10000 + term.length * 10 + (isPrimary ? 5 : 0) + assetBonus
          : Math.max(1, 5000 - term.length * 10 + (isPrimary ? 5 : 0) + assetBonus);
        phraseCandidates.push({
          canonicalId: c.id,
          normalizedName: c.normalizedName,
          matchedTerm: term,
          score,
        });
      }
    }
  }

  if (phraseCandidates.length > 0) {
    phraseCandidates.sort((a, b) => b.score - a.score);
  }
  const phraseBest = phraseCandidates[0] || null;
  const phraseBestTokenCount = phraseBest ? tokenizeDishName(phraseBest.matchedTerm).size : 0;

  // 4. Token-Overlap Closest Match (handles reordered modifiers, split phrases like
  // "almond frangipane twice-baked croissant", & pluralization safely)
  const inputTokens = tokenizeDishName(normalized);
  if (phraseBest && phraseBestTokenCount >= Math.max(2, inputTokens.size)) {
    return {
      canonicalId: phraseBest.canonicalId,
      normalizedName: phraseBest.normalizedName,
      confidence: 0.88,
      isAutoLinked: true,
      explanation: `Contextual archetype match with "${phraseBest.matchedTerm}"`,
      matchedSource: 'PHRASE',
    };
  }

  let tokenBest: {
    canonicalId: string;
    normalizedName: string;
    matchedTerm: string;
    score: number;
    confidence: number;
    overlap: number;
    fullTermMatch: boolean;
  } | null = null;

  if (inputTokens.size >= 2) {
    const tokenCandidates: Array<{
      canonicalId: string;
      normalizedName: string;
      matchedTerm: string;
      score: number;
      confidence: number;
      overlap: number;
      fullTermMatch: boolean;
    }> = [];

    for (const c of indexData.indexed) {
      for (const term of c.terms) {
        const termTokens = c.termTokens.get(term);
        if (!termTokens || termTokens.size < 2) continue;

        if (
          !isDietaryAndCategoryCompatible({
            inputNorm: normalized,
            inputDescriptionNorm: inputDescNorm,
            inputCategoryNorm: inputCatNorm,
            inputDietaryLabels: input.dietaryLabels,
            canonNorm: c.normalizedName,
            termNorm: term,
            strictMode: true,
          })
        ) {
          continue;
        }

        let overlap = 0;
        for (const tok of termTokens) {
          if (inputTokens.has(tok)) overlap++;
        }

        if (overlap < 2) continue;

        const termCoverage = overlap / termTokens.size;
        const inputCoverage = overlap / inputTokens.size;
        const unionSize = inputTokens.size + termTokens.size - overlap;
        const jaccard = unionSize > 0 ? overlap / unionSize : 0;

        const fullTermMatch = termCoverage === 1.0 && inputCoverage >= 0.4;
        const partialClosestMatch = termCoverage >= 0.66 && jaccard >= 0.42;

        if (!fullTermMatch && !partialClosestMatch) {
          continue;
        }

        const isPrimary = term === c.normalizedName;
        const score =
          (fullTermMatch ? 1000 : 0) +
          (c.imageAssetId ? 200 : 0) +
          Math.round(jaccard * 500) +
          Math.round(termCoverage * 250) +
          overlap * 40 +
          (isPrimary ? 10 : 0);

        tokenCandidates.push({
          canonicalId: c.id,
          normalizedName: c.normalizedName,
          matchedTerm: term,
          score,
          confidence: fullTermMatch ? 0.84 : 0.76,
          overlap,
          fullTermMatch,
        });
      }
    }

    if (tokenCandidates.length > 0) {
      tokenCandidates.sort((a, b) => b.score - a.score);
      tokenBest = tokenCandidates[0];
    }
  }

  // Prefer multi-token full-term match over a less-specific single/shorter phrase match
  // (e.g., "almond frangipane twice-baked croissant" -> "almond frangipane croissant" [3 tokens] over "croissant" [1 token])
  if (tokenBest && (!phraseBest || (tokenBest.fullTermMatch && tokenBest.overlap > phraseBestTokenCount))) {
    return {
      canonicalId: tokenBest.canonicalId,
      normalizedName: tokenBest.normalizedName,
      confidence: tokenBest.confidence,
      isAutoLinked: true,
      explanation: `Closest token archetype match with "${tokenBest.matchedTerm}"`,
      matchedSource: 'TOKEN',
    };
  }

  if (phraseBest) {
    return {
      canonicalId: phraseBest.canonicalId,
      normalizedName: phraseBest.normalizedName,
      confidence: 0.88,
      isAutoLinked: true,
      explanation: `Contextual archetype match with "${phraseBest.matchedTerm}"`,
      matchedSource: 'PHRASE',
    };
  }

  return {
    canonicalId: null,
    normalizedName: normalized,
    confidence: 0.0,
    isAutoLinked: false,
    explanation: 'Distinct dish or house special — no canonical match',
    matchedSource: 'NONE',
  };
}

function parseSemanticJsonResponse(rawText: string): Array<{
  idx: number;
  canonicalNormalizedName: string | null;
  confidence?: number;
  reason?: string;
}> {
  const cleaned = (rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } else {
      return [];
    }
  }

  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.matches) ? parsed.matches : [];
  return list.filter((entry: any) => entry && typeof entry.idx === 'number');
}

/**
 * Matches a batch of restaurant dishes in one DB preload + optional single batched Gemini semantic pass.
 * Prefer linking closest canonical gallery art (0 credits) while strictly protecting dietary & category boundaries.
 */
export async function matchCanonicalDishesBatch(
  items: CanonicalBatchInput[],
  options: CanonicalBatchOptions = {}
): Promise<CanonicalMatchResult[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const indexData = await loadCanonicalIndex();
  const results: CanonicalMatchResult[] = items.map((item) =>
    matchDeterministically(item, indexData)
  );

  const shouldUseGemini = options.useGemini !== false;
  if (!shouldUseGemini || indexData.indexed.length === 0) {
    return results;
  }

  const unresolvedIndices: number[] = [];
  for (let i = 0; i < results.length; i++) {
    if (!results[i].canonicalId && normalizeDishString(items[i].dishName)) {
      unresolvedIndices.push(i);
    }
  }

  if (unresolvedIndices.length === 0) {
    return results;
  }

  // Prefer canonical dishes with approved illustrations so linked dishes display 3D art immediately
  const seededCanonicals = indexData.indexed.filter((c) => Boolean(c.imageAssetId));
  const candidatePool = seededCanonicals.length > 0 ? seededCanonicals : indexData.indexed;
  const candidateByNorm = new Map(candidatePool.map((c) => [c.normalizedName, c]));

  const geminiClients = resolveGeminiAttemptClients(getGenAIClient('text'), 'text');
  const openAiEnabled = hasOpenAIFallback();

  if (geminiClients.length === 0 && !openAiEnabled) {
    return results;
  }

  const unresolvedPayload = unresolvedIndices.map((idx) => {
    const it = items[idx];
    return {
      idx,
      name: it.dishName,
      category: it.category || 'General',
      description: it.description ? it.description.slice(0, 140) : undefined,
      dietary: it.dietaryLabels && it.dietaryLabels.length > 0 ? it.dietaryLabels : undefined,
    };
  });

  const canonicalCatalogLines = candidatePool
    .slice(0, 800)
    .map((c) => (c.cuisine ? `${c.normalizedName} | ${c.cuisine}` : c.normalizedName))
    .join('\n');

  const systemPrompt = `You match restaurant dishes to the closest visual archetype in our Canonical 3D Illustration Library so restaurants reuse verified dish artwork instead of generating blank placeholders.

CRITICAL SAFETY RULES:
1. Choose ONLY an exact "normalizedName" from the provided CANONICAL LIBRARY list (before the " | " separator), or null if no reasonable culinary/visual match exists.
2. NEVER match VEG / VEGETARIAN / VEGAN / JAIN dishes to meat, poultry, fish, seafood, or egg canonicals.
3. NEVER match VEGAN dishes to dairy/paneer/cheese/egg/meat canonicals (unless explicitly vegan/plant-based).
4. NEVER match EGGLESS items to egg-based canonicals.
5. NEVER match JAIN dishes to canonicals containing garlic, onion, shallots, leeks, or potato (e.g., garlic naan, onion bhaji, aloo).
6. NEVER match food dishes to drinks/beverages, or drinks/beverages to solid food dishes.
7. Only return a match when confidence >= 0.70 and the visual appearance on the plate/glass is genuinely close (e.g., "Hazelnut Cold Coffee" -> "frappe cold coffee", "Belgian Dark Mocha" -> "cafe mocha"). Return null for unrelated specials.

Return ONLY valid JSON:
{
  "matches": [
    { "idx": 0, "canonicalNormalizedName": "exact_normalized_name_or_null", "confidence": 0.85, "reason": "short explanation" }
  ]
}`;

  const userPrompt = `DISHES TO MATCH:
${JSON.stringify(unresolvedPayload)}

CANONICAL LIBRARY (normalizedName | cuisine):
${canonicalCatalogLines}`;

  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 15000;
  const modelCandidates = getTextModelCandidates();
  let rawResponseText: string | null = null;
  let usedModel = modelCandidates[0] || 'gemini-3-flash-preview';

  const invalidKeySet = new Set<string>();
  let abortModelCascade = false;

  for (let mIdx = 0; mIdx < modelCandidates.length && !rawResponseText && !abortModelCascade; mIdx++) {
    const candidateModel = modelCandidates[mIdx];

    for (let kIdx = 0; kIdx < geminiClients.length; kIdx++) {
      const entry = geminiClients[kIdx];
      if (invalidKeySet.has(entry.key)) continue;

      const controller = new AbortController();
      let requestTimer: ReturnType<typeof setTimeout> | undefined;
      let raceTimer: ReturnType<typeof setTimeout> | undefined;

      try {
        requestTimer = setTimeout(() => {
          controller.abort(new Error('CANONICAL_MATCH_TIMEOUT'));
        }, timeoutMs);

        const modelConfig: Record<string, any> = {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
          httpOptions: { timeout: Math.max(10_000, timeoutMs) },
        };

        if (candidateModel.startsWith('gemini-3')) {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        }

        const response: any = await Promise.race([
          entry.client.models.generateContent({
            model: candidateModel,
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: modelConfig,
          }),
          new Promise<never>((_, reject) => {
            raceTimer = setTimeout(() => reject(new Error('CANONICAL_MATCH_TIMEOUT')), timeoutMs + 250);
          }),
        ]);

        if (response?.text) {
          rawResponseText = response.text;
          usedModel = candidateModel;
          break;
        }
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        const status = Number(err?.status ?? err?.statusCode ?? 0);
        if (
          status === 401 ||
          status === 403 ||
          msg.includes('api_key_invalid') ||
          msg.includes('api key not valid') ||
          msg.includes('permission_denied') ||
          msg.includes('leaked')
        ) {
          invalidKeySet.add(entry.key);
        }

        if (entry.key !== 'mock-injected-client') {
          markGeminiKeyCooldown(entry.key, err, 'text');
        } else {
          abortModelCascade = true;
        }
        console.warn(
          `[CanonicalMatcher] Batched semantic match failed (${candidateModel}, key ${entry.maskedKey}):`,
          err?.message || err
        );
        if (abortModelCascade) break;
      } finally {
        if (requestTimer) clearTimeout(requestTimer);
        if (raceTimer) clearTimeout(raceTimer);
      }
    }
  }

  if (!rawResponseText && openAiEnabled) {
    try {
      const openAiRes = await callOpenAIChatJson({
        systemPrompt,
        userPrompt,
        timeoutMs,
      });
      rawResponseText = openAiRes.text;
      usedModel = openAiRes.model;
    } catch (openAiErr: any) {
      console.warn('[CanonicalMatcher] OpenAI semantic fallback failed:', openAiErr?.message || openAiErr);
    }
  }

  if (!rawResponseText) {
    return results;
  }

  try {
    const semanticMatches = parseSemanticJsonResponse(rawResponseText);
    const unresolvedSet = new Set(unresolvedIndices);

    for (const m of semanticMatches) {
      if (!unresolvedSet.has(m.idx) || !m.canonicalNormalizedName) continue;
      const confidence = typeof m.confidence === 'number' ? m.confidence : 0.78;
      if (confidence < 0.65) continue;

      const targetKey = normalizeDishString(m.canonicalNormalizedName);
      const matchedCanon = candidateByNorm.get(targetKey) || indexData.byNorm.get(targetKey);
      if (!matchedCanon) continue;

      const inputItem = items[m.idx];
      const inputNorm = normalizeDishString(inputItem.dishName);
      const inputDescNorm = normalizeDishString(inputItem.description || '');
      const inputCatNorm = normalizeDishString(inputItem.category || '');

      if (
        !isDietaryAndCategoryCompatible({
          inputNorm,
          inputDescriptionNorm: inputDescNorm,
          inputCategoryNorm: inputCatNorm,
          inputDietaryLabels: inputItem.dietaryLabels,
          canonNorm: matchedCanon.normalizedName,
          termNorm: matchedCanon.normalizedName,
          strictMode: true,
        })
      ) {
        continue;
      }

      results[m.idx] = {
        canonicalId: matchedCanon.id,
        normalizedName: matchedCanon.normalizedName,
        confidence: Math.min(0.84, confidence),
        isAutoLinked: true,
        explanation: m.reason
          ? `Closest semantic canonical match: ${m.reason}`
          : `Closest semantic canonical match with "${matchedCanon.normalizedName}"`,
        matchedSource: 'GEMINI_SEMANTIC',
      };
    }

    await prisma.aIUsageEvent
      .create({
        data: {
          organizationId: options.organizationId || null,
          restaurantId: options.restaurantId || null,
          operationType: 'CANONICAL_MATCH',
          modelId: usedModel,
          inputTokens: Math.min(8000, Math.round(userPrompt.length / 4)),
          outputTokens: Math.min(2000, Math.round(rawResponseText.length / 4)),
          estimatedCostUsd: 0.00018,
          status: 'SUCCESS',
          latencyMs: Date.now() - startTime,
        },
      })
      .catch(() => {});
  } catch (parseErr) {
    console.warn('[CanonicalMatcher] Failed to parse semantic match JSON:', parseErr);
  }

  return results;
}

/**
 * Matches a single restaurant dish against the shared canonical database.
 * Uses deterministic Steps 1-4 (exact -> alias -> phrase -> token overlap), plus optional Gemini semantic pass.
 */
export async function matchCanonicalDish(params: {
  dishName: string;
  category?: string;
  description?: string;
  cuisine?: string;
  dietaryLabels?: string[];
  useGemini?: boolean;
  restaurantId?: string | null;
  organizationId?: string | null;
}): Promise<CanonicalMatchResult> {
  const [result] = await matchCanonicalDishesBatch(
    [
      {
        dishName: params.dishName,
        category: params.category,
        description: params.description,
        cuisine: params.cuisine,
        dietaryLabels: params.dietaryLabels,
      },
    ],
    {
      useGemini: Boolean(params.useGemini),
      restaurantId: params.restaurantId,
      organizationId: params.organizationId,
    }
  );

  return (
    result || {
      canonicalId: null,
      normalizedName: '',
      confidence: 0.0,
      isAutoLinked: false,
      explanation: 'Distinct dish or house special — no canonical match',
      matchedSource: 'NONE',
    }
  );
}
