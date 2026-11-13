import { describe, expect, it } from 'vitest';
import { IMAGE_GENERATION_TRANSACTION_OPTIONS } from '../src/lib/gemini/illustration-generator';

describe('image generation transaction configuration', () => {
  it('allows enough time for serialized Neon asset and credit finalization', () => {
    expect(IMAGE_GENERATION_TRANSACTION_OPTIONS).toEqual({
      maxWait: 10_000,
      timeout: 30_000,
    });
  });
});
