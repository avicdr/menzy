'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { MenzyLogo } from '@/components/brand/MenzyLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC] p-4 text-cream-100 relative selection:bg-terracotta selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-6 sm:p-8 bg-espresso-900 border border-espresso-800 rounded-3xl shadow-lifted space-y-6 relative z-10 backdrop-blur-sm admin-login-box">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-taupe-400 hover:text-cream-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to website
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-terracotta px-2 py-0.5 rounded-full bg-terracotta/10 border border-terracotta/20">
            Super-Admin
          </span>
        </div>

        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-1">
            <MenzyLogo size={44} className="ring-1 ring-white/15" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-cream-50">
            Menzy Founder Portal
          </h1>
          <p className="text-xs text-taupe-400 max-w-xs mx-auto">
            Environment-authenticated single administrator operations console
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-200 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-taupe-300 mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@menzy.app"
              style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-sm text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all shadow-inner dark-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-taupe-300 mb-1.5">
              Founder Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-sm text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all shadow-inner dark-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta-600 active:scale-[0.99] transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In as Founder</span>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-2 border-t border-espresso-800 text-center">
          <div className="text-[11px] text-taupe-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-500 shrink-0" />
            <span>Protected by HMAC & secure HTTP-only session cookies</span>
          </div>
        </div>
      </div>
    </div>
  );
}
