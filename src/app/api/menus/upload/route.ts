import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { uploadAsset } from '@/lib/storage/adapter';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const restaurantId = formData.get('restaurantId') as string;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const files = formData.getAll('files') as File[];
    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedKeys: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const res = await uploadAsset(buffer, file.name, file.type, 'menus');
      uploadedKeys.push(res.publicUrl);
    }

    const menuUpload = await prisma.menuUpload.create({
      data: {
        restaurantId,
        fileKeys: uploadedKeys,
        status: 'PENDING',
      },
    });

    const extractionJob = await prisma.extractionJob.create({
      data: {
        uploadId: menuUpload.id,
        restaurantId,
        status: 'QUEUED',
      },
    });

    return NextResponse.json({
      success: true,
      uploadId: menuUpload.id,
      jobId: extractionJob.id,
      fileCount: files.length,
    });
  } catch (error: any) {
    console.error('Menu upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

