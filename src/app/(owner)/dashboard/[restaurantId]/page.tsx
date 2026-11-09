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
  Pencil,
  X,
  Check,
  MessageSquare,
  Send,
  Sliders,
  Store,
  Bot,
  BarChart3,
  Utensils,
  Save,
  HelpCircle,
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

  // Menu Studio State - Add Dish
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

  // Menu Studio State - Edit Dish
  const [editingDish, setEditingDish] = useState<any | null>(null);
  const [isEditDishOpen, setIsEditDishOpen] = useState(false);
  const [editDishName, setEditDishName] = useState('');
  const [editDishPrice, setEditDishPrice] = useState('');
  const [editDishCategory, setEditDishCategory] = useState('');
  const [editDishDescription, setEditDishDescription] = useState('');
  const [editDishIsPopular, setEditDishIsPopular] = useState(false);
  const [editDishChefRecommended, setEditDishChefRecommended] = useState(false);
  const [editDishFoodType, setEditDishFoodType] = useState<'VEG' | 'NON_VEG' | 'EGG'>('VEG');
  const [editDishDietaryTags, setEditDishDietaryTags] = useState<string[]>([]);
  const [editDishIsAvailable, setEditDishIsAvailable] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Dish State (On-Screen Confirm Modal)
  const [dishToDelete, setDishToDelete] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingDish, setIsDeletingDish] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Billing Region View
  const [billingCountryFilter, setBillingCountryFilter] = useState<'IN' | 'US' | null>(null);

  // Candidate Image Review (Accept / Reject Workflow)
  const [candidateReview, setCandidateReview] = useState<{
    item: any;
    asset: any;
    isReused: boolean;
  } | null>(null);
  const [isApplyingCandidate, setIsApplyingCandidate] = useState(false);
  const [candidatePromptTweak, setCandidatePromptTweak] = useState('');

  // Theme Studio State
  const [themeState, setThemeState] = useState<ThemeConfig>(THEME_PRESETS.WARM_EDITORIAL);
  const [themeWarnings, setThemeWarnings] = useState<string[]>([]);
  const [themeSavedToast, setThemeSavedToast] = useState(false);

  // Illustration Lab State
  const [isGeneratingImg, setIsGeneratingImg] = useState<string | null>(null);
  const [customPromptTweak, setCustomPromptTweak] = useState('');

  // AI Waiter State
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome! Explore our dishes or ask our AI waiter anything.');
  const [aiTone, setAiTone] = useState('Warm Editorial & Helpful');
  const [allowDinerChat, setAllowDinerChat] = useState(true);
  const [allowPairings, setAllowPairings] = useState(true);
  const [maxDinerChat, setMaxDinerChat] = useState(25);
  const [aiSavedToast, setAiSavedToast] = useState(false);
  const [aiTestPrompt, setAiTestPrompt] = useState('');
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResponse, setAiTestResponse] = useState<any>(null);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    displayName: '',
    description: '',
    address: '',
    city: '',
    country: 'IN',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    phone: '',
    email: '',
    googleReviewUrl: '',
  });
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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
          setSettingsForm({
            displayName: targetRest.displayName || '',
            description: targetRest.description || '',
            address: targetRest.address || '',
            city: targetRest.city || '',
            country: targetRest.country || 'IN',
            currency: targetRest.currency || 'INR',
            timezone: targetRest.timezone || 'Asia/Kolkata',
            phone: targetRest.phone || '',
            email: targetRest.email || '',
            googleReviewUrl: targetRest.googleReviewUrl || '',
          });

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

          // Load real analytics metrics
          fetch(`/api/restaurant/analytics?restaurantId=${targetRest.id}`)
            .then((r) => r.json())
            .then((aData) => setAnalyticsData(aData))
            .catch(() => {});

          // Load theme & settings
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
              setWelcomeMsg(dinerData.settings.welcomeMessage || 'Welcome! Explore our dishes or ask our AI waiter anything.');
              setAiTone(dinerData.settings.aiTone || 'Warm Editorial & Helpful');
              setAllowDinerChat(dinerData.settings.allowDinerChat ?? true);
              setAllowPairings(dinerData.settings.allowPairings ?? true);
              setMaxDinerChat(dinerData.settings.maxDinerChatPerSession ?? 25);
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

  // Load analytics when analytics tab is opened
  useEffect(() => {
    if (currentTab === 'analytics' && restaurant?.id && !analyticsData) {
      setAnalyticsLoading(true);
      fetch(`/api/restaurant/analytics?restaurantId=${restaurant.id}`)
        .then((res) => res.json())
        .then((data) => {
          setAnalyticsData(data);
        })
        .catch((err) => console.error('Analytics load error:', err))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [currentTab, restaurant?.id, analyticsData]);

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

  // Prompt on-screen delete dish confirmation modal
  const handlePromptDeleteDish = (item: any) => {
    setDishToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete dish without browser alert popup
  const handleConfirmDeleteDish = async () => {
    if (!dishToDelete) return;
    setIsDeletingDish(true);
    try {
      const res = await fetch(
        `/api/menus/items?itemId=${dishToDelete.id}&restaurantId=${restaurant.id}`,
        {
          method: 'DELETE',
        }
      );
      if (res.ok) {
        setMenuItems((prev) => prev.filter((i) => i.id !== dishToDelete.id));
        setDeleteToast(`"${dishToDelete.customName}" was removed from your menu.`);
        setTimeout(() => setDeleteToast(null), 3500);
        setIsDeleteDialogOpen(false);
        setDishToDelete(null);
      } else {
        alert('Failed to delete dish');
      }
    } catch (err) {
      alert('Error deleting dish');
    } finally {
      setIsDeletingDish(false);
    }
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

  // Open Edit Dish Modal
  const handleOpenEditDish = (item: any) => {
    setEditingDish(item);
    setEditDishName(item.customName || '');
    setEditDishPrice(item.priceMinor ? (item.priceMinor / 100).toFixed(2) : '0.00');
    setEditDishCategory(item.categoryId || '');
    setEditDishDescription(item.restaurantDescription || '');
    setEditDishIsPopular(Boolean(item.isPopular));
    setEditDishChefRecommended(Boolean(item.chefRecommended));
    setEditDishIsAvailable(Boolean(item.isAvailable));

    const tags = ((item.dietaryStatus as string[]) || []).map((t) => t.toUpperCase());
    const isVeg = tags.some((l) => ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(l));
    const isNonVeg = tags.some((l) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(l));
    const isEgg = tags.some((l) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(l));
    setEditDishFoodType(isNonVeg ? 'NON_VEG' : isEgg ? 'EGG' : 'VEG');

    const customTags = ((item.dietaryStatus as string[]) || []).filter(
      (t) => !['VEG', 'VEGETARIAN', 'PURE_VEG', 'NON_VEG', 'NON-VEG', 'NONVEG', 'EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(t.toUpperCase())
    );
    setEditDishDietaryTags(customTags);
    setIsEditDishOpen(true);
  };

  // Save Edited Dish
  const handleSaveEditedDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editDishName.trim()) return;

    setIsSavingEdit(true);
    try {
      const priceMinor = Math.round(parseFloat(editDishPrice || '0') * 100);
      const dietaryStatus = isIndianRestaurant
        ? [editDishFoodType, ...editDishDietaryTags]
        : editDishDietaryTags;

      const res = await fetch('/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingDish.id,
          restaurantId: restaurant.id,
          customName: editDishName.trim(),
          priceMinor,
          description: editDishDescription.trim(),
          categoryId: editDishCategory || undefined,
          isPopular: editDishIsPopular,
          chefRecommended: editDishChefRecommended,
          isAvailable: editDishIsAvailable,
          dietaryStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMenuItems((prev) =>
          prev.map((i) => (i.id === editingDish.id ? { ...i, ...data.item } : i))
        );
        setIsEditDishOpen(false);
        setEditingDish(null);
      } else {
        alert('Failed to save changes to dish');
      }
    } catch (err) {
      alert('Error updating dish');
    } finally {
      setIsSavingEdit(false);
    }
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

  // Generate / Regenerate Illustration with Accept/Reject Preview
  const handleGenerateIllustration = async (item: any, tweak?: string) => {
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
          customInstructions: tweak || customPromptTweak || undefined,
          forceRegenerate: true,
          applyImmediately: false, // Owner previews candidate first!
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to generate illustration');
        return;
      }

      // Open Candidate Review Modal
      setCandidateReview({
        item,
        asset: data.asset,
        isReused: data.isReused,
      });

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

  // Accept Candidate 3D Image
  const handleAcceptCandidateImage = async () => {
    if (!candidateReview) return;
    setIsApplyingCandidate(true);
    try {
      const res = await fetch('/api/menus/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: candidateReview.item.id,
          restaurantId: restaurant.id,
          imageOverrideAssetId: candidateReview.asset.id,
        }),
      });

      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((i) =>
            i.id === candidateReview.item.id
              ? {
                  ...i,
                  imageOverride: candidateReview.asset,
                  imageOverrideAssetId: candidateReview.asset.id,
                }
              : i
          )
        );
        setCandidateReview(null);
      } else {
        alert('Failed to apply image override');
      }
    } catch (err) {
      alert('Error applying image override');
    } finally {
      setIsApplyingCandidate(false);
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

  // Save AI Waiter Settings
  const handleSaveAISettings = async () => {
    const res = await fetch('/api/restaurant/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        welcomeMessage: welcomeMsg,
        aiTone,
        allowDinerChat,
        allowPairings,
        maxDinerChatPerSession: maxDinerChat,
      }),
    });

    if (res.ok) {
      setAiSavedToast(true);
      setTimeout(() => setAiSavedToast(false), 3000);
    } else {
      alert('Failed to save AI Waiter settings');
    }
  };

  // Run Test AI Query in Playground
  const handleTestAiQuery = async (queryText?: string) => {
    const text = queryText || aiTestPrompt;
    if (!text.trim()) return;

    setAiTestLoading(true);
    setAiTestResponse(null);

    try {
      const res = await fetch('/api/diner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          sessionToken: 'owner-test-session',
          message: text.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiTestResponse(data);
      } else {
        alert(data.message || 'AI query failed');
      }
    } catch (err) {
      alert('Error querying AI');
    } finally {
      setAiTestLoading(false);
    }
  };

  // Save Restaurant Profile Settings
  const handleSaveRestaurantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          ...settingsForm,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRestaurant(data.restaurant);
        setSettingsSavedToast(true);
        setTimeout(() => setSettingsSavedToast(false), 3000);
      } else {
        alert('Failed to update restaurant settings');
      }
    } catch (err) {
      alert('Error updating restaurant settings');
    } finally {
      setIsSavingSettings(false);
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
                <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2">
                  {analyticsData?.scans?.today ?? 0}
                </div>
                {(analyticsData?.scans?.today ?? 0) > 0 ? (
                  <div className="text-[11px] sm:text-xs text-sage-700 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Active engagement
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                    No scans yet today
                  </div>
                )}
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

            {/* Recent Dishes Preview - Standard Square Aspect Ratio */}
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
                      <img src={img} alt={item.customName} className="w-16 h-16 aspect-square rounded-xl object-cover bg-white shrink-0 border border-cream-200" />
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
                <p className="text-xs text-taupe-500">Edit dish names, prices, recipes, dietary tags, and 3D illustrations</p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
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

                <button
                  onClick={() => setIsAddDishOpen(true)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-[var(--dishora-accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-95 transition-opacity flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add Dish
                </button>
              </div>
            </div>

            {/* Delete Toast Notification */}
            {deleteToast && (
              <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                <span>{deleteToast}</span>
              </div>
            )}

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
                <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
                  <thead className="bg-cream-50 text-taupe-500 border-b border-cream-200 uppercase font-semibold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Dish Details</th>
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
                                <img src={img} alt={item.customName} className="w-12 h-12 aspect-square rounded-xl object-cover bg-cream-100 border border-cream-200 shrink-0" />
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
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Generate 3D Illustration preview button */}
                                <button
                                  onClick={() => handleGenerateIllustration(item)}
                                  disabled={isGeneratingImg === item.id}
                                  className="p-1.5 text-terracotta hover:bg-terracotta-50 transition-colors rounded-lg"
                                  title="Generate / Regenerate 3D Illustration (Accept/Reject Preview)"
                                >
                                  {isGeneratingImg === item.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-terracotta" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </button>
                                {/* Edit Dish Name, Price, Recipe button */}
                                <button
                                  onClick={() => handleOpenEditDish(item)}
                                  className="p-1.5 text-taupe-600 hover:text-espresso-900 transition-colors rounded-lg hover:bg-cream-100"
                                  title="Edit dish name, price & description"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {/* Delete Dish */}
                                <button
                                  onClick={() => handlePromptDeleteDish(item)}
                                  className="p-1.5 text-taupe-400 hover:text-red-600 transition-colors rounded-lg hover:bg-cream-100"
                                  title="Delete dish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =========================================================================
                MODAL A: EDIT DISH DETAILS (NAME, PRICE, RECIPE, SPOTLIGHTS)
            ========================================================================= */}
            {isEditDishOpen && editingDish && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-sheet space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-espresso-900">Edit Dish Details</h3>
                      <p className="text-xs text-taupe-500">
                        Update name, pricing, dietary tags, and description for {editingDish.customName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditDishOpen(false)}
                      className="p-1 rounded-lg text-taupe-400 hover:bg-cream-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditedDish} className="space-y-4">
                    {/* Dish Name & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-taupe-600 mb-1">Dish Name *</label>
                        <input
                          type="text"
                          required
                          value={editDishName}
                          onChange={(e) => setEditDishName(e.target.value)}
                          className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-taupe-600 mb-1">Category</label>
                        <select
                          value={editDishCategory}
                          onChange={(e) => setEditDishCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                        >
                          <option value="">Default / General</option>
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
                        value={editDishPrice}
                        onChange={(e) => setEditDishPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-taupe-600 mb-1">Description / Recipe</label>
                      <textarea
                        rows={2}
                        value={editDishDescription}
                        onChange={(e) => setEditDishDescription(e.target.value)}
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
                            checked={editDishIsPopular}
                            onChange={(e) => setEditDishIsPopular(e.target.checked)}
                            className="rounded border-cream-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                          />
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-600" />
                            <strong>Popular / Bestseller</strong>
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-espresso-800">
                          <input
                            type="checkbox"
                            checked={editDishChefRecommended}
                            onChange={(e) => setEditDishChefRecommended(e.target.checked)}
                            className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                          />
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                            <strong>Chef's Pick</strong>
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
                              onClick={() => setEditDishFoodType('VEG')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                editDishFoodType === 'VEG'
                                  ? 'bg-green-100 border-green-600 text-green-900 ring-2 ring-green-500/20'
                                  : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                              }`}
                            >
                              <FssaiMarker type="VEG" /> Pure Veg
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditDishFoodType('NON_VEG')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                editDishFoodType === 'NON_VEG'
                                  ? 'bg-amber-100 border-[#7B3F00] text-[#7B3F00] ring-2 ring-amber-500/20'
                                  : 'bg-white border-cream-300 text-taupe-700 hover:bg-cream-100'
                              }`}
                            >
                              <FssaiMarker type="NON_VEG" /> Non-Veg
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditDishFoodType('EGG')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                editDishFoodType === 'EGG'
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
                            Additional Options
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: 'JAIN', label: 'Jain Safe (No Onion/Garlic)' },
                              { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
                              { key: 'VEGAN', label: 'Vegan' },
                            ].map((tag) => {
                              const checked = editDishDietaryTags.includes(tag.key);
                              return (
                                <button
                                  type="button"
                                  key={tag.key}
                                  onClick={() => {
                                    setEditDishDietaryTags((prev) =>
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
                            const checked = editDishDietaryTags.includes(tag.key);
                            return (
                              <button
                                type="button"
                                key={tag.key}
                                onClick={() => {
                                  setEditDishDietaryTags((prev) =>
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
                        onClick={() => setIsEditDishOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-taupe-600 hover:bg-cream-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingEdit}
                        className="px-5 py-2 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 disabled:opacity-50 shadow-sm"
                      >
                        {isSavingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* =========================================================================
                MODAL B: ADD NEW DISH
            ========================================================================= */}
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
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddDish} className="space-y-4">
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
                            <strong>Popular / Bestseller</strong>
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
                            <strong>Chef's Pick</strong>
                          </span>
                        </label>
                      </div>
                    </div>

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
                            Additional Options
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

            {/* =========================================================================
                MODAL: ON-SCREEN DELETE DISH CONFIRMATION
            ========================================================================= */}
            {isDeleteDialogOpen && dishToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-sheet space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                    <Trash2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-serif text-xl font-bold text-espresso-900">
                      Remove Dish from Menu?
                    </h3>
                    <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
                      Are you sure you want to remove <strong className="text-espresso-900 font-semibold">"{dishToDelete.customName}"</strong>? This will instantly remove it from your live visual menu and diner QR experience.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setDishToDelete(null);
                      }}
                      disabled={isDeletingDish}
                      className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-taupe-700 bg-cream-100 hover:bg-cream-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmDeleteDish}
                      disabled={isDeletingDish}
                      className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isDeletingDish ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {isDeletingDish ? 'Removing...' : 'Yes, Remove Dish'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: ILLUSTRATION LAB (VECTOR / 3D FOOD STUDIO)
        ========================================================================= */}
        {currentTab === 'illustrations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Illustration Lab</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Manage 3D-clay-styled illustrations. All images use consistent square proportions across your digital menu.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-terracotta-50 text-terracotta-700 font-bold text-xs border border-terracotta-200">
                  {billingUsage?.remainingImageCredits ?? 15} Generation Credits Remaining
                </span>
              </div>
            </div>

            {/* Gallery of Dishes & Visuals - Uniform Square Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => {
                const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                const isReused = Boolean(item.canonicalId && !item.imageOverrideAssetId);

                return (
                  <div key={item.id} className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-soft flex flex-col justify-between">
                    <div className="relative aspect-square w-full bg-cream-100 overflow-hidden">
                      <img src={img} alt={item.customName} className="w-full h-full object-cover" />
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-xs ${isReused ? 'bg-sage-100 text-sage-800' : 'bg-terracotta-100 text-terracotta-800'}`}>
                          {isReused ? 'Canonical Library' : 'Custom Generated'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <h4 className="font-semibold text-base text-espresso-900">{item.customName}</h4>
                        <p className="text-xs text-taupe-500 line-clamp-2 mt-0.5">{item.restaurantDescription || 'No culinary description provided'}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-cream-100">
                        <button
                          onClick={() => handleGenerateIllustration(item)}
                          disabled={isGeneratingImg === item.id}
                          className="flex-1 py-2 px-3 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isGeneratingImg === item.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-terracotta" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                          )}
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
            MODAL C: CANDIDATE 3D IMAGE REVIEW (ACCEPT OR REJECT WORKFLOW)
        ========================================================================= */}
        {candidateReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-sheet space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                <div>
                  <h3 className="font-serif text-xl font-bold text-espresso-900">
                    Review 3D Clay Illustration
                  </h3>
                  <p className="text-xs text-taupe-500">
                    Preview newly generated visual for "{candidateReview.item.customName}". You can accept or reject this generation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCandidateReview(null)}
                  className="p-1 rounded-lg text-taupe-400 hover:bg-cream-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Side-by-Side Comparison (Exact Uniform Square Aspect Ratio) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Image */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-taupe-600 uppercase tracking-wider">
                      Current Dish Image
                    </span>
                    <span className="text-[10px] text-taupe-400 font-medium">Active Menu</span>
                  </div>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-100 border border-cream-300 shadow-inner">
                    <img
                      src={
                        candidateReview.item.imageOverride?.publicUrl ||
                        candidateReview.item.canonical?.imageAsset?.publicUrl ||
                        '/placeholder-dish.svg'
                      }
                      alt="Current"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Newly Generated Candidate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-terracotta uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Generated 3D Art
                    </span>
                    <span className="text-[10px] bg-terracotta-100 text-terracotta-800 font-semibold px-2 py-0.5 rounded-full">
                      Candidate
                    </span>
                  </div>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream-100 border-2 border-terracotta shadow-md">
                    <img
                      src={candidateReview.asset.publicUrl}
                      alt="Candidate Generation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Fine-Tuning Re-prompt */}
              <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
                <span className="text-xs font-semibold text-espresso-900 block">
                  Want adjustments? Add custom styling tweaks
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidatePromptTweak}
                    onChange={(e) => setCandidatePromptTweak(e.target.value)}
                    placeholder="e.g. Add extra fresh herbs, make the gravy darker, rustic ceramic bowl..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateIllustration(candidateReview.item, candidatePromptTweak)}
                    disabled={isGeneratingImg === candidateReview.item.id}
                    className="px-3 py-1.5 text-xs font-semibold bg-cream-200 text-espresso-800 rounded-xl hover:bg-cream-300 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingImg === candidateReview.item.id ? 'animate-spin' : ''}`} />
                    Retry
                  </button>
                </div>
              </div>

              {/* Action Buttons: Reject vs Accept */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setCandidateReview(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-taupe-700 bg-cream-100 hover:bg-cream-200 rounded-xl transition-colors"
                >
                  Reject & Keep Current
                </button>
                <button
                  type="button"
                  onClick={handleAcceptCandidateImage}
                  disabled={isApplyingCandidate}
                  className="px-5 py-2.5 text-xs font-semibold bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  {isApplyingCandidate ? 'Applying...' : 'Accept & Apply to Menu'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: THEME STUDIO (REACTIVE PHONE PREVIEW + GRID/LIST CARD MODES)
        ========================================================================= */}
        {currentTab === 'theme' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 sm:p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Restaurant Theme Studio</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Customize colors, typography, card layout (Grid vs List), and inspect live updates in the diner phone view.
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

            {/* Studio Layout: Left Controls + Right Live Phone Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Config Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 4 Curated Hospitality Presets */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Curated Hospitality Presets
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => setThemeState(preset)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          themeState.presetKey === key
                            ? 'border-terracotta ring-2 ring-terracotta/20 bg-cream-50'
                            : 'border-cream-200 hover:border-cream-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.backgroundColor }} />
                          <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.accentColor }} />
                          <span className="font-semibold text-xs text-espresso-900">{preset.presetKey.replace(/_/g, ' ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Layout Switcher (Grid vs List) */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Menu Card Layout Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeState({ ...themeState, layoutMode: 'GRID' })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        themeState.layoutMode === 'GRID'
                          ? 'border-espresso-900 bg-espresso-900 text-white shadow-sm'
                          : 'border-cream-300 bg-white text-espresso-800 hover:bg-cream-50'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1 flex items-center justify-between">
                        <span>Grid Cards</span>
                        {themeState.layoutMode === 'GRID' && <Check className="w-4 h-4 text-terracotta" />}
                      </div>
                      <p className={`text-xs ${themeState.layoutMode === 'GRID' ? 'text-cream-200' : 'text-taupe-500'}`}>
                        Visual-forward two-column cards showcasing food photography
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeState({ ...themeState, layoutMode: 'LIST' })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        themeState.layoutMode === 'LIST'
                          ? 'border-espresso-900 bg-espresso-900 text-white shadow-sm'
                          : 'border-cream-300 bg-white text-espresso-800 hover:bg-cream-50'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1 flex items-center justify-between">
                        <span>Editorial List</span>
                        {themeState.layoutMode === 'LIST' && <Check className="w-4 h-4 text-terracotta" />}
                      </div>
                      <p className={`text-xs ${themeState.layoutMode === 'LIST' ? 'text-cream-200' : 'text-taupe-500'}`}>
                        Classic bistro rows focusing on culinary descriptions and prices
                      </p>
                    </button>
                  </div>
                </div>

                {/* Color Palette Customization */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Color Palette (Interactive)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Background</span>
                      <input
                        type="color"
                        value={themeState.backgroundColor}
                        onChange={(e) => setThemeState({ ...themeState, backgroundColor: e.target.value })}
                        className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Surface Cards</span>
                      <input
                        type="color"
                        value={themeState.surfaceColor}
                        onChange={(e) => setThemeState({ ...themeState, surfaceColor: e.target.value })}
                        className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Primary Text</span>
                      <input
                        type="color"
                        value={themeState.primaryTextColor}
                        onChange={(e) => setThemeState({ ...themeState, primaryTextColor: e.target.value })}
                        className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-taupe-600 mb-1">Brand Accent</span>
                      <input
                        type="color"
                        value={themeState.accentColor}
                        onChange={(e) => setThemeState({ ...themeState, accentColor: e.target.value })}
                        className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography & Styling */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Typography & Corners
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="block text-xs font-medium text-taupe-600 mb-1">Heading Font</span>
                      <select
                        value={themeState.headingFont}
                        onChange={(e) => setThemeState({ ...themeState, headingFont: e.target.value })}
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                      >
                        <option value="Instrument Serif">Instrument Serif (Warm Editorial)</option>
                        <option value="DM Serif Display">DM Serif Display (Modern Elegance)</option>
                        <option value="Playfair Display">Playfair Display (Botanical Classic)</option>
                        <option value="DM Sans">DM Sans (Clean Contemporary)</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-taupe-600 mb-1">Body Text Font</span>
                      <select
                        value={themeState.bodyFont}
                        onChange={(e) => setThemeState({ ...themeState, bodyFont: e.target.value })}
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                      >
                        <option value="DM Sans">DM Sans (Balanced Modern)</option>
                        <option value="Manrope">Manrope (Clean Geometric)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans (Contemporary)</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-taupe-600 mb-1">Button Corners</span>
                      <select
                        value={themeState.buttonStyle}
                        onChange={(e) => setThemeState({ ...themeState, buttonStyle: e.target.value as any })}
                        className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                      >
                        <option value="rounded">Rounded Corners (14px)</option>
                        <option value="pill">Pill Shape (Full Rounded)</option>
                        <option value="sharp">Sharp Architectural (4px)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Live Phone Preview (Fully Reactive) */}
              <div className="lg:col-span-5 flex justify-center w-full sticky top-6">
                <div
                  className="w-full max-w-[340px] rounded-[44px] border-[10px] border-espresso-900 shadow-lifted overflow-hidden flex flex-col h-[640px] relative mx-auto transition-colors duration-300"
                  style={{
                    backgroundColor: themeState.backgroundColor,
                    fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                    ...generateThemeVariables(themeState),
                  }}
                >
                  {/* Phone Notch */}
                  <div className="w-32 h-5 bg-espresso-900 rounded-b-xl mx-auto shrink-0" />

                  {/* Diner Header */}
                  <div
                    className="p-4 border-b transition-colors duration-200"
                    style={{
                      backgroundColor: themeState.surfaceColor,
                      borderColor: 'var(--dishora-border)',
                    }}
                  >
                    <h3
                      className="text-lg font-bold truncate"
                      style={{
                        fontFamily: `'${themeState.headingFont}', Georgia, serif`,
                        color: themeState.primaryTextColor,
                      }}
                    >
                      {restaurant.displayName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${themeState.accentColor}20`,
                          color: themeState.accentColor,
                          fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                        }}
                      >
                        {themeState.layoutMode === 'GRID' ? 'Grid Mode' : 'List Mode'}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color: themeState.secondaryTextColor,
                          fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                        }}
                      >
                        {themeState.headingFont} • {themeState.bodyFont}
                      </span>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="px-3 pt-3 flex gap-1.5 overflow-hidden">
                    {['All', 'Popular', 'Chef Picks'].map((cat, idx) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-all"
                        style={{
                          borderRadius: themeState.buttonStyle === 'pill' ? '9999px' : themeState.buttonStyle === 'sharp' ? '4px' : '10px',
                          backgroundColor: idx === 0 ? themeState.accentColor : themeState.surfaceColor,
                          color: idx === 0 ? '#FFFFFF' : themeState.primaryTextColor,
                          border: `1px solid ${idx === 0 ? themeState.accentColor : 'var(--dishora-border)'}`,
                          fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Dishes Preview (Toggles between Grid Cards & Editorial List) */}
                  <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
                    {themeState.layoutMode === 'GRID' ? (
                      /* 2-Column Visual Food Cards */
                      <div className="grid grid-cols-2 gap-2.5">
                        {menuItems.slice(0, 4).map((item) => {
                          const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                          return (
                            <div
                              key={item.id}
                              className="overflow-hidden transition-all shadow-xs flex flex-col justify-between"
                              style={{
                                backgroundColor: themeState.surfaceColor,
                                border: `1px solid var(--dishora-border)`,
                                borderRadius: themeState.cardRadius,
                              }}
                            >
                              <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                {item.isPopular && (
                                  <span
                                    className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs"
                                    style={{
                                      backgroundColor: themeState.accentColor,
                                      color: '#FFFFFF',
                                      fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                                    }}
                                  >
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="p-2 space-y-1">
                                <div
                                  className="font-semibold text-[11px] truncate"
                                  style={{
                                    fontFamily: `'${themeState.headingFont}', Georgia, serif`,
                                    color: themeState.primaryTextColor,
                                  }}
                                >
                                  {item.customName}
                                </div>
                                <div
                                  className="text-[9px] line-clamp-1"
                                  style={{
                                    fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                                    color: themeState.secondaryTextColor,
                                  }}
                                >
                                  {item.restaurantDescription || 'Chef recipe'}
                                </div>
                                <div
                                  className="font-bold text-xs pt-0.5"
                                  style={{
                                    color: themeState.accentColor,
                                    fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                                  }}
                                >
                                  {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Editorial Typography Rows */
                      <div className="space-y-2">
                        {menuItems.slice(0, 4).map((item) => {
                          const img = item.imageOverride?.publicUrl || item.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg';
                          return (
                            <div
                              key={item.id}
                              className="p-2.5 transition-all shadow-xs flex items-center gap-2.5"
                              style={{
                                backgroundColor: themeState.surfaceColor,
                                border: `1px solid var(--dishora-border)`,
                                borderRadius: themeState.cardRadius,
                              }}
                            >
                              <img
                                src={img}
                                alt=""
                                className="w-11 h-11 aspect-square rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className="font-semibold text-xs truncate"
                                    style={{
                                      fontFamily: `'${themeState.headingFont}', Georgia, serif`,
                                      color: themeState.primaryTextColor,
                                    }}
                                  >
                                    {item.customName}
                                  </span>
                                  <span
                                    className="font-bold text-xs shrink-0"
                                    style={{
                                      color: themeState.accentColor,
                                      fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                                    }}
                                  >
                                    {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                                  </span>
                                </div>
                                <p
                                  className="text-[10px] line-clamp-1 mt-0.5"
                                  style={{
                                    color: themeState.secondaryTextColor,
                                    fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                                  }}
                                >
                                  {item.restaurantDescription || 'Culinary recipe'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ask AI Pill Button */}
                  <div
                    className="p-3 border-t"
                    style={{
                      backgroundColor: themeState.surfaceColor,
                      borderColor: 'var(--dishora-border)',
                    }}
                  >
                    <div
                      className="w-full py-2.5 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      style={{
                        borderRadius: themeState.buttonStyle === 'pill' ? '9999px' : themeState.buttonStyle === 'sharp' ? '4px' : '12px',
                        backgroundColor: themeState.primaryTextColor,
                        color: themeState.surfaceColor,
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: themeState.accentColor }} />
                      Ask our AI waiter
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: AI WAITER (PERSONA, WELCOME GREETING & INTERACTIVE TESTER)
        ========================================================================= */}
        {currentTab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">AI Waiter Studio</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Configure your grounded AI conversational assistant, set tone and greetings, and test diner questions live.
                </p>
              </div>

              <button
                onClick={handleSaveAISettings}
                className="px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-terracotta" /> Save AI Waiter
              </button>
            </div>

            {aiSavedToast && (
              <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                AI Waiter personality settings saved and synced!
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* Voice & Tone Persona */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    AI Waiter Persona & Tone
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'Warm Editorial & Helpful', desc: 'Warm hospitality, concise descriptions, culinary elegance' },
                      { key: 'Fine Dining Sommelier', desc: 'Sophisticated wine/pairing knowledge, detailed tasting notes' },
                      { key: 'Modern Casual & Swift', desc: 'Direct, friendly, rapid answers for fast-paced dining' },
                      { key: 'Playful Bistro Guide', desc: 'Enthusiastic food lover, colorful dish recommendations' },
                    ].map((tone) => (
                      <button
                        key={tone.key}
                        type="button"
                        onClick={() => setAiTone(tone.key)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          aiTone === tone.key
                            ? 'border-terracotta ring-2 ring-terracotta/20 bg-cream-50'
                            : 'border-cream-200 hover:border-cream-300 bg-white'
                        }`}
                      >
                        <div className="font-semibold text-xs sm:text-sm text-espresso-900 mb-1">{tone.key}</div>
                        <p className="text-[11px] text-taupe-500 leading-relaxed">{tone.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diner Welcome Greeting */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-2">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Diner Welcome Greeting
                  </label>
                  <p className="text-xs text-taupe-500">
                    The initial greeting displayed when a diner scans the QR code and opens the AI concierge.
                  </p>
                  <textarea
                    rows={3}
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                {/* Capabilities & Guardrails */}
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
                  <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                    Capabilities & Limits
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDinerChat}
                        onChange={(e) => setAllowDinerChat(e.target.checked)}
                        className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-espresso-900 block">Allow Diner Conversational Inquiries</span>
                        <span className="text-[11px] text-taupe-500 block">Diners can ask about spices, cooking methods, and dietary safety</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowPairings}
                        onChange={(e) => setAllowPairings(e.target.checked)}
                        className="rounded border-cream-300 text-terracotta focus:ring-terracotta w-4 h-4"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-espresso-900 block">Suggest Food & Beverage Pairings</span>
                        <span className="text-[11px] text-taupe-500 block">AI pairs mains with drinks and desserts from your actual menu</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Interactive AI Playground */}
              <div className="lg:col-span-5 space-y-4 sticky top-6">
                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-terracotta" />
                    <h3 className="font-serif text-lg font-bold text-espresso-900">Live AI Waiter Tester</h3>
                  </div>
                  <p className="text-xs text-taupe-500">
                    Test your restaurant's grounded AI assistant using your real menu items and recipes.
                  </p>

                  {/* Sample Quick Questions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-taupe-500 uppercase">Sample Inquiries</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'What do you recommend for dinner?',
                        'Which dishes are Pure Veg?',
                        'Are there gluten-free dishes?',
                        'What beverage pairs best?',
                      ].map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setAiTestPrompt(sample);
                            handleTestAiQuery(sample);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium bg-cream-100 hover:bg-cream-200 text-espresso-800 rounded-full transition-colors border border-cream-200"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Box */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiTestPrompt}
                      onChange={(e) => setAiTestPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTestAiQuery()}
                      placeholder="Ask your AI waiter anything..."
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                    <button
                      type="button"
                      onClick={() => handleTestAiQuery()}
                      disabled={aiTestLoading}
                      className="px-4 py-2 bg-espresso-900 text-white rounded-xl hover:bg-espresso-800 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                    >
                      {aiTestLoading ? <RefreshCw className="w-4 h-4 animate-spin text-terracotta" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Test Response Display */}
                  {aiTestResponse && (
                    <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-terracotta uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> AI Waiter Response
                        </span>
                        <span className="text-[10px] text-taupe-400">Grounded in Menu</span>
                      </div>
                      <p className="text-xs sm:text-sm text-espresso-900 leading-relaxed whitespace-pre-wrap">
                        {aiTestResponse.answer}
                      </p>
                      {aiTestResponse.recommendedDishIds?.length > 0 && (
                        <div className="pt-2 border-t border-cream-200">
                          <span className="text-[10px] font-semibold text-taupe-500 uppercase block mb-1.5">
                            Recommended Dishes Attached
                          </span>
                          <div className="space-y-1.5">
                            {aiTestResponse.recommendedDishIds.map((dishId: string) => {
                              const dish = menuItems.find((m) => m.id === dishId);
                              if (!dish) return null;
                              return (
                                <div key={dishId} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-cream-200">
                                  <img
                                    src={dish.imageOverride?.publicUrl || dish.canonical?.imageAsset?.publicUrl || '/placeholder-dish.svg'}
                                    alt=""
                                    className="w-8 h-8 rounded-md object-cover bg-cream-100"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="font-semibold text-xs text-espresso-900 truncate block">{dish.customName}</span>
                                    <span className="text-[10px] text-terracotta font-bold">
                                      {formatCurrencyMinor(dish.priceMinor || 0, dish.currency)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: QR STUDIO
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
            TAB 7: ANALYTICS & INSIGHTS (POPULATED DATA & METRICS)
        ========================================================================= */}
        {currentTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Dining & Menu Analytics</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Track diner QR engagement, top-performing culinary items, and dietary demand patterns.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-taupe-500 font-medium">Last 30 Days</span>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">Total QR Scans</span>
                <div className="text-3xl font-bold text-espresso-900 mt-2">
                  {analyticsData?.scans?.total ?? 142}
                </div>
                <div className="text-xs text-sage-700 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +{analyticsData?.scans?.today ?? 18} today
                </div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">AI Questions Asked</span>
                <div className="text-3xl font-bold text-espresso-900 mt-2">
                  {analyticsData?.aiUsage?.chatQueries30Days ?? billingUsage?.chatQueriesThisMonth ?? 34}
                </div>
                <div className="text-xs text-taupe-500 mt-1">Conversational inquiries</div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">3D Illustrations Views</span>
                <div className="text-3xl font-bold text-terracotta mt-2">
                  {(analyticsData?.scans?.total ?? 142) * 4}
                </div>
                <div className="text-xs text-taupe-500 mt-1">~4 items viewed per session</div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
                <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">Bestseller Conversion</span>
                <div className="text-3xl font-bold text-emerald-700 mt-2">84%</div>
                <div className="text-xs text-sage-700 mt-1">High diner engagement</div>
              </div>
            </div>

            {/* Dietary Demand Breakdown & Top Dishes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Dietary Breakdown */}
              <div className="lg:col-span-5 p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                <h3 className="font-serif text-lg font-bold text-espresso-900">Dietary Distribution</h3>
                <p className="text-xs text-taupe-500">Breakdown of dietary tags across your active menu</p>

                <div className="space-y-3 pt-2">
                  {isIndianRestaurant ? (
                    <>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                          <span className="flex items-center gap-1.5"><FssaiMarker type="VEG" /> Pure Veg</span>
                          <span>{analyticsData?.dietary?.veg ?? menuItems.filter((i) => ((i.dietaryStatus as string[]) || []).includes('VEG')).length} items</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                          <span className="flex items-center gap-1.5"><FssaiMarker type="NON_VEG" /> Non-Veg</span>
                          <span>{analyticsData?.dietary?.nonVeg ?? menuItems.filter((i) => ((i.dietaryStatus as string[]) || []).includes('NON_VEG')).length} items</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                          <div className="h-full bg-[#7B3F00] rounded-full" style={{ width: '30%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                          <span className="flex items-center gap-1.5"><FssaiMarker type="EGG" /> Contains Egg</span>
                          <span>{analyticsData?.dietary?.egg ?? menuItems.filter((i) => ((i.dietaryStatus as string[]) || []).includes('EGG')).length} items</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                          <span>Vegetarian / Vegan</span>
                          <span>{analyticsData?.dietary?.vegan ?? 8} items</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: '50%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                          <span>Gluten-Free</span>
                          <span>{analyticsData?.dietary?.glutenFree ?? 5} items</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                          <div className="h-full bg-amber-600 rounded-full" style={{ width: '35%' }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Top Interacted Dishes Table */}
              <div className="lg:col-span-7 p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                <h3 className="font-serif text-lg font-bold text-espresso-900">Top Inquired Dishes</h3>
                <p className="text-xs text-taupe-500">Most viewed and asked-about items by diners</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-cream-50 text-taupe-500 border-b border-cream-200 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Dish</th>
                        <th className="py-2.5 px-3 text-center">Diner Inquiries</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {(analyticsData?.topDishes || menuItems.slice(0, 5)).map((item: any, idx: number) => {
                        const name = item.name || item.customName;
                        const interactions = item.interactions ?? (45 - idx * 7);
                        return (
                          <tr key={item.id || idx}>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-espresso-900">{name}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-terracotta">
                              {interactions}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sage-100 text-sage-800">
                                High Demand
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: RESTAURANT SETTINGS (PROFILE, CITY, CURRENCY, ADDRESS)
        ========================================================================= */}
        {currentTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-espresso-900">Restaurant Settings</h2>
                <p className="text-xs sm:text-sm text-taupe-500 mt-1">
                  Manage restaurant profile, address, operating currency, and contact info.
                </p>
              </div>

              <button
                type="submit"
                form="settings-form"
                disabled={isSavingSettings}
                className="px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-terracotta" />
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {settingsSavedToast && (
              <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                Restaurant settings saved and public cache updated!
              </div>
            )}

            <form id="settings-form" onSubmit={handleSaveRestaurantSettings} className="space-y-6">
              {/* General Restaurant Identity */}
              <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                <h3 className="font-serif text-lg font-bold text-espresso-900">Restaurant Identity</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">Restaurant Display Name *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.displayName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, displayName: e.target.value })}
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">Tagline / Description</label>
                    <input
                      type="text"
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      placeholder="e.g. Modern Indian Craft Kitchen & Chai Bar"
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">Country</label>
                    <select
                      value={settingsForm.country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        const newCurrency = newCountry === 'US' ? 'USD' : 'INR';
                        const newTz = newCountry === 'US' ? 'America/New_York' : 'Asia/Kolkata';
                        setSettingsForm({
                          ...settingsForm,
                          country: newCountry,
                          currency: newCurrency,
                          timezone: newTz,
                        });
                      }}
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white"
                    >
                      <option value="IN">India (IN)</option>
                      <option value="US">United States (US)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">Currency</label>
                    <select
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">City</label>
                    <input
                      type="text"
                      value={settingsForm.city}
                      onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
                <h3 className="font-serif text-lg font-bold text-espresso-900">Location & Contact</h3>

                <div>
                  <label className="block text-xs font-semibold text-taupe-600 mb-1">Full Street Address</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    placeholder="e.g. 12, Indiranagar 100ft Road, Bengaluru, Karnataka 560038"
                    className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-taupe-600 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      placeholder="hello@restaurant.com"
                      className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-taupe-600 mb-1">Google Maps / Review Link</label>
                  <input
                    type="url"
                    value={settingsForm.googleReviewUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleReviewUrl: e.target.value })}
                    placeholder="https://g.page/r/your-restaurant/review"
                    className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
                  />
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 9: BILLING & CREDITS
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
            {(() => {
              const activeBillingCountry: 'IN' | 'US' =
                billingCountryFilter ||
                (restaurant?.country === 'US' || restaurant?.currency === 'USD' ? 'US' : 'IN');

              return (
                <div className="space-y-4 pt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-cream-200">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-espresso-900">
                        Available Subscription Tiers
                      </h3>
                      <p className="text-xs text-taupe-500">
                        {activeBillingCountry === 'US'
                          ? 'United States Dollar (USD $) billing plans'
                          : 'India Rupee (INR ₹) billing plans'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-cream-100 rounded-xl border border-cream-200">
                      <button
                        type="button"
                        onClick={() => setBillingCountryFilter('US')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeBillingCountry === 'US'
                            ? 'bg-espresso-900 text-white shadow-xs'
                            : 'text-taupe-700 hover:text-espresso-900'
                        }`}
                      >
                        🇺🇸 US ($ USD Plans)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCountryFilter('IN')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeBillingCountry === 'IN'
                            ? 'bg-espresso-900 text-white shadow-xs'
                            : 'text-taupe-700 hover:text-espresso-900'
                        }`}
                      >
                        🇮🇳 India (₹ INR Plans)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.values(PLAN_CATALOG)
                      .filter((p) => p.country === activeBillingCountry)
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
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
