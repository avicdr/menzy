'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  Mail,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { MenzyLogo } from '@/components/brand/MenzyLogo';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';

interface ClaimPreviewResponse {
  valid: boolean;
  state: 'UNCLAIMED' | 'ALREADY_CLAIMED_BY_YOU' | 'ALREADY_CLAIMED' | 'EXPIRED' | 'REVOKED' | 'INVALID';
  error?: string;
  expiresAt?: string;
  currentUser: {
    userId: string;
    email: string;
    name: string | null;
  } | null;
  restaurant?: {
    id: string;
    slug: string;
    displayName: string;
    description: string | null;
    country: string;
    city: string | null;
    currency: string;
    coverUrl: string | null;
    dishCount: number;
    sampleDishes: Array<{
      id: string;
      name: string;
      priceMinor: number | null;
      currency: string;
    }>;
  };
}

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const rawToken = decodeURIComponent(String(params?.token || '')).trim();

  const [previewLoading, setPreviewLoading] = useState(true);
  const [preview, setPreview] = useState<ClaimPreviewResponse | null>(null);

  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [submitting, setSubmitting] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [claimBannerError, setClaimBannerError] = useState(false);

  // Verification notes for claiming
  const [verificationNotes, setVerificationNotes] = useState('');

  // Inline signup fields (when not signed in)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Inline login fields (when not signed in)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!rawToken) {
      setPreview({
        valid: false,
        state: 'INVALID',
        error: 'Invitation token is missing.',
        currentUser: null,
      });
      setPreviewLoading(false);
      return;
    }

    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/claims/${encodeURIComponent(rawToken)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setPreview(data);
    } catch {
      setPreview({
        valid: false,
        state: 'INVALID',
        error: 'Could not verify this invitation link right now. Please try again.',
        currentUser: null,
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [rawToken]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    setClaimBannerError(false);
  }, [preview?.restaurant?.coverUrl]);

  const redeemAsSignedInUser = async (notes?: string) => {
    const res = await fetch('/api/claims/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawClaimToken: rawToken,
        verificationNotes: notes ?? verificationNotes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to claim menu');
    }

    setStatusMessage(data.message || 'Ownership claimed! Opening your workspace...');
    router.push(`/dashboard/${data.restaurant.id}`);
  };

  const handleSignedInClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      await redeemAsSignedInUser();
    } catch (err: any) {
      setError(err.message || 'Error claiming restaurant');
      await loadPreview();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setSwitchingAccount(true);
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await loadPreview();
    } catch {
      setError('Failed to sign out of current account.');
    } finally {
      setSwitchingAccount(false);
    }
  };

  const handleSignupAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          claimToken: rawToken,
          verificationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account and claim venue');
      }

      setStatusMessage('Account created and menu claimed! Opening your Menu Studio...');
      router.push(`/dashboard/${data.restaurant.id}`);
    } catch (err: any) {
      setError(err.message || 'Could not create account and claim menu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Invalid email or password');
      }

      await redeemAsSignedInUser(verificationNotes);
    } catch (err: any) {
      setError(err.message || 'Could not sign in and claim menu.');
      await loadPreview();
    } finally {
      setSubmitting(false);
    }
  };

  if (previewLoading) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-9 h-9 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-taupe-600">Checking your private invitation link...</p>
        </div>
      </div>
    );
  }

  const restaurant = preview?.restaurant;

  // Invalid / Expired / Revoked / Already Claimed by someone else
  if (!preview || !preview.valid) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            {preview?.state === 'EXPIRED' ? (
              <Clock className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-espresso-900">
              {preview?.state === 'ALREADY_CLAIMED'
                ? 'Menu Already Claimed'
                : preview?.state === 'EXPIRED'
                ? 'Invitation Link Expired'
                : preview?.state === 'REVOKED'
                ? 'Invitation Link Superseded'
                : 'Invitation Link Invalid'}
            </h1>
            {restaurant && (
              <p className="text-sm font-semibold text-terracotta">
                {restaurant.displayName}
                {restaurant.city ? ` • ${restaurant.city}` : ''}
              </p>
            )}
            <p className="text-sm text-taupe-600 leading-relaxed">
              {preview?.error || 'This claim link is no longer valid. Please contact the Menzy team for a fresh link.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-taupe-700 space-y-1">
            <div className="font-semibold text-espresso-900">Need setup help or a fresh invite link?</div>
            <a
              href={SUPPORT_EMAIL_HREF}
              className="inline-flex items-center gap-1.5 text-terracotta font-semibold hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email {SUPPORT_EMAIL_DISPLAY}</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {preview?.state === 'ALREADY_CLAIMED' && (
              <Link
                href="/login"
                className="flex-1 py-3 px-4 rounded-xl bg-espresso-900 text-white text-sm font-semibold hover:bg-espresso-800 transition-colors"
              >
                Sign In to Your Dashboard
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-cream-100 border border-cream-300 text-espresso-900 text-sm font-semibold hover:bg-cream-200 transition-colors"
            >
              Back to Menzy Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already claimed by the currently signed-in owner
  if (preview.state === 'ALREADY_CLAIMED_BY_YOU' && restaurant) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-cream-300 shadow-lifted p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
              You Own This Restaurant Menu
            </h1>
            <p className="text-sm text-taupe-600">
              <strong className="text-espresso-900">{restaurant.displayName}</strong> is already connected to your account ({preview.currentUser?.email}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/dashboard/${restaurant.id}`}
              className="flex-1 py-3.5 px-4 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>Open Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`/m/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-4 rounded-xl bg-cream-100 border border-cream-300 text-espresso-900 font-semibold text-sm hover:bg-cream-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Live Menu</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-espresso-900 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-cream-300 shadow-lifted p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center mb-1">
            <MenzyLogo size={36} showWordmark wordmarkClassName="font-serif text-xl font-bold text-espresso-900" />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Claim Your Restaurant Menu
          </h1>
          <p className="text-xs sm:text-sm text-taupe-600">
            The Menzy team built a ready-to-launch digital menu for your venue. Claim ownership to edit dishes, customize branding, and download table QR codes.
          </p>
        </div>

        {/* Demo Venue Preview Card */}
        {restaurant && (
          <div className="p-4 sm:p-5 bg-cream-50 rounded-2xl border border-cream-200 space-y-3">
            {restaurant.coverUrl && !claimBannerError && (
              <div className="rounded-xl overflow-hidden border border-cream-200 bg-black/5">
                <img
                  src={restaurant.coverUrl}
                  alt={`${restaurant.displayName} banner`}
                  onError={() => setClaimBannerError(true)}
                  className="w-full aspect-[2/1] object-cover block"
                />
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-espresso-900">
                  {restaurant.displayName}
                </h2>
                <p className="text-xs text-taupe-600 mt-0.5">
                  {restaurant.city ? `${restaurant.city}, ` : ''}
                  {restaurant.country} • {restaurant.currency} • {restaurant.dishCount}{' '}
                  {restaurant.dishCount === 1 ? 'dish' : 'dishes'} ready
                </p>
              </div>
              <a
                href={`/m/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white border border-cream-300 text-xs font-semibold text-terracotta hover:bg-cream-100 transition-colors inline-flex items-center gap-1 shrink-0 shadow-sm"
              >
                <span>Preview Menu</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {restaurant.description && (
              <p className="text-xs text-taupe-700 leading-relaxed">{restaurant.description}</p>
            )}

            {restaurant.sampleDishes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {restaurant.sampleDishes.slice(0, 4).map((dish) => (
                  <span
                    key={dish.id}
                    className="px-2.5 py-1 rounded-lg bg-white border border-cream-200 text-[11px] font-medium text-espresso-800"
                  >
                    {dish.name}
                    {dish.priceMinor != null
                      ? ` • ${formatCurrencyMinor(dish.priceMinor, dish.currency)}`
                      : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-emerald-950 leading-relaxed space-y-1">
            <p>
              <strong className="font-semibold">Starts with a 14-Day Free &quot;Trial&quot; Plan — No payment method required.</strong> Claiming unlocks instant editing permissions, table QR generation, theme controls, and <strong className="font-semibold">15 free 3D dish credits</strong>.
            </p>
            <p className="text-[11px] text-emerald-900/80">
              After the 14-day trial ends, ordering &amp; dashboard access pause until you activate a subscription inside Billing.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Signed-in user 1-click claim flow */}
        {preview.currentUser ? (
          <form onSubmit={handleSignedInClaim} className="space-y-4">
            <div className="p-3 rounded-xl bg-white border border-cream-300 flex items-center justify-between gap-2 text-xs">
              <div>
                <div className="text-taupe-500">Claiming as signed-in owner</div>
                <div className="font-semibold text-espresso-900">{preview.currentUser.email}</div>
              </div>
              <button
                type="button"
                onClick={handleSwitchAccount}
                disabled={switchingAccount}
                className="px-2.5 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-espresso-800 font-semibold text-xs inline-flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{switchingAccount ? 'Signing out...' : 'Switch Account'}</span>
              </button>
            </div>

            <div>
              <label htmlFor="claim-signedin-notes" className="block text-xs font-semibold text-taupe-700 mb-1">
                Optional Ownership Verification Note
              </label>
              <textarea
                id="claim-signedin-notes"
                name="verificationNotes"
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g. Official restaurant domain email or phone number"
                className="w-full px-3 py-2 rounded-xl border border-cream-300 text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <span>{submitting ? 'Transferring Ownership...' : 'Claim & Open Menu Studio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Guest onboarding: Create Account or Sign In directly on the claim page */
          <div className="space-y-4">
            <div
              role="tablist"
              aria-label="Claim authentication options"
              className="grid grid-cols-2 p-1 rounded-2xl bg-cream-100 border border-cream-200"
            >
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'signup'}
                onClick={() => {
                  setAuthTab('signup');
                  setError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  authTab === 'signup'
                    ? 'bg-white text-espresso-900 shadow-sm'
                    : 'text-taupe-600 hover:text-espresso-900'
                }`}
              >
                Create Owner Account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'login'}
                onClick={() => {
                  setAuthTab('login');
                  setError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  authTab === 'login'
                    ? 'bg-white text-espresso-900 shadow-sm'
                    : 'text-taupe-600 hover:text-espresso-900'
                }`}
              >
                Sign In to Existing Account
              </button>
            </div>

            {authTab === 'signup' ? (
              <form onSubmit={handleSignupAndClaim} className="space-y-3.5">
                <div>
                  <label htmlFor="claim-signup-name" className="block text-xs font-semibold text-taupe-600 mb-1">
                    Your Name
                  </label>
                  <input
                    id="claim-signup-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Chef Elena"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <div>
                  <label htmlFor="claim-signup-email" className="block text-xs font-semibold text-taupe-600 mb-1">
                    Email Address
                  </label>
                  <input
                    id="claim-signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    spellCheck={false}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <div>
                  <label htmlFor="claim-signup-password" className="block text-xs font-semibold text-taupe-600 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      id="claim-signup-password"
                      name="password"
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      aria-pressed={showSignupPassword}
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe-500 hover:text-espresso-900"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="claim-signup-notes" className="block text-xs font-semibold text-taupe-600 mb-1">
                    Optional Verification Note
                  </label>
                  <input
                    id="claim-signup-notes"
                    name="verificationNotes"
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Official phone number or IG handle"
                    className="w-full px-3.5 py-2 rounded-xl border border-cream-300 text-xs focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <span>{submitting ? 'Creating Account & Claiming...' : 'Create Account & Claim Menu'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginAndClaim} className="space-y-3.5">
                <div>
                  <label htmlFor="claim-login-email" className="block text-xs font-semibold text-taupe-600 mb-1">
                    Email Address
                  </label>
                  <input
                    id="claim-login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    spellCheck={false}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <div>
                  <label htmlFor="claim-login-password" className="block text-xs font-semibold text-taupe-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="claim-login-password"
                      name="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      aria-pressed={showLoginPassword}
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe-500 hover:text-espresso-900"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-espresso-900 text-white font-semibold text-sm hover:bg-espresso-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <span>{submitting ? 'Signing In & Claiming...' : 'Sign In & Claim Menu'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-cream-200 flex flex-wrap items-center justify-center gap-2 text-xs text-taupe-600">
          <Mail className="w-3.5 h-3.5 text-terracotta shrink-0" />
          <span>Setup &amp; onboarding queries? Email</span>
          <a
            href={SUPPORT_EMAIL_HREF}
            className="font-semibold text-espresso-900 hover:text-terracotta underline underline-offset-2"
          >
            {SUPPORT_EMAIL_DISPLAY}
          </a>
        </div>
      </div>
    </div>
  );
}
