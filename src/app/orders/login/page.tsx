'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Lock, AlertCircle, ArrowLeft, KeyRound, Sparkles, UserCheck } from 'lucide-react';
import { generateStaffTypographyVars } from '@/lib/theme/theme-presets';

export default function StaffLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0C0907] text-cream-100 font-sans">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StaffLoginContent />
    </React.Suspense>
  );
}

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantSlug = searchParams.get('r') || searchParams.get('restaurant');

  const [venueName, setVenueName] = useState<string | null>(null);
  const [venueTheme, setVenueTheme] = useState<any>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantSlug) return;
    fetch(`/api/diner/menu?slug=${encodeURIComponent(restaurantSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.restaurant?.displayName) setVenueName(data.restaurant.displayName);
        if (data?.theme) setVenueTheme(data.theme);
      })
      .catch(() => {});
  }, [restaurantSlug]);

  const staffTypographyStyle = useMemo(
    () => generateStaffTypographyVars(venueTheme),
    [venueTheme]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: loginId.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Staff login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (id: string, pass: string) => {
    setLoginId(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div
      style={staffTypographyStyle}
      className="min-h-screen flex items-center justify-center bg-[#0C0907] text-cream-100 p-4 font-sans selection:bg-terracotta selection:text-white"
    >
      {/* Subtle warm glow background accent */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-terracotta rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 bg-[#140E0A] border border-espresso-800 rounded-3xl shadow-2xl space-y-6 relative z-10 admin-login-box">
        {/* Back Link & Tag */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-taupe-400 hover:text-cream-100 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Menzy
          </Link>
          <span className="text-[11px] font-mono tracking-wider uppercase text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
            Staff & Kitchen KDS
          </span>
        </div>

        {/* Brand & Heading */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-terracotta/20 border border-terracotta-400/30">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-cream-50">
              {venueName ? `${venueName} Terminal` : 'Staff Order Terminal'}
            </h1>
            <p className="text-xs text-taupe-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Kitchen Display System (KDS), floor waiter dispatch & live table fulfillment
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in shadow-inner">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-taupe-300 uppercase tracking-wider mb-1.5">
              Staff Login ID
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. kitchen-01 or staff-lead"
              style={{ colorScheme: 'dark', backgroundColor: '#1B130E', color: '#FAF7F2' }}
              className="w-full px-4 py-3 rounded-xl bg-[#1B130E] border border-espresso-700 text-sm font-medium text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all dark-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-taupe-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ colorScheme: 'dark', backgroundColor: '#1B130E', color: '#FAF7F2' }}
              className="w-full px-4 py-3 rounded-xl bg-[#1B130E] border border-espresso-700 text-sm font-medium text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all dark-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-terracotta to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-terracotta/25 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Terminal...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Launch Order Terminal</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Shortcuts */}
        <div className="pt-3 border-t border-espresso-800/80 space-y-2">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-taupe-500 text-center">
            Quick Fill Demo Accounts
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('manager-chai', 'dishora2026!')}
              className="px-2.5 py-1 rounded-lg bg-espresso-800/80 hover:bg-espresso-700 text-cream-200 text-[11px] font-mono border border-espresso-700 transition-colors"
            >
              manager-chai
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('kitchen-chai', 'dishora2026!')}
              className="px-2.5 py-1 rounded-lg bg-espresso-800/80 hover:bg-espresso-700 text-cream-200 text-[11px] font-mono border border-espresso-700 transition-colors"
            >
              kitchen-chai
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('waiter-chai', 'dishora2026!')}
              className="px-2.5 py-1 rounded-lg bg-espresso-800/80 hover:bg-espresso-700 text-cream-200 text-[11px] font-mono border border-espresso-700 transition-colors"
            >
              waiter-chai
            </button>
          </div>
        </div>

        <div className="text-center pt-1">
          <p className="text-[11px] text-taupe-500">
            Staff access accounts are configured securely by the restaurant owner in the Staff & Access portal.
          </p>
        </div>
      </div>
    </div>
  );
}

