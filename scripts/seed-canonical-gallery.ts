import 'dotenv/config';
import { AssetType, ModerationStatus, ReviewState } from '@prisma/client';
import prisma from '../src/lib/db/prisma';
import { CANONICAL_GALLERY_CATALOG, type CanonicalCatalogItem } from '../src/lib/canonical/catalog';
import { normalizeDishString } from '../src/lib/canonical/matcher';
import { buildIllustrationPrompt } from '../src/lib/gemini/illustration-generator';
import {
  getImageModelCandidates,
  getOrderedGeminiClients,
  markGeminiKeyCooldown,
} from '../src/lib/gemini/client';
import { generateOpenAIDishImage, hasOpenAIFallback } from '../src/lib/ai/openai-fallback';
import { getAssetBuffer, getS3StorageConfig, uploadAsset } from '../src/lib/storage/adapter';

const CONCURRENCY = Math.min(6, Math.max(1, Number(process.env.CANONICAL_SEED_CONCURRENCY || 5)));
const FORCE_REGENERATE = process.argv.includes('--force');
const ALLOW_LOCAL = process.argv.includes('--allow-local');
const MAX_RETRIES = 4;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const MAX_ITEMS_LIMIT = limitArg ? Math.max(1, Number(limitArg.split('=')[1]) || Infinity) : Infinity;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateImageBuffer(buffer: Buffer | undefined | null, label: string): void {
  if (!buffer || buffer.length < 5000) {
    throw new Error(`Generated buffer suspiciously small (${buffer?.length ?? 0} bytes) for "${label}"`);
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
  const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  if (!isJpeg && !isPng && !isWebp) {
    throw new Error(`Invalid image magic header returned for "${label}"`);
  }
}

class PermanentQuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentQuotaExhaustedError';
  }
}

function isHardBillingOrZeroQuotaError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('credit_balance_exhausted') ||
    lower.includes('insufficient_quota') ||
    lower.includes('billing_hard_limit_reached') ||
    lower.includes('limit: 0') ||
    lower.includes('free_tier_requests') ||
    lower.includes('invalid_api_key')
  );
}

  const geminiImageZeroQuotaKeys = new Set<string>();
let globalStopSignal: string | null = null;

interface SeedGeneratedImage {
  buffer: Buffer;
  mimeType: string;
  ext: 'jpg' | 'png' | 'webp';
  model: string;
  source: 'GEMINI_GEN' | 'OPENAI_GEN';
}

async function generateWithGemini(prompt: string, label: string): Promise<SeedGeneratedImage | null> {
  const clients = getOrderedGeminiClients('image').filter(
    (entry) => !geminiImageZeroQuotaKeys.has(entry.key)
  );
  if (clients.length === 0) {
    return null;
  }

  const models = getImageModelCandidates();

  for (const candidateModel of models) {
    for (const entry of clients) {
      if (geminiImageZeroQuotaKeys.has(entry.key)) continue;

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

          const generatedImage = response?.generatedImages?.[0];
          if (generatedImage?.image?.imageBytes) {
            const buffer = Buffer.from(generatedImage.image.imageBytes, 'base64');
            validateImageBuffer(buffer, label);
            return {
              buffer,
              mimeType: 'image/jpeg',
              ext: 'jpg',
              model: candidateModel,
              source: 'GEMINI_GEN',
            };
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
            const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
            validateImageBuffer(buffer, label);
            const mimeType = imgPart.inlineData.mimeType || 'image/jpeg';
            const ext: 'jpg' | 'png' | 'webp' = mimeType.includes('png')
              ? 'png'
              : mimeType.includes('webp')
              ? 'webp'
              : 'jpg';
            return {
              buffer,
              mimeType,
              ext,
              model: candidateModel,
              source: 'GEMINI_GEN',
            };
          }
        }
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (isHardBillingOrZeroQuotaError(msg) || Number(err?.status) === 401 || Number(err?.status) === 403) {
          geminiImageZeroQuotaKeys.add(entry.key);
        }
        markGeminiKeyCooldown(entry.key, err, 'image');
        console.warn(
          `[Gemini Image] ${candidateModel} (${entry.maskedKey}) failed for "${label}": ${msg.slice(0, 180)}`
        );
      }
    }
  }

  return null;
}

async function generateWithGeminiFirstOrOpenAI(prompt: string, label: string): Promise<SeedGeneratedImage> {
  // 1. Try Gemini image models & keys first
  const geminiResult = await generateWithGemini(prompt, label);
  if (geminiResult) {
    return geminiResult;
  }

  // 2. Fallback to OpenAI image generation if configured
  if (!hasOpenAIFallback()) {
    throw new PermanentQuotaExhaustedError(
      'All configured Gemini image keys failed or have limit: 0 quota, and OPENAI_API_KEY fallback is not configured.'
    );
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await generateOpenAIDishImage({
        prompt,
        model: 'gpt-image-2',
        quality: 'medium',
        outputFormat: 'jpeg',
        outputCompression: 85,
        timeoutMs: 60000,
      });
      validateImageBuffer(result.buffer, label);
      const ext: 'jpg' | 'png' | 'webp' =
        result.ext === 'png' ? 'png' : result.ext === 'webp' ? 'webp' : 'jpg';
      return {
        buffer: result.buffer,
        mimeType: result.mimeType,
        ext,
        model: result.model,
        source: 'OPENAI_GEN',
      };
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err);
      if (isHardBillingOrZeroQuotaError(msg)) {
        throw new PermanentQuotaExhaustedError(msg);
      }
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate');
      const baseBackoff = Math.min(45000, 2000 * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 1000);
      const backoffMs = (isRateLimit ? baseBackoff * 1.5 : baseBackoff) + jitter;
      console.warn(
        `[OpenAI Retry ${attempt}/${MAX_RETRIES}] Image generation failed for "${label}": ${msg}. Waiting ${Math.round(backoffMs)}ms...`
      );
      if (attempt < MAX_RETRIES) {
        await sleep(backoffMs);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function syncAliases(canonicalId: string, aliases: string[]) {
  const normalizedSet = new Set<string>();
  for (const rawAlias of aliases) {
    const clean = normalizeDishString(rawAlias);
    if (clean) normalizedSet.add(clean);
  }

  await prisma.canonicalAlias.deleteMany({
    where: {
      canonicalId,
      normalizedAlias: { notIn: Array.from(normalizedSet) },
    },
  });

  for (const normalizedAlias of normalizedSet) {
    await prisma.canonicalAlias.upsert({
      where: {
        canonicalId_normalizedAlias: {
          canonicalId,
          normalizedAlias,
        },
      },
      update: {},
      create: {
        canonicalId,
        normalizedAlias,
      },
    });
  }
}

async function processItem(
  item: CanonicalCatalogItem,
  index: number,
  total: number
): Promise<{ status: 'generated' | 'reused'; name: string; publicUrl: string; source?: string; bytes?: number }> {
  const existing = await prisma.canonicalDish.findUnique({
    where: { normalizedName: item.normalizedName },
    include: {
      imageAsset: true,
      canonicalAssets: { include: { asset: true } },
    },
  });

  let hasVerifiedS3Image = false;
  if (
    !FORCE_REGENERATE &&
    existing?.imageAsset &&
    (existing.imageAsset.source === 'OPENAI_GEN' || existing.imageAsset.source === 'GEMINI_GEN') &&
    !existing.imageAsset.publicUrl.includes('unsplash.com') &&
    existing.imageAsset.mime !== 'image/svg+xml'
  ) {
    const stored = await getAssetBuffer(existing.imageAsset.storageKey).catch(() => null);
    if (stored && stored.buffer.length > 5000) {
      hasVerifiedS3Image = true;
    }
  }

  if (hasVerifiedS3Image && existing?.imageAsset) {
    const updated = await prisma.canonicalDish.update({
      where: { id: existing.id },
      data: {
        aliases: item.aliases,
        cuisine: item.cuisine,
        generalizedDescription: item.generalizedDescription,
        estimatedNutrition: item.estimatedNutrition as any,
        reviewState: ReviewState.APPROVED,
        provenance: 'SYSTEM_CURATED',
      },
    });

    await syncAliases(updated.id, item.aliases);
    await prisma.canonicalAsset.upsert({
      where: {
        canonicalId_assetId: {
          canonicalId: updated.id,
          assetId: existing.imageAsset.id,
        },
      },
      update: { isApproved: true },
      create: {
        canonicalId: updated.id,
        assetId: existing.imageAsset.id,
        isApproved: true,
        reuseCount: 1,
      },
    });

    console.log(
      `[${index + 1}/${total}] REUSED existing R2 curated asset for "${item.displayName}" (${existing.imageAsset.publicUrl})`
    );
    return { status: 'reused', name: item.displayName, publicUrl: existing.imageAsset.publicUrl };
  }

  // Generate fresh 3D-clay artwork using Gemini first, then OpenAI fallback, and upload to R2
  const prompt = buildIllustrationPrompt(item.visualPrompt);
  const generated = await generateWithGeminiFirstOrOpenAI(prompt, item.displayName);

  const slug = item.normalizedName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const uploadResult = await uploadAsset(
    generated.buffer,
    `canonical-${slug}.${generated.ext}`,
    generated.mimeType,
    'illustrations'
  );

  const asset = await prisma.asset.create({
    data: {
      type: AssetType.AI_ILLUSTRATION,
      storageKey: uploadResult.storageKey,
      publicUrl: uploadResult.publicUrl,
      mime: generated.mimeType,
      width: 1024,
      height: 1024,
      source: generated.source,
      prompt,
      generationModel: generated.model,
      moderationStatus: ModerationStatus.APPROVED,
      canonicalId: existing?.id ?? null,
    },
  });

  await prisma.assetVersion.create({
    data: {
      assetId: asset.id,
      versionNumber: 1,
      storageKey: uploadResult.storageKey,
      publicUrl: uploadResult.publicUrl,
      prompt,
    },
  });

  const canonical = await prisma.canonicalDish.upsert({
    where: { normalizedName: item.normalizedName },
    update: {
      aliases: item.aliases,
      cuisine: item.cuisine,
      generalizedDescription: item.generalizedDescription,
      estimatedNutrition: item.estimatedNutrition as any,
      imageAssetId: asset.id,
      confidence: 1.0,
      reviewState: ReviewState.APPROVED,
      provenance: 'SYSTEM_CURATED',
    },
    create: {
      normalizedName: item.normalizedName,
      aliases: item.aliases,
      cuisine: item.cuisine,
      generalizedDescription: item.generalizedDescription,
      estimatedNutrition: item.estimatedNutrition as any,
      imageAssetId: asset.id,
      confidence: 1.0,
      reviewState: ReviewState.APPROVED,
      provenance: 'SYSTEM_CURATED',
    },
  });

  if (!asset.canonicalId) {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { canonicalId: canonical.id },
    });
  }

  // De-approve legacy placeholder/SEED Unsplash assets for this dish so canonical reuse serves the new 3D clay art
  if (existing?.canonicalAssets?.length) {
    for (const ca of existing.canonicalAssets) {
      if (ca.assetId !== asset.id && ca.isApproved) {
        await prisma.canonicalAsset.update({
          where: { id: ca.id },
          data: { isApproved: false },
        });
      }
    }
  }

  await prisma.canonicalAsset.upsert({
    where: {
      canonicalId_assetId: {
        canonicalId: canonical.id,
        assetId: asset.id,
      },
    },
    update: { isApproved: true },
    create: {
      canonicalId: canonical.id,
      assetId: asset.id,
      isApproved: true,
      reuseCount: 1,
    },
  });

  await syncAliases(canonical.id, item.aliases);

  console.log(
    `[${index + 1}/${total}] GENERATED [${generated.source}:${generated.model}] "${item.displayName}" (${Math.round(generated.buffer.length / 1024)} KB) -> ${uploadResult.publicUrl}`
  );
  return {
    status: 'generated',
    name: item.displayName,
    publicUrl: uploadResult.publicUrl,
    source: generated.source,
    bytes: generated.buffer.length,
  };
}

async function main() {
  const s3Config = getS3StorageConfig();
  if (!s3Config && !ALLOW_LOCAL) {
    throw new Error(
      'S3/R2 storage env vars are missing. Configure R2_* / S3 storage or pass --allow-local explicitly.'
    );
  }

  const totalCatalog = CANONICAL_GALLERY_CATALOG.length;
  const targetItems = CANONICAL_GALLERY_CATALOG.slice(0, MAX_ITEMS_LIMIT);
  const total = targetItems.length;
  console.log(
    `Starting Canonical Gallery seed (${total}/${totalCatalog} dishes, concurrency=${CONCURRENCY}, force=${FORCE_REGENERATE}, storage=${s3Config ? s3Config.bucket : 'local'})`
  );

  let nextIdx = 0;
  const successes: Array<{ status: 'generated' | 'reused'; name: string; publicUrl: string; source?: string }> = [];
  const failures: Array<{ name: string; error: string }> = [];

  async function worker() {
    while (true) {
      if (globalStopSignal) return;
      const current = nextIdx++;
      if (current >= total) return;
      const item = targetItems[current];
      try {
        const res = await processItem(item, current, total);
        successes.push(res);
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (err instanceof PermanentQuotaExhaustedError) {
          globalStopSignal = msg;
        }
        console.error(`[${current + 1}/${total}] FAILED "${item.displayName}":`, msg);
        failures.push({ name: item.displayName, error: msg });
        if (globalStopSignal) return;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const generatedCount = successes.filter((s) => s.status === 'generated').length;
  const geminiGeneratedCount = successes.filter((s) => s.status === 'generated' && s.source === 'GEMINI_GEN').length;
  const openAiGeneratedCount = successes.filter((s) => s.status === 'generated' && s.source === 'OPENAI_GEN').length;
  const reusedCount = successes.filter((s) => s.status === 'reused').length;

  console.log('\n=== Canonical Gallery Seeding Summary ===');
  console.log(`Total processed items: ${total} (Catalog size: ${totalCatalog})`);
  console.log(
    `Generated & uploaded to S3/R2: ${generatedCount} (Gemini: ${geminiGeneratedCount}, OpenAI: ${openAiGeneratedCount})`
  );
  console.log(`Reused existing verified R2 assets: ${reusedCount}`);
  console.log(`Failures: ${failures.length}`);
  if (globalStopSignal) {
    console.warn(`Stopped early due to provider quota/billing exhaustion: ${globalStopSignal}`);
  }

  if (failures.length > 0) {
    console.error('Failed items (first 20):', failures.slice(0, 20));
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
