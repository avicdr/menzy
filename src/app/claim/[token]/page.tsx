'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Utensils } from 'lucide-react';

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/claims/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawClaimToken: token,
          verificationNotes,
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        // Redirect to signup with return URL
        router.push(`/signup?claimToken=${token}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim menu');
      }

      alert('Ownership claim submitted! Redirecting to your preview dashboard...');
      router.push(`/dashboard/${data.restaurant.id}`);
    } catch (err: any) {
      setError(err.message || 'Error claiming restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-terracotta text-white flex items-center justify-center mx-auto shadow-md">
            <Utensils className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Claim Your Restaurant Menu
          </h1>
          <p className="text-xs sm:text-sm text-taupe-600">
            You've been invited by the Dishora team to take ownership of your interactive digital menu.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2 text-xs">
          <div className="font-semibold text-espresso-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sage-600" />
            Founder Verification Protected
          </div>
          <p className="text-taupe-600 leading-relaxed">
            Upon claiming, you'll immediately unlock full draft editing, 3D illustration studio controls, and personalized theme branding.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-taupe-700 mb-1">
            Optional Ownership Verification Details
          </label>
          <textarea
            rows={2}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="e.g. Official restaurant domain email or phone number for confirmation"
            className="w-full px-3 py-2 rounded-xl border border-cream-300 text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <button
          onClick={handleClaim}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          <span>{loading ? 'Verifying Claim...' : 'Claim & Open Menu Studio'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
