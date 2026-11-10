import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { extractMenuFromImages } from '@/lib/gemini/vision-extractor';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

function resolveMimeType(file: File): string | null {
  const rawType = (file.type || '').toLowerCase();
  if (ALLOWED_MIME_TYPES.has(rawType)) {
    return rawType === 'image/jpg' ? 'image/jpeg' : rawType;
  }
  const lowerName = (file.name || '').toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.gif')) return 'image/gif';
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  return null;
}

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
    const files = allEntries.filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one JPG, PNG, WebP, or PDF menu file.' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Please upload at most 5 menu pages per demo extraction.' },
        { status: 400 }
      );
    }

    const currencyParam = String(formData.get('currency') || 'INR').toUpperCase();
    const currencyDefault = currencyParam === 'USD' ? 'USD' : 'INR';

    const images: Array<{ buffer: Buffer; mimeType: string }> = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB limit.` },
          { status: 400 }
        );
      }
      const mimeType = resolveMimeType(file);
      if (!mimeType) {
        return NextResponse.json(
          { error: `Unsupported file format for "${file.name}". Use JPG, PNG, WebP, or PDF.` },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      images.push({ buffer, mimeType });
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

