'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Search, Sparkles, MessageSquare, UtensilsCrossed, ShieldAlert } from 'lucide-react';
import { DishCard } from '@/components/diner/DishCard';
import { DishDetailSheet } from '@/components/diner/DishDetailSheet';
import { AIChatSheet } from '@/components/diner/AIChatSheet';
import { generateThemeVariables, THEME_PRESETS } from '@/lib/theme/theme-presets';

export default function DinerMenuPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC]">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DinerMenuContent />
    </React.Suspense>
  );
}

function DinerMenuContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const tableToken = searchParams.get('table');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<string>('ALL');

  // Selected dish for detail sheet
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // AI Chat sheet
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [focusedDishForChat, setFocusedDishForChat] = useState<any | null>(null);

  // 1. Fetch menu & initialize session
  useEffect(() => {
    if (!slug) return;

    async function loadMenu() {
      try {
        setLoading(true);
        const res = await fetch(`/api/diner/menu?slug=${slug}`);
        if (!res.ok) {
          throw new Error('Menu not found');
        }
        const menuData = await res.json();
        setData(menuData);

        // Init anonymous diner session & track scan
        const sessRes = await fetch('/api/diner/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantSlug: slug, tableToken }),
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          setSessionToken(sessData.sessionToken);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [slug, tableToken]);

  // Extract all categories & items
  const { categories, allItems } = useMemo(() => {
    if (!data?.menus) return { categories: [], allItems: [] };
    const itemsList: any[] = [];
    const catList: any[] = [];

    for (const menu of data.menus) {
      for (const cat of menu.categories || []) {
        catList.push(cat);
        for (const it of cat.items || []) {
          itemsList.push({ ...it, categoryName: cat.name });
        }
      }
    }
    return { categories: catList, allItems: itemsList };
  }, [data]);

  const isIndianRestaurant = data?.restaurant?.country === 'IN' || data?.restaurant?.currency === 'INR';

  // Dietary filter options by region
  const dietaryFilterOptions = useMemo(() => {
    if (isIndianRestaurant) {
      return [
        { key: 'ALL', label: 'All Dishes' },
        { key: 'POPULAR', label: '🔥 Bestsellers' },
        { key: 'VEG', label: '🟢 Pure Veg' },
        { key: 'NON_VEG', label: '🔺 Non-Veg' },
        { key: 'EGG', label: '🟡 Contains Egg' },
        { key: 'JAIN', label: 'Jain Safe' },
        { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
      ];
    }
    return [
      { key: 'ALL', label: 'All Dishes' },
      { key: 'POPULAR', label: '🔥 Bestsellers' },
      { key: 'VEGETARIAN', label: 'Vegetarian' },
      { key: 'VEGAN', label: 'Vegan' },
      { key: 'GLUTEN_FREE', label: 'Gluten-Free' },
      { key: 'DAIRY_FREE', label: 'Dairy-Free' },
      { key: 'HALAL', label: 'Halal' },
    ];
  }, [isIndianRestaurant]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return allItems.filter((item) => {
      // Category filter
      if (activeCategory !== 'ALL' && item.categoryId !== activeCategory) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.customName.toLowerCase().includes(q);
        const matchesDesc = item.restaurantDescription?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      // Dietary filter
      if (selectedDietaryFilter === 'POPULAR') {
        if (!item.isPopular && !item.chefRecommended) return false;
      } else if (selectedDietaryFilter !== 'ALL') {
        const labels = ((item.dietaryStatus as string[]) || []).map((l: string) => l.toUpperCase().trim().replace(/\s+/g, '_'));
        if (selectedDietaryFilter === 'VEG') {
          if (!labels.includes('VEG') && !labels.includes('VEGETARIAN') && !labels.includes('PURE_VEG')) return false;
        } else if (selectedDietaryFilter === 'NON_VEG') {
          if (!labels.includes('NON_VEG') && !labels.includes('NON-VEG') && !labels.includes('NONVEG')) return false;
        } else if (selectedDietaryFilter === 'EGG') {
          if (!labels.includes('EGG') && !labels.includes('CONTAINS_EGG') && !labels.includes('EGGETARIAN')) return false;
        } else if (selectedDietaryFilter === 'JAIN') {
          if (!labels.includes('JAIN') && !labels.includes('JAIN_FRIENDLY')) return false;
        } else if (selectedDietaryFilter === 'VEGETARIAN') {
          if (!labels.includes('VEGETARIAN') && !labels.includes('VEG') && !labels.includes('PURE_VEG')) return false;
        } else {
          if (!labels.includes(selectedDietaryFilter)) return false;
        }
      }
      return true;
    });
  }, [allItems, activeCategory, searchQuery, selectedDietaryFilter]);

  // Apply theme variables
  const themeVars = useMemo(() => {
    if (!data?.theme) return generateThemeVariables(THEME_PRESETS.WARM_EDITORIAL);
    return generateThemeVariables(data.theme);
  }, [data?.theme]);

  const layoutMode = data?.theme?.layoutMode || 'GRID';

  const handleOpenDetail = (dish: any) => {
    setSelectedDish(dish);
    setIsDetailOpen(true);
  };

  const handleAskAboutDish = (dish: any) => {
    setIsDetailOpen(false);
    setFocusedDishForChat(dish);
    setIsChatOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif text-espresso-700 tracking-wide">Crafting your menu experience...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC] p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-cream-300 shadow-soft">
          <UtensilsCrossed className="w-12 h-12 text-terracotta mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-espresso-800 mb-2">Menu Unavailable</h1>
          <p className="text-sm text-taupe-600 mb-6">
            We couldn't load the menu for this venue. Please verify the URL or ask the restaurant team.
          </p>
        </div>
      </div>
    );
  }

  const { restaurant, settings } = data;

  return (
    <div
      style={{ fontFamily: 'var(--font-body)', ...themeVars }}
      className="min-h-screen bg-[var(--dishora-bg)] text-[var(--dishora-text)] pb-28"
    >
      {/* Brand Header */}
      <header className="relative w-full bg-[var(--dishora-surface)] border-b border-[var(--dishora-border)] shadow-sm">
        {restaurant.coverUrl && (
          <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-cream-200">
            <img
              src={restaurant.coverUrl}
              alt={restaurant.displayName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--dishora-surface)] via-transparent to-black/20" />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-6">
          <div className="flex items-center gap-4">
            {restaurant.logoUrl && (
              <img
                src={restaurant.logoUrl}
                alt={restaurant.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[var(--dishora-border)] shadow-sm bg-white shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-serif text-[var(--dishora-text)] truncate">
                {restaurant.displayName}
              </h1>
              {restaurant.description && (
                <p className="text-xs sm:text-sm text-[var(--dishora-muted-text)] line-clamp-2 mt-1">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          {settings?.welcomeMessage && (
            <div className="mt-4 p-3 bg-cream-50 rounded-xl border border-cream-200 text-xs sm:text-sm text-espresso-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--dishora-accent)] shrink-0" />
              <span>{settings.welcomeMessage}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Browse Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Search Bar & Dietary Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, ingredients..."
              className="w-full pl-11 pr-4 py-3 bg-[var(--dishora-surface)] rounded-2xl border border-[var(--dishora-border)] text-sm text-[var(--dishora-text)] placeholder:text-taupe-400 focus:outline-none focus:ring-2 focus:ring-[var(--dishora-accent)] transition-all shadow-soft"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-taupe-400 hover:text-espresso-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {dietaryFilterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedDietaryFilter(opt.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedDietaryFilter === opt.key
                    ? 'bg-[var(--dishora-text)] text-[var(--dishora-surface)] shadow-sm'
                    : 'bg-[var(--dishora-surface)] text-[var(--dishora-muted-text)] border border-[var(--dishora-border)] hover:bg-cream-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Category Navigation Tabs */}
        <div className="sticky top-0 z-20 py-3 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-[var(--dishora-bg)]/95 backdrop-blur-md border-b border-[var(--dishora-border)] mb-6 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeCategory === 'ALL'
                ? 'bg-[var(--dishora-accent)] text-white shadow-sm'
                : 'bg-[var(--dishora-surface)] text-[var(--dishora-text)] border border-[var(--dishora-border)] hover:bg-cream-100'
            }`}
          >
            All Categories ({allItems.length})
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-[var(--dishora-accent)] text-white shadow-sm'
                  : 'bg-[var(--dishora-surface)] text-[var(--dishora-text)] border border-[var(--dishora-border)] hover:bg-cream-100'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
          ))}
        </div>

        {/* Dish Catalog */}
        {filteredDishes.length === 0 ? (
          <div className="py-16 text-center bg-[var(--dishora-surface)] rounded-3xl border border-[var(--dishora-border)] p-8">
            <UtensilsCrossed className="w-10 h-10 text-taupe-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-[var(--dishora-text)] mb-1">No dishes match your search</h3>
            <p className="text-xs sm:text-sm text-[var(--dishora-muted-text)] mb-4">
              Try adjusting your dietary filter or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDietaryFilter('ALL');
                setActiveCategory('ALL');
              }}
              className="text-xs font-semibold text-[var(--dishora-accent)] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div
            className={
              layoutMode === 'LIST'
                ? 'space-y-3'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
            }
          >
            {filteredDishes.map((item) => (
              <DishCard
                key={item.id}
                item={item}
                layoutMode={layoutMode}
                onSelect={handleOpenDetail}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Sticky "Ask about our dishes" Companion Button */}
      <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <button
          onClick={() => {
            setFocusedDishForChat(null);
            setIsChatOpen(true);
          }}
          className="pointer-events-auto flex items-center gap-2.5 py-3.5 px-6 rounded-full bg-[var(--dishora-text)] text-[var(--dishora-surface)] font-medium text-sm shadow-lifted hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/20"
        >
          <Sparkles className="w-4 h-4 text-[var(--dishora-accent)]" />
          <span>Ask about our dishes</span>
        </button>
      </div>

      {/* Dish Detail Bottom Sheet / Modal */}
      <DishDetailSheet
        item={selectedDish}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAskAboutDish={handleAskAboutDish}
      />

      {/* AI Conversational Waiter Bottom Sheet */}
      <AIChatSheet
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.displayName}
        sessionToken={sessionToken}
        focusedDish={focusedDishForChat}
        onClearFocusedDish={() => setFocusedDishForChat(null)}
        onSelectDish={handleOpenDetail}
        publishedItems={allItems}
      />
    </div>
  );
}
