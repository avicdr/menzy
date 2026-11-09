import React from 'react';
import { DietaryBadge, FssaiMarker } from './DietaryBadge';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { Sparkles, Flame } from 'lucide-react';

interface DishCardProps {
  item: any;
  layoutMode?: 'GRID' | 'LIST';
  onSelect: (item: any) => void;
}

export function DishCard({ item, layoutMode = 'GRID', onSelect }: DishCardProps) {
  const imageUrl = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
  const priceDisplay = item.priceMinor != null ? formatCurrencyMinor(item.priceMinor, item.currency) : '';
  const dietaryLabels = (item.dietaryStatus as string[]) || [];

  // Detect Indian FSSAI markers
  const isVeg = dietaryLabels.some((l: string) => ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(l.toUpperCase()));
  const isNonVeg = dietaryLabels.some((l: string) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(l.toUpperCase()));
  const isEgg = dietaryLabels.some((l: string) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l.toUpperCase()));
  const indianMarker: 'VEG' | 'NON_VEG' | 'EGG' | null = isVeg ? 'VEG' : isNonVeg ? 'NON_VEG' : isEgg ? 'EGG' : null;

  if (layoutMode === 'LIST') {
    return (
      <div
        onClick={() => onSelect(item)}
        className="group relative flex items-center justify-between p-4 bg-[var(--dishora-surface)] rounded-2xl border border-[var(--dishora-border)] hover:border-[var(--dishora-accent)] transition-all duration-200 cursor-pointer shadow-soft hover:shadow-lifted"
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {indianMarker && <FssaiMarker type={indianMarker} size="md" />}
            <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--dishora-text)] group-hover:text-[var(--dishora-accent)] transition-colors">
              {item.customName}
            </h3>
            {item.isPopular && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                <Flame className="w-3 h-3 text-rose-600" /> Bestseller
              </span>
            )}
            {item.chefRecommended && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta-700 bg-terracotta-50 px-2 py-0.5 rounded-full border border-terracotta-200 shadow-2xs">
                <Sparkles className="w-3 h-3 text-terracotta-500" /> Chef Pick
              </span>
            )}
          </div>

          {item.restaurantDescription && (
            <p className="text-xs sm:text-sm text-[var(--dishora-muted-text)] line-clamp-2 mb-2 leading-relaxed">
              {item.restaurantDescription}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm sm:text-base text-[var(--dishora-text)]">
              {priceDisplay}
            </span>
            {dietaryLabels.slice(0, 3).map((label) => (
              <DietaryBadge key={label} label={label} />
            ))}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-cream-200 bg-cream-50">
          <img
            src={imageUrl}
            alt={item.customName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-espresso-900/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded bg-black/40">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col bg-[var(--dishora-surface)] rounded-2xl border border-[var(--dishora-border)] hover:border-[var(--dishora-accent)] transition-all duration-200 overflow-hidden cursor-pointer shadow-soft hover:shadow-lifted"
    >
      {/* 3D Visual Asset */}
      <div className="relative aspect-square w-full overflow-hidden bg-cream-100">
        <img
          src={imageUrl}
          alt={item.customName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {item.isPopular && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-rose-200">
              <Flame className="w-3 h-3 text-rose-600" /> Bestseller
            </span>
          )}
          {item.chefRecommended && !item.isPopular && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta-800 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-terracotta-200">
              <Sparkles className="w-3 h-3 text-terracotta-500" /> Chef Pick
            </span>
          )}
        </div>

        {indianMarker && (
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm p-1 rounded shadow-sm">
            <FssaiMarker type={indianMarker} size="md" />
          </div>
        )}

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-espresso-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full bg-black/60 shadow">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {indianMarker && <FssaiMarker type={indianMarker} size="sm" />}
              <h3 className="font-semibold text-base sm:text-lg text-[var(--dishora-text)] group-hover:text-[var(--dishora-accent)] transition-colors line-clamp-1">
                {item.customName}
              </h3>
            </div>
            <span className="font-bold text-sm sm:text-base text-[var(--dishora-text)] shrink-0">
              {priceDisplay}
            </span>
          </div>

          {item.restaurantDescription && (
            <p className="text-xs sm:text-sm text-[var(--dishora-muted-text)] line-clamp-2 leading-relaxed mb-3">
              {item.restaurantDescription}
            </p>
          )}
        </div>

        {dietaryLabels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-cream-100">
            {dietaryLabels.slice(0, 3).map((label) => (
              <DietaryBadge key={label} label={label} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
