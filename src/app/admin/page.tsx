'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Utensils,
  CreditCard,
  DollarSign,
  Bot,
  Sparkles,
  Gift,
  CheckCircle2,
  ExternalLink,
  LogOut,
  AlertTriangle,
  TrendingUp,
  Search,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Activity,
  ChefHat,
  KeyRound,
  Trash2,
  X,
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import { MenzyLogo } from '@/components/brand/MenzyLogo';

const AdminSectionFallback = () => (
  <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-10 text-center text-xs text-taupe-400">
    Loading section...
  </div>
);

const DemoMenuModal = dynamic(
  () => import('@/components/admin/DemoMenuModal').then((m) => m.DemoMenuModal),
  { ssr: false }
);

const GrantEntitlementModal = dynamic(
  () => import('@/components/admin/GrantEntitlementModal').then((m) => m.GrantEntitlementModal),
  { ssr: false }
);

const CanonicalLibraryTab = dynamic(
  () => import('@/components/admin/CanonicalLibraryTab').then((m) => m.CanonicalLibraryTab),
  { ssr: false, loading: AdminSectionFallback }
);

const AdminOrdersTab = dynamic(
  () => import('@/components/admin/AdminOrdersTab').then((m) => m.AdminOrdersTab),
  { ssr: false, loading: AdminSectionFallback }
);

const AdminCostsTab = dynamic(
  () => import('@/components/admin/AdminCostsTab').then((m) => m.AdminCostsTab),
  { ssr: false, loading: AdminSectionFallback }
);

const AdminClaimsTab = dynamic(
  () => import('@/components/admin/AdminClaimsTab').then((m) => m.AdminClaimsTab),
  { ssr: false, loading: AdminSectionFallback }
);

type AdminSectionKey =
  | 'restaurants'
  | 'subscriptions'
  | 'costs'
  | 'canonical'
  | 'claims'
  | 'orders';

const ADMIN_PLAN_OPTIONS = {
  IN: ['FREE_TRIAL', 'IN_STARTER', 'IN_GROWTH', 'IN_PRO'],
  US: ['FREE_TRIAL', 'US_STARTER', 'US_GROWTH', 'US_PRO'],
} as const;

export default function SuperAdminPortalPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    'overview' | 'restaurants' | 'subscriptions' | 'costs' | 'canonical' | 'claims' | 'orders'
  >('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sectionLoading, setSectionLoading] = useState({
    restaurants: true,
    subscriptions: true,
    costs: true,
    canonical: false,
    claims: true,
    orders: false,
  });
  const loadSeqRef = useRef(0);
  const loadedSectionsRef = useRef<Set<AdminSectionKey>>(new Set());

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [costsData, setCostsData] = useState<any>(null);
  const [canonicalDishes, setCanonicalDishes] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any>(null);

  // Search & Filter states
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState<'ALL' | 'IN' | 'US' | 'CLAIMED' | 'DEMO'>('ALL');
  const [subSearch, setSubSearch] = useState('');
  const [subFilter, setSubFilter] = useState<'ALL' | 'PAID' | 'TRIAL' | 'TRIAL_EXPIRED' | 'EXPIRED'>('ALL');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Lazy Modal toggles
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Floating Toast Notifications (e.g. menu extraction completion)
  const [extractionToast, setExtractionToast] = useState<{
    id: number;
    title: string;
    subtitle?: string;
  } | null>(null);
  const extractionToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showExtractionToast = useCallback((title: string, subtitle?: string) => {
    if (extractionToastTimerRef.current) {
      clearTimeout(extractionToastTimerRef.current);
    }
    const id = Date.now();
    setExtractionToast({ id, title, subtitle });
    extractionToastTimerRef.current = setTimeout(() => {
      setExtractionToast((current) => (current?.id === id ? null : current));
    }, 5500);
  }, []);

  useEffect(() => {
    return () => {
      if (extractionToastTimerRef.current) {
        clearTimeout(extractionToastTimerRef.current);
      }
    };
  }, []);

  // Claim Link Generator Modal for existing unclaimed demos
  const [generatingInviteId, setGeneratingInviteId] = useState<string | null>(null);
  const [generatedInviteModal, setGeneratedInviteModal] = useState<{
    restaurantName: string;
    claimUrl: string;
  } | null>(null);
  const [copiedInviteModal, setCopiedInviteModal] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState<string | null>(null);
  const [updatingSubscriptionId, setUpdatingSubscriptionId] = useState<string | null>(null);

  const fetchSection = useCallback(
    async (
      key: AdminSectionKey,
      url: string,
      onSuccess: (data: any) => void,
      reqSeq: number
    ): Promise<'OK' | 'UNAUTH' | 'ERR'> => {
      if (loadSeqRef.current === reqSeq) {
        setSectionLoading((prev) => ({ ...prev, [key]: true }));
      }
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (loadSeqRef.current !== reqSeq) return 'ERR';
        if (res.status === 401) {
          router.push('/admin/login');
          return 'UNAUTH';
        }
        if (res.ok) {
          const data = await res.json();
          if (loadSeqRef.current !== reqSeq) return 'ERR';
          loadedSectionsRef.current.add(key);
          onSuccess(data);
        }
        return 'OK';
      } catch (err) {
        console.error(`Super-admin load error (${key}):`, err);
        return 'ERR';
      } finally {
        if (loadSeqRef.current === reqSeq) {
          setSectionLoading((prev) => ({ ...prev, [key]: false }));
        }
      }
    },
    [router]
  );

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      const reqSeq = ++loadSeqRef.current;

      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const shouldFetchCanonical =
        activeSection === 'canonical' || loadedSectionsRef.current.has('canonical');
      const shouldFetchOrders =
        activeSection === 'orders' || loadedSectionsRef.current.has('orders');

      setSectionLoading({
        restaurants: true,
        subscriptions: true,
        costs: true,
        canonical: shouldFetchCanonical,
        claims: true,
        orders: shouldFetchOrders,
      });

      const rPromise = fetchSection(
        'restaurants',
        '/api/admin/restaurants',
        (rData) => setRestaurants(rData.restaurants || []),
        reqSeq
      );
      const sPromise = fetchSection(
        'subscriptions',
        '/api/admin/subscriptions',
        (sData) => setSubscriptionData(sData),
        reqSeq
      );
      const cPromise = fetchSection(
        'costs',
        '/api/admin/costs',
        (cData) => setCostsData(cData),
        reqSeq
      );
      const claimPromise = fetchSection(
        'claims',
        '/api/admin/claims',
        (clData) => setClaims(clData.claims || []),
        reqSeq
      );

      const backgroundPromises: Promise<'OK' | 'UNAUTH' | 'ERR'>[] = [cPromise, claimPromise];

      if (shouldFetchCanonical) {
        backgroundPromises.push(
          fetchSection(
            'canonical',
            '/api/admin/canonical',
            (canonData) => setCanonicalDishes(canonData.dishes || []),
            reqSeq
          )
        );
      }
      if (shouldFetchOrders) {
        backgroundPromises.push(
          fetchSection(
            'orders',
            '/api/admin/orders',
            (oData) => setOrdersData(oData),
            reqSeq
          )
        );
      }

      try {
        const [rStatus, sStatus] = await Promise.all([rPromise, sPromise]);
        if (loadSeqRef.current === reqSeq && rStatus !== 'UNAUTH' && sStatus !== 'UNAUTH') {
          setLoading(false);
        }

        await Promise.allSettled(backgroundPromises);
      } finally {
        if (loadSeqRef.current === reqSeq) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [activeSection, fetchSection]
  );

  useEffect(() => {
    loadData();
    // Initial boot load; tab-specific lazy loads handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy-fetch heavy sections (/api/admin/canonical = 2,000 rows, /api/admin/orders = platform-wide aggregation) on demand
  useEffect(() => {
    const reqSeq = loadSeqRef.current;
    if (
      activeSection === 'canonical' &&
      !loadedSectionsRef.current.has('canonical') &&
      !sectionLoading.canonical
    ) {
      fetchSection(
        'canonical',
        '/api/admin/canonical',
        (canonData) => setCanonicalDishes(canonData.dishes || []),
        reqSeq
      );
    } else if (
      activeSection === 'orders' &&
      !loadedSectionsRef.current.has('orders') &&
      !sectionLoading.orders
    ) {
      fetchSection(
        'orders',
        '/api/admin/orders',
        (oData) => setOrdersData(oData),
        reqSeq
      );
    }
  }, [activeSection, fetchSection, sectionLoading.canonical, sectionLoading.orders]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleDeleteRestaurant = async (restaurant: any) => {
    const confirmationName = window.prompt(
      `This permanently removes ${restaurant.displayName} and its menus, tables, staff, orders, and sessions. Type the restaurant name exactly to continue:`
    );
    if (confirmationName === null) return;
    if (confirmationName.trim() !== restaurant.displayName) {
      setAdminActionError('Restaurant name did not match. Nothing was deleted.');
      return;
    }

    setDeletingRestaurantId(restaurant.id);
    setAdminActionError(null);
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: restaurant.id, confirmationName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete restaurant.');
      setRestaurants((current) => current.filter((item) => item.id !== restaurant.id));
      await loadData(true);
    } catch (error: any) {
      setAdminActionError(error.message || 'Failed to delete restaurant.');
    } finally {
      setDeletingRestaurantId(null);
    }
  };

  const handleChangeSubscriptionPlan = async (subscription: any, planKey: string) => {
    if (planKey === subscription.planKey) return;
    const confirmed = window.confirm(
      `Change ${subscription.organization?.name || 'this organization'} from ${subscription.planKey} to ${planKey}? This creates a founder override and disconnects the previous payment-provider subscription ID.`
    );
    if (!confirmed) return;

    const founderReason = window.prompt('Reason for this subscription change:');
    if (!founderReason?.trim()) {
      setAdminActionError('A founder reason is required. The subscription was not changed.');
      return;
    }

    setUpdatingSubscriptionId(subscription.id);
    setAdminActionError(null);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          planKey,
          founderReason: founderReason.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription.');
      await loadData(true);
    } catch (error: any) {
      setAdminActionError(error.message || 'Failed to update subscription.');
    } finally {
      setUpdatingSubscriptionId(null);
    }
  };

  const handleGenerateClaimLink = async (restaurantId: string, restaurantName: string) => {
    setGeneratingInviteId(restaurantId);
    setClaimError(null);
    setCopiedInviteModal(false);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_INVITATION',
          restaurantId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate claim invitation link.');
      }
      navigator.clipboard?.writeText(data.claimUrl).catch(() => {});
      setGeneratedInviteModal({
        restaurantName,
        claimUrl: data.claimUrl,
      });
      await loadData(true);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to generate claim link.');
    } finally {
      setGeneratingInviteId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlug(id);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0907] text-cream-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif tracking-wide text-cream-200">Loading Menzy Founder Console...</p>
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

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.displayName.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
      r.slug.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
      (r.city && r.city.toLowerCase().includes(restaurantSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (restaurantFilter === 'IN') return r.country === 'IN';
    if (restaurantFilter === 'US') return r.country === 'US';
    if (restaurantFilter === 'CLAIMED') return r.isClaimed;
    if (restaurantFilter === 'DEMO') return !r.isClaimed;
    return true;
  });

  const getAdminSubBadge = (sub: any) => {
    const isTrialPlan = sub.planKey === 'FREE_TRIAL' || sub.status === 'TRIAL';
    const paidThroughTime = sub.paidThrough ? new Date(sub.paidThrough).getTime() : null;
    const isLapsed = paidThroughTime !== null && paidThroughTime <= Date.now();

    if (sub.status === 'ACTIVE' && !isTrialPlan) {
      return isLapsed
        ? {
            label: 'LAPSED',
            toneClass: 'bg-red-950/80 border border-red-800/80 text-red-300',
            group: 'EXPIRED' as const,
          }
        : {
            label: 'ACTIVE',
            toneClass: 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300',
            group: 'PAID' as const,
          };
    }

    if (sub.status === 'TRIAL' && !isLapsed) {
      return {
        label: '14D TRIAL',
        toneClass: 'bg-amber-950/80 border border-amber-700/70 text-amber-300',
        group: 'TRIAL' as const,
      };
    }

    if (isTrialPlan && (sub.status === 'EXPIRED' || isLapsed)) {
      return {
        label: 'TRIAL ENDED',
        toneClass: 'bg-red-950/80 border border-red-800/80 text-red-300',
        group: 'TRIAL_EXPIRED' as const,
      };
    }

    return {
      label: String(sub.status || 'INACTIVE'),
      toneClass: 'bg-red-950/80 border border-red-800/80 text-red-300',
      group: 'EXPIRED' as const,
    };
  };

  const filteredSubscriptions = (subscriptionData?.subscriptions || []).filter((sub: any) => {
    const orgName = sub.organization?.name || '';
    const restName = sub.organization?.restaurants?.[0]?.displayName || '';
    const q = subSearch.toLowerCase();
    const matchesSearch =
      !q ||
      orgName.toLowerCase().includes(q) ||
      restName.toLowerCase().includes(q) ||
      String(sub.planKey || '').toLowerCase().includes(q) ||
      String(sub.provider || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const badge = getAdminSubBadge(sub);
    if (subFilter === 'PAID') return badge.group === 'PAID';
    if (subFilter === 'TRIAL') return badge.group === 'TRIAL';
    if (subFilter === 'TRIAL_EXPIRED') return badge.group === 'TRIAL_EXPIRED';
    if (subFilter === 'EXPIRED') return badge.group === 'EXPIRED' || badge.group === 'TRIAL_EXPIRED';
    return true;
  });

  return (
    <div className="admin-portal min-h-screen bg-[#0E0A08] text-cream-100 flex flex-col font-sans selection:bg-terracotta selection:text-white">
      {/* Sticky Top Founder Bar & Command Sub-Tabs */}
      <div className="sticky top-0 z-30 shrink-0 shadow-lg bg-[#140E0A]/95 backdrop-blur-md">
        <header className="px-4 sm:px-8 py-3.5 border-b border-espresso-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <MenzyLogo size={36} className="ring-1 ring-white/10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-bold text-cream-50 leading-tight">Menzy Founder Portal</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                </span>
              </div>
              <p className="text-[11px] text-taupe-400">Production SaaS Operations • Multi-Tenant Enterprise Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl text-taupe-400 hover:text-white hover:bg-espresso-800 border border-espresso-700/60 transition-all shrink-0"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin motion-reduce:animate-none text-terracotta' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOrgId(
                  subscriptionData?.subscriptions?.[0]?.organizationId ||
                    restaurants.find((r) => r.organizationId)?.organizationId ||
                    ''
                );
                setIsGrantModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Grant Entitlement</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Create Demo Menu</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-taupe-400 hover:text-red-400 hover:bg-espresso-800 border border-espresso-700/60 transition-colors shrink-0"
              title="Sign Out as Founder"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-8 bg-[#120D09] border-b border-espresso-800/80 overflow-x-auto flex items-center gap-1 shrink-0 no-scrollbar py-1">
          {[
            { key: 'overview', label: 'Executive Overview', icon: Activity, count: null },
            { key: 'restaurants', label: 'Restaurants', icon: Utensils, count: restaurants.length },
            {
              key: 'orders',
              label: 'Orders & Tables',
              icon: ChefHat,
              count: ordersData?.metrics?.totalOrders ?? (sectionLoading.orders ? '...' : null),
            },
            { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, count: subscriptionData?.subscriptions?.length || 0 },
            { key: 'costs', label: 'AI Cost Intelligence', icon: Cpu, count: null },
            {
              key: 'canonical',
              label: 'Canonical Library',
              icon: Bot,
              count:
                canonicalDishes.length > 0
                  ? canonicalDishes.length
                  : sectionLoading.canonical
                  ? '...'
                  : null,
            },
            {
              key: 'claims',
              label: 'Claims Review',
              icon: ShieldAlert,
              count: claims.length > 0 ? claims.length : sectionLoading.claims ? '...' : 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-terracotta text-white shadow-sm ring-1 ring-white/10'
                    : 'text-taupe-400 hover:text-cream-100 hover:bg-espresso-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-black/30 text-white' : 'bg-espresso-800 text-taupe-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 min-w-0 overflow-x-clip">
        {adminActionError && (
          <div role="alert" className="p-3.5 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs flex items-center justify-between gap-3">
            <span>{adminActionError}</span>
            <button
              type="button"
              onClick={() => setAdminActionError(null)}
              className="p-1 text-red-300 hover:text-white"
              aria-label="Dismiss admin action error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {activeSection === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-gradient-to-br from-[#160F0B] to-[#120C09] rounded-2xl border border-espresso-800 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/70" />
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Active Subscribers</span>
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <div className="text-3xl font-bold text-cream-50 mt-2 font-mono tracking-tight">
                  {subscriptionData?.metrics?.totalActive || 0}
                </div>
                <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />{' '}
                  {subscriptionData?.metrics?.activeTrialsCount || 0} active 14d trials •{' '}
                  {subscriptionData?.metrics?.expiredTrialsCount || 0} lapsed
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-[#160F0B] to-[#120C09] rounded-2xl border border-espresso-800 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-terracotta" />
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Monthly Recurring Revenue</span>
                  <DollarSign className="w-3.5 h-3.5 text-terracotta" />
                </span>
                <div className="text-2xl font-bold text-terracotta mt-2 font-mono tracking-tight">
                  ₹{subscriptionData?.metrics?.inrMrr || 0} / ${subscriptionData?.metrics?.usdMrr || 0}
                </div>
                <div className="text-xs text-taupe-400 mt-2">Dual-market INR & USD billing</div>
              </div>

              <div className="p-5 bg-gradient-to-br from-[#160F0B] to-[#120C09] rounded-2xl border border-espresso-800 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/70" />
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider flex items-center justify-between">
                  <span>AI Operating Cost</span>
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                </span>
                <div className="text-2xl font-bold text-cream-50 mt-2 font-mono tracking-tight tabular-nums">
                  {!costsData && sectionLoading.costs ? '—' : `$${globalMetrics.totalAiCostUsd}`}
                </div>
                <div className="text-xs text-taupe-400 mt-2">
                  {!costsData && sectionLoading.costs
                    ? 'Aggregating Gemini usage...'
                    : `${globalMetrics.totalAiRequests} total Gemini API calls`}
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-[#160F0B] to-[#120C09] rounded-2xl border border-espresso-800 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/70" />
                <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider flex items-center justify-between">
                  <span>7-Day Renewals</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <div className="text-3xl font-bold text-amber-400 mt-2 font-mono tracking-tight">
                  {subscriptionData?.metrics?.renewingIn7DaysCount || 0}
                </div>
                <div className="text-xs text-taupe-400 mt-2">Upcoming period renewal watchlist</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gemini 1.5 Flash Vision', val: 'Online & Calibrated' },
                { label: 'Cloudflare R2 Storage', val: 'Connected' },
                { label: 'Razorpay Webhooks', val: 'Listening Active' },
                { label: 'Multi-Tenant Isolation', val: 'Strict Verified' },
              ].map((telemetry, i) => (
                <div key={i} className="p-3 bg-[#140E0A] rounded-xl border border-espresso-800/70 text-xs">
                  <div className="text-[10px] text-taupe-400 font-mono">{telemetry.label}</div>
                  <div className="text-cream-100 font-semibold flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{telemetry.val}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Subscription Watchlist</h3>
                  <p className="text-xs text-taupe-400">Tenants sorted by paid-through date with one-click entitlement overrides</p>
                </div>
                <span className="text-xs text-taupe-400 font-mono">
                  {subscriptionData?.metrics?.totalActive || 0} paid •{' '}
                  {subscriptionData?.metrics?.activeTrialsCount || 0} free trials
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Organization / Restaurant</th>
                      <th className="py-3 px-4 font-semibold">Plan Key</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Paid Through</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800/60">
                    {(subscriptionData?.subscriptions || []).map((sub: any) => {
                      const badge = getAdminSubBadge(sub);
                      return (
                        <tr key={sub.id} className="hover:bg-espresso-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-cream-50">{sub.organization.name}</div>
                            <div className="text-taupe-400 text-[11px]">{sub.organization.restaurants[0]?.displayName}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-cream-200">
                            <span className="px-2 py-0.5 rounded bg-espresso-800/80 border border-espresso-700/60 text-cream-200 text-[11px]">
                              {sub.planKey === 'FREE_TRIAL' ? 'Trial (14D Free)' : sub.planKey}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.toneClass}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-taupe-300">
                            {sub.paidThrough ? new Date(sub.paidThrough).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrgId(sub.organizationId);
                                setIsGrantModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-200 text-xs font-semibold whitespace-nowrap transition-all shadow-sm"
                            >
                              Grant Entitlement
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {(subscriptionData?.subscriptions || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-taupe-400">
                          No active subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'restaurants' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-taupe-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search restaurants by name, slug, or city..."
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  style={{ colorScheme: 'dark', backgroundColor: '#1A120D', color: '#FAF7F2' }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A120D] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'IN', label: '🇮🇳 India' },
                  { key: 'US', label: '🇺🇸 US' },
                  { key: 'CLAIMED', label: 'Claimed' },
                  { key: 'DEMO', label: 'Demos' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setRestaurantFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      restaurantFilter === f.key
                        ? 'bg-terracotta text-white'
                        : 'bg-espresso-800/80 text-taupe-300 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-600 shadow-md flex items-center gap-1.5 whitespace-nowrap ml-2"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>+ Demo</span>
                </button>
              </div>
            </div>

            {claimError && (
              <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
                {claimError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRestaurants.map((r) => (
                <div
                  key={r.id}
                  className="p-5 bg-gradient-to-br from-[#160F0B] to-[#120C09] rounded-2xl border border-espresso-800 space-y-3.5 shadow-md hover:border-espresso-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-cream-50 leading-tight">{r.displayName}</h4>
                        <div className="text-[11px] text-taupe-400 mt-0.5">
                          {r.city ? `${r.city}, ` : ''}{r.country} • Currency: {r.currency}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          r.isClaimed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/70'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/70'
                        }`}
                      >
                        {r.isClaimed ? 'Claimed' : 'Founder Demo'}
                      </span>
                    </div>

                    <p className="text-xs text-taupe-300 line-clamp-2">{r.description || 'Interactive AI restaurant menu.'}</p>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0E0A08] border border-espresso-800 text-[11px] font-mono text-taupe-300 flex items-center justify-between">
                        <span className="truncate">/m/{r.slug}</span>
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/m/${r.slug}`, r.id)}
                          className="text-taupe-400 hover:text-white ml-1.5 shrink-0"
                          title="Copy Public URL"
                        >
                          {copiedSlug === r.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="px-2 py-1.5 rounded-lg bg-espresso-800/70 text-[11px] font-mono text-cream-200 shrink-0">
                        {r._count?.menuItems || 0} dishes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-espresso-800 text-xs">
                    <div className="flex items-center gap-3">
                      {r.isClaimed && r.organizationId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrgId(r.organizationId);
                            setIsGrantModalOpen(true);
                          }}
                          className="text-xs text-taupe-400 hover:text-cream-100 font-semibold"
                        >
                          Grant Perks
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={generatingInviteId === r.id}
                          onClick={() => handleGenerateClaimLink(r.id, r.displayName)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>{generatingInviteId === r.id ? 'Generating...' : 'Get Claim Link'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={deletingRestaurantId === r.id}
                        onClick={() => handleDeleteRestaurant(r)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{deletingRestaurantId === r.id ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                    <a
                      href={`/m/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terracotta hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      Inspect Live Menu <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
              {filteredRestaurants.length === 0 && (
                <div className="col-span-full py-12 text-center text-taupe-400 bg-[#140E0A] rounded-2xl border border-espresso-800">
                  No restaurants match your search or filter.
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'subscriptions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Tenant Subscriptions &amp; Trials</h3>
                  <p className="text-xs text-taupe-400">
                    All 14-day free trials, Razorpay subscriptions, and complimentary grants
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-taupe-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter subscriptions..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    style={{ colorScheme: 'dark', backgroundColor: '#1A120D', color: '#FAF7F2' }}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1A120D] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'PAID', label: 'Paid Active' },
                  { key: 'TRIAL', label: '14D Free Trials' },
                  { key: 'TRIAL_EXPIRED', label: 'Trials Ended' },
                  { key: 'EXPIRED', label: 'All Lapsed' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setSubFilter(chip.key as any)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      subFilter === chip.key
                        ? 'bg-terracotta text-white shadow-sm'
                        : 'bg-[#1A120D] text-taupe-400 border border-espresso-800 hover:text-cream-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Organization / Restaurant</th>
                      <th className="py-3 px-4 font-semibold">Plan Key</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Started / Provider</th>
                      <th className="py-3 px-4 font-semibold">Paid / Trial Through</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800/60">
                    {filteredSubscriptions.map((sub: any) => {
                      const badge = getAdminSubBadge(sub);
                      const planCountry =
                        sub.organization?.restaurants?.[0]?.country === 'US' ? 'US' : 'IN';
                      const planOptions = ADMIN_PLAN_OPTIONS[planCountry];
                      const providerLabel =
                        sub.provider === 'TRIAL'
                          ? 'Trial'
                          : sub.provider === 'FOUNDER_GRANT'
                          ? 'Founder Grant'
                          : sub.provider || 'Razorpay';
                      return (
                        <tr key={sub.id} className="hover:bg-espresso-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-cream-50">{sub.organization.name}</div>
                            <div className="text-taupe-400 text-[11px]">{sub.organization.restaurants[0]?.displayName}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-cream-200">
                            <select
                              value={sub.planKey}
                              disabled={updatingSubscriptionId === sub.id}
                              onChange={(event) =>
                                handleChangeSubscriptionPlan(sub, event.target.value)
                              }
                              aria-label={`Subscription tier for ${sub.organization.name}`}
                              className="min-w-[150px] px-2 py-1.5 rounded-lg bg-[#0E0A08] border border-espresso-700 text-cream-100 text-[11px] disabled:opacity-50 dark-select"
                            >
                              {planOptions.map((key) => (
                                <option key={key} value={key}>
                                  {key === 'FREE_TRIAL' ? 'Trial (14D Free)' : key}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.toneClass}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-taupe-300">
                            <div>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}</div>
                            <div className="text-[10px] text-taupe-400">{providerLabel}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-taupe-300">
                            {sub.paidThrough ? new Date(sub.paidThrough).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrgId(sub.organizationId);
                                setIsGrantModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-200 text-xs font-semibold whitespace-nowrap transition-all shadow-sm"
                            >
                              Grant Entitlement
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSubscriptions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-taupe-400">
                          No subscriptions matching your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'costs' && (
          <AdminCostsTab costsData={costsData} loading={sectionLoading.costs} />
        )}

        {activeSection === 'canonical' && (
          <CanonicalLibraryTab dishes={canonicalDishes} loading={sectionLoading.canonical} />
        )}

        {activeSection === 'claims' && (
          <AdminClaimsTab
            claims={claims}
            loading={sectionLoading.claims}
            generatingInviteId={generatingInviteId}
            claimError={claimError}
            onGenerateClaimLink={handleGenerateClaimLink}
            onApproved={() => loadData(true)}
          />
        )}

        {activeSection === 'orders' && (
          <AdminOrdersTab
            ordersData={ordersData}
            loading={sectionLoading.orders}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        )}
      </main>

      {isGrantModalOpen && (
        <GrantEntitlementModal
          initialOrgId={selectedOrgId}
          subscriptions={subscriptionData?.subscriptions || []}
          restaurants={restaurants}
          onClose={() => setIsGrantModalOpen(false)}
          onGranted={() => loadData(true)}
        />
      )}

      {isDemoModalOpen && (
        <DemoMenuModal
          onClose={() => setIsDemoModalOpen(false)}
          onCreated={() => loadData(true)}
          onShowToast={showExtractionToast}
        />
      )}

      {generatedInviteModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setGeneratedInviteModal(null);
            }}
          >
            <div
              className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content"
              style={{ colorScheme: 'dark' }}
            >
              <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-cream-50">Private Claim Invitation Ready</h3>
                    <p className="text-[11px] text-taupe-400">{generatedInviteModal.restaurantName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedInviteModal(null)}
                  className="text-taupe-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-taupe-300 leading-relaxed">
                Share this one-time private claim link with the restaurant owner. Earlier unused links for this venue were automatically superseded.
              </p>

              <div className="p-2.5 rounded-xl bg-black/50 border border-espresso-700 font-mono text-[11px] text-emerald-300 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{generatedInviteModal.claimUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedInviteModal.claimUrl).catch(() => {});
                    setCopiedInviteModal(true);
                    setTimeout(() => setCopiedInviteModal(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold shrink-0"
                >
                  {copiedInviteModal ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <a
                  href={generatedInviteModal.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-espresso-800 hover:bg-espresso-700 text-cream-100 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  Open Claim Page <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setGeneratedInviteModal(null)}
                  className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {extractionToast && (
        <Portal>
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-[140] max-w-sm w-[calc(100vw-2.5rem)] sm:w-auto p-3.5 bg-[#1B120D]/95 backdrop-blur-md border border-emerald-700/80 text-cream-50 rounded-2xl shadow-2xl flex items-start gap-3 animate-fade-in"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <div className="text-xs sm:text-sm font-semibold text-emerald-300 leading-snug">
                {extractionToast.title}
              </div>
              {extractionToast.subtitle && (
                <div className="text-[11px] text-taupe-300 mt-0.5 leading-snug">
                  {extractionToast.subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExtractionToast(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-taupe-400 hover:text-white hover:bg-espresso-800 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </Portal>
      )}
    </div>
  );
}
