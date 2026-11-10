import { NextResponse } from 'next/server';
import { getAssetBuffer, sanitizeStorageKey } from '@/lib/storage/adapter';
import { getOwnerSession } from '@/lib/auth/owner-auth';

const ALLOWED_FOLDERS = new Set(['banners', 'photos', 'illustrations', 'qr', 'menus']);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const rawKey = Array.isArray(key) ? key.join('/') : '';
    const storageKey = sanitizeStorageKey(rawKey);

    if (!storageKey) {
      return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 });
    }

    const folder = storageKey.split('/')[0];
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Forbidden asset folder' }, { status: 403 });
    }

    // Uploaded raw menus are private owner assets used server-side for extraction
    if (folder === 'menus') {
      const ownerSession = await getOwnerSession();
      if (!ownerSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const asset = await getAssetBuffer(storageKey);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const headers: Record<string, string> = {
      'Content-Type': asset.contentType,
      'Cache-Control':
        folder === 'menus'
          ? 'private, max-age=300'
          : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    };

    if (asset.contentType === 'image/svg+xml') {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
    }

    return new NextResponse(new Uint8Array(asset.buffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Storage serve error:', error);
    return NextResponse.json({ error: 'Failed to load asset' }, { status: 500 });
  }
}

