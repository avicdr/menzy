import { z } from 'zod';
import {
  getGenAIClient,
  getTextModelName,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from './client';
import {
  callOpenAIVisionMenuExtraction,
  hasOpenAIFallback,
} from '../ai/openai-fallback';
import prisma from '../db/prisma';

export const ExtractedVariantSchema = z.object({
  name: z.string(),
  priceMinor: z.number().nullable(),
});

export const ExtractedMenuItemSchema = z.object({
  sourceName: z.string(),
  normalizedName: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  priceMinor: z.number().nullable(),
  currency: z.enum(['INR', 'USD']),
  variants: z.array(ExtractedVariantSchema).default([]),
  explicitIngredients: z.array(z.string()).default([]),
  dietaryLabels: z.array(z.string()).default([]),
  allergenStatements: z.array(z.string()).default([]),
  sourcePage: z.number().default(1),
  sourceText: z.string().default(''),
  confidence: z.number().min(0).max(1).default(0.9),
  needsReview: z.boolean().default(false),
  suggestedCanonicalKey: z.string().nullable().default(null),
  visualDescription: z.string(),
  isPopular: z.boolean().default(false),
  chefRecommended: z.boolean().default(false),
});

export const ExtractedMenuResultSchema = z.object({
  restaurantName: z.string().nullable().optional(),
  detectedCurrency: z.enum(['INR', 'USD']).default('INR'),
  categories: z.array(z.string()),
  items: z.array(ExtractedMenuItemSchema),
});

export type ExtractedMenuItem = z.infer<typeof ExtractedMenuItemSchema>;
export type ExtractedMenuResult = z.infer<typeof ExtractedMenuResultSchema>;

export function parsePriceMinor(rawPrice: any, currency: 'INR' | 'USD'): number | null {
  if (rawPrice == null || rawPrice === '') return null;
  const num = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return null;

  if (currency === 'INR') {
    // If extracted as 435 or 435.00, it represents 435 rupees -> 43500 paise
    // If > 10000, it's likely already in minor units (paise)
    if (num > 0 && num < 10000) {
      return Math.round(num * 100);
    }
    return Math.round(num);
  } else {
    // USD: e.g. 14.50 or 14 -> 1450 cents
    if (num > 0 && num < 500) {
      return Math.round(num * 100);
    }
    return Math.round(num);
  }
}

export function normalizeItem(raw: any, fallbackCategory: string, currency: 'INR' | 'USD'): ExtractedMenuItem {
  const sourceName = (raw.sourceName || raw.name || raw.dishName || raw.title || 'Untitled Dish').trim();
  const normalizedName = (raw.normalizedName || sourceName).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const category = (raw.category || raw.categoryName || fallbackCategory || 'General').trim();
  const description = raw.description || raw.desc || null;
  const priceMinor = parsePriceMinor(raw.priceMinor ?? raw.price, currency);

  // Dietary labels normalization
  let dietaryLabels: string[] = [];
  const rawLabels = raw.dietaryLabels || raw.dietaryStatus || raw.dietary || raw.type || [];
  const labelArray = Array.isArray(rawLabels) ? rawLabels : [rawLabels];
  for (const l of labelArray) {
    if (!l) continue;
    const str = String(l).toUpperCase().trim().replace(/[\s-]/g, '_');
    if (str.includes('NON_VEG') || str === 'NONVEG') dietaryLabels.push('NON_VEG');
    else if (str.includes('VEG') && !str.includes('NON')) dietaryLabels.push('VEG');
    else if (str.includes('EGG')) dietaryLabels.push('EGG');
    else if (str.includes('JAIN')) dietaryLabels.push('JAIN');
    else if (str.includes('VEGAN')) dietaryLabels.push('VEGAN');
    else if (str.includes('GLUTEN_FREE') || str === 'GF') dietaryLabels.push('GLUTEN_FREE');
    else dietaryLabels.push(str);
  }
  dietaryLabels = Array.from(new Set(dietaryLabels));

  // Variants
  const variants: Array<{ name: string; priceMinor: number | null }> = [];
  if (Array.isArray(raw.variants)) {
    for (const v of raw.variants) {
      if (typeof v === 'string') {
        variants.push({ name: v, priceMinor: null });
      } else if (typeof v === 'object' && v !== null) {
        variants.push({
          name: v.name || v.size || 'Standard',
          priceMinor: parsePriceMinor(v.priceMinor ?? v.price, currency),
        });
      }
    }
  }

  return {
    sourceName,
    normalizedName,
    category,
    description: description ? String(description).trim() : null,
    priceMinor,
    currency,
    variants,
    explicitIngredients: Array.isArray(raw.explicitIngredients || raw.ingredients)
      ? (raw.explicitIngredients || raw.ingredients).map((i: any) => String(i).trim())
      : [],
    dietaryLabels,
    allergenStatements: Array.isArray(raw.allergenStatements || raw.allergens)
      ? (raw.allergenStatements || raw.allergens).map((a: any) => String(a).trim())
      : [],
    sourcePage: Number(raw.sourcePage || 1),
    sourceText: String(raw.sourceText || sourceName),
    confidence: Number(raw.confidence || 0.95),
    needsReview: Boolean(raw.needsReview),
    suggestedCanonicalKey: raw.suggestedCanonicalKey || null,
    visualDescription: raw.visualDescription || `${sourceName} served fresh in restaurant presentation.`,
    isPopular: Boolean(raw.isPopular || raw.bestseller || raw.chefRecommended),
    chefRecommended: Boolean(raw.chefRecommended || raw.chefSpecial || raw.mustTry),
  };
}

export function normalizeExtractedMenuResponse(parsedRaw: any, defaultCurrency: 'INR' | 'USD'): ExtractedMenuResult {
  const currency = (parsedRaw?.detectedCurrency === 'USD' || defaultCurrency === 'USD') ? 'USD' : 'INR';
  const restaurantName = parsedRaw?.restaurantName || null;

  const categoriesSet = new Set<string>();
  const itemsList: ExtractedMenuItem[] = [];

  // Format A: parsedRaw.categories is an array of objects: [ { name: "Indian Meals", items: [...] } ]
  if (Array.isArray(parsedRaw?.categories)) {
    for (const cat of parsedRaw.categories) {
      if (typeof cat === 'string') {
        if (cat.trim()) categoriesSet.add(cat.trim());
      } else if (typeof cat === 'object' && cat !== null) {
        const catName = (cat.name || cat.category || cat.title || cat.categoryName || 'General').trim();
        categoriesSet.add(catName);
        const catItems = cat.items || cat.dishes || cat.menuItems || [];
        if (Array.isArray(catItems)) {
          for (const item of catItems) {
            itemsList.push(normalizeItem(item, catName, currency));
          }
        }
      }
    }
  }

  // Format B: items are at the root level: parsedRaw.items or parsedRaw.dishes
  const rootItems = parsedRaw?.items || parsedRaw?.dishes || parsedRaw?.menuItems || [];
  if (Array.isArray(rootItems)) {
    for (const item of rootItems) {
      const itemCat = (item.category || item.categoryName || Array.from(categoriesSet)[0] || 'General').trim();
      categoriesSet.add(itemCat);
      itemsList.push(normalizeItem(item, itemCat, currency));
    }
  }

  // Format C: parsedRaw is directly an array of items
  if (Array.isArray(parsedRaw)) {
    for (const item of parsedRaw) {
      const itemCat = (item.category || item.categoryName || 'General').trim();
      categoriesSet.add(itemCat);
      itemsList.push(normalizeItem(item, itemCat, currency));
    }
  }

  // If no categories were gathered, derive from items
  if (categoriesSet.size === 0) {
    for (const item of itemsList) {
      if (item.category) categoriesSet.add(item.category);
    }
  }

  // Fallback category if still empty
  if (categoriesSet.size === 0) {
    categoriesSet.add('Main Menu');
  }

  return {
    restaurantName,
    detectedCurrency: currency,
    categories: Array.from(categoriesSet),
    items: itemsList,
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You are a precise restaurant-menu extraction engine. Read the supplied menu image(s) or PDF exactly.
Extract all menu categories, dishes, prices, descriptions, and dietary indicators. Preserve dish names and groupings.

Dietary indicator guidelines:
- For Indian menus, detect standard FSSAI symbols and labels:
  - VEG (pure vegetarian, green square with green filled circle)
  - NON_VEG (non-vegetarian, brown/red square with brown/red filled triangle)
  - EGG (contains egg / eggitarian, yellow square with yellow circle or egg symbol)
  - JAIN (pure veg prepared strictly without onion, garlic, or root vegetables)
- For Western menus, detect:
  - VEGAN, VEGETARIAN, GLUTEN_FREE, DAIRY_FREE, NUT_FREE, HALAL, KOSHER.
- If an item is highlighted as 'Bestseller', 'Popular', 'Chef Special', or marked with a star/flame, set isPopular or chefRecommended to true.

Output format: Return ONLY a valid JSON object matching this structure:
{
  "restaurantName": "Restaurant Name if visible",
  "detectedCurrency": "INR or USD",
  "categories": [
    {
      "name": "Category Name (e.g. Indian Meals, Biryani & Rice)",
      "items": [
        {
          "sourceName": "Exact Dish Name as shown (e.g. Classic Delhi Meal)",
          "category": "Category Name",
          "description": "Item description or ingredients listed under dish",
          "price": 435,
          "dietaryLabels": ["VEG"],
          "isPopular": false,
          "chefRecommended": false,
          "visualDescription": "Brief description of the dish appearance"
        }
      ]
    }
  ]
}`;

export async function extractMenuFromImages(params: {
  images: Array<{ buffer: Buffer; mimeType: string }>;
  restaurantId?: string | null;
  currencyDefault?: 'INR' | 'USD';
}): Promise<ExtractedMenuResult> {
  const startTime = Date.now();
  const geminiClients = resolveGeminiAttemptClients(getGenAIClient());
  const openAiEnabled = hasOpenAIFallback();
  const modelName = getTextModelName();
  const currency = params.currencyDefault || 'INR';

  if (geminiClients.length === 0 && !openAiEnabled) {
    const errorMsg = 'No AI Vision provider is configured (GEMINI_API_KEY / GEMINI_API_KEYS or OPENAI_API_KEY missing). Extraction cannot proceed without valid AI credentials.';
    console.error(`[VisionExtractor] ${errorMsg}`);
    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: params.restaurantId || null,
        operationType: 'MENU_EXTRACTION',
        modelId: modelName,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        status: 'FAILED',
        latencyMs: Date.now() - startTime,
      },
    }).catch(() => {});
    throw new Error('Menu extraction service is currently unavailable. Please check system credentials and try again later.');
  }

  if (!params.images || params.images.length === 0) {
    throw new Error('No readable menu image files were provided. Please upload valid image files (JPG, PNG, WebP) or PDF.');
  }

  const extractionUserPrompt = `Extract all menu categories, dishes, prices (in minor units cents/paise), dietary indicators and visual descriptions according to the JSON schema. Use currency: ${currency}. Return ONLY a JSON object.`;
  const timeoutMs = Number(process.env.GEMINI_EXTRACTION_TIMEOUT_MS) || 45000;

  const parseAndValidateResponse = (responseText: string): ExtractedMenuResult => {
    if (!responseText.trim()) {
      throw new Error('Empty response received from vision model.');
    }

    let parsedRaw: any;
    try {
      // Strip markdown code fences if model enclosed JSON in ```json ... ```
      const cleanedJson = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsedRaw = JSON.parse(cleanedJson);
    } catch {
      throw new Error('Vision model returned malformed output that could not be parsed.');
    }

    // Normalize both hierarchical { categories: [{ name, items }] } and flat { categories, items } formats
    const normalized = normalizeExtractedMenuResponse(parsedRaw, currency);
    const validated = ExtractedMenuResultSchema.parse(normalized);

    if (!validated.items || validated.items.length === 0) {
      throw new Error('No dishes or menu entries could be detected in the uploaded image. Please ensure the menu photo is clear, focused, and well-lit.');
    }

    return validated;
  };

  let lastError: unknown;
  let usedModel = modelName;

  try {
    const parts: any[] = params.images.map((img) => ({
      inlineData: {
        data: img.buffer.toString('base64'),
        mimeType: img.mimeType,
      },
    }));

    parts.push({
      text: extractionUserPrompt,
    });

    for (let idx = 0; idx < geminiClients.length; idx++) {
      const entry = geminiClients[idx];
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => {
        controller.abort(new Error('GEMINI_EXTRACTION_TIMEOUT'));
      }, timeoutMs);

      try {
        const response: any = await Promise.race([
          entry.client.models.generateContent({
            model: modelName,
            contents: [
              { role: 'user', parts },
            ],
            config: {
              systemInstruction: EXTRACTION_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              abortSignal: controller.signal,
              httpOptions: { timeout: timeoutMs },
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Menu extraction timed out. Please try again with a clearer or smaller menu photo.')), timeoutMs + 250)
          ),
        ]);

        const validated = parseAndValidateResponse(response?.text || '');

        const latencyMs = Date.now() - startTime;
        await prisma.aIUsageEvent.create({
          data: {
            restaurantId: params.restaurantId || null,
            operationType: 'MENU_EXTRACTION',
            modelId: modelName,
            inputTokens: 1200,
            outputTokens: 800,
            estimatedCostUsd: 0.00066,
            status: 'SUCCESS',
            latencyMs,
          },
        }).catch(() => {});

        return validated;
      } catch (geminiErr) {
        lastError = geminiErr;
        if (entry.key !== 'mock-injected-client') {
          markGeminiKeyCooldown(entry.key, geminiErr);
        }
        console.warn(
          `[VisionExtractor] Gemini key ${entry.maskedKey} (${idx + 1}/${geminiClients.length}) failed:`,
          geminiErr instanceof Error ? geminiErr.message : geminiErr
        );
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    if (openAiEnabled) {
      try {
        const openAiRes = await callOpenAIVisionMenuExtraction({
          systemPrompt: EXTRACTION_SYSTEM_PROMPT,
          userPrompt: extractionUserPrompt,
          files: params.images,
          timeoutMs,
        });
        usedModel = openAiRes.model;
        const validated = parseAndValidateResponse(openAiRes.text);

        const latencyMs = Date.now() - startTime;
        await prisma.aIUsageEvent.create({
          data: {
            restaurantId: params.restaurantId || null,
            operationType: 'MENU_EXTRACTION',
            modelId: openAiRes.model,
            inputTokens: openAiRes.inputTokens,
            outputTokens: openAiRes.outputTokens,
            estimatedCostUsd: 0.001,
            status: 'SUCCESS',
            latencyMs,
          },
        }).catch(() => {});

        return validated;
      } catch (openAiErr) {
        lastError = openAiErr;
        console.warn(
          '[VisionExtractor] OpenAI fallback extraction failed:',
          openAiErr instanceof Error ? openAiErr.message : openAiErr
        );
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Menu extraction failed. Please ensure the menu photo is clear and try again later.');
  } catch (err: any) {
    console.error('Menu extraction error:', err);
    const latencyMs = Date.now() - startTime;
    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: params.restaurantId || null,
        operationType: 'MENU_EXTRACTION',
        modelId: usedModel,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        status: 'FAILED',
        latencyMs,
      },
    }).catch(() => {});

    // Convert raw Zod error JSON into human-friendly message if applicable
    let friendlyMsg = err?.message || 'Menu extraction failed. Please ensure the menu photo is clear and try again later.';
    if (typeof friendlyMsg === 'string' && friendlyMsg.trim().startsWith('[') && friendlyMsg.includes('"code"')) {
      try {
        const parsed = JSON.parse(friendlyMsg);
        if (Array.isArray(parsed)) {
          friendlyMsg = `Menu extraction format mismatch: ${parsed.map((p: any) => `${p.path?.join('.') || 'root'}: ${p.message}`).join(', ')}`;
        }
      } catch {}
    }

    throw new Error(friendlyMsg);
  }
}

