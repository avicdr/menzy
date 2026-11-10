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
  Search,
  Copy,
  Check,
  Filter,
  RefreshCw,
  Cpu,
  Activity,
  ChefHat,
  Clock,
  Layers,
  Plus,
  Trash2,
  Upload,
  KeyRound,
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';

interface DemoDishDraft {
  localId: string;
  name: string;
  category: string;
  price: string;
  foodType: 'VEG' | 'NON_VEG' | 'EGG';
  description: string;
}

function buildDefaultDemoDishes(country: string): DemoDishDraft[] {
  if (country === 'US') {
    return [
      {
        localId: 'default_us_1',
        name: 'Flat White',
        category: 'Coffee & Espresso',
        price: '5.50',
        foodType: 'VEG',
        description: 'Double ristretto pulled over velvety steamed micro-foam.',
      },
      {
        localId: 'default_us_2',
        name: 'Avocado Toast',
        category: 'All Day Brunch',
        price: '15.00',
        foodType: 'VEG',
        description: 'Country sourdough with smashed avocado, citrus zest, and chili flakes.',
      },
      {
        localId: 'default_us_3',
        name: 'Tiramisu Tartlet',
        category: 'Patisserie',
        price: '11.00',
        foodType: 'EGG',
        description: 'Espresso-soaked sponge layered with whipped mascarpone and cocoa.',
      },
    ];
  }
  return [
    {
      localId: 'default_in_1',
      name: 'Paneer Tikka',
      category: 'Small Plates',
      price: '320',
      foodType: 'VEG',
      description: 'Charcoal-grilled cottage cheese marinated in yogurt and warm house spices.',
    },
    {
      localId: 'default_in_2',
      name: 'Masala Chai',
      category: 'Beverages',
      price: '120',
      foodType: 'VEG',
      description: 'Slow-simmered Assam blend infused with fresh ginger and green cardamom.',
    },
    {
      localId: 'default_in_3',
      name: 'Signature House Tartine',
      category: 'Chef Specials',
      price: '280',
      foodType: 'VEG',
      description: 'Warm artisanal sourdough finished with herb butter and microgreens.',
    },
  ];
}

export default function SuperAdminPortalPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'restaurants' | 'subscriptions' | 'costs' | 'canonical' | 'claims' | 'orders'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  const [canonicalSearch, setCanonicalSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modals
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [grantType, setGrantType] = useState('COMPLIMENTARY_PLAN');
  const [grantTier, setGrantTier] = useState('PRO');
  const [grantQuantity, setGrantQuantity] = useState(50);
  const [grantDays, setGrantDays] = useState(14);
  const [founderReason, setFounderReason] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);

  // Demo creator modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoCountry, setDemoCountry] = useState<'IN' | 'US'>('IN');
  const [demoCity, setDemoCity] = useState('Mumbai');
  const [demoDescription, setDemoDescription] = useState('');
  const [demoThemePreset, setDemoThemePreset] = useState<
    'WARM_EDITORIAL' | 'MIDNIGHT_ESPRESSO' | 'BOTANICAL_CAFE' | 'PASTEL_PATISSERIE'
  >('WARM_EDITORIAL');
  const [demoDishes, setDemoDishes] = useState<DemoDishDraft[]>(() => buildDefaultDemoDishes('IN'));
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoExtracting, setDemoExtracting] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [generatedDemoResult, setGeneratedDemoResult] = useState<{
    claimUrl: string;
    publicMenuUrl: string;
    dishCount: number;
    canonicalMatchedCount: number;
    restaurantName: string;
  } | null>(null);
  const [copiedClaimUrl, setCopiedClaimUrl] = useState(false);

  // Claim Link Generator Modal for existing unclaimed demos
  const [generatingInviteId, setGeneratingInviteId] = useState<string | null>(null);
  const [generatedInviteModal, setGeneratedInviteModal] = useState<{
    restaurantName: string;
    claimUrl: string;
  } | null>(null);
  const [copiedInviteModal, setCopiedInviteModal] = useState(false);

  // Claim Approval Modal (replaces browser prompt)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeClaimToApprove, setActiveClaimToApprove] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [rRes, sRes, cRes, canonRes, claimRes, ordersRes] = await Promise.all([
        fetch('/api/admin/restaurants'),
        fetch('/api/admin/subscriptions'),
        fetch('/api/admin/costs'),
        fetch('/api/admin/canonical'),
        fetch('/api/admin/claims'),
        fetch('/api/admin/orders'),
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
      if (ordersRes && ordersRes.ok) {
        setOrdersData(await ordersRes.json());
      }
    } catch (err) {
      console.error('Super-admin load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleGrantEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !founderReason) return;
    setGrantLoading(true);
    setGrantError(null);

    try {
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
        setGrantSuccessMsg('Complimentary entitlement granted & audited successfully!');
        setFounderReason('');
        await loadData(true);
        setTimeout(() => {
          setIsGrantModalOpen(false);
          setGrantSuccessMsg(null);
        }, 1500);
      } else {
        const data = await res.json();
        setGrantError(data.error || 'Failed to grant entitlement.');
      }
    } catch (err: any) {
      setGrantError(err.message || 'Network error while granting entitlement.');
    } finally {
      setGrantLoading(false);
    }
  };

  const openDemoModal = () => {
    setDemoError(null);
    setGeneratedDemoResult(null);
    setCopiedClaimUrl(false);
    if (demoDishes.length === 0) {
      setDemoDishes(buildDefaultDemoDishes(demoCountry));
    }
    setIsDemoModalOpen(true);
  };

  const handleDemoCountryChange = (nextCountry: 'IN' | 'US') => {
    setDemoCountry(nextCountry);
    if (!demoCity.trim() || demoCity === 'Mumbai' || demoCity === 'Austin') {
      setDemoCity(nextCountry === 'US' ? 'Austin' : 'Mumbai');
    }
    const isUsingBuiltInDefaults = demoDishes.every((d) => d.localId.startsWith('default_'));
    if (isUsingBuiltInDefaults) {
      setDemoDishes(buildDefaultDemoDishes(nextCountry));
    }
  };

  const handleExtractDemoDishes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setDemoExtracting(true);
    setDemoError(null);

    try {
      const formData = new FormData();
      formData.append('currency', demoCountry === 'US' ? 'USD' : 'INR');
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/admin/restaurants/extract-menu', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract dishes from menu upload.');
      }

      if (data.restaurantName && !demoName.trim()) {
        setDemoName(data.restaurantName);
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        const mapped: DemoDishDraft[] = data.items.map((item: any, idx: number) => {
          const labels = Array.isArray(item.dietaryLabels) ? item.dietaryLabels : [];
          const foodType: 'VEG' | 'NON_VEG' | 'EGG' = labels.includes('NON_VEG')
            ? 'NON_VEG'
            : labels.includes('EGG')
            ? 'EGG'
            : 'VEG';

          const priceNumber =
            typeof item.priceMinor === 'number' && item.priceMinor > 0
              ? item.priceMinor / 100
              : demoCountry === 'US'
              ? 12
              : 250;

          return {
            localId: `extracted_${Date.now()}_${idx}`,
            name: String(item.name || 'Dish'),
            category: String(item.category || 'Chef Specials'),
            price: demoCountry === 'US' ? priceNumber.toFixed(2) : String(Math.round(priceNumber)),
            foodType,
            description: String(item.description || ''),
          };
        });
        setDemoDishes(mapped);
      }
    } catch (err: any) {
      setDemoError(err.message || 'Menu extraction failed. You can still add dishes manually below.');
    } finally {
      setDemoExtracting(false);
      e.target.value = '';
    }
  };

  const handleAddDemoDishRow = () => {
    setDemoDishes((prev) => [
      ...prev,
      {
        localId: `custom_${Date.now()}_${prev.length}`,
        name: '',
        category: 'Chef Specials',
        price: demoCountry === 'US' ? '14.00' : '260',
        foodType: 'VEG',
        description: '',
      },
    ]);
  };

  const handleUpdateDemoDish = (localId: string, field: keyof DemoDishDraft, value: string) => {
    setDemoDishes((prev) =>
      prev.map((d) => (d.localId === localId ? { ...d, [field]: value } : d))
    );
  };

  const handleRemoveDemoDish = (localId: string) => {
    setDemoDishes((prev) => prev.filter((d) => d.localId !== localId));
  };

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) {
      setDemoError('Please enter a restaurant display name.');
      return;
    }

    const validDishes = demoDishes.filter((d) => d.name.trim().length > 0);
    if (validDishes.length === 0) {
      setDemoError('Please add at least one dish to the demo menu.');
      return;
    }

    setDemoLoading(true);
    setDemoError(null);
    setGeneratedDemoResult(null);

    try {
      const payloadDishes = validDishes.map((d) => ({
        name: d.name.trim(),
        category: d.category.trim() || 'Chef Specials',
        description: d.description.trim() || undefined,
        foodType: d.foodType,
        priceMinor: Math.max(0, Math.round((parseFloat(d.price) || 0) * 100)),
      }));

      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: demoName.trim(),
          country: demoCountry,
          city: demoCity.trim(),
          currency: demoCountry === 'US' ? 'USD' : 'INR',
          description: demoDescription.trim(),
          themePreset: demoThemePreset,
          tableCount: 1,
          sampleDishes: payloadDishes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedDemoResult({
          claimUrl: data.claimUrl,
          publicMenuUrl: data.publicMenuUrl,
          dishCount: data.dishCount ?? payloadDishes.length,
          canonicalMatchedCount: data.canonicalMatchedCount ?? 0,
          restaurantName: data.restaurant?.displayName || demoName.trim(),
        });
        await loadData(true);
      } else {
        setDemoError(data.error || 'Failed to create demo restaurant.');
      }
    } catch (err: any) {
      setDemoError(err.message || 'Network error while creating demo menu.');
    } finally {
      setDemoLoading(false);
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

  const handleOpenApproveModal = (claim: any) => {
    setActiveClaimToApprove(claim);
    setClaimError(null);
    setVerificationNotes(`Approved by founder console. Verified venue identity for ${claim.restaurant?.displayName || 'venue'}.`);
    setIsClaimModalOpen(true);
  };

  const handleConfirmApproveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaimToApprove) return;
    setClaimLoading(true);
    setClaimError(null);

    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_CLAIM',
          claimId: activeClaimToApprove.id,
          verificationNotes,
        }),
      });

      if (res.ok) {
        setIsClaimModalOpen(false);
        setActiveClaimToApprove(null);
        await loadData(true);
      } else {
        const data = await res.json();
        setClaimError(data.error || 'Failed to approve claim.');
      }
    } catch (err: any) {
      setClaimError(err.message || 'Network error approving claim.');
    } finally {
      setClaimLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string, isClaim = false) => {
    navigator.clipboard.writeText(text);
    if (isClaim) {
      setCopiedClaimUrl(true);
      setTimeout(() => setCopiedClaimUrl(false), 2000);
    } else {
      setCopiedSlug(id);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
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

  // Filter restaurants
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

  // Filter subscriptions
  const filteredSubscriptions = (subscriptionData?.subscriptions || []).filter((sub: any) => {
    const orgName = sub.organization?.name || '';
    const restName = sub.organization?.restaurants?.[0]?.displayName || '';
    return (
      orgName.toLowerCase().includes(subSearch.toLowerCase()) ||
      restName.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.planKey.toLowerCase().includes(subSearch.toLowerCase())
    );
  });

  // Filter canonical dishes
  const filteredCanonical = canonicalDishes.filter((dish: any) => {
    const term = canonicalSearch.toLowerCase();
    const nameMatch = dish.canonicalName?.toLowerCase().includes(term);
    const catMatch = dish.category?.toLowerCase().includes(term);
    const cuisineMatch = dish.cuisineRegion?.toLowerCase().includes(term);
    const aliasMatch = Array.isArray(dish.aliases) && dish.aliases.some((a: string) => a.toLowerCase().includes(term));
    return nameMatch || catMatch || cuisineMatch || aliasMatch;
  });

  return (
    <div className="admin-portal min-h-screen bg-[#0E0A08] text-cream-100 flex flex-col font-sans selection:bg-terracotta selection:text-white">
      {/* Sticky Top Founder Bar & Command Sub-Tabs */}
      <div className="sticky top-0 z-30 shrink-0 shadow-lg bg-[#140E0A]/95 backdrop-blur-md">
      {/* Top Founder Executive Bar */}
      <header className="px-4 sm:px-8 py-3.5 border-b border-espresso-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta to-terracotta-600 text-white flex items-center justify-center font-bold text-base shadow-md ring-1 ring-white/10 shrink-0">
            M
          </div>
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
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-terracotta' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedOrgId(
                subscriptionData?.subscriptions?.[0]?.organizationId ||
                  restaurants.find((r) => r.organizationId)?.organizationId ||
                  ''
              );
              setGrantError(null);
              setIsGrantModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden md:inline">Grant Entitlement</span>
          </button>

          <button
            type="button"
            onClick={openDemoModal}
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

      {/* Navigation Sub-Tabs (Command Bar) */}
      <div className="px-4 sm:px-8 bg-[#120D09] border-b border-espresso-800/80 overflow-x-auto flex items-center gap-1 shrink-0 no-scrollbar py-1">
        {[
          { key: 'overview', label: 'Executive Overview', icon: Activity, count: null },
          { key: 'restaurants', label: 'Restaurants', icon: Utensils, count: restaurants.length },
          { key: 'orders', label: 'Orders & Tables', icon: ChefHat, count: ordersData?.metrics?.totalOrders ?? null },
          { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, count: subscriptionData?.subscriptions?.length || 0 },
          { key: 'costs', label: 'AI Cost Intelligence', icon: Cpu, count: null },
          { key: 'canonical', label: 'Canonical Library', icon: Bot, count: canonicalDishes.length },
          { key: 'claims', label: 'Claims Review', icon: ShieldAlert, count: claims.length },
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
        {/* =========================================================================
            SECTION 1: OVERVIEW & WATCHLISTS
        ========================================================================= */}
        {activeSection === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Top SaaS KPIs */}
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
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Multi-tenant retention active
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
                <div className="text-2xl font-bold text-cream-50 mt-2 font-mono tracking-tight">
                  ${globalMetrics.totalAiCostUsd}
                </div>
                <div className="text-xs text-taupe-400 mt-2">{globalMetrics.totalAiRequests} total Gemini API calls</div>
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

            {/* Platform Infrastructure Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gemini 1.5 Flash Vision', val: 'Online & Calibrated', status: 'ready' },
                { label: 'Cloudflare R2 Storage', val: 'Connected', status: 'ready' },
                { label: 'Razorpay Webhooks', val: 'Listening Active', status: 'ready' },
                { label: 'Multi-Tenant Isolation', val: 'Strict Verified', status: 'ready' },
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

            {/* Renewal Watchlist Table */}
            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Subscription Watchlist</h3>
                  <p className="text-xs text-taupe-400">Tenants sorted by paid-through date with one-click entitlement overrides</p>
                </div>
                <span className="text-xs text-taupe-400 font-mono">
                  {subscriptionData?.subscriptions?.length || 0} active subscriptions
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
                    {(subscriptionData?.subscriptions || []).map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-espresso-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-cream-50">{sub.organization.name}</div>
                          <div className="text-taupe-400 text-[11px]">{sub.organization.restaurants[0]?.displayName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-cream-200">
                          <span className="px-2 py-0.5 rounded bg-espresso-800/80 border border-espresso-700/60 text-cream-200 text-[11px]">
                            {sub.planKey}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                                : 'bg-red-950/80 border border-red-800/80 text-red-300'
                            }`}
                          >
                            {sub.status}
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
                    ))}
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

        {/* =========================================================================
            SECTION 2: RESTAURANTS DIRECTORY
        ========================================================================= */}
        {activeSection === 'restaurants' && (
          <div className="space-y-6 animate-fade-in">
            {/* Control Bar: Search & Filter */}
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
                  onClick={openDemoModal}
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

            {/* Restaurants Grid */}
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

                  <div className="flex items-center justify-between pt-3 border-t border-espresso-800 text-xs">
                    {r.isClaimed && r.organizationId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrgId(r.organizationId);
                          setGrantError(null);
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

        {/* =========================================================================
            SECTION 3: SUBSCRIPTIONS DIRECTORY
        ========================================================================= */}
        {activeSection === 'subscriptions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Active Customer Subscriptions</h3>
                  <p className="text-xs text-taupe-400">All tenant Razorpay and complimentary subscriptions</p>
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

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Organization / Restaurant</th>
                      <th className="py-3 px-4 font-semibold">Plan Key</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Current Period Start</th>
                      <th className="py-3 px-4 font-semibold">Paid Through</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800/60">
                    {filteredSubscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-espresso-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-cream-50">{sub.organization.name}</div>
                          <div className="text-taupe-400 text-[11px]">{sub.organization.restaurants[0]?.displayName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-cream-200">
                          <span className="px-2 py-0.5 rounded bg-espresso-800/80 border border-espresso-700/60 text-cream-200 text-[11px]">
                            {sub.planKey}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'ACTIVE'
                                ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                                : 'bg-red-950/80 border border-red-800/80 text-red-300'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-taupe-300">
                          {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : '—'}
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
                    ))}
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

        {/* =========================================================================
            SECTION 4: AI OPERATING COST BREAKDOWN
        ========================================================================= */}
        {activeSection === 'costs' && (
          <div className="space-y-6 animate-fade-in">
            {/* Global AI Unit Economics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800">
                <div className="text-[10px] text-taupe-400 uppercase font-mono">Gemini Vision Extraction</div>
                <div className="text-xl font-bold text-cream-50 mt-1 font-mono">~$0.0025 / page</div>
                <div className="text-[11px] text-taupe-400 mt-1">Gemini 1.5 Flash Vision parser</div>
              </div>
              <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800">
                <div className="text-[10px] text-taupe-400 uppercase font-mono">AI Diner Waiter Query</div>
                <div className="text-xl font-bold text-cream-50 mt-1 font-mono">~$0.0003 / prompt</div>
                <div className="text-[11px] text-taupe-400 mt-1">Gemini 1.5 Flash grounded assistant</div>
              </div>
              <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800">
                <div className="text-[10px] text-taupe-400 uppercase font-mono">3D Food Illustration Gen</div>
                <div className="text-xl font-bold text-cream-50 mt-1 font-mono">~$0.0400 / image</div>
                <div className="text-[11px] text-taupe-400 mt-1">Imagen 3 / Gemini image model</div>
              </div>
            </div>

            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Per-Restaurant Operational Margins</h3>
                  <p className="text-xs text-taupe-400">Actual Gemini API expenditure versus subscription revenue</p>
                </div>
                <span className="text-xs font-mono text-terracotta">Real-time Margin Telemetry</span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Restaurant</th>
                      <th className="py-3 px-4 font-semibold">Plan / Rev</th>
                      <th className="py-3 px-4 font-semibold">AI Queries</th>
                      <th className="py-3 px-4 font-semibold">Images Gen</th>
                      <th className="py-3 px-4 font-semibold">AI Cost (USD)</th>
                      <th className="py-3 px-4 font-semibold text-right">Est. Gross Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800/60">
                    {(costsData?.restaurants || []).map((item: any) => (
                      <tr key={item.restaurantId} className="hover:bg-espresso-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-cream-50">{item.restaurantName}</td>
                        <td className="py-3.5 px-4 text-taupe-300 font-mono text-[11px]">{item.subscriptionPlan}</td>
                        <td className="py-3.5 px-4 text-cream-200 font-mono">{item.totalAiRequests}</td>
                        <td className="py-3.5 px-4 text-cream-200 font-mono">{item.imagesGenerated}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-terracotta">${item.aiOperatingCostUsd}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">${item.estimatedMarginUsd}</td>
                      </tr>
                    ))}
                    {(costsData?.restaurants || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-taupe-400">
                          No tenant operational cost records logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 5: CANONICAL CULINARY LIBRARY
        ========================================================================= */}
        {activeSection === 'canonical' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Curated Canonical Dish Library</h3>
                  <p className="text-xs text-taupe-400">Shared culinary assets reused across restaurants without cross-tenant contamination</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-taupe-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search canonical dishes..."
                    value={canonicalSearch}
                    onChange={(e) => setCanonicalSearch(e.target.value)}
                    style={{ colorScheme: 'dark', backgroundColor: '#1A120D', color: '#FAF7F2' }}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1A120D] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                  />
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Canonical Dish</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Cuisine / Region</th>
                      <th className="py-3 px-4 font-semibold">Aliases</th>
                      <th className="py-3 px-4 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800/60">
                    {filteredCanonical.map((dish: any) => (
                      <tr key={dish.id} className="hover:bg-espresso-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {dish.imageAsset?.publicUrl ? (
                              <img
                                src={dish.imageAsset.publicUrl}
                                alt={dish.canonicalName}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 bg-espresso-800 ring-1 ring-white/10"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#1F1713] border border-espresso-700 flex items-center justify-center text-[10px] text-taupe-400 shrink-0 font-mono">
                                3D
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-cream-50 text-sm">{dish.canonicalName}</div>
                              <div className="text-taupe-400 text-[11px] line-clamp-1">{dish.culinaryBackground}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-taupe-300 font-medium">{dish.category}</td>
                        <td className="py-3.5 px-4 text-cream-200">
                          <span className="px-2 py-0.5 rounded-full bg-espresso-800/80 text-[10px] font-medium border border-espresso-700/60">
                            {dish.cuisineRegion || 'Global'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-taupe-400 font-mono text-[11px]">
                          {Array.isArray(dish.aliases) ? dish.aliases.join(', ') : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800/70 text-emerald-300">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredCanonical.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-taupe-400">
                          No canonical dishes match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 6: CLAIMS REVIEW QUEUE
        ========================================================================= */}
        {activeSection === 'claims' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Ownership Claim Requests</h3>
                  <p className="text-xs text-taupe-400">Restaurant operators claiming prebuilt demo menus</p>
                </div>
                <span className="text-xs font-mono text-taupe-400">{claims.length} claims registered</span>
              </div>

              {claimError && (
                <div role="alert" className="mb-4 p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
                  {claimError}
                </div>
              )}

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Venue</th>
                      <th className="py-3 px-4 font-semibold">Claimant Email</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Expires</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-800/60">
                    {claims.map((cl) => (
                      <tr key={cl.id} className="hover:bg-espresso-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-cream-50">{cl.restaurant?.displayName}</div>
                          {cl.restaurant?.slug && (
                            <a
                              href={`/m/${cl.restaurant.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-terracotta hover:underline"
                            >
                              /m/{cl.restaurant.slug}
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-taupe-300 font-mono text-[11px]">
                          {cl.claimantEmail || 'Unclaimed link'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cl.status === 'APPROVED'
                                ? 'bg-emerald-950 border border-emerald-800/70 text-emerald-300'
                                : cl.status === 'PENDING_VERIFICATION'
                                ? 'bg-amber-950 border border-amber-800/70 text-amber-300'
                                : cl.status === 'UNCLAIMED'
                                ? 'bg-blue-950 border border-blue-800/70 text-blue-300'
                                : 'bg-espresso-800 text-taupe-400'
                            }`}
                          >
                            {cl.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-taupe-400 font-mono">{new Date(cl.expiresAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          {cl.status === 'PENDING_VERIFICATION' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(cl)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs whitespace-nowrap shadow-sm transition-all"
                            >
                              Review & Approve
                            </button>
                          ) : (cl.status === 'UNCLAIMED' || cl.status === 'REJECTED') &&
                            cl.restaurant &&
                            !cl.restaurant.isClaimed ? (
                            <button
                              type="button"
                              disabled={generatingInviteId === cl.restaurant.id}
                              onClick={() =>
                                handleGenerateClaimLink(cl.restaurant.id, cl.restaurant.displayName)
                              }
                              className="px-3 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-amber-300 font-semibold text-xs whitespace-nowrap transition-all disabled:opacity-50"
                            >
                              {generatingInviteId === cl.restaurant.id ? 'Generating...' : 'New Invite Link'}
                            </button>
                          ) : (
                            <span className="text-taupe-500 text-[11px] font-mono">
                              {cl.status === 'APPROVED' ? 'Claimed' : 'Closed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {claims.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-taupe-400">
                          No ownership claims in queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 7: ORDERS & TABLE OPERATIONS TELEMETRY
        ========================================================================= */}
        {activeSection === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
                <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
                  Total Platform Orders
                </div>
                <div className="text-3xl font-serif font-bold text-cream-50">
                  {ordersData?.metrics?.totalOrders || 0}
                </div>
                <div className="text-xs text-taupe-400 mt-1">Across all tenant venues</div>
              </div>

              <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
                <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
                  Active In-Flight Orders
                </div>
                <div className="text-3xl font-serif font-bold text-amber-400">
                  {ordersData?.metrics?.activeOrdersCount || 0}
                </div>
                <div className="text-xs text-taupe-400 mt-1">Pending, cooking, or ready</div>
              </div>

              <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
                <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
                  Platform Gross Volume
                </div>
                <div className="text-3xl font-serif font-bold text-emerald-400">
                  ₹{Math.round((ordersData?.metrics?.grossVolumeMinor || 0) / 100).toLocaleString()}
                </div>
                <div className="text-xs text-taupe-400 mt-1">Total dining GMV processed</div>
              </div>

              <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
                <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
                  Tables & Staff Terminals
                </div>
                <div className="text-3xl font-serif font-bold text-cream-50">
                  {ordersData?.metrics?.totalTables || 0}{' '}
                  <span className="text-sm font-sans font-normal text-taupe-400">
                    / {ordersData?.metrics?.totalStaff || 0} staff
                  </span>
                </div>
                <div className="text-xs text-taupe-400 mt-1">QR enabled dining points</div>
              </div>
            </div>

            {/* Status Breakdown Bar */}
            {ordersData?.metrics?.statusBreakdown && (
              <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-taupe-400 uppercase tracking-wider mr-2">
                  Status Distribution:
                </span>
                {Object.entries(ordersData.metrics.statusBreakdown).map(([st, cnt]: [string, any]) => (
                  <div
                    key={st}
                    className="px-3 py-1.5 rounded-xl bg-espresso-900 border border-espresso-700/60 text-xs flex items-center gap-2"
                  >
                    <span className="font-mono font-bold text-cream-50">{cnt}</span>
                    <span className="text-taupe-400">{st}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Cross-Tenant Orders Table */}
            <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">
                    Recent Platform Dine-In Orders
                  </h3>
                  <p className="text-xs text-taupe-400">
                    Cross-tenant ordering activity and POS transactions
                  </p>
                </div>
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="p-2 rounded-xl text-taupe-400 hover:text-cream-50 hover:bg-espresso-800 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {(!ordersData?.recentOrders || ordersData.recentOrders.length === 0) ? (
                <div className="py-12 text-center text-taupe-500 text-xs">
                  No orders recorded on the platform yet.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Order #</th>
                        <th className="py-3 px-4 font-semibold">Restaurant Venue</th>
                        <th className="py-3 px-4 font-semibold">Table</th>
                        <th className="py-3 px-4 font-semibold">Items</th>
                        <th className="py-3 px-4 font-semibold">Bill Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Placed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-espresso-800/60">
                      {ordersData.recentOrders.map((ord: any) => (
                        <tr key={ord.id} className="hover:bg-espresso-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-cream-50">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-cream-100 flex items-center gap-1.5">
                              {ord.restaurant?.displayName || 'Restaurant'}
                              <a
                                href={`/m/${ord.restaurant?.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-taupe-400 hover:text-terracotta"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[10px] text-taupe-400">
                              {ord.restaurant?.city}, {ord.restaurant?.country}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-cream-200">
                            {ord.table?.name || 'Table'}
                            {ord.table?.section ? ` (${ord.table.section})` : ''}
                          </td>
                          <td className="py-3.5 px-4 text-taupe-300">
                            {ord._count?.items || 0} items
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                            {ord.currency === 'USD' ? '$' : '₹'}
                            {(ord.totalMinor / 100).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.status === 'PENDING'
                                  ? 'bg-amber-950 border border-amber-800/70 text-amber-300'
                                  : ord.status === 'PREPARING'
                                  ? 'bg-orange-950 border border-orange-800/70 text-orange-300'
                                  : ord.status === 'READY'
                                  ? 'bg-emerald-950 border border-emerald-800/70 text-emerald-300'
                                  : ord.status === 'SERVED' || ord.status === 'COMPLETED'
                                  ? 'bg-espresso-800 text-taupe-300'
                                  : 'bg-red-950 border border-red-800/70 text-red-300'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-taupe-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(ord.placedAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL 1: GRANT ENTITLEMENT (100% Dark Themed, No White-on-White)
      ========================================================================= */}
      {isGrantModalOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsGrantModalOpen(false);
            }}
          >
            <div
              className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content max-h-[92vh] overflow-y-auto"
              style={{ colorScheme: 'dark' }}
            >
            <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-cream-50">Grant Complimentary Entitlement</h3>
                  <p className="text-[11px] text-taupe-400">Overrides tenant privileges without falsifying payment ledgers</p>
                </div>
              </div>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="text-taupe-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {grantSuccessMsg && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{grantSuccessMsg}</span>
              </div>
            )}

            {grantError && (
              <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
                {grantError}
              </div>
            )}

            <form onSubmit={handleGrantEntitlement} className="space-y-3.5">
              <div>
                <label htmlFor="grant-target-org" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                  Target Organization
                </label>
                <select
                  id="grant-target-org"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                >
                  <option value="" disabled className="bg-[#1A120D] text-white py-1">
                    Select an organization...
                  </option>
                  {(subscriptionData?.subscriptions || []).map((sub: any) => (
                    <option key={sub.organizationId} value={sub.organizationId} className="bg-[#1A120D] text-white py-1">
                      {sub.organization.name} ({sub.organization.restaurants[0]?.displayName || 'Venue'}) — {sub.planKey}
                    </option>
                  ))}
                  {/* Also include claimed organizations without active subscriptions */}
                  {Array.from(
                    new Map(
                      restaurants
                        .filter(
                          (r) =>
                            Boolean(r.organizationId) &&
                            !(subscriptionData?.subscriptions || []).some(
                              (sub: any) => sub.organizationId === r.organizationId
                            )
                        )
                        .map((r) => [r.organizationId as string, r])
                    ).values()
                  ).map((r) => (
                    <option key={r.organizationId} value={r.organizationId} className="bg-[#1A120D] text-white py-1">
                      {r.displayName} ({r.city || r.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Grant Type</label>
                <select
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value)}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                >
                  <option value="COMPLIMENTARY_PLAN" className="bg-[#1A120D] text-white py-1">
                    Complimentary Plan Upgrade (Pro/Growth)
                  </option>
                  <option value="BONUS_IMAGE_CREDITS" className="bg-[#1A120D] text-white py-1">
                    Bonus 3D Image Credits
                  </option>
                  <option value="BONUS_AI_QUESTIONS" className="bg-[#1A120D] text-white py-1">
                    Bonus AI Chat Questions
                  </option>
                  <option value="EXTENSION" className="bg-[#1A120D] text-white py-1">
                    Subscription Duration Extension
                  </option>
                </select>
              </div>

              {grantType === 'COMPLIMENTARY_PLAN' && (
                <div>
                  <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Target Tier</label>
                  <select
                    value={grantTier}
                    onChange={(e) => setGrantTier(e.target.value)}
                    style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                  >
                    <option value="PRO" className="bg-[#1A120D] text-white py-1">Pro Tier</option>
                    <option value="GROWTH" className="bg-[#1A120D] text-white py-1">Growth Tier</option>
                  </select>
                </div>
              )}

              {grantType === 'BONUS_IMAGE_CREDITS' && (
                <div>
                  <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Credits Quantity</label>
                  <input
                    type="number"
                    value={grantQuantity}
                    onChange={(e) => setGrantQuantity(parseInt(e.target.value, 10))}
                    style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                    className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Duration (Days)</label>
                <input
                  type="number"
                  value={grantDays}
                  onChange={(e) => setGrantDays(parseInt(e.target.value, 10))}
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-taupe-300 mb-1.5">Founder Reason (Audited)</label>
                <textarea
                  required
                  rows={2}
                  value={founderReason}
                  onChange={(e) => setFounderReason(e.target.value)}
                  placeholder="e.g. VIP partner launch extension / customer support goodwill"
                  style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                  className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-espresso-800">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grantLoading || !selectedOrgId}
                  className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {grantLoading ? 'Granting...' : 'Apply Grant & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    )}

      {/* =========================================================================
          MODAL 2: DEMO RESTAURANT CREATOR
      ========================================================================= */}
      {isDemoModalOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDemoModalOpen(false);
                setGeneratedDemoResult(null);
                setDemoError(null);
              }
            }}
          >
            <div
              className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-2xl w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content max-h-[92vh] overflow-y-auto"
              style={{ colorScheme: 'dark' }}
            >
              <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-terracotta/20 text-terracotta border border-terracotta/30 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-cream-50">Create Authorized Demo Menu</h3>
                    <p className="text-[11px] text-taupe-400">
                      Pre-seeds an unclaimed showcase menu with custom theme, dishes, and private claim link
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoModalOpen(false);
                    setGeneratedDemoResult(null);
                    setDemoError(null);
                  }}
                  className="text-taupe-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {demoError && (
                <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
                  {demoError}
                </div>
              )}

              <form onSubmit={handleCreateDemo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="demo-name" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                      Restaurant Name
                    </label>
                    <input
                      id="demo-name"
                      type="text"
                      required
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      placeholder="e.g. Blue Bottle Specialty Bar"
                      style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="demo-theme" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                      Menu Theme Preset
                    </label>
                    <select
                      id="demo-theme"
                      value={demoThemePreset}
                      onChange={(e) => setDemoThemePreset(e.target.value as any)}
                      style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                    >
                      <option value="WARM_EDITORIAL" className="bg-[#1A120D] text-white">Warm Editorial (Lora & DM Sans)</option>
                      <option value="BOTANICAL_CAFE" className="bg-[#1A120D] text-white">Botanical Café (Playfair & DM Sans)</option>
                      <option value="MIDNIGHT_ESPRESSO" className="bg-[#1A120D] text-white">Midnight Espresso (Dark Luxury)</option>
                      <option value="PASTEL_PATISSERIE" className="bg-[#1A120D] text-white">Pastel Patisserie (Bakery & Cafe)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="demo-country" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                      Country & Currency
                    </label>
                    <select
                      id="demo-country"
                      value={demoCountry}
                      onChange={(e) => handleDemoCountryChange(e.target.value === 'US' ? 'US' : 'IN')}
                      style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                      className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input"
                    >
                      <option value="IN" className="bg-[#1A120D] text-white py-1">🇮🇳 India (INR ₹)</option>
                      <option value="US" className="bg-[#1A120D] text-white py-1">🇺🇸 US (USD $)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="demo-city" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                      City
                    </label>
                    <input
                      id="demo-city"
                      type="text"
                      value={demoCity}
                      onChange={(e) => setDemoCity(e.target.value)}
                      placeholder="e.g. Mumbai / Austin"
                      style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                      className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="demo-description" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                    Short Venue Description
                  </label>
                  <input
                    id="demo-description"
                    type="text"
                    value={demoDescription}
                    onChange={(e) => setDemoDescription(e.target.value)}
                    placeholder="e.g. Small-batch sourdough bakes & single-origin coffee in Bandra."
                    style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                    className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                  />
                </div>

                {/* Starter Dishes Builder + AI Upload Extraction */}
                <div className="p-3.5 bg-[#110C09] rounded-2xl border border-espresso-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-cream-100">
                        Starter Dishes ({demoDishes.length})
                      </div>
                      <div className="text-[11px] text-taupe-400">
                        Customize items below or upload a menu photo/PDF to auto-fill via Gemini Vision
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3 h-3 text-terracotta" />
                        <span>{demoExtracting ? 'Extracting...' : 'Scan Menu Photo/PDF'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          disabled={demoExtracting}
                          onChange={handleExtractDemoDishes}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleAddDemoDishRow}
                        className="px-2.5 py-1.5 rounded-lg bg-terracotta/20 hover:bg-terracotta/30 border border-terracotta/40 text-terracotta text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Dish</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {demoDishes.map((dish, idx) => (
                      <div
                        key={dish.localId}
                        className="p-2.5 rounded-xl bg-[#160F0B] border border-espresso-800/90 space-y-2"
                      >
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            aria-label={`Dish ${idx + 1} name`}
                            placeholder="Dish name"
                            value={dish.name}
                            onChange={(e) => handleUpdateDemoDish(dish.localId, 'name', e.target.value)}
                            style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                            className="col-span-4 px-2.5 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 dark-input"
                          />
                          <input
                            type="text"
                            aria-label={`Dish ${idx + 1} category`}
                            placeholder="Category"
                            value={dish.category}
                            onChange={(e) => handleUpdateDemoDish(dish.localId, 'category', e.target.value)}
                            style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                            className="col-span-3 px-2.5 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 dark-input"
                          />
                          <input
                            type="number"
                            step={demoCountry === 'US' ? '0.01' : '1'}
                            min="0"
                            aria-label={`Dish ${idx + 1} price`}
                            placeholder={demoCountry === 'US' ? '14.00' : '250'}
                            value={dish.price}
                            onChange={(e) => handleUpdateDemoDish(dish.localId, 'price', e.target.value)}
                            style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                            className="col-span-2 px-2 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 font-mono dark-input"
                          />
                          <select
                            aria-label={`Dish ${idx + 1} dietary type`}
                            value={dish.foodType}
                            onChange={(e) => handleUpdateDemoDish(dish.localId, 'foodType', e.target.value)}
                            style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                            className="col-span-2 px-1.5 py-1.5 rounded-lg bg-[#140E0A] border border-espresso-700 text-[11px] text-cream-50 dark-input"
                          >
                            <option value="VEG">Veg</option>
                            <option value="NON_VEG">Non-Veg</option>
                            <option value="EGG">Egg</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveDemoDish(dish.localId)}
                            title="Remove dish"
                            className="col-span-1 flex items-center justify-center p-1.5 rounded-lg text-taupe-400 hover:text-red-400 hover:bg-espresso-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          aria-label={`Dish ${idx + 1} description`}
                          placeholder="Optional brief dish description..."
                          value={dish.description}
                          onChange={(e) => handleUpdateDemoDish(dish.localId, 'description', e.target.value)}
                          style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                          className="w-full px-2.5 py-1 rounded-lg bg-[#140E0A] border border-espresso-800 text-[11px] text-taupe-200 dark-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {generatedDemoResult && (
                  <div className="p-3.5 bg-emerald-950/90 border border-emerald-800 text-emerald-200 rounded-xl text-xs space-y-2.5">
                    <div className="font-semibold text-emerald-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Demo Menu Live ({generatedDemoResult.dishCount} dishes • {generatedDemoResult.canonicalMatchedCount} canonical 3D matches)
                      </span>
                      <a
                        href={generatedDemoResult.publicMenuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-300 hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        Inspect Menu <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="p-2 rounded bg-black/50 border border-emerald-800/80 font-mono text-[11px] text-white break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate">{generatedDemoResult.claimUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedDemoResult.claimUrl, 'claim', true)}
                        className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-semibold shrink-0"
                      >
                        {copiedClaimUrl ? 'Copied!' : 'Copy Claim URL'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-espresso-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDemoModalOpen(false);
                      setGeneratedDemoResult(null);
                      setDemoError(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={demoLoading || demoExtracting}
                    className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {demoLoading ? 'Creating Demo...' : 'Create Demo Restaurant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* =========================================================================
          MODAL 3: CLAIM APPROVAL MODAL (Replaces browser prompt)
      ========================================================================= */}
      {isClaimModalOpen && activeClaimToApprove && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsClaimModalOpen(false);
            }}
          >
            <div
              className="p-6 bg-[#160F0B] border border-espresso-700 rounded-3xl max-w-md w-full shadow-2xl space-y-4 text-cream-50 animate-modal-content max-h-[92vh] overflow-y-auto"
              style={{ colorScheme: 'dark' }}
            >
              <div className="flex items-center justify-between border-b border-espresso-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-cream-50">Approve Ownership Claim</h3>
                    <p className="text-[11px] text-taupe-400">Transfer venue ownership to verified claimant</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="text-taupe-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {claimError && (
                <div role="alert" className="p-3 bg-red-950/90 border border-red-800 text-red-200 rounded-xl text-xs">
                  {claimError}
                </div>
              )}

              <div className="p-3 bg-[#110C09] rounded-xl border border-espresso-800 text-xs space-y-1">
                <div className="text-taupe-400">Venue to Transfer:</div>
                <div className="font-semibold text-cream-50">{activeClaimToApprove.restaurant?.displayName}</div>
                <div className="text-taupe-400 pt-1">Claimant Email:</div>
                <div className="font-mono text-terracotta">{activeClaimToApprove.claimantEmail}</div>
              </div>

              <form onSubmit={handleConfirmApproveClaim} className="space-y-3.5">
                <div>
                  <label htmlFor="approve-verification-notes" className="block text-xs font-semibold text-taupe-300 mb-1.5">
                    Verification Notes (Audited)
                  </label>
                  <textarea
                    id="approve-verification-notes"
                    required
                    rows={3}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Verified business registry documents, confirmed matching domain email."
                    style={{ colorScheme: 'dark', backgroundColor: '#140E0A', color: '#FAF7F2' }}
                    className="w-full px-3 py-2 rounded-xl bg-[#140E0A] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-espresso-800">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-taupe-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {claimLoading ? 'Transferring...' : 'Confirm Transfer & Approve'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* =========================================================================
          MODAL 4: GENERATED PRIVATE CLAIM LINK MODAL
      ========================================================================= */}
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
    </div>
  );
}
