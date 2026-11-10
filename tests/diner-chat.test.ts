import { describe, it, expect, vi, afterEach } from 'vitest';
import prisma from '../src/lib/db/prisma';
import * as geminiClient from '../src/lib/gemini/client';
import {
  DEFAULT_GEMINI_TEXT_MODEL,
  getTextModelName,
} from '../src/lib/gemini/client';
import {
  parseGeminiJsonResponse,
  processDinerQuery,
} from '../src/lib/gemini/diner-chat';

describe('Diner AI Chat Resiliency, Timeout Guard & Model Resolution', () => {
  const originalModel = process.env.GEMINI_TEXT_MODEL;
  const createdEventIds: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    if (originalModel === undefined) {
      delete process.env.GEMINI_TEXT_MODEL;
    } else {
      process.env.GEMINI_TEXT_MODEL = originalModel;
    }
    if (createdEventIds.length > 0) {
      await prisma.aIUsageEvent.deleteMany({
        where: { id: { in: createdEventIds.splice(0, createdEventIds.length) } },
      }).catch(() => {});
    }
  });

  it('upgrades known broken or stalling model IDs to gemini-3-flash-preview', () => {
    process.env.GEMINI_TEXT_MODEL = 'gemini-3.8-flash';
    expect(getTextModelName()).toBe(DEFAULT_GEMINI_TEXT_MODEL);

    process.env.GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
    expect(getTextModelName()).toBe(DEFAULT_GEMINI_TEXT_MODEL);

    process.env.GEMINI_TEXT_MODEL = 'gemini-3.1-flash-lite-preview';
    expect(getTextModelName()).toBe('gemini-3.1-flash-lite-preview');
  });

  it('parses fenced and raw Gemini JSON payloads safely', () => {
    const fenced = '```json\n{"message":"Try our Paneer Roll","dishIds":["id-1"]}\n```';
    const parsed = parseGeminiJsonResponse(fenced);
    expect(parsed.message).toBe('Try our Paneer Roll');
    expect(parsed.dishIds).toEqual(['id-1']);

    expect(parseGeminiJsonResponse('')).toEqual({});
  });

  it('falls back cleanly within timeout when Gemini hangs on an open promise', async () => {
    const restaurant = await prisma.restaurant.findFirst({
      where: { slug: 'chai-and-chutney' },
    });
    expect(restaurant).toBeTruthy();

    vi.spyOn(geminiClient, 'getGenAIClient').mockReturnValue({
      models: {
        generateContent: vi.fn(
          () => new Promise(() => {}) // Simulate hanging upstream network socket
        ),
      },
    } as any);

    const startedAt = Date.now();
    const beforeTimestamp = new Date();
    const result = await processDinerQuery({
      restaurantId: restaurant!.id,
      userMessage: 'Show vegetarian options under 300',
      timeoutMs: 60,
    });
    const elapsedMs = Date.now() - startedAt;

    // Collect logged usage event so DB stays clean
    const logged = await prisma.aIUsageEvent.findMany({
      where: {
        restaurantId: restaurant!.id,
        operationType: 'DINER_CHAT',
        createdAt: { gte: beforeTimestamp },
      },
      select: { id: true },
    });
    createdEventIds.push(...logged.map((e) => e.id));

    expect(elapsedMs).toBeLessThan(2000);
    expect(result.message.length).toBeGreaterThan(10);
    expect(Array.isArray(result.dishIds)).toBe(true);
    expect(result.dishIds.length).toBeGreaterThan(0);
  });
});

