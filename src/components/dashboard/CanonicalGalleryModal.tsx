'use client';

import React, { useEffect, useId, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { sortCanonicalCategories } from '@/lib/canonical/catalog';

interface CanonicalGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  menuItems: any[];
  targetDishId: string;
  onTargetDishIdChange: (dishId: string) => void;
  onApplied: (updatedItem: any) => void;
  onSubscriptionExpired: (payload?: any) => void;
}

export function CanonicalGalleryModal({
  isOpen,
  onClose,
  restaurantId,
  menuItems,
  targetDishId,
  onTargetDishIdChange,
  onApplied,
  onSubscriptionExpired,
}: CanonicalGalleryModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [applyingCanonicalId, setApplyingCanonicalId] = useState<string | null>(null);

  const searchInputId = useId();
  const targetSelectId = useId();

  useEffect(() => {
    if (!isOpen) {
      setApplyError(null);
      return;
    }

    let cancelled = false;
    const showInitialLoader = galleryItems.length === 0;
    if (showInitialLoader) {
      setLoading(true);
    }
    setLoadError(null);

    fetch('/api/images/library', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load gallery illustrations');
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setGalleryItems(data.assets || []);
        }
      })
      .catch((err: any) => {
        if (!cancelled && showInitialLoader) {
          setLoadError(err?.message || 'Unable to load the Canonical Gallery right now.');
        }
      })
      .finally(() => {
        if (!cancelled && showInitialLoader) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, galleryItems.length]);

  const effectiveTargetDishId = targetDishId || menuItems[0]?.id || '';

  const handleApplyCanonical = async (galleryEntry: any) => {
    if (!effectiveTargetDishId || !restaurantId) return;
    setApplyingCanonicalId(galleryEntry.canonicalId);
    setApplyError(null);
    try {
      const res = await fetch('/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: effectiveTargetDishId,
          restaurantId,
          canonicalId: galleryEntry.canonicalId,
          imageOverrideAssetId: null,
        }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        onClose();
        onSubscriptionExpired(payload);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.item) {
        onApplied(data.item);
        onClose();
      } else {
        setApplyError(data?.error || 'Failed to apply gallery artwork. Please try again.');
      }
    } catch {
      setApplyError('Network error while linking gallery artwork.');
    } finally {
      setApplyingCanonicalId(null);
    }
  };

  const filteredGalleryItems = galleryItems.filter((entry) => {
    if (selectedCategory !== 'ALL' && entry.category !== selectedCategory) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      entry.dishName?.toLowerCase().includes(q) ||
      entry.normalizedName?.toLowerCase().includes(q) ||
      entry.description?.toLowerCase().includes(q) ||
      entry.cuisine?.toLowerCase().includes(q) ||
      (Array.isArray(entry.aliases) &&
        entry.aliases.some((a: string) => a.toLowerCase().includes(q)))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Canonical 3D Culinary Gallery"
      subtitle="Browse curated 3D-clay dish artwork. Apply any illustration to a dish on your menu at zero credit cost."
      maxWidth="4xl"
      bodyClassName="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-cream-50 p-3 rounded-2xl border border-cream-200">
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">
            Search canonical dishes
          </label>
          <Search
            className="w-4 h-4 text-taupe-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, beverages, pastries..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
        {menuItems.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor={targetSelectId}
              className="text-[11px] font-semibold text-taupe-600 whitespace-nowrap"
            >
              Apply to:
            </label>
            <select
              id={targetSelectId}
              value={effectiveTargetDishId}
              onChange={(e) => onTargetDishIdChange(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta max-w-[200px]"
            >
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.customName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {applyError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
        >
          {applyError}
        </div>
      )}

      {galleryItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[
            'ALL',
            ...sortCanonicalCategories(
              Array.from(new Set(galleryItems.map((i) => i.category).filter(Boolean)))
            ),
          ].map((cat) => {
            const count =
              cat === 'ALL'
                ? galleryItems.length
                : galleryItems.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                  selectedCategory === cat
                    ? 'bg-espresso-900 text-white'
                    : 'bg-cream-100 text-taupe-700 hover:bg-cream-200'
                }`}
              >
                {cat === 'ALL' ? `All (${count})` : `${cat} (${count})`}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-taupe-500 text-xs gap-2">
          <RefreshCw className="w-6 h-6 animate-spin motion-reduce:animate-none text-terracotta" />
          <span>Loading Canonical Gallery...</span>
        </div>
      ) : loadError ? (
        <div className="py-12 text-center text-red-700 text-xs">{loadError}</div>
      ) : filteredGalleryItems.length === 0 ? (
        <div className="py-12 text-center text-taupe-500 text-xs">
          No canonical dishes match your current filter or search query.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {filteredGalleryItems.map((entry) => (
            <div
              key={entry.canonicalId}
              className="rounded-2xl border border-cream-200 bg-white overflow-hidden flex flex-col justify-between shadow-xs hover:border-terracotta/50 transition-all"
            >
              <div>
                <div className="relative aspect-square bg-cream-100 overflow-hidden">
                  <img
                    src={entry.asset?.publicUrl || '/placeholder-dish.svg'}
                    alt={entry.dishName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {entry.category && (
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-black/65 text-white backdrop-blur-xs max-w-[90%] truncate">
                      {entry.category}
                    </span>
                  )}
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="font-semibold text-xs text-espresso-900 line-clamp-1">
                    {entry.dishName}
                  </h4>
                  <p className="text-[10px] text-taupe-500 line-clamp-2 leading-snug">
                    {entry.description}
                  </p>
                </div>
              </div>
              {effectiveTargetDishId && (
                <div className="px-2.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => handleApplyCanonical(entry)}
                    disabled={applyingCanonicalId === entry.canonicalId}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  >
                    {applyingCanonicalId === entry.canonicalId
                      ? 'Applying...'
                      : 'Use This Image'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

