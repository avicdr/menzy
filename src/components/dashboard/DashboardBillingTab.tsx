'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Mail, ShieldCheck, X } from 'lucide-react';
import { trackConversionEvent } from '@/lib/analytics/events';
import {
  FREE_TRIAL_DAYS,
  TRIAL_PLAN,
  type PlanDefinition,
  type TrialPlanDefinition,
} from '@/lib/payments/plans';

interface DashboardBillingTabProps {
  restaurant: any;
  billingUsage: any;
  effectiveAccess: any;
  isSubscriptionExpired: boolean;
  isTrialActive: boolean;
  isTrialEnded: boolean;
  supportEmail: string;
  supportMailHref: string;
  checkoutNotice: { type: 'success' | 'error'; message: string; paymentUrl?: string | null } | null;
  setCheckoutNotice: (
    notice: { type: 'success' | 'error'; message: string; paymentUrl?: string | null } | null
  ) => void;
  onSubscriptionActivated?: () => Promise<void> | void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
      on?: (event: string, handler: (res: any) => void) => void;
    };
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export function DashboardBillingTab({
  restaurant,
  billingUsage,
  effectiveAccess,
  isSubscriptionExpired,
  isTrialActive,
  isTrialEnded,
  supportEmail,
  supportMailHref,
  checkoutNotice,
  setCheckoutNotice,
  onSubscriptionActivated,
}: DashboardBillingTabProps) {
  const [startingPlanKey, setStartingPlanKey] = useState<string | null>(null);
  const trialDef: TrialPlanDefinition = billingUsage?.trialPlan || TRIAL_PLAN;
  const onTrial =
    billingUsage?.plan?.key === trialDef.key || effectiveAccess?.planKey === trialDef.key;

  const activeBillingCountry: 'IN' | 'US' =
    billingUsage?.billingCountry === 'US' ? 'US' : 'IN';
  const availablePlans: PlanDefinition[] = Array.isArray(billingUsage?.availablePlans)
    ? billingUsage.availablePlans
    : [];
  const upgradeButtonLabel =
    isSubscriptionExpired || isTrialActive || billingUsage?.plan?.key === 'FREE_TRIAL'
      ? 'Buy Subscription'
      : 'Select Plan';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft">
        <h2 className="font-serif text-xl font-bold text-espresso-900">
          Billing &amp; Image Credits
        </h2>
        <p className="text-xs sm:text-sm text-taupe-500 mt-1">
          14-day free Trial plan, subscription tiers, and server-enforced image generation credits.
        </p>
      </div>

      {isSubscriptionExpired && (
        <div
          role="alert"
          className="p-5 rounded-3xl bg-red-50 border border-red-200 text-red-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-base font-bold text-red-950">
                {isTrialEnded ? 'Your 14-Day Free Trial Has Ended' : 'Your Subscription Is Inactive'}
              </h3>
              <p className="text-xs sm:text-sm text-red-800 mt-0.5">
                Everything for <strong>{restaurant.displayName}</strong> is currently paused. Select a monthly plan below to reactivate your menu, QR ordering, and Kitchen Display terminal immediately.
              </p>
            </div>
          </div>
          <a
            href={supportMailHref}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-200 text-xs font-mono font-bold text-red-900 hover:bg-red-100 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-red-600" />
            <span>{supportEmail}</span>
          </a>
        </div>
      )}

      {checkoutNotice && (
        <div
          role="status"
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            checkoutNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {checkoutNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{checkoutNotice.message}</span>
            {checkoutNotice.paymentUrl && (
              <a
                href={checkoutNotice.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
              >
                <span>Open Razorpay Checkout</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCheckoutNotice(null)}
            aria-label="Dismiss notice"
            className="p-1 rounded-lg hover:bg-black/5 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-5 sm:p-6 bg-gradient-to-br from-espresso-900 to-espresso-800 text-white rounded-3xl shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isSubscriptionExpired
                ? 'bg-red-500/25 text-red-200'
                : isTrialActive
                ? 'bg-amber-400/20 text-amber-200'
                : 'bg-white/10 text-cream-200'
            }`}
          >
            {isSubscriptionExpired
              ? 'Subscription Paused'
              : isTrialActive
              ? `${FREE_TRIAL_DAYS}-Day Free Trial`
              : 'Active Tier'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-cream-100 mt-2">
            {billingUsage?.plan?.name || effectiveAccess?.planName || 'Trial'}
          </h3>
          <p className="text-xs text-cream-300 mt-1">
            Status:{' '}
            {isSubscriptionExpired
              ? 'EXPIRED'
              : billingUsage?.subscription?.status || effectiveAccess?.subscriptionStatus || 'TRIAL'}{' '}
            • Region: {billingUsage?.billingCountry || restaurant.country}
          </p>
          {isTrialActive && effectiveAccess?.trialEndsAt && (
            <p className="text-xs text-amber-200 mt-1">
              Ends {new Date(effectiveAccess.trialEndsAt).toLocaleDateString()} (
              {effectiveAccess.daysRemaining ?? FREE_TRIAL_DAYS}d left) • No payment method required
            </p>
          )}
          {isSubscriptionExpired && (
            <p className="text-xs text-red-200 mt-1">
              Purchase a monthly plan below to reactivate your restaurant workspace.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 text-center w-full md:w-auto">
          <div className="flex-1 md:flex-none p-3 bg-white/10 rounded-2xl min-w-[90px] sm:min-w-[100px]">
            <div className="text-2xl font-bold text-cream-100">
              {billingUsage?.remainingImageCredits ?? 0}
            </div>
            <div className="text-[10px] text-cream-300 uppercase">3D Credits</div>
          </div>
          <div className="flex-1 md:flex-none p-3 bg-white/10 rounded-2xl min-w-[90px] sm:min-w-[100px]">
            <div className="text-2xl font-bold text-cream-100">
              {billingUsage?.chatQueriesThisMonth ?? 0}
            </div>
            <div className="text-[10px] text-cream-300 uppercase">AI Queries</div>
          </div>
        </div>
      </div>

      <div className="p-5 bg-cream-50 rounded-3xl border border-cream-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sage-100 text-sage-800 border border-sage-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {trialDef.name} Plan • 14 Days Free
            </span>
            <span className="text-xs font-mono font-bold text-espresso-900">
              {billingUsage?.billingCountry === 'US' || restaurant.country === 'US' ? '$0' : '₹0'} •
              No Payment Method Required
            </span>
          </div>
          <p className="text-xs text-taupe-600">
            Up to {trialDef.itemLimit} dishes, {trialDef.imageCreditsMonthly} custom 3D credits, and{' '}
            {trialDef.aiQuestionsMonthly.toLocaleString()} AI diner queries during your 14-day onboarding trial.
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold ${
            isTrialEnded
              ? 'bg-red-100 text-red-800 border border-red-200'
              : isTrialActive
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : onTrial
              ? 'bg-cream-200 text-espresso-700'
              : 'bg-cream-200 text-taupe-600'
          }`}
        >
          {isTrialEnded
            ? 'Free Trial Completed'
            : isTrialActive
            ? `Active Trial (${effectiveAccess?.daysRemaining ?? FREE_TRIAL_DAYS}d left)`
            : 'Included at Sign-Up'}
        </span>
      </div>

      <div className="space-y-4 pt-2">
        <div className="p-4 bg-white rounded-2xl border border-cream-200">
          <h3 className="font-serif text-lg font-bold text-espresso-900">
            Paid Subscription Tiers
          </h3>
          <p className="text-xs text-taupe-500">
            {activeBillingCountry === 'US'
              ? 'United States Dollar (USD $) monthly billing plans'
              : 'India Rupee (INR ₹) monthly billing plans'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = !isSubscriptionExpired && billingUsage?.plan?.key === plan.key;
            return (
              <div
                key={plan.key}
                className={`p-6 bg-white rounded-3xl border flex flex-col justify-between shadow-soft ${
                  isCurrent ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-cream-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-serif text-lg font-bold text-espresso-900">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta bg-terracotta-50 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-espresso-900 mb-4">
                    {plan.monthlyPriceFormatted}
                  </div>

                  <ul className="space-y-2 text-xs text-taupe-600 mb-6">
                    <li>
                      • Up to {plan.itemLimit > 1000 ? 'Unlimited' : plan.itemLimit} menu dishes
                    </li>
                    <li>• {plan.imageCreditsMonthly} custom 3D image credits / mo</li>
                    <li>• {plan.aiQuestionsMonthly.toLocaleString()} AI diner queries / mo</li>
                    <li>• Grounded Gemini conversational waiter</li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || startingPlanKey !== null}
                  onClick={async () => {
                    setCheckoutNotice(null);
                    setStartingPlanKey(plan.key);
                    try {
                      const res = await fetch('/api/billing/create-subscription', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          restaurantId: restaurant.id,
                          planKey: plan.key,
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setCheckoutNotice({
                          type: 'error',
                          message: data.error || 'Could not start subscription checkout.',
                        });
                        setStartingPlanKey(null);
                        return;
                      }
                      trackConversionEvent('subscription_started', {
                        planKey: plan.key,
                        currency: plan.currency,
                      });

                      const isMockSession =
                        Boolean(data.isMock) ||
                        data.keyId === 'rzp_test_mock' ||
                        String(data.subscriptionId || '').startsWith('sub_mock_');

                      if (isMockSession) {
                        setCheckoutNotice({
                          type: 'success',
                          message: `Razorpay sandbox subscription initialized for ${plan.name} (Sub ID: ${data.subscriptionId}). Need billing help? Email ${supportEmail}.`,
                        });
                        setStartingPlanKey(null);
                        return;
                      }

                      const scriptLoaded = await loadRazorpayCheckoutScript();
                      if (!scriptLoaded || !window.Razorpay) {
                        setCheckoutNotice({
                          type: data.shortUrl ? 'success' : 'error',
                          message: data.shortUrl
                            ? `Razorpay Checkout modal was blocked by your browser. Continue on Razorpay's hosted page for ${plan.name} (Sub ID: ${data.subscriptionId}).`
                            : `Unable to load Razorpay Checkout script. Please disable any script blocker or email ${supportEmail}.`,
                          paymentUrl: data.shortUrl || null,
                        });
                        setStartingPlanKey(null);
                        return;
                      }

                      const rzp = new window.Razorpay({
                        key: data.keyId,
                        subscription_id: data.subscriptionId,
                        name: 'Menzy',
                        description: `${plan.name} — ${restaurant.displayName || 'Restaurant'}`,
                        prefill: {
                          email: data.customerEmail || undefined,
                          name: data.customerName || undefined,
                        },
                        notes: {
                          restaurantId: restaurant.id,
                          planKey: plan.key,
                        },
                        theme: {
                          color: '#21150F',
                        },
                        handler: async (paymentResponse: {
                          razorpay_payment_id: string;
                          razorpay_subscription_id: string;
                          razorpay_signature: string;
                        }) => {
                          try {
                            const verifyRes = await fetch('/api/billing/verify-subscription', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                restaurantId: restaurant.id,
                                planKey: plan.key,
                                ...paymentResponse,
                              }),
                            });
                            const verifyData = await verifyRes.json().catch(() => ({}));
                            if (!verifyRes.ok) {
                              setCheckoutNotice({
                                type: 'error',
                                message:
                                  verifyData.error ||
                                  `Payment received (ID: ${paymentResponse.razorpay_payment_id}), awaiting confirmation. Need help? Email ${supportEmail}.`,
                              });
                              return;
                            }
                            setCheckoutNotice({
                              type: 'success',
                              message: `${plan.name} is now active! Payment ID: ${paymentResponse.razorpay_payment_id}.`,
                            });
                            await onSubscriptionActivated?.();
                          } catch {
                            setCheckoutNotice({
                              type: 'error',
                              message: `Payment received (ID: ${paymentResponse.razorpay_payment_id}), but status refresh failed. Please reload or email ${supportEmail}.`,
                            });
                          } finally {
                            setStartingPlanKey(null);
                          }
                        },
                        modal: {
                          ondismiss: () => {
                            setStartingPlanKey(null);
                            setCheckoutNotice({
                              type: 'success',
                              message: `Checkout paused for ${plan.name} (Sub ID: ${data.subscriptionId}). You can reopen checkout below or complete payment on Razorpay.`,
                              paymentUrl: data.shortUrl || null,
                            });
                          },
                        },
                      });

                      rzp.on?.('payment.failed', (failure: any) => {
                        setStartingPlanKey(null);
                        setCheckoutNotice({
                          type: 'error',
                          message:
                            failure?.error?.description ||
                            `Payment failed on Razorpay. Need billing help? Email ${supportEmail}.`,
                        });
                      });

                      rzp.open();
                    } catch {
                      setCheckoutNotice({
                        type: 'error',
                        message: `Network error starting checkout. Please try again or email ${supportEmail}.`,
                      });
                      setStartingPlanKey(null);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-cream-200 text-espresso-700 cursor-default'
                      : startingPlanKey !== null
                      ? 'bg-espresso-900/75 text-white cursor-wait'
                      : 'bg-espresso-900 text-white hover:bg-espresso-800'
                  }`}
                >
                  {startingPlanKey === plan.key ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Razorpay...</span>
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    upgradeButtonLabel
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-serif text-base font-bold text-espresso-900">
              Setup-Related Queries &amp; Assisted Activation
            </h4>
            <p className="text-xs text-taupe-600 mt-0.5">
              Email us for help importing your menu, setting up table QRs, or choosing a plan.
            </p>
          </div>
          <a
            href={supportMailHref}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs sm:text-sm font-mono font-bold text-espresso-900 transition-colors"
          >
            <Mail className="w-4 h-4 text-terracotta" />
            <span>{supportEmail}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

