'use client';

import React, { useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { MENU_PDF_ACCEPT, MENU_PHOTO_ACCEPT } from '@/lib/menu/menu-file-validator';
import { readApiErrorMessage, validateAndPrepareMenuFiles } from '@/lib/menu/client-menu-upload';
import {
  areDishesLikelyDuplicate,
  deduplicateDishCollection,
  isGenericCategory,
  resolvePrimaryDietaryBucket,
} from '@/lib/menu/deduplicate';
import { validateBannerFileMeta, validateBannerUrlInput } from '@/lib/banner/banner-validation';

interface DemoDishDraft {
  localId: string;
  name: string;
  category: string;
  price: string;
  foodType: 'VEG' | 'NON_VEG' | 'EGG';
  description: string;
}

function buildDefaultDemoDishes(country: string): DemoDishDraft[] {
  if (country === 'US') {
    return [
      {
        localId: 'default_us_1',
        name: 'Flat White',
        category: 'Coffee & Espresso',
        price: '5.50',
        foodType: 'VEG',
        description: 'Double ristretto pulled over velvety steamed micro-foam.',
      },
      {
        localId: 'default_us_2',
        name: 'Avocado Toast',
        category: 'All Day Brunch',
        price: '15.00',
        foodType: 'VEG',
        description: 'Country sourdough with smashed avocado, citrus zest, and chili flakes.',
      },
      {
        localId: 'default_us_3',
        name: 'Tiramisu Tartlet',
        category: 'Patisserie',
        price: '11.00',
        foodType: 'EGG',
        description: 'Espresso-soaked sponge layered with whipped mascarpone and cocoa.',
      },
    ];
  }
  return [
    {
      localId: 'default_in_1',
      name: 'Paneer Tikka',
      category: 'Small Plates',
      price: '320',
      foodType: 'VEG',
      description: 'Charcoal-grilled cottage cheese marinated in yogurt and warm house spices.',
    },
    {
      localId: 'default_in_2',
      name: 'Masala Chai',
      category: 'Beverages',
      price: '120',
      foodType: 'VEG',
      description: 'Slow-simmered Assam blend infused with fresh ginger and green cardamom.',
    },
    {
      localId: 'default_in_3',
      name: 'Signature House Tartine',
      category: 'Chef Specials',
      price: '280',
      foodType: 'VEG',
      description: 'Warm artisanal sourdough finished with herb butter and microgreens.',
    },
  ];
}

function parseDemoDraftPriceMinor(priceStr: string): number {
  const num = parseFloat(priceStr);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function deduplicateDemoDishDrafts(dishes: DemoDishDraft[]) {
  return deduplicateDishCollection(
    dishes,
    (d) => ({
      name: d.name,
      category: d.category,
      priceMinor: parseDemoDraftPriceMinor(d.price),
      dietaryBucket: resolvePrimaryDietaryBucket([], d.foodType),
    }),
    (existing, dup) => {
      const mergedCategory =
        isGenericCategory(existing.category) && !isGenericCategory(dup.category)
          ? dup.category
          : existing.category;
      const existingPriceMinor = parseDemoDraftPriceMinor(existing.price);
      const mergedPrice =
        existingPriceMinor > 0 ? existing.price : dup.price || existing.price;
      const mergedDesc =
        (dup.description || '').trim().length > (existing.description || '').trim().length
          ? dup.description
          : existing.description;
      const mergedFoodType =
        existing.foodType === 'VEG' && (dup.foodType === 'NON_VEG' || dup.foodType === 'EGG')
          ? dup.foodType
          : existing.foodType;

      return {
        ...existing,
        category: mergedCategory,
        price: mergedPrice,
        description: mergedDesc,
        foodType: mergedFoodType,
      };
    }
  );
}

export interface DemoMenuModalProps {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  onShowToast: (title: string, subtitle?: string) => void;
}

export function DemoMenuModal({ onClose, onCreated, onShowToast }: DemoMenuModalProps) {
  const [demoName, setDemoName] = useState('');
  const [demoCountry, setDemoCountry] = useState<'IN' | 'US'>('IN');
  const [demoCity, setDemoCity] = useState('Mumbai');
  const [demoDescription, setDemoDescription] = useState('');
  const [demoCoverUrl, setDemoCoverUrl] = useState('');
  const [demoBannerUploading, setDemoBannerUploading] = useState(false);
  const [demoBannerError, setDemoBannerError] = useState<string | null>(null);
  const [demoBannerPreviewError, setDemoBannerPreviewError] = useState(false);
  const [demoBannerDimensions, setDemoBannerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [demoThemePreset, setDemoThemePreset] = useState<
    'WARM_EDITORIAL' | 'MIDNIGHT_ESPRESSO' | 'BOTANICAL_CAFE' | 'PASTEL_PATISSERIE'
  >('WARM_EDITORIAL');
  const [demoDishes, setDemoDishes] = useState<DemoDishDraft[]>(() => buildDefaultDemoDishes('IN'));
  const demoDishesRef = useRef<DemoDishDraft[]>(demoDishes);
  demoDishesRef.current = demoDishes;

  const duplicateDraftLocalIds = React.useMemo(() => {
    const dups = new Set<string>();
    const kept: Array<{
      name: string;
      category: string;
      priceMinor: number;
      dietaryBucket: 'VEG' | 'NON_VEG' | 'EGG' | 'UNSPECIFIED';
    }> = [];
    for (const d of demoDishes) {
      if (!d.name.trim()) continue;
      const comp = {
        name: d.name,
        category: d.category,
        priceMinor: parseDemoDraftPriceMinor(d.price),
        dietaryBucket: resolvePrimaryDietaryBucket([], d.foodType),
      };
      if (kept.some((k) => areDishesLikelyDuplicate(k, comp))) {
        dups.add(d.localId);
      } else {
        kept.push(comp);
      }
    }
    return dups;
  }, [demoDishes]);

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoExtracting, setDemoExtracting] = useState(false);
  const [isDraggingDemoMenu, setIsDraggingDemoMenu] = useState(false);
  const demoMenuPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const demoMenuPdfInputRef = useRef<HTMLInputElement | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [generatedDemoResult, setGeneratedDemoResult] = useState<{
    claimUrl: string;
    publicMenuUrl: string;
    dishCount: number;
    duplicatesSkippedCount?: number;
    canonicalMatchedCount: number;
    restaurantName: string;
  } | null>(null);
  const [copiedClaimUrl, setCopiedClaimUrl] = useState(false);

  const handleDemoCountryChange = (nextCountry: 'IN' | 'US') => {
    setDemoCountry(nextCountry);
    setGeneratedDemoResult(null);
    if (!demoCity.trim() || demoCity === 'Mumbai' || demoCity === 'Austin') {
      setDemoCity(nextCountry === 'US' ? 'Austin' : 'Mumbai');
    }
    const isUsingBuiltInDefaults = demoDishes.every((d) => d.localId.startsWith('default_'));
    if (isUsingBuiltInDefaults) {
      setDemoDishes(buildDefaultDemoDishes(nextCountry));
    }
  };

  const handleClearDemoDishes = () => {
    setGeneratedDemoResult(null);
    setDemoError(null);
    setDemoDishes([
      {
        localId: `custom_${Date.now()}_0`,
        name: '',
        category: 'Chef Specials',
        price: demoCountry === 'US' ? '14.00' : '260',
        foodType: 'VEG',
        description: '',
      },
    ]);
  };

  const handleResetDemoForm = () => {
    setDemoName('');
    setDemoDescription('');
    setDemoCoverUrl('');
    setDemoBannerError(null);
    setDemoBannerPreviewError(false);
    setDemoBannerDimensions(null);
    setDemoDishes(buildDefaultDemoDishes(demoCountry));
    setGeneratedDemoResult(null);
    setDemoError(null);
    setCopiedClaimUrl(false);
  };

  const readDemoBannerDimensions = (
    file: File
  ): Promise<{ width: number; height: number } | null> =>
    new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(objectUrl);
        resolve(dims);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });

  const handleUploadDemoBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDemoBannerError(null);
    setDemoBannerPreviewError(false);

    const fileValidation = validateBannerFileMeta(file);
    if (!fileValidation.ok) {
      setDemoBannerError(fileValidation.error);
      e.target.value = '';
      return;
    }

    setDemoBannerUploading(true);
    try {
      const dims = await readDemoBannerDimensions(file);
      const formData = new FormData();
      formData.append('file', file);
      if (dims?.width) formData.append('width', String(dims.width));
      if (dims?.height) formData.append('height', String(dims.height));

      const res = await fetch('/api/admin/restaurants/upload-banner', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.asset?.publicUrl) {
        throw new Error(data?.error || 'Failed to upload cafe banner image.');
      }

      setDemoCoverUrl(data.asset.publicUrl);
      setDemoBannerDimensions(dims);
      if (generatedDemoResult) setGeneratedDemoResult(null);
    } catch (err: any) {
      setDemoBannerError(err?.message || 'Error uploading cafe banner image.');
    } finally {
      setDemoBannerUploading(false);
      e.target.value = '';
    }
  };

  const handleClearDemoBanner = () => {
    setDemoCoverUrl('');
    setDemoBannerError(null);
    setDemoBannerPreviewError(false);
    setDemoBannerDimensions(null);
    if (generatedDemoResult) setGeneratedDemoResult(null);
  };

  const processDemoMenuFiles = async (rawFiles: FileList | File[] | null | undefined) => {
    if (!rawFiles || rawFiles.length === 0 || demoExtracting) return;

    setDemoExtracting(true);
    setDemoError(null);

    try {
      const prepared = await validateAndPrepareMenuFiles(rawFiles);
      const formData = new FormData();
      formData.append('currency', demoCountry === 'US' ? 'USD' : 'INR');
      for (const file of prepared.files) {
        formData.append('files', file);
      }

      const res = await fetch('/api/admin/restaurants/extract-menu', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const msg = await readApiErrorMessage(res, 'Failed to extract dishes from menu upload.');
        throw new Error(msg);
      }

      const data = await res.json().catch(() => ({}));
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to extract dishes from menu upload.');
      }

      if (data.restaurantName && !demoName.trim()) {
        setDemoName(data.restaurantName);
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const existingNonDefault = demoDishesRef.current.filter(
        (d) => !d.localId.startsWith('default_') && d.name.trim().length > 0
      );

      if (rawItems.length > 0) {
        const mapped: DemoDishDraft[] = rawItems.map((item: any, idx: number) => {
          const labels = Array.isArray(item.dietaryLabels) ? item.dietaryLabels : [];
          const primaryBucket = resolvePrimaryDietaryBucket(labels);
          const foodType: 'VEG' | 'NON_VEG' | 'EGG' =
            primaryBucket === 'NON_VEG'
              ? 'NON_VEG'
              : primaryBucket === 'EGG'
              ? 'EGG'
              : 'VEG';

          const priceNumber =
            typeof item.priceMinor === 'number' && item.priceMinor > 0
              ? item.priceMinor / 100
              : demoCountry === 'US'
              ? 12
              : 250;

          return {
            localId: `extracted_${Date.now()}_${idx}`,
            name: String(item.name || 'Dish'),
            category: String(item.category || 'Chef Specials'),
            price: demoCountry === 'US' ? priceNumber.toFixed(2) : String(Math.round(priceNumber)),
            foodType,
            description: String(item.description || ''),
          };
        });

        const { uniqueItems: mergedDishes, duplicatesRemoved } = deduplicateDemoDishDrafts([
          ...existingNonDefault,
          ...mapped,
        ]);

        setDemoDishes(mergedDishes);
        setGeneratedDemoResult(null);

        onShowToast(
          `${rawItems.length} ${rawItems.length === 1 ? 'item' : 'items'} extracted`,
          duplicatesRemoved > 0
            ? `${mergedDishes.length} unique dishes in list (${duplicatesRemoved} duplicate${duplicatesRemoved === 1 ? '' : 's'} skipped)`
            : `${mergedDishes.length} dishes ready in demo menu`
        );
      } else {
        onShowToast(
          '0 items extracted',
          'No legible dishes detected. Try a clearer photo/PDF crop or add dishes manually.'
        );
      }
    } catch (err: any) {
      setDemoError(err.message || 'Menu extraction failed. You can still add dishes manually below.');
    } finally {
      setDemoExtracting(false);
    }
  };

  const handleExtractDemoDishes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    e.target.value = '';
    await processDemoMenuFiles(selected);
  };

  const handleAddDemoDishRow = () => {
    setGeneratedDemoResult(null);
    setDemoDishes((prev) => [
      ...prev,
      {
        localId: `custom_${Date.now()}_${prev.length}`,
        name: '',
        category: 'Chef Specials',
        price: demoCountry === 'US' ? '14.00' : '260',
        foodType: 'VEG',
        description: '',
      },
    ]);
  };

  const handleUpdateDemoDish = (localId: string, field: keyof DemoDishDraft, value: string) => {
    setGeneratedDemoResult(null);
    setDemoDishes((prev) =>
      prev.map((d) => (d.localId === localId ? { ...d, [field]: value } : d))
    );
  };

  const handleRemoveDemoDish = (localId: string) => {
    setGeneratedDemoResult(null);
    setDemoDishes((prev) => prev.filter((d) => d.localId !== localId));
  };

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) {
      setDemoError('Please enter a restaurant display name.');
      return;
    }

    const bannerUrlValidation = validateBannerUrlInput(demoCoverUrl);
    if (!bannerUrlValidation.ok) {
      setDemoError(bannerUrlValidation.error);
      return;
    }

    const nonEmptyDishes = demoDishes.filter((d) => d.name.trim().length > 0);
    const { uniqueItems: validDishes } = deduplicateDemoDishDrafts(nonEmptyDishes);
    if (validDishes.length === 0) {
      setDemoError('Please add at least one dish to the demo menu.');
      return;
    }
    if (validDishes.length !== demoDishes.length) {
      setDemoDishes(validDishes);
    }

    setDemoLoading(true);
    setDemoError(null);
    setGeneratedDemoResult(null);

    try {
      const payloadDishes = validDishes.map((d) => ({
        name: d.name.trim(),
        category: d.category.trim() || 'Chef Specials',
        description: d.description.trim() || undefined,
        foodType: d.foodType,
        priceMinor: parseDemoDraftPriceMinor(d.price),
      }));

      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: demoName.trim(),
          country: demoCountry,
          city: demoCity.trim(),
          currency: demoCountry === 'US' ? 'USD' : 'INR',
          description: demoDescription.trim(),
          coverUrl: bannerUrlValidation.value ?? null,
          themePreset: demoThemePreset,
          tableCount: 1,
          sampleDishes: payloadDishes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedDemoResult({
          claimUrl: data.claimUrl,
          publicMenuUrl: data.publicMenuUrl,
          dishCount: data.dishCount ?? payloadDishes.length,
          duplicatesSkippedCount: data.duplicatesSkippedCount ?? 0,
          canonicalMatchedCount: data.canonicalMatchedCount ?? 0,
          restaurantName: data.restaurant?.displayName || demoName.trim(),
        });
        await onCreated();
      } else {
        setDemoError(data.error || 'Failed to create demo restaurant.');
      }
    } catch (err: any) {
      setDemoError(err.message || 'Network error while creating demo menu.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-2xl w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content max-h-[92vh] overflow-y-auto"
          style={{ colorScheme: 'dark' }}
        >
          <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-terracotta/20 text-terracotta border border-terracotta/30 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-cream-50">Create Authorized Demo Menu</h3>
                <p className="text-[11px] text-taupe-400">
                  Pre-seeds an unclaimed showcase menu with custom theme, dishes, and private claim link
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-taupe-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          {demoError && (
            <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
              {demoError}
            </div>
          )}

          <form onSubmit={handleCreateDemo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="demo-name" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                  Restaurant Name
                </label>
                <input
                  id="demo-name"
                  type="text"
                  required
                  value={demoName}
                  onChange={(e) => {
                    setDemoName(e.target.value);
                    if (generatedDemoResult) setGeneratedDemoResult(null);
                  }}
                  placeholder="e.g. Blue Bottle Specialty Bar"
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>

              <div>
                <label htmlFor="demo-theme" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                  Menu Theme Preset
                </label>
                <select
                  id="demo-theme"
                  value={demoThemePreset}
                  onChange={(e) => {
                    setDemoThemePreset(e.target.value as any);
                    if (generatedDemoResult) setGeneratedDemoResult(null);
                  }}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                >
                  <option value="WARM_EDITORIAL" className="bg-[#1A120D] text-white">Warm Editorial (Lora & DM Sans)</option>
                  <option value="BOTANICAL_CAFE" className="bg-[#1A120D] text-white">Botanical Café (Playfair & DM Sans)</option>
                  <option value="MIDNIGHT_ESPRESSO" className="bg-[#1A120D] text-white">Midnight Espresso (Dark Luxury)</option>
                  <option value="PASTEL_PATISSERIE" className="bg-[#1A120D] text-white">Pastel Patisserie (Bakery & Cafe)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="demo-country" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                  Country & Currency
                </label>
                <select
                  id="demo-country"
                  value={demoCountry}
                  onChange={(e) => handleDemoCountryChange(e.target.value === 'US' ? 'US' : 'IN')}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                >
                  <option value="IN" className="bg-[#1A120D] text-white py-1">🇮🇳 India (INR ₹)</option>
                  <option value="US" className="bg-[#1A120D] text-white py-1">🇺🇸 US (USD $)</option>
                </select>
              </div>

              <div>
                <label htmlFor="demo-city" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                  City
                </label>
                <input
                  id="demo-city"
                  type="text"
                  value={demoCity}
                  onChange={(e) => {
                    setDemoCity(e.target.value);
                    if (generatedDemoResult) setGeneratedDemoResult(null);
                  }}
                  placeholder="e.g. Mumbai / Austin"
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="demo-description" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                Short Venue Description
              </label>
              <input
                id="demo-description"
                type="text"
                value={demoDescription}
                onChange={(e) => {
                  setDemoDescription(e.target.value);
                  if (generatedDemoResult) setGeneratedDemoResult(null);
                }}
                placeholder="e.g. Small-batch sourdough bakes & single-origin coffee in Bandra."
                style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
              />
            </div>

            {/* Optional Cafe / Restaurant Banner */}
            <div className="p-3.5 bg-[#110C09] rounded-2xl border border-espresso-800 space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cream-100">
                      Cafe / Venue Banner
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-espresso-800 border border-espresso-700 text-[10px] font-medium text-taupe-300">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-taupe-400 mt-0.5">
                    Shown above the QR header card. Leave blank for a clean text header — no dish image fallback is shown.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-taupe-400 bg-[#18100C] border border-espresso-800 px-2 py-1 rounded-lg shrink-0">
                  1200 × 600 px (2:1)
                </span>
              </div>

              {demoBannerError && (
                <div role="alert" className="p-2.5 rounded-xl bg-red-950/90 border border-red-800 text-[11px] text-red-200">
                  {demoBannerError}
                </div>
              )}

              {demoCoverUrl.trim() ? (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-espresso-700 bg-[#0D0907] aspect-[2/1] flex items-center justify-center">
                    {!demoBannerPreviewError ? (
                      <img
                        src={demoCoverUrl.trim()}
                        alt="Demo venue banner preview"
                        onError={() => setDemoBannerPreviewError(true)}
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <span className="text-[11px] text-taupe-400 px-3 text-center">
                        Banner preview unavailable for this URL
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-taupe-400">
                      {demoBannerDimensions ? (
                        <span
                          className={
                            demoBannerDimensions.width < 800 ||
                            demoBannerDimensions.height < 400 ||
                            demoBannerDimensions.width <= demoBannerDimensions.height
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }
                        >
                          {demoBannerDimensions.width} × {demoBannerDimensions.height} px
                          {(demoBannerDimensions.width < 800 ||
                            demoBannerDimensions.height < 400 ||
                            demoBannerDimensions.width <= demoBannerDimensions.height) &&
                            ' (prefer 1200 × 600 landscape)'}
                        </span>
                      ) : (
                        'Banner attached'
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1.5">
                        {demoBannerUploading ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-terracotta" />
                        ) : (
                          <Upload className="w-3 h-3 text-terracotta" />
                        )}
                        <span>{demoBannerUploading ? 'Uploading...' : 'Replace Banner'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={demoBannerUploading || demoLoading}
                          onChange={handleUploadDemoBanner}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={demoBannerUploading || demoLoading}
                        onClick={handleClearDemoBanner}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/70 border border-red-800/70 text-red-200 text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-espresso-700 hover:border-terracotta bg-[#140E0A] hover:bg-[#19110C] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-espresso-900 border border-espresso-700 flex items-center justify-center text-terracotta shrink-0">
                      {demoBannerUploading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-cream-100 truncate">
                        {demoBannerUploading ? 'Uploading Cafe Banner...' : 'Upload Cafe Banner Image'}
                      </div>
                      <div className="text-[11px] text-taupe-400">
                        JPG, PNG, or WebP • Ideal 1200 × 600 px • Max 5 MB
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-espresso-800 border border-espresso-700 text-[11px] font-semibold text-cream-100 shrink-0">
                    Browse
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={demoBannerUploading || demoLoading}
                    onChange={handleUploadDemoBanner}
                    className="hidden"
                  />
                </label>
              )}

              <div>
                <label htmlFor="demo-cover-url" className="sr-only">
                  Optional Banner Image URL
                </label>
                <input
                  id="demo-cover-url"
                  type="text"
                  value={demoCoverUrl}
                  onChange={(e) => {
                    setDemoCoverUrl(e.target.value);
                    setDemoBannerError(null);
                    setDemoBannerPreviewError(false);
                    setDemoBannerDimensions(null);
                    if (generatedDemoResult) setGeneratedDemoResult(null);
                  }}
                  placeholder="Or paste banner image URL (/uploads/banners/... or https://...)"
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-800 text-[11px] font-mono text-cream-100 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>
            </div>

            {/* Starter Dishes Builder + AI Upload Extraction */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!demoExtracting && !isDraggingDemoMenu) setIsDraggingDemoMenu(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
                  return;
                }
                setIsDraggingDemoMenu(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingDemoMenu(false);
                if (demoExtracting) return;
                const dropped = e.dataTransfer?.files;
                if (dropped && dropped.length > 0) {
                  await processDemoMenuFiles(Array.from(dropped));
                }
              }}
              className={`p-3.5 bg-[#110C09] rounded-2xl border space-y-3 transition-colors ${
                isDraggingDemoMenu ? 'border-terracotta bg-[#1B120C]' : 'border-espresso-800'
              }`}
            >
              <input
                ref={demoMenuPhotoInputRef}
                type="file"
                accept={MENU_PHOTO_ACCEPT}
                multiple
                disabled={demoExtracting}
                onChange={handleExtractDemoDishes}
                tabIndex={-1}
                aria-label="Scan demo menu photos"
                className="sr-only"
              />
              <input
                ref={demoMenuPdfInputRef}
                type="file"
                accept={MENU_PDF_ACCEPT}
                multiple
                disabled={demoExtracting}
                onChange={handleExtractDemoDishes}
                tabIndex={-1}
                aria-label="Scan demo menu PDF"
                className="sr-only"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cream-100">
                      Starter Dishes ({demoDishes.length})
                    </span>
                    {duplicateDraftLocalIds.size > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-300">
                        {duplicateDraftLocalIds.size} duplicate{duplicateDraftLocalIds.size === 1 ? '' : 's'} will be merged on save
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-taupe-400">
                    Customize items below, or drop / scan menu photos or a PDF — duplicates merge automatically
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!demoDishes.every((d) => d.localId.startsWith('default_')) && (
                    <button
                      type="button"
                      onClick={handleClearDemoDishes}
                      disabled={demoExtracting || demoLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-espresso-900 hover:bg-espresso-800 border border-espresso-700 text-taupe-300 hover:text-cream-100 text-[11px] font-semibold disabled:opacity-50"
                    >
                      Clear List
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={demoExtracting}
                    onClick={() => demoMenuPhotoInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-[11px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-3 h-3 text-terracotta" />
                    <span>{demoExtracting ? 'Extracting...' : 'Scan Photos'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={demoExtracting}
                    onClick={() => demoMenuPdfInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-[11px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3 text-terracotta" />
                    <span>{demoExtracting ? 'Extracting...' : 'Scan PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDemoDishRow}
                    className="px-2.5 py-1.5 rounded-lg bg-terracotta/20 hover:bg-terracotta/30 border border-terracotta/40 text-terracotta text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Dish</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {demoDishes.map((dish, idx) => {
                  const isDup = duplicateDraftLocalIds.has(dish.localId);
                  return (
                    <div
                      key={dish.localId}
                      className={`p-2.5 rounded-xl bg-[#160F0B] border space-y-2 ${
                        isDup ? 'border-amber-600/60' : 'border-espresso-800/90'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          aria-label={`Dish ${idx + 1} name`}
                          placeholder="Dish name"
                          value={dish.name}
                          onChange={(e) => handleUpdateDemoDish(dish.localId, 'name', e.target.value)}
                          style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                          className="col-span-4 px-2.5 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 dark-input"
                        />
                        <input
                          type="text"
                          aria-label={`Dish ${idx + 1} category`}
                          placeholder="Category"
                          value={dish.category}
                          onChange={(e) => handleUpdateDemoDish(dish.localId, 'category', e.target.value)}
                          style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                          className="col-span-3 px-2.5 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 dark-input"
                        />
                        <input
                          type="number"
                          step={demoCountry === 'US' ? '0.01' : '1'}
                          min="0"
                          aria-label={`Dish ${idx + 1} price`}
                          placeholder={demoCountry === 'US' ? '14.00' : '250'}
                          value={dish.price}
                          onChange={(e) => handleUpdateDemoDish(dish.localId, 'price', e.target.value)}
                          style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                          className="col-span-2 px-2 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 font-mono dark-input"
                        />
                        <select
                          aria-label={`Dish ${idx + 1} dietary type`}
                          value={dish.foodType}
                          onChange={(e) => handleUpdateDemoDish(dish.localId, 'foodType', e.target.value)}
                          style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                          className="col-span-2 px-1.5 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-[11px] text-cream-50 dark-input"
                        >
                          <option value="VEG">Veg</option>
                          <option value="NON_VEG">Non-Veg</option>
                          <option value="EGG">Egg</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveDemoDish(dish.localId)}
                          title="Remove dish"
                          className="col-span-1 flex items-center justify-center p-1.5 rounded-lg text-taupe-400 hover:text-red-400 hover:bg-espresso-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          aria-label={`Dish ${idx + 1} description`}
                          placeholder="Optional brief dish description..."
                          value={dish.description}
                          onChange={(e) => handleUpdateDemoDish(dish.localId, 'description', e.target.value)}
                          style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-[#140E0A] border border-espresso-800 text-[11px] text-taupe-200 dark-input"
                        />
                        {isDup && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold shrink-0">
                            Duplicate
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {generatedDemoResult && (
              <div className="p-3.5 bg-emerald-950/90 border border-emerald-800 text-emerald-200 rounded-xl text-xs space-y-2.5">
                <div className="font-semibold text-emerald-300 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Demo Menu Live ({generatedDemoResult.dishCount} unique dishes • {generatedDemoResult.canonicalMatchedCount} canonical 3D matches)
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={generatedDemoResult.publicMenuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-300 hover:underline inline-flex items-center gap-1"
                    >
                      Inspect Menu <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={generatedDemoResult.claimUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-300 hover:underline inline-flex items-center gap-1"
                    >
                      Open Claim Page <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="p-2 rounded bg-black/50 border border-emerald-800/80 font-mono text-[11px] text-white break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{generatedDemoResult.claimUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(generatedDemoResult.claimUrl).catch(() => {});
                      setCopiedClaimUrl(true);
                      setTimeout(() => setCopiedClaimUrl(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-semibold shrink-0"
                  >
                    {copiedClaimUrl ? 'Copied!' : 'Copy Claim URL'}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-300/90">
                  <span>
                    Unclaimed demo is ready to claim via this private link (or later from Restaurants &rarr; Get Claim Link).
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDemoForm}
                    className="text-cream-100 underline hover:text-white shrink-0 font-semibold"
                  >
                    New Demo
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-espresso-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={
                  demoLoading ||
                  demoExtracting ||
                  demoBannerUploading ||
                  Boolean(generatedDemoResult)
                }
                className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
              >
                {demoLoading
                  ? 'Creating Demo...'
                  : demoBannerUploading
                  ? 'Uploading Banner...'
                  : generatedDemoResult
                  ? 'Demo Created'
                  : 'Create Demo Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

