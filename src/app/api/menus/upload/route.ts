import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { uploadAsset } from '@/lib/storage/adapter';
import prisma from '@/lib/db/prisma';
import {
  MAX_MENU_FILES_PER_UPLOAD,
  validateAndNormalizeMenuFile,
} from '@/lib/menu/menu-file-validator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const restaurantId = String(formData.get('restaurantId') || '').trim();
    const appendUploadId = String(formData.get('uploadId') || '').trim() || null;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId, {
      includeSettings: false,
      includeTheme: false,
    });
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const rawFiles = formData.getAll('files');
    const singleFile = formData.get('file');
    const allEntries = [...rawFiles, ...(singleFile ? [singleFile] : [])];
    const files = allEntries.filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one menu photo (JPG, PNG, WebP, HEIC) or PDF file.' },
        { status: 400 }
      );
    }

    let existingUpload: { id: string; restaurantId: string; status: string; fileKeys: unknown } | null = null;
    if (appendUploadId) {
      existingUpload = await prisma.menuUpload.findUnique({
        where: { id: appendUploadId },
        select: { id: true, restaurantId: true, status: true, fileKeys: true },
      });

      if (!existingUpload || existingUpload.restaurantId !== restaurantId) {
        return NextResponse.json({ error: 'Menu upload session not found.' }, { status: 404 });
      }
      if (existingUpload.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Menu upload session is no longer accepting additional files.' },
          { status: 400 }
        );
      }
    }

    const existingKeys = Array.isArray(existingUpload?.fileKeys)
      ? (existingUpload!.fileKeys as string[])
      : [];
    if (existingKeys.length + files.length > MAX_MENU_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Please upload at most ${MAX_MENU_FILES_PER_UPLOAD} menu photos or PDF files per batch.` },
        { status: 400 }
      );
    }

    const validatedFiles: Array<{
      buffer: Buffer;
      mimeType: string;
      normalizedFileName: string;
      kind: 'pdf' | 'photo';
    }> = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const validation = validateAndNormalizeMenuFile(buffer, file.name, file.type);

      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      validatedFiles.push({
        buffer,
        mimeType: validation.mimeType,
        normalizedFileName: validation.normalizedFileName,
        kind: validation.kind,
      });
    }

    const uploadResults = await Promise.all(
      validatedFiles.map((item) =>
        uploadAsset(item.buffer, item.normalizedFileName, item.mimeType, 'menus')
      )
    );
    const uploadedKeys = uploadResults.map((res) => res.publicUrl);

    if (existingUpload) {
      const combinedKeys = [...existingKeys, ...uploadedKeys];
      await prisma.menuUpload.update({
        where: { id: existingUpload.id },
        data: { fileKeys: combinedKeys },
      });
      const existingJob = await prisma.extractionJob.findFirst({
        where: { uploadId: existingUpload.id, restaurantId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      return NextResponse.json({
        success: true,
        uploadId: existingUpload.id,
        jobId: existingJob?.id ?? null,
        fileCount: uploadedKeys.length,
        totalFileCount: combinedKeys.length,
        detectedTypes: validatedFiles.map((f) => f.mimeType),
      });
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
      fileCount: uploadedKeys.length,
      totalFileCount: uploadedKeys.length,
      detectedTypes: validatedFiles.map((f) => f.mimeType),
    });
  } catch (error: any) {
    console.error('Menu upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
