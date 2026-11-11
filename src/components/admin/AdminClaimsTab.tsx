'use client';

import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Portal } from '@/components/ui/Portal';

export interface AdminClaimsTabProps {
  claims: any[];
  loading: boolean;
  generatingInviteId: string | null;
  claimError: string | null;
  onGenerateClaimLink: (restaurantId: string, restaurantName: string) => void;
  onApproved: () => Promise<void> | void;
}

export function AdminClaimsTab({
  claims,
  loading,
  generatingInviteId,
  claimError: externalClaimError,
  onGenerateClaimLink,
  onApproved,
}: AdminClaimsTabProps) {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeClaimToApprove, setActiveClaimToApprove] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleOpenApproveModal = (claim: any) => {
    setActiveClaimToApprove(claim);
    setModalError(null);
    setVerificationNotes(
      `Approved by founder console. Verified venue identity for ${claim.restaurant?.displayName || 'venue'}.`
    );
    setIsClaimModalOpen(true);
  };

  const handleConfirmApproveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaimToApprove) return;
    setClaimLoading(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_CLAIM',
          claimId: activeClaimToApprove.id,
          verificationNotes,
        }),
      });

      if (res.ok) {
        setIsClaimModalOpen(false);
        setActiveClaimToApprove(null);
        await onApproved();
      } else {
        const data = await res.json();
        setModalError(data.error || 'Failed to approve claim.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Network error approving claim.');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-cream-50">Ownership Claim Requests</h3>
            <p className="text-xs text-taupe-400">Restaurant operators claiming prebuilt demo menus</p>
          </div>
          <span className="text-xs font-mono text-taupe-400">{claims.length} claims registered</span>
        </div>

        {(externalClaimError || modalError) && (
          <div role="alert" className="mb-4 p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
            {externalClaimError || modalError}
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Venue</th>
                <th className="py-3 px-4 font-semibold">Claimant Email</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Expires</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-800/60">
              {claims.map((cl) => (
                <tr key={cl.id} className="hover:bg-espresso-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-cream-50">{cl.restaurant?.displayName}</div>
                    {cl.restaurant?.slug && (
                      <a
                        href={`/m/${cl.restaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-terracotta hover:underline"
                      >
                        /m/{cl.restaurant.slug}
                      </a>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-taupe-300 font-mono text-[11px]">
                    {cl.claimantEmail || 'Unclaimed link'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cl.status === 'APPROVED'
                          ? 'bg-emerald-950 border border-emerald-800/70 text-emerald-300'
                          : cl.status === 'PENDING_VERIFICATION'
                          ? 'bg-amber-950 border border-amber-800/70 text-amber-300'
                          : cl.status === 'UNCLAIMED'
                          ? 'bg-blue-950 border border-blue-800/70 text-blue-300'
                          : 'bg-espresso-800 text-taupe-400'
                      }`}
                    >
                      {cl.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-taupe-400 font-mono">{new Date(cl.expiresAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-right">
                    {cl.status === 'PENDING_VERIFICATION' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(cl)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs whitespace-nowrap shadow-sm transition-all"
                      >
                        Review & Approve
                      </button>
                    ) : (cl.status === 'UNCLAIMED' || cl.status === 'REJECTED') &&
                      cl.restaurant &&
                      !cl.restaurant.isClaimed ? (
                      <button
                        type="button"
                        disabled={generatingInviteId === cl.restaurant.id}
                        onClick={() =>
                          onGenerateClaimLink(cl.restaurant.id, cl.restaurant.displayName)
                        }
                        className="px-3 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-amber-300 font-semibold text-xs whitespace-nowrap transition-all disabled:opacity-50"
                      >
                        {generatingInviteId === cl.restaurant.id ? 'Generating...' : 'New Invite Link'}
                      </button>
                    ) : (
                      <span className="text-taupe-500 text-[11px] font-mono">
                        {cl.status === 'APPROVED' ? 'Claimed' : 'Closed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-taupe-400">
                    {loading ? 'Loading ownership claims...' : 'No ownership claims in queue.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isClaimModalOpen && activeClaimToApprove && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsClaimModalOpen(false);
            }}
          >
            <div
              className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-md w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content max-h-[92vh] overflow-y-auto"
              style={{ colorScheme: 'dark' }}
            >
              <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-cream-50">Approve Ownership Claim</h3>
                    <p className="text-[11px] text-taupe-400">Transfer venue ownership to verified claimant</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="text-taupe-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
                  {modalError}
                </div>
              )}

              <div className="p-3 bg-[#110C09] rounded-xl border border-espresso-800 text-xs space-y-1">
                <div className="text-taupe-400">Venue to Transfer:</div>
                <div className="font-semibold text-cream-50">{activeClaimToApprove.restaurant?.displayName}</div>
                <div className="text-taupe-400 pt-1">Claimant Email:</div>
                <div className="font-mono text-terracotta">{activeClaimToApprove.claimantEmail}</div>
              </div>

              <form onSubmit={handleConfirmApproveClaim} className="space-y-3.5">
                <div>
                  <label htmlFor="approve-verification-notes" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                    Verification Notes (Audited)
                  </label>
                  <textarea
                    id="approve-verification-notes"
                    required
                    rows={3}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Verified business registry documents, confirmed matching domain email."
                    style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                    className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-espresso-800">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {claimLoading ? 'Transferring...' : 'Confirm Transfer & Approve'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

