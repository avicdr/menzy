'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { sortCanonicalCategories } from '@/lib/canonical/catalog';
import {
  CandidateReviewModal,
  type CandidateReviewState,
  requestIllustrationCandidate,
} from '@/components/dashboard/CandidateReviewModal';

interface DashboardIllustrationTabProps {
  restaurant: any;
  menuItems: any[];
  setMenuItems: React.Dispatch<React.SetStateAction<any[]>>;
  remainingImageCredits: number;
  onBillingUpdated?: (billingData: any) => void;
  onSubscriptionExpired: (payload?: any) => void;
}

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
  const [isCanonicalGalleryOpen, setIsCanonicalGalleryOpen] = useState(false);
  const [canonicalGalleryLoading, setCanonicalGalleryLoading] = useState(false);
  const [canonicalGalleryItems, setCanonicalGalleryItems] = useState<any[]>([]);
  const [canonicalGallerySearch, setCanonicalGallerySearch] = useState('');
  const [canonicalGalleryCategory, setCanonicalGalleryCategory] = useState('ALL');
  const [galleryTargetDishId, setGalleryTargetDishId] = useState<string>('');
  const [isApplyingGalleryAsset, setIsApplyingGalleryAsset] = useState<string | null>(null);

  const handleGenerateIllustration = async (item: any, tweak?: string) => {
    setIsGeneratingImg(item.id);
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
    } catch {
      alert('Error generating illustration');
    } finally {
      setIsGeneratingImg(null);
    }
  };

  const handleOpenCanonicalGallery = async (targetDish?: any) => {
    setIsCanonicalGalleryOpen(true);
    setGalleryTargetDishId(targetDish?.id || menuItems[0]?.id || '');
    const showInitialLoader = canonicalGalleryItems.length === 0;
    if (showInitialLoader) {
      setCanonicalGalleryLoading(true);
    }
    try {
      const res = await fetch('/api/images/library', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCanonicalGalleryItems(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to load canonical gallery:', err);
    } finally {
      if (showInitialLoader) {
        setCanonicalGalleryLoading(false);
      }
    }
  };

  const handleBatchIllustrateMenu = async () => {
    if (!restaurant?.id || isGeneratingBatch) return;
    setIsGeneratingBatch(true);
    setBatchStatusMsg(null);
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
        alert(data.error || 'Batch visual matching failed');
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
      if (linked === 0 && generated === 0) {
        setBatchStatusMsg(data.message || 'All dishes already have 3D illustrations.');
      } else {
        const parts = [];
        if (linked > 0) parts.push(`linked ${linked} canonical visuals (0 credits)`);
        if (generated > 0) parts.push(`generated ${generated} custom 3D visuals (cap 5/batch)`);
        setBatchStatusMsg(`Success: ${parts.join(' and ')}.`);
      }
      setTimeout(() => setBatchStatusMsg(null), 5000);
    } catch {
      alert('Error running batch visual generation');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleApplyCanonicalFromGallery = async (galleryEntry: any) => {
    if (!galleryTargetDishId || !restaurant?.id) return;
    setIsApplyingGalleryAsset(galleryEntry.canonicalId);
    try {
      const res = await fetch('/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: galleryTargetDishId,
          restaurantId: restaurant.id,
          canonicalId: galleryEntry.canonicalId,
          imageOverrideAssetId: null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMenuItems((prev) =>
          prev.map((i) => (i.id === galleryTargetDishId ? { ...i, ...data.item } : i))
        );
        setIsCanonicalGalleryOpen(false);
      } else {
        alert('Failed to link canonical illustration');
      }
    } catch {
      alert('Error linking canonical illustration');
    } finally {
      setIsApplyingGalleryAsset(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-espresso-900">Illustration Lab</h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Manage 3D-clay-styled illustrations. Reuse curated Canonical Gallery art at zero credit cost or generate custom visuals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchIllustrateMenu}
            disabled={isGeneratingBatch}
            className="px-3.5 py-1.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
            title="Links closest canonical gallery artwork first (0 credits), then generates up to 5 custom visuals"
          >
            {isGeneratingBatch ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-terracotta" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            )}
            {isGeneratingBatch ? 'Matching & Generating...' : 'Auto-Match & Generate (Up to 5)'}
          </button>
          <button
            type="button"
            onClick={() => handleOpenCanonicalGallery()}
            className="px-3.5 py-1.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
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
        <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
          <span>{batchStatusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const img =
            item.imageOverride?.publicUrl ||
            item.canonical?.imageAsset?.publicUrl ||
            '/placeholder-dish.svg';
          const isReused = Boolean(item.canonicalId && !item.imageOverrideAssetId);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-soft flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full bg-cream-100 overflow-hidden">
                <img src={img} alt={item.customName} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-xs ${
                      isReused
                        ? 'bg-sage-100 text-sage-800'
                        : 'bg-terracotta-100 text-terracotta-800'
                    }`}
                  >
                    {isReused ? 'Canonical Library' : 'Custom Generated'}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div>
                  <h4 className="font-semibold text-base text-espresso-900">{item.customName}</h4>
                  <p className="text-xs text-taupe-500 line-clamp-2 mt-0.5">
                    {item.restaurantDescription || 'No culinary description provided'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-cream-100">
                  <button
                    type="button"
                    onClick={() => handleOpenCanonicalGallery(item)}
                    className="py-2 px-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-cream-200 shrink-0"
                    title="Choose free image from Canonical Gallery"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sage-700" />
                    Gallery
                  </button>
                  <button
                    onClick={() => handleGenerateIllustration(item)}
                    disabled={isGeneratingImg === item.id}
                    className="flex-1 py-2 px-3 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isGeneratingImg === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-terracotta" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                    )}
                    {isGeneratingImg === item.id ? 'Generating...' : 'Regenerate 3D'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canonical Gallery Modal */}
      <Modal
        isOpen={isCanonicalGalleryOpen}
        onClose={() => setIsCanonicalGalleryOpen(false)}
        title="Canonical 3D Culinary Gallery"
        subtitle="Browse curated 3D-clay dish artwork. Apply any illustration to a dish on your menu at zero credit cost."
        maxWidth="4xl"
        bodyClassName="space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-cream-50 p-3 rounded-2xl border border-cream-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-taupe-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={canonicalGallerySearch}
              onChange={(e) => setCanonicalGallerySearch(e.target.value)}
              placeholder="Search dishes, beverages, pastries..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
          {menuItems.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-taupe-600 whitespace-nowrap">
                Apply to:
              </span>
              <select
                value={galleryTargetDishId}
                onChange={(e) => setGalleryTargetDishId(e.target.value)}
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

        {canonicalGalleryItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[
              'ALL',
              ...sortCanonicalCategories(
                Array.from(new Set(canonicalGalleryItems.map((i) => i.category).filter(Boolean)))
              ),
            ].map((cat) => {
              const count =
                cat === 'ALL'
                  ? canonicalGalleryItems.length
                  : canonicalGalleryItems.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCanonicalGalleryCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    canonicalGalleryCategory === cat
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

        {canonicalGalleryLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-taupe-500 text-xs gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-terracotta" />
            <span>Loading Canonical Gallery...</span>
          </div>
        ) : (
          (() => {
            const filteredGalleryItems = canonicalGalleryItems.filter((entry) => {
              if (
                canonicalGalleryCategory !== 'ALL' &&
                entry.category !== canonicalGalleryCategory
              ) {
                return false;
              }
              const q = canonicalGallerySearch.toLowerCase().trim();
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

            if (filteredGalleryItems.length === 0) {
              return (
                <div className="py-12 text-center text-taupe-500 text-xs">
                  No canonical dishes match your current filter or search query.
                </div>
              );
            }

            return (
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
                        <h5 className="font-semibold text-xs text-espresso-900 line-clamp-1">
                          {entry.dishName}
                        </h5>
                        <p className="text-[10px] text-taupe-500 line-clamp-2 leading-snug">
                          {entry.description}
                        </p>
                      </div>
                    </div>
                    {galleryTargetDishId && (
                      <div className="px-2.5 pb-2.5">
                        <button
                          type="button"
                          onClick={() => handleApplyCanonicalFromGallery(entry)}
                          disabled={isApplyingGalleryAsset === entry.canonicalId}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {isApplyingGalleryAsset === entry.canonicalId
                            ? 'Applying...'
                            : 'Use This Image'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </Modal>

      <CandidateReviewModal
        restaurantId={restaurant.id}
        candidateReview={candidateReview}
        setCandidateReview={setCandidateReview}
        isGeneratingImg={isGeneratingImg}
        onRetryGenerate={(item, tweak) => handleGenerateIllustration(item, tweak)}
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

