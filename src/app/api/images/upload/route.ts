import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { uploadAsset } from '@/lib/storage/adapter';
import prisma from '@/lib/db/prisma';
import { AssetType, ModerationStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const restaurantId = formData.get('restaurantId') as string;
    const menuItemId = formData.get('menuItemId') as string | null;
    const file = formData.get('file') as File;

    if (!restaurantId || !file) {
      return NextResponse.json({ error: 'restaurantId and file are required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized || !auth.restaurant?.organizationId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await uploadAsset(buffer, file.name, file.type, 'photos');

    const asset = await prisma.asset.create({
      data: {
        type: AssetType.OWNER_PHOTO,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        mime: file.type,
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
    }

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
