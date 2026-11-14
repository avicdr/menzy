import { ThinkingLevel } from '@google/genai';
import {
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  THEME_PRESETS,
  type ThemeConfig,
  getContrastRatio,
  getLuminance,
  getThemeSignature,
  normalizeThemeFont,
} from './theme-presets';
import {
  getGenAIClient,
  getTextModelCandidates,
  isGeminiModelUnavailableError,
  markGeminiKeyCooldown,
  resolveGeminiAttemptClients,
} from '../gemini/client';
import { callOpenAIChatJson, hasOpenAIFallback } from '../ai/openai-fallback';

export { getThemeSignature };

export type ThemeGenerationMode = 'random' | 'prompt';

export interface CuratedThemeArchetype {
  id: string;
  name: string;
  rationale: string;
  tags: string[];
  isDark: boolean;
  theme: ThemeConfig;
}

export interface GeneratedThemeResult {
  theme: ThemeConfig;
  themeName: string;
  rationale: string;
  source: 'gemini' | 'openai' | 'curated';
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface GenerateNiceThemeInput {
  mode: ThemeGenerationMode;
  prompt?: string;
  restaurantName?: string;
  restaurantCity?: string | null;
  restaurantDescription?: string | null;
  sampleDishes?: string[];
  excludeSignatures?: string[];
  timeoutMs?: number;
}

const ALLOWED_HEADING_FONTS = new Set<string>(HEADING_FONT_OPTIONS.map((opt) => opt.value));
const ALLOWED_BODY_FONTS = new Set<string>(BODY_FONT_OPTIONS.map((opt) => opt.value));

const CARD_RADIUS_MAP: Record<ThemeConfig['buttonStyle'], string> = {
  sharp: '10px',
  rounded: '16px',
  pill: '20px',
};

export const CURATED_AI_THEMES: CuratedThemeArchetype[] = [
  {
    id: 'amalfi-sunlit-stone',
    name: 'Amalfi Sunlit Stone',
    rationale: 'Warm limestone parchment paired with Aegean teal highlights and editorial Playfair titles.',
    tags: ['coastal', 'mediterranean', 'seafood', 'italian', 'lemon', 'brunch', 'bright', 'airy', 'summer', 'blue', 'teal', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#FBF8F1',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#1E2A38',
      secondaryTextColor: '#52606D',
      accentColor: '#1E5E76',
      secondaryAccentColor: '#9C6B21',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
      layoutMode: 'GRID',
      cardRadius: '18px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'kyoto-matcha-house',
    name: 'Kyoto Matcha House',
    rationale: 'Soft washi cream surfaces with ceremonial matcha greens and serene editorial serif headings.',
    tags: ['matcha', 'tea', 'cafe', 'japanese', 'kyoto', 'green', 'botanical', 'zen', 'healthy', 'salad', 'vegan', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#F2F5ED',
      surfaceColor: '#FCFDF9',
      primaryTextColor: '#1D2B1F',
      secondaryTextColor: '#4B5E4E',
      accentColor: '#376A43',
      secondaryAccentColor: '#8F5638',
      headingFont: 'Lora',
      bodyFont: 'Manrope',
      layoutMode: 'GRID',
      cardRadius: '16px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'candlelit-velvet-bistro',
    name: 'Candlelit Velvet Bistro',
    rationale: 'Moody midnight slate cards with deep merlot velvet accents tailored for evening dining.',
    tags: ['dark', 'moody', 'candlelit', 'candle', 'wine', 'bar', 'bistro', 'romantic', 'evening', 'steak', 'steakhouse', 'dinner', 'night', 'luxury', 'fine dining', 'italian'],
    isDark: true,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#161213',
      surfaceColor: '#231D1E',
      primaryTextColor: '#F5ECE6',
      secondaryTextColor: '#C4B3AC',
      accentColor: '#C75866',
      secondaryAccentColor: '#C49A5A',
      headingFont: 'Playfair Display',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: 'LIST',
      cardRadius: '10px',
      buttonStyle: 'sharp',
      imageProportions: 'square',
      texture: 'gradient',
    },
  },
  {
    id: 'brooklyn-espresso-roastery',
    name: 'Roasted Espresso Crema',
    rationale: 'Rich dark cocoa surfaces with warm copper crema highlights for coffee bars and night kitchens.',
    tags: ['dark', 'coffee', 'espresso', 'roastery', 'cafe', 'brunch', 'modern', 'industrial', 'copper', 'amber', 'night'],
    isDark: true,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#181411',
      surfaceColor: '#251F1A',
      primaryTextColor: '#F4ECE2',
      secondaryTextColor: '#C2B3A3',
      accentColor: '#C97A4A',
      secondaryAccentColor: '#6E856B',
      headingFont: 'DM Serif Display',
      bodyFont: 'DM Sans',
      layoutMode: 'GRID',
      cardRadius: '14px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'none',
    },
  },
  {
    id: 'parisian-boulangerie',
    name: 'Parisian Boulangerie',
    rationale: 'Blush buttercream paper with crushed berry rosewood accents and playful pill silhouettes.',
    tags: ['bakery', 'pastry', 'patisserie', 'dessert', 'cake', 'sweet', 'french', 'paris', 'cafe', 'pink', 'rose', 'floral', 'brunch', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#FDF5F3',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#3B232B',
      secondaryTextColor: '#73535E',
      accentColor: '#9E3E5B',
      secondaryAccentColor: '#5D7461',
      headingFont: 'Playfair Display',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: 'GRID',
      cardRadius: '20px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'bombay-spice-verandah',
    name: 'Spice Route Verandah',
    rationale: 'Toasted sandstone neutral background with spiced clay terracotta and warm saffron notes.',
    tags: ['indian', 'spice', 'chai', 'curry', 'tandoor', 'bombay', 'mumbai', 'heritage', 'warm', 'terracotta', 'orange', 'biryani', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#FBF4E9',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#322015',
      secondaryTextColor: '#6D5240',
      accentColor: '#A94424',
      secondaryAccentColor: '#825F17',
      headingFont: 'DM Serif Display',
      bodyFont: 'Manrope',
      layoutMode: 'GRID',
      cardRadius: '16px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'nordic-linen-birch',
    name: 'Nordic Linen & Birch',
    rationale: 'Clean oat linen canvas with pine spruce typography and crisp architectural geometry.',
    tags: ['nordic', 'minimal', 'minimalist', 'clean', 'modern', 'scandinavian', 'bakery', 'salad', 'healthy', 'bowl', 'light', 'monochrome'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#F4F3EF',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#202421',
      secondaryTextColor: '#565E59',
      accentColor: '#3A5A52',
      secondaryAccentColor: '#8D663F',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
      layoutMode: 'GRID',
      cardRadius: '12px',
      buttonStyle: 'sharp',
      imageProportions: 'square',
      texture: 'none',
    },
  },
  {
    id: 'tokyo-izakaya-charcoal',
    name: 'Tokyo Izakaya Charcoal',
    rationale: 'Deep sumi-ink charcoal surfaces contrasted with lantern vermilion highlights and crisp Inter type.',
    tags: ['dark', 'tokyo', 'japanese', 'izakaya', 'ramen', 'sushi', 'asian', 'street', 'modern', 'bold', 'red', 'night', 'cocktail'],
    isDark: true,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#121519',
      surfaceColor: '#1E232A',
      primaryTextColor: '#F1F3F5',
      secondaryTextColor: '#A9B4C0',
      accentColor: '#DF644D',
      secondaryAccentColor: '#6A979A',
      headingFont: 'DM Sans',
      bodyFont: 'Inter',
      layoutMode: 'GRID',
      cardRadius: '10px',
      buttonStyle: 'sharp',
      imageProportions: 'square',
      texture: 'gradient',
    },
  },
  {
    id: 'tuscany-olive-grove',
    name: 'Tuscany Olive Grove',
    rationale: 'Sunbaked wheat background paired with pressed olive leaf greens and classic trattoria rows.',
    tags: ['italian', 'pasta', 'pizza', 'tuscany', 'trattoria', 'rustic', 'olive', 'farm', 'organic', 'mediterranean', 'green', 'list', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#F6F2E7',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#2C281E',
      secondaryTextColor: '#615946',
      accentColor: '#4B6438',
      secondaryAccentColor: '#A25335',
      headingFont: 'Lora',
      bodyFont: 'DM Sans',
      layoutMode: 'LIST',
      cardRadius: '16px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'santorini-salt-fig',
    name: 'Santorini Salt & Fig',
    rationale: 'Crisp sea-salt mist paired with Aegean cobalt accents and soft rounded typography.',
    tags: ['coastal', 'greek', 'santorini', 'seafood', 'fish', 'fresh', 'ocean', 'sea', 'beach', 'summer', 'blue', 'light', 'bright'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#F3F7FA',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#172A3A',
      secondaryTextColor: '#4A6174',
      accentColor: '#215985',
      secondaryAccentColor: '#995843',
      headingFont: 'Lora',
      bodyFont: 'Outfit',
      layoutMode: 'GRID',
      cardRadius: '18px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'none',
    },
  },
  {
    id: 'oaxaca-agave-clay',
    name: 'Oaxaca Agave & Clay',
    rationale: 'Sun-bleached adobe tint with smoked guajillo chili red and vibrant serif display lettering.',
    tags: ['mexican', 'taco', 'oaxaca', 'agave', 'mezcal', 'grill', 'bbq', 'latin', 'tapas', 'vibrant', 'warm', 'red', 'orange', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#FAF1EC',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#361D17',
      secondaryTextColor: '#704B42',
      accentColor: '#AD4027',
      secondaryAccentColor: '#32635D',
      headingFont: 'DM Serif Display',
      bodyFont: 'Outfit',
      layoutMode: 'GRID',
      cardRadius: '14px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'obsidian-emerald-lounge',
    name: 'Emerald Supper Club',
    rationale: 'Deep jade-tinted obsidian cards with glowing botanical emerald highlights and bistro list elegance.',
    tags: ['dark', 'lounge', 'cocktail', 'bar', 'speakeasy', 'emerald', 'green', 'luxury', 'fine dining', 'evening', 'supper', 'moody'],
    isDark: true,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#101715',
      surfaceColor: '#192421',
      primaryTextColor: '#ECF3F0',
      secondaryTextColor: '#A6BDB4',
      accentColor: '#4BA48B',
      secondaryAccentColor: '#C59250',
      headingFont: 'Playfair Display',
      bodyFont: 'Manrope',
      layoutMode: 'LIST',
      cardRadius: '16px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'gradient',
    },
  },
  {
    id: 'honey-cardamom-bakery',
    name: 'Honey & Cardamom Cafe',
    rationale: 'Creamy vanilla milk surfaces warmed by toasted caramel amber tones and inviting curved cards.',
    tags: ['brunch', 'breakfast', 'bakery', 'waffle', 'pancake', 'honey', 'golden', 'warm', 'cafe', 'coffee', 'cozy', 'yellow', 'amber', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#FDF7EC',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#332414',
      secondaryTextColor: '#69533C',
      accentColor: '#965412',
      secondaryAccentColor: '#4D684F',
      headingFont: 'Lora',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: 'GRID',
      cardRadius: '20px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'paper',
    },
  },
  {
    id: 'midnight-sapphire-dining',
    name: 'Midnight Sapphire Tasting',
    rationale: 'Nocturnal indigo-slate backdrop with moonlit sapphire accents for tasting menus and raw bars.',
    tags: ['dark', 'sapphire', 'blue', 'tasting', 'fine dining', 'oyster', 'seafood', 'upscale', 'luxury', 'modern', 'wine', 'dinner'],
    isDark: true,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#111622',
      surfaceColor: '#1B2335',
      primaryTextColor: '#EEF2F9',
      secondaryTextColor: '#ABB6CA',
      accentColor: '#6492D1',
      secondaryAccentColor: '#C79654',
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      layoutMode: 'LIST',
      cardRadius: '10px',
      buttonStyle: 'sharp',
      imageProportions: 'square',
      texture: 'gradient',
    },
  },
  {
    id: 'seaside-yuzu-bar',
    name: 'Seaside Citrus & Herb',
    rationale: 'Fresh mint-white cards balanced by coastal seafoam teal and clean geometric typography.',
    tags: ['fresh', 'poke', 'bowl', 'smoothie', 'juice', 'vegan', 'vegetarian', 'healthy', 'coastal', 'teal', 'mint', 'cafe', 'modern', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#F2F7F4',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#1A2B26',
      secondaryTextColor: '#496159',
      accentColor: '#1D6860',
      secondaryAccentColor: '#AD5E3A',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Outfit',
      layoutMode: 'GRID',
      cardRadius: '18px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'none',
    },
  },
  {
    id: 'soho-modern-diner',
    name: 'Soho Modern Bistro',
    rationale: 'Crisp newsprint neutral backdrop with classic bistro crimson accents and bold geometric headers.',
    tags: ['diner', 'burger', 'pizza', 'american', 'bistro', 'urban', 'bold', 'red', 'classic', 'modern', 'all-day', 'light'],
    isDark: false,
    theme: {
      presetKey: 'CUSTOM',
      backgroundColor: '#F5F4F0',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#1A1A1A',
      secondaryTextColor: '#575757',
      accentColor: '#AA382E',
      secondaryAccentColor: '#2B5B70',
      headingFont: 'DM Sans',
      bodyFont: 'Inter',
      layoutMode: 'GRID',
      cardRadius: '12px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'none',
    },
  },
];

// =========================================================================
// COLOR CONVERSION & ACCESSIBILITY ENFORCEMENT HELPERS
// =========================================================================

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeHex(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toUpperCase();
    return `#${expanded}`;
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const [rRaw, gRaw, bRaw] = hexToRgb(hex);
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }

  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 1) + 1) % 1;
  const ss = clamp01(s);
  const ll = clamp01(l);

  if (ss === 0) {
    const v = ll * 255;
    return rgbToHex(v, v, v);
  }

  const hue2rgb = (p: number, q: number, tRaw: number) => {
    let t = tRaw;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;

  return rgbToHex(
    hue2rgb(p, q, hh + 1 / 3) * 255,
    hue2rgb(p, q, hh) * 255,
    hue2rgb(p, q, hh - 1 / 3) * 255
  );
}

function mixHex(hexA: string, hexB: string, weightB: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const w = clamp01(weightB);
  return rgbToHex(r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w);
}

function tameBackgroundColor(bg: string): string {
  const [h, s, l] = hexToHsl(bg);
  const isDark = l < 0.35;
  if (isDark) {
    if (l >= 0.05 && l <= 0.16 && s <= 0.32) {
      return bg;
    }
    // Rich deep neutral/tinted charcoal instead of muddy neon midtones
    const nextL = Math.max(0.05, Math.min(0.16, l));
    const nextS = Math.min(0.32, s);
    return hslToHex(h, nextS, nextL);
  }
  if (l >= 0.90 && l <= 0.99 && s <= 0.48) {
    return bg;
  }
  // Airy, muted light paper tones
  const nextL = Math.max(0.92, Math.min(0.985, l));
  const nextS = Math.min(0.45, s);
  return hslToHex(h, nextS, nextL);
}

function ensureReadableTextColor(
  candidate: string,
  bg: string,
  surface: string,
  minRatio: number
): string {
  const check = (hex: string) =>
    Math.min(getContrastRatio(hex, bg), getContrastRatio(hex, surface));

  if (check(candidate) >= minRatio) {
    return candidate;
  }

  const avgLum = (getLuminance(bg) + getLuminance(surface)) / 2;
  const darkAnchor = '#171310';
  const lightAnchor = '#F7F3EC';
  const targetAnchor = avgLum >= 0.45 ? darkAnchor : lightAnchor;

  for (let step = 1; step <= 20; step++) {
    const mixed = mixHex(candidate, targetAnchor, step / 20);
    if (check(mixed) >= minRatio) {
      return mixed;
    }
  }

  return getContrastRatio(darkAnchor, bg) >= getContrastRatio(lightAnchor, bg)
    ? darkAnchor
    : lightAnchor;
}

function tuneAccentColor(candidate: string, bg: string, surface: string): string {
  const [h, sRaw, lRaw] = hexToHsl(candidate);
  const surfaceLum = getLuminance(surface);
  const isDarkTheme = surfaceLum < 0.25;

  if (
    sRaw >= 0.14 &&
    sRaw <= 0.76 &&
    (isDarkTheme
      ? lRaw >= 0.40 && lRaw <= 0.68 && getContrastRatio(candidate, surface) >= 4.0
      : lRaw >= 0.22 &&
        lRaw <= 0.44 &&
        getContrastRatio(candidate, surface) >= 4.2 &&
        getContrastRatio(candidate, '#FFFFFF') >= 4.2 &&
        getContrastRatio(candidate, bg) >= 3.4)
  ) {
    return candidate;
  }

  // Keep saturation tasteful for hospitality dining interfaces (avoid harsh digital neon)
  const s = sRaw < 0.14 ? 0.28 : Math.min(0.76, sRaw);
  let l = lRaw;

  if (isDarkTheme) {
    // On dark surfaces, keep accent luminous enough for price text (>= 4.0:1 vs surface)
    l = Math.max(0.46, Math.min(0.68, l));
    let tuned = hslToHex(h, s, l);
    for (let i = 0; i < 16 && getContrastRatio(tuned, surface) < 4.0; i++) {
      l = Math.min(0.78, l + 0.03);
      tuned = hslToHex(h, s, l);
    }
    return tuned;
  }

  // On light surfaces, accent serves as BOTH pill background with white text AND price text on surface.
  // Keeping luminance <= 0.185 satisfies crisp legibility for both!
  l = Math.max(0.24, Math.min(0.44, l));
  let tuned = hslToHex(h, s, l);
  for (
    let i = 0;
    i < 18 &&
    (getContrastRatio(tuned, surface) < 4.2 ||
      getContrastRatio(tuned, '#FFFFFF') < 4.2 ||
      getContrastRatio(tuned, bg) < 3.4);
    i++
  ) {
    l = Math.max(0.18, l - 0.025);
    tuned = hslToHex(h, s, l);
  }
  return tuned;
}

/**
 * Guarantees any theme object satisfies font, layout, elevation, and WCAG contrast rules.
 */
export function sanitizeAndEnsureNiceTheme(
  raw: Partial<ThemeConfig> | Record<string, any> | null | undefined,
  fallbackTheme: ThemeConfig = CURATED_AI_THEMES[0].theme
): ThemeConfig {
  const input = raw || {};

  const rawBg = normalizeHex(input.backgroundColor) || fallbackTheme.backgroundColor;
  const backgroundColor = tameBackgroundColor(rawBg);
  const bgLum = getLuminance(backgroundColor);
  const isDarkTheme = bgLum < 0.25;

  let surfaceColor = normalizeHex(input.surfaceColor) || fallbackTheme.surfaceColor;
  const [surfH, surfS, surfL] = hexToHsl(surfaceColor);

  if (isDarkTheme) {
    // Keep card surface slightly elevated above dark background
    const minSurfaceL = Math.min(0.24, hexToHsl(backgroundColor)[2] + 0.045);
    const maxSurfaceL = 0.26;
    if (surfS > 0.32 || surfL < minSurfaceL || surfL > maxSurfaceL) {
      const nextSurfL = Math.max(minSurfaceL, Math.min(maxSurfaceL, surfL));
      surfaceColor = hslToHex(surfH || hexToHsl(backgroundColor)[0], Math.min(0.32, surfS), nextSurfL);
    }
  } else {
    // Light theme cards look crispest on bright ivory/pure white
    if (getLuminance(surfaceColor) < 0.80 || getContrastRatio(backgroundColor, surfaceColor) < 1.04) {
      surfaceColor = '#FFFFFF';
    }
  }

  // Re-check surface vs background separation
  if (getContrastRatio(backgroundColor, surfaceColor) < 1.04) {
    surfaceColor = isDarkTheme ? mixHex(backgroundColor, '#FFFFFF', 0.07) : '#FFFFFF';
  }

  const primaryCandidate =
    normalizeHex(input.primaryTextColor) || fallbackTheme.primaryTextColor;
  const primaryTextColor = ensureReadableTextColor(
    primaryCandidate,
    backgroundColor,
    surfaceColor,
    7.0
  );

  const secondaryCandidate =
    normalizeHex(input.secondaryTextColor) || fallbackTheme.secondaryTextColor;
  const secondaryTextColor = ensureReadableTextColor(
    secondaryCandidate,
    backgroundColor,
    surfaceColor,
    4.6
  );

  const accentCandidate = normalizeHex(input.accentColor) || fallbackTheme.accentColor;
  const accentColor = tuneAccentColor(accentCandidate, backgroundColor, surfaceColor);

  const secondaryAccentCandidate =
    normalizeHex(input.secondaryAccentColor) || fallbackTheme.secondaryAccentColor;
  const secondaryAccentColor = tuneAccentColor(
    secondaryAccentCandidate,
    backgroundColor,
    surfaceColor
  );

  const normalizedHeading = normalizeThemeFont(
    typeof input.headingFont === 'string' ? input.headingFont : undefined,
    fallbackTheme.headingFont
  );
  const headingFont = ALLOWED_HEADING_FONTS.has(normalizedHeading)
    ? normalizedHeading
    : fallbackTheme.headingFont;

  const normalizedBody = normalizeThemeFont(
    typeof input.bodyFont === 'string' ? input.bodyFont : undefined,
    fallbackTheme.bodyFont
  );
  const bodyFont = ALLOWED_BODY_FONTS.has(normalizedBody)
    ? normalizedBody
    : fallbackTheme.bodyFont;

  const layoutMode: ThemeConfig['layoutMode'] =
    input.layoutMode === 'LIST' || input.layoutMode === 'GRID'
      ? input.layoutMode
      : fallbackTheme.layoutMode;

  const buttonStyle: ThemeConfig['buttonStyle'] =
    input.buttonStyle === 'rounded' ||
    input.buttonStyle === 'pill' ||
    input.buttonStyle === 'sharp'
      ? input.buttonStyle
      : fallbackTheme.buttonStyle;

  const rawRadius = typeof input.cardRadius === 'string' ? input.cardRadius.trim() : '';
  const radiusNum = /^\d{1,2}px$/.test(rawRadius) ? parseInt(rawRadius, 10) : NaN;
  const cardRadius =
    !Number.isNaN(radiusNum) && radiusNum >= 6 && radiusNum <= 24
      ? `${radiusNum}px`
      : CARD_RADIUS_MAP[buttonStyle] || fallbackTheme.cardRadius;

  const imageProportions: ThemeConfig['imageProportions'] =
    input.imageProportions === 'square' ||
    input.imageProportions === 'wide' ||
    input.imageProportions === 'compact'
      ? input.imageProportions
      : fallbackTheme.imageProportions;

  const texture: ThemeConfig['texture'] =
    input.texture === 'none' || input.texture === 'paper' || input.texture === 'gradient'
      ? input.texture
      : fallbackTheme.texture;

  return {
    presetKey: 'CUSTOM',
    backgroundColor,
    surfaceColor,
    primaryTextColor,
    secondaryTextColor,
    accentColor,
    secondaryAccentColor,
    headingFont,
    bodyFont,
    layoutMode,
    cardRadius,
    buttonStyle,
    imageProportions,
    texture,
  };
}

// =========================================================================
// CURATED SELECTION & PROMPT MATCHING
// =========================================================================

export function selectCuratedTheme(params: {
  mode: ThemeGenerationMode;
  prompt?: string;
  excludeSignatures?: string[];
}): CuratedThemeArchetype {
  const excluded = new Set(
    (params.excludeSignatures || []).map((sig) => sig.trim().toUpperCase()).filter(Boolean)
  );

  const nonExcluded = CURATED_AI_THEMES.filter((entry) => {
    const rawSig = getThemeSignature(entry.theme);
    const sanitizedSig = getThemeSignature(
      sanitizeAndEnsureNiceTheme(entry.theme, THEME_PRESETS.WARM_EDITORIAL)
    );
    return !excluded.has(rawSig) && !excluded.has(sanitizedSig);
  });
  const pool = nonExcluded.length > 0 ? nonExcluded : CURATED_AI_THEMES;

  const cleanPrompt = (params.prompt || '').trim().toLowerCase();
  if (cleanPrompt && params.mode === 'prompt') {
    const tokens = cleanPrompt
      .split(/[^a-z0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

    const wantsDark =
      /\b(dark|night|midnight|noir|moody|candlelit|candle|evening|cocktail|speakeasy|obsidian|charcoal|black|lounge|wine bar)\b/.test(
        cleanPrompt
      );
    const wantsLight =
      /\b(light|bright|airy|pastel|daylight|sunny|sunlit|white|cream|minimal|morning|brunch|garden|clean)\b/.test(
        cleanPrompt
      );

    const scored = pool.map((entry) => {
      let score = 0;
      const hay = `${entry.name} ${entry.rationale} ${entry.tags.join(' ')}`.toLowerCase();

      for (const tag of entry.tags) {
        if (cleanPrompt.includes(tag)) {
          score += tag.includes(' ') ? 6 : 4;
        }
      }
      for (const token of tokens) {
        if (hay.includes(token)) {
          score += 2;
        }
      }
      if (wantsDark && entry.isDark) score += 5;
      if (wantsDark && !entry.isDark) score -= 3;
      if (wantsLight && !entry.isDark) score += 5;
      if (wantsLight && entry.isDark) score -= 3;

      return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScore = scored[0]?.score ?? 0;

    if (topScore > 0) {
      const topBucket = scored.filter((item) => item.score >= Math.max(1, topScore - 1));
      const picked = topBucket[Math.floor(Math.random() * topBucket.length)];
      return picked.entry;
    }
  }

  // Random exploration: favor visual variety (if most exclusions or current is light/dark, keep balance high)
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked;
}

function parseJsonObjectSafe(rawText: string): Record<string, any> | null {
  try {
    const cleaned = (rawText || '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    if (!cleaned) return null;
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// =========================================================================
// MAIN AI + FALLBACK NICE THEME GENERATOR
// =========================================================================

const RANDOM_CREATIVE_SEEDS = [
  'Mediterranean seaside courtyard brunch',
  'Kyoto artisan tea room & patisserie',
  'Candlelit Milanese wine & aperitivo bar',
  'Warm spiced heritage verandas with brass accents',
  'Scandinavian minimalist sourdough & coffee house',
  'Modern Tokyo izakaya & craft ramen counter',
  'Sunlit citrus orchard café & juice bar',
  'Velvet supper club & aged cocktail cellar',
  'Parisian morning croissant & espresso parlor',
  'Alpine herbal botanicals & wood-fired kitchen',
  'Soho all-day bistro with editorial typography',
  'Sun-baked clay cantina & agave grill',
];

export async function generateNiceThemeWithAI(
  input: GenerateNiceThemeInput
): Promise<GeneratedThemeResult> {
  const startedAt = Date.now();
  const timeoutMs = Math.max(1000, input.timeoutMs ?? 9000);
  const excludeSignatures = (input.excludeSignatures || [])
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const excludedSet = new Set(excludeSignatures);

  const fallbackCurated = selectCuratedTheme({
    mode: input.mode,
    prompt: input.prompt,
    excludeSignatures,
  });

  const cleanPrompt = (input.prompt || '').trim();
  const randomSeed =
    RANDOM_CREATIVE_SEEDS[Math.floor(Math.random() * RANDOM_CREATIVE_SEEDS.length)];

  const allowedHeadingList = HEADING_FONT_OPTIONS.map((o) => o.value).join(', ');
  const allowedBodyList = BODY_FONT_OPTIONS.map((o) => o.value).join(', ');

  const systemPrompt = `You are a world-class hospitality brand director & digital menu UI designer for luxury restaurants, cafes, wine bars, and bistros.
Design ONE harmonious, appetizing, editorial theme palette & typography pairing as a JSON object.

DESIGN PRINCIPLES FOR A GENUINELY NICE MENU THEME:
1. Sophisticated palettes: Never use neon, oversaturated, or garish primary hues. Keep backgrounds muted/refined:
   - Light themes: warm limestone, ivory cream, alabaster paper, misty linen, or blush parchment backgrounds with crisp bright cards (#FFFFFF or #FCFDFB).
   - Dark themes: deep charcoal, roasted espresso, midnight slate, or forest obsidian backgrounds with distinctly elevated card surfaces.
2. Crisp contrast & readability:
   - primaryTextColor MUST have strong >= 7:1 readability on BOTH backgroundColor and surfaceColor (deep charcoal/espresso ink on light cards; warm ivory/alabaster on dark cards).
   - secondaryTextColor MUST remain comfortably readable (>= 4.5:1) for descriptions and captions.
   - accentColor MUST be rich, appetizing, and distinct from neutral card surfaces (used for prices, selected category pills with white/contrasting labels, and action badges).
3. Typography pairing MUST ONLY use fonts from our loaded catalog:
   - headingFont: one of [${allowedHeadingList}]
   - bodyFont: one of [${allowedBodyList}]
4. Structural polish:
   - layoutMode: "GRID" or "LIST"
   - buttonStyle: "rounded", "pill", or "sharp"
   - cardRadius: between "8px" and "22px"
   - texture: "none", "paper", or "gradient"

Return strictly valid JSON:
{
  "themeName": "Short poetic 2-4 word theme title",
  "rationale": "One concise sentence describing the vibe and palette harmony",
  "backgroundColor": "#RRGGBB",
  "surfaceColor": "#RRGGBB",
  "primaryTextColor": "#RRGGBB",
  "secondaryTextColor": "#RRGGBB",
  "accentColor": "#RRGGBB",
  "secondaryAccentColor": "#RRGGBB",
  "headingFont": "...",
  "bodyFont": "...",
  "layoutMode": "GRID" | "LIST",
  "cardRadius": "16px",
  "buttonStyle": "rounded" | "pill" | "sharp",
  "texture": "none" | "paper" | "gradient"
}`;

  const restaurantContext = [
    input.restaurantName ? `Restaurant Name: ${input.restaurantName}` : null,
    input.restaurantCity ? `City: ${input.restaurantCity}` : null,
    input.restaurantDescription ? `Description: ${input.restaurantDescription}` : null,
    input.sampleDishes && input.sampleDishes.length > 0
      ? `Sample Menu Items: ${input.sampleDishes.slice(0, 8).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const excludeInstruction =
    excludeSignatures.length > 0
      ? `Avoid repeating these previously used (backgroundColor|accentColor) combinations: ${excludeSignatures.slice(-8).join(', ')}.`
      : '';

  const userPrompt =
    input.mode === 'prompt' && cleanPrompt
      ? `Mode: Prompt-guided bespoke theme design.
User Mood / Style Request: "${cleanPrompt}"
${restaurantContext ? `\nContext:\n${restaurantContext}` : ''}
${excludeInstruction ? `\n${excludeInstruction}` : ''}`
      : `Mode: Surprise me! Generate an unexpected, tasteful, fresh hospitality aesthetic inspired by "${randomSeed}".
Vary light vs moody themes naturally and make it distinctly attractive for a digital restaurant menu.
${restaurantContext ? `\nContext:\n${restaurantContext}` : ''}
${excludeInstruction ? `\n${excludeInstruction}` : ''}`;

  const finalizeAI = (
    rawText: string,
    source: 'gemini' | 'openai',
    modelUsed: string,
    inputTokens?: number,
    outputTokens?: number
  ): GeneratedThemeResult | null => {
    const parsed = parseJsonObjectSafe(rawText);
    if (!parsed) return null;

    const sanitized = sanitizeAndEnsureNiceTheme(parsed, fallbackCurated.theme);
    // Reject if AI accidentally echoed back an excluded background/accent signature
    if (excludedSet.has(getThemeSignature(sanitized))) {
      return null;
    }

    const themeName =
      typeof parsed.themeName === 'string' && parsed.themeName.trim().length >= 3
        ? parsed.themeName.trim().slice(0, 56)
        : fallbackCurated.name;
    const rationale =
      typeof parsed.rationale === 'string' && parsed.rationale.trim().length >= 8
        ? parsed.rationale.trim().slice(0, 180)
        : fallbackCurated.rationale;

    return {
      theme: sanitized,
      themeName,
      rationale,
      source,
      modelUsed,
      inputTokens,
      outputTokens,
    };
  };

  const geminiClients = resolveGeminiAttemptClients(getGenAIClient('text'), 'text');
  const openAiEnabled = hasOpenAIFallback();
  const modelCandidates = getTextModelCandidates();
  const deadlineAt = startedAt + timeoutMs;

  if (geminiClients.length > 0 || openAiEnabled) {
    const geminiDeadlineAt = openAiEnabled
      ? startedAt + Math.max(250, timeoutMs - Math.min(2000, Math.floor(timeoutMs * 0.25)))
      : deadlineAt;
    const invalidKeySet = new Set<string>();
    let abortModelCascade = false;

    for (let mIdx = 0; mIdx < modelCandidates.length && !abortModelCascade; mIdx++) {
      const candidateModel = modelCandidates[mIdx];

      for (let idx = 0; idx < geminiClients.length; idx++) {
        const entry = geminiClients[idx];
        if (invalidKeySet.has(entry.key)) {
          continue;
        }

        const remainingTotalMs = deadlineAt - Date.now();
        const remainingGeminiMs = geminiDeadlineAt - Date.now();
        if ((mIdx > 0 || idx > 0) && remainingGeminiMs <= 150) {
          abortModelCascade = true;
          break;
        }
        if (remainingTotalMs <= 50) {
          abortModelCascade = true;
          break;
        }

        const remainingKeysInModel = geminiClients.length - 1 - idx;
        const remainingModels = modelCandidates.length - 1 - mIdx;
        const remainingFallbacks =
          remainingKeysInModel + remainingModels + (openAiEnabled ? 1 : 0);
        const budgetMs = Math.max(40, remainingGeminiMs);
        const attemptTimeoutMs =
          timeoutMs >= 3000 && remainingFallbacks > 0
            ? Math.min(budgetMs, Math.max(1500, Math.floor(budgetMs * 0.6)))
            : Math.max(20, remainingTotalMs);

        const controller = new AbortController();
        let requestTimer: ReturnType<typeof setTimeout> | undefined;
        let raceTimer: ReturnType<typeof setTimeout> | undefined;

        try {
          requestTimer = setTimeout(() => {
            controller.abort(new Error('GEMINI_THEME_TIMEOUT'));
          }, attemptTimeoutMs);

          const modelConfig: Record<string, any> = {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: input.mode === 'random' ? 0.9 : 0.65,
            abortSignal: controller.signal,
            httpOptions: { timeout: Math.max(10_000, attemptTimeoutMs) },
          };

          if (candidateModel.startsWith('gemini-3')) {
            modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          const response: any = await Promise.race([
            entry.client.models.generateContent({
              model: candidateModel,
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              config: modelConfig,
            }),
            new Promise<never>((_, reject) => {
              raceTimer = setTimeout(
                () => reject(new Error('GEMINI_THEME_TIMEOUT')),
                attemptTimeoutMs + 250
              );
            }),
          ]);

          const responseText = response?.text || '{}';
          const result = finalizeAI(responseText, 'gemini', candidateModel);
          if (result) {
            return result;
          }
        } catch (err) {
          if (isGeminiModelUnavailableError(err)) {
            console.warn(`Gemini theme model unavailable (${candidateModel}); trying the next model.`);
            break;
          }
          const msg = String((err as any)?.message || err || '').toLowerCase();
          const status = Number((err as any)?.status ?? (err as any)?.statusCode ?? 0);
          if (
            status === 401 ||
            status === 403 ||
            msg.includes('api_key_invalid') ||
            msg.includes('api key not valid') ||
            msg.includes('permission_denied') ||
            msg.includes('leaked')
          ) {
            invalidKeySet.add(entry.key);
          }

          if (entry.key !== 'mock-injected-client') {
            markGeminiKeyCooldown(entry.key, err, 'text');
          } else {
            abortModelCascade = true;
          }
          console.warn(
            `Gemini theme generator fallback (${candidateModel}, key ${entry.maskedKey}):`,
            err
          );
          if (abortModelCascade) {
            break;
          }
        } finally {
          if (requestTimer) clearTimeout(requestTimer);
          if (raceTimer) clearTimeout(raceTimer);
        }
      }
    }

    const remainingForOpenAI = deadlineAt - Date.now();
    if (openAiEnabled && (geminiClients.length === 0 || remainingForOpenAI > 250)) {
      try {
        const openAiResult = await callOpenAIChatJson({
          systemPrompt,
          userPrompt,
          timeoutMs: Math.max(500, remainingForOpenAI),
          temperature: input.mode === 'random' ? 0.85 : 0.6,
        });
        const result = finalizeAI(
          openAiResult.text,
          'openai',
          openAiResult.model,
          openAiResult.inputTokens,
          openAiResult.outputTokens
        );
        if (result) {
          return result;
        }
      } catch (openAiErr) {
        console.warn('OpenAI theme generator fallback failed, using curated theme:', openAiErr);
      }
    }
  }

  return {
    theme: sanitizeAndEnsureNiceTheme(fallbackCurated.theme, THEME_PRESETS.WARM_EDITORIAL),
    themeName: fallbackCurated.name,
    rationale: fallbackCurated.rationale,
    source: 'curated',
  };
}
