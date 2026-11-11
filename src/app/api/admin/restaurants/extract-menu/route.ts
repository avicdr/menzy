import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { extractMenuFromImages } from '@/lib/gemini/vision-extractor';
import {
  MAX_MENU_FILES_PER_UPLOAD,
  validateAndNormalizeMenuFile,
} from '@/lib/menu/menu-file-validator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const rawFiles = formData.getAll('files');
    const singleFile = formData.get('file');
    const allEntries = [...rawFiles, ...(singleFile ? [singleFile] : [])];
    const files = allEntries.filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one menu photo (JPG, PNG, WebP, HEIC) or PDF file.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_MENU_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Please upload at most ${MAX_MENU_FILES_PER_UPLOAD} menu photos or PDF files per extraction.` },
        { status: 400 }
      );
    }

    const currencyParam = String(formData.get('currency') || 'INR').toUpperCase();
    const currencyDefault = currencyParam === 'USD' ? 'USD' : 'INR';

    const images: Array<{ buffer: Buffer; mimeType: string }> = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const validation = validateAndNormalizeMenuFile(buffer, file.name, file.type);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      images.push({ buffer, mimeType: validation.mimeType });
    }

    const extracted = await extractMenuFromImages({
      images,
      restaurantId: null,
      currencyDefault,
    });

    return NextResponse.json({
      success: true,
      restaurantName: extracted.restaurantName || null,
      detectedCurrency: extracted.detectedCurrency,
      categories: extracted.categories,
      items: extracted.items.map((item) => ({
        name: item.sourceName,
        category: item.category || 'Chef Specials',
        description: item.description || '',
        priceMinor: item.priceMinor ?? (currencyDefault === 'USD' ? 1200 : 25000),
        dietaryLabels: item.dietaryLabels || [],
        isPopular: Boolean(item.isPopular),
        chefRecommended: Boolean(item.chefRecommended),
      })),
    });
  } catch (error: any) {
    console.error('Admin demo extract-menu error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to extract menu dishes. Please fill dishes manually.' },
      { status: 422 }
    );
  }
}
