import {
  ensureMenuFileExtension,
  inferMenuMimeFromFilename,
  MAX_MENU_FILES_PER_UPLOAD,
  MAX_MENU_PDF_BYTES,
  MAX_MENU_PHOTO_BYTES,
  normalizeMenuMimeType,
  sniffMenuFileMimeFromBytes,
  type SupportedMenuMime,
} from './menu-file-validator';

const MAX_PHOTO_DIMENSION_PX = 2400;
const PHOTO_REENCODE_THRESHOLD_BYTES = 1.2 * 1024 * 1024;
const TARGET_UPLOAD_BATCH_BYTES = 3.6 * 1024 * 1024;

export interface PreparedMenuUploadResult {
  files: File[];
  pdfCount: number;
  photoCount: number;
  summaryLabel: string;
}

async function decodeImageElement(file: File): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Browser could not decode image'));
      el.src = objectUrl;
    });
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

async function optimizePhotoFileIfNeeded(
  file: File,
  verifiedMime: SupportedMenuMime
): Promise<File> {
  if (typeof document === 'undefined' || verifiedMime === 'application/pdf') {
    return file;
  }

  const normalizedName = ensureMenuFileExtension(file.name, verifiedMime, 'menu-photo');
  const isHeic = verifiedMime === 'image/heic' || verifiedMime === 'image/heif';
  const isGif = verifiedMime === 'image/gif';
  const needsOptimization =
    isGif || isHeic || file.size > PHOTO_REENCODE_THRESHOLD_BYTES;

  if (!needsOptimization) {
    if (file.name !== normalizedName || file.type !== verifiedMime) {
      return new File([file], normalizedName, {
        type: verifiedMime,
        lastModified: file.lastModified,
      });
    }
    return file;
  }

  let decoded: Awaited<ReturnType<typeof decodeImageElement>> | null = null;
  try {
    decoded = await decodeImageElement(file);
    const { width, height } = decoded;
    if (!width || !height) {
      return file;
    }

    const longestSide = Math.max(width, height);
    const scale =
      longestSide > MAX_PHOTO_DIMENSION_PX ? MAX_PHOTO_DIMENSION_PX / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    // Paint white backdrop first so transparent PNG/GIF menu graphics never render black-on-black
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    decoded.draw(ctx, targetWidth, targetHeight);

    const jpgBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.88);
    });

    if (!jpgBlob || jpgBlob.size === 0) {
      return file;
    }

    // Keep converted JPG when converting GIF/HEIC, downsizing, or shrinking file size
    if (isGif || isHeic || scale < 1 || jpgBlob.size < file.size) {
      const jpgName = ensureMenuFileExtension(normalizedName, 'image/jpeg', 'menu-photo');
      return new File([jpgBlob], jpgName, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
    }

    return file;
  } catch {
    // Non-fatal (e.g., HEIC in Chrome/Windows): fall back to raw file and let server Gemini handle it
    return file.name !== normalizedName || file.type !== verifiedMime
      ? new File([file], normalizedName, {
          type: verifiedMime,
          lastModified: file.lastModified,
        })
      : file;
  } finally {
    decoded?.cleanup();
  }
}

export async function validateAndPrepareMenuFiles(
  rawFiles: FileList | File[],
  maxFiles = MAX_MENU_FILES_PER_UPLOAD
): Promise<PreparedMenuUploadResult> {
  const inputList = Array.from(rawFiles || []);
  if (inputList.length === 0) {
    throw new Error('Please choose at least one menu photo (JPG, PNG, WebP, HEIC) or PDF file.');
  }

  if (inputList.length > maxFiles) {
    throw new Error(`Please upload at most ${maxFiles} menu files at a time.`);
  }

  const prepared: File[] = [];
  let pdfCount = 0;
  let photoCount = 0;

  for (const file of inputList) {
    if (!file || file.size <= 0) {
      throw new Error(
        `The file "${file?.name || 'menu file'}" is empty (0 bytes). Please choose a valid photo or PDF.`
      );
    }

    // Read only first 1 KB header slice to verify magic bytes cleanly on desktop & mobile
    const headerBuffer = await file.slice(0, 1024).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    const sniffedMime = sniffMenuFileMimeFromBytes(headerBytes);
    const declaredMime = normalizeMenuMimeType(file.type);
    const extMime = inferMenuMimeFromFilename(file.name);

    const verifiedMime = sniffedMime || declaredMime || extMime;
    if (!verifiedMime) {
      throw new Error(
        `Unsupported format for "${file.name}". Please upload menu photos (JPG, PNG, WebP, GIF, HEIC) or a PDF.`
      );
    }

    if (!sniffedMime && (declaredMime === 'application/pdf' || extMime === 'application/pdf')) {
      throw new Error(
        `"${file.name}" does not appear to be a valid PDF document. Please select an uncorrupted menu PDF or clear menu photos.`
      );
    }

    const isPdf = verifiedMime === 'application/pdf';
    const maxBytes = isPdf ? MAX_MENU_PDF_BYTES : MAX_MENU_PHOTO_BYTES;
    const maxMbLabel = isPdf ? '20 MB' : '15 MB';
    if (file.size > maxBytes) {
      throw new Error(
        `"${file.name}" exceeds the ${maxMbLabel} limit for menu ${isPdf ? 'PDFs' : 'photos'}.`
      );
    }

    if (isPdf) {
      pdfCount++;
      const normalizedPdfName = ensureMenuFileExtension(file.name, 'application/pdf', 'menu');
      const readyPdf =
        file.name !== normalizedPdfName || file.type !== 'application/pdf'
          ? new File([file], normalizedPdfName, {
              type: 'application/pdf',
              lastModified: file.lastModified,
            })
          : file;
      prepared.push(readyPdf);
    } else {
      photoCount++;
      const optimized = await optimizePhotoFileIfNeeded(file, verifiedMime);
      prepared.push(optimized);
    }
  }

  const parts: string[] = [];
  if (photoCount > 0) {
    parts.push(`${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`);
  }
  if (pdfCount > 0) {
    parts.push(`${pdfCount} ${pdfCount === 1 ? 'PDF' : 'PDFs'}`);
  }

  return {
    files: prepared,
    pdfCount,
    photoCount,
    summaryLabel: parts.join(' & ') || `${prepared.length} files`,
  };
}

export async function readApiErrorMessage(res: Response, fallbackMsg: string): Promise<string> {
  if (res.status === 413) {
    return 'Menu file transfer exceeded the server limit (HTTP 413). Try a smaller PDF (under 4 MB) or upload clear photos of individual menu pages.';
  }

  const data = await res.json().catch(() => null);
  if (data && typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  const rawText = await res.text().catch(() => '');
  if (rawText && !rawText.trim().startsWith('<')) {
    return rawText.trim().slice(0, 220);
  }

  return fallbackMsg;
}

export async function uploadMenuFilesInBatches(params: {
  restaurantId: string;
  files: File[];
  onProgress?: (msg: string) => void;
}): Promise<
  | { expired: true; payload: any }
  | { expired: false; uploadId: string; jobId: string | null }
> {
  const { restaurantId, files, onProgress } = params;

  // Split large multi-file uploads into ~3.6 MB batches to stay within hosting body limits
  const batches: File[][] = [];
  let currentBatch: File[] = [];
  let currentBytes = 0;

  for (const file of files) {
    if (
      currentBatch.length > 0 &&
      currentBytes + file.size > TARGET_UPLOAD_BATCH_BYTES
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBytes = 0;
    }
    currentBatch.push(file);
    currentBytes += file.size;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  let uploadId = '';
  let jobId: string | null = null;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (batches.length > 1) {
      onProgress?.(`Uploading menu batch ${i + 1} of ${batches.length}...`);
    }

    const formData = new FormData();
    formData.append('restaurantId', restaurantId);
    if (uploadId) {
      formData.append('uploadId', uploadId);
    }
    for (const file of batch) {
      formData.append('files', file);
    }

    const uploadRes = await fetch('/api/menus/upload', {
      method: 'POST',
      body: formData,
    });

    if (uploadRes.status === 402) {
      const payload = await uploadRes.json().catch(() => ({}));
      return { expired: true, payload };
    }

    if (!uploadRes.ok) {
      const msg = await readApiErrorMessage(uploadRes, 'Upload failed. Please try again later.');
      throw new Error(msg);
    }

    const data = await uploadRes.json();
    uploadId = data.uploadId || uploadId;
    jobId = data.jobId ?? jobId;
  }

  return { expired: false, uploadId, jobId };
}

