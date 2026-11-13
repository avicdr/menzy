import { describe, it, expect, vi, afterEach } from 'vitest';
import prisma from '../src/lib/db/prisma';
import {
  clearGeminiKeyCooldowns,
  getImageModelCandidates,
  getOrderedGeminiClients,
  getTextModelCandidates,
  markGeminiKeyCooldown,
  parseGeminiApiKeys,
  parseKeyList,
} from '../src/lib/gemini/client';
import {
  callOpenAIChatJson,
  generateOpenAIDishImage,
  parseOpenAIApiKeys,
} from '../src/lib/ai/openai-fallback';
import { processDinerQuery } from '../src/lib/gemini/diner-chat';
import { extractMenuFromImages } from '../src/lib/gemini/vision-extractor';
import { MAX_BATCH_GENERATION } from '../src/lib/gemini/illustration-generator';

describe('Multi-Key Gemini Rotation & OpenAI Fallback', () => {
  const originalEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS,
    GEMINI_API_KEY_1: process.env.GEMINI_API_KEY_1,
    GEMINI_API_KEY_2: process.env.GEMINI_API_KEY_2,
    GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL,
    GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL,
    GEMINI_IMAGE_FALLBACK_MODELS: process.env.GEMINI_IMAGE_FALLBACK_MODELS,
    GEMINI_USE_VERTEX: process.env.GEMINI_USE_VERTEX,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_API_KEYS: process.env.OPENAI_API_KEYS,
    OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
    OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL,
    OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL,
  };
  const originalFetch = global.fetch;
  const createdEventIds: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    clearGeminiKeyCooldowns();
    global.fetch = originalFetch;

    for (const [key, val] of Object.entries(originalEnv)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }

    if (createdEventIds.length > 0) {
      await prisma.aIUsageEvent
        .deleteMany({
          where: { id: { in: createdEventIds.splice(0, createdEventIds.length) } },
        })
        .catch(() => {});
    }
  });

  it('parses GEMINI_API_KEYS from JSON arrays, JS arrays, and comma-separated lists with deduplication', () => {
    expect(parseKeyList('["key-a", "key-b"]')).toEqual(['key-a', 'key-b']);
    expect(parseKeyList("['key-a', 'key-b',]")).toEqual(['key-a', 'key-b']);
    expect(parseKeyList('key-a, key-b; mock-gemini-key')).toEqual(['key-a', 'key-b']);

    process.env.GEMINI_API_KEY = 'primary-key';
    process.env.GEMINI_API_KEYS = '["primary-key", "account2-key", "account3-key"]';
    process.env.GEMINI_API_KEY_1 = 'account2-key';
    process.env.GEMINI_API_KEY_2 = 'account4-key';

    expect(parseGeminiApiKeys()).toEqual([
      'primary-key',
      'account2-key',
      'account3-key',
      'account4-key',
    ]);
  });

  it('prioritizes healthy Gemini keys after 429 quota cooldowns', () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEYS = '["quota-key-a", "healthy-key-b", "invalid-key-c"]';

    const initial = getOrderedGeminiClients();
    expect(initial.map((c) => c.key)).toEqual([
      'quota-key-a',
      'healthy-key-b',
      'invalid-key-c',
    ]);

    markGeminiKeyCooldown('quota-key-a', { status: 429, message: 'RESOURCE_EXHAUSTED' });
    markGeminiKeyCooldown('invalid-key-c', { status: 403, message: 'API_KEY_INVALID' });

    const reordered = getOrderedGeminiClients();
    expect(reordered[0].key).toBe('healthy-key-b');
    // Shorter cooldown (60s) should come before longer cooldown (10m) as last-resort order
    expect(reordered[1].key).toBe('quota-key-a');
    expect(reordered[2].key).toBe('invalid-key-c');
  });

  it('parses OpenAI fallback keys and upgrades a retired image model', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-openai-1';
    process.env.OPENAI_API_KEYS = '["sk-test-openai-2", "sk-placeholder"]';
    expect(parseOpenAIApiKeys()).toEqual(['sk-test-openai-1', 'sk-test-openai-2']);

    const requestBodies: any[] = [];
    const tinyPngB64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]).toString('base64');

    global.fetch = vi.fn(async (url: any, init?: RequestInit) => {
      const parsedBody = JSON.parse(String(init?.body || '{}'));
      requestBodies.push({ url: String(url), body: parsedBody });
      return new Response(
        JSON.stringify({
          data: [{ b64_json: tinyPngB64 }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    process.env.OPENAI_IMAGE_MODEL = 'gpt-image-1';
    const gptImg = await generateOpenAIDishImage({ prompt: 'Clay biryani bowl' });
    expect(gptImg.mimeType).toBe('image/png');
    expect(requestBodies[0].body.model).toBe('gpt-image-2');
    expect(requestBodies[0].body.response_format).toBeUndefined();
  });

  it('fails over from first Gemini key to backup Gemini key, and then to OpenAI in diner chat', async () => {
    const restaurant = await prisma.restaurant.findFirst({
      where: { slug: 'chai-and-chutney' },
    });
    expect(restaurant).toBeTruthy();

    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEYS = '["test-failover-k1", "test-failover-k2"]';
    delete process.env.OPENAI_API_KEY;

    const clients = getOrderedGeminiClients();
    expect(clients).toHaveLength(2);

    const k1Spy = vi
      .spyOn(clients[0].client.models, 'generateContent')
      .mockRejectedValue(Object.assign(new Error('429 RESOURCE_EXHAUSTED'), { status: 429 }));

    const k2Spy = vi
      .spyOn(clients[1].client.models, 'generateContent')
      .mockResolvedValue({
        text: JSON.stringify({
          message: 'Try our spiced Masala Chai from the second Gemini key!',
          dishIds: [],
          selectedDishId: null,
          pairingDishId: null,
          suggestedQuestions: ['Any snacks?'],
          safetyNotice: null,
        }),
      } as any);

    const beforeFirstRun = new Date();
    const geminiBackupResult = await processDinerQuery({
      restaurantId: restaurant!.id,
      userMessage: 'Recommend something warm',
      timeoutMs: 5000,
    });

    const firstLogged = await prisma.aIUsageEvent.findMany({
      where: {
        restaurantId: restaurant!.id,
        operationType: 'DINER_CHAT',
        createdAt: { gte: beforeFirstRun },
      },
      select: { id: true },
    });
    createdEventIds.push(...firstLogged.map((e) => e.id));

    expect(k1Spy).toHaveBeenCalledTimes(1);
    expect(k2Spy).toHaveBeenCalledTimes(1);
    expect(geminiBackupResult.message).toContain('second Gemini key');

    // Now simulate ALL Gemini keys failing -> OpenAI takes over cleanly
    clearGeminiKeyCooldowns();
    process.env.OPENAI_API_KEY = 'sk-test-fallback-key';
    process.env.OPENAI_TEXT_MODEL = 'gpt-4o-mini';

    vi.spyOn(clients[0].client.models, 'generateContent').mockRejectedValue(new Error('quota 1'));
    vi.spyOn(clients[1].client.models, 'generateContent').mockRejectedValue(new Error('quota 2'));

    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          model: 'gpt-4o-mini',
          usage: { prompt_tokens: 410, completion_tokens: 90 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  message: 'OpenAI fallback recommends our signature house dish.',
                  dishIds: [],
                  selectedDishId: null,
                  pairingDishId: null,
                  suggestedQuestions: ['Vegetarian options?'],
                  safetyNotice: null,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as any;

    const beforeSecondRun = new Date();
    const openAiResult = await processDinerQuery({
      restaurantId: restaurant!.id,
      userMessage: 'What is popular?',
      timeoutMs: 5000,
    });

    const secondLogged = await prisma.aIUsageEvent.findMany({
      where: {
        restaurantId: restaurant!.id,
        operationType: 'DINER_CHAT',
        createdAt: { gte: beforeSecondRun },
      },
      select: { id: true, modelId: true },
    });
    createdEventIds.push(...secondLogged.map((e) => e.id));

    expect(openAiResult.message).toContain('OpenAI fallback');
    expect(secondLogged.some((e) => e.modelId === 'gpt-4o-mini')).toBe(true);
  });

  it('falls back to OpenAI vision extraction for menu images & PDFs when Gemini keys fail', async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEYS = '["test-vision-fail-key"]';
    process.env.OPENAI_API_KEY = 'sk-test-vision-openai';
    process.env.OPENAI_VISION_MODEL = 'gpt-4o-mini';

    const clients = getOrderedGeminiClients();
    vi.spyOn(clients[0].client.models, 'generateContent').mockRejectedValue(new Error('429 exhausted'));

    const capturedBodies: any[] = [];
    global.fetch = vi.fn(async (_url: any, init?: RequestInit) => {
      capturedBodies.push(JSON.parse(String(init?.body || '{}')));
      return new Response(
        JSON.stringify({
          model: 'gpt-4o-mini',
          usage: { prompt_tokens: 1500, completion_tokens: 450 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  restaurantName: 'OpenAI Fallback Kitchen',
                  detectedCurrency: 'INR',
                  categories: [
                    {
                      name: 'Starters',
                      items: [
                        {
                          sourceName: 'Paneer Tikka',
                          price: 320,
                          dietaryLabels: ['VEG'],
                        },
                      ],
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const beforeExtract = new Date();
    const extracted = await extractMenuFromImages({
      images: [
        { buffer: Buffer.from('img-bytes'), mimeType: 'image/jpeg' },
        { buffer: Buffer.from('%PDF-1.4'), mimeType: 'application/pdf' },
      ],
      currencyDefault: 'INR',
    });

    const logged = await prisma.aIUsageEvent.findMany({
      where: {
        operationType: 'MENU_EXTRACTION',
        createdAt: { gte: beforeExtract },
      },
      select: { id: true, modelId: true },
    });
    createdEventIds.push(...logged.map((e) => e.id));

    expect(extracted.categories).toEqual(['Starters']);
    expect(extracted.items[0].sourceName).toBe('Paneer Tikka');
    expect(extracted.items[0].priceMinor).toBe(32000);

    const userContent = capturedBodies[0].messages[1].content;
    expect(userContent[1].type).toBe('image_url');
    expect(userContent[2].type).toBe('file');
    expect(userContent[2].file.file_data).toContain('data:application/pdf;base64,');
    expect(logged.some((e) => e.modelId === 'gpt-4o-mini')).toBe(true);
  });

  it('allows calling OpenAI chat helper directly with JSON output', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-direct-chat';
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          model: 'gpt-4o-mini',
          usage: { prompt_tokens: 100, completion_tokens: 50 },
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as any;

    const res = await callOpenAIChatJson({
      systemPrompt: 'Output JSON',
      userPrompt: 'Ping',
    });
    expect(res.text).toBe('{"ok":true}');
    expect(res.model).toBe('gpt-4o-mini');
  });

  it('filters retired Gemini text and image models from configured fallbacks', () => {
    process.env.GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
    const textModels = getTextModelCandidates();
    expect(textModels).not.toContain('gemini-2.5-flash');
    expect(textModels).not.toContain('gemini-2.5-pro');
    expect(textModels).not.toContain('gemini-3.1-flash-lite-preview');
    expect(textModels[0]).toBe('gemini-3.8-flash');

    process.env.GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
    process.env.GEMINI_IMAGE_FALLBACK_MODELS = 'gemini-3.1-flash-image-preview,imagen-3.0-generate-002';
    const imageModels = getImageModelCandidates();
    expect(imageModels[0]).toBe('gemini-3.1-flash-image');
    expect(imageModels).not.toContain('gemini-2.5-flash-image');
    expect(imageModels).not.toContain('gemini-3.1-flash-image-preview');
    expect(imageModels).not.toContain('imagen-3.0-generate-002');
  });

  it('isolates text vs image cooldowns and sets >=10s Gemini httpOptions timeout', async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEYS = '["scoped-key-1", "scoped-key-2"]';
    markGeminiKeyCooldown('scoped-key-1', { status: 429, message: 'RESOURCE_EXHAUSTED' }, 'image');
    expect(getOrderedGeminiClients('image')[0].key).toBe('scoped-key-2');
    // Text scope must stay healthy despite image 429 cooldown
    expect(getOrderedGeminiClients('text')[0].key).toBe('scoped-key-1');

    // Auth 403 error invalidates both scopes
    markGeminiKeyCooldown('scoped-key-1', { status: 403, message: 'API_KEY_INVALID' }, 'image');
    expect(getOrderedGeminiClients('text')[0].key).toBe('scoped-key-2');

    // Enforce >=10s httpOptions.timeout even when caller supplies short timeoutMs (e.g. 4000ms)
    clearGeminiKeyCooldowns();
    const restaurant = await prisma.restaurant.findFirst({ where: { slug: 'chai-and-chutney' } });
    expect(restaurant).toBeTruthy();

    const clients = getOrderedGeminiClients('text');
    let observedHttpTimeout: number | undefined;
    let observedThinkingLevel: string | undefined;
    const spy = vi.spyOn(clients[0].client.models, 'generateContent').mockImplementation(async (req: any) => {
      observedHttpTimeout = req?.config?.httpOptions?.timeout;
      observedThinkingLevel = req?.config?.thinkingConfig?.thinkingLevel;
      return {
        text: JSON.stringify({
          message: 'Enjoy our freshly brewed Assam Chai.',
          dishIds: [],
          selectedDishId: null,
          pairingDishId: null,
          suggestedQuestions: [],
          safetyNotice: null,
        }),
      } as any;
    });

    const beforeCall = new Date();
    await processDinerQuery({
      restaurantId: restaurant!.id,
      userMessage: 'Any tea?',
      timeoutMs: 4000,
    });
    const logged = await prisma.aIUsageEvent.findMany({
      where: {
        restaurantId: restaurant!.id,
        operationType: 'DINER_CHAT',
        createdAt: { gte: beforeCall },
      },
      select: { id: true },
    });
    createdEventIds.push(...logged.map((e) => e.id));

    expect(spy).toHaveBeenCalled();
    expect(observedHttpTimeout).toBeGreaterThanOrEqual(10_000);
    expect(observedThinkingLevel).toBe('LOW');
    expect(MAX_BATCH_GENERATION).toBe(5);
  });
});
