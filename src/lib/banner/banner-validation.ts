export type SupportedBannerMime = 'image/jpeg' | 'image/png' | 'image/webp';

export const ALLOWED_BANNER_MIME_TYPES: ReadonlySet<string> = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_BANNER_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export function normalizeBannerMime(
  rawType?: string | null,
  fileName?: string | null
): SupportedBannerMime | null {
  const lowerType = (rawType || '').trim().toLowerCase();
  if (lowerType === 'image/jpg' || lowerType === 'image/jpeg') {
    return 'image/jpeg';
  }
  if (lowerType === 'image/png') {
    return 'image/png';
  }
  if (lowerType === 'image/webp') {
    return 'image/webp';
  }

  // Fallback by filename extension when OS/browser omits MIME type
  const cleanName = (fileName || '').trim().toLowerCase();
  if (cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (cleanName.endsWith('.png')) {
    return 'image/png';
  }
  if (cleanName.endsWith('.webp')) {
    return 'image/webp';
  }

  return null;
}

export function validateBannerFileMeta(file: {
  type?: string | null;
  name?: string | null;
  size: number;
}):
  | { ok: true; mime: SupportedBannerMime }
  | { ok: false; error: string } {
  const mime = normalizeBannerMime(file.type, file.name);
  if (!mime) {
    return {
      ok: false,
      error: 'Unsupported banner format. Please upload a JPG, PNG, or WebP file.',
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: 'Uploaded banner image file is empty.' };
  }

  if (file.size > MAX_BANNER_UPLOAD_BYTES) {
    return { ok: false, error: 'Banner image size must be 5 MB or smaller.' };
  }

  return { ok: true, mime };
}

export function validateBannerUrlInput(coverUrl: unknown):
  | { ok: true; value: string | null | undefined }
  | { ok: false; error: string } {
  if (coverUrl === undefined) {
    return { ok: true, value: undefined };
  }
  if (coverUrl === null) {
    return { ok: true, value: null };
  }
  if (typeof coverUrl !== 'string') {
    return { ok: false, error: 'Invalid banner image URL' };
  }

  const trimmed = coverUrl.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/storage/')) {
    if (trimmed.includes('..') || /[\s\0]/.test(trimmed)) {
      return { ok: false, error: 'Invalid uploaded banner path.' };
    }
    return { ok: true, value: trimmed };
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname) {
        return {
          ok: false,
          error: 'Banner image URL must be an uploaded asset path or a valid http(s) URL.',
        };
      }
      return { ok: true, value: trimmed };
    } catch {
      return {
        ok: false,
        error: 'Banner image URL must be an uploaded asset path or a valid http(s) URL.',
      };
    }
  }

  return {
    ok: false,
    error: 'Banner image URL must be an uploaded asset path or a valid http(s) URL.',
  };
}

/**
 * Resolves diner QR portal hero imagery strictly from restaurant banner / logo settings.
 * Never falls back to canonical dish images or dish placeholder artwork when a venue
 * has not configured its own banner.
 */
export function resolveLandingHeroMedia(params: {
  coverUrl?: string | null;
  bannerError?: boolean;
  logoUrl?: string | null;
  logoError?: boolean;
}): {
  bannerUrl: string | null;
  logoUrl: string | null;
} {
  const cleanCover = typeof params.coverUrl === 'string' ? params.coverUrl.trim() : '';
  const cleanLogo = typeof params.logoUrl === 'string' ? params.logoUrl.trim() : '';

  return {
    bannerUrl: cleanCover && !params.bannerError ? cleanCover : null,
    logoUrl: cleanLogo && !params.logoError ? cleanLogo : null,
  };
}

