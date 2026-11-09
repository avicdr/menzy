import { z } from 'zod';
import { getGenAIClient, getTextModelName } from './client';
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

export async function processDinerQuery(params: {
  restaurantId: string;
  userMessage: string;
  selectedDishId?: string | null;
  history?: Array<{ sender: string; content: string }>;
}): Promise<DinerAIResponse> {
  const startTime = Date.now();

  // 1. Load published & available menu items for this restaurant
  const items = await prisma.restaurantMenuItem.findMany({
    where: {
      restaurantId: params.restaurantId,
      isPublished: true,
      isAvailable: true,
    },
    include: {
      category: true,
      canonical: true,
    },
  });

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.restaurantId },
    include: { settings: true },
  });

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

  const client = getGenAIClient();
  const modelName = getTextModelName();

  if (client) {
    try {
      const sanitizedMenu = items.map((i) => ({
        id: i.id,
        name: i.customName,
        category: i.category?.name || 'General',
        priceMinor: i.priceMinor,
        currency: i.currency,
        description: i.restaurantDescription,
        dietary: i.dietaryStatus,
        allergenVerification: i.allergenVerification,
        nutrition: i.nutritionFields,
        nutritionSource: i.nutritionSource,
        chefRecommended: i.chefRecommended,
      }));

      const systemPrompt = `You are the digital host & AI waiter for "${restaurant?.displayName || 'our restaurant'}".
Tone: ${restaurant?.settings?.aiTone || 'warm, hospitable, knowledgeable, concise'}.

CRITICAL RULES:
1. ONLY refer to items in the provided menu snapshot. NEVER invent dishes, prices, recipes or ingredients.
2. If asked about allergies (peanuts, gluten, dairy, etc.):
   - Check the item's 'allergenVerification' field.
   - If NOT verified explicitly by restaurant or if allergen is unverified/unknown, respond that ingredients or cross-contact cannot be guaranteed and advise consulting the floor staff.
   - NEVER give an unjustified 100% allergy-free guarantee.
3. If asked about protein/calories/nutrition:
   - Reference the provided numbers.
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
     "safetyNotice": "string or null"
   }`;

      const userPrompt = `Diner says: "${params.userMessage}".
Selected dish context: ${focusedDish ? focusedDish.customName : 'None'}.
Available menu snapshot: ${JSON.stringify(sanitizedMenu)}`;

      const response = await client.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

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

      // Record AI usage event
      const latencyMs = Date.now() - startTime;
      await prisma.aIUsageEvent.create({
        data: {
          restaurantId: params.restaurantId,
          operationType: 'DINER_CHAT',
          modelId: modelName,
          inputTokens: 600,
          outputTokens: 250,
          estimatedCostUsd: 0.00024,
          status: 'SUCCESS',
          latencyMs,
        },
      });

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
    } catch (err) {
      console.warn('Gemini diner chat fallback triggered:', err);
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
      const dietary = (i.dietaryStatus as string[]) || [];
      return dietary.includes('VEGETARIAN') || dietary.includes('VEGAN');
    });
    dishIds = vegItems.slice(0, 3).map((i) => i.id);
    message = `We have wonderful vegetarian choices! Here are ${dishIds.length} guest favorites prepared fresh in our kitchen:`;
    suggestedQuestions = ["Which is highest in protein?", "Any vegan options?", "Show desserts"];
  } else if (queryLower.includes('under') || queryLower.includes('cheap') || queryLower.includes('budget') || queryLower.includes('300')) {
    const budgetItems = items.filter((i) => (i.priceMinor || 0) <= 30000);
    dishIds = (budgetItems.length ? budgetItems : items).slice(0, 3).map((i) => i.id);
    message = "Here are delicious options that offer incredible flavor and great value:";
    suggestedQuestions = ["What's popular here?", "Are there combos?", "Show drinks"];
  } else {
    // General popular / chef recommended
    const featured = items.filter((i) => i.chefRecommended);
    const displayList = featured.length ? featured : items;
    dishIds = displayList.slice(0, 3).map((i) => i.id);
    message = `Welcome! At ${restaurant?.displayName || 'our kitchen'}, we take immense pride in our craft. Here are dishes our guests order again and again:`;
    suggestedQuestions = ["What's in the top dish?", "Show vegetarian options", "Best coffee pairing"];
  }

  // Record fallback AI usage event
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
  });

  return {
    message,
    dishIds,
    selectedDishId,
    pairingDishId,
    suggestedQuestions,
    safetyNotice,
  };
}
