'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Info, ShieldAlert, Sparkles, CheckCircle2, Flame, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { DietaryBadge, FssaiMarker } from './DietaryBadge';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { useCart, CartModifier } from '@/lib/diner/cart-context';
import { Portal } from '@/components/ui/Portal';

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
  const { addItem, setIsCartOpen } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifierOptionIds, setSelectedModifierOptionIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  // Reset state when dish changes or sheet opens
  useEffect(() => {
    if (item && isOpen) {
      // Default to first variant if exists and required
      const firstVariant = item.variants && item.variants.length > 0 ? item.variants[0].id : null;
      setSelectedVariantId(firstVariant);
      setSelectedModifierOptionIds([]);
      setQuantity(1);
      setSpecialInstructions('');
      setAddedNotice(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const imageUrl = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
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

  const variants = item.variants || [];
  const modifierGroups = item.modifierGroups || [];

  // Calculate live item price with selected variant & modifiers
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId);
  const variantSuppPrice = selectedVariant?.supplementalPriceMinor || 0;

  let modifiersTotalMinor = 0;
  const selectedModifiers: CartModifier[] = [];

  for (const group of modifierGroups) {
    for (const opt of group.options || []) {
      if (selectedModifierOptionIds.includes(opt.id)) {
        modifiersTotalMinor += opt.priceMinor || 0;
        selectedModifiers.push({
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          priceMinor: opt.priceMinor || 0,
        });
      }
    }
  }

  const basePriceMinor = item.priceMinor || 0;
  const unitTotalMinor = basePriceMinor + variantSuppPrice + modifiersTotalMinor;
  const lineTotalMinor = unitTotalMinor * quantity;

  const handleToggleModifier = (group: any, optionId: string) => {
    const isSingleChoice = group.maxSelections === 1;

    setSelectedModifierOptionIds((prev) => {
      const isSelected = prev.includes(optionId);

      if (isSingleChoice) {
        // Replace selection in this group
        const groupOptionIds = group.options.map((o: any) => o.id);
        const withoutGroup = prev.filter((id) => !groupOptionIds.includes(id));
        return isSelected ? withoutGroup : [...withoutGroup, optionId];
      }

      if (isSelected) {
        return prev.filter((id) => id !== optionId);
      } else {
        // Enforce max selections if configured
        const currentGroupSelections = prev.filter((id) =>
          group.options.some((o: any) => o.id === id)
        );
        if (group.maxSelections && currentGroupSelections.length >= group.maxSelections) {
          return prev;
        }
        return [...prev, optionId];
      }
    });
  };

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      name: item.customName,
      imageUrl,
      portionSize: item.portionSize,
      basePriceMinor,
      variantId: selectedVariantId,
      variantName: selectedVariant?.name || null,
      variantSupplementalMinor: variantSuppPrice,
      modifiers: selectedModifiers,
      quantity,
      specialInstructions: specialInstructions.trim() || undefined,
    });

    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4 bg-espresso-950/75 backdrop-blur-sm animate-modal-backdrop font-sans">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative w-full max-w-lg max-h-[92vh] bg-[var(--dishora-surface,#FFFFFF)] rounded-t-3xl sm:rounded-3xl shadow-sheet overflow-hidden flex flex-col z-10 border border-cream-200 animate-modal-content">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-cream-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-espresso-700 hover:bg-white transition-colors shadow-sm"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 pt-2 pb-36 space-y-5 flex-1">
          {/* Hero Visual Asset */}
          <div className="relative aspect-square max-h-72 w-full mx-auto rounded-2xl overflow-hidden bg-cream-100 shadow-sm border border-cream-200">
            <img
              src={imageUrl}
              alt={item.customName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-dish.svg';
              }}
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
                <h2 className="text-2xl sm:text-3xl font-serif text-[var(--dishora-text,#35271F)]">
                  {item.customName}
                </h2>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-[var(--dishora-text,#35271F)] shrink-0 font-mono">
                {formatCurrencyMinor(unitTotalMinor, item.currency)}
              </span>
            </div>
            {item.portionSize && (
              <p className="text-xs text-[var(--dishora-muted-text,#7C695C)] mt-0.5">
                Portion: {item.portionSize}
              </p>
            )}
          </div>

          {/* Dietary Badges */}
          {dietaryLabels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {dietaryLabels.map((label: string) => (
                <DietaryBadge key={label} label={label} />
              ))}
            </div>
          )}

          {/* Description */}
          {item.restaurantDescription && (
            <div className="text-sm sm:text-base text-[var(--dishora-muted-text,#7C695C)] leading-relaxed">
              {item.restaurantDescription}
            </div>
          )}

          {/* Variants (e.g. Size, Serving) */}
          {variants.length > 0 && (
            <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-800">
                Choose Option / Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant: any) => {
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[var(--dishora-accent,#B86D52)] bg-white ring-2 ring-[var(--dishora-accent,#B86D52)]/20 shadow-sm'
                          : 'border-cream-300 bg-cream-100/60 hover:bg-white text-espresso-800'
                      }`}
                    >
                      <span className="font-semibold">{variant.name}</span>
                      {variant.supplementalPriceMinor > 0 && (
                        <span className="text-[11px] text-taupe-500 font-mono mt-0.5">
                          +{formatCurrencyMinor(variant.supplementalPriceMinor, item.currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups (e.g. Milk, Dips, Add-ons) */}
          {modifierGroups.map((group: any) => (
            <div key={group.id} className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-espresso-800">
                  {group.name}
                </label>
                <span className="text-[11px] text-taupe-500">
                  {group.required ? 'Required' : group.maxSelections === 1 ? 'Choose 1' : `Max ${group.maxSelections}`}
                </span>
              </div>
              <div className="space-y-1.5">
                {(group.options || []).map((opt: any) => {
                  const isSelected = selectedModifierOptionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleModifier(group, opt.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[var(--dishora-accent,#B86D52)] bg-white ring-1 ring-[var(--dishora-accent,#B86D52)]/30 font-medium'
                          : 'border-cream-300 bg-cream-100/40 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[var(--dishora-accent,#B86D52)] border-[var(--dishora-accent,#B86D52)] text-white'
                              : 'border-cream-400 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{opt.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-taupe-600">
                        {opt.priceMinor > 0 ? `+${formatCurrencyMinor(opt.priceMinor, item.currency)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Instructions for Dish */}
          <div>
            <label className="block text-xs font-semibold text-[var(--dishora-muted-text,#7C695C)] mb-1">
              Dish Customization Notes (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra hot, no butter on naan, dressing on the side."
              className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs text-espresso-900 placeholder:text-taupe-400 focus:outline-none focus:ring-1 focus:ring-[var(--dishora-accent,#B86D52)]"
            />
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="p-4 bg-cream-50 rounded-xl border border-cream-200">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-700 mb-2">
                Ingredients
              </h4>
              <p className="text-xs sm:text-sm text-[var(--dishora-muted-text,#7C695C)] leading-relaxed">
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
                <p className="text-[11px] text-amber-800/80">
                  Please alert our staff to any severe food allergies before ordering.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[var(--dishora-surface,#FFFFFF)] via-[var(--dishora-surface,#FFFFFF)] to-transparent border-t border-cream-200 space-y-2">
          <div className="flex items-center gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-cream-100 rounded-xl p-1 border border-cream-300 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-espresso-700 hover:bg-cream-50 transition-colors shadow-xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm px-2 text-espresso-900 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-espresso-700 hover:bg-cream-50 transition-colors shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Order Button */}
            <button
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-[0.99] ${
                addedNotice
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--dishora-accent,#B86D52)] hover:opacity-95 text-white'
              }`}
            >
              {addedNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Added to Order!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Order • {formatCurrencyMinor(lineTotalMinor, item.currency)}</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => onAskAboutDish(item)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[var(--dishora-muted-text,#7C695C)] hover:text-espresso-900 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-terracotta" />
            <span>Ask our AI waiter about this dish</span>
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}
