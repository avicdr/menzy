import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  isGenericOrEmptyMime,
  normalizeMenuMimeType,
  sniffMenuFileMimeFromBytes,
} from '@/lib/menu/menu-file-validator';

export interface StorageUploadResult {
  storageKey: string;
  publicUrl: string;
  mime: string;
  sizeBytes: number;
}

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string | null;
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export function inferMimeType(filePathOrUrl: string, fallback = 'application/octet-stream'): string {
  const clean = filePathOrUrl.split('?')[0].split('#')[0];
  const ext = path.extname(clean).toLowerCase();
  return MIME_BY_EXT[ext] || fallback;
}

function resolveAssetContentType(
  buffer: Buffer,
  headerContentType: string | null | undefined,
  filePathOrUrl: string,
  fallback = 'application/octet-stream'
): string {
  const sniffed = sniffMenuFileMimeFromBytes(buffer);
  if (sniffed) {
    return sniffed;
  }

  const rawHeader = headerContentType?.split(';')[0]?.trim().toLowerCase() || '';
  if (rawHeader && !isGenericOrEmptyMime(rawHeader)) {
    const normalizedMenuMime = normalizeMenuMimeType(rawHeader);
    return normalizedMenuMime || rawHeader;
  }

  return inferMimeType(filePathOrUrl, fallback);
}

export function sanitizeStorageKey(rawKey: string): string | null {
  const normalized = rawKey.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('\0')) {
    return null;
  }
  const segments = normalized.split('/');
  if (segments.some((seg) => !seg || seg === '.' || seg === '..')) {
    return null;
  }
  return segments.join('/');
}

export function getS3StorageConfig(): S3StorageConfig | null {
  const endpoint = process.env.R2_ENDPOINT?.trim().replace(/\/+$/, '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = (process.env.R2_BUCKET || 'dishora-assets').trim();

  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    endpoint.includes('your-account-id.r2.cloudflarestorage.com')
  ) {
    return null;
  }

  const defaultRegion = endpoint.includes('.r2.cloudflarestorage.com') ? 'auto' : 'us-east-1';
  const region = (process.env.R2_REGION || process.env.S3_REGION || defaultRegion).trim();
  const publicBaseUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '') || null;

  return {
    endpoint,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
  };
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function encodeS3Path(rawPath: string): string {
  return rawPath
    .split('/')
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/g,
        (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
      )
    )
    .join('/');
}

function buildS3ObjectUrl(config: S3StorageConfig, storageKey: string): string {
  return `${config.endpoint}/${encodeS3Path(config.bucket)}/${encodeS3Path(storageKey)}`;
}

async function signedS3Fetch(
  config: S3StorageConfig,
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD',
  storageKey: string,
  options?: { body?: Buffer; contentType?: string }
): Promise<Response> {
  const objectUrl = buildS3ObjectUrl(config, storageKey);
  const url = new URL(objectUrl);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';

  const bodyBuffer = options?.body ?? Buffer.alloc(0);
  const payloadHash = sha256Hex(bodyBuffer);

  const headerEntries: Array<[string, string]> = [];
  if (options?.contentType) {
    headerEntries.push(['content-type', options.contentType]);
  }
  headerEntries.push(['host', url.host]);
  headerEntries.push(['x-amz-content-sha256', payloadHash]);
  headerEntries.push(['x-amz-date', amzDate]);
  headerEntries.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = headerEntries.map(([k, v]) => `${k}:${v}\n`).join('');
  const signedHeaders = headerEntries.map(([k]) => k).join(';');
  const canonicalRequest = [
    method,
    url.pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${config.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, config.region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const headers: Record<string, string> = {
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (options?.contentType) {
    headers['Content-Type'] = options.contentType;
  }

  return fetch(objectUrl, {
    method,
    headers,
    body: method === 'PUT' ? new Uint8Array(bodyBuffer) : undefined,
  });
}

export async function uploadAsset(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: 'menus' | 'illustrations' | 'photos' | 'qr' | 'banners' = 'illustrations'
): Promise<StorageUploadResult> {
  const cleanName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageKey = `${folder}/${cleanName}`;

  const s3Config = getS3StorageConfig();
  if (s3Config) {
    const res = await signedS3Fetch(s3Config, 'PUT', storageKey, {
      body: buffer,
      contentType: mimeType,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `Object storage upload failed (${res.status} ${res.statusText}): ${errText.slice(0, 300)}`
      );
    }

    const publicUrl = s3Config.publicBaseUrl
      ? `${s3Config.publicBaseUrl}/${storageKey}`
      : `/api/storage/${storageKey}`;

    return {
      storageKey,
      publicUrl,
      mime: mimeType,
      sizeBytes: buffer.length,
    };
  }

  // Local filesystem storage fallback (stores in public/uploads/)
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, cleanName);
  await fs.promises.writeFile(filePath, buffer);

  const publicUrl = `/uploads/${folder}/${cleanName}`;

  return {
    storageKey,
    publicUrl,
    mime: mimeType,
    sizeBytes: buffer.length,
  };
}

export async function getAssetBuffer(
  rawStorageKey: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const storageKey = sanitizeStorageKey(rawStorageKey);
  if (!storageKey) {
    return null;
  }

  const s3Config = getS3StorageConfig();
  if (s3Config) {
    const res = await signedS3Fetch(s3Config, 'GET', storageKey);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = resolveAssetContentType(
        buffer,
        res.headers.get('content-type'),
        storageKey
      );
      return {
        buffer,
        contentType,
      };
    }
    if (res.status !== 404) {
      const errText = await res.text().catch(() => '');
      console.error(`S3 download error (${res.status}) for ${storageKey}:`, errText.slice(0, 200));
    }
  }

  // Check local public/uploads/ fallback
  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const localPath = path.resolve(uploadsRoot, storageKey);
  if (!localPath.startsWith(uploadsRoot + path.sep) && localPath !== uploadsRoot) {
    return null;
  }
  if (fs.existsSync(localPath)) {
    const buffer = await fs.promises.readFile(localPath);
    return {
      buffer,
      contentType: resolveAssetContentType(buffer, null, localPath),
    };
  }

  return null;
}

export async function readAssetFromUrl(
  fileUrl: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return null;
  }

  const trimmed = fileUrl.trim();
  if (trimmed.startsWith('/api/storage/')) {
    const key = trimmed.slice('/api/storage/'.length);
    const asset = await getAssetBuffer(key);
    return asset ? { buffer: asset.buffer, mimeType: asset.contentType } : null;
  }

  if (trimmed.startsWith('/uploads/')) {
    const key = trimmed.slice('/uploads/'.length);
    const asset = await getAssetBuffer(key);
    return asset ? { buffer: asset.buffer, mimeType: asset.contentType } : null;
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    const s3Config = getS3StorageConfig();
    if (s3Config?.publicBaseUrl && trimmed.startsWith(`${s3Config.publicBaseUrl}/`)) {
      const key = trimmed.slice(s3Config.publicBaseUrl.length + 1);
      const asset = await getAssetBuffer(key);
      if (asset) {
        return { buffer: asset.buffer, mimeType: asset.contentType };
      }
    }

    const res = await fetch(trimmed);
    if (!res.ok) {
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = resolveAssetContentType(
      buffer,
      res.headers.get('content-type'),
      trimmed,
      'image/jpeg'
    );
    return {
      buffer,
      mimeType,
    };
  }

  const asset = await getAssetBuffer(trimmed);
  return asset ? { buffer: asset.buffer, mimeType: asset.contentType } : null;
}

export async function deleteAsset(rawStorageKey: string): Promise<boolean> {
  const storageKey = sanitizeStorageKey(rawStorageKey);
  if (!storageKey) {
    return false;
  }

  let deleted = false;
  const s3Config = getS3StorageConfig();
  if (s3Config) {
    const res = await signedS3Fetch(s3Config, 'DELETE', storageKey);
    if (res.ok || res.status === 204 || res.status === 404) {
      deleted = true;
    }
  }

  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const localPath = path.resolve(uploadsRoot, storageKey);
  if (localPath.startsWith(uploadsRoot + path.sep) && fs.existsSync(localPath)) {
    await fs.promises.unlink(localPath);
    deleted = true;
  }

  return deleted;
}
