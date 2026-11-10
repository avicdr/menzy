'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimToken = searchParams.get('claimToken')?.trim() || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      if (claimToken) {
        const redeemRes = await fetch('/api/claims/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawClaimToken: claimToken }),
        });
        const redeemData = await redeemRes.json();
        if (redeemRes.ok && redeemData.restaurant?.id) {
          router.push(`/dashboard/${redeemData.restaurant.id}`);
          return;
        }
        router.push(`/claim/${encodeURIComponent(claimToken)}`);
        return;
      }

      if (data.defaultRestaurantId) {
        router.push(`/dashboard/${data.defaultRestaurantId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error signing in');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('dishora2026!');
  };

  const signupHref = claimToken ? `/signup?claimToken=${encodeURIComponent(claimToken)}` : '/signup';

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-xl font-bold">
            M
          </div>
          <span className="font-serif text-2xl font-bold text-espresso-900">Menzy</span>
        </Link>
        <h1 className="font-serif text-2xl font-bold text-espresso-900">Welcome back</h1>
        <p className="text-xs text-taupe-500">Sign in to your restaurant owner dashboard</p>
      </div>

      {claimToken && (
        <div className="p-3 bg-cream-50 border border-cream-200 rounded-xl text-xs text-espresso-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terracotta shrink-0" />
          <span>Sign in below to immediately claim and open your demo restaurant menu.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-taupe-600 mb-1">
            Email Address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chef@yourrestaurant.com"
            className="w-full px-4 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold text-taupe-600 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
        >
          {loading ? (claimToken ? 'Signing in & claiming...' : 'Signing in...') : claimToken ? 'Sign In & Claim Menu' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Quick-Fill Hints */}
      <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 text-xs space-y-2">
        <div className="font-semibold text-taupe-600">Explore Seeded Demo Venues:</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill('aarav@chaiandchutney.in')}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-cream-200 hover:bg-cream-100 text-[11px] font-medium text-espresso-800 text-center"
          >
            🇮🇳 Chai & Chutney (INR)
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('elena@gildedbistro.com')}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-cream-200 hover:bg-cream-100 text-[11px] font-medium text-espresso-800 text-center"
          >
            🇺🇸 Gilded Fork (USD)
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-taupe-500">
        Don't have a menu yet?{' '}
        <Link href={signupHref} className="font-semibold text-terracotta hover:underline">
          Create your menu
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
