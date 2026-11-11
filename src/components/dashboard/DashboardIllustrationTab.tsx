'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { resolveDishImageMeta } from '@/lib/diner/dish-image-source';
import {
  DISH_PHOTO_ACCEPT,
  uploadDishPhotoFile,
} from '@/lib/images/client-dish-photo';
import {
  CandidateReviewModal,
  type CandidateReviewState,
  requestIllustrationCandidate,
} from '@/components/dashboard/CandidateReviewModal';
import { CanonicalGalleryModal } from '@/components/dashboard/CanonicalGalleryModal';
import { DishPreviewModal } from '@/components/dashboard/DishPreviewModal';

interface DashboardIllustrationTabProps {
  restaurant: any;
  menuItems: any[];
  setMenuItems: React.Dispatch<React.SetStateAction<any[]>>;
  remainingImageCredits: number;
  onBillingUpdated?: (billingData: any) => void;
  onSubscriptionExpired: (payload?: any) => void;
}

const CARD_BADGE_STYLES = {
  OWNER_PHOTO: 'bg-sky-100 text-sky-900',
  AI_GENERATED: 'bg-terracotta-100 text-terracotta-800',
  CANONICAL: 'bg-sage-100 text-sage-800',
  PLACEHOLDER: 'bg-cream-200 text-taupe-700',
} as const;

export function DashboardIllustrationTab({
  restaurant,
  menuItems,
  setMenuItems,
  remainingImageCredits,
  onBillingUpdated,
  onSubscriptionExpired,
}: DashboardIllustrationTabProps) {
  const [isGeneratingImg, setIsGeneratingImg] = useState<string | null>(null);
  const [candidateReview, setCandidateReview] = useState<CandidateReviewState | null>(null);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchStatusMsg, setBatchStatusMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isCanonicalGalleryOpen, setIsCanonicalGalleryOpen] = useState(false);
  const [galleryTargetDishId, setGalleryTargetDishId] = useState<string>('');
  const [previewDishId, setPreviewDishId] = useState<string | null>(null);

  const [quickUploadDishId, setQuickUploadDishId] = useState<string | null>(null);
  const [uploadingPhotoDishId, setUploadingPhotoDishId] = useState<string | null>(null);
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const previewDish = useMemo(
    () => (previewDishId ? menuItems.find((i) => i.id === previewDishId) ?? null : null),
    [previewDishId, menuItems]
  );

  const syncUpdatedDish = (updatedItem: any) => {
    setMenuItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i))
    );
  };

  const handleGenerateIllustration = async (
    item: any,
    tweak?: string,
    options?: { throwOnError?: boolean }
  ) => {
    setIsGeneratingImg(item.id);
    setActionError(null);
    try {
      const candidate = await requestIllustrationCandidate({
        restaurantId: restaurant.id,
        item,
        tweak,
        onSubscriptionExpired,
        onBillingUpdated,
      });
      if (candidate) {
        setCandidateReview(candidate);
      }
    } catch (err: any) {
      const errMsg =
        err?.message || `Could not generate food photo for "${item.customName}".`;
      if (options?.throwOnError) {
        throw new Error(errMsg);
      }
      setActionError(errMsg);
    } finally {
      setIsGeneratingImg(null);
    }
  };

  const handleOpenCanonicalGallery = (targetDish?: any) => {
    setGalleryTargetDishId(targetDish?.id || menuItems[0]?.id || '');
    setIsCanonicalGalleryOpen(true);
  };

  const handleTriggerPhotoUpload = (dishId: string) => {
    setActionError(null);
    setQuickUploadDishId(dishId);
    if (quickPhotoInputRef.current) {
      quickPhotoInputRef.current.value = '';
      quickPhotoInputRef.current.click();
    }
  };

  const handleQuickPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = quickUploadDishId;
    if (!file || !targetId) return;

    const targetDish = menuItems.find((i) => i.id === targetId);
    setUploadingPhotoDishId(targetId);
    setActionError(null);
    try {
      const res = await uploadDishPhotoFile({
        restaurantId: restaurant.id,
        menuItemId: targetId,
        file,
      });
      if (res.expired) {
        onSubscriptionExpired(res.payload);
        return;
      }

      const updatedItem =
        res.item ||
        (targetDish
          ? {
              ...targetDish,
              imageOverrideAssetId: res.asset.id,
              imageOverride: res.asset,
            }
          : null);

      if (updatedItem) {
        syncUpdatedDish(updatedItem);
      }
      setBatchStatusMsg(
        targetDish
          ? `Uploaded your photo for "${targetDish.customName}".`
          : 'Dish photo updated on your menu.'
      );
      setTimeout(() => setBatchStatusMsg(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to upload dish photo.');
    } finally {
      setUploadingPhotoDishId(null);
      setQuickUploadDishId(null);
      if (quickPhotoInputRef.current) {
        quickPhotoInputRef.current.value = '';
      }
    }
  };

  const handleBatchIllustrateMenu = async () => {
    if (!restaurant?.id || isGeneratingBatch) return;
    setIsGeneratingBatch(true);
    setBatchStatusMsg(null);
    setActionError(null);
    try {
      const res = await fetch('/api/images/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        onSubscriptionExpired(data);
        return;
      }
      if (!res.ok) {
        setActionError(data.error || 'Batch visual matching failed.');
        return;
      }

      const [itemsRes, billRes] = await Promise.all([
        fetch(`/api/menus/items?restaurantId=${restaurant.id}`, { cache: 'no-store' }),
        fetch(`/api/billing/usage?restaurantId=${restaurant.id}`, { cache: 'no-store' }),
      ]);
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setMenuItems(itemsData.items || []);
      }
      if (billRes.ok) {
        onBillingUpdated?.(await billRes.json());
      }

      const linked = Number(data.canonicalLinkedCount || 0);
      const generated = Number(data.generatedCount || 0);
      const failed = Number(data.failedCount || 0);

      if (linked === 0 && generated === 0) {
        if (failed > 0 || data.providerUnavailable) {
          setActionError(
            data.message ||
              'AI image generation is currently unavailable. No credits were deducted — try uploading your own dish photo or matching from the Canonical Gallery.'
          );
        } else {
          setBatchStatusMsg(data.message || 'All dishes already have food photos or curated artwork.');
        }
      } else {
        const parts = [];
        if (linked > 0) parts.push(`linked ${linked} canonical visuals (0 credits)`);
        if (generated > 0) parts.push(`generated ${generated} AI food photos (cap 5/batch)`);
        setBatchStatusMsg(`Success: ${parts.join(' and ')}.`);
        if (failed > 0 && data.message) {
          setActionError(data.message);
        }
      }
      setTimeout(() => setBatchStatusMsg(null), 5000);
    } catch {
      setActionError('Error running batch visual generation.');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-espresso-900">Illustration Lab</h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Preview dishes, upload your own photos, reuse Canonical Gallery art at zero credit cost, or generate AI food photos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchIllustrateMenu}
            disabled={isGeneratingBatch}
            className="px-3.5 py-1.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            title="Links closest canonical gallery artwork first (0 credits), then generates up to 5 custom visuals"
          >
            {isGeneratingBatch ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none text-terracotta" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            )}
            {isGeneratingBatch ? 'Matching & Generating...' : 'Auto-Match & Generate (Up to 5)'}
          </button>
          <button
            type="button"
            onClick={() => handleOpenCanonicalGallery()}
            className="px-3.5 py-1.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 font-semibold text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sage-700" />
            Browse Canonical Gallery
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-terracotta-50 text-terracotta-700 font-bold text-xs border border-terracotta-200">
            {remainingImageCredits} Generation Credits Remaining
          </span>
        </div>
      </div>

      {batchStatusMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
          <span>{batchStatusMsg}</span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
            className="p-1 rounded-lg text-red-600 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={quickPhotoInputRef}
        type="file"
        accept={DISH_PHOTO_ACCEPT}
        onChange={handleQuickPhotoChange}
        className="hidden"
        aria-label="Upload dish photo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const imageMeta = resolveDishImageMeta(item);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-soft flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => setPreviewDishId(item.id)}
                  aria-label={`Preview ${item.customName}`}
                  className="group relative aspect-square w-full bg-cream-100 overflow-hidden block text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-terracotta cursor-pointer"
                >
                  <img
                    src={imageMeta.url}
                    alt={item.customName}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-dish.svg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span
                    className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-xs ${
                      CARD_BADGE_STYLES[imageMeta.sourceKind]
                    }`}
                  >
                    {imageMeta.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/65 text-white text-[11px] font-semibold backdrop-blur-xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Dish
                  </span>
                </button>

                <div className="px-4 sm:px-5 pt-4">
                  <button
                    type="button"
                    onClick={() => setPreviewDishId(item.id)}
                    className="text-left group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta rounded"
                  >
                    <h3 className="font-semibold text-base text-espresso-900 group-hover:text-terracotta transition-colors">
                      {item.customName}
                    </h3>
                  </button>
                  <p className="text-xs text-taupe-500 line-clamp-2 mt-0.5">
                    {item.restaurantDescription || 'No culinary description provided'}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 pt-3">
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-cream-100">
                  <button
                    type="button"
                    onClick={() => handleTriggerPhotoUpload(item.id)}
                    disabled={uploadingPhotoDishId === item.id}
                    className="py-2 px-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-cream-200 shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    title="Upload your own photo for this dish"
                    aria-label={`Upload photo for ${item.customName}`}
                  >
                    {uploadingPhotoDishId === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none text-terracotta" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-terracotta" />
                    )}
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCanonicalGallery(item)}
                    className="py-2 px-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-cream-200 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                    title="Choose free image from Canonical Gallery"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sage-700" />
                    Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateIllustration(item)}
                    disabled={isGeneratingImg === item.id}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  >
                    {isGeneratingImg === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none text-terracotta" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                    )}
                    {isGeneratingImg === item.id ? 'Generating...' : 'Regenerate AI'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DishPreviewModal
        dish={previewDish}
        isOpen={Boolean(previewDish)}
        onClose={() => setPreviewDishId(null)}
        restaurantId={restaurant.id}
        isGeneratingImg={isGeneratingImg}
        onDishUpdated={syncUpdatedDish}
        onRegenerateImage={(item, tweak) =>
          handleGenerateIllustration(item, tweak, { throwOnError: true })
        }
        onOpenGallery={(item) => handleOpenCanonicalGallery(item)}
        onSubscriptionExpired={onSubscriptionExpired}
      />

      <CanonicalGalleryModal
        isOpen={isCanonicalGalleryOpen}
        onClose={() => setIsCanonicalGalleryOpen(false)}
        restaurantId={restaurant.id}
        menuItems={menuItems}
        targetDishId={galleryTargetDishId}
        onTargetDishIdChange={setGalleryTargetDishId}
        onApplied={syncUpdatedDish}
        onSubscriptionExpired={onSubscriptionExpired}
      />

      <CandidateReviewModal
        restaurantId={restaurant.id}
        candidateReview={candidateReview}
        setCandidateReview={setCandidateReview}
        isGeneratingImg={isGeneratingImg}
        onRetryGenerate={(item, tweak) =>
          handleGenerateIllustration(item, tweak, { throwOnError: true })
        }
        onApplied={(itemId, asset) => {
          setMenuItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, imageOverride: asset, imageOverrideAssetId: asset.id } : i
            )
          );
        }}
        onSubscriptionExpired={onSubscriptionExpired}
      />
    </div>
  );
}
