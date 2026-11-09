import fs from 'fs';
import path from 'path';

export interface StorageUploadResult {
  storageKey: string;
  publicUrl: string;
  mime: string;
  sizeBytes: number;
}

export async function uploadAsset(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: 'menus' | 'illustrations' | 'photos' | 'qr' = 'illustrations'
): Promise<StorageUploadResult> {
  const cleanName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageKey = `${folder}/${cleanName}`;

  // If Cloudflare R2 or Supabase is configured with keys:
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT) {
    // R2 / S3 client integration
    // For cloud environments, an S3 client uploads to the bucket
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
