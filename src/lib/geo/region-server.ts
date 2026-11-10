import crypto from 'crypto';
import { getCache } from '@/lib/cache/redis';
import {
  BillingRegion,
  countryCodeToBillingRegion,
  detectRegionFromAcceptLanguage,
  normalizeCountryCode,
} from './region-shared';

export type GeoHeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>;

export interface VisitorRegionResolution {
  region: BillingRegion;
  countryCode: string | null;
  source: 'header' | 'ip' | 'accept-language' | 'default';
  authoritative: boolean;
}

export interface ResolveVisitorRegionOptions {
  ipLookup?: (ip: string) => Promise<string | null>;
  skipRemoteLookup?: boolean;
}

const COUNTRY_HEADER_NAMES = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'cloudfront-viewer-country',
  'x-country-code',
  'x-geo-country',
  'x-nf-country',
  'fly-country',
  'x-appengine-country',
] as const;

const IP_HEADER_NAMES = [
  'cf-connecting-ip',
  'true-client-ip',
  'x-real-ip',
  'x-forwarded-for',
] as const;

interface CachedGeoEntry {
  countryCode: string | null;
  expiresAt: number;
}

const MEMORY_CACHE_MAX_SIZE = 5000;
const MEMORY_CACHE_HIT_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const MEMORY_CACHE_MISS_TTL_MS = 5 * 60 * 1000; // 5m
const ipGeoMemoryCache = new Map<string, CachedGeoEntry>();

function readHeader(headers: GeoHeaderSource, name: string): string | null {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }
  const record = headers as Record<string, string | string[] | undefined>;
  const target = name.toLowerCase();
  for (const key of Object.keys(record)) {
    if (key.toLowerCase() === target) {
      const value = record[key];
      if (Array.isArray(value)) return value[0] || null;
      return typeof value === 'string' ? value : null;
    }
  }
  return null;
}

export function normalizeIpAddress(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let candidate = raw.trim();
  if (!candidate) return null;

  // Strip IPv6 brackets and optional port: [2001:db8::1]:1234
  if (candidate.startsWith('[')) {
    const closingIdx = candidate.indexOf(']');
    if (closingIdx !== -1) {
      candidate = candidate.slice(1, closingIdx);
    }
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.slice(0, candidate.lastIndexOf(':'));
  }

  // Unwrap IPv4-mapped IPv6 address (::ffff:1.2.3.4)
  if (candidate.toLowerCase().startsWith('::ffff:')) {
    candidate = candidate.slice(7);
  }

  return candidate || null;
}

export function isPublicIp(rawIp: string | null | undefined): boolean {
  const ip = normalizeIpAddress(rawIp);
  if (!ip) return false;

  // Check IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const octets = ip.split('.').map((n) => Number(n));
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
      return false;
    }
    const [a, b] = octets;

    if (a === 0) return false; // 0.0.0.0/8
    if (a === 10) return false; // 10.0.0.0/8 private
    if (a === 127) return false; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return false; // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12 private
    if (a === 192 && b === 168) return false; // 192.168.0.0/16 private
    if (a === 100 && b >= 64 && b <= 127) return false; // 100.64.0.0/10 CGNAT
    if (a >= 224) return false; // multicast & reserved
    return true;
  }

  // Check IPv6
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return false;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false; // Unique local fc00::/7
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
      return false; // Link-local fe80::/10
    }
    return true;
  }

  return false;
}

export function extractClientIpFromHeaders(headers: GeoHeaderSource): string | null {
  for (const name of IP_HEADER_NAMES) {
    const raw = readHeader(headers, name);
    if (!raw) continue;

    const parts = raw.split(',');
    for (const part of parts) {
      const normalized = normalizeIpAddress(part);
      if (normalized && isPublicIp(normalized)) {
        return normalized;
      }
    }
  }
  return null;
}

async function lookupCountryByIpRemote(ip: string): Promise<string | null> {
  if (process.env.VITEST) {
    return null;
  }

  try {
    const res = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(850),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const normalized = normalizeCountryCode(data?.country);
      if (normalized) return normalized;
    }
  } catch {
    // Fallback provider below
  }

  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`, {
      signal: AbortSignal.timeout(850),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success !== false) {
        const normalized = normalizeCountryCode(data?.country_code);
        if (normalized) return normalized;
      }
    }
  } catch {
    // Ignore transient network errors cleanly
  }

  return null;
}

function setMemoryCache(key: string, countryCode: string | null) {
  if (ipGeoMemoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
    const oldestKey = ipGeoMemoryCache.keys().next().value;
    if (oldestKey) {
      ipGeoMemoryCache.delete(oldestKey);
    }
  }
  const ttl = countryCode ? MEMORY_CACHE_HIT_TTL_MS : MEMORY_CACHE_MISS_TTL_MS;
  ipGeoMemoryCache.set(key, { countryCode, expiresAt: Date.now() + ttl });
}

async function resolveCountryCodeForPublicIp(
  ip: string,
  options?: ResolveVisitorRegionOptions
): Promise<string | null> {
  const useCustomLookup = typeof options?.ipLookup === 'function';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);

  if (!useCustomLookup) {
    const memHit = ipGeoMemoryCache.get(ipHash);
    if (memHit && memHit.expiresAt > Date.now()) {
      return memHit.countryCode;
    }

    try {
      const cache = getCache();
      const redisHit = await cache.get(`geo:ip:${ipHash}`);
      if (redisHit) {
        const normalized = normalizeCountryCode(redisHit);
        if (normalized) {
          setMemoryCache(ipHash, normalized);
          return normalized;
        }
      }
    } catch {
      // Redis unavailable is non-fatal
    }
  }

  const lookupFn = options?.ipLookup || lookupCountryByIpRemote;
  const resolved = normalizeCountryCode(await lookupFn(ip));

  if (!useCustomLookup) {
    setMemoryCache(ipHash, resolved);
    if (resolved) {
      try {
        const cache = getCache();
        await cache.set(`geo:ip:${ipHash}`, resolved, 'EX', 12 * 60 * 60);
      } catch {
        // Non-fatal
      }
    }
  }

  return resolved;
}

/**
 * Resolves the visitor's billing/pricing region strictly on the server.
 * Order:
 *   1. CDN / hosting / reverse-proxy country headers (authoritative)
 *   2. Public client IP geolocation with caching (authoritative)
 *   3. Accept-Language India signal (non-authoritative hint)
 *   4. Default US/USD (non-authoritative)
 */
export async function resolveVisitorRegion(
  headers: GeoHeaderSource,
  options?: ResolveVisitorRegionOptions
): Promise<VisitorRegionResolution> {
  for (const headerName of COUNTRY_HEADER_NAMES) {
    const rawCountry = readHeader(headers, headerName);
    const countryCode = normalizeCountryCode(rawCountry);
    const region = countryCodeToBillingRegion(countryCode);
    if (countryCode && region) {
      return {
        region,
        countryCode,
        source: 'header',
        authoritative: true,
      };
    }
  }

  if (!options?.skipRemoteLookup) {
    const clientIp = extractClientIpFromHeaders(headers);
    if (clientIp) {
      const ipCountry = await resolveCountryCodeForPublicIp(clientIp, options);
      const region = countryCodeToBillingRegion(ipCountry);
      if (ipCountry && region) {
        return {
          region,
          countryCode: ipCountry,
          source: 'ip',
          authoritative: true,
        };
      }
    }
  }

  const acceptLanguage = readHeader(headers, 'accept-language');
  const langRegion = detectRegionFromAcceptLanguage(acceptLanguage);
  if (langRegion === 'IN') {
    return {
      region: 'IN',
      countryCode: 'IN',
      source: 'accept-language',
      authoritative: false,
    };
  }

  return {
    region: 'US',
    countryCode: null,
    source: 'default',
    authoritative: false,
  };
}

export function clearIpGeoMemoryCache() {
  ipGeoMemoryCache.clear();
}
