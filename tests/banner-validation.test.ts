import { describe, it, expect } from 'vitest';
import {
  MAX_BANNER_UPLOAD_BYTES,
  normalizeBannerMime,
  resolveLandingHeroMedia,
  validateBannerFileMeta,
  validateBannerUrlInput,
} from '../src/lib/banner/banner-validation';

describe('Cafe & Demo Banner Validation and Hero Media Resolution', () => {
  describe('normalizeBannerMime & validateBannerFileMeta', () => {
    it('normalizes image/jpg to image/jpeg and infers supported mime types from filename fallback', () => {
      expect(normalizeBannerMime('image/jpg', 'hero.jpg')).toBe('image/jpeg');
      expect(normalizeBannerMime('image/PNG', 'hero.png')).toBe('image/png');
      expect(normalizeBannerMime('', 'cafe-banner.webp')).toBe('image/webp');
      expect(normalizeBannerMime('image/svg+xml', 'vector.svg')).toBeNull();
    });

    it('accepts valid JPG, PNG, and WebP files under 5 MB', () => {
      expect(
        validateBannerFileMeta({
          type: 'image/webp',
          name: 'cafe.webp',
          size: 256_000,
        })
      ).toEqual({ ok: true, mime: 'image/webp' });
    });

    it('rejects empty, oversized, or unsupported file formats', () => {
      expect(
        validateBannerFileMeta({
          type: 'image/png',
          name: 'empty.png',
          size: 0,
        }).ok
      ).toBe(false);

      expect(
        validateBannerFileMeta({
          type: 'image/png',
          name: 'huge.png',
          size: MAX_BANNER_UPLOAD_BYTES + 1,
        }).ok
      ).toBe(false);

      expect(
        validateBannerFileMeta({
          type: 'application/pdf',
          name: 'menu.pdf',
          size: 1024,
        }).ok
      ).toBe(false);
    });
  });

  describe('validateBannerUrlInput', () => {
    it('allows empty/null/undefined values to represent no banner', () => {
      expect(validateBannerUrlInput(undefined)).toEqual({ ok: true, value: undefined });
      expect(validateBannerUrlInput(null)).toEqual({ ok: true, value: null });
      expect(validateBannerUrlInput('   ')).toEqual({ ok: true, value: null });
    });

    it('accepts uploaded storage paths and valid http(s) banner URLs', () => {
      expect(validateBannerUrlInput(' /api/storage/banners/123-cafe.webp ')).toEqual({
        ok: true,
        value: '/api/storage/banners/123-cafe.webp',
      });
      expect(validateBannerUrlInput('/uploads/banners/hero.jpg')).toEqual({
        ok: true,
        value: '/uploads/banners/hero.jpg',
      });
      expect(validateBannerUrlInput('https://cdn.example.com/banners/peddler.png')).toEqual({
        ok: true,
        value: 'https://cdn.example.com/banners/peddler.png',
      });
    });

    it('rejects path traversal, malformed URLs, dangerous schemes, and non-strings', () => {
      expect(validateBannerUrlInput('/uploads/../secret.png').ok).toBe(false);
      expect(validateBannerUrlInput('https://').ok).toBe(false);
      expect(validateBannerUrlInput('javascript:alert(1)').ok).toBe(false);
      expect(validateBannerUrlInput('not-a-valid-url').ok).toBe(false);
      expect(validateBannerUrlInput(12345).ok).toBe(false);
    });
  });

  describe('resolveLandingHeroMedia', () => {
    it('returns null bannerUrl and null logoUrl when no banner or logo is configured (never canonical dish fallback)', () => {
      expect(
        resolveLandingHeroMedia({
          coverUrl: null,
          bannerError: false,
          logoUrl: null,
          logoError: false,
        })
      ).toEqual({
        bannerUrl: null,
        logoUrl: null,
      });

      expect(
        resolveLandingHeroMedia({
          coverUrl: '   ',
          bannerError: false,
          logoUrl: '',
          logoError: false,
        })
      ).toEqual({
        bannerUrl: null,
        logoUrl: null,
      });
    });

    it('returns the configured cover banner when present and suppresses it if loading fails', () => {
      expect(
        resolveLandingHeroMedia({
          coverUrl: ' /api/storage/banners/cafe-hero.webp ',
          bannerError: false,
        })
      ).toEqual({
        bannerUrl: '/api/storage/banners/cafe-hero.webp',
        logoUrl: null,
      });

      expect(
        resolveLandingHeroMedia({
          coverUrl: '/api/storage/banners/cafe-hero.webp',
          bannerError: true,
        })
      ).toEqual({
        bannerUrl: null,
        logoUrl: null,
      });
    });

    it('returns logoUrl only when explicitly set and suppresses broken logos cleanly', () => {
      expect(
        resolveLandingHeroMedia({
          coverUrl: null,
          logoUrl: 'https://cdn.example.com/logo.png',
          logoError: false,
        })
      ).toEqual({
        bannerUrl: null,
        logoUrl: 'https://cdn.example.com/logo.png',
      });

      expect(
        resolveLandingHeroMedia({
          coverUrl: null,
          logoUrl: 'https://cdn.example.com/broken-logo.png',
          logoError: true,
        })
      ).toEqual({
        bannerUrl: null,
        logoUrl: null,
      });
    });
  });
});

