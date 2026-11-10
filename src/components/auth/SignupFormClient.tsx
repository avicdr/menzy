'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import {
  BillingRegion,
  detectRegionFromTimezoneAndLocale,
} from '@/lib/geo/region-shared';
import { MenzyLogo } from '@/components/brand/MenzyLogo';
import { trackConversionEvent } from '@/lib/analytics/events';

interface SignupFormClientProps {
  initialRegion: BillingRegion;
  authoritativeGeo: boolean;
}

function SignupFormInner({ initialRegion, authoritativeGeo }: SignupFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimToken = searchParams.get('claimToken')?.trim() || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [country, setCountry] = useState<BillingRegion>(initialRegion);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [claimPreview, setClaimPreview] = useState<{
    valid: boolean;
    error?: string;
    restaurant?: {
      displayName: string;
      city: string | null;
      country: string;
      dishCount: number;
    };
  } | null>(null);

  // Refine region from browser timezone only when server geo was non-authoritative (e.g. localhost)
  useEffect(() => {
    if (authoritativeGeo) {
      setCountry(initialRegion);
      return;
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const lang = navigator.language || '';
      setCountry(detectRegionFromTimezoneAndLocale(tz, lang));
    } catch {
      setCountry(initialRegion);
    }
  }, [authoritativeGeo, initialRegion]);

  // If signing up via claim link, load preview metadata so we don't ask for duplicate venue info
  useEffect(() => {
    if (!claimToken) {
      setClaimPreview(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/claims/${encodeURIComponent(claimToken)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setClaimPreview(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [claimToken]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    trackConversionEvent('signup_started', { claimMode: Boolean(claimToken) });

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          ...(claimToken
            ? { claimToken }
            : {
                restaurantName,
                country,
                city,
                currency: country === 'US' ? 'USD' : 'INR',
              }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      trackConversionEvent('signup_completed', { country });
      router.push(`/dashboard/${data.restaurant.id}`);
    } catch (err: any) {
      setError(err.message || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = claimToken ? `/login?claimToken=${encodeURIComponent(claimToken)}` : '/login';

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center mb-2">
          <MenzyLogo size={40} showWordmark wordmarkClassName="font-serif text-2xl font-bold text-espresso-900" />
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
          {claimToken ? 'Claim your pre-built menu' : 'Create your visual menu'}
        </h1>
        <p className="text-xs sm:text-sm text-taupe-500">
          {claimToken
            ? 'Create your owner account below to unlock and customize your demo menu.'
            : 'Join hundreds of cafés & boutique restaurants delighting guests with interactive AI menus.'}
        </p>
      </div>

      {claimToken && claimPreview && (
        claimPreview.valid && claimPreview.restaurant ? (
          <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-2xl text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-espresso-900">
                Claiming: {claimPreview.restaurant.displayName}
              </div>
              <div className="text-taupe-600">
                {claimPreview.restaurant.city ? `${claimPreview.restaurant.city}, ` : ''}
                {claimPreview.restaurant.country} • {claimPreview.restaurant.dishCount} dishes pre-loaded
              </div>
            </div>
          </div>
        ) : !claimPreview.valid && claimPreview.error ? (
          <div
            role="alert"
            className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{claimPreview.error}</span>
          </div>
        ) : null
      )}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className={claimToken ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
          <div>
            <label htmlFor="signup-name" className="block text-xs font-semibold text-taupe-600 mb-1">
              Your Name
            </label>
            <input
              id="signup-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chef Elena"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          {!claimToken && (
            <div>
              <label htmlFor="signup-restaurant-name" className="block text-xs font-semibold text-taupe-600 mb-1">
                Venue / Restaurant Name
              </label>
              <input
                id="signup-restaurant-name"
                name="restaurantName"
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="The Gilded Fork"
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-xs font-semibold text-taupe-600 mb-1">
            Email Address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="elena@restaurant.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-xs font-semibold text-taupe-600 mb-1">
            Create Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe-500 hover:text-espresso-900"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!claimToken && (
          <div>
            <label htmlFor="signup-city" className="block text-xs font-semibold text-taupe-600 mb-1">
              City
            </label>
            <input
              id="signup-city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={country === 'US' ? 'San Francisco' : 'Bengaluru'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || Boolean(claimToken && claimPreview && !claimPreview.valid)}
          className="w-full py-3.5 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
        >
          {loading
            ? claimToken
              ? 'Creating Account & Claiming Menu...'
              : 'Creating your workspace...'
            : claimToken
            ? 'Create Account & Claim Menu'
            : 'Start Creating Your Menu'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-taupe-500">
        Already have an account?{' '}
        <Link href={loginHref} className="font-semibold text-terracotta hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function SignupFormClient({ initialRegion, authoritativeGeo }: SignupFormClientProps) {
  return (
    <main className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />}>
        <SignupFormInner initialRegion={initialRegion} authoritativeGeo={authoritativeGeo} />
      </Suspense>
    </main>
  );
}

