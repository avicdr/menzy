'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Gift } from 'lucide-react';
import { Portal } from '@/components/ui/Portal';

export interface GrantEntitlementModalProps {
  initialOrgId: string;
  subscriptions: any[];
  restaurants: any[];
  onClose: () => void;
  onGranted: () => Promise<void> | void;
}

export function GrantEntitlementModal({
  initialOrgId,
  subscriptions,
  restaurants,
  onClose,
  onGranted,
}: GrantEntitlementModalProps) {
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
  const [grantType, setGrantType] = useState('COMPLIMENTARY_PLAN');
  const [grantTier, setGrantTier] = useState('PRO');
  const [grantQuantity, setGrantQuantity] = useState(50);
  const [grantDays, setGrantDays] = useState(14);
  const [founderReason, setFounderReason] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOrgId(initialOrgId);
  }, [initialOrgId]);

  const handleGrantEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !founderReason) return;
    setGrantLoading(true);
    setGrantError(null);

    try {
      const res = await fetch('/api/admin/entitlements/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          grantType,
          tierOrValue: grantTier,
          quantity: grantQuantity,
          durationDays: grantDays,
          founderReason,
        }),
      });

      if (res.ok) {
        setGrantSuccessMsg('Complimentary entitlement granted & audited successfully!');
        setFounderReason('');
        await onGranted();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setGrantError(data.error || 'Failed to grant entitlement.');
      }
    } catch (err: any) {
      setGrantError(err.message || 'Network error while granting entitlement.');
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content max-h-[92vh] overflow-y-auto"
          style={{ colorScheme: 'dark' }}
        >
          <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-cream-50">Grant Complimentary Entitlement</h3>
                <p className="text-[11px] text-taupe-400">Overrides tenant privileges without falsifying payment ledgers</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-taupe-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          {grantSuccessMsg && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{grantSuccessMsg}</span>
            </div>
          )}

          {grantError && (
            <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
              {grantError}
            </div>
          )}

          <form onSubmit={handleGrantEntitlement} className="space-y-3.5">
            <div>
              <label htmlFor="grant-target-org" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                Target Organization
              </label>
              <select
                id="grant-target-org"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
              >
                <option value="" disabled className="bg-[#1A120D] text-white py-1">
                  Select an organization...
                </option>
                {subscriptions.map((sub: any) => (
                  <option key={sub.organizationId} value={sub.organizationId} className="bg-[#1A120D] text-white py-1">
                    {sub.organization.name} ({sub.organization.restaurants[0]?.displayName || 'Venue'}) — {sub.planKey}
                  </option>
                ))}
                {Array.from(
                  new Map(
                    restaurants
                      .filter(
                        (r) =>
                          Boolean(r.organizationId) &&
                          !subscriptions.some((sub: any) => sub.organizationId === r.organizationId)
                      )
                      .map((r) => [r.organizationId as string, r])
                  ).values()
                ).map((r) => (
                  <option key={r.organizationId} value={r.organizationId} className="bg-[#1A120D] text-white py-1">
                    {r.displayName} ({r.city || r.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Grant Type</label>
              <select
                value={grantType}
                onChange={(e) => setGrantType(e.target.value)}
                style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
              >
                <option value="COMPLIMENTARY_PLAN" className="bg-[#1A120D] text-white py-1">
                  Complimentary Plan Upgrade (Pro/Growth)
                </option>
                <option value="BONUS_IMAGE_CREDITS" className="bg-[#1A120D] text-white py-1">
                  Bonus 3D Image Credits
                </option>
                <option value="BONUS_AI_QUESTIONS" className="bg-[#1A120D] text-white py-1">
                  Bonus AI Chat Questions
                </option>
                <option value="EXTENSION" className="bg-[#1A120D] text-white py-1">
                  Subscription Duration Extension
                </option>
              </select>
            </div>

            {grantType === 'COMPLIMENTARY_PLAN' && (
              <div>
                <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Target Tier</label>
                <select
                  value={grantTier}
                  onChange={(e) => setGrantTier(e.target.value)}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                >
                  <option value="PRO" className="bg-[#1A120D] text-white py-1">Pro Tier</option>
                  <option value="GROWTH" className="bg-[#1A120D] text-white py-1">Growth Tier</option>
                </select>
              </div>
            )}

            {grantType === 'BONUS_IMAGE_CREDITS' && (
              <div>
                <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Credits Quantity</label>
                <input
                  type="number"
                  value={grantQuantity}
                  onChange={(e) => setGrantQuantity(parseInt(e.target.value, 10))}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Duration (Days)</label>
              <input
                type="number"
                value={grantDays}
                onChange={(e) => setGrantDays(parseInt(e.target.value, 10))}
                style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Founder Reason (Audited)</label>
              <textarea
                required
                rows={2}
                value={founderReason}
                onChange={(e) => setFounderReason(e.target.value)}
                placeholder="e.g. VIP partner launch extension / customer support goodwill"
                style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-espresso-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={grantLoading || !selectedOrgId}
                className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {grantLoading ? 'Granting...' : 'Apply Grant & Audit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

