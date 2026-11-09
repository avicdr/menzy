import { z } from 'zod';
import { getGenAIClient, getTextModelName } from './client';
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

const EXTRACTION_SYSTEM_PROMPT = `You are a precise restaurant-menu extraction engine. Read the supplied menu exactly. Preserve dish titles, prices, groupings, size variants, dietary labels and descriptive text. Output valid structured data matching the provided schema. Never invent missing prices, ingredients, allergens or claims.

For dietary indicators:
- For Indian menus, detect standard FSSAI symbols and labels:
  - VEG (pure vegetarian, green dot symbol)
  - NON_VEG (non-vegetarian, red/brown triangle symbol)
  - EGG (contains egg / eggitarian, yellow dot or egg symbol)
  - JAIN (pure veg prepared strictly without onion, garlic, or root vegetables)
- For Western/abroad menus, detect:
  - VEGAN, VEGETARIAN, GLUTEN_FREE, DAIRY_FREE, NUT_FREE, HALAL, KOSHER.
- If an item is highlighted with a star, flame, chef's hat, or marked as 'Bestseller', 'Popular', 'Chef Special', or 'Must Try', set isPopular or chefRecommended to true.

For each item, distinguish facts visible in the menu from uncertain inferences. Keep original source references and mark ambiguous fields for owner review. Generate a concise visual description of the dish that may be used to create a stylized illustrative image, but never represent the illustration as evidence of the restaurant's exact recipe.`;

export async function extractMenuFromImages(params: {
  images: Array<{ buffer: Buffer; mimeType: string }>;
  restaurantId: string;
  currencyDefault?: 'INR' | 'USD';
}): Promise<ExtractedMenuResult> {
  const startTime = Date.now();
  const client = getGenAIClient();
  const modelName = getTextModelName();
  const currency = params.currencyDefault || 'INR';

  if (!client) {
    const errorMsg = 'Gemini AI Vision client is not configured or GEMINI_API_KEY is missing. Extraction cannot proceed without valid AI credentials.';
    console.error(`[VisionExtractor] ${errorMsg}`);
    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: params.restaurantId,
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

  try {
    const parts: any[] = params.images.map((img) => ({
      inlineData: {
        data: img.buffer.toString('base64'),
        mimeType: img.mimeType,
      },
    }));

    parts.push({
      text: `Extract all menu categories, dishes, prices (in minor units cents/paise), dietary indicators and visual descriptions according to the JSON schema. Use currency: ${currency}. Return ONLY a JSON object.`,
    });

    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts },
      ],
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    if (!responseText.trim()) {
      throw new Error('Empty response received from vision model.');
    }

    let parsedRaw: any;
    try {
      parsedRaw = JSON.parse(responseText);
    } catch {
      throw new Error('Vision model returned malformed output that could not be parsed.');
    }

    const validated = ExtractedMenuResultSchema.parse(parsedRaw);

    if (!validated.items || validated.items.length === 0) {
      throw new Error('No dishes or menu entries could be detected in the uploaded image. Please ensure the menu photo is clear, focused, and well-lit.');
    }

    // Record AI usage event
    const latencyMs = Date.now() - startTime;
    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: params.restaurantId,
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
  } catch (err: any) {
    console.error('Gemini menu extraction error:', err);
    const latencyMs = Date.now() - startTime;
    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: params.restaurantId,
        operationType: 'MENU_EXTRACTION',
        modelId: modelName,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        status: 'FAILED',
        latencyMs,
      },
    }).catch(() => {});

    // Throw clear failure error - NEVER populate or return dummy data
    throw new Error(err?.message || 'Menu extraction failed. Please ensure the menu photo is clear and try again later.');
  }
}

