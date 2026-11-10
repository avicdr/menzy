export type BillingRegion = 'IN' | 'US';

const INDIAN_TIMEZONES = new Set(['asia/kolkata', 'asia/calcutta']);

const NON_GEOGRAPHIC_TIMEZONES = new Set(['', 'utc', 'etc/utc', 'gmt', 'etc/gmt', 'etc/gmt+0', 'etc/gmt-0']);

const INDIAN_LANGUAGE_PRIMARY_SUBTAGS = new Set([
  'hi',
  'bn',
  'te',
  'mr',
  'ta',
  'gu',
  'kn',
  'ml',
  'pa',
  'or',
  'as',
  'ur',
]);

const IGNORED_COUNTRY_HEADER_VALUES = new Set(['', 'XX', 'T1', 'ZZ', 'LOCAL', 'UNKNOWN', 'N/A']);

export function normalizeCountryCode(countryCode?: string | null): string | null {
  if (!countryCode || typeof countryCode !== 'string') return null;
  const cleaned = countryCode.trim().toUpperCase();
  if (IGNORED_COUNTRY_HEADER_VALUES.has(cleaned)) return null;
  if (!/^[A-Z]{2}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Maps an ISO 3166-1 alpha-2 country code to our pricing catalog region.
 * India ('IN') maps to domestic INR plans; US and all non-India countries map to USD plans.
 */
export function countryCodeToBillingRegion(countryCode?: string | null): BillingRegion | null {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return null;
  return normalized === 'IN' ? 'IN' : 'US';
}

export function detectRegionFromAcceptLanguage(acceptLanguage?: string | null): BillingRegion | null {
  if (!acceptLanguage || typeof acceptLanguage !== 'string') return null;

  const entries = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim())
    .filter(Boolean);

  for (const tag of entries) {
    const lower = tag.toLowerCase();
    const parts = lower.split('-');
    const primary = parts[0] || '';
    const regionSubtag = parts.find((p, idx) => idx > 0 && p.length === 2);

    if (regionSubtag === 'in' || INDIAN_LANGUAGE_PRIMARY_SUBTAGS.has(primary)) {
      return 'IN';
    }
  }

  return null;
}

/**
 * Infers pricing region from browser IANA timezone first (handles en-US browsers used in India)
 * and falls back to locale subtags only when timezone is absent/generic UTC.
 */
export function detectRegionFromTimezoneAndLocale(
  timeZone?: string | null,
  locale?: string | null
): BillingRegion {
  const tz = typeof timeZone === 'string' ? timeZone.trim().toLowerCase() : '';

  if (tz && !NON_GEOGRAPHIC_TIMEZONES.has(tz)) {
    if (INDIAN_TIMEZONES.has(tz)) {
      return 'IN';
    }
    return 'US';
  }

  if (locale && typeof locale === 'string') {
    const langMatch = detectRegionFromAcceptLanguage(locale);
    if (langMatch) {
      return langMatch;
    }
  }

  return 'US';
}

