import {
  ensureMenuFileExtension,
  inferMenuMimeFromFilename,
  normalizeMenuMimeType,
  sniffMenuFileMimeFromBytes,
  type SupportedMenuPhotoMime,
} from '@/lib/menu/menu-file-validator';
import { readApiErrorMessage } from '@/lib/menu/client-menu-upload';

export const DISH_PHOTO_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif';

const MAX_RAW_DISH_PHOTO_BYTES = 15 * 1024 * 1024; // 15 MB raw pick before resize/compression
const MAX_DISH_PHOTO_DIMENSION_PX = 1400;
const PHOTO_OPTIMIZE_THRESHOLD_BYTES = 1.4 * 1024 * 1024;
const TARGET_DISH_UPLOAD_BYTES = 3.5 * 1024 * 1024;

export interface PreparedDishPhoto {
  file: File;
  width: number | null;
  height: number | null;
}

const DIRECT_UPLOAD_PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function decodeDishPhoto(file: File): Promise<{
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
      el.onerror = () => reject(new Error('Could not decode dish photo'));
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

function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: 'image/jpeg' | 'image/webp' | 'image/png',
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

export async function prepareDishPhotoFile(rawFile: File): Promise<PreparedDishPhoto> {
  if (!rawFile || rawFile.size <= 0) {
    throw new Error('Selected photo is empty (0 bytes). Please choose a valid image file.');
  }

  if (rawFile.size > MAX_RAW_DISH_PHOTO_BYTES) {
    throw new Error('Selected photo is larger than 15 MB. Please choose a smaller image.');
  }

  const headerSlice = await rawFile.slice(0, 1024).arrayBuffer();
  const sniffedMime = sniffMenuFileMimeFromBytes(new Uint8Array(headerSlice));
  const declaredMime = normalizeMenuMimeType(rawFile.type);
  const extMime = inferMenuMimeFromFilename(rawFile.name);
  const resolvedMime = sniffedMime || declaredMime || extMime;

  if (!resolvedMime || resolvedMime === 'application/pdf') {
    throw new Error(
      resolvedMime === 'application/pdf'
        ? 'Please upload an image photo (JPG, PNG, or WebP) for this dish, not a PDF.'
        : 'Unsupported image format. Please upload a JPG, PNG, WebP, or HEIC photo.'
    );
  }

  const verifiedMime: SupportedMenuPhotoMime = resolvedMime;
  const normalizedName = ensureMenuFileExtension(rawFile.name, verifiedMime, 'dish-photo');
  const isDirectMime = DIRECT_UPLOAD_PHOTO_MIMES.has(verifiedMime);
  const isHeic = verifiedMime === 'image/heic' || verifiedMime === 'image/heif';

  if (typeof document === 'undefined') {
    if (!isDirectMime) {
      throw new Error('Please upload a JPG, PNG, or WebP image.');
    }
    return { file: rawFile, width: null, height: null };
  }

  let decoded: Awaited<ReturnType<typeof decodeDishPhoto>> | null = null;
  try {
    decoded = await decodeDishPhoto(rawFile);
  } catch {
    if (isHeic) {
      throw new Error(
        'This browser cannot convert HEIC photos directly. Please export or select a JPG, PNG, or WebP image.'
      );
    }
    if (!isDirectMime || rawFile.size > 4.5 * 1024 * 1024) {
      throw new Error('Could not process this image file. Please try another JPG, PNG, or WebP photo.');
    }
    return { file: rawFile, width: null, height: null };
  }

  try {
    const { width, height } = decoded;
    if (!width || !height) {
      if (!isDirectMime) {
        throw new Error('Could not read dimensions of this photo. Please try a JPG or PNG.');
      }
      return { file: rawFile, width: null, height: null };
    }

    const longestSide = Math.max(width, height);
    const scale =
      longestSide > MAX_DISH_PHOTO_DIMENSION_PX ? MAX_DISH_PHOTO_DIMENSION_PX / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const needsOptimization =
      !isDirectMime ||
      scale < 1 ||
      rawFile.size > PHOTO_OPTIMIZE_THRESHOLD_BYTES;

    if (!needsOptimization) {
      const normalizedFile =
        rawFile.name !== normalizedName || rawFile.type !== verifiedMime
          ? new File([rawFile], normalizedName, {
              type: verifiedMime,
              lastModified: rawFile.lastModified,
            })
          : rawFile;
      return {
        file: normalizedFile,
        width,
        height,
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (!isDirectMime) {
        throw new Error('Your browser canvas is unavailable to convert this image.');
      }
      return { file: rawFile, width, height };
    }

    const preserveTransparency = verifiedMime === 'image/png' || verifiedMime === 'image/webp';
    if (!preserveTransparency) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    decoded.draw(ctx, targetWidth, targetHeight);

    // Prefer WebP when preserving transparency, otherwise JPEG at progressive quality steps
    let outputBlob: Blob | null = null;
    let outputMime: 'image/webp' | 'image/jpeg' = 'image/jpeg';

    if (preserveTransparency) {
      const webpBlob = await encodeCanvas(canvas, 'image/webp', 0.88);
      if (webpBlob && webpBlob.type === 'image/webp' && webpBlob.size <= TARGET_DISH_UPLOAD_BYTES) {
        outputBlob = webpBlob;
        outputMime = 'image/webp';
      }
    }

    if (!outputBlob) {
      // Composite white backdrop cleanly before JPEG output
      if (preserveTransparency) {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.globalCompositeOperation = 'source-over';
      }
      for (const quality of [0.88, 0.78, 0.68]) {
        const candidate = await encodeCanvas(canvas, 'image/jpeg', quality);
        if (candidate) {
          outputBlob = candidate;
          outputMime = 'image/jpeg';
          if (candidate.size <= TARGET_DISH_UPLOAD_BYTES) {
            break;
          }
        }
      }
    }

    if (!outputBlob || outputBlob.size === 0) {
      if (!isDirectMime) {
        throw new Error('Failed to encode photo for upload. Please try a smaller JPG or PNG.');
      }
      return { file: rawFile, width, height };
    }

    // Keep original if already direct MIME, unresized, and strictly smaller than re-encoded blob
    if (
      isDirectMime &&
      scale === 1 &&
      rawFile.size <= TARGET_DISH_UPLOAD_BYTES &&
      rawFile.size <= outputBlob.size
    ) {
      return { file: rawFile, width, height };
    }

    if (outputBlob.size > 4.5 * 1024 * 1024) {
      throw new Error('Even after optimization, this photo exceeds 4.5 MB. Please crop or resize it slightly.');
    }

    const finalName = ensureMenuFileExtension(normalizedName, outputMime, 'dish-photo');
    return {
      file: new File([outputBlob], finalName, {
        type: outputMime,
        lastModified: rawFile.lastModified,
      }),
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    decoded.cleanup();
  }
}

export async function uploadDishPhotoFile(params: {
  restaurantId: string;
  menuItemId?: string;
  file: File;
}): Promise<
  | { expired: true; payload: any }
  | { expired: false; asset: any; item?: any }
> {
  const { restaurantId, menuItemId, file } = params;
  const prepared = await prepareDishPhotoFile(file);

  const formData = new FormData();
  formData.append('restaurantId', restaurantId);
  if (menuItemId) {
    formData.append('menuItemId', menuItemId);
  }
  formData.append('folder', 'photos');
  formData.append('file', prepared.file);
  if (prepared.width) {
    formData.append('width', String(prepared.width));
  }
  if (prepared.height) {
    formData.append('height', String(prepared.height));
  }

  const res = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  });

  if (res.status === 402) {
    const payload = await res.json().catch(() => ({}));
    return { expired: true, payload };
  }

  if (!res.ok) {
    const msg = await readApiErrorMessage(res, 'Failed to upload dish photo. Please try again.');
    throw new Error(msg);
  }

  const data = await res.json();
  return {
    expired: false,
    asset: data.asset,
    item: data.item,
  };
}

export async function revertDishImageOverride(params: {
  restaurantId: string;
  itemId: string;
}): Promise<
  | { expired: true; payload: any }
  | { expired: false; item: any }
> {
  const { restaurantId, itemId } = params;
  const res = await fetch('/api/menus/items', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId,
      restaurantId,
      imageOverrideAssetId: null,
    }),
  });

  if (res.status === 402) {
    const payload = await res.json().catch(() => ({}));
    return { expired: true, payload };
  }

  if (!res.ok) {
    const msg = await readApiErrorMessage(res, 'Failed to remove custom image.');
    throw new Error(msg);
  }

  const data = await res.json();
  return {
    expired: false,
    item: data.item,
  };
}

