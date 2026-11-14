import { z } from 'zod';
import { createPartFromUri, ThinkingLevel } from '@google/genai';
import { resolveMenuMimeForExtraction } from '../menu/menu-file-validator';
import {
  getGenAIClient,
  getTextModelCandidates,
  getTextModelName,
  isGeminiModelUnavailableError,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from './client';
import {
  callOpenAIVisionMenuExtraction,
  hasOpenAIFallback,
} from '../ai/openai-fallback';
import prisma from '../db/prisma';
import {
  deduplicateDishCollection,
  isGenericCategory,
  mergeDietaryLabelsSafely,
  resolvePrimaryDietaryBucket,
} from '../menu/deduplicate';

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
    else if (str.includes('VEGAN')) dietaryLabels.push('VEGAN');
    else if (str.includes('EGG')) dietaryLabels.push('EGG');
    else if (str.includes('JAIN')) dietaryLabels.push('JAIN');
    else if (str === 'VEGETARIAN') dietaryLabels.push('VEGETARIAN');
    else if (str.includes('VEG') && !str.includes('NON')) dietaryLabels.push('VEG');
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

  // Deduplicate overlapping dishes across pages or when a model emits both hierarchical and flat arrays
  const { uniqueItems: deduplicatedItems } = deduplicateDishCollection(
    itemsList,
    (item) => ({
      name: item.sourceName || item.normalizedName,
      category: item.category,
      priceMinor: item.priceMinor,
      dietaryBucket: resolvePrimaryDietaryBucket(item.dietaryLabels),
    }),
    (existing, dup) => {
      const mergedCategory =
        isGenericCategory(existing.category) && !isGenericCategory(dup.category)
          ? dup.category
          : existing.category;

      const mergedPrice =
        existing.priceMinor != null && existing.priceMinor > 0
          ? existing.priceMinor
          : dup.priceMinor;

      const existingDesc = existing.description?.trim() || '';
      const dupDesc = dup.description?.trim() || '';
      const mergedDesc = dupDesc.length > existingDesc.length ? dupDesc : existingDesc || null;

      const variantMap = new Map<string, { name: string; priceMinor: number | null }>();
      for (const v of [...existing.variants, ...dup.variants]) {
        const key = v.name.trim().toLowerCase();
        if (!key) continue;
        const prev = variantMap.get(key);
        if (!prev || (prev.priceMinor == null && v.priceMinor != null)) {
          variantMap.set(key, v);
        }
      }

      return {
        ...existing,
        category: mergedCategory,
        description: mergedDesc,
        priceMinor: mergedPrice,
        variants: Array.from(variantMap.values()),
        explicitIngredients: Array.from(
          new Set([...existing.explicitIngredients, ...dup.explicitIngredients].filter(Boolean))
        ),
        dietaryLabels: mergeDietaryLabelsSafely(existing.dietaryLabels, dup.dietaryLabels),
        allergenStatements: Array.from(
          new Set([...existing.allergenStatements, ...dup.allergenStatements].filter(Boolean))
        ),
        isPopular: existing.isPopular || dup.isPopular,
        chefRecommended: existing.chefRecommended || dup.chefRecommended,
        confidence: Math.max(existing.confidence, dup.confidence),
      };
    }
  );

  // Preserve declared category order while dropping empty categories or adding item categories
  const orderedCategories = new Set<string>();
  for (const declared of categoriesSet) {
    if (deduplicatedItems.some((it) => it.category === declared)) {
      orderedCategories.add(declared);
    }
  }
  for (const item of deduplicatedItems) {
    if (item.category) orderedCategories.add(item.category);
  }
  if (orderedCategories.size === 0) {
    orderedCategories.add('Main Menu');
  }

  return {
    restaurantName,
    detectedCurrency: currency,
    categories: Array.from(orderedCategories),
    items: deduplicatedItems,
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You are a precise restaurant-menu extraction engine. Read ALL supplied menu photos and ALL pages of any supplied PDF document completely.
Extract every menu category, dish, price, portion/variant, description, and dietary indicator across every page without stopping after the first page or skipping columns/sidebars. Preserve exact dish names and category groupings, and set sourcePage (1-indexed page or image number) accurately.

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
          "variants": [{ "name": "Half", "price": 250 }],
          "dietaryLabels": ["VEG"],
          "sourcePage": 1,
          "isPopular": false,
          "chefRecommended": false,
          "visualDescription": "Brief description of the dish appearance"
        }
      ]
    }
  ]
}`;

const INLINE_PAYLOAD_MAX_BYTES = 12 * 1024 * 1024; // Switch to Gemini Files API above 12 MB raw bytes

async function buildGeminiMediaParts(
  client: any,
  files: Array<{ buffer: Buffer; mimeType: string }>
): Promise<{ parts: any[]; uploadedFileNames: string[] }> {
  const totalBytes = files.reduce((sum, f) => sum + f.buffer.length, 0);
  const canUploadFiles = typeof client?.files?.upload === 'function';
  const uploadedFileNames: string[] = [];

  if (totalBytes <= INLINE_PAYLOAD_MAX_BYTES || !canUploadFiles) {
    return {
      parts: files.map((img) => ({
        inlineData: {
          data: img.buffer.toString('base64'),
          mimeType: img.mimeType,
        },
      })),
      uploadedFileNames,
    };
  }

  const parts: any[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Upload large payloads (e.g., big scanned PDFs) via Gemini Files API; keep small images inline
    if (file.buffer.length > 3 * 1024 * 1024) {
      try {
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimeType });
        let uploaded = await client.files.upload({
          file: blob,
          config: {
            mimeType: file.mimeType,
            displayName: `menu-upload-${i + 1}${file.mimeType === 'application/pdf' ? '.pdf' : ''}`,
          },
        });

        if (uploaded?.name) {
          uploadedFileNames.push(uploaded.name);
        }

        if (uploaded?.name && uploaded?.state === 'PROCESSING' && typeof client.files.get === 'function') {
          for (let attempt = 0; attempt < 8; attempt++) {
            await new Promise((r) => setTimeout(r, 750));
            const checked = await client.files.get({ name: uploaded.name });
            uploaded = checked;
            if (checked?.state !== 'PROCESSING') break;
          }
        }

        if (uploaded?.state === 'FAILED') {
          throw new Error('Gemini could not process the uploaded PDF file.');
        }

        if (uploaded?.uri) {
          parts.push(createPartFromUri(uploaded.uri, uploaded.mimeType || file.mimeType));
          continue;
        }
      } catch (uploadErr) {
        console.warn('[VisionExtractor] Gemini Files API upload fallback to inlineData:', uploadErr);
      }
    }

    parts.push({
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimeType,
      },
    });
  }

  return { parts, uploadedFileNames };
}

export async function extractMenuFromImages(params: {
  images: Array<{ buffer: Buffer; mimeType: string }>;
  restaurantId?: string | null;
  currencyDefault?: 'INR' | 'USD';
}): Promise<ExtractedMenuResult> {
  const startTime = Date.now();
  const geminiClients = resolveGeminiAttemptClients(getGenAIClient('text'), 'text');
  const openAiEnabled = hasOpenAIFallback();
  const modelName = getTextModelName();
  const modelCandidates = getTextModelCandidates();
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

  const normalizedFiles: Array<{ buffer: Buffer; mimeType: string }> = [];
  for (const img of params.images || []) {
    if (!img?.buffer || img.buffer.length === 0) continue;
    const resolvedMime = resolveMenuMimeForExtraction(img.buffer, img.mimeType);
    if (!resolvedMime) {
      throw new Error('Unsupported menu file format detected. Please upload clear menu photos (JPG, PNG, WebP, HEIC) or a PDF.');
    }
    normalizedFiles.push({ buffer: img.buffer, mimeType: resolvedMime });
  }

  if (normalizedFiles.length === 0) {
    throw new Error('No readable menu photos or PDF files were provided. Please upload valid images (JPG, PNG, WebP, HEIC) or a PDF.');
  }

  const extractionUserPrompt = `Extract EVERY menu category, dish, numeric printed price (e.g. 435 or 14.50), variants, dietary indicators, and visual descriptions across ALL pages/photos provided. Currency default: ${currency}. Return ONLY a valid JSON object.`;
  const timeoutMs = Number(process.env.GEMINI_EXTRACTION_TIMEOUT_MS) || 52000;

  const parseAndValidateResponse = (
    responseText: string,
    finishReason?: string
  ): ExtractedMenuResult => {
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
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(
          'Your menu contains too many items to extract in a single pass. Please upload 2–4 pages at a time or split large PDFs.'
        );
      }
      throw new Error('Vision model returned malformed output that could not be parsed.');
    }

    // Normalize both hierarchical { categories: [{ name, items }] } and flat { categories, items } formats
    const normalized = normalizeExtractedMenuResponse(parsedRaw, currency);
    const validated = ExtractedMenuResultSchema.parse(normalized);

    if (!validated.items || validated.items.length === 0) {
      throw new Error(
        'No dishes or menu entries could be detected in the uploaded photos or PDF. Please ensure the text and prices are clear and legible.'
      );
    }

    return validated;
  };

  let lastError: unknown;
  let usedModel = modelName;

  try {
    const invalidKeySet = new Set<string>();
    let abortModelCascade = false;

    for (let mIdx = 0; mIdx < modelCandidates.length && !abortModelCascade; mIdx++) {
      const candidateModel = modelCandidates[mIdx];
      usedModel = candidateModel;

      for (let idx = 0; idx < geminiClients.length; idx++) {
        const entry = geminiClients[idx];
        if (invalidKeySet.has(entry.key)) {
          continue;
        }

        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => {
          controller.abort(new Error('GEMINI_EXTRACTION_TIMEOUT'));
        }, timeoutMs);
        let raceTimer: ReturnType<typeof setTimeout> | undefined;
        let uploadedFileNames: string[] = [];

        try {
          const mediaResult = await buildGeminiMediaParts(entry.client, normalizedFiles);
          uploadedFileNames = mediaResult.uploadedFileNames;
          const parts = [...mediaResult.parts, { text: extractionUserPrompt }];

          const modelConfig: Record<string, any> = {
            systemInstruction: EXTRACTION_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            maxOutputTokens: 32768,
            temperature: 0.1,
            abortSignal: controller.signal,
            httpOptions: { timeout: Math.max(10_000, timeoutMs) },
          };
          if (candidateModel.startsWith('gemini-3')) {
            modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          const response: any = await Promise.race([
            entry.client.models.generateContent({
              model: candidateModel,
              contents: [
                { role: 'user', parts },
              ],
              config: modelConfig,
            }),
            new Promise<never>((_, reject) => {
              raceTimer = setTimeout(
                () =>
                  reject(
                    new Error(
                      'Menu extraction timed out. For large multi-page PDFs or high-res photos, try uploading 2–4 pages at a time.'
                    )
                  ),
                timeoutMs + 250
              );
            }),
          ]);

          const finishReason = response?.candidates?.[0]?.finishReason;
          const validated = parseAndValidateResponse(response?.text || '', finishReason);

          const latencyMs = Date.now() - startTime;
          await prisma.aIUsageEvent.create({
            data: {
              restaurantId: params.restaurantId || null,
              operationType: 'MENU_EXTRACTION',
              modelId: candidateModel,
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
          if (isGeminiModelUnavailableError(geminiErr)) {
            console.warn(`[VisionExtractor] ${candidateModel} is unavailable; trying the next model.`);
            break;
          }
          const msg = String((geminiErr as any)?.message || geminiErr || '').toLowerCase();
          const status = Number((geminiErr as any)?.status ?? (geminiErr as any)?.statusCode ?? 0);
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
            markGeminiKeyCooldown(entry.key, geminiErr, 'text');
          } else {
            abortModelCascade = true;
          }
          console.warn(
            `[VisionExtractor] ${candidateModel} key ${entry.maskedKey} (${idx + 1}/${geminiClients.length}) failed:`,
            geminiErr instanceof Error ? geminiErr.message : geminiErr
          );
          if (abortModelCascade) {
            break;
          }
        } finally {
          clearTimeout(timeoutHandle);
          if (raceTimer) clearTimeout(raceTimer);
          if (uploadedFileNames.length > 0 && typeof (entry.client as any)?.files?.delete === 'function') {
            for (const fname of uploadedFileNames) {
              (entry.client as any).files.delete({ name: fname }).catch(() => {});
            }
          }
        }
      }
    }

    if (openAiEnabled) {
      try {
        const openAiRes = await callOpenAIVisionMenuExtraction({
          systemPrompt: EXTRACTION_SYSTEM_PROMPT,
          userPrompt: extractionUserPrompt,
          files: normalizedFiles,
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
      : new Error('Menu extraction failed. Please ensure the menu photos or PDF are clear and legible.');
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
    let friendlyMsg = err?.message || 'Menu extraction failed. Please ensure the menu photos or PDF are clear and try again later.';
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
