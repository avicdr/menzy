'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  Download,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Palette,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { formatCurrencyMinor, PLAN_CATALOG, PlanKey } from '@/lib/payments/plans';
import { THEME_PRESETS, ThemeConfig, validateThemeAccessibility, generateThemeVariables } from '@/lib/theme/theme-presets';
import { DietaryBadge, FssaiMarker } from '@/components/diner/DietaryBadge';

export default function RestaurantDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-100">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RestaurantDashboardContent />
    </React.Suspense>
  );
}

function RestaurantDashboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const restaurantId = params?.restaurantId as string;
  const currentTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [billingUsage, setBillingUsage] = useState<any>(null);

  // Menu Studio State
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('250');
  const [newDishCategory, setNewDishCategory] = useState('');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishIsPopular, setNewDishIsPopular] = useState(false);
  const [newDishChefRecommended, setNewDishChefRecommended] = useState(false);
  const [newDishFoodType, setNewDishFoodType] = useState<'VEG' | 'NON_VEG' | 'EGG'>('VEG');
  const [newDishDietaryTags, setNewDishDietaryTags] = useState<string[]>([]);
  const [menuFilter, setMenuFilter] = useState<string>('ALL');
  const [isUploadingMenu, setIsUploadingMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Theme Studio State
  const [themeState, setThemeState] = useState<ThemeConfig>(THEME_PRESETS.WARM_EDITORIAL);
  const [themeWarnings, setThemeWarnings] = useState<string[]>([]);
  const [themeSavedToast, setThemeSavedToast] = useState(false);

  // Illustration Lab State
  const [isGeneratingImg, setIsGeneratingImg] = useState<string | null>(null);
  const [customPromptTweak, setCustomPromptTweak] = useState('');

  // AI Waiter State
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [aiTone, setAiTone] = useState('');

  // QR Studio State
  const [qrData, setQrData] = useState<{ qrDataUrl: string; targetUrl: string } | null>(null);

  // Load session & restaurant details
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setCurrentUser(meData.user);

        // Find requested restaurant
        let targetRest = null;
        for (const org of meData.user.organizations || []) {
          for (const r of org.restaurants || []) {
            if (r.id === restaurantId || r.slug === restaurantId) {
              targetRest = r;
              break;
            }
          }
        }

        if (!targetRest) {
          targetRest = meData.user.organizations[0]?.restaurants[0];
        }

        if (targetRest) {
          setRestaurant(targetRest);
          // Load items
          const itemsRes = await fetch(`/api/menus/items?restaurantId=${targetRest.id}`);
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            setMenuItems(itemsData.items || []);
          }

          // Load billing & usage
          const billRes = await fetch(`/api/billing/usage?restaurantId=${targetRest.id}`);
          if (billRes.ok) {
            const billData = await billRes.json();
            setBillingUsage(billData);
          }

          // Load theme
          const dinerRes = await fetch(`/api/diner/menu?slug=${targetRest.slug}`);
          if (dinerRes.ok) {
            const dinerData = await dinerRes.json();
            if (dinerData.theme) {
              setThemeState({
                presetKey: dinerData.theme.presetKey || 'WARM_EDITORIAL',
                backgroundColor: dinerData.theme.backgroundColor || '#F7F3EC',
                surfaceColor: dinerData.theme.surfaceColor || '#FFFFFF',
                primaryTextColor: dinerData.theme.primaryTextColor || '#35271F',
                secondaryTextColor: dinerData.theme.secondaryTextColor || '#7C695C',
                accentColor: dinerData.theme.accentColor || '#B86D52',
                secondaryAccentColor: dinerData.theme.secondaryAccentColor || '#70816B',
                headingFont: dinerData.theme.headingFont || 'Instrument Serif',
                bodyFont: dinerData.theme.bodyFont || 'DM Sans',
                layoutMode: dinerData.theme.layoutMode || 'GRID',
                cardRadius: dinerData.theme.cardRadius || '16px',
                buttonStyle: dinerData.theme.buttonStyle || 'rounded',
                imageProportions: dinerData.theme.imageProportions || 'square',
                texture: dinerData.theme.texture || 'none',
              });
            }
            if (dinerData.settings) {
              setWelcomeMsg(dinerData.settings.welcomeMessage || '');
              setAiTone(dinerData.settings.aiTone || '');
            }
          }

          // Load QR code
          const qrRes = await fetch(`/api/qr/generate?slug=${targetRest.slug}`);
          if (qrRes.ok) {
            const qData = await qrRes.json();
            setQrData(qData);
          }
        }
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [restaurantId, router]);

  // Toggle dish availability
  const handleToggleAvailability = async (item: any) => {
    const updated = !item.isAvailable;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: updated } : i))
    );

    await fetch('/api/menus/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        restaurantId: restaurant.id,
        isAvailable: updated,
      }),
    });
  };

  // Delete dish
  const handleDeleteDish = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this dish?')) return;
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));

    await fetch(`/api/menus/items?itemId=${itemId}&restaurantId=${restaurant.id}`, {
      method: 'DELETE',
    });
  };

  // Derived unique categories
  const existingCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of menuItems) {
      if (it.category) {
        map.set(it.category.id, it.category.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [menuItems]);

  const isIndianRestaurant = restaurant?.country === 'IN' || restaurant?.currency === 'INR';

  // Toggle Popular / Bestseller
  const handleTogglePopular = async (item: any) => {
    const updated = !item.isPopular;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPopular: updated } : i))
    );

    await fetch('/api/menus/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        restaurantId: restaurant.id,
        isPopular: updated,
      }),
    });
  };

  // Toggle Chef Recommendation
  const handleToggleChefPick = async (item: any) => {
    const updated = !item.chefRecommended;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, chefRecommended: updated } : i))
    );

    await fetch('/api/menus/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        restaurantId: restaurant.id,
        chefRecommended: updated,
      }),
    });
  };

  // Add custom dish
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const priceMinor = Math.round(parseFloat(newDishPrice || '0') * 100);

    let finalDietaryStatus: string[] = [];
    if (isIndianRestaurant) {
      finalDietaryStatus = [newDishFoodType, ...newDishDietaryTags];
    } else {
      finalDietaryStatus = [...newDishDietaryTags];
    }

    const res = await fetch('/api/menus/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        categoryId: newDishCategory || undefined,
        categoryName: newDishCategory ? undefined : 'Chef Specials',
        customName: newDishName,
        priceMinor,
        description: newDishDescription,
        currency: restaurant.currency,
        isPopular: newDishIsPopular,
        chefRecommended: newDishChefRecommended,
        dietaryStatus: finalDietaryStatus,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMenuItems((prev) => [...prev, data.item]);
      setIsAddDishOpen(false);
      setNewDishName('');
      setNewDishDescription('');
      setNewDishPrice(restaurant.currency === 'USD' ? '12.50' : '250');
      setNewDishCategory('');
      setNewDishIsPopular(false);
      setNewDishChefRecommended(false);
      setNewDishFoodType('VEG');
      setNewDishDietaryTags([]);
    }
  };

  // OCR Menu Extraction
  const handleMenuFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    setIsUploadingMenu(true);
    setUploadProgress('Uploading menu files to secure storage...');

    try {
      const formData = new FormData();
      formData.append('restaurantId', restaurant.id);
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const uploadRes = await fetch('/api/menus/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      setUploadProgress('Gemini reading menu & matching dishes against canonical library...');

      const extractRes = await fetch('/api/menus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          uploadId: uploadData.uploadId,
          jobId: uploadData.jobId,
        }),
      });

      if (!extractRes.ok) throw new Error('Extraction failed');
      const extractData = await extractRes.json();

      setUploadProgress(`Extracted ${extractData.extractedItemsCount} dishes successfully!`);
      // Reload items
      const itemsRes = await fetch(`/api/menus/items?restaurantId=${restaurant.id}`);
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setMenuItems(itemsData.items || []);
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading menu');
    } finally {
      setTimeout(() => {
        setIsUploadingMenu(false);
        setUploadProgress(null);
      }, 2000);
    }
  };

  // Generate / Regenerate Illustration
  const handleGenerateIllustration = async (item: any) => {
    setIsGeneratingImg(item.id);
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          menuItemId: item.id,
          dishName: item.customName,
          visualDescription: item.restaurantDescription || item.customName,
          customInstructions: customPromptTweak || undefined,
          forceRegenerate: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to generate illustration');
        return;
      }

      // Update local item
      setMenuItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, imageOverride: data.asset, imageOverrideAssetId: data.asset.id } : i
        )
      );

      // Refresh billing credits
      const billRes = await fetch(`/api/billing/usage?restaurantId=${restaurant.id}`);
      if (billRes.ok) {
        setBillingUsage(await billRes.json());
      }
    } catch (err) {
      alert('Error generating illustration');
    } finally {
      setIsGeneratingImg(null);
    }
  };

  // Save / Publish Theme
  const handleSaveTheme = async (isPublishing: boolean) => {
    const access = validateThemeAccessibility(themeState);
    setThemeWarnings(access.warnings);

    if (!access.isValid && isPublishing) {
      alert('Cannot publish theme: Low text/background contrast fails accessibility standards.');
      return;
    }

    const res = await fetch('/api/themes/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        isPublishing,
        ...themeState,
      }),
    });

    if (res.ok) {
      setThemeSavedToast(true);
      setTimeout(() => setThemeSavedToast(false), 3000);
    }
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif text-espresso-700">Loading Owner Console...</p>
        </div>
      </div>
    );
  }

  const allRestaurants = currentUser?.organizations?.flatMap((o: any) => o.restaurants) || [restaurant];
  const planName = billingUsage?.plan?.name || 'Growth';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream-100/40 w-full min-w-0 overflow-x-hidden">
      {/* Sidebar Nav */}
      <DashboardNav
        currentRestaurant={restaurant}
        allRestaurants={allRestaurants}
        userEmail={currentUser?.email || ''}
        planName={planName}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-cream-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso-900">
              {restaurant.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-taupe-500 mt-1">
              {restaurant.city}, {restaurant.country} • Currency: {restaurant.currency}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={`/m/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-cream-300 text-xs sm:text-sm font-semibold text-espresso-800 hover:bg-cream-50 shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4 text-terracotta" />
              View Live Diner Menu
            </a>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW
        ========================================================================= */}
        {currentTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">Total Menu Items</span>
                <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2">{menuItems.length}</div>
                <div className="text-[11px] sm:text-xs text-sage-700 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Live & searchable
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">QR Scans Today</span>
                <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2">42</div>
                <div className="text-[11px] sm:text-xs text-sage-700 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Active engagement
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">AI Questions</span>
                <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2">{billingUsage?.chatQueriesThisMonth || 0}</div>
                <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                  of {billingUsage?.maxChatQueries || 1000} allowance
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">3D Credits Left</span>
                <div className="text-2xl sm:text-3xl font-bold text-terracotta mt-2">{billingUsage?.remainingImageCredits ?? 15}</div>
                <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                  {billingUsage?.plan?.name || 'Starter'} plan
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-cream-100 to-cream-50 rounded-3xl border border-cream-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-espresso-900">Get Diners Scanning Today</h3>
                <p className="text-xs sm:text-sm text-taupe-600 mt-0.5">
                  Download high-resolution QR codes and printable 4x6" table tents for your tables.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => router.push(`/dashboard/${restaurant.id}?tab=qr`)}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-terracotta" /> Download QR Studio
                </button>
                <button
                  onClick={() => router.push(`/dashboard/${restaurant.id}?tab=menu`)}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-white border border-cream-300 text-espresso-800 text-xs sm:text-sm font-semibold hover:bg-cream-100 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-espresso-700" /> Upload New Menu
                </button>
              </div>
            </div>

            {/* Recent Dishes Preview */}
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-espresso-900">Your Menu Highlights</h3>
                <button
                  onClick={() => router.push(`/dashboard/${restaurant.id}?tab=menu`)}
                  className="text-xs font-semibold text-terracotta hover:underline"
                >
                  Open Menu Studio &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {menuItems.slice(0, 3).map((item) => {
                  const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200">
                      <img src={img} alt={item.customName} className="w-16 h-16 rounded-xl object-cover bg-white shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-espresso-900 truncate">{item.customName}</h4>
                        <span className="text-xs font-bold text-espresso-700">
                          {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${item.isAvailable ? 'bg-sage-100 text-sage-800' : 'bg-red-100 text-red-800'}`}>
                            {item.isAvailable ? 'In Stock' : 'Sold Out'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MENU STUDIO
        ========================================================================= */}
        {currentTab === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Menu Studio</h2>
                <p className="text-xs text-taupe-500">Edit dish names, prices, recipes, and real-time availability</p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
                {/* Upload Menu Button */}
                <label className="flex-1 sm:flex-none justify-center cursor-pointer px-4 py-2 rounded-xl bg-cream-200 text-espresso-800 text-xs sm:text-sm font-semibold hover:bg-cream-300 transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Upload className="w-4 h-4 text-terracotta" />
                  <span>Upload Menu PDF/Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleMenuFileUpload}
                    className="hidden"
                    disabled={isUploadingMenu}
                  />
                </label>

                {/* Add Dish Button */}
                <button
                  onClick={() => setIsAddDishOpen(true)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-[var(--dishora-accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-95 transition-opacity flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add Dish
                </button>
              </div>
            </div>

            {/* Upload Progress Alert */}
            {isUploadingMenu && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-amber-900 animate-fade-in">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-700 shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            {/* Dishes Data Table */}
            <div className="bg-white rounded-3xl border border-cream-200 shadow-soft overflow-hidden">
              {/* Quick Filter Bar */}
              <div className="p-3.5 border-b border-cream-200 bg-cream-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setMenuFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    menuFilter === 'ALL'
                      ? 'bg-espresso-900 text-white shadow-sm'
                      : 'bg-white border border-cream-200 text-taupe-600 hover:bg-cream-100'
                  }`}
                >
                  All Dishes ({menuItems.length})
                </button>

                <button
                  onClick={() => setMenuFilter('POPULAR')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    menuFilter === 'POPULAR'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-white border border-cream-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> Popular & Bestsellers ({menuItems.filter((i) => i.isPopular || i.chefRecommended).length})
                </button>

                {isIndianRestaurant ? (
                  <>
                    <button
                      onClick={() => setMenuFilter('VEG')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        menuFilter === 'VEG'
                          ? 'bg-green-700 text-white shadow-sm'
                          : 'bg-white border border-cream-200 text-green-800 hover:bg-green-50'
                      }`}
                    >
                      <FssaiMarker type="VEG" /> Pure Veg
                    </button>
                    <button
                      onClick={() => setMenuFilter('NON_VEG')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        menuFilter === 'NON_VEG'
                          ? 'bg-[#7B3F00] text-white shadow-sm'
                          : 'bg-white border border-cream-200 text-[#7B3F00] hover:bg-amber-50'
                      }`}
                    >
                      <FssaiMarker type="NON_VEG" /> Non-Veg
                    </button>
                    <button
                      onClick={() => setMenuFilter('EGG')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        menuFilter === 'EGG'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white border border-cream-200 text-amber-800 hover:bg-yellow-50'
                      }`}
                    >
                      <FssaiMarker type="EGG" /> Contains Egg
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setMenuFilter('VEGAN')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        menuFilter === 'VEGAN'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-white border border-cream-200 text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      Vegan
                    </button>
                    <button
                      onClick={() => setMenuFilter('GLUTEN_FREE')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        menuFilter === 'GLUTEN_FREE'
                          ? 'bg-amber-700 text-white shadow-sm'
                          : 'bg-white border border-cream-200 text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      Gluten-Free
                    </button>
                  </>
                )}
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
                  <thead className="bg-cream-50 text-taupe-500 border-b border-cream-200 uppercase font-semibold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Dish</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4 text-center">Spotlight Tags</th>
                      <th className="py-3.5 px-4 text-center">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100">
                    {menuItems
                      .filter((item) => {
                        if (menuFilter === 'POPULAR') return Boolean(item.isPopular || item.chefRecommended);
                        if (menuFilter === 'VEG') {
                          const labels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase());
                          return labels.includes('VEG') || labels.includes('VEGETARIAN') || labels.includes('PURE_VEG');
                        }
                        if (menuFilter === 'NON_VEG') {
                          const labels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase());
                          return labels.includes('NON_VEG') || labels.includes('NON-VEG') || labels.includes('NONVEG');
                        }
                        if (menuFilter === 'EGG') {
                          const labels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase());
                          return labels.includes('EGG') || labels.includes('CONTAINS_EGG') || labels.includes('EGGETARIAN');
                        }
                        if (menuFilter === 'VEGAN') {
                          const labels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase());
                          return labels.includes('VEGAN');
                        }
                        if (menuFilter === 'GLUTEN_FREE') {
                          const labels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase());
                          return labels.includes('GLUTEN_FREE') || labels.includes('GF');
                        }
                        return true;
                      })
                      .map((item) => {
                        const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                        const dietaryLabels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase());
                        const isVeg = dietaryLabels.some((l) => ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(l));
                        const isNonVeg = dietaryLabels.some((l) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(l));
                        const isEgg = dietaryLabels.some((l) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l));
                        const indianMarker = isVeg ? 'VEG' : isNonVeg ? 'NON_VEG' : isEgg ? 'EGG' : null;

                        return (
                          <tr key={item.id} className="hover:bg-cream-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img src={img} alt={item.customName} className="w-12 h-12 rounded-xl object-cover bg-cream-100 shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {indianMarker && <FssaiMarker type={indianMarker} size="sm" />}
                                    <span className="font-semibold text-espresso-900 truncate">{item.customName}</span>
                                  </div>
                                  {item.restaurantDescription && (
                                    <p className="text-[11px] text-taupe-500 line-clamp-1 max-w-xs">{item.restaurantDescription}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-taupe-600 font-medium">
                              {item.category?.name || 'General'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-espresso-900">
                              {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePopular(item)}
                                  title={item.isPopular ? "Remove from Bestsellers" : "Mark as Popular / Bestseller"}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                                    item.isPopular
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                                      : 'bg-cream-100 text-taupe-400 border border-cream-200 hover:text-rose-700 hover:bg-rose-50'
                                  }`}
                                >
                                  <Flame className={`w-3.5 h-3.5 ${item.isPopular ? 'text-rose-600' : 'text-taupe-400'}`} />
                                  <span className="hidden sm:inline">Popular</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleChefPick(item)}
                                  title={item.chefRecommended ? "Remove Chef Pick" : "Mark as Chef's Recommendation"}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                                    item.chefRecommended
                                      ? 'bg-terracotta-100 text-terracotta-800 border border-terracotta-300 shadow-2xs'
                                      : 'bg-cream-100 text-taupe-400 border border-cream-200 hover:text-terracotta hover:bg-terracotta-50'
                                  }`}
                                >
                                  <Sparkles className={`w-3.5 h-3.5 ${item.chefRecommended ? 'text-terracotta-600' : 'text-taupe-400'}`} />
                                  <span className="hidden sm:inline">Chef Pick</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  item.isAvailable
                                    ? 'bg-sage-100 text-sage-800 hover:bg-sage-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {item.isAvailable ? 'Available' : 'Sold Out'}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteDish(item.id)}
                                className="p-1.5 text-taupe-400 hover:text-red-600 transition-colors rounded-lg hover:bg-cream-100"
                                title="Delete dish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Dish Modal */}
            {isAddDishOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-sheet space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-espresso-900">Add New Dish</h3>
                      <p className="text-xs text-taupe-500">
                        {isIndianRestaurant ? 'Indian Restaurant Menu Item' : 'Hospitality Menu Item'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddDishOpen(false)}
                      className="p-1 rounded-lg text-taupe-400 hover:bg-cream-100"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddDish} className="space-y-4">
                    {/* Dish Name & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-taupe-600 mb-1">Dish Name *</label>
                        <input
                          type="text"
                          required
                          value={newDishName}
                          onChange={(e) => setNewDishName(e.target.value)}
                          placeholder={isIndianRestaurant ? "e.g. Paneer Butter Masala" : "e.g. Truffle Pappardelle"}
                          className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-taupe-600 mb-1">Category</label>
                        <select
                          value={newDishCategory}
                          onChange={(e) => setNewDishCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                        >
                          <option value="">Default / Chef Specials</option>
                          {existingCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-taupe-600 mb-1">
                        Price ({restaurant.currency}) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={newDishPrice}
                        onChange={(e) => setNewDishPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-taupe-600 mb-1">Description / Recipe</label>
                      <textarea
                        rows={2}
                        value={newDishDescription}
                        onChange={(e) => setNewDishDescription(e.target.value)}
                        placeholder="Key spices, preparation technique, portion size..."
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>

                    {/* Spotlight: Popular & Chef Recommendation */}
                    <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
                      <span className="block text-xs font-semibold text-espresso-900">
                        Menu Spotlight Options
                      </span>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                          <input
                            type="checkbox"
                            checked={newDishIsPopular}
                            onChange={(e) => setNewDishIsPopular(e.target.checked)}
                            className="rounded border-cream-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                          />
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-600" />
                            <strong>Popular / Bestseller</strong> (Highlights dish with flame badge)
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                          <input
                            type="checkbox"
                            checked={newDishChefRecommended}
                            onChange={(e) => setNewDishChefRecommended(e.target.checked)}
                            className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                          />
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                            <strong>Chef's Recommendation</strong>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Dietary Classification: Indian FSSAI vs Western */}
                    {isIndianRestaurant ? (
                      <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-espresso-900 mb-2">
                            Indian Food Classification (FSSAI) *
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setNewDishFoodType('VEG')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                newDishFoodType === 'VEG'
                                  ? 'bg-green-100 border-green-600 text-green-900 ring-2 ring-green-500/20'
                                  : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                              }`}
                            >
                              <FssaiMarker type="VEG" /> Pure Veg
                            </button>

                            <button
                              type="button"
                              onClick={() => setNewDishFoodType('NON_VEG')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                newDishFoodType === 'NON_VEG'
                                  ? 'bg-amber-100 border-[#7B3F00] text-[#7B3F00] ring-2 ring-amber-500/20'
                                  : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                              }`}
                            >
                              <FssaiMarker type="NON_VEG" /> Non-Veg
                            </button>

                            <button
                              type="button"
                              onClick={() => setNewDishFoodType('EGG')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                newDishFoodType === 'EGG'
                                  ? 'bg-yellow-100 border-amber-500 text-amber-900 ring-2 ring-yellow-500/20'
                                  : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                              }`}
                            >
                              <FssaiMarker type="EGG" /> Contains Egg
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-taupe-600 mb-1">
                            Additional Indian Options
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: 'JAIN', label: 'Jain Safe (No Onion/Garlic)' },
                              { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                              { key: 'VEGAN', label: 'Vegan' },
                            ].map((tag) => {
                              const checked = newDishDietaryTags.includes(tag.key);
                              return (
                                <button
                                  type="button"
                                  key={tag.key}
                                  onClick={() => {
                                    setNewDishDietaryTags((prev) =>
                                      checked ? prev.filter((t) => t !== tag.key) : [...prev, tag.key]
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                    checked
                                      ? 'bg-espresso-900 text-white border-espresso-900'
                                      : 'bg-white border-cream-300 text-taupe-600 hover:bg-cream-100'
                                  }`}
                                >
                                  {checked ? '✓ ' : '+ '} {tag.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Western / Abroad Dietary Classification */
                      <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
                        <label className="block text-xs font-semibold text-espresso-900 mb-1">
                          Dietary Suitability & Allergens (Abroad)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'VEGETARIAN', label: 'Vegetarian' },
                            { key: 'VEGAN', label: 'Vegan' },
                            { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                            { key: 'DAIRY_FREE', label: 'Dairy-Free' },
                            { key: 'NUT_FREE', label: 'Nut-Free' },
                            { key: 'HALAL', label: 'Halal' },
                            { key: 'KOSHER', label: 'Kosher' },
                          ].map((tag) => {
                            const checked = newDishDietaryTags.includes(tag.key);
                            return (
                              <button
                                type="button"
                                key={tag.key}
                                onClick={() => {
                                  setNewDishDietaryTags((prev) =>
                                    checked ? prev.filter((t) => t !== tag.key) : [...prev, tag.key]
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                  checked
                                    ? 'bg-espresso-900 text-white border-espresso-900'
                                    : 'bg-white border-cream-300 text-taupe-600 hover:bg-cream-100'
                                }`}
                              >
                                {checked ? '✓ ' : '+ '} {tag.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-200">
                      <button
                        type="button"
                        onClick={() => setIsAddDishOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-taupe-600 hover:bg-cream-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 shadow-sm"
                      >
                        Save Dish to Menu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: ILLUSTRATION LAB (VECTOR LAB)
        ========================================================================= */}
        {currentTab === 'illustrations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Illustration Lab</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Manage 3D-clay-styled illustrations, customize prompts, or upload authentic food photographs.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-terracotta-50 text-terracotta-700 font-bold text-xs border border-terracotta-200">
                  {billingUsage?.remainingImageCredits ?? 15} Generation Credits Remaining
                </span>
              </div>
            </div>

            {/* Gallery of Dishes & Visuals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => {
                const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                const isReused = Boolean(item.canonicalId && !item.imageOverrideAssetId);

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-soft flex flex-col justify-between">
                    <div className="relative aspect-video w-full bg-cream-100">
                      <img src={img} alt={item.customName} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isReused ? 'bg-sage-100 text-sage-800' : 'bg-terracotta-100 text-terracotta-800'}`}>
                          {isReused ? 'Canonical Library' : 'Custom Generated'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-base text-espresso-900">{item.customName}</h4>
                        <p className="text-xs text-taupe-500 line-clamp-2 mt-0.5">{item.restaurantDescription || 'No description'}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-cream-100">
                        <button
                          onClick={() => handleGenerateIllustration(item)}
                          disabled={isGeneratingImg === item.id}
                          className="flex-1 py-2 px-3 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                          {isGeneratingImg === item.id ? 'Generating...' : 'Regenerate 3D'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: THEME STUDIO
        ========================================================================= */}
        {currentTab === 'theme' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 sm:p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Restaurant Theme Studio</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Customize colors, typography, and card layout for your public diner menu.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleSaveTheme(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cream-200 text-espresso-800 font-semibold text-xs sm:text-sm hover:bg-cream-300 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSaveTheme(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm"
                >
                  Publish Theme
                </button>
              </div>
            </div>

            {themeSavedToast && (
              <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                Theme saved & published! Public diner menu cache updated.
              </div>
            )}

            {/* Studio Layout: Left Controls + Right Phone Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Config Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 4 Starter Presets */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Curated Hospitality Presets
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => setThemeState(preset)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          themeState.presetKey === key
                            ? 'border-terracotta ring-2 ring-terracotta/20 bg-cream-50'
                            : 'border-cream-200 hover:border-cream-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.backgroundColor }} />
                          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.accentColor }} />
                          <span className="font-semibold text-xs text-espresso-900">{preset.presetKey.replace(/_/g, ' ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors Customization */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Color Palette
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Background</span>
                      <input
                        type="color"
                        value={themeState.backgroundColor}
                        onChange={(e) => setThemeState({ ...themeState, backgroundColor: e.target.value })}
                        className="w-full h-10 rounded-xl cursor-pointer border border-cream-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Surface Cards</span>
                      <input
                        type="color"
                        value={themeState.surfaceColor}
                        onChange={(e) => setThemeState({ ...themeState, surfaceColor: e.target.value })}
                        className="w-full h-10 rounded-xl cursor-pointer border border-cream-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Text Color</span>
                      <input
                        type="color"
                        value={themeState.primaryTextColor}
                        onChange={(e) => setThemeState({ ...themeState, primaryTextColor: e.target.value })}
                        className="w-full h-10 rounded-xl cursor-pointer border border-cream-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Accent Brand</span>
                      <input
                        type="color"
                        value={themeState.accentColor}
                        onChange={(e) => setThemeState({ ...themeState, accentColor: e.target.value })}
                        className="w-full h-10 rounded-xl cursor-pointer border border-cream-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Layout Mode Switcher */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Menu Card Layout Mode
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setThemeState({ ...themeState, layoutMode: 'GRID' })}
                      className={`flex-1 py-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
                        themeState.layoutMode === 'GRID'
                          ? 'border-espresso-900 bg-espresso-900 text-white'
                          : 'border-cream-300 bg-white text-espresso-700 hover:bg-cream-50'
                      }`}
                    >
                      Grid Cards (Visual Forward)
                    </button>
                    <button
                      onClick={() => setThemeState({ ...themeState, layoutMode: 'LIST' })}
                      className={`flex-1 py-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
                        themeState.layoutMode === 'LIST'
                          ? 'border-espresso-900 bg-espresso-900 text-white'
                          : 'border-cream-300 bg-white text-espresso-700 hover:bg-cream-50'
                      }`}
                    >
                      Editorial List (Text & Price)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Live Phone Preview */}
              <div className="lg:col-span-5 flex justify-center w-full">
                <div className="w-full max-w-[340px] rounded-[40px] border-[8px] sm:border-[10px] border-espresso-900 shadow-lifted overflow-hidden bg-[var(--dishora-bg)] flex flex-col h-[600px] sm:h-[650px] relative mx-auto" style={generateThemeVariables(themeState)}>
                  {/* Phone Notch */}
                  <div className="w-32 h-5 bg-espresso-900 rounded-b-xl mx-auto shrink-0" />

                  {/* Simulated Diner Header */}
                  <div className="p-4 border-b border-[var(--dishora-border)] bg-[var(--dishora-surface)]">
                    <h3 className="font-serif text-lg font-bold text-[var(--dishora-text)] truncate">{restaurant.displayName}</h3>
                    <p className="text-[10px] text-[var(--dishora-muted-text)]">Live Theme Preview</p>
                  </div>

                  {/* Simulated Dishes Preview */}
                  <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
                    {menuItems.slice(0, 3).map((item) => {
                      const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                      return (
                        <div key={item.id} className="p-2.5 rounded-xl border border-[var(--dishora-border)] bg-[var(--dishora-surface)] flex items-center gap-2.5 shadow-sm">
                          <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover bg-cream-100 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs text-[var(--dishora-text)] truncate">{item.customName}</div>
                            <div className="font-bold text-xs text-[var(--dishora-accent)] mt-0.5">
                              {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Simulated Ask AI Button */}
                  <div className="p-3 bg-[var(--dishora-surface)] border-t border-[var(--dishora-border)]">
                    <div className="w-full py-2.5 rounded-full bg-[var(--dishora-text)] text-[var(--dishora-surface)] text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 shadow">
                      <Sparkles className="w-3 h-3 text-[var(--dishora-accent)]" />
                      Ask our AI waiter
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: QR STUDIO
        ========================================================================= */}
        {currentTab === 'qr' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <h2 className="font-serif text-xl font-bold text-espresso-900">QR Studio</h2>
              <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                Generate high-resolution printable table tent QR art for your dining tables.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* 4x6" Table Tent Card Art */}
              <div className="p-8 bg-white rounded-3xl border border-cream-300 shadow-lifted flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-2xl font-bold">
                  D
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-espresso-900">{restaurant.displayName}</h3>
                  <p className="text-xs text-taupe-500 mt-0.5">See it. Ask it. Crave it.</p>
                </div>

                {qrData?.qrDataUrl ? (
                  <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 shadow-inner">
                    <img src={qrData.qrDataUrl} alt="Table QR" className="w-56 h-56 object-contain" />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-cream-100 rounded-2xl flex items-center justify-center text-xs text-taupe-500">
                    Generating QR...
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">Scan for Visual Menu & AI Sommelier</p>
                  <p className="text-[11px] text-taupe-400">No app installation or account required</p>
                </div>
              </div>

              {/* Download Controls */}
              <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                <h3 className="font-serif text-lg font-bold text-espresso-900">Printable Asset Exports</h3>
                <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                  Export vector SVG for professional offset printing or high-resolution PNG for tabletop displays.
                </p>

                <div className="space-y-3 pt-2">
                  <a
                    href={`/api/qr/generate?slug=${restaurant.slug}&format=svg`}
                    download
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download Print-Ready SVG
                  </a>
                  {qrData?.qrDataUrl && (
                    <a
                      href={qrData.qrDataUrl}
                      download={`${restaurant.slug}-qr.png`}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cream-100 border border-cream-300 text-espresso-800 font-semibold text-xs sm:text-sm hover:bg-cream-200 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download High-Res PNG
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: BILLING & CREDITS
        ========================================================================= */}
        {currentTab === 'billing' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <h2 className="font-serif text-xl font-bold text-espresso-900">Billing & Image Credits</h2>
              <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                Server-enforced subscription tier entitlements and image generation credits.
              </p>
            </div>

            {/* Current Plan Overview */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-espresso-900 to-espresso-800 text-white rounded-3xl shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-cream-200 text-xs font-semibold uppercase tracking-wider">
                  Active Tier
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-cream-100 mt-2">
                  {billingUsage?.plan?.name || 'Growth Plan'}
                </h3>
                <p className="text-xs text-cream-300 mt-1">
                  Status: {billingUsage?.subscription?.status || 'ACTIVE'} • Country: {restaurant.country}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 text-center w-full md:w-auto">
                <div className="flex-1 md:flex-none p-3 bg-white/10 rounded-2xl min-w-[90px] sm:min-w-[100px]">
                  <div className="text-2xl font-bold text-cream-100">{billingUsage?.remainingImageCredits ?? 15}</div>
                  <div className="text-[10px] text-cream-300 uppercase">3D Credits</div>
                </div>
                <div className="flex-1 md:flex-none p-3 bg-white/10 rounded-2xl min-w-[90px] sm:min-w-[100px]">
                  <div className="text-2xl font-bold text-cream-100">{billingUsage?.chatQueriesThisMonth ?? 0}</div>
                  <div className="text-[10px] text-cream-300 uppercase">AI Queries</div>
                </div>
              </div>
            </div>

            {/* Available Plans Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {Object.values(PLAN_CATALOG)
                .filter((p) => p.country === restaurant.country)
                .map((plan) => {
                  const isCurrent = billingUsage?.plan?.key === plan.key;
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
                        <div className="text-2xl font-bold text-espresso-900 mb-4">{plan.monthlyPriceFormatted}</div>

                        <ul className="space-y-2 text-xs text-taupe-600 mb-6">
                          <li>• Up to {plan.itemLimit > 1000 ? 'Unlimited' : plan.itemLimit} menu dishes</li>
                          <li>• {plan.imageCreditsMonthly} custom 3D image credits / mo</li>
                          <li>• {plan.aiQuestionsMonthly.toLocaleString()} AI diner queries / mo</li>
                          <li>• Grounded Gemini conversational waiter</li>
                        </ul>
                      </div>

                      <button
                        onClick={async () => {
                          const res = await fetch('/api/billing/create-subscription', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              restaurantId: restaurant.id,
                              planKey: plan.key,
                            }),
                          });
                          const data = await res.json();
                          alert(`Razorpay checkout initialized for ${plan.name} (Sub ID: ${data.subscriptionId})`);
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          isCurrent
                            ? 'bg-cream-200 text-espresso-700 cursor-default'
                            : 'bg-espresso-900 text-white hover:bg-espresso-800'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
