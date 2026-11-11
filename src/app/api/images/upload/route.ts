import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { uploadAsset } from '@/lib/storage/adapter';
import { getCache } from '@/lib/cache/redis';
import prisma from '@/lib/db/prisma';
import { AssetType, ModerationStatus } from '@prisma/client';
import {
  isGenericOrEmptyMime,
  sniffMenuFileMimeFromBytes,
} from '@/lib/menu/menu-file-validator';

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
    const restaurantId = String(formData.get('restaurantId') || '').trim();
    const rawMenuItemId = formData.get('menuItemId');
    const menuItemId =
      typeof rawMenuItemId === 'string' && rawMenuItemId.trim() ? rawMenuItemId.trim() : null;
    const rawFolder = (formData.get('folder') as string | null) || 'photos';
    const rawWidth = formData.get('width');
    const rawHeight = formData.get('height');
    const file = formData.get('file') as File | null;

    if (!restaurantId || !file) {
      return NextResponse.json({ error: 'restaurantId and file are required' }, { status: 400 });
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

    const declaredMime =
      (file.type || '').toLowerCase() === 'image/jpg'
        ? 'image/jpeg'
        : (file.type || '').toLowerCase().split(';')[0].trim();

    if (!isGenericOrEmptyMime(declaredMime) && !ALLOWED_IMAGE_MIME_TYPES.has(declaredMime)) {
      return NextResponse.json(
        { error: 'Unsupported image format. Please upload a JPG, PNG, or WebP file.' },
        { status: 400 }
      );
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      includeSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const targetRestaurantId = auth.restaurant.id;

    // Verify item ownership before writing image bytes to storage or creating an Asset row
    if (menuItemId) {
      const existingItem = await prisma.restaurantMenuItem.findFirst({
        where: { id: menuItemId, restaurantId: targetRestaurantId },
        select: { id: true },
      });
      if (!existingItem) {
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sniffedMime = sniffMenuFileMimeFromBytes(buffer);

    if (sniffedMime && !ALLOWED_IMAGE_MIME_TYPES.has(sniffedMime)) {
      return NextResponse.json(
        { error: 'Unsupported image format. Please upload a JPG, PNG, or WebP file.' },
        { status: 400 }
      );
    }

    const normalizedMime =
      sniffedMime && ALLOWED_IMAGE_MIME_TYPES.has(sniffedMime)
        ? sniffedMime
        : ALLOWED_IMAGE_MIME_TYPES.has(declaredMime)
        ? declaredMime
        : null;

    if (!normalizedMime) {
      return NextResponse.json(
        { error: 'Unsupported image format. Please upload a JPG, PNG, or WebP file.' },
        { status: 400 }
      );
    }

    const folder = rawFolder === 'banners' ? 'banners' : 'photos';
    const parsedWidth = rawWidth ? parseInt(String(rawWidth), 10) : NaN;
    const parsedHeight = rawHeight ? parseInt(String(rawHeight), 10) : NaN;

    const uploadResult = await uploadAsset(buffer, file.name || 'dish-photo.jpg', normalizedMime, folder);

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

    let updatedItem: any = null;
    if (menuItemId) {
      updatedItem = await prisma.restaurantMenuItem.update({
        where: { id: menuItemId, restaurantId: targetRestaurantId },
        data: { imageOverrideAssetId: asset.id },
        include: {
          category: true,
          canonical: {
            include: { imageAsset: true },
          },
          imageOverride: true,
          variants: true,
        },
      });
      const cache = getCache();
      await cache.del(`menu:slug:${auth.restaurant.slug}`);
    }

    return NextResponse.json(
      {
        success: true,
        asset,
        ...(updatedItem ? { item: updatedItem } : {}),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

