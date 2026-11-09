'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Utensils } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-xl font-bold">
              D
            </div>
            <span className="font-serif text-2xl font-bold text-espresso-900">Dishora</span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-espresso-900">Welcome back</h1>
          <p className="text-xs text-taupe-500">Sign in to your restaurant owner dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chef@yourrestaurant.com"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
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
          <Link href="/signup" className="font-semibold text-terracotta hover:underline">
            Create your menu
          </Link>
        </div>
      </div>
    </div>
  );
}
