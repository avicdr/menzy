import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  sanitizeStorageKey,
  getS3StorageConfig,
  uploadAsset,
  getAssetBuffer,
  readAssetFromUrl,
  deleteAsset,
} from '../src/lib/storage/adapter';

describe('Object Storage Adapter (S3 / Supabase Storage + Local Fallback)', () => {
  const originalEnv = {
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_REGION: process.env.R2_REGION,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.R2_BUCKET = originalEnv.R2_BUCKET;
    process.env.R2_ENDPOINT = originalEnv.R2_ENDPOINT;
    process.env.R2_REGION = originalEnv.R2_REGION;
    process.env.R2_ACCESS_KEY_ID = originalEnv.R2_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = originalEnv.R2_SECRET_ACCESS_KEY;
    process.env.R2_PUBLIC_URL = originalEnv.R2_PUBLIC_URL;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sanitizes storage keys and rejects directory traversal attempts', () => {
    expect(sanitizeStorageKey('/photos/123-dish.png')).toBe('photos/123-dish.png');
    expect(sanitizeStorageKey('banners\\hero.webp')).toBe('banners/hero.webp');
    expect(sanitizeStorageKey('../.env')).toBeNull();
    expect(sanitizeStorageKey('photos/../../secret')).toBeNull();
    expect(sanitizeStorageKey('photos/\0bad.png')).toBeNull();
    expect(sanitizeStorageKey('')).toBeNull();
  });

  it('ignores unconfigured placeholder endpoints', () => {
    process.env.R2_ENDPOINT = 'https://your-account-id.r2.cloudflarestorage.com';
    process.env.R2_ACCESS_KEY_ID = 'abc';
    process.env.R2_SECRET_ACCESS_KEY = 'xyz';
    expect(getS3StorageConfig()).toBeNull();
  });

  it('uploads via AWS SigV4 path-style S3 PUT and reads back via /api/storage/', async () => {
    process.env.R2_BUCKET = 'menzyr2';
    process.env.R2_ENDPOINT = 'https://example-project.storage.supabase.co/storage/v1/s3';
    process.env.R2_REGION = 'us-east-1';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    delete process.env.R2_PUBLIC_URL;

    const stored = new Map<string, { body: Buffer; contentType: string }>();

    global.fetch = vi.fn(async (input: any, init?: RequestInit) => {
      const url = String(input);
      const headers = (init?.headers || {}) as Record<string, string>;
      expect(headers.Authorization).toContain('AWS4-HMAC-SHA256 Credential=test-access-key/');
      expect(headers.Authorization).toContain('/us-east-1/s3/aws4_request');

      if (init?.method === 'PUT') {
        stored.set(url, {
          body: Buffer.from(init.body as Uint8Array),
          contentType: headers['Content-Type'] || 'application/octet-stream',
        });
        return new Response(null, { status: 200 });
      }
      if (init?.method === 'GET') {
        const entry = stored.get(url);
        if (!entry) return new Response('Not Found', { status: 404 });
        return new Response(new Uint8Array(entry.body), {
          status: 200,
          headers: { 'content-type': entry.contentType },
        });
      }
      return new Response(null, { status: 204 });
    }) as any;

    const payload = Buffer.from('fake-png-bytes');
    const result = await uploadAsset(payload, 'test banner.png', 'image/png', 'banners');

    expect(result.storageKey).toMatch(/^banners\/\d+-test_banner\.png$/);
    expect(result.publicUrl).toBe(`/api/storage/${result.storageKey}`);
    expect(result.mime).toBe('image/png');
    expect(result.sizeBytes).toBe(payload.length);

    const loaded = await readAssetFromUrl(result.publicUrl);
    expect(loaded).not.toBeNull();
    expect(loaded!.mimeType).toBe('image/png');
    expect(loaded!.buffer.equals(payload)).toBe(true);
  });

  it('uses R2_PUBLIC_URL when configured and surfaces S3 upload errors', async () => {
    process.env.R2_BUCKET = 'menzyr2';
    process.env.R2_ENDPOINT = 'https://example-project.storage.supabase.co/storage/v1/s3';
    process.env.R2_REGION = 'us-east-1';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_PUBLIC_URL = 'https://example-project.supabase.co/storage/v1/object/public/menzyr2/';

    global.fetch = vi.fn(async () => new Response(null, { status: 200 })) as any;

    const okResult = await uploadAsset(Buffer.from('abc'), 'dish.webp', 'image/webp', 'photos');
    expect(okResult.publicUrl).toBe(
      `https://example-project.supabase.co/storage/v1/object/public/menzyr2/${okResult.storageKey}`
    );

    global.fetch = vi.fn(async () => new Response('<Error><Code>NoSuchBucket</Code></Error>', { status: 404 })) as any;
    await expect(
      uploadAsset(Buffer.from('abc'), 'dish.webp', 'image/webp', 'photos')
    ).rejects.toThrow(/Object storage upload failed \(404/);
  });

  it('falls back to local public/uploads/ when S3 credentials are absent', async () => {
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_ENDPOINT;

    const payload = Buffer.from('<svg></svg>', 'utf-8');
    const res = await uploadAsset(payload, 'fallback-test.svg', 'image/svg+xml', 'illustrations');
    try {
      expect(res.publicUrl).toBe(`/uploads/${res.storageKey}`);
      const loaded = await getAssetBuffer(res.storageKey);
      expect(loaded).not.toBeNull();
      expect(loaded!.buffer.toString('utf-8')).toBe('<svg></svg>');
    } finally {
      await deleteAsset(res.storageKey);
    }
  });
});

