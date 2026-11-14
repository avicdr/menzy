import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/storage/adapter', () => ({
  sanitizeStorageKey: (value: string) => value,
  getAssetBuffer: vi.fn(async () => ({
    buffer: Buffer.from('image-bytes'),
    contentType: 'image/webp',
  })),
}));

vi.mock('../src/lib/auth/owner-auth', () => ({
  getOwnerSession: vi.fn(async () => null),
}));

import { GET } from '../src/app/api/storage/[...key]/route';

describe('storage asset route', () => {
  it('serves canonical library assets through the storage proxy', async () => {
    const response = await GET(new Request('http://localhost/api/storage/canonical/realistic/dish.webp'), {
      params: Promise.resolve({ key: ['canonical', 'realistic', 'dish.webp'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(await response.text()).toBe('image-bytes');
  });
});
