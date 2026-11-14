import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_GEMINI_TEXT_MODEL,
  getTextModelCandidates,
  isGeminiModelUnavailableError,
} from '../src/lib/gemini/client';

describe('Gemini text model routing', () => {
  const originalTextModel = process.env.GEMINI_TEXT_MODEL;
  const originalFallbackModels = process.env.GEMINI_TEXT_FALLBACK_MODELS;

  afterEach(() => {
    if (originalTextModel === undefined) delete process.env.GEMINI_TEXT_MODEL;
    else process.env.GEMINI_TEXT_MODEL = originalTextModel;

    if (originalFallbackModels === undefined) delete process.env.GEMINI_TEXT_FALLBACK_MODELS;
    else process.env.GEMINI_TEXT_FALLBACK_MODELS = originalFallbackModels;
  });

  it('uses stable older models before the high-demand current model by default', () => {
    delete process.env.GEMINI_TEXT_MODEL;
    delete process.env.GEMINI_TEXT_FALLBACK_MODELS;

    expect(DEFAULT_GEMINI_TEXT_MODEL).toBe('gemini-3.5-flash-lite');
    expect(getTextModelCandidates()).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-3.8-flash',
    ]);
  });

  it('recognizes model-wide unavailability separately from quota errors', () => {
    expect(isGeminiModelUnavailableError({ status: 503 })).toBe(true);
    expect(
      isGeminiModelUnavailableError(
        new Error('This model is currently experiencing high demand. Please try again later.')
      )
    ).toBe(true);
    expect(isGeminiModelUnavailableError(new Error('{"status":"UNAVAILABLE"}'))).toBe(true);
    expect(isGeminiModelUnavailableError({ status: 429, message: 'Quota exceeded' })).toBe(false);
  });
});
