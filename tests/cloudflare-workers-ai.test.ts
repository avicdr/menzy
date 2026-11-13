import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateCloudflareDishImage,
  getCloudflareImageModel,
  getCloudflareWorkersAIStatus,
  hasCloudflareWorkersAI,
} from '../src/lib/ai/cloudflare-workers-ai';
import { buildIllustrationPrompt } from '../src/lib/gemini/illustration-generator';

const originalEnv = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  token: process.env.CLOUDFLARE_AI_API_TOKEN,
  fallbackToken: process.env.CLOUDFLARE_API_TOKEN,
  cfAccountId: process.env.CF_ACCOUNT_ID,
  cfToken: process.env.CF_API_TOKEN,
  model: process.env.CLOUDFLARE_AI_IMAGE_MODEL,
  steps: process.env.CLOUDFLARE_AI_IMAGE_STEPS,
};
const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  const values = [
    ['CLOUDFLARE_ACCOUNT_ID', originalEnv.accountId],
    ['CLOUDFLARE_AI_API_TOKEN', originalEnv.token],
    ['CLOUDFLARE_API_TOKEN', originalEnv.fallbackToken],
    ['CF_ACCOUNT_ID', originalEnv.cfAccountId],
    ['CF_API_TOKEN', originalEnv.cfToken],
    ['CLOUDFLARE_AI_IMAGE_MODEL', originalEnv.model],
    ['CLOUDFLARE_AI_IMAGE_STEPS', originalEnv.steps],
  ] as const;
  for (const [key, value] of values) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('Cloudflare Workers AI image provider', () => {
  it('uses a photorealistic food prompt and explicitly rejects clay or CGI styling', () => {
    const prompt = buildIllustrationPrompt({
      dishName: 'Paneer butter masala',
      visualDescription: 'Creamy tomato gravy with paneer cubes and coriander',
    });

    expect(prompt).toContain('photorealistic editorial food photography');
    expect(prompt).toContain('NO 3D clay');
    expect(prompt).toContain('NO toy or CGI cartoon look');
  });

  it('requires an account ID and API token', () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_AI_API_TOKEN;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CF_ACCOUNT_ID;
    delete process.env.CF_API_TOKEN;
    expect(hasCloudflareWorkersAI()).toBe(false);
    expect(getCloudflareWorkersAIStatus()).toMatchObject({
      configured: false,
      accountIdSource: null,
      apiTokenSource: null,
    });
  });

  it('accepts common Cloudflare environment variable aliases', () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_AI_API_TOKEN;
    process.env.CF_ACCOUNT_ID = 'account-id';
    process.env.CLOUDFLARE_API_TOKEN = 'workers-ai-token';

    expect(getCloudflareWorkersAIStatus()).toEqual({
      configured: true,
      accountIdSource: 'CF_ACCOUNT_ID',
      apiTokenSource: 'CLOUDFLARE_API_TOKEN',
      reason: null,
    });
  });

  it('generates a raster image through the Workers AI REST API', async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id';
    process.env.CLOUDFLARE_AI_API_TOKEN = 'workers-ai-token';
    process.env.CLOUDFLARE_AI_IMAGE_STEPS = '12';
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    global.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer workers-ai-token' });
      expect(JSON.parse(String(init?.body))).toMatchObject({ steps: 8 });
      return new Response(
        JSON.stringify({ success: true, result: { image: jpeg.toString('base64') } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const result = await generateCloudflareDishImage({
      prompt: 'Photorealistic restaurant food photography',
    });

    expect(result.model).toBe('@cf/black-forest-labs/flux-1-schnell');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.ext).toBe('jpg');
    expect(result.buffer).toEqual(jpeg);
    expect(getCloudflareImageModel()).toBe('@cf/black-forest-labs/flux-1-schnell');
  });

  it('surfaces Cloudflare quota and authentication failures without exposing the token', async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id';
    process.env.CLOUDFLARE_AI_API_TOKEN = 'secret-token-value';
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ errors: [{ message: 'quota exceeded' }] }), { status: 429 })
    ) as any;

    await expect(
      generateCloudflareDishImage({ prompt: 'Realistic plated curry' })
    ).rejects.toThrow(/Cloudflare Workers AI error \(429\)/);

    try {
      await generateCloudflareDishImage({ prompt: 'Realistic plated curry' });
    } catch (error) {
      expect(String(error)).not.toContain('secret-token-value');
    }
  });
});
