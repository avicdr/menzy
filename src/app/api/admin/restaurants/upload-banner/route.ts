import { NextResponse } from 'next/server';
import { AssetType, ModerationStatus } from '@prisma/client';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { uploadAsset } from '@/lib/storage/adapter';
import prisma from '@/lib/db/prisma';
import {
  MAX_BANNER_UPLOAD_BYTES,
  validateBannerFileMeta,
} from '@/lib/banner/banner-validation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const rawWidth = formData.get('width');
    const rawHeight = formData.get('height');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Banner image file is required.' }, { status: 400 });
    }

    const fileValidation = validateBannerFileMeta(file);
    if (!fileValidation.ok) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    const parsedWidth = rawWidth ? parseInt(String(rawWidth), 10) : NaN;
    const parsedHeight = rawHeight ? parseInt(String(rawHeight), 10) : NaN;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length <= 0 || buffer.length > MAX_BANNER_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Banner image size must be between 1 byte and 5 MB.' },
        { status: 400 }
      );
    }

    const uploadResult = await uploadAsset(
      buffer,
      file.name || 'demo-banner',
      fileValidation.mime,
      'banners'
    );

    const asset = await prisma.asset.create({
      data: {
        type: AssetType.OWNER_PHOTO,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        mime: fileValidation.mime,
        width: Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : null,
        height: Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : null,
        source: 'ADMIN_UPLOAD',
        moderationStatus: ModerationStatus.APPROVED,
        ownerOrganizationId: null,
      },
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Admin demo banner upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload banner image' },
      { status: 500 }
    );
  }
}

