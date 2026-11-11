'use client';

import React, { useEffect, useId, useState } from 'react';
import { Check, RefreshCw, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { resolveDishImageMeta } from '@/lib/diner/dish-image-source';

export interface CandidateReviewState {
  item: any;
  asset: any;
  isReused: boolean;
}

export async function requestIllustrationCandidate(params: {
  restaurantId: string;
  item: any;
  tweak?: string;
  onSubscriptionExpired: (payload?: any) => void;
  onBillingUpdated?: (billingData: any) => void;
}): Promise<CandidateReviewState | null> {
  const { restaurantId, item, tweak, onSubscriptionExpired, onBillingUpdated } = params;

  const res = await fetch('/api/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId,
      menuItemId: item.id,
      dishName: item.customName,
      visualDescription: item.restaurantDescription || '',
      category: item.category?.name || undefined,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : undefined,
      dietaryLabels: Array.isArray(item.dietaryStatus) ? item.dietaryStatus : undefined,
      portionSize: item.portionSize || undefined,
      customInstructions: tweak || undefined,
      forceRegenerate: true,
      applyImmediately: false,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 402) {
    onSubscriptionExpired(data);
    return null;
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to generate food photo');
  }

  try {
    const billRes = await fetch(`/api/billing/usage?restaurantId=${restaurantId}`, {
      cache: 'no-store',
    });
    if (billRes.ok) {
      onBillingUpdated?.(await billRes.json());
    }
  } catch {
    // Non-blocking refresh
  }

  return {
    item,
    asset: data.asset,
    isReused: Boolean(data.isReused),
  };
}

interface CandidateReviewModalProps {
  restaurantId: string;
  candidateReview: CandidateReviewState | null;
  setCandidateReview: React.Dispatch<React.SetStateAction<CandidateReviewState | null>>;
  isGeneratingImg: string | null;
  onRetryGenerate: (item: any, tweak?: string) => void | Promise<void>;
  onApplied: (itemId: string, asset: any) => void;
  onSubscriptionExpired: (payload?: any) => void;
}

export function CandidateReviewModal({
  restaurantId,
  candidateReview,
  setCandidateReview,
  isGeneratingImg,
  onRetryGenerate,
  onApplied,
  onSubscriptionExpired,
}: CandidateReviewModalProps) {
  const [isApplyingCandidate, setIsApplyingCandidate] = useState(false);
  const [candidatePromptTweak, setCandidatePromptTweak] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const tweakInputId = useId();
  const candidateDishId = candidateReview?.item?.id;

  useEffect(() => {
    setCandidatePromptTweak('');
    setApplyError(null);
  }, [candidateDishId]);

  const handleAcceptCandidateImage = async () => {
    if (!candidateReview) return;
    setIsApplyingCandidate(true);
    setApplyError(null);
    try {
      const res = await fetch('/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: candidateReview.item.id,
          restaurantId,
          imageOverrideAssetId: candidateReview.asset.id,
        }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        setCandidateReview(null);
        onSubscriptionExpired(payload);
        return;
      }

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        onApplied(candidateReview.item.id, data.item?.imageOverride || candidateReview.asset);
        setCandidateReview(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setApplyError(data?.error || 'Failed to apply image override. Please try again.');
      }
    } catch {
      setApplyError('Network error while applying image override.');
    } finally {
      setIsApplyingCandidate(false);
    }
  };

  const currentMeta = candidateReview ? resolveDishImageMeta(candidateReview.item) : null;

  return (
    <Modal
      isOpen={Boolean(candidateReview)}
      onClose={() => setCandidateReview(null)}
      title="Review Generated Food Photo"
      subtitle={
        candidateReview
          ? `Preview newly generated dish photo for "${candidateReview.item.customName}". You can accept or reject this generation.`
          : undefined
      }
      maxWidth="2xl"
      bodyClassName="space-y-4"
      footerClassName="flex-col-reverse sm:flex-row sm:justify-end"
      footer={
        candidateReview ? (
          <>
            <button
              type="button"
              onClick={() => setCandidateReview(null)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-taupe-700 bg-cream-100 hover:bg-cream-200 rounded-xl transition-colors"
            >
              Reject &amp; Keep Current
            </button>
            <button
              type="button"
              onClick={handleAcceptCandidateImage}
              disabled={isApplyingCandidate}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {isApplyingCandidate ? 'Applying...' : 'Accept & Apply to Menu'}
            </button>
          </>
        ) : undefined
      }
    >
      {candidateReview && (
        <>
          {applyError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {applyError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-taupe-600 uppercase tracking-wider">
                  Current Dish Image
                </span>
                <span className="text-[10px] text-taupe-500 font-medium">
                  {currentMeta?.label || 'Active Menu'}
                </span>
              </div>
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-100 border border-cream-300 shadow-inner">
                <img
                  src={currentMeta?.url || '/placeholder-dish.svg'}
                  alt={`Current image for ${candidateReview.item.customName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-terracotta uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Generated Food Photo
                </span>
                <span className="text-[10px] bg-terracotta-100 text-terracotta-800 font-semibold px-2 py-0.5 rounded-full">
                  Candidate
                </span>
              </div>
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-100 border-2 border-terracotta shadow-md">
                <img
                  src={candidateReview.asset.publicUrl}
                  alt={`Generated food photo candidate for ${candidateReview.item.customName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <label htmlFor={tweakInputId} className="text-xs font-semibold text-espresso-900 block">
              Want adjustments? Add custom styling tweaks
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id={tweakInputId}
                type="text"
                value={candidatePromptTweak}
                onChange={(e) => setCandidatePromptTweak(e.target.value)}
                placeholder="e.g. Add extra fresh herbs, make the gravy darker, rustic ceramic bowl..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
              <button
                type="button"
                onClick={async () => {
                  setApplyError(null);
                  try {
                    await onRetryGenerate(candidateReview.item, candidatePromptTweak);
                  } catch (err: any) {
                    setApplyError(err?.message || 'Could not regenerate dish photo right now.');
                  }
                }}
                disabled={isGeneratingImg === candidateReview.item.id}
                className="px-3.5 py-2 text-xs font-semibold bg-cream-200 text-espresso-800 rounded-xl hover:bg-cream-300 transition-colors shrink-0 flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isGeneratingImg === candidateReview.item.id ? 'animate-spin motion-reduce:animate-none' : ''
                  }`}
                />
                Retry
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

