'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Utensils,
  CreditCard,
  DollarSign,
  Bot,
  Sparkles,
  Link2,
  Gift,
  CheckCircle2,
  XCircle,
  ExternalLink,
  LogOut,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export default function SuperAdminPortalPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'restaurants' | 'subscriptions' | 'costs' | 'canonical' | 'claims'>('overview');
  const [loading, setLoading] = useState(true);

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [costsData, setCostsData] = useState<any>(null);
  const [canonicalDishes, setCanonicalDishes] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);

  // Modals
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [grantType, setGrantType] = useState('COMPLIMENTARY_PLAN');
  const [grantTier, setGrantTier] = useState('PRO');
  const [grantQuantity, setGrantQuantity] = useState(50);
  const [grantDays, setGrantDays] = useState(14);
  const [founderReason, setFounderReason] = useState('');

  // Demo creator modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoCountry, setDemoCountry] = useState('IN');
  const [demoCity, setDemoCity] = useState('Mumbai');
  const [generatedClaimUrl, setGeneratedClaimUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [rRes, sRes, cRes, canonRes, claimRes] = await Promise.all([
          fetch('/api/admin/restaurants'),
          fetch('/api/admin/subscriptions'),
          fetch('/api/admin/costs'),
          fetch('/api/admin/canonical'),
          fetch('/api/admin/claims'),
        ]);

        if (rRes.status === 401 || sRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (rRes.ok) {
          const rData = await rRes.json();
          setRestaurants(rData.restaurants || []);
        }
        if (sRes.ok) {
          setSubscriptionData(await sRes.json());
        }
        if (cRes.ok) {
          setCostsData(await cRes.json());
        }
        if (canonRes.ok) {
          const canonData = await canonRes.json();
          setCanonicalDishes(canonData.dishes || []);
        }
        if (claimRes.ok) {
          const clData = await claimRes.json();
          setClaims(clData.claims || []);
        }
      } catch (err) {
        console.error('Super-admin load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleGrantEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !founderReason) return;

    const res = await fetch('/api/admin/entitlements/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: selectedOrgId,
        grantType,
        tierOrValue: grantTier,
        quantity: grantQuantity,
        durationDays: grantDays,
        founderReason,
      }),
    });

    if (res.ok) {
      alert('Complimentary entitlement granted & audited successfully!');
      setIsGrantModalOpen(false);
      setFounderReason('');
      // Reload subscriptions
      const sRes = await fetch('/api/admin/subscriptions');
      if (sRes.ok) setSubscriptionData(await sRes.json());
    }
  };

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) return;

    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: demoName,
        country: demoCountry,
        city: demoCity,
        currency: demoCountry === 'US' ? 'USD' : 'INR',
        sampleDishes: [
          { name: 'Signature House Tartine', priceMinor: demoCountry === 'US' ? 1400 : 26000 },
          { name: 'Cold Pressed Citrus Refresher', priceMinor: demoCountry === 'US' ? 650 : 18000 },
        ],
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setGeneratedClaimUrl(data.claimUrl);
      // Reload restaurants
      const rRes = await fetch('/api/admin/restaurants');
      if (rRes.ok) setRestaurants((await rRes.json()).restaurants || []);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    const notes = prompt('Enter verification notes / reason for claim approval:');
    if (notes == null) return;

    const res = await fetch('/api/admin/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'APPROVE_CLAIM',
        claimId,
        verificationNotes: notes,
      }),
    });

    if (res.ok) {
      alert('Claim verified and restaurant ownership transferred!');
      const clRes = await fetch('/api/admin/claims');
      if (clRes.ok) setClaims((await clRes.json()).claims || []);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espresso-950 text-cream-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif">Loading Founder Console...</p>
        </div>
      </div>
    );
  }

  const globalMetrics = costsData?.global || {
    totalAiCostUsd: 0,
    totalAiRequests: 0,
    totalTokens: 0,
    totalImages: 0,
  };

  return (
    <div className="min-h-screen bg-espresso-950 text-cream-100 flex flex-col">
      {/* Top Founder Bar */}
      <header className="px-6 py-4 bg-espresso-900 border-b border-espresso-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-terracotta text-white flex items-center justify-center font-bold text-sm shadow">
            D
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-cream-50">Dishora Founder Portal</h1>
            <p className="text-[10px] text-taupe-400">Production SaaS Operations & Multi-Tenant Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-600 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Create Demo Menu
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-taupe-400 hover:text-white hover:bg-espresso-800 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="px-6 bg-espresso-900/60 border-b border-espresso-800 overflow-x-auto flex items-center gap-1 shrink-0">
        {[
          { key: 'overview', label: 'Operations Overview' },
          { key: 'restaurants', label: `Restaurants (${restaurants.length})` },
          { key: 'subscriptions', label: `Subscriptions (${subscriptionData?.subscriptions?.length || 0})` },
          { key: 'costs', label: 'AI Cost Intelligence' },
          { key: 'canonical', label: `Canonical Library (${canonicalDishes.length})` },
          { key: 'claims', label: `Claims Review (${claims.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeSection === tab.key
                ? 'border-terracotta text-cream-50 bg-espresso-800/40'
                : 'border-transparent text-taupe-400 hover:text-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
        {/* =========================================================================
            SECTION 1: OVERVIEW & WATCHLISTS
        ========================================================================= */}
        {activeSection === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top SaaS KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-espresso-900 rounded-2xl border border-espresso-800 shadow">
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">Total Active Subscribers</span>
                <div className="text-3xl font-bold text-cream-50 mt-1">{subscriptionData?.metrics?.totalActive || 0}</div>
                <div className="text-xs text-sage-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Multi-tenant retention active
                </div>
              </div>

              <div className="p-5 bg-espresso-900 rounded-2xl border border-espresso-800 shadow">
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
                <div className="text-2xl font-bold text-terracotta mt-1">
                  ₹{subscriptionData?.metrics?.inrMrr || 0} / ${subscriptionData?.metrics?.usdMrr || 0}
                </div>
                <div className="text-xs text-taupe-400 mt-1">Dual-market INR & USD</div>
              </div>

              <div className="p-5 bg-espresso-900 rounded-2xl border border-espresso-800 shadow">
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">Monthly AI Operating Cost</span>
                <div className="text-2xl font-bold text-cream-50 mt-1">
                  ${globalMetrics.totalAiCostUsd}
                </div>
                <div className="text-xs text-taupe-400 mt-1">{globalMetrics.totalAiRequests} total requests</div>
              </div>

              <div className="p-5 bg-espresso-900 rounded-2xl border border-espresso-800 shadow">
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">Renewals Within 7 Days</span>
                <div className="text-3xl font-bold text-amber-400 mt-1">{subscriptionData?.metrics?.renewingIn7DaysCount || 0}</div>
                <div className="text-xs text-taupe-400 mt-1">Renewal watchlist</div>
              </div>
            </div>

            {/* Renewal Watchlist Table */}
            <div className="bg-espresso-900 rounded-3xl border border-espresso-800 p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-cream-50">Subscription Watchlist</h3>
                <span className="text-xs text-taupe-400">Sorted by paid-through date</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-espresso-950 text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4">Organization / Restaurant</th>
                      <th className="py-3 px-4">Plan Key</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Paid Through</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800">
                    {subscriptionData?.subscriptions?.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-espresso-800/40">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-cream-50">{sub.organization.name}</div>
                          <div className="text-taupe-400 text-[11px]">{sub.organization.restaurants[0]?.displayName}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-cream-200">{sub.planKey}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.status === 'ACTIVE' ? 'bg-sage-950 text-sage-300' : 'bg-red-950 text-red-300'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-taupe-300">
                          {sub.paidThrough ? new Date(sub.paidThrough).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrgId(sub.organizationId);
                              setIsGrantModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-espresso-800 hover:bg-espresso-700 text-cream-200 text-xs font-semibold"
                          >
                            Grant Entitlement
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2: RESTAURANTS DIRECTORY
        ========================================================================= */}
        {activeSection === 'restaurants' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-cream-50">Tenant Restaurants</h3>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-600 shadow"
              >
                + New Founder Demo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((r) => (
                <div key={r.id} className="p-5 bg-espresso-900 rounded-2xl border border-espresso-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-cream-50 truncate">{r.displayName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isClaimed ? 'bg-sage-950 text-sage-300' : 'bg-amber-950 text-amber-300'}`}>
                      {r.isClaimed ? 'Claimed' : 'Founder Demo'}
                    </span>
                  </div>
                  <p className="text-xs text-taupe-400 line-clamp-2">{r.description || 'No description'}</p>
                  <div className="text-xs text-taupe-300 font-mono">
                    Slug: /m/{r.slug} • {r.country} ({r.currency})
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-espresso-800 text-xs">
                    <span className="text-taupe-400">{r._count?.menuItems || 0} menu dishes</span>
                    <a
                      href={`/m/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terracotta hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      Inspect Live <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: AI OPERATING COST BREAKDOWN
        ========================================================================= */}
        {activeSection === 'costs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-espresso-900 rounded-3xl border border-espresso-800 p-6 shadow space-y-4">
              <h3 className="font-serif text-lg font-bold text-cream-50">Per-Restaurant Operational Margins</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-espresso-950 text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4">Restaurant</th>
                      <th className="py-3 px-4">Plan / Rev</th>
                      <th className="py-3 px-4">AI Queries</th>
                      <th className="py-3 px-4">Images Gen</th>
                      <th className="py-3 px-4">AI Cost (USD)</th>
                      <th className="py-3 px-4 text-right">Est. Gross Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800">
                    {costsData?.restaurants?.map((item: any) => (
                      <tr key={item.restaurantId} className="hover:bg-espresso-800/40">
                        <td className="py-3 px-4 font-semibold text-cream-50">{item.restaurantName}</td>
                        <td className="py-3 px-4 text-taupe-300">{item.subscriptionPlan}</td>
                        <td className="py-3 px-4 text-cream-200">{item.totalAiRequests}</td>
                        <td className="py-3 px-4 text-cream-200">{item.imagesGenerated}</td>
                        <td className="py-3 px-4 font-mono font-bold text-terracotta">${item.aiOperatingCostUsd}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sage-400">${item.estimatedMarginUsd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: CLAIMS REVIEW QUEUE
        ========================================================================= */}
        {activeSection === 'claims' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-espresso-900 rounded-3xl border border-espresso-800 p-6 shadow">
              <h3 className="font-serif text-lg font-bold text-cream-50 mb-4">Ownership Claim Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-espresso-950 text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4">Venue</th>
                      <th className="py-3 px-4">Claimant Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800">
                    {claims.map((cl) => (
                      <tr key={cl.id} className="hover:bg-espresso-800/40">
                        <td className="py-3 px-4 font-semibold text-cream-50">{cl.restaurant?.displayName}</td>
                        <td className="py-3 px-4 text-taupe-300">{cl.claimantEmail || 'Unclaimed link'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cl.status === 'APPROVED' ? 'bg-sage-950 text-sage-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {cl.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-taupe-400">{new Date(cl.expiresAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          {cl.status === 'PENDING_VERIFICATION' && (
                            <button
                              onClick={() => handleApproveClaim(cl.id)}
                              className="px-3 py-1 rounded bg-sage-700 text-white font-semibold text-xs hover:bg-sage-600"
                            >
                              Approve Claim
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Grant Entitlement Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="p-6 bg-espresso-900 border border-espresso-800 rounded-3xl max-w-md w-full shadow-lifted space-y-4">
            <h3 className="font-serif text-xl font-bold text-cream-50">Grant Complimentary Entitlement</h3>
            <p className="text-xs text-taupe-400">
              Overrides effective tenant privileges without falsifying Razorpay payment contracts.
            </p>
            <form onSubmit={handleGrantEntitlement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-taupe-400 mb-1">Grant Type</label>
                <select
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                >
                  <option value="COMPLIMENTARY_PLAN">Complimentary Plan Upgrade (Pro/Growth)</option>
                  <option value="BONUS_IMAGE_CREDITS">Bonus 3D Image Credits</option>
                  <option value="BONUS_AI_QUESTIONS">Bonus AI Chat Questions</option>
                  <option value="EXTENSION">Subscription Duration Extension</option>
                </select>
              </div>

              {grantType === 'COMPLIMENTARY_PLAN' && (
                <div>
                  <label className="block text-xs font-semibold text-taupe-400 mb-1">Tier</label>
                  <select
                    value={grantTier}
                    onChange={(e) => setGrantTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                  >
                    <option value="PRO">Pro Tier</option>
                    <option value="GROWTH">Growth Tier</option>
                  </select>
                </div>
              )}

              {grantType === 'BONUS_IMAGE_CREDITS' && (
                <div>
                  <label className="block text-xs font-semibold text-taupe-400 mb-1">Credits Quantity</label>
                  <input
                    type="number"
                    value={grantQuantity}
                    onChange={(e) => setGrantQuantity(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-taupe-400 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  value={grantDays}
                  onChange={(e) => setGrantDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-taupe-400 mb-1">Founder Reason (Audited)</label>
                <textarea
                  required
                  rows={2}
                  value={founderReason}
                  onChange={(e) => setFounderReason(e.target.value)}
                  placeholder="e.g. VIP partner launch extension / customer support goodwill"
                  className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta-600"
                >
                  Apply Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demo Restaurant Creator Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="p-6 bg-espresso-900 border border-espresso-800 rounded-3xl max-w-md w-full shadow-lifted space-y-4">
            <h3 className="font-serif text-xl font-bold text-cream-50">Create Authorized Demo Menu</h3>
            <form onSubmit={handleCreateDemo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-taupe-400 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  placeholder="e.g. Blue Bottle Specialty Bar"
                  className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-taupe-400 mb-1">Country</label>
                <select
                  value={demoCountry}
                  onChange={(e) => setDemoCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-espresso-950 border border-espresso-800 text-xs text-cream-50"
                >
                  <option value="IN">India (INR)</option>
                  <option value="US">United States (USD)</option>
                </select>
              </div>

              {generatedClaimUrl && (
                <div className="p-3 bg-sage-950/80 border border-sage-800 text-sage-200 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-sage-300">Demo & Claim Link Ready!</div>
                  <div className="break-all font-mono text-[11px] text-white select-all">{generatedClaimUrl}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoModalOpen(false);
                    setGeneratedClaimUrl(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
                >
                  Done
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-terracotta text-white font-semibold text-xs hover:bg-terracotta-600"
                >
                  Create Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
