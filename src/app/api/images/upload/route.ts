import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { uploadAsset } from '@/lib/storage/adapter';
import { getCache } from '@/lib/cache/redis';
import prisma from '@/lib/db/prisma';
import { AssetType, ModerationStatus } from '@prisma/client';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const restaurantId = formData.get('restaurantId') as string;
    const menuItemId = formData.get('menuItemId') as string | null;
    const rawFolder = (formData.get('folder') as string | null) || 'photos';
    const rawWidth = formData.get('width');
    const rawHeight = formData.get('height');
    const file = formData.get('file') as File;

    if (!restaurantId || !file) {
      return NextResponse.json({ error: 'restaurantId and file are required' }, { status: 400 });
    }

    const normalizedMime = (file.type || '').toLowerCase() === 'image/jpg' ? 'image/jpeg' : (file.type || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(normalizedMime)) {
      return NextResponse.json(
        { error: 'Unsupported image format. Please upload a JPG, PNG, or WebP file.' },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Uploaded image file is empty.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Image size must be 5 MB or smaller.' },
        { status: 400 }
      );
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const folder = rawFolder === 'banners' ? 'banners' : 'photos';
    const parsedWidth = rawWidth ? parseInt(String(rawWidth), 10) : NaN;
    const parsedHeight = rawHeight ? parseInt(String(rawHeight), 10) : NaN;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await uploadAsset(buffer, file.name, normalizedMime, folder);

    const asset = await prisma.asset.create({
      data: {
        type: AssetType.OWNER_PHOTO,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        mime: normalizedMime,
        width: Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : null,
        height: Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : null,
        source: 'OWNER_UPLOAD',
        moderationStatus: ModerationStatus.APPROVED,
        ownerOrganizationId: auth.restaurant.organizationId,
      },
    });

    if (menuItemId) {
      await prisma.restaurantMenuItem.update({
        where: { id: menuItemId, restaurantId },
        data: { imageOverrideAssetId: asset.id },
      });
      const cache = getCache();
      await cache.del(`menu:slug:${auth.restaurant.slug}`);
    }

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

