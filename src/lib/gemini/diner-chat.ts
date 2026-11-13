import { z } from 'zod';
import { ThinkingLevel } from '@google/genai';
import {
  getGenAIClient,
  getTextModelCandidates,
  getTextModelName,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from './client';
import { callOpenAIChatJson, hasOpenAIFallback } from '../ai/openai-fallback';
import prisma from '../db/prisma';

export const DinerAIResponseSchema = z.object({
  message: z.string(),
  dishIds: z.array(z.string()).default([]),
  selectedDishId: z.string().nullable().default(null),
  pairingDishId: z.string().nullable().default(null),
  suggestedQuestions: z.array(z.string()).default([]),
  safetyNotice: z.string().nullable().default(null),
});

export type DinerAIResponse = z.infer<typeof DinerAIResponseSchema>;

export const DEFAULT_GEMINI_CHAT_TIMEOUT_MS = 10000;

export function parseGeminiJsonResponse(responseText: string): any {
  const cleaned = (responseText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    return {};
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Malformed JSON returned by Gemini model');
  }
}

export function serializeCompactMenuForPrompt(
  items: Array<{
    id: string;
    customName: string;
    priceMinor: number | null;
    currency: string;
    restaurantDescription: string | null;
    dietaryStatus: unknown;
    allergenVerification: unknown;
    nutritionFields: unknown;
    nutritionSource: string;
    chefRecommended: boolean;
    category?: { name: string } | null;
  }>
) {
  return items.map((i) => {
    const entry: Record<string, unknown> = {
      id: i.id,
      name: i.customName,
      category: i.category?.name || 'General',
      ...(i.priceMinor !== null ? { priceMinor: i.priceMinor } : {}),
      currency: i.currency,
    };

    const desc = typeof i.restaurantDescription === 'string' ? i.restaurantDescription.trim() : '';
    if (desc) {
      entry.description = desc;
    }

    if (Array.isArray(i.dietaryStatus) && i.dietaryStatus.length > 0) {
      entry.dietary = i.dietaryStatus;
    }

    if (
      i.allergenVerification &&
      (typeof i.allergenVerification !== 'object' ||
        Object.keys(i.allergenVerification as Record<string, unknown>).length > 0)
    ) {
      entry.allergenVerification = i.allergenVerification;
    }

    if (
      i.nutritionFields &&
      (typeof i.nutritionFields !== 'object' ||
        Object.keys(i.nutritionFields as Record<string, unknown>).length > 0)
    ) {
      entry.nutrition = i.nutritionFields;
    }

    if (i.nutritionSource && i.nutritionSource !== 'NOT_PROVIDED') {
      entry.nutritionSource = i.nutritionSource;
    }

    if (i.chefRecommended) {
      entry.chefRecommended = true;
    }

    return entry;
  });
}

export async function processDinerQuery(params: {
  restaurantId: string;
  userMessage: string;
  selectedDishId?: string | null;
  history?: Array<{ sender: string; content: string }>;
  timeoutMs?: number;
}): Promise<DinerAIResponse> {
  const startTime = Date.now();
  const timeoutMs =
    params.timeoutMs ??
    (Number(process.env.GEMINI_CHAT_TIMEOUT_MS) || DEFAULT_GEMINI_CHAT_TIMEOUT_MS);

  // 1. Load published & available menu items + restaurant context concurrently with slim selects
  const [items, restaurant] = await Promise.all([
    prisma.restaurantMenuItem.findMany({
      where: {
        restaurantId: params.restaurantId,
        isPublished: true,
        isAvailable: true,
      },
      select: {
        id: true,
        customName: true,
        priceMinor: true,
        currency: true,
        restaurantDescription: true,
        dietaryStatus: true,
        allergenVerification: true,
        nutritionFields: true,
        nutritionSource: true,
        chefRecommended: true,
        category: { select: { name: true } },
        canonical: { select: { normalizedName: true } },
      },
    }),
    prisma.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: {
        displayName: true,
        settings: { select: { aiTone: true } },
      },
    }),
  ]);

  if (!items.length) {
    return {
      message: "Welcome! Our digital menu is currently being prepared. Please feel free to check back shortly or ask your server.",
      dishIds: [],
      selectedDishId: null,
      pairingDishId: null,
      suggestedQuestions: ["What are your hours?"],
      safetyNotice: null,
    };
  }

  const validDishIds = new Set(items.map((i) => i.id));
  const queryLower = params.userMessage.toLowerCase().trim();

  // 2. Deterministic allergen check
  const allergenKeywords = ['peanut', 'nut', 'gluten', 'dairy', 'egg', 'soy', 'shellfish', 'allergic', 'allergy'];
  const hasAllergenQuery = allergenKeywords.some((word) => queryLower.includes(word));

  // Find currently focused dish if provided
  const focusedDish = params.selectedDishId
    ? items.find((i) => i.id === params.selectedDishId)
    : null;

  // 3. Deterministic high-accuracy matching for specific dishes
  const matchingDishes = items.filter((item) => {
    const nameMatch = queryLower.includes(item.customName.toLowerCase());
    const canonMatch = item.canonical && queryLower.includes(item.canonical.normalizedName.toLowerCase());
    return nameMatch || canonMatch;
  });

  const geminiClients = resolveGeminiAttemptClients(getGenAIClient('text'), 'text');
  const openAiEnabled = hasOpenAIFallback();
  const modelName = getTextModelName();
  const modelCandidates = getTextModelCandidates();
  const deadlineAt = startTime + timeoutMs;

  const finalizeAIResponse = async (
    rawText: string,
    usedModel: string,
    inputTokens = 600,
    outputTokens = 250
  ): Promise<DinerAIResponse> => {
    const parsed = parseGeminiJsonResponse(rawText);

    // Sanitize returned IDs against actual published items
    const sanitizedDishIds = Array.isArray(parsed.dishIds)
      ? parsed.dishIds.filter((id: string) => validDishIds.has(id))
      : [];

    const sanitizedSelectedId =
      parsed.selectedDishId && validDishIds.has(parsed.selectedDishId)
        ? parsed.selectedDishId
        : focusedDish?.id || (sanitizedDishIds[0] ?? null);

    const sanitizedPairingId =
      parsed.pairingDishId && validDishIds.has(parsed.pairingDishId)
        ? parsed.pairingDishId
        : null;

    // Record AI usage event (non-blocking if tracking fails)
    const latencyMs = Date.now() - startTime;
    await prisma.aIUsageEvent.create({
      data: {
        restaurantId: params.restaurantId,
        operationType: 'DINER_CHAT',
        modelId: usedModel,
        inputTokens,
        outputTokens,
        estimatedCostUsd: 0.00024,
        status: 'SUCCESS',
        latencyMs,
      },
    }).catch((e) => console.warn('AIUsageEvent log failed:', e));

    return {
      message: parsed.message || "Here are our recommendations from the menu.",
      dishIds: sanitizedDishIds.length > 0 ? sanitizedDishIds : focusedDish ? [focusedDish.id] : [],
      selectedDishId: sanitizedSelectedId,
      pairingDishId: sanitizedPairingId,
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length
        ? parsed.suggestedQuestions.slice(0, 3)
        : ["What's popular here?", "Show vegetarian options", "What goes with this?"],
      safetyNotice: parsed.safetyNotice || (hasAllergenQuery ? "Please confirm allergy & cross-contact requirements with restaurant staff." : null),
    };
  };

  if (geminiClients.length > 0 || openAiEnabled) {
    const sanitizedMenu = serializeCompactMenuForPrompt(items);

    const systemPrompt = `You are the digital host & AI waiter for "${restaurant?.displayName || 'our restaurant'}".
Tone: ${restaurant?.settings?.aiTone || 'warm, hospitable, knowledgeable, concise'}.

CRITICAL RULES:
1. ONLY refer to items in the provided menu snapshot (omitted fields like description, dietary, allergenVerification, nutrition, or chefRecommended mean not provided / false). NEVER invent dishes, prices, recipes or ingredients.
2. If asked about allergies (peanuts, gluten, dairy, etc.):
   - Check the item's 'allergenVerification' field (omitted when unverified).
   - If NOT verified explicitly by restaurant or if allergen is unverified/unknown, respond that ingredients or cross-contact cannot be guaranteed and advise consulting the floor staff.
   - NEVER give an unjustified 100% allergy-free guarantee.
3. If asked about protein/calories/nutrition:
   - Reference the provided numbers (or note they are unavailable if 'nutrition' is omitted).
   - State whether they are "Restaurant verified" or "Approximate culinary estimate".
4. If a dish is currently focused (${focusedDish ? `Focused dish: "${focusedDish.customName}" (ID: ${focusedDish.id})` : 'none'}), tailor follow-up answers to that dish.
5. If recommending a pairing, pick an available item from a beverage or dessert category in the menu.
6. Keep answers short, friendly and appetizing (under 3 sentences).
7. Return a JSON object matching the schema:
   {
     "message": "Friendly answer",
     "dishIds": ["exact-valid-menu-uuid-only"],
     "selectedDishId": "uuid-or-null",
     "pairingDishId": "uuid-or-null",
     "suggestedQuestions": ["1-3 short follow-up questions"],
     "safetyNotice": "string ONLY when allergy/medical safety caution applies, otherwise null"
   }`;

    const userPrompt = `Diner says: "${params.userMessage}".
Selected dish context: ${focusedDish ? focusedDish.customName : 'None'}.
Available menu snapshot: ${JSON.stringify(sanitizedMenu)}`;

    const geminiDeadlineAt = openAiEnabled
      ? startTime + Math.max(250, timeoutMs - Math.min(2000, Math.floor(timeoutMs * 0.25)))
      : deadlineAt;
    const invalidKeySet = new Set<string>();
    let abortModelCascade = false;

    for (let mIdx = 0; mIdx < modelCandidates.length && !abortModelCascade; mIdx++) {
      const candidateModel = modelCandidates[mIdx];

      for (let idx = 0; idx < geminiClients.length; idx++) {
        const entry = geminiClients[idx];
        if (invalidKeySet.has(entry.key)) {
          continue;
        }

        const remainingTotalMs = deadlineAt - Date.now();
        const remainingGeminiMs = geminiDeadlineAt - Date.now();
        if ((mIdx > 0 || idx > 0) && remainingGeminiMs <= 150) {
          abortModelCascade = true;
          break;
        }
        if (remainingTotalMs <= 50) {
          abortModelCascade = true;
          break;
        }

        const remainingKeysInModel = geminiClients.length - 1 - idx;
        const remainingModels = modelCandidates.length - 1 - mIdx;
        const remainingFallbacks = remainingKeysInModel + remainingModels + (openAiEnabled ? 1 : 0);
        const budgetMs = Math.max(40, remainingGeminiMs);
        const attemptTimeoutMs =
          timeoutMs >= 3000 && remainingFallbacks > 0
            ? Math.min(budgetMs, Math.max(1500, Math.floor(budgetMs * 0.6)))
            : Math.max(20, remainingTotalMs);

        const controller = new AbortController();
        let requestTimer: ReturnType<typeof setTimeout> | undefined;
        let raceTimer: ReturnType<typeof setTimeout> | undefined;

        try {
          requestTimer = setTimeout(() => {
            controller.abort(new Error('GEMINI_CHAT_TIMEOUT'));
          }, attemptTimeoutMs);

          const modelConfig: Record<string, any> = {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            abortSignal: controller.signal,
            // Google GenAI rejects X-Server-Timeout deadlines < 10s with 400 INVALID_ARGUMENT;
            // enforce sub-10s cancellation locally via AbortController + Promise.race.
            httpOptions: { timeout: Math.max(10_000, attemptTimeoutMs) },
          };

          if (candidateModel.startsWith('gemini-3')) {
            modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          const response: any = await Promise.race([
            entry.client.models.generateContent({
              model: candidateModel,
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              config: modelConfig,
            }),
            new Promise<never>((_, reject) => {
              raceTimer = setTimeout(
                () => reject(new Error('GEMINI_CHAT_TIMEOUT')),
                attemptTimeoutMs + 250
              );
            }),
          ]);

          const responseText = response?.text || '{}';
          return await finalizeAIResponse(responseText, candidateModel);
        } catch (err) {
          const msg = String((err as any)?.message || err || '').toLowerCase();
          const status = Number((err as any)?.status ?? (err as any)?.statusCode ?? 0);
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
            // Preserve single-attempt semantics when tests inject a standalone mock client
            abortModelCascade = true;
          }
          console.warn(
            `Gemini diner chat fallback triggered (${candidateModel}, key ${entry.maskedKey}, ${idx + 1}/${geminiClients.length}):`,
            err
          );
          if (abortModelCascade) {
            break;
          }
        } finally {
          if (requestTimer) clearTimeout(requestTimer);
          if (raceTimer) clearTimeout(raceTimer);
        }
      }
    }

    const remainingForOpenAI = deadlineAt - Date.now();
    if (openAiEnabled && (geminiClients.length === 0 || remainingForOpenAI > 250)) {
      try {
        const openAiResult = await callOpenAIChatJson({
          systemPrompt,
          userPrompt,
          timeoutMs: Math.max(500, remainingForOpenAI),
        });
        return await finalizeAIResponse(
          openAiResult.text,
          openAiResult.model,
          openAiResult.inputTokens,
          openAiResult.outputTokens
        );
      } catch (openAiErr) {
        console.warn('OpenAI diner chat fallback failed, using deterministic fallback:', openAiErr);
      }
    }
  }

  // Robust Grounded Deterministic Fallback
  let message = '';
  let dishIds: string[] = [];
  let selectedDishId: string | null = focusedDish?.id || null;
  let pairingDishId: string | null = null;
  let safetyNotice: string | null = null;
  let suggestedQuestions: string[] = ["What's popular here?", "Show vegetarian options", "Which drink pairs best?"];

  if (hasAllergenQuery) {
    safetyNotice = "Important: Ingredient recipes and kitchen preparation may involve cross-contact. Please consult our staff directly before ordering if you have severe allergies.";
  }

  if (focusedDish && (queryLower.includes('protein') || queryLower.includes('calorie') || queryLower.includes('nutrition'))) {
    const nutrition = focusedDish.nutritionFields as any;
    if (nutrition?.protein || nutrition?.calories) {
      const isVerified = focusedDish.nutritionSource === 'RESTAURANT_VERIFIED';
      const label = isVerified ? 'Verified by kitchen' : 'Approximate culinary estimate';
      message = `${focusedDish.customName} has approximately ${nutrition.protein || 0}g of protein and ${nutrition.calories || 0} calories per serving (${label}).`;
    } else {
      message = `${focusedDish.customName} is prepared fresh. Specific nutritional counts are not recorded, but our team can happily share ingredient proportions.`;
    }
    dishIds = [focusedDish.id];
    selectedDishId = focusedDish.id;
    suggestedQuestions = ["What drink goes with this?", "What are the ingredients?", "Show me vegetarian options"];
  } else if (queryLower.includes('pair') || queryLower.includes('drink') || queryLower.includes('beverage')) {
    // Find drink category items
    const drinks = items.filter((i) =>
      i.category?.name.toLowerCase().includes('tea') ||
      i.category?.name.toLowerCase().includes('brew') ||
      i.category?.name.toLowerCase().includes('drink') ||
      i.category?.name.toLowerCase().includes('coffee')
    );
    const chosenDrink = drinks[0] || items[0];
    pairingDishId = chosenDrink.id;
    dishIds = [chosenDrink.id];
    if (focusedDish) {
      dishIds.unshift(focusedDish.id);
      message = `Our guests love pairing the ${focusedDish.customName} with our ${chosenDrink.customName}. It complements the flavors beautifully.`;
    } else {
      message = `We recommend pairing your meal with our refreshing ${chosenDrink.customName}.`;
    }
    suggestedQuestions = ["Tell me about this drink", "Show food mains", "Any desserts?"];
  } else if (matchingDishes.length > 0) {
    const target = matchingDishes[0];
    selectedDishId = target.id;
    dishIds = [target.id];
    message = `${target.customName}: ${target.restaurantDescription || 'A handcrafted specialty prepared with fresh seasonal ingredients.'}`;
    suggestedQuestions = ["How much protein does it have?", "What drink pairs with it?", "Is it spicy?"];
  } else if (queryLower.includes('vegetarian') || queryLower.includes('veg')) {
    const vegItems = items.filter((i) => {
      const dietary = ((i.dietaryStatus as string[]) || []).map((tag) => String(tag).toUpperCase());
      const isVeg =
        dietary.includes('VEG') ||
        dietary.includes('VEGETARIAN') ||
        dietary.includes('VEGAN') ||
        dietary.includes('JAIN');
      return isVeg && !dietary.includes('NON_VEG');
    });
    const fallbackList = vegItems.length > 0 ? vegItems : items;
    dishIds = fallbackList.slice(0, 3).map((i) => i.id);
    message =
      vegItems.length > 0
        ? `We have wonderful vegetarian choices! Here are ${dishIds.length} guest favorites prepared fresh in our kitchen:`
        : `Here are popular dishes from our menu — ask your server for vegetarian customization options:`;
    suggestedQuestions = ["Which is highest in protein?", "Any vegan options?", "Show desserts"];
  } else if (queryLower.includes('under') || queryLower.includes('cheap') || queryLower.includes('budget') || queryLower.includes('300')) {
    const ceilingMatch = queryLower.match(/under\s*(?:rs\.?|inr|₹|\$)?\s*(\d+)/i);
    const maxMinor = ceilingMatch ? Number(ceilingMatch[1]) * 100 : 30000;
    const budgetItems = items
      .filter((i) => (i.priceMinor || 0) <= maxMinor)
      .sort((a, b) => (a.priceMinor || 0) - (b.priceMinor || 0));
    dishIds = (budgetItems.length ? budgetItems : items.slice().sort((a, b) => (a.priceMinor || 0) - (b.priceMinor || 0)))
      .slice(0, 3)
      .map((i) => i.id);
    message = budgetItems.length
      ? "Here are delicious options within your budget that offer great flavor and value:"
      : "Here are our best-value dishes sorted from the lowest price on the menu:";
    suggestedQuestions = ["What's popular here?", "Are there combos?", "Show drinks"];
  } else {
    // General popular / chef recommended
    const featured = items.filter((i) => i.chefRecommended);
    const displayList = featured.length ? featured : items;
    dishIds = displayList.slice(0, 3).map((i) => i.id);
    message = `Welcome! At ${restaurant?.displayName || 'our kitchen'}, we take immense pride in our craft. Here are dishes our guests order again and again:`;
    suggestedQuestions = ["What's in the top dish?", "Show vegetarian options", "Best coffee pairing"];
  }

  // Record fallback AI usage event (non-blocking)
  const latencyMs = Date.now() - startTime;
  await prisma.aIUsageEvent.create({
    data: {
      restaurantId: params.restaurantId,
      operationType: 'DINER_CHAT',
      modelId: modelName,
      inputTokens: 350,
      outputTokens: 120,
      estimatedCostUsd: 0.0001,
      status: 'SUCCESS',
      latencyMs,
    },
  }).catch((e) => console.warn('AIUsageEvent fallback log failed:', e));

  return {
    message,
    dishIds,
    selectedDishId,
    pairingDishId,
    suggestedQuestions,
    safetyNotice,
  };
}
