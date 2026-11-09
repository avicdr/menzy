'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { formatCurrencyMinor, PLAN_CATALOG, PlanKey } from '@/lib/payments/plans';
import { THEME_PRESETS, ThemeConfig, validateThemeAccessibility, generateThemeVariables } from '@/lib/theme/theme-presets';

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

  // Add custom dish
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const firstCat = menuItems[0]?.categoryId || 'default_cat';
    const priceMinor = Math.round(parseFloat(newDishPrice || '0') * 100);

    const res = await fetch('/api/menus/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        categoryId: newDishCategory || firstCat,
        customName: newDishName,
        priceMinor,
        description: newDishDescription,
        currency: restaurant.currency,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMenuItems((prev) => [...prev, data.item]);
      setIsAddDishOpen(false);
      setNewDishName('');
      setNewDishDescription('');
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
    <div className="min-h-screen flex bg-cream-100/40">
      {/* Sidebar Nav */}
      <DashboardNav
        currentRestaurant={restaurant}
        allRestaurants={allRestaurants}
        userEmail={currentUser?.email || ''}
        planName={planName}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-7xl mx-auto">
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

          <div className="flex items-center gap-3">
            <a
              href={`/m/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-cream-300 text-xs sm:text-sm font-semibold text-espresso-800 hover:bg-cream-50 shadow-sm transition-all"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">Total Menu Items</span>
                <div className="text-3xl font-bold text-espresso-900 mt-2">{menuItems.length}</div>
                <div className="text-xs text-sage-700 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All items live & searchable
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">QR Scans Today</span>
                <div className="text-3xl font-bold text-espresso-900 mt-2">42</div>
                <div className="text-xs text-sage-700 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Active diner engagement
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">AI Questions Asked</span>
                <div className="text-3xl font-bold text-espresso-900 mt-2">{billingUsage?.chatQueriesThisMonth || 0}</div>
                <div className="text-xs text-taupe-500 mt-1">
                  of {billingUsage?.maxChatQueries || 1000} monthly allowance
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">Remaining 3D Credits</span>
                <div className="text-3xl font-bold text-terracotta mt-2">{billingUsage?.remainingImageCredits ?? 15}</div>
                <div className="text-xs text-taupe-500 mt-1">
                  {billingUsage?.plan?.name || 'Starter'} plan credits
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-6 bg-gradient-to-r from-cream-100 to-cream-50 rounded-3xl border border-cream-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-espresso-900">Get Diners Scanning Today</h3>
                <p className="text-xs sm:text-sm text-taupe-600 mt-0.5">
                  Download high-resolution QR codes and printable 4x6" table tents for your tables.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => router.push(`/dashboard/${restaurant.id}?tab=qr`)}
                  className="px-4 py-2.5 rounded-xl bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-terracotta" /> Download QR Studio
                </button>
                <button
                  onClick={() => router.push(`/dashboard/${restaurant.id}?tab=menu`)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-cream-300 text-espresso-800 text-xs sm:text-sm font-semibold hover:bg-cream-100 transition-colors shadow-sm flex items-center gap-2"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-cream-200 shadow-soft">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Menu Studio</h2>
                <p className="text-xs text-taupe-500">Edit dish names, prices, recipes, and real-time availability</p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Upload Menu Button */}
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-cream-200 text-espresso-800 text-xs sm:text-sm font-semibold hover:bg-cream-300 transition-colors flex items-center gap-2">
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
                  className="px-4 py-2 rounded-xl bg-[var(--dishora-accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-95 transition-opacity flex items-center gap-2"
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
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-cream-50 text-taupe-500 border-b border-cream-200 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Dish</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4 text-center">Availability</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {menuItems.map((item) => {
                    const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                    return (
                      <tr key={item.id} className="hover:bg-cream-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img src={img} alt={item.customName} className="w-12 h-12 rounded-xl object-cover bg-cream-100 shrink-0" />
                            <div>
                              <div className="font-semibold text-espresso-900">{item.customName}</div>
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

            {/* Add Dish Modal */}
            {isAddDishOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-sheet space-y-4">
                  <h3 className="font-serif text-xl font-bold text-espresso-900">Add New Dish</h3>
                  <form onSubmit={handleAddDish} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-taupe-600 mb-1">Dish Name</label>
                      <input
                        type="text"
                        required
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        placeholder="e.g. Saffron Rose Lassi"
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-taupe-600 mb-1">Price ({restaurant.currency})</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={newDishPrice}
                        onChange={(e) => setNewDishPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-taupe-600 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newDishDescription}
                        onChange={(e) => setNewDishDescription(e.target.value)}
                        placeholder="Crafted with slow-strained organic yogurt..."
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddDishOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-taupe-600 hover:bg-cream-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800"
                      >
                        Save Dish
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
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Restaurant Theme Studio</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Customize colors, typography, and card layout for your public diner menu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveTheme(false)}
                  className="px-4 py-2 rounded-xl bg-cream-200 text-espresso-800 font-semibold text-xs sm:text-sm hover:bg-cream-300 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSaveTheme(true)}
                  className="px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm"
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
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[320px] sm:w-[360px] rounded-[44px] border-[10px] border-espresso-900 shadow-lifted overflow-hidden bg-[var(--dishora-bg)] flex flex-col h-[650px] relative" style={generateThemeVariables(themeState)}>
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
            <div className="p-6 bg-gradient-to-br from-espresso-900 to-espresso-800 text-white rounded-3xl shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
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

              <div className="flex gap-6 text-center">
                <div className="p-3 bg-white/10 rounded-2xl min-w-[100px]">
                  <div className="text-2xl font-bold text-cream-100">{billingUsage?.remainingImageCredits ?? 15}</div>
                  <div className="text-[10px] text-cream-300 uppercase">3D Credits</div>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl min-w-[100px]">
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
