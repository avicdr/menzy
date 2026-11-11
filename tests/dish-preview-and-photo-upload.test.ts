import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/db/prisma';
import { AssetType, ModerationStatus, SubscriptionStatus } from '@prisma/client';

let mockOwnerCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'dishora_owner_session' && mockOwnerCookieValue) {
        return { value: mockOwnerCookieValue };
      }
      return undefined;
    },
    set: () => {},
    delete: () => {},
  }),
}));

import { createOwnerToken } from '../src/lib/auth/owner-auth';
import { POST as uploadImagePost } from '../src/app/api/images/upload/route';
import { POST as generateImagePost } from '../src/app/api/images/generate/route';
import {
  PATCH as menuItemPatch,
  POST as menuItemPost,
} from '../src/app/api/menus/items/route';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';
import { resolveDishImageMeta } from '../src/lib/diner/dish-image-source';
import {
  buildIllustrationPrompt,
} from '../src/lib/gemini/illustration-generator';
import * as geminiClient from '../src/lib/gemini/client';
import { getCache } from '../src/lib/cache/redis';
import { deleteAsset } from '../src/lib/storage/adapter';

const TINY_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

describe('Dish Preview & Owner Photo Upload Workflows', () => {
  const createdStorageKeys: string[] = [];
  const createdAssetIds: string[] = [];
  const createdCanonicalIds: string[] = [];
  const createdRestaurantSlugs: string[] = [];
  const createdRestaurantIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdPlanKeys: string[] = [];
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiKeys = process.env.OPENAI_API_KEYS;
  const originalPollinationsKey = process.env.POLLINATIONS_API_KEY;

  beforeAll(async () => {
    const planKey = 'IN_GROWTH';
    const existingPlan = await prisma.plan.findUnique({ where: { key: planKey } });
    if (!existingPlan) {
      await prisma.plan.create({
        data: {
          key: planKey,
          tier: 'GROWTH',
          name: 'Growth',
          country: 'IN',
          currency: 'INR',
          priceMinor: 179900,
          itemLimit: 250,
          imageCreditsMonthly: 50,
          aiQuestionsMonthly: 5000,
        },
      });
      createdPlanKeys.push(planKey);
    }
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    mockOwnerCookieValue = undefined;
    if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAiKey;
    if (originalOpenAiKeys === undefined) delete process.env.OPENAI_API_KEYS;
    else process.env.OPENAI_API_KEYS = originalOpenAiKeys;
    if (originalPollinationsKey === undefined) delete process.env.POLLINATIONS_API_KEY;
    else process.env.POLLINATIONS_API_KEY = originalPollinationsKey;

    while (createdStorageKeys.length > 0) {
      const key = createdStorageKeys.pop()!;
      await deleteAsset(key).catch(() => {});
      const localPath = path.resolve(process.cwd(), 'public', 'uploads', key);
      if (fs.existsSync(localPath)) {
        await fs.promises.unlink(localPath).catch(() => {});
      }
    }

    if (createdRestaurantSlugs.length > 0) {
      const cache = getCache();
      await Promise.all(
        createdRestaurantSlugs.splice(0, createdRestaurantSlugs.length).map((slug) =>
          cache.del(`menu:slug:${slug}`).catch(() => {})
        )
      );
    }

    await Promise.all([
      createdRestaurantIds.length > 0
        ? prisma.restaurant
            .deleteMany({
              where: { id: { in: createdRestaurantIds.splice(0, createdRestaurantIds.length) } },
            })
            .catch(() => {})
        : Promise.resolve(),
      createdCanonicalIds.length > 0
        ? prisma.canonicalDish
            .deleteMany({
              where: { id: { in: createdCanonicalIds.splice(0, createdCanonicalIds.length) } },
            })
            .catch(() => {})
        : Promise.resolve(),
    ]);

    await Promise.all([
      createdAssetIds.length > 0
        ? prisma.asset
            .deleteMany({ where: { id: { in: createdAssetIds.splice(0, createdAssetIds.length) } } })
            .catch(() => {})
        : Promise.resolve(),
      createdOrgIds.length > 0
        ? prisma.organization
            .deleteMany({ where: { id: { in: createdOrgIds.splice(0, createdOrgIds.length) } } })
            .catch(() => {})
        : Promise.resolve(),
      createdUserIds.length > 0
        ? prisma.user
            .deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } })
            .catch(() => {})
        : Promise.resolve(),
      createdPlanKeys.length > 0
        ? prisma.plan
            .deleteMany({ where: { key: { in: createdPlanKeys.splice(0, createdPlanKeys.length) } } })
            .catch(() => {})
        : Promise.resolve(),
    ]);
  });

  async function seedRestaurantWithDish() {
    const suffix = crypto.randomBytes(4).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: `photo-owner-${suffix}@menzy.local`,
        name: `Photo Owner ${suffix}`,
        passwordHash: 'test_hash',
      },
    });
    createdUserIds.push(user.id);

    const [org, canonicalAsset] = await Promise.all([
      prisma.organization.create({
        data: {
          name: `Photo Org ${suffix}`,
          ownerUserId: user.id,
          billingCountry: 'IN',
          billingCurrency: 'INR',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
          subscriptions: {
            create: {
              planKey: 'IN_GROWTH',
              status: SubscriptionStatus.ACTIVE,
              currency: 'INR',
              billingPeriod: 'MONTHLY',
              paidThrough: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      }),
      prisma.asset.create({
        data: {
          type: AssetType.AI_ILLUSTRATION,
          storageKey: `illustrations/canonical-${suffix}.webp`,
          publicUrl: `https://example.com/canonical-${suffix}.webp`,
          mime: 'image/webp',
          source: 'GEMINI_GEN',
          moderationStatus: ModerationStatus.APPROVED,
        },
      }),
    ]);
    createdOrgIds.push(org.id);
    createdAssetIds.push(canonicalAsset.id);

    const [restaurant, canonical] = await Promise.all([
      prisma.restaurant.create({
        data: {
          organizationId: org.id,
          slug: `photo-kitchen-${suffix}`,
          displayName: `Photo Kitchen ${suffix}`,
          country: 'IN',
          city: 'Bengaluru',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      }),
      prisma.canonicalDish.create({
        data: {
          normalizedName: `canonical butter maggi ${suffix}`,
          cuisine: 'Cafe',
          generalizedDescription: 'Steaming masala noodles.',
          imageAssetId: canonicalAsset.id,
        },
      }),
    ]);
    createdRestaurantIds.push(restaurant.id);
    createdRestaurantSlugs.push(restaurant.slug);
    createdCanonicalIds.push(canonical.id);

    const menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        title: 'All Day',
        active: true,
        categories: {
          create: {
            name: 'Munchies',
            sortOrder: 1,
          },
        },
      },
      include: {
        categories: true,
      },
    });

    const category = menu.categories[0];

    const item = await prisma.restaurantMenuItem.create({
      data: {
        restaurantId: restaurant.id,
        menuId: menu.id,
        categoryId: category.id,
        canonicalId: canonical.id,
        customName: 'Chilli Oil & Cheese Maggi',
        restaurantDescription: 'Instant noodles with spicy oil and cheese',
        priceMinor: 21500,
        currency: 'INR',
        dietaryStatus: ['VEG'],
        isAvailable: true,
        isPublished: true,
      },
    });

    return { suffix, user, org, restaurant, canonicalAsset, canonical, menu, category, item };
  }

  it('resolves image source metadata accurately for owner photos, custom 3D art, canonical art, and placeholders', () => {
    expect(
      resolveDishImageMeta({
        imageOverrideAssetId: 'a1',
        imageOverride: {
          id: 'a1',
          type: 'OWNER_PHOTO',
          source: 'OWNER_UPLOAD',
          publicUrl: '/uploads/photos/maggi.jpg',
        },
        canonical: { imageAsset: { publicUrl: '/uploads/illustrations/maggi.webp' } },
      })
    ).toEqual({
      url: '/uploads/photos/maggi.jpg',
      sourceKind: 'OWNER_PHOTO',
      label: 'Uploaded Photo',
      hasCustomOverride: true,
    });

    expect(
      resolveDishImageMeta({
        imageOverrideAssetId: 'a2',
        imageOverride: {
          id: 'a2',
          type: 'AI_ILLUSTRATION',
          source: 'GEMINI_GEN',
          publicUrl: '/uploads/illustrations/maggi-custom.webp',
        },
      })
    ).toEqual({
      url: '/uploads/illustrations/maggi-custom.webp',
      sourceKind: 'AI_GENERATED',
      label: 'AI Food Photo',
      hasCustomOverride: true,
    });

    expect(
      resolveDishImageMeta({
        imageOverrideAssetId: null,
        imageOverride: null,
        canonicalId: 'c1',
        canonical: { imageAsset: { publicUrl: '/uploads/illustrations/canonical.webp' } },
      })
    ).toEqual({
      url: '/uploads/illustrations/canonical.webp',
      sourceKind: 'CANONICAL',
      label: 'Canonical Library',
      hasCustomOverride: false,
    });

    expect(resolveDishImageMeta({ customName: 'Plain Toast' })).toEqual({
      url: '/placeholder-dish.svg',
      sourceKind: 'PLACEHOLDER',
      label: 'No Photo Yet',
      hasCustomOverride: false,
    });
  });

  it('uploads an owner dish photo, invalidates public menu cache, supports diner loading, and reverts cleanly', async () => {
    const fixture = await seedRestaurantWithDish();

    // Warm diner menu cache first to verify cache invalidation occurs on upload & revert
    const beforeLoad = await loadDinerMenuPayload(fixture.restaurant.slug);
    expect(beforeLoad.status).toBe('OK');
    if (beforeLoad.status === 'OK') {
      const dinerItemBefore = beforeLoad.data.menus[0].categories[0].items[0];
      expect(dinerItemBefore.imageOverride).toBeNull();
      expect(dinerItemBefore.canonical.imageAsset.publicUrl).toBe(
        fixture.canonicalAsset.publicUrl
      );
    }

    mockOwnerCookieValue = createOwnerToken(fixture.user.id, fixture.user.email);

    const formData = new FormData();
    formData.append('restaurantId', fixture.restaurant.id);
    formData.append('menuItemId', fixture.item.id);
    formData.append('folder', 'photos');
    formData.append('width', '1200');
    formData.append('height', '900');
    formData.append(
      'file',
      new File([TINY_JPEG_BYTES], 'chilli-maggi.jpg', { type: 'image/jpeg' })
    );

    const uploadRes = await uploadImagePost(
      new Request('http://localhost/api/images/upload', {
        method: 'POST',
        body: formData,
      })
    );
    expect(uploadRes.status).toBe(200);
    const uploadJson = await uploadRes.json();
    expect(uploadJson.success).toBe(true);
    expect(uploadJson.asset.type).toBe('OWNER_PHOTO');
    expect(uploadJson.asset.source).toBe('OWNER_UPLOAD');
    expect(uploadJson.asset.width).toBe(1200);
    expect(uploadJson.asset.height).toBe(900);
    expect(uploadJson.item.imageOverrideAssetId).toBe(uploadJson.asset.id);
    expect(uploadJson.item.imageOverride.publicUrl).toBe(uploadJson.asset.publicUrl);

    createdAssetIds.push(uploadJson.asset.id);
    createdStorageKeys.push(uploadJson.asset.storageKey);

    // Public diner menu cache was invalidated so the owner photo renders immediately
    const afterUploadLoad = await loadDinerMenuPayload(fixture.restaurant.slug);
    expect(afterUploadLoad.status).toBe('OK');
    if (afterUploadLoad.status === 'OK') {
      const dinerItemAfter = afterUploadLoad.data.menus[0].categories[0].items[0];
      expect(dinerItemAfter.imageOverride.publicUrl).toBe(uploadJson.asset.publicUrl);
    }

    // Revert custom owner photo back to canonical artwork via PATCH /api/menus/items
    const revertRes = await menuItemPatch(
      new Request('http://localhost/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: fixture.restaurant.id,
          itemId: fixture.item.id,
          imageOverrideAssetId: null,
        }),
      })
    );
    expect(revertRes.status).toBe(200);
    const revertJson = await revertRes.json();
    expect(revertJson.item.imageOverrideAssetId).toBeNull();
    expect(revertJson.item.imageOverride).toBeNull();
    expect(revertJson.item.canonical.imageAsset.publicUrl).toBe(fixture.canonicalAsset.publicUrl);

    const afterRevertLoad = await loadDinerMenuPayload(fixture.restaurant.slug);
    expect(afterRevertLoad.status).toBe('OK');
    if (afterRevertLoad.status === 'OK') {
      const dinerItemReverted = afterRevertLoad.data.menus[0].categories[0].items[0];
      expect(dinerItemReverted.imageOverride).toBeNull();
      expect(dinerItemReverted.canonical.imageAsset.publicUrl).toBe(
        fixture.canonicalAsset.publicUrl
      );
    }
  }, 45_000);

  it('rejects unsupported photo formats, orphaned upload attempts, and cross-tenant asset/item mutations', async () => {
    const tenantA = await seedRestaurantWithDish();
    const tenantB = await seedRestaurantWithDish();

    mockOwnerCookieValue = createOwnerToken(tenantA.user.id, tenantA.user.email);

    // 1. Reject PDF sent to dish photo upload endpoint
    const badMimeForm = new FormData();
    badMimeForm.append('restaurantId', tenantA.restaurant.id);
    badMimeForm.append('menuItemId', tenantA.item.id);
    badMimeForm.append(
      'file',
      new File([new TextEncoder().encode('%PDF-1.4 fake')], 'menu.pdf', {
        type: 'application/pdf',
      })
    );
    const badMimeRes = await uploadImagePost(
      new Request('http://localhost/api/images/upload', {
        method: 'POST',
        body: badMimeForm,
      })
    );
    expect(badMimeRes.status).toBe(400);

    // 2. Reject uploading a photo linked to another restaurant's dish before storing any Asset
    const assetCountBefore = await prisma.asset.count({
      where: { ownerOrganizationId: tenantA.org.id },
    });
    const crossItemForm = new FormData();
    crossItemForm.append('restaurantId', tenantA.restaurant.id);
    crossItemForm.append('menuItemId', tenantB.item.id);
    crossItemForm.append(
      'file',
      new File([TINY_JPEG_BYTES], 'hack.jpg', { type: 'image/jpeg' })
    );
    const crossItemRes = await uploadImagePost(
      new Request('http://localhost/api/images/upload', {
        method: 'POST',
        body: crossItemForm,
      })
    );
    expect(crossItemRes.status).toBe(404);
    const assetCountAfter = await prisma.asset.count({
      where: { ownerOrganizationId: tenantA.org.id },
    });
    expect(assetCountAfter).toBe(assetCountBefore);

    // 3. Reject attaching an asset owned by Organization B onto Organization A's dish
    const tenantBPrivateAsset = await prisma.asset.create({
      data: {
        type: AssetType.OWNER_PHOTO,
        storageKey: `photos/private-b-${tenantB.suffix}.jpg`,
        publicUrl: `https://example.com/private-b-${tenantB.suffix}.jpg`,
        mime: 'image/jpeg',
        source: 'OWNER_UPLOAD',
        moderationStatus: ModerationStatus.APPROVED,
        ownerOrganizationId: tenantB.org.id,
      },
    });
    createdAssetIds.push(tenantBPrivateAsset.id);

    const crossAssetPatchRes = await menuItemPatch(
      new Request('http://localhost/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: tenantA.restaurant.id,
          itemId: tenantA.item.id,
          imageOverrideAssetId: tenantBPrivateAsset.id,
        }),
      })
    );
    expect(crossAssetPatchRes.status).toBe(403);

    // 4. Reject generating 3D artwork with a menuItemId belonging to another restaurant
    const crossGenerateRes = await generateImagePost(
      new Request('http://localhost/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: tenantA.restaurant.id,
          menuItemId: tenantB.item.id,
          dishName: 'Hacked Dish',
          forceRegenerate: true,
        }),
      })
    );
    expect(crossGenerateRes.status).toBe(404);

    // 5. Creating a new dish supports linking an owner-owned asset cleanly
    const tenantAPhoto = await prisma.asset.create({
      data: {
        type: AssetType.OWNER_PHOTO,
        storageKey: `photos/new-dish-${tenantA.suffix}.jpg`,
        publicUrl: `https://example.com/new-dish-${tenantA.suffix}.jpg`,
        mime: 'image/jpeg',
        source: 'OWNER_UPLOAD',
        moderationStatus: ModerationStatus.APPROVED,
        ownerOrganizationId: tenantA.org.id,
      },
    });
    createdAssetIds.push(tenantAPhoto.id);

    const createItemRes = await menuItemPost(
      new Request('http://localhost/api/menus/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: tenantA.restaurant.id,
          categoryId: tenantA.category.id,
          customName: 'Loaded Peri Peri Maggi',
          priceMinor: 24500,
          imageOverrideAssetId: tenantAPhoto.id,
        }),
      })
    );
    expect(createItemRes.status).toBe(200);
    const createItemJson = await createItemRes.json();
    expect(createItemJson.item.imageOverrideAssetId).toBe(tenantAPhoto.id);
    expect(createItemJson.item.imageOverride.publicUrl).toBe(tenantAPhoto.publicUrl);
  }, 45_000);

  it('builds photorealistic real-food prompts keeping dish name, category, ingredients, and dietary constraints', () => {
    const maggiPrompt = buildIllustrationPrompt({
      dishName: 'Tadka Maggi',
      visualDescription: 'butter cumin seed garlic red chilli tadka',
      category: 'Munchies',
      ingredients: ['Maggi noodles', 'roasted cumin', 'garlic', 'fresh coriander'],
      dietaryLabels: ['VEG'],
      ownerTweaks: 'Serve steaming hot in a rustic ceramic bowl',
    });

    const lowerMaggi = maggiPrompt.toLowerCase();
    expect(lowerMaggi).toContain('photorealistic editorial food photography');
    expect(lowerMaggi).toContain('tadka maggi');
    expect(lowerMaggi).toContain('butter cumin seed garlic red chilli tadka');
    expect(lowerMaggi).toContain('strictly vegetarian dish');
    expect(lowerMaggi).toContain('rustic ceramic bowl');
    expect(lowerMaggi).not.toContain('3d-clay-style');
    expect(lowerMaggi).not.toContain('stylized conceptual illustration');

    const fishPrompt = buildIllustrationPrompt({
      dishName: 'Fish & Chips',
      visualDescription: 'served with sriracha sauce',
    });
    expect(fishPrompt).toContain('Fish & Chips');
    expect(fishPrompt).toContain('served with sriracha sauce');
  });

  it('returns 503 with zero credits deducted and no fake SVG saved when AI image providers fail, and sends full dish context when Gemini succeeds', async () => {
    const fixture = await seedRestaurantWithDish();
    mockOwnerCookieValue = createOwnerToken(fixture.user.id, fixture.user.email);

    // 1. All providers fail -> 503 IMAGE_PROVIDER_UNAVAILABLE, 0 credits charged, no fake SVG asset
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEYS;
    delete process.env.POLLINATIONS_API_KEY;

    const failingGeminiMock = {
      models: {
        generateContent: vi.fn().mockRejectedValue(
          Object.assign(new Error('generate_content_free_tier_requests limit: 0'), { status: 429 })
        ),
        generateImages: vi.fn().mockRejectedValue(new Error('Vertex only')),
      },
    } as any;
    const clientSpy = vi.spyOn(geminiClient, 'getGenAIClient').mockReturnValue(failingGeminiMock);

    const failRes = await generateImagePost(
      new Request('http://localhost/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: fixture.restaurant.id,
          menuItemId: fixture.item.id,
          dishName: fixture.item.customName,
          visualDescription: fixture.item.restaurantDescription,
          forceRegenerate: true,
          applyImmediately: false,
        }),
      })
    );
    expect(failRes.status).toBe(503);
    const failJson = await failRes.json();
    expect(failJson.error).toBe('IMAGE_PROVIDER_UNAVAILABLE');

    const [creditsAfterFail, jobsAfterFail, itemAfterFail] = await Promise.all([
      prisma.creditLedger.count({ where: { organizationId: fixture.org.id } }),
      prisma.generationJob.findMany({
        where: { restaurantId: fixture.restaurant.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.restaurantMenuItem.findUnique({ where: { id: fixture.item.id } }),
    ]);
    expect(creditsAfterFail).toBe(0);
    expect(jobsAfterFail[0]?.status).toBe('FAILED');
    expect(itemAfterFail?.imageOverrideAssetId).toBeNull();

    // 2. Working Gemini image mock -> 200 OK with photorealistic prompt containing both dish name & description
    let capturedPrompt = '';
    clientSpy.mockReturnValue({
      models: {
        generateContent: vi.fn(async (req: any) => {
          capturedPrompt = String(req?.contents || '');
          return {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: Buffer.from(TINY_JPEG_BYTES).toString('base64'),
                      },
                    },
                  ],
                },
              },
            ],
          };
        }),
      },
    } as any);

    const okRes = await generateImagePost(
      new Request('http://localhost/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: fixture.restaurant.id,
          menuItemId: fixture.item.id,
          dishName: fixture.item.customName,
          visualDescription: fixture.item.restaurantDescription,
          forceRegenerate: true,
          applyImmediately: false,
        }),
      })
    );
    expect(okRes.status).toBe(200);
    const okJson = await okRes.json();
    expect(okJson.success).toBe(true);
    expect(okJson.creditsCharged).toBe(1);
    expect(okJson.asset.source).toBe('GEMINI_GEN');
    expect(okJson.asset.mime).toBe('image/jpeg');
    expect(capturedPrompt).toContain('Chilli Oil & Cheese Maggi');
    expect(capturedPrompt).toContain('Instant noodles with spicy oil and cheese');
    expect(capturedPrompt).toContain('photorealistic editorial food photography');
    expect(capturedPrompt).not.toContain('3D-clay-style');

    createdAssetIds.push(okJson.asset.id);
    createdStorageKeys.push(okJson.asset.storageKey);
  }, 45_000);
});
