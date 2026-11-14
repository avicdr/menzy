import { GoogleGenAI } from '@google/genai';

const clientCache = new Map<string, GoogleGenAI>();
const keyCooldownUntil = new Map<string, number>();

export type GeminiCooldownScope = 'text' | 'image';

function getCooldownMapKey(apiKey: string, scope: GeminiCooldownScope): string {
  return `${scope}:${apiKey}`;
}

export interface GeminiClientEntry {
  key: string;
  keyIndex: number;
  maskedKey: string;
  client: GoogleGenAI;
}

export function parseKeyList(rawValue?: string): string[] {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return [];
  }

  let candidates: string[] = [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        candidates = parsed.map((item) => String(item ?? '').trim());
      }
    } catch {
      // Also tolerate JS-style arrays like ['k1', 'k2',] or trailing commas in .env
      const inner = trimmed.replace(/^\[/, '').replace(/\]$/, '');
      candidates = inner.split(/[\r\n,;]+/);
    }
  } else {
    candidates = trimmed.split(/[\r\n,;]+/);
  }

  return candidates
    .map((item) => item.trim().replace(/^['"]+|['"]+$/g, '').trim())
    .filter((item) => item.length > 0 && item !== 'mock-gemini-key');
}

export function parseGeminiApiKeys(): string[] {
  const rawSources: Array<string | undefined> = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEYS,
  ];

  for (let i = 1; i <= 10; i++) {
    rawSources.push(process.env[`GEMINI_API_KEY_${i}`]);
  }

  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const source of rawSources) {
    for (const key of parseKeyList(source)) {
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(key);
      }
    }
  }

  return ordered;
}

export function maskApiKey(key: string): string {
  if (!key) return 'unknown';
  if (key.length <= 8) return `${key.slice(0, 2)}...`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export function getGenAIClientForKey(apiKey: string): GoogleGenAI {
  const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
  const cacheKey = `${apiVersion}:${apiKey}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new GoogleGenAI({
      apiKey,
      apiVersion,
    });
    clientCache.set(cacheKey, client);
  }
  return client;
}

export function clearGeminiKeyCooldowns(): void {
  keyCooldownUntil.clear();
}

export function markGeminiKeyCooldown(
  apiKey: string,
  err: unknown,
  scope: GeminiCooldownScope = 'text'
): void {
  if (!apiKey) return;
  const now = Date.now();
  const anyErr = err as any;
  const status = Number(anyErr?.status ?? anyErr?.statusCode ?? anyErr?.cause?.status ?? 0);
  const message = String(anyErr?.message || anyErr || '').toLowerCase();

  const isAuthError =
    status === 401 ||
    status === 403 ||
    message.includes('api_key_invalid') ||
    message.includes('api key not valid') ||
    message.includes('permission_denied') ||
    message.includes('leaked');

  const isFreeTierZeroImageQuota =
    scope === 'image' &&
    (message.includes('limit: 0') || message.includes('free_tier_requests'));

  let cooldownMs = 15_000;
  if (isAuthError) {
    cooldownMs = 10 * 60_000;
  } else if (isFreeTierZeroImageQuota) {
    cooldownMs = 5 * 60_000;
  } else if (
    status === 429 ||
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit')
  ) {
    cooldownMs = 60_000;
  }

  if (isAuthError) {
    // Invalid/revoked keys fail across both text and image scopes
    keyCooldownUntil.set(getCooldownMapKey(apiKey, 'text'), now + cooldownMs);
    keyCooldownUntil.set(getCooldownMapKey(apiKey, 'image'), now + cooldownMs);
  } else {
    keyCooldownUntil.set(getCooldownMapKey(apiKey, scope), now + cooldownMs);
  }
}

export function isGeminiKeyCooledDown(
  apiKey: string,
  scope: GeminiCooldownScope = 'text'
): boolean {
  if (!apiKey) return false;
  const until = keyCooldownUntil.get(getCooldownMapKey(apiKey, scope)) ?? 0;
  return until > Date.now();
}

/**
 * Returns all configured Gemini clients ordered with healthy (non-cooled-down)
 * keys first, followed by keys currently on cooldown as a last resort.
 */
export function getOrderedGeminiClients(
  scope: GeminiCooldownScope = 'text'
): GeminiClientEntry[] {
  const keys = parseGeminiApiKeys();
  if (keys.length === 0) {
    return [];
  }

  const now = Date.now();
  const healthy: GeminiClientEntry[] = [];
  const cooledDown: Array<{ until: number; entry: GeminiClientEntry }> = [];

  keys.forEach((key, idx) => {
    const entry: GeminiClientEntry = {
      key,
      keyIndex: idx,
      maskedKey: maskApiKey(key),
      client: getGenAIClientForKey(key),
    };
    const until = keyCooldownUntil.get(getCooldownMapKey(key, scope)) ?? 0;
    if (until > now) {
      cooledDown.push({ until, entry });
    } else {
      healthy.push(entry);
    }
  });

  cooledDown.sort((a, b) => a.until - b.until);
  return [...healthy, ...cooledDown.map((item) => item.entry)];
}

/**
 * Resolves the list of Gemini clients to attempt, while preserving compatibility
 * with tests that spy on `getGenAIClient()` to inject a mock or disable Gemini.
 */
export function resolveGeminiAttemptClients(
  primaryClient: GoogleGenAI | null,
  scope: GeminiCooldownScope = 'text'
): GeminiClientEntry[] {
  if (!primaryClient) {
    return [];
  }

  const pool = getOrderedGeminiClients(scope);
  const matchesCachedEnvClient = pool.some((entry) => entry.client === primaryClient);

  if (!matchesCachedEnvClient) {
    return [
      {
        key: 'mock-injected-client',
        keyIndex: 0,
        maskedKey: 'mock',
        client: primaryClient,
      },
    ];
  }

  return pool;
}

export function getGenAIClient(
  scope: GeminiCooldownScope = 'text'
): GoogleGenAI | null {
  const ordered = getOrderedGeminiClients(scope);
  return ordered[0]?.client ?? null;
}

const RETIRED_TEXT_MODELS = new Set([
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]);

const RETIRED_IMAGE_MODELS = new Set([
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'imagen-3.0-generate-002',
  'imagen-3.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-ultra-generate-001',
]);

export const DEFAULT_GEMINI_TEXT_MODEL = 'gemini-3.5-flash-lite';
export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

const DEFAULT_GEMINI_TEXT_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
];

export function isGeminiModelUnavailableError(error: unknown): boolean {
  const value = error as any;
  const status = Number(
    value?.status ?? value?.statusCode ?? value?.error?.code ?? value?.cause?.status ?? 0
  );
  const message = String(value?.message || value || '').toLowerCase();
  return (
    status === 503 ||
    message.includes('high demand') ||
    message.includes('model is currently experiencing') ||
    message.includes('"status":"unavailable"') ||
    message.includes('service unavailable')
  );
}

export function getTextModelName(): string {
  const configured = process.env.GEMINI_TEXT_MODEL?.trim();
  if (!configured || RETIRED_TEXT_MODELS.has(configured)) {
    return DEFAULT_GEMINI_TEXT_MODEL;
  }
  return configured;
}

export function getTextModelCandidates(): string[] {
  const primary = getTextModelName();
  const envFallbacks = parseKeyList(process.env.GEMINI_TEXT_FALLBACK_MODELS);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const model of [primary, ...envFallbacks, ...DEFAULT_GEMINI_TEXT_FALLBACK_MODELS]) {
    const trimmed = model.trim();
    if (!trimmed || RETIRED_TEXT_MODELS.has(trimmed) || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function getImageModelName(): string {
  const configured = process.env.GEMINI_IMAGE_MODEL?.trim();
  if (!configured || RETIRED_IMAGE_MODELS.has(configured)) {
    return DEFAULT_GEMINI_IMAGE_MODEL;
  }
  return configured;
}

export function getImageModelCandidates(): string[] {
  const primary = getImageModelName();
  const envFallbacks = parseKeyList(process.env.GEMINI_IMAGE_FALLBACK_MODELS);
  const defaults = [
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3-pro-image',
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const model of [primary, ...envFallbacks, ...defaults]) {
    const trimmed = model.trim();
    if (!trimmed || RETIRED_IMAGE_MODELS.has(trimmed) || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}
