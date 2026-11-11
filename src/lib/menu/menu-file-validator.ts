export type SupportedMenuPhotoMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/heic'
  | 'image/heif';

export type SupportedMenuMime = SupportedMenuPhotoMime | 'application/pdf';

export const ALLOWED_MENU_PHOTO_MIME_TYPES: ReadonlySet<SupportedMenuPhotoMime> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export const ALLOWED_MENU_MIME_TYPES: ReadonlySet<SupportedMenuMime> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

export const MENU_PHOTO_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif';
export const MENU_PDF_ACCEPT = 'application/pdf,.pdf';
export const MENU_ANY_ACCEPT = `${MENU_PHOTO_ACCEPT},${MENU_PDF_ACCEPT}`;

export const MAX_MENU_FILES_PER_UPLOAD = 10;
export const MAX_MENU_PHOTO_BYTES = 15 * 1024 * 1024; // 15 MB per photo
export const MAX_MENU_PDF_BYTES = 20 * 1024 * 1024; // 20 MB per PDF

const GENERIC_MIME_TYPES = new Set([
  '',
  'application/octet-stream',
  'binary/octet-stream',
  'application/force-download',
  'application/download',
  'application/unknown',
]);

const PDF_MIME_ALIASES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
]);

const EXT_TO_MIME: Record<string, SupportedMenuMime> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpe': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.pdf': 'application/pdf',
};

const MIME_TO_CANONICAL_EXT: Record<SupportedMenuMime, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'application/pdf': '.pdf',
};

const HEIC_FTYP_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
]);

const HEIF_FTYP_BRANDS = new Set(['mif1', 'msf1', 'heif']);

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  let out = '';
  const end = Math.min(bytes.length, start + length);
  for (let i = start; i < end; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

export function isGenericOrEmptyMime(rawMime?: string | null): boolean {
  const clean = (rawMime || '').split(';')[0].trim().toLowerCase();
  return GENERIC_MIME_TYPES.has(clean);
}

export function normalizeMenuMimeType(rawMime?: string | null): SupportedMenuMime | null {
  const clean = (rawMime || '').split(';')[0].trim().toLowerCase();
  if (!clean || GENERIC_MIME_TYPES.has(clean)) {
    return null;
  }
  if (clean === 'image/jpeg' || clean === 'image/jpg' || clean === 'image/pjpeg') {
    return 'image/jpeg';
  }
  if (clean === 'image/png' || clean === 'image/x-png') {
    return 'image/png';
  }
  if (clean === 'image/webp') {
    return 'image/webp';
  }
  if (clean === 'image/gif') {
    return 'image/gif';
  }
  if (clean === 'image/heic' || clean === 'image/heic-sequence') {
    return 'image/heic';
  }
  if (clean === 'image/heif' || clean === 'image/heif-sequence') {
    return 'image/heif';
  }
  if (PDF_MIME_ALIASES.has(clean)) {
    return 'application/pdf';
  }
  return null;
}

export function inferMenuMimeFromFilename(fileNameOrUrl?: string | null): SupportedMenuMime | null {
  if (!fileNameOrUrl) return null;
  const clean = fileNameOrUrl.split('?')[0].split('#')[0].trim().toLowerCase();
  const lastDot = clean.lastIndexOf('.');
  if (lastDot < 0) return null;
  const ext = clean.slice(lastDot);
  return EXT_TO_MIME[ext] || null;
}

/**
 * Inspects file header magic bytes to determine the real image or PDF MIME type.
 * Works identically with Node Buffers and browser Uint8Arrays.
 */
export function sniffMenuFileMimeFromBytes(bytes: Uint8Array): SupportedMenuMime | null {
  if (!bytes || bytes.length < 3) {
    return null;
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }

  // GIF: GIF87a / GIF89a
  if (bytes.length >= 6) {
    const gifSig = readAscii(bytes, 0, 6);
    if (gifSig === 'GIF87a' || gifSig === 'GIF89a') {
      return 'image/gif';
    }
  }

  // WEBP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    readAscii(bytes, 0, 4) === 'RIFF' &&
    readAscii(bytes, 8, 4) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // HEIC / HEIF (ISO BMFF ftyp box)
  if (bytes.length >= 12 && readAscii(bytes, 4, 4) === 'ftyp') {
    const majorBrand = readAscii(bytes, 8, 4).toLowerCase();
    if (HEIC_FTYP_BRANDS.has(majorBrand)) {
      return 'image/heic';
    }
    if (HEIF_FTYP_BRANDS.has(majorBrand)) {
      return 'image/heif';
    }
    // Check compatible_brands list starting at offset 16
    const boxSize = Math.min(bytes.length, 64);
    for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
      const compat = readAscii(bytes, offset, 4).toLowerCase();
      if (HEIC_FTYP_BRANDS.has(compat)) return 'image/heic';
      if (HEIF_FTYP_BRANDS.has(compat)) return 'image/heif';
    }
  }

  // PDF: '%PDF-' within the first 1024 bytes per PDF 1.7 spec
  const searchLimit = Math.min(bytes.length, 1024);
  for (let i = 0; i <= searchLimit - 5; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return 'application/pdf';
    }
  }

  return null;
}

export function ensureMenuFileExtension(
  rawFileName: string | null | undefined,
  verifiedMime: SupportedMenuMime,
  fallbackBase = 'menu-upload'
): string {
  const canonicalExt = MIME_TO_CANONICAL_EXT[verifiedMime];
  const baseName = (rawFileName || '')
    .split(/[\\/]/)
    .pop()
    ?.trim() || fallbackBase;

  const existingMime = inferMenuMimeFromFilename(baseName);
  if (existingMime === verifiedMime) {
    return baseName;
  }

  const lastDot = baseName.lastIndexOf('.');
  const stem = lastDot > 0 ? baseName.slice(0, lastDot) : baseName;
  return `${stem || fallbackBase}${canonicalExt}`;
}

export function validateAndNormalizeMenuFile(
  bytes: Uint8Array,
  rawFileName?: string | null,
  rawMimeType?: string | null
):
  | {
      ok: true;
      mimeType: SupportedMenuMime;
      kind: 'pdf' | 'photo';
      normalizedFileName: string;
      sizeBytes: number;
    }
  | {
      ok: false;
      error: string;
    } {
  const displayName = rawFileName?.trim() || 'menu file';

  if (!bytes || bytes.length === 0) {
    return {
      ok: false,
      error: `The file "${displayName}" is empty (0 bytes). Please choose a valid menu photo or PDF.`,
    };
  }

  const sniffedMime = sniffMenuFileMimeFromBytes(bytes);
  const declaredMime = normalizeMenuMimeType(rawMimeType);
  const extMime = inferMenuMimeFromFilename(displayName);

  if (!sniffedMime) {
    if (declaredMime === 'application/pdf' || extMime === 'application/pdf') {
      return {
        ok: false,
        error: `The file "${displayName}" does not appear to be a valid PDF document. Please upload an uncorrupted menu PDF or menu photos (JPG, PNG, WebP).`,
      };
    }
    return {
      ok: false,
      error: `Unsupported file format for "${displayName}". Please upload menu photos (JPG, PNG, WebP, GIF, HEIC) or a PDF document.`,
    };
  }

  const isPdf = sniffedMime === 'application/pdf';
  const maxBytes = isPdf ? MAX_MENU_PDF_BYTES : MAX_MENU_PHOTO_BYTES;
  const maxMbLabel = isPdf ? '20 MB' : '15 MB';

  if (bytes.length > maxBytes) {
    return {
      ok: false,
      error: `"${displayName}" exceeds the ${maxMbLabel} size limit for menu ${isPdf ? 'PDFs' : 'photos'}.`,
    };
  }

  return {
    ok: true,
    mimeType: sniffedMime,
    kind: isPdf ? 'pdf' : 'photo',
    normalizedFileName: ensureMenuFileExtension(displayName, sniffedMime),
    sizeBytes: bytes.length,
  };
}

/**
 * Resolves the safest MIME type when loading already-stored buffers for AI extraction.
 * Prefers magic-byte detection so generic 'application/octet-stream' or missing headers
 * never reach Gemini/OpenAI, while honoring valid explicit types for small test fixtures.
 */
export function resolveMenuMimeForExtraction(
  bytes: Uint8Array,
  currentMime?: string | null,
  fileNameOrUrl?: string | null
): SupportedMenuMime | null {
  const sniffed = sniffMenuFileMimeFromBytes(bytes);
  if (sniffed) {
    return sniffed;
  }

  const normalizedDeclared = normalizeMenuMimeType(currentMime);
  if (normalizedDeclared) {
    return normalizedDeclared;
  }

  return inferMenuMimeFromFilename(fileNameOrUrl);
}

