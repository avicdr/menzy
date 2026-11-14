import { describe, it, expect, vi, afterEach } from 'vitest';
import * as geminiClient from '../src/lib/gemini/client';
import * as openAiFallback from '../src/lib/ai/openai-fallback';
import * as ownerAuth from '../src/lib/auth/owner-auth';
import prisma from '../src/lib/db/prisma';
import {
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  THEME_PRESETS,
  getContrastRatio,
  pickContrastForeground,
  sanitizeThemePersistenceInput,
  validateThemeAccessibility,
} from '../src/lib/theme/theme-presets';
import {
  CURATED_AI_THEMES,
  generateNiceThemeWithAI,
  getThemeSignature,
  sanitizeAndEnsureNiceTheme,
  selectCuratedTheme,
} from '../src/lib/theme/theme-generator';
import { POST as generateThemePost } from '../src/app/api/themes/generate/route';

const ALLOWED_HEADINGS = new Set<string>(HEADING_FONT_OPTIONS.map((o) => o.value));
const ALLOWED_BODIES = new Set<string>(BODY_FONT_OPTIONS.map((o) => o.value));

describe('Hospitality Nice Theme Generator & Contrast Guarantees', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guarantees every curated theme archetype is high-contrast, properly paired, and distinct', () => {
    const signatures = new Set<string>();

    for (const archetype of CURATED_AI_THEMES) {
      const sanitized = sanitizeAndEnsureNiceTheme(archetype.theme, THEME_PRESETS.WARM_EDITORIAL);
      const sig = getThemeSignature(sanitized);

      expect(archetype.theme.presetKey).toBe('CUSTOM');
      expect(signatures.has(sig)).toBe(false);
      signatures.add(sig);

      expect(ALLOWED_HEADINGS.has(sanitized.headingFont)).toBe(true);
      expect(ALLOWED_BODIES.has(sanitized.bodyFont)).toBe(true);

      // Primary and secondary ink readability on both canvas background and card surface
      expect(getContrastRatio(sanitized.primaryTextColor, sanitized.backgroundColor)).toBeGreaterThanOrEqual(7.0);
      expect(getContrastRatio(sanitized.primaryTextColor, sanitized.surfaceColor)).toBeGreaterThanOrEqual(7.0);
      expect(getContrastRatio(sanitized.secondaryTextColor, sanitized.backgroundColor)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(sanitized.secondaryTextColor, sanitized.surfaceColor)).toBeGreaterThanOrEqual(4.5);

      // Card surface elevation separation
      expect(getContrastRatio(sanitized.backgroundColor, sanitized.surfaceColor)).toBeGreaterThanOrEqual(1.04);

      // Accent visibility on cards and legible contrasting pill text
      expect(getContrastRatio(sanitized.accentColor, sanitized.surfaceColor)).toBeGreaterThanOrEqual(3.5);
      const pillInk = pickContrastForeground(sanitized.accentColor);
      expect(getContrastRatio(sanitized.accentColor, pillInk)).toBeGreaterThanOrEqual(4.5);

      expect(validateThemeAccessibility(sanitized).isValid).toBe(true);
    }
  });

  it('repairs clashing, neon, low-contrast, or legacy-font AI outputs cleanly', () => {
    const awfulInput = {
      backgroundColor: '#ffff00',
      surfaceColor: '#ffff11',
      primaryTextColor: '#eeeeaa',
      secondaryTextColor: '#f8f8aa',
      accentColor: '#fefefe',
      secondaryAccentColor: '#123',
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Unknown Sans',
      layoutMode: 'LIST',
      buttonStyle: 'pill',
      cardRadius: '99px',
      texture: 'sparkles',
    };

    const fixed = sanitizeAndEnsureNiceTheme(awfulInput, THEME_PRESETS.WARM_EDITORIAL);

    expect(fixed.presetKey).toBe('CUSTOM');
    expect(fixed.headingFont).toBe('Playfair Display');
    expect(fixed.bodyFont).toBe(THEME_PRESETS.WARM_EDITORIAL.bodyFont);
    expect(fixed.layoutMode).toBe('LIST');
    expect(fixed.buttonStyle).toBe('pill');
    expect(fixed.texture).toBe(THEME_PRESETS.WARM_EDITORIAL.texture);

    expect(getContrastRatio(fixed.primaryTextColor, fixed.backgroundColor)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(fixed.primaryTextColor, fixed.surfaceColor)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(fixed.secondaryTextColor, fixed.surfaceColor)).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(fixed.backgroundColor, fixed.surfaceColor)).toBeGreaterThanOrEqual(1.04);
    expect(getContrastRatio(fixed.accentColor, fixed.surfaceColor)).toBeGreaterThanOrEqual(3.5);
  });

  it('matches prompt moods and rotates non-repeating random themes when offline', async () => {
    vi.spyOn(geminiClient, 'getGenAIClient').mockReturnValue(null);
    vi.spyOn(openAiFallback, 'hasOpenAIFallback').mockReturnValue(false);

    const wineBar = await generateNiceThemeWithAI({
      mode: 'prompt',
      prompt: 'Candlelit Italian wine bar and steakhouse',
      restaurantName: 'Osteria Notte',
    });
    expect(wineBar.source).toBe('curated');
    expect(wineBar.theme.presetKey).toBe('CUSTOM');
    expect(getContrastRatio(wineBar.theme.primaryTextColor, wineBar.theme.backgroundColor)).toBeGreaterThanOrEqual(7.0);
    expect(wineBar.themeName.toLowerCase()).toMatch(/candlelit|bistro|sapphire|emerald|espresso|izakaya/);

    const matcha = selectCuratedTheme({
      mode: 'prompt',
      prompt: 'Kyoto matcha tea room',
    });
    expect(matcha.id).toBe('kyoto-matcha-house');

    // Repeated random calls with exclusion signatures must produce distinct themes
    const seenSignatures: string[] = [];
    for (let i = 0; i < 6; i++) {
      const randomTheme = await generateNiceThemeWithAI({
        mode: 'random',
        excludeSignatures: seenSignatures,
      });
      const sig = getThemeSignature(randomTheme.theme);
      expect(seenSignatures).not.toContain(sig);
      seenSignatures.push(sig);
    }
    expect(seenSignatures.length).toBe(6);
  });

  it('sanitizes Gemini JSON theme responses and avoids echoed excluded themes', async () => {
    vi.spyOn(openAiFallback, 'hasOpenAIFallback').mockReturnValue(false);
    vi.spyOn(geminiClient, 'getTextModelCandidates').mockReturnValue(['gemini-3-flash-preview']);

    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        themeName: 'Tuscan Fig & Stone',
        rationale: 'Warm limestone parchment paired with deep fig terracotta and Lora serifs.',
        backgroundColor: '#F6F1E8',
        surfaceColor: '#FFFFFF',
        primaryTextColor: '#8B7D74', // Intentionally low contrast to verify sanitizer upgrades it
        secondaryTextColor: '#A99C93',
        accentColor: '#B55742',
        secondaryAccentColor: '#4E6B50',
        headingFont: 'Lora',
        bodyFont: 'DM Sans',
        layoutMode: 'GRID',
        cardRadius: '18px',
        buttonStyle: 'pill',
        texture: 'paper',
      }),
    });

    vi.spyOn(geminiClient, 'getGenAIClient').mockReturnValue({
      models: { generateContent: mockGenerateContent },
    } as any);

    const res = await generateNiceThemeWithAI({
      mode: 'prompt',
      prompt: 'Rustic Tuscan fig cafe',
      restaurantName: 'Casa Fico',
    });

    expect(res.source).toBe('gemini');
    expect(res.themeName).toBe('Tuscan Fig & Stone');
    expect(res.theme.presetKey).toBe('CUSTOM');
    expect(getContrastRatio(res.theme.primaryTextColor, res.theme.surfaceColor)).toBeGreaterThanOrEqual(7.0);
    expect(getContrastRatio(res.theme.secondaryTextColor, res.theme.surfaceColor)).toBeGreaterThanOrEqual(4.5);
  });

  it('picks high-contrast pill foreground text and strips non-schema fields before DB upsert', () => {
    expect(pickContrastForeground('#C6975A')).toBe('#171310');
    expect(pickContrastForeground('#376A43')).toBe('#FFFFFF');

    const cleaned = sanitizeThemePersistenceInput({
      presetKey: 'CUSTOM',
      backgroundColor: '#fbf8f1',
      surfaceColor: '#ffffff',
      primaryTextColor: '#1e2a38',
      accentColor: '#1e5e76',
      headingFont: 'Cormorant Garamond',
      mobileGridColumns: 2,
      themeName: 'Amalfi Sunlit Stone',
      rationale: 'Extra UI metadata should be stripped',
    });

    expect(cleaned).toEqual({
      presetKey: 'CUSTOM',
      backgroundColor: '#FBF8F1',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#1E2A38',
      accentColor: '#1E5E76',
      headingFont: 'Playfair Display',
      mobileGridColumns: 2,
    });
    expect((cleaned as any).themeName).toBeUndefined();
    expect((cleaned as any).rationale).toBeUndefined();
  });

  it('POST /api/themes/generate enforces auth, prompt rules, and returns valid CUSTOM preview theme', async () => {
    vi.spyOn(geminiClient, 'getGenAIClient').mockReturnValue(null);
    vi.spyOn(openAiFallback, 'hasOpenAIFallback').mockReturnValue(false);

    // 1. Unauthenticated -> 401
    vi.spyOn(ownerAuth, 'requireRestaurantAccess').mockResolvedValueOnce({
      authorized: false,
      user: null,
      restaurant: null,
      error: 'UNAUTHENTICATED',
    });
    const unauthRes = await generateThemePost(
      new Request('http://localhost/api/themes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: 'rest-1', mode: 'random' }),
      })
    );
    expect(unauthRes.status).toBe(401);

    // 2. Empty prompt in prompt mode -> 400
    vi.spyOn(ownerAuth, 'requireRestaurantAccess').mockResolvedValueOnce({
      authorized: true,
      user: { userId: 'u1', email: 'owner@test.in', name: 'Owner', organizations: [] },
      restaurant: {
        id: 'rest-1',
        organizationId: 'org-1',
        displayName: 'The Peddlers Cafe',
        city: 'Lucknow',
        description: 'Cozy pasta cafe',
      },
    });
    const emptyPromptRes = await generateThemePost(
      new Request('http://localhost/api/themes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: 'rest-1', mode: 'prompt', prompt: '   ' }),
      })
    );
    expect(emptyPromptRes.status).toBe(400);

    // 3. Valid random generation -> 200 with nice CUSTOM theme
    vi.spyOn(ownerAuth, 'requireRestaurantAccess').mockResolvedValueOnce({
      authorized: true,
      user: { userId: 'u1', email: 'owner@test.in', name: 'Owner', organizations: [] },
      restaurant: {
        id: 'rest-1',
        organizationId: 'org-1',
        displayName: 'The Peddlers Cafe',
        city: 'Lucknow',
        description: 'Cozy pasta cafe',
      },
    });
    vi.spyOn(prisma.restaurantMenuItem, 'findMany').mockResolvedValueOnce([
      { customName: 'Mushroom Pasta' },
      { customName: 'Arrabiata Penne' },
    ] as any);

    const okRes = await generateThemePost(
      new Request('http://localhost/api/themes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: 'rest-1',
          mode: 'random',
          excludeSignatures: [getThemeSignature(THEME_PRESETS.WARM_EDITORIAL)],
        }),
      })
    );
    expect(okRes.status).toBe(200);
    const data = await okRes.json();
    expect(data.success).toBe(true);
    expect(data.theme.presetKey).toBe('CUSTOM');
    expect(typeof data.themeName).toBe('string');
    expect(typeof data.rationale).toBe('string');
    expect(validateThemeAccessibility(data.theme).isValid).toBe(true);
  });
});
