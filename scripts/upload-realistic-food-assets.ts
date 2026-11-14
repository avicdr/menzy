import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REALISTIC_FOOD_ASSET_MANIFEST } from '../src/lib/canonical/data/realistic-food-assets';
import { uploadAssetAtStorageKey } from '../src/lib/storage/adapter';

const ASSET_DIR = path.join(process.cwd(), 'assets');

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required.');
  }

  for (let index = 0; index < REALISTIC_FOOD_ASSET_MANIFEST.length; index += 1) {
    const entry = REALISTIC_FOOD_ASSET_MANIFEST[index];
    const sourcePath = path.join(ASSET_DIR, entry.file);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing asset: ${sourcePath}`);
    const storageKey = `canonical/realistic/${slugify(entry.displayName)}-${entry.file}`;
    const result = await uploadAssetAtStorageKey(
      await fs.promises.readFile(sourcePath),
      storageKey,
      'image/webp'
    );
    console.log(`[${index + 1}/${REALISTIC_FOOD_ASSET_MANIFEST.length}] ${entry.displayName} -> ${result.publicUrl}`);
  }
}

main().catch((error) => {
  console.error('Realistic food asset upload failed:', error);
  process.exitCode = 1;
});
