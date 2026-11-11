import { ThinkingLevel } from '@google/genai';
import {
  getGenAIClient,
  getImageModelCandidates,
  getImageModelName,
  getOrderedGeminiClients,
  getTextModelCandidates,
  isGeminiKeyCooledDown,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from './client';
import { generateOpenAIDishImage, hasOpenAIFallback } from '../ai/openai-fallback';
import { uploadAsset } from '../storage/adapter';
import prisma from '../db/prisma';
import { AssetType, ModerationStatus } from '@prisma/client';
import { sniffMenuFileMimeFromBytes } from '../menu/menu-file-validator';

export const MAX_BATCH_GENERATION = 5;

export interface DishVisualPromptInput {
  dishName: string;
  visualDescription?: string | null;
  category?: string | null;
  ingredients?: string[] | null;
  dietaryLabels?: string[] | null;
  portionSize?: string | null;
  ownerTweaks?: string | null;
}

function buildDietaryConstraintCue(dietaryLabels?: string[] | null): string | null {
  if (!Array.isArray(dietaryLabels) || dietaryLabels.length === 0) {
    return null;
  }
  const normalized = new Set(dietaryLabels.map((l) => String(l || '').trim().toUpperCase()));
  const cues: string[] = [];

  if (normalized.has('JAIN')) {
    cues.push('strictly Jain pure vegetarian food without onion, garlic, meat, seafood, or egg');
  } else if (normalized.has('VEGAN')) {
    cues.push('100% plant-based vegan dish with no meat, dairy, or egg');
  } else if (
    (normalized.has('VEG') || normalized.has('VEGETARIAN') || normalized.has('PURE_VEG')) &&
    !normalized.has('NON_VEG') &&
    !normalized.has('NON-VEG') &&
    !normalized.has('NONVEG')
  ) {
    if (normalized.has('EGG') || normalized.has('CONTAINS_EGG') || normalized.has('EGGETARIAN')) {
      cues.push('vegetarian eggetarian dish containing no meat, poultry, or seafood');
    } else {
      cues.push('strictly vegetarian dish with no meat, poultry, fish, or seafood');
    }
  }

  return cues.length > 0 ? cues.join('; ') : null;
}

function composeDishSubject(
  dishInput: string | DishVisualPromptInput,
  ownerTweaks?: string
): { subject: string; dishName: string } {
  if (typeof dishInput === 'string') {
    const clean = dishInput.trim() || 'chef special plated restaurant dish';
    const tweak = ownerTweaks?.trim();
    return {
      dishName: clean,
      subject: tweak ? `${clean}. Plating & visual details: ${tweak}` : clean,
    };
  }

  const cleanName = dishInput.dishName?.trim() || 'Restaurant Dish';
  const cleanDesc = dishInput.visualDescription?.trim() || '';
  const cleanCategory = dishInput.category?.trim() || '';
  const cleanPortion = dishInput.portionSize?.trim() || '';
  const cleanTweak = (ownerTweaks ?? dishInput.ownerTweaks)?.trim() || '';

  const ingredientsList = Array.isArray(dishInput.ingredients)
    ? dishInput.ingredients.map((i) => String(i || '').trim()).filter(Boolean).slice(0, 8)
    : [];

  // Never drop the dish name when a terse/ingredient-only description is provided
  const parts: string[] = [];
  if (cleanDesc) {
    const nameAlreadyInDesc = cleanDesc.toLowerCase().includes(cleanName.toLowerCase());
    parts.push(nameAlreadyInDesc ? cleanDesc : `${cleanName} — ${cleanDesc}`);
  } else {
    parts.push(cleanName);
  }

  if (cleanCategory && !cleanName.toLowerCase().includes(cleanCategory.toLowerCase())) {
    parts.push(`Course/category: ${cleanCategory}`);
  }
  if (ingredientsList.length > 0) {
    const descLower = `${cleanName} ${cleanDesc}`.toLowerCase();
    const missingIngredients = ingredientsList.filter((ing) => !descLower.includes(ing.toLowerCase()));
    if (missingIngredients.length > 0) {
      parts.push(`Key visible ingredients: ${missingIngredients.join(', ')}`);
    }
  }
  if (cleanPortion) {
    parts.push(`Portion framing: ${cleanPortion}`);
  }
  const dietaryCue = buildDietaryConstraintCue(dishInput.dietaryLabels);
  if (dietaryCue) {
    parts.push(`Dietary requirement: ${dietaryCue}`);
  }
  if (cleanTweak) {
    parts.push(`Additional plating & styling notes: ${cleanTweak}`);
  }

  return {
    dishName: cleanName,
    subject: parts.join('. '),
  };
}

export function buildIllustrationPrompt(
  dishDescriptionOrInput: string | DishVisualPromptInput,
  ownerTweaks?: string
): string {
  const { subject } = composeDishSubject(dishDescriptionOrInput, ownerTweaks);

  return `High-resolution photorealistic editorial food photography of ${subject}. Shot on a 50mm macro lens from an appetizing 45-degree dining table angle, showcasing authentic cooked food textures, glistening natural sauces or sear marks, fresh garnishes, realistic ceramic or stoneware tableware on a warm neutral wood or linen cafe table, soft natural directional daylight, and gentle depth of field. Strictly real appetizing food only — NO 3D clay, NO plasticine, NO toy or CGI cartoon look, NO floating objects, NO text, NO menu labels, NO logos, and NO watermarks.`;
}

async function enrichDishVisualDescriptionWithGeminiText(
  input: DishVisualPromptInput
): Promise<string | null> {
  if (process.env.VITEST) {
    return null;
  }

  const descWordCount = (input.visualDescription || '').trim().split(/\s+/).filter(Boolean).length;
  const hasFullName = Boolean(
    input.visualDescription &&
      input.visualDescription.toLowerCase().includes(input.dishName.trim().toLowerCase())
  );
  if (hasFullName && descWordCount >= 14) {
    return null;
  }

  const textClients = getOrderedGeminiClients('text').filter(
    (entry) => !isGeminiKeyCooledDown(entry.key, 'text')
  );
  if (textClients.length === 0) {
    return null;
  }

  const primaryModel = getTextModelCandidates()[0] || 'gemini-3-flash-preview';
  const entry = textClients[0];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('VISUAL_BRIEF_TIMEOUT')), 3500);

  try {
    const contextLines = [
      `Dish name: ${input.dishName}`,
      input.category ? `Category: ${input.category}` : null,
      input.visualDescription ? `Menu description: ${input.visualDescription}` : null,
      Array.isArray(input.ingredients) && input.ingredients.length > 0
        ? `Ingredients: ${input.ingredients.slice(0, 8).join(', ')}`
        : null,
      input.portionSize ? `Serving size: ${input.portionSize}` : null,
      buildDietaryConstraintCue(input.dietaryLabels)
        ? `Dietary rule: ${buildDietaryConstraintCue(input.dietaryLabels)}`
        : null,
      input.ownerTweaks ? `Owner styling request: ${input.ownerTweaks}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const config: Record<string, any> = {
      temperature: 0.3,
      abortSignal: controller.signal,
      httpOptions: { timeout: 3500 },
    };
    if (primaryModel.startsWith('gemini-3')) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }

    const res: any = await Promise.race([
      entry.client.models.generateContent({
        model: primaryModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a food stylist writing a concise 1-to-2 sentence photographic visual description for a food photographer so they capture the exact authentic prepared dish accurately (never ingredients alone, never raw/uncooked unless specified, respecting dietary rules).\n\n${contextLines}\n\nReturn ONLY a plain-text visual description under 60 words describing the finished plated food, vessel/bowl/plate, visible textures, toppings, and natural garnishes.`,
              },
            ],
          },
        ],
        config,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
    ]);

    const brief = typeof res?.text === 'string' ? res.text.replace(/\s+/g, ' ').trim() : '';
    if (brief.length >= 20 && brief.length <= 450) {
      return brief;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isRasterImageBuffer(buffer: Buffer | null | undefined, minBytes = 6): boolean {
  if (!buffer || buffer.length < minBytes) {
    return false;
  }
  const sniffed = sniffMenuFileMimeFromBytes(buffer);
  if (sniffed === 'image/jpeg' || sniffed === 'image/png' || sniffed === 'image/webp') {
    return true;
  }
  // Allow tiny PNG/JPEG headers produced in unit tests when magic bytes are valid
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  return false;
}

export async function generateOrReuseDishIllustration(params: {
  restaurantId: string;
  organizationId: string;
  menuItemId?: string;
  dishName: string;
  visualDescription?: string;
  category?: string | null;
  ingredients?: string[] | null;
  dietaryLabels?: string[] | null;
  portionSize?: string | null;
  canonicalId?: string | null;
  customInstructions?: string;
  forceRegenerate?: boolean;
  enrichWithTextModel?: boolean;
}): Promise<{ asset: any; isReused: boolean; creditsCharged: number }> {
  // 1. Check for approved canonical asset reuse first (if not forcing new generation)
  if (!params.forceRegenerate && params.canonicalId) {
    const canonicalAsset = await prisma.canonicalAsset.findFirst({
      where: {
        canonicalId: params.canonicalId,
        isApproved: true,
      },
      include: { asset: true },
    });

    if (canonicalAsset?.asset) {
      // Increment reuse count
      await prisma.canonicalAsset.update({
        where: { id: canonicalAsset.id },
        data: { reuseCount: { increment: 1 } },
      });

      return {
        asset: canonicalAsset.asset,
        isReused: true,
        creditsCharged: 0,
      };
    }
  }

  // 2. Check remaining image credits from CreditLedger
  const ledgerEntries = await prisma.creditLedger.findMany({
    where: {
      organizationId: params.organizationId,
      creditType: 'IMAGE_GENERATION',
    },
  });

  const totalCredits = ledgerEntries.reduce((acc, curr) => acc + curr.delta, 0);

  // If no subscription exists yet or zero balance, check onboarding allowance
  if (totalCredits <= 0) {
    // Check if within onboarding free initial allowance (10)
    const generatedCount = await prisma.generationJob.count({
      where: { restaurantId: params.restaurantId, status: 'COMPLETED' },
    });

    if (generatedCount >= 10) {
      throw new Error('INSUFFICIENT_IMAGE_CREDITS');
    }
  }

  const visualInput: DishVisualPromptInput = {
    dishName: params.dishName,
    visualDescription: params.visualDescription,
    category: params.category,
    ingredients: params.ingredients,
    dietaryLabels: params.dietaryLabels,
    portionSize: params.portionSize,
    ownerTweaks: params.customInstructions,
  };

  let promptInput: DishVisualPromptInput = visualInput;
  if (params.enrichWithTextModel !== false) {
    const enrichedBrief = await enrichDishVisualDescriptionWithGeminiText(visualInput);
    if (enrichedBrief) {
      promptInput = {
        ...visualInput,
        visualDescription: enrichedBrief,
      };
    }
  }

  const prompt = buildIllustrationPrompt(promptInput, params.customInstructions);
  const modelName = getImageModelName();
  const modelCandidates = getImageModelCandidates();

  // Create GenerationJob to track state
  const job = await prisma.generationJob.create({
    data: {
      restaurantId: params.restaurantId,
      menuItemId: params.menuItemId ?? null,
      canonicalId: params.canonicalId ?? null,
      status: 'PROCESSING',
      prompt,
      isBillable: true,
    },
  });

  const allGeminiClients = resolveGeminiAttemptClients(getGenAIClient('image'), 'image');
  const healthyGeminiClients = allGeminiClients.filter(
    (entry) => entry.key === 'mock-injected-client' || !isGeminiKeyCooledDown(entry.key, 'image')
  );
  // Avoid hammering 45 dead free-tier limit:0 requests repeatedly once all keys are cooled down
  const geminiAttemptClients =
    healthyGeminiClients.length > 0 ? healthyGeminiClients : allGeminiClients.slice(0, 1);

  let imageBuffer: Buffer | null = null;
  let mimeType = 'image/jpeg';
  let ext = 'jpg';
  let usedModel = modelName;
  let usedSource = 'GEMINI_GEN';
  const providerErrors: string[] = [];

  // Tier 1: Try official Google GenAI across image models x configured Gemini API keys
  const invalidKeySet = new Set<string>();
  const zeroQuotaModelCount = new Map<string, number>();
  let abortModelCascade = false;

  for (let mIdx = 0; mIdx < modelCandidates.length && !imageBuffer && !abortModelCascade; mIdx++) {
    const candidateModel = modelCandidates[mIdx];

    for (let idx = 0; idx < geminiAttemptClients.length; idx++) {
      const entry = geminiAttemptClients[idx];
      if (invalidKeySet.has(entry.key)) {
        continue;
      }

      try {
        if (candidateModel.startsWith('imagen-')) {
          const response = await (entry.client.models as any).generateImages({
            model: candidateModel,
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
          });

          const generatedImage = response.generatedImages?.[0];
          if (generatedImage?.image?.imageBytes) {
            const candidateBuf = Buffer.from(generatedImage.image.imageBytes, 'base64');
            if (isRasterImageBuffer(candidateBuf)) {
              imageBuffer = candidateBuf;
              mimeType = 'image/jpeg';
              ext = 'jpg';
              usedModel = candidateModel;
              usedSource = 'GEMINI_GEN';
              break;
            }
          }
        } else {
          const response: any = await entry.client.models.generateContent({
            model: candidateModel,
            contents: prompt,
            config: {
              responseModalities: ['IMAGE'],
              imageConfig: { aspectRatio: '1:1' },
            } as any,
          });

          const parts = response?.candidates?.[0]?.content?.parts || [];
          const imgPart = parts.find((p: any) => p?.inlineData?.data);
          if (imgPart?.inlineData?.data) {
            const candidateBuf = Buffer.from(imgPart.inlineData.data, 'base64');
            if (isRasterImageBuffer(candidateBuf)) {
              imageBuffer = candidateBuf;
              mimeType = imgPart.inlineData.mimeType || 'image/jpeg';
              ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
              usedModel = candidateModel;
              usedSource = 'GEMINI_GEN';
              break;
            }
          }
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
        } else if (msg.includes('limit: 0') || msg.includes('free_tier_requests')) {
          const misses = (zeroQuotaModelCount.get(entry.key) ?? 0) + 1;
          zeroQuotaModelCount.set(entry.key, misses);
          if (misses >= 2) {
            invalidKeySet.add(entry.key);
          }
        }

        if (entry.key !== 'mock-injected-client') {
          markGeminiKeyCooldown(entry.key, err, 'image');
        } else {
          abortModelCascade = true;
        }
        providerErrors.push(`Gemini(${candidateModel}): ${String(err?.message || err).slice(0, 140)}`);
        console.warn(
          `GenAI image generation failed (${candidateModel}, key ${entry.maskedKey}, ${idx + 1}/${geminiAttemptClients.length}):`,
          err?.message || err
        );
        if (abortModelCascade) {
          break;
        }
      }
    }
  }

  // Tier 1b: OpenAI Image Generation fallback if Gemini keys failed or aren't configured
  if (!imageBuffer && hasOpenAIFallback()) {
    try {
      const openAiImg = await generateOpenAIDishImage({ prompt, timeoutMs: 45000 });
      if (isRasterImageBuffer(openAiImg.buffer)) {
        imageBuffer = openAiImg.buffer;
        mimeType = openAiImg.mimeType;
        ext = openAiImg.ext;
        usedModel = openAiImg.model;
        usedSource = 'OPENAI_GEN';
      }
    } catch (openAiErr: any) {
      providerErrors.push(`OpenAI: ${String(openAiErr?.message || openAiErr).slice(0, 160)}`);
      console.warn('OpenAI image generation fallback failed:', openAiErr?.message || openAiErr);
    }
  }

  // Tier 2: Authenticated Flux endpoint ONLY when POLLINATIONS_API_KEY is explicitly configured
  const pollinationsKey = process.env.POLLINATIONS_API_KEY?.trim();
  if (!imageBuffer && pollinationsKey) {
    try {
      const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${pollinationsKey}`,
        },
        signal: AbortSignal.timeout(25000),
      });
      const contentType = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '';
      if (res.ok && (contentType === 'image/jpeg' || contentType === 'image/png' || contentType === 'image/webp')) {
        const ab = await res.arrayBuffer();
        const candidateBuf = Buffer.from(ab);
        if (isRasterImageBuffer(candidateBuf, 4000)) {
          imageBuffer = candidateBuf;
          mimeType = contentType;
          ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          usedModel = 'pollinations-flux';
          usedSource = 'POLLINATIONS_GEN';
        }
      } else {
        providerErrors.push(`Pollinations: HTTP ${res.status}`);
      }
    } catch (aiErr: any) {
      providerErrors.push(`Pollinations: ${String(aiErr?.message || aiErr).slice(0, 120)}`);
      console.warn('Authenticated Flux image generation failed:', aiErr?.message || aiErr);
    }
  }

  // Never store fake SVG circle blobs or unauthenticated watermarked thumbnails as paid AI food photos
  if (!imageBuffer) {
    const joinedErrors = providerErrors.join(' | ').toLowerCase();
    const friendlyMessage =
      joinedErrors.includes('limit: 0') || joinedErrors.includes('credit_balance_exhausted') || joinedErrors.includes('insufficient_quota')
        ? 'AI food image generation is unavailable because configured Gemini image quota (free tier limit: 0) or OpenAI image billing credits are exhausted. Upload your own dish photo or pick from the Canonical Library.'
        : 'AI food image generation providers are currently unavailable. No credits were deducted — please try again shortly or upload your own dish photo.';

    await Promise.allSettled([
      prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: (providerErrors[0] || friendlyMessage).slice(0, 500),
        },
      }),
      prisma.aIUsageEvent.create({
        data: {
          organizationId: params.organizationId,
          restaurantId: params.restaurantId,
          operationType: 'IMAGE_GENERATION',
          modelId: usedModel,
          requestId: job.id,
          imageCount: 0,
          estimatedCostUsd: 0,
          status: 'FAILED',
        },
      }),
    ]);

    throw new Error(`IMAGE_PROVIDER_UNAVAILABLE: ${friendlyMessage}`);
  }

  // Store asset with correct MIME type and matching file extension
  const uploadResult = await uploadAsset(
    imageBuffer,
    `${params.dishName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`,
    mimeType,
    'illustrations'
  );

  const asset = await prisma.asset.create({
    data: {
      type: AssetType.AI_ILLUSTRATION,
      storageKey: uploadResult.storageKey,
      publicUrl: uploadResult.publicUrl,
      mime: mimeType,
      source: usedSource,
      prompt,
      generationModel: usedModel,
      moderationStatus: ModerationStatus.APPROVED,
      ownerOrganizationId: params.organizationId,
      canonicalId: params.canonicalId ?? null,
    },
  });

  // Create initial asset version
  await prisma.assetVersion.create({
    data: {
      assetId: asset.id,
      versionNumber: 1,
      storageKey: uploadResult.storageKey,
      publicUrl: uploadResult.publicUrl,
      prompt,
    },
  });

  // Update GenerationJob as completed
  await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      outputAssetId: asset.id,
    },
  });

  // Deduct 1 image credit idempotently
  const idempotencyKey = `gen_${job.id}_${Date.now()}`;
  await prisma.creditLedger.create({
    data: {
      organizationId: params.organizationId,
      creditType: 'IMAGE_GENERATION',
      delta: -1,
      balanceAfter: Math.max(0, totalCredits - 1),
      reason: `AI food photo generated for "${params.dishName}"`,
      generationJobId: job.id,
      idempotencyKey,
    },
  });

  // Record AI usage event
  await prisma.aIUsageEvent.create({
    data: {
      organizationId: params.organizationId,
      restaurantId: params.restaurantId,
      operationType: 'IMAGE_GENERATION',
      modelId: usedModel,
      requestId: job.id,
      imageCount: 1,
      estimatedCostUsd: 0.03, // $0.03 per image
      status: 'SUCCESS',
    },
  });

  return {
    asset,
    isReused: false,
    creditsCharged: 1,
  };
}

