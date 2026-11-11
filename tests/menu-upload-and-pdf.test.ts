import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';

let mockAdminCookieValue: string | undefined;
let mockOwnerCookieValue: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'dishora_admin_session' && mockAdminCookieValue) {
        return { name, value: mockAdminCookieValue };
      }
      if (name === 'dishora_owner_session' && mockOwnerCookieValue) {
        return { name, value: mockOwnerCookieValue };
      }
      return undefined;
    },
    set: (name: string, value: string) => {
      if (name === 'dishora_owner_session') mockOwnerCookieValue = value;
      if (name === 'dishora_admin_session') mockAdminCookieValue = value;
    },
    delete: (name: string) => {
      if (name === 'dishora_owner_session') mockOwnerCookieValue = undefined;
      if (name === 'dishora_admin_session') mockAdminCookieValue = undefined;
    },
  }),
}));

import {
  MAX_MENU_PDF_BYTES,
  MAX_MENU_PHOTO_BYTES,
  ensureMenuFileExtension,
  resolveMenuMimeForExtraction,
  sniffMenuFileMimeFromBytes,
  validateAndNormalizeMenuFile,
} from '../src/lib/menu/menu-file-validator';
import { deleteAsset, readAssetFromUrl, uploadAsset } from '../src/lib/storage/adapter';
import { createOwnerToken } from '../src/lib/auth/owner-auth';
import { createAdminToken } from '../src/lib/auth/admin-auth';
import { clearGeminiKeyCooldowns, getOrderedGeminiClients } from '../src/lib/gemini/client';
import { extractMenuFromImages } from '../src/lib/gemini/vision-extractor';
import { getCache } from '../src/lib/cache/redis';
import { POST as signupPost } from '../src/app/api/auth/signup/route';
import { POST as menuUploadPost } from '../src/app/api/menus/upload/route';
import { POST as menuExtractPost } from '../src/app/api/menus/extract/route';
import { POST as adminExtractMenuPost } from '../src/app/api/admin/restaurants/extract-menu/route';

const PDF_SAMPLE_BYTES = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
const JPEG_SAMPLE_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG_SAMPLE_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP_SAMPLE_BYTES = Buffer.from('RIFF\x24\x00\x00\x00WEBPVP8 ', 'latin1');
const GIF_SAMPLE_BYTES = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00', 'latin1');
const HEIC_SAMPLE_BYTES = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp
  0x68, 0x65, 0x69, 0x63, // heic
  0x00, 0x00, 0x00, 0x00,
]);

describe('Menu Photos & PDF Upload / Extraction Pipeline', () => {
  const createdRestaurantIds: string[] = [];
  const createdRestaurantSlugs: string[] = [];
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdStorageKeys: string[] = [];
  const createdNullRestaurantEventAfter: Date[] = [];

  const originalEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
  };

  afterEach(async () => {
    vi.restoreAllMocks();
    clearGeminiKeyCooldowns();
    mockAdminCookieValue = undefined;
    mockOwnerCookieValue = undefined;

    for (const [key, val] of Object.entries(originalEnv)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }

    if (createdRestaurantSlugs.length > 0) {
      const cache = getCache();
      await Promise.all(
        createdRestaurantSlugs.splice(0, createdRestaurantSlugs.length).map((slug) =>
          cache.del(`menu:slug:${slug}`).catch(() => { })
        )
      );
    }

    if (createdRestaurantIds.length > 0) {
      const rIds = createdRestaurantIds.splice(0, createdRestaurantIds.length);
      const uploads = await prisma.menuUpload.findMany({
        where: { restaurantId: { in: rIds } },
        select: { fileKeys: true },
      });
      for (const up of uploads) {
        if (Array.isArray(up.fileKeys)) {
          for (const url of up.fileKeys as string[]) {
            if (url.startsWith('/uploads/')) {
              createdStorageKeys.push(url.slice('/uploads/'.length));
            } else if (url.startsWith('/api/storage/')) {
              createdStorageKeys.push(url.slice('/api/storage/'.length));
            }
          }
        }
      }

      await prisma.aIUsageEvent.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => { });
      await prisma.extractionJob.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => { });
      await prisma.menuUpload.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => { });
      await prisma.dishVariant.deleteMany({ where: { menuItem: { restaurantId: { in: rIds } } } }).catch(() => { });
      await prisma.restaurantMenuItem.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => { });
      await prisma.menuCategory.deleteMany({ where: { menu: { restaurantId: { in: rIds } } } }).catch(() => { });
      await prisma.menu.deleteMany({ where: { restaurantId: { in: rIds } } }).catch(() => { });
      await prisma.restaurant.deleteMany({ where: { id: { in: rIds } } }).catch(() => { });
    }

    if (createdOrgIds.length > 0) {
      await prisma.organization
        .deleteMany({ where: { id: { in: createdOrgIds.splice(0, createdOrgIds.length) } } })
        .catch(() => { });
    }

    if (createdUserIds.length > 0) {
      await prisma.user
        .deleteMany({ where: { id: { in: createdUserIds.splice(0, createdUserIds.length) } } })
        .catch(() => { });
    }

    if (createdStorageKeys.length > 0) {
      await Promise.all(
        createdStorageKeys.splice(0, createdStorageKeys.length).map((k) => deleteAsset(k).catch(() => false))
      );
    }

    if (createdNullRestaurantEventAfter.length > 0) {
      const earliest = createdNullRestaurantEventAfter.splice(0, createdNullRestaurantEventAfter.length)[0];
      await prisma.aIUsageEvent
        .deleteMany({
          where: {
            restaurantId: null,
            operationType: 'MENU_EXTRACTION',
            createdAt: { gte: earliest },
          },
        })
        .catch(() => { });
    }
  });

  async function seedOwnerRestaurant() {
    const suffix = crypto.randomBytes(4).toString('hex');
    const email = `menu-upload-${suffix}@menzy.test`;

    const res = await signupPost(
      new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-ipcountry': 'IN',
        },
        body: JSON.stringify({
          name: `Menu Upload Owner ${suffix}`,
          email,
          password: 'TestPassword123!',
          restaurantName: `Test Kitchen ${suffix}`,
          city: 'Lucknow',
        }),
      })
    );

    const data = await res.json();
    expect(res.status).toBe(200);

    const userId = data.user.id as string;
    const restaurantId = data.restaurant.id as string;
    const slug = data.restaurant.slug as string;
    createdUserIds.push(userId);
    createdRestaurantIds.push(restaurantId);
    createdRestaurantSlugs.push(slug);

    const dbRestaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (dbRestaurant?.organizationId) {
      createdOrgIds.push(dbRestaurant.organizationId);
    }

    mockOwnerCookieValue = createOwnerToken(userId, email);

    return {
      restaurant: dbRestaurant!,
      email,
      userId,
    };
  }

  it('sniffs magic bytes and validates menu photos and PDFs even with blank or ambiguous MIME headers', () => {
    expect(sniffMenuFileMimeFromBytes(PDF_SAMPLE_BYTES)).toBe('application/pdf');
    expect(sniffMenuFileMimeFromBytes(Buffer.from('\xEF\xBB\xBF   %PDF-1.4\n'))).toBe('application/pdf');
    expect(sniffMenuFileMimeFromBytes(JPEG_SAMPLE_BYTES)).toBe('image/jpeg');
    expect(sniffMenuFileMimeFromBytes(PNG_SAMPLE_BYTES)).toBe('image/png');
    expect(sniffMenuFileMimeFromBytes(WEBP_SAMPLE_BYTES)).toBe('image/webp');
    expect(sniffMenuFileMimeFromBytes(GIF_SAMPLE_BYTES)).toBe('image/gif');
    expect(sniffMenuFileMimeFromBytes(HEIC_SAMPLE_BYTES)).toBe('image/heic');

    const pdfNoExt = validateAndNormalizeMenuFile(PDF_SAMPLE_BYTES, 'restaurant-menu', '');
    expect(pdfNoExt).toMatchObject({
      ok: true,
      mimeType: 'application/pdf',
      kind: 'pdf',
      normalizedFileName: 'restaurant-menu.pdf',
    });

    const heicOctet = validateAndNormalizeMenuFile(HEIC_SAMPLE_BYTES, 'IMG_0012.HEIC', 'application/octet-stream');
    expect(heicOctet).toMatchObject({
      ok: true,
      mimeType: 'image/heic',
      kind: 'photo',
    });

    // Reject disguised HTML saved with .pdf extension
    const fakePdf = validateAndNormalizeMenuFile(
      Buffer.from('<html><body>Not a PDF</body></html>'),
      'menu.pdf',
      'application/pdf'
    );
    expect(fakePdf.ok).toBe(false);

    // Reject empty and unsupported formats
    expect(validateAndNormalizeMenuFile(Buffer.alloc(0), 'empty.jpg', 'image/jpeg').ok).toBe(false);
    expect(validateAndNormalizeMenuFile(Buffer.from('plain text menu'), 'menu.txt', 'text/plain').ok).toBe(false);
    expect(ensureMenuFileExtension('upload', 'application/pdf')).toBe('upload.pdf');
    expect(ensureMenuFileExtension('photo.jpeg', 'image/jpeg')).toBe('photo.jpeg');
    expect(resolveMenuMimeForExtraction(Buffer.from('img-bytes'), 'image/jpeg')).toBe('image/jpeg');
    expect(resolveMenuMimeForExtraction(PDF_SAMPLE_BYTES, 'application/octet-stream')).toBe('application/pdf');
    expect(MAX_MENU_PDF_BYTES).toBeGreaterThan(MAX_MENU_PHOTO_BYTES);
  });

  it('recovers exact MIME type from magic bytes in local storage when filename has no extension', async () => {
    delete process.env.R2_ENDPOINT;
    const uploaded = await uploadAsset(PDF_SAMPLE_BYTES, 'unnamed-menu', 'application/octet-stream', 'menus');
    createdStorageKeys.push(uploaded.storageKey);

    const loaded = await readAssetFromUrl(uploaded.publicUrl);
    expect(loaded).not.toBeNull();
    expect(loaded!.mimeType).toBe('application/pdf');
    expect(loaded!.buffer.equals(PDF_SAMPLE_BYTES)).toBe(true);
  });

  it('uploads and extracts a menu PDF even when browser omits MIME type and extension', async () => {
    delete process.env.R2_ENDPOINT;
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-pdf-upload-key';

    const { restaurant } = await seedOwnerRestaurant();

    const clients = getOrderedGeminiClients('text');
    let capturedParts: any[] = [];
    vi.spyOn(clients[0].client.models, 'generateContent').mockImplementation(async (req: any) => {
      capturedParts = req?.contents?.[0]?.parts || [];
      return {
        text: JSON.stringify({
          restaurantName: restaurant.displayName,
          detectedCurrency: 'INR',
          categories: [
            {
              name: 'PDF Specials',
              items: [
                {
                  sourceName: 'Truffle Mushroom Risotto',
                  price: 540,
                  description: 'Arborio rice slow-cooked with porcini mushrooms',
                  dietaryLabels: ['VEG'],
                  sourcePage: 1,
                },
                {
                  sourceName: 'Tiramisu Jar',
                  price: 320,
                  description: 'Espresso soaked savoiardi',
                  dietaryLabels: ['EGG'],
                  sourcePage: 2,
                },
              ],
            },
          ],
        }),
      } as any;
    });

    const uploadForm = new FormData();
    uploadForm.append('restaurantId', restaurant.id);
    uploadForm.append('files', new File([PDF_SAMPLE_BYTES], 'cafemenu', { type: '' }));

    const uploadRes = await menuUploadPost(
      new Request('http://localhost/api/menus/upload', {
        method: 'POST',
        body: uploadForm,
      })
    );
    expect(uploadRes.status).toBe(200);
    const uploadJson = await uploadRes.json();
    expect(uploadJson.success).toBe(true);
    expect(uploadJson.detectedTypes).toEqual(['application/pdf']);

    const extractRes = await menuExtractPost(
      new Request('http://localhost/api/menus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          uploadId: uploadJson.uploadId,
          jobId: uploadJson.jobId,
        }),
      })
    );
    expect(extractRes.status).toBe(200);
    const extractJson = await extractRes.json();
    expect(extractJson.success).toBe(true);
    expect(extractJson.extractedItemsCount).toBe(2);
    expect(capturedParts[0]?.inlineData?.mimeType).toBe('application/pdf');
  });

  it('supports uploading multiple menu photos across batched append requests and extracts both', async () => {
    delete process.env.R2_ENDPOINT;
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-photo-batch-key';

    const { restaurant } = await seedOwnerRestaurant();
    const clients = getOrderedGeminiClients('text');
    let capturedParts: any[] = [];
    vi.spyOn(clients[0].client.models, 'generateContent').mockImplementation(async (req: any) => {
      capturedParts = req?.contents?.[0]?.parts || [];
      return {
        text: JSON.stringify({
          detectedCurrency: 'INR',
          categories: [
            {
              name: 'Beverages',
              items: [{ sourceName: 'Flat White', price: 240, dietaryLabels: ['VEG'] }],
            },
          ],
        }),
      } as any;
    });

    const form1 = new FormData();
    form1.append('restaurantId', restaurant.id);
    form1.append('files', new File([JPEG_SAMPLE_BYTES], 'page-1.jpg', { type: 'image/jpeg' }));
    const res1 = await menuUploadPost(
      new Request('http://localhost/api/menus/upload', { method: 'POST', body: form1 })
    );
    const data1 = await res1.json();
    expect(res1.status).toBe(200);

    const form2 = new FormData();
    form2.append('restaurantId', restaurant.id);
    form2.append('uploadId', data1.uploadId);
    form2.append('files', new File([PNG_SAMPLE_BYTES], 'page-2.png', { type: 'image/png' }));
    const res2 = await menuUploadPost(
      new Request('http://localhost/api/menus/upload', { method: 'POST', body: form2 })
    );
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.uploadId).toBe(data1.uploadId);
    expect(data2.totalFileCount).toBe(2);

    const extractRes = await menuExtractPost(
      new Request('http://localhost/api/menus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          uploadId: data1.uploadId,
          jobId: data1.jobId,
        }),
      })
    );
    expect(extractRes.status).toBe(200);
    expect(capturedParts.map((p) => p.inlineData?.mimeType).filter(Boolean)).toEqual([
      'image/jpeg',
      'image/png',
    ]);
  });

  it('rejects unsupported menu files with 400 in both owner and admin upload endpoints', async () => {
    const { restaurant } = await seedOwnerRestaurant();
    const badForm = new FormData();
    badForm.append('restaurantId', restaurant.id);
    badForm.append('files', new File([Buffer.from('<html>bad</html>')], 'menu.pdf', { type: 'application/pdf' }));

    const ownerRes = await menuUploadPost(
      new Request('http://localhost/api/menus/upload', { method: 'POST', body: badForm })
    );
    expect(ownerRes.status).toBe(400);

    mockAdminCookieValue = createAdminToken('admin@menzy.test');
    const adminForm = new FormData();
    adminForm.append('files', new File([Buffer.from('not an image')], 'menu.txt', { type: 'text/plain' }));
    const adminRes = await adminExtractMenuPost(
      new Request('http://localhost/api/admin/restaurants/extract-menu', {
        method: 'POST',
        body: adminForm,
      })
    );
    expect(adminRes.status).toBe(400);
  });

  it('allows Founder Admin demo extraction from both HEIC photos and PDF menus', async () => {
    createdNullRestaurantEventAfter.push(new Date());
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-admin-heic-pdf-key';
    mockAdminCookieValue = createAdminToken('admin@menzy.test');

    const clients = getOrderedGeminiClients('text');
    let capturedParts: any[] = [];
    vi.spyOn(clients[0].client.models, 'generateContent').mockImplementation(async (req: any) => {
      capturedParts = req?.contents?.[0]?.parts || [];
      return {
        text: JSON.stringify({
          restaurantName: 'Founder Test Bistro',
          detectedCurrency: 'INR',
          categories: [
            {
              name: 'Mains',
              items: [{ sourceName: 'Paneer Lababdar', price: 380, dietaryLabels: ['VEG'] }],
            },
          ],
        }),
      } as any;
    });

    const formData = new FormData();
    formData.append('currency', 'INR');
    formData.append('files', new File([HEIC_SAMPLE_BYTES], 'menu-photo.heic', { type: '' }));
    formData.append('files', new File([PDF_SAMPLE_BYTES], 'menu.pdf', { type: 'application/x-pdf' }));

    const res = await adminExtractMenuPost(
      new Request('http://localhost/api/admin/restaurants/extract-menu', {
        method: 'POST',
        body: formData,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.items[0].name).toBe('Paneer Lababdar');
    expect(capturedParts.map((p) => p.inlineData?.mimeType).filter(Boolean)).toEqual([
      'image/heic',
      'application/pdf',
    ]);
  });

  it('uses Gemini Files API for large (>12 MB) PDFs and deletes the remote temporary file afterwards', async () => {
    createdNullRestaurantEventAfter.push(new Date());
    delete process.env.OPENAI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-large-pdf-key';

    const clients = getOrderedGeminiClients('text');
    const mockClient = clients[0].client as any;
    const uploadSpy = vi.fn(async () => ({
      name: 'files/mock-large-menu-pdf',
      uri: 'https://generativelanguage.googleapis.com/v1beta/files/mock-large-menu-pdf',
      mimeType: 'application/pdf',
      state: 'ACTIVE',
    }));
    const deleteSpy = vi.fn(async () => ({}));
    mockClient.files = { upload: uploadSpy, delete: deleteSpy };

    let capturedParts: any[] = [];
    vi.spyOn(mockClient.models, 'generateContent').mockImplementation(async (req: any) => {
      capturedParts = req?.contents?.[0]?.parts || [];
      return {
        text: JSON.stringify({
          detectedCurrency: 'USD',
          categories: [
            {
              name: 'Steaks',
              items: [{ sourceName: 'Ribeye Steak', price: 38.5, dietaryLabels: ['GLUTEN_FREE'] }],
            },
          ],
        }),
      } as any;
    });

    // Build a 13 MB PDF buffer
    const largePdf = Buffer.concat([PDF_SAMPLE_BYTES, Buffer.alloc(13 * 1024 * 1024, 0x20)]);
    const extracted = await extractMenuFromImages({
      images: [{ buffer: largePdf, mimeType: 'application/pdf' }],
      currencyDefault: 'USD',
    });

    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(capturedParts[0]?.fileData?.fileUri).toBe(
      'https://generativelanguage.googleapis.com/v1beta/files/mock-large-menu-pdf'
    );
    expect(deleteSpy).toHaveBeenCalledWith({ name: 'files/mock-large-menu-pdf' });
    expect(extracted.items[0].priceMinor).toBe(3850);
  });
});
