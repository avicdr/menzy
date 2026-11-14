'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Flame,
  Image as ImageIcon,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DietaryBadge, FssaiMarker } from '@/components/diner/DietaryBadge';
import { resolveDishDietarySignals } from '@/lib/diner/dietary';
import { resolveDishImageMeta } from '@/lib/diner/dish-image-source';
import {
  DISH_PHOTO_ACCEPT,
  revertDishImageOverride,
  uploadDishPhotoFile,
} from '@/lib/images/client-dish-photo';
import { formatCurrencyMinor } from '@/lib/payments/plans';

interface DishPreviewModalProps {
  dish: any | null;
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  isGeneratingImg: string | null;
  onDishUpdated: (updatedItem: any) => void;
  onRegenerateImage: (item: any, tweak?: string) => void | Promise<void>;
  onOpenGallery?: (item: any) => void;
  onEditDish?: (item: any) => void;
  onSubscriptionExpired: (payload?: any) => void;
}

const SOURCE_BADGE_STYLES = {
  OWNER_PHOTO: 'bg-sky-100 text-sky-900 border border-sky-200',
  AI_GENERATED: 'bg-terracotta-100 text-terracotta-800 border border-terracotta-200',
  CANONICAL_REALISTIC: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  CANONICAL_CLAY: 'bg-violet-100 text-violet-800 border border-violet-200',
  CANONICAL: 'bg-sage-100 text-sage-800 border border-sage-200',
  PLACEHOLDER: 'bg-cream-200 text-taupe-700 border border-cream-300',
} as const;

export function DishPreviewModal({
  dish,
  isOpen,
  onClose,
  restaurantId,
  isGeneratingImg,
  onDishUpdated,
  onRegenerateImage,
  onOpenGallery,
  onEditDish,
  onSubscriptionExpired,
}: DishPreviewModalProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRevertingPhoto, setIsRevertingPhoto] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [customStyleTweak, setCustomStyleTweak] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();
  const tweakInputId = useId();
  const dishId = dish?.id;

  useEffect(() => {
    setPhotoError(null);
    setPhotoNotice(null);
    setCustomStyleTweak('');
    setIsDraggingPhoto(false);
  }, [dishId, isOpen]);

  const handleUploadFile = async (file: File | undefined | null) => {
    if (!file || !dish || !restaurantId) return;
    setPhotoError(null);
    setPhotoNotice(null);
    setIsUploadingPhoto(true);
    try {
      const res = await uploadDishPhotoFile({
        restaurantId,
        menuItemId: dish.id,
        file,
      });

      if (res.expired) {
        onClose();
        onSubscriptionExpired(res.payload);
        return;
      }

      const updatedItem =
        res.item || {
          ...dish,
          imageOverrideAssetId: res.asset.id,
          imageOverride: res.asset,
        };
      onDishUpdated(updatedItem);
      setPhotoNotice('Your dish photo is now live on your menu.');
    } catch (err: any) {
      setPhotoError(err?.message || 'Could not upload your photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRevertCustomImage = async () => {
    if (!dish || !restaurantId) return;
    setPhotoError(null);
    setPhotoNotice(null);
    setIsRevertingPhoto(true);
    try {
      const res = await revertDishImageOverride({
        restaurantId,
        itemId: dish.id,
      });
      if (res.expired) {
        onClose();
        onSubscriptionExpired(res.payload);
        return;
      }
      if (res.item) {
        onDishUpdated(res.item);
        setPhotoNotice(
          res.item.canonical?.imageAsset?.publicUrl
            ? 'Reverted to Canonical Library artwork.'
            : 'Custom photo removed.'
        );
      }
    } catch (err: any) {
      setPhotoError(err?.message || 'Failed to revert dish image.');
    } finally {
      setIsRevertingPhoto(false);
    }
  };

  if (!dish) {
    return null;
  }

  const imageMeta = resolveDishImageMeta(dish);
  const dietarySignals = resolveDishDietarySignals(dish);
  const indianMarker = dietarySignals.indianMarker;
  const allowFssaiVegMarker = !dietarySignals.containsEgg && !dietarySignals.isNonVeg;
  const ingredients = Array.isArray(dish.ingredients)
    ? dish.ingredients.filter((ing: any) => typeof ing === 'string' && ing.trim())
    : [];
  const priceDisplay =
    dish.priceMinor != null ? formatCurrencyMinor(dish.priceMinor, dish.currency) : '';
  const isBusy = isUploadingPhoto || isRevertingPhoto || isGeneratingImg === dish.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dish.customName}
      subtitle={`${dish.category?.name || 'General'} • Diner Menu Preview`}
      maxWidth="3xl"
      bodyClassName="space-y-5"
      footerClassName="justify-between"
      footer={
        <>
          <div className="text-[11px] text-taupe-500">
            Changes update your live diner QR menu immediately.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onEditDish && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditDish(dish);
                }}
                className="px-4 py-2 text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 rounded-xl transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <Pencil className="w-3.5 h-3.5 text-taupe-600" aria-hidden="true" />
                Edit Dish Details
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-espresso-900 hover:bg-espresso-800 text-white rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Done
            </button>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left: Hero Image Preview & Drag-and-Drop Photo Upload */}
        <div className="md:col-span-5 space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingPhoto(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingPhoto(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingPhoto(false);
              const droppedFile = e.dataTransfer?.files?.[0];
              if (droppedFile) {
                void handleUploadFile(droppedFile);
              }
            }}
            className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-100 border-2 transition-all shadow-sm ${
              isDraggingPhoto ? 'border-terracotta ring-2 ring-terracotta/25' : 'border-cream-200'
            }`}
          >
            <img
              src={imageMeta.url}
              alt={dish.customName}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-dish.svg';
              }}
              className="w-full h-full object-cover"
            />

            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-xs ${
                  SOURCE_BADGE_STYLES[imageMeta.sourceKind]
                }`}
              >
                {imageMeta.label}
              </span>
            </div>

            {indianMarker && (
              <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs p-1 rounded shadow-sm">
                <FssaiMarker type={indianMarker} size="md" />
              </div>
            )}

            {!dish.isAvailable && (
              <div className="absolute inset-x-0 bottom-0 bg-espresso-950/75 backdrop-blur-xs py-1.5 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Currently Marked Sold Out
                </span>
              </div>
            )}

            {isUploadingPhoto && (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 bg-espresso-950/65 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white px-4 text-center"
              >
                <RefreshCw className="w-6 h-6 animate-spin motion-reduce:animate-none" />
                <span className="text-xs font-semibold">Optimizing &amp; uploading photo...</span>
              </div>
            )}

            {isDraggingPhoto && !isUploadingPhoto && (
              <div className="absolute inset-0 bg-terracotta/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white px-4 text-center">
                <Upload className="w-7 h-7" />
                <span className="text-xs font-bold">Drop your dish photo to apply</span>
              </div>
            )}
          </div>

          {/* Primary Own Photo Upload Dropzone Control */}
          <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <label htmlFor={fileInputId} className="sr-only">
              Upload your own dish photo
            </label>
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept={DISH_PHOTO_ACCEPT}
              disabled={isBusy}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) {
                  void handleUploadFile(picked);
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="w-full py-2.5 px-3.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              <Camera className="w-4 h-4 text-terracotta" aria-hidden="true" />
              <span>
                {imageMeta.sourceKind === 'OWNER_PHOTO'
                  ? 'Replace Own Photo'
                  : 'Upload Your Own Photo'}
              </span>
            </button>
            <p className="text-[11px] text-taupe-500 text-center leading-snug">
              Drag &amp; drop onto the image above or pick JPG, PNG, WebP, or HEIC. Automatically resized for fast mobile loading.
            </p>
          </div>
        </div>

        {/* Right: Dish Metadata & Image Regeneration / Gallery Tools */}
        <div className="md:col-span-7 space-y-4">
          {/* Diner Info Summary */}
          <div className="p-4 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cream-200 text-espresso-800">
                    {dish.category?.name || 'General'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      dish.isAvailable
                        ? 'bg-sage-100 text-sage-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {dish.isAvailable ? 'Available' : 'Sold Out'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  {indianMarker && <FssaiMarker type={indianMarker} size="md" />}
                  <h4 className="font-serif text-xl font-bold text-espresso-900 leading-tight">
                    {dish.customName}
                  </h4>
                </div>
              </div>
              {priceDisplay && (
                <span className="font-bold text-lg text-espresso-900 shrink-0 tabular-nums">
                  {priceDisplay}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-taupe-700 leading-relaxed">
              {dish.restaurantDescription || 'No dish description provided yet.'}
            </p>

            {(dish.isPopular ||
              dish.chefRecommended ||
              dietarySignals.displayLabels.length > 0 ||
              dish.portionSize) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {dish.isPopular && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    <Flame className="w-3 h-3 text-rose-600" aria-hidden="true" /> Bestseller
                  </span>
                )}
                {dish.chefRecommended && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta-700 bg-terracotta-50 px-2.5 py-0.5 rounded-full border border-terracotta-200">
                    <Sparkles className="w-3 h-3 text-terracotta-500" aria-hidden="true" /> Chef Pick
                  </span>
                )}
                {dish.portionSize && (
                  <span className="text-[11px] font-medium text-taupe-600 bg-white px-2.5 py-0.5 rounded-full border border-cream-200">
                    {dish.portionSize}
                  </span>
                )}
                {dietarySignals.displayLabels.map((label) => (
                  <DietaryBadge
                    key={label}
                    label={label}
                    allowFssaiVegMarker={allowFssaiVegMarker}
                  />
                ))}
              </div>
            )}

            {ingredients.length > 0 && (
              <div className="pt-2 border-t border-cream-200/80">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-taupe-500 mb-1.5">
                  Key Ingredients
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.slice(0, 10).map((ing: string) => (
                    <span
                      key={ing}
                      className="px-2 py-0.5 rounded-lg bg-white border border-cream-200 text-[11px] text-espresso-800"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {photoError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {photoError}
            </div>
          )}

          {photoNotice && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-900 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" aria-hidden="true" />
              <span>{photoNotice}</span>
            </div>
          )}

          {/* Regenerate Food Photo & Canonical Gallery Controls */}
          <div className="p-4 rounded-2xl bg-white border border-cream-200 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-espresso-900 uppercase tracking-wider">
                Or Generate / Switch Dish Image
              </h4>
              <p className="text-[11px] text-taupe-500 mt-0.5">
                Preview a realistic AI food photo before replacing, or pick curated artwork from our Canonical Gallery.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={tweakInputId}
                className="block text-[11px] font-semibold text-taupe-600"
              >
                Custom Plating &amp; Styling Note (optional)
              </label>
              <input
                id={tweakInputId}
                type="text"
                value={customStyleTweak}
                onChange={(e) => setCustomStyleTweak(e.target.value)}
                disabled={isBusy}
                placeholder="e.g. Served in a warm ceramic bowl with fresh coriander & visible sizzling tadka..."
                className="w-full px-3 py-2 text-xs bg-cream-50/40 border border-cream-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setPhotoError(null);
                  try {
                    await onRegenerateImage(dish, customStyleTweak.trim() || undefined);
                  } catch (err: any) {
                    setPhotoError(err?.message || 'Could not generate a dish photo right now.');
                  }
                }}
                disabled={isBusy}
                className="flex-1 min-w-[170px] py-2 px-3.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                {isGeneratingImg === dish.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {isGeneratingImg === dish.id ? 'Generating Photo...' : 'Regenerate Food Photo'}
                </span>
              </button>

              {onOpenGallery && (
                <button
                  type="button"
                  onClick={() => onOpenGallery(dish)}
                  disabled={isBusy}
                  className="py-2 px-3.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-900 border border-sage-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-sage-700" aria-hidden="true" />
                  <span>Canonical Gallery</span>
                </button>
              )}

              {imageMeta.hasCustomOverride && (
                <button
                  type="button"
                  onClick={handleRevertCustomImage}
                  disabled={isBusy}
                  className="py-2 px-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-taupe-800 border border-cream-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  {isRevertingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{isRevertingPhoto ? 'Reverting...' : 'Remove Custom Photo'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
