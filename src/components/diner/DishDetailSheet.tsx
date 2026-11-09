'use client';

import React from 'react';
import { X, MessageSquare, Info, ShieldAlert, Sparkles, CheckCircle2, Flame } from 'lucide-react';
import { DietaryBadge, FssaiMarker } from './DietaryBadge';
import { formatCurrencyMinor } from '@/lib/payments/plans';

interface DishDetailSheetProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAskAboutDish: (item: any) => void;
}

export function DishDetailSheet({
  item,
  isOpen,
  onClose,
  onAskAboutDish,
}: DishDetailSheetProps) {
  if (!isOpen || !item) return null;

  const imageUrl = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
  const priceDisplay = item.priceMinor != null ? formatCurrencyMinor(item.priceMinor, item.currency) : '';
  const dietaryLabels = (item.dietaryStatus as string[]) || [];
  const ingredients = (item.ingredients as string[]) || [];
  const nutrition = item.nutritionFields as any;
  const allergenInfo = item.allergenVerification as any;

  const isVerifiedNutrition = item.nutritionSource === 'RESTAURANT_VERIFIED';
  const hasNutrition = nutrition?.calories != null || nutrition?.protein != null;

  // Detect Indian FSSAI marker
  const isVeg = dietaryLabels.some((l: string) => ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(l.toUpperCase()));
  const isNonVeg = dietaryLabels.some((l: string) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(l.toUpperCase()));
  const isEgg = dietaryLabels.some((l: string) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l.toUpperCase()));
  const indianMarker: 'VEG' | 'NON_VEG' | 'EGG' | null = isVeg ? 'VEG' : isNonVeg ? 'NON_VEG' : isEgg ? 'EGG' : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop Dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-[var(--dishora-surface)] rounded-t-3xl sm:rounded-3xl shadow-sheet overflow-hidden flex flex-col z-10">
        {/* Header bar / Grab handle */}
        <div className="w-12 h-1.5 bg-cream-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-espresso-700 hover:bg-white transition-colors shadow-sm"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 pt-2 pb-24 space-y-5">
          {/* Hero Visual Asset */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-cream-100 shadow-sm border border-cream-200">
            <img
              src={imageUrl}
              alt={item.customName}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {item.isPopular && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-white/95 px-3 py-1 rounded-full shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-rose-600" /> Bestseller
                </span>
              )}
              {item.chefRecommended && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-800 bg-white/95 px-3 py-1 rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta-500" /> Chef Recommendation
                </span>
              )}
            </div>
          </div>

          {/* Title & Price */}
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-center gap-2">
                {indianMarker && <FssaiMarker type={indianMarker} size="md" />}
                <h2 className="text-2xl sm:text-3xl font-serif text-[var(--dishora-text)]">
                  {item.customName}
                </h2>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-[var(--dishora-text)] shrink-0">
                {priceDisplay}
              </span>
            </div>
            {item.portionSize && (
              <p className="text-xs text-[var(--dishora-muted-text)] mt-0.5">
                Portion: {item.portionSize}
              </p>
            )}
          </div>

          {/* Dietary Badges */}
          {dietaryLabels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {dietaryLabels.map((label) => (
                <DietaryBadge key={label} label={label} />
              ))}
            </div>
          )}

          {/* Description */}
          {item.restaurantDescription && (
            <div className="text-sm sm:text-base text-[var(--dishora-muted-text)] leading-relaxed">
              {item.restaurantDescription}
            </div>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-700 mb-2">
                Ingredients
              </h4>
              <p className="text-xs sm:text-sm text-[var(--dishora-muted-text)] leading-relaxed">
                {ingredients.join(', ')}
              </p>
            </div>
          )}

          {/* Nutrition Panel */}
          {hasNutrition && (
            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-700">
                  Nutritional Highlights
                </h4>
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${isVerifiedNutrition ? 'bg-sage-100 text-sage-800' : 'bg-amber-100 text-amber-900'}`}>
                  {isVerifiedNutrition ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-sage-600" /> Kitchen Verified
                    </>
                  ) : (
                    <>
                      <Info className="w-3 h-3 text-amber-600" /> Approximate Estimate
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="bg-white p-2 rounded-lg border border-cream-200">
                  <div className="text-base font-bold text-espresso-800">{nutrition.calories || '—'}</div>
                  <div className="text-[10px] text-taupe-500 uppercase tracking-wider">Calories</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-cream-200">
                  <div className="text-base font-bold text-espresso-800">{nutrition.protein ? `${nutrition.protein}g` : '—'}</div>
                  <div className="text-[10px] text-taupe-500 uppercase tracking-wider">Protein</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-cream-200">
                  <div className="text-base font-bold text-espresso-800">{nutrition.carbs ? `${nutrition.carbs}g` : '—'}</div>
                  <div className="text-[10px] text-taupe-500 uppercase tracking-wider">Carbs</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-cream-200">
                  <div className="text-base font-bold text-espresso-800">{nutrition.fat ? `${nutrition.fat}g` : '—'}</div>
                  <div className="text-[10px] text-taupe-500 uppercase tracking-wider">Fat</div>
                </div>
              </div>
            </div>
          )}

          {/* Allergen Statement */}
          {allergenInfo && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {allergenInfo.contains && allergenInfo.contains.length > 0 && (
                  <p><span className="font-semibold">Contains:</span> {allergenInfo.contains.join(', ')}</p>
                )}
                {allergenInfo.statements && allergenInfo.statements.length > 0 && (
                  <p>{allergenInfo.statements.join('. ')}</p>
                )}
                <p className="text-[11px] text-amber-800/80">
                  Please alert our staff to any severe food allergies before ordering.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[var(--dishora-surface)] via-[var(--dishora-surface)] to-transparent border-t border-cream-200">
          <button
            onClick={() => onAskAboutDish(item)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[var(--dishora-accent)] text-white font-medium text-sm sm:text-base hover:opacity-95 active:scale-[0.99] transition-all shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            Ask our AI waiter about this dish
          </button>
        </div>
      </div>
    </div>
  );
}

