'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Mail, ShieldCheck, X } from 'lucide-react';
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
  checkoutNotice: { type: 'success' | 'error'; message: string } | null;
  setCheckoutNotice: (notice: { type: 'success' | 'error'; message: string } | null) => void;
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
}: DashboardBillingTabProps) {
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
          <div className="flex items-center gap-2">
            {checkoutNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{checkoutNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutNotice(null)}
            aria-label="Dismiss notice"
            className="p-1 rounded-lg hover:bg-black/5"
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
                  disabled={isCurrent}
                  onClick={async () => {
                    setCheckoutNotice(null);
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
                      return;
                    }
                    trackConversionEvent('subscription_started', {
                      planKey: plan.key,
                      currency: plan.currency,
                    });
                    setCheckoutNotice({
                      type: 'success',
                      message: `Razorpay subscription initialized for ${plan.name} (Sub ID: ${data.subscriptionId}). Need billing help? Email ${supportEmail}.`,
                    });
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-cream-200 text-espresso-700 cursor-default'
                      : 'bg-espresso-900 text-white hover:bg-espresso-800'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : upgradeButtonLabel}
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

