'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Search,
  Sparkles,
  MessageSquare,
  UtensilsCrossed,
  ShieldAlert,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Star,
  Wifi,
  Gamepad2,
  Bell,
  ChevronRight,
  ChevronLeft,
  QrCode,
  Clock,
} from 'lucide-react';
import { DishCard } from '@/components/diner/DishCard';
import { DishDetailSheet } from '@/components/diner/DishDetailSheet';
import { AIChatSheet } from '@/components/diner/AIChatSheet';
import { CartSheet } from '@/components/diner/CartSheet';
import { OrderConfirmationSheet } from '@/components/diner/OrderConfirmationSheet';
import { DinerGamesModal } from '@/components/diner/DinerGamesModal';
import { WifiConnectModal } from '@/components/diner/WifiConnectModal';
import { CallWaiterModal } from '@/components/diner/CallWaiterModal';
import { RescanTableModal } from '@/components/diner/RescanTableModal';
import { CartProvider, useCart } from '@/lib/diner/cart-context';
import { generateThemeVariables, THEME_PRESETS } from '@/lib/theme/theme-presets';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { matchesDietaryFilter } from '@/lib/diner/dietary';

export default function DinerMenuPage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC]">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CartProvider restaurantSlug={slug}>
        <DinerMenuContent />
      </CartProvider>
    </React.Suspense>
  );
}

function DinerMenuContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const tableToken = searchParams.get('t') || searchParams.get('table');
  const tableIdParam = searchParams.get('tableId');
  const incomingTableToken = tableToken || null;
  const incomingQueryKey = tableToken || tableIdParam || null;

  const {
    tableInfo,
    setTableInfo,
    tableSessionExpired,
    expiredTableName,
    extendTableSession,
    expireTableSession,
    items,
    itemCount,
    subtotalMinor,
    setIsCartOpen,
  } = useCart();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<string>('ALL');

  // Selected dish for detail sheet
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // AI Chat sheet
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [focusedDishForChat, setFocusedDishForChat] = useState<any | null>(null);

  // View & Interactive Modals
  const initialView = searchParams.get('view') === 'menu' ? 'menu' : 'landing';
  const [viewMode, setViewMode] = useState<'landing' | 'menu'>(initialView);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isWifiOpen, setIsWifiOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isRescanOpen, setIsRescanOpen] = useState(false);
  const [rescanReason, setRescanReason] = useState<'EXPIRED' | 'REQUIRED' | 'INVALID_TOKEN'>('EXPIRED');
  const [bannerError, setBannerError] = useState(false);

  // Order Confirmation sheet
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = useState(false);

  // Refs to prevent redundant reloads when history.replaceState strips ?t=...
  const initializedMenuSlugRef = useRef<string | null>(null);
  const processedScanTokenRef = useRef<string | null>(null);
  const autoPromptedExpiredRef = useRef<boolean>(false);

  const openRescanPrompt = useCallback((reason: 'EXPIRED' | 'REQUIRED' | 'INVALID_TOKEN') => {
    setRescanReason(reason);
    setIsRescanOpen(true);
  }, []);

  useEffect(() => {
    setBannerError(false);
  }, [data?.restaurant?.coverUrl]);

  // 1. Fetch menu & initialize table session
  useEffect(() => {
    if (!slug) return;

    const alreadyLoadedForSlug = initializedMenuSlugRef.current === slug;
    if (alreadyLoadedForSlug && !incomingQueryKey) {
      return;
    }
    if (alreadyLoadedForSlug && incomingQueryKey && processedScanTokenRef.current === incomingQueryKey) {
      return;
    }

    let cancelled = false;

    async function loadMenu() {
      try {
        if (!alreadyLoadedForSlug) {
          setLoading(true);
        }

        if (!alreadyLoadedForSlug) {
          const res = await fetch(`/api/diner/menu?slug=${slug}`, { cache: 'no-store' });
          if (!res.ok) {
            throw new Error('Menu not found');
          }
          const menuData = await res.json();
          if (cancelled) return;
          setData(menuData);
          initializedMenuSlugRef.current = slug;
        }

        const storedSessionToken = (() => {
          try {
            return localStorage.getItem(`dishora_session_${slug}`) || undefined;
          } catch {
            return undefined;
          }
        })();

        // Init anonymous diner session & verify/associate table
        const sessRes = await fetch('/api/diner/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantSlug: slug,
            tableToken: incomingTableToken || undefined,
            t: tableToken || undefined,
            tableId: !tableToken && tableIdParam ? tableIdParam : undefined,
            sessionToken: storedSessionToken,
          }),
        });

        if (cancelled) return;

        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (cancelled) return;

          if (sessData.sessionToken) {
            setSessionToken(sessData.sessionToken);
            try {
              localStorage.setItem(`dishora_session_${slug}`, sessData.sessionToken);
            } catch {}
          }
          if (sessData.sessionId) {
            setSessionId(sessData.sessionId);
          }

          if (incomingQueryKey) {
            processedScanTokenRef.current = incomingQueryKey;
          }

          if (sessData.invalidTableToken) {
            setTableInfo(null);
            openRescanPrompt('INVALID_TOKEN');
          } else if (sessData.tableId && sessData.tableName) {
            autoPromptedExpiredRef.current = false;
            setTableInfo({
              tableId: sessData.tableId,
              tableName: sessData.tableName,
              tableSection: sessData.tableSection,
              tableCapacity: sessData.tableCapacity,
              verifiedAt: sessData.tableVerifiedAt || undefined,
              lastOrderAt: sessData.lastOrderAt ?? null,
              expiresAt: sessData.expiresAt || undefined,
            });
          } else if (sessData.sessionExpired) {
            expireTableSession(sessData.expiredTableName || null);
            autoPromptedExpiredRef.current = true;
            openRescanPrompt('EXPIRED');
          } else {
            // Passive reload with no active server session; keep clean unless localStorage already expired
            setTableInfo(null);
          }

          // Strip single-scan QR query params from URL so browser reloads or bookmarks
          // never extend or spoof a table scan without physically rescanning the QR.
          if (incomingQueryKey && typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href);
            if (
              currentUrl.searchParams.has('t') ||
              currentUrl.searchParams.has('table') ||
              currentUrl.searchParams.has('tableId')
            ) {
              currentUrl.searchParams.delete('t');
              currentUrl.searchParams.delete('table');
              currentUrl.searchParams.delete('tableId');
              const remainingSearch = currentUrl.searchParams.toString();
              const cleanPath = `${currentUrl.pathname}${remainingSearch ? `?${remainingSearch}` : ''}${currentUrl.hash}`;
              window.history.replaceState(null, '', cleanPath);
            }
          }

          setSessionInitialized(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load menu');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenu();
    return () => {
      cancelled = true;
    };
  }, [slug, tableToken, tableIdParam, incomingTableToken, incomingQueryKey, setTableInfo, expireTableSession, openRescanPrompt]);

  // 2. Enforce 30-minute idle timeout in real time across timers, focus & visibility changes
  useEffect(() => {
    if (!tableInfo?.expiresAt) return;

    const checkTimeout = () => {
      const expiresMs = Date.parse(tableInfo.expiresAt!);
      if (!Number.isNaN(expiresMs) && Date.now() > expiresMs) {
        expireTableSession(tableInfo.tableName);
        autoPromptedExpiredRef.current = true;
        openRescanPrompt('EXPIRED');
        return true;
      }
      return false;
    };

    if (checkTimeout()) return;

    const expiresMs = Date.parse(tableInfo.expiresAt);
    const delayMs = Math.max(0, expiresMs - Date.now()) + 150;
    const timeoutId = window.setTimeout(checkTimeout, Math.min(delayMs, 2_147_483_647));
    const intervalId = window.setInterval(checkTimeout, 15_000);

    const handleWakeUp = () => {
      if (document.visibilityState !== 'hidden') {
        checkTimeout();
      }
    };

    window.addEventListener('focus', handleWakeUp);
    document.addEventListener('visibilitychange', handleWakeUp);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWakeUp);
      document.removeEventListener('visibilitychange', handleWakeUp);
    };
  }, [tableInfo?.expiresAt, tableInfo?.tableName, expireTableSession, openRescanPrompt]);

  // Prompt once on reload if localStorage already flagged an expired table session
  useEffect(() => {
    if (
      !sessionInitialized ||
      tableInfo ||
      !tableSessionExpired ||
      incomingQueryKey ||
      autoPromptedExpiredRef.current
    ) {
      return;
    }
    autoPromptedExpiredRef.current = true;
    openRescanPrompt('EXPIRED');
  }, [sessionInitialized, tableInfo, tableSessionExpired, incomingQueryKey, openRescanPrompt]);

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

  // Filter items
  const filteredDishes = useMemo(() => {
    return allItems.filter((item) => {
      // Category filter
      if (activeCategory !== 'ALL' && item.categoryId !== activeCategory) {
        return false;
      }

      // Dietary filter
      if (selectedDietaryFilter !== 'ALL' && !matchesDietaryFilter(item, selectedDietaryFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.customName?.toLowerCase().includes(q);
        const descMatch = item.restaurantDescription?.toLowerCase().includes(q);
        const ingMatch = Array.isArray(item.ingredients) && item.ingredients.some((ing: string) => ing.toLowerCase().includes(q));
        if (!nameMatch && !descMatch && !ingMatch) return false;
      }

      return true;
    });
  }, [allItems, activeCategory, selectedDietaryFilter, searchQuery]);

  // Handle open dish details
  const handleOpenDetail = (dish: any) => {
    setSelectedDish(dish);
    setIsDetailOpen(true);

    const restId = data?.restaurant?.id;
    if (restId && dish?.id) {
      fetch('/api/diner/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          restaurantId: restId,
          menuItemId: dish.id,
          eventType: 'EXPAND',
          sessionToken: sessionToken || undefined,
        }),
      }).catch(() => {});
    }
  };

  const handleAskAboutDish = (dish: any) => {
    setIsDetailOpen(false);
    setFocusedDishForChat(dish);
    setIsChatOpen(true);
  };

  const handleOrderPlaced = (
    order: any,
    tableSession?: { lastOrderAt: string; expiresAt: string }
  ) => {
    if (tableSession?.lastOrderAt && tableSession?.expiresAt) {
      extendTableSession(tableSession.lastOrderAt, tableSession.expiresAt);
    }
    setPlacedOrder(order);
    setIsOrderConfirmationOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC] text-[#35271F] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="font-serif text-sm">Preparing visual menu...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC] p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-cream-300 shadow-lifted space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-espresso-900">Menu Unavailable</h1>
          <p className="text-sm text-taupe-500">
            {error || 'The requested restaurant menu could not be loaded. Please check the QR code or link.'}
          </p>
        </div>
      </div>
    );
  }

  const { restaurant } = data;
  const theme = data.theme || restaurant?.theme;
  const wifiConfig = data.wifi;

  // Generate dynamic CSS variables
  const themeVars = theme
    ? generateThemeVariables({
        presetKey: theme.presetKey,
        backgroundColor: theme.backgroundColor,
        surfaceColor: theme.surfaceColor,
        primaryTextColor: theme.primaryTextColor,
        secondaryTextColor: theme.secondaryTextColor,
        accentColor: theme.accentColor,
        secondaryAccentColor: theme.secondaryAccentColor,
        headingFont: theme.headingFont,
        bodyFont: theme.bodyFont,
        layoutMode: theme.layoutMode,
        cardRadius: theme.cardRadius,
        buttonStyle: theme.buttonStyle,
        imageProportions: theme.imageProportions,
        texture: theme.texture,
      })
    : generateThemeVariables(THEME_PRESETS.WARM_EDITORIAL);

  const layoutMode = theme?.layoutMode || 'GRID';

  // Review Target URL (configured Google Business link or direct Google Maps lookup fallback)
  const reviewUrl =
    restaurant.googleReviewUrl?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${restaurant.displayName} ${restaurant.city || ''} review`.trim()
    )}`;

  // Sample showcase dish image for hero emblem if logo is absent
  const heroArtUrl =
    restaurant.logoUrl ||
    allItems.find((i) => i.imageOverride?.publicUrl || i.canonical?.imageAsset?.publicUrl)
      ?.imageOverride?.publicUrl ||
    allItems.find((i) => i.canonical?.imageAsset?.publicUrl)?.canonical?.imageAsset?.publicUrl ||
    '/placeholder-dish.svg';

  return (
    <div
      style={themeVars as React.CSSProperties}
      className="min-h-screen bg-[var(--dishora-bg)] text-[var(--dishora-text)] selection:bg-[var(--dishora-accent)] selection:text-white transition-colors duration-200 font-sans"
    >
      {/* =========================================================================
          VIEW 1: HOSPITALITY LANDING HUB (QR SCAN FIRST SCREEN)
      ========================================================================= */}
      {viewMode === 'landing' && (
        <main className="min-h-screen max-w-md mx-auto px-4 py-6 sm:py-10 flex flex-col justify-between">
          <div className="space-y-4 animate-fade-in">
            {/* Hero Branded Card */}
            {restaurant.coverUrl && !bannerError ? (
              <article className="rounded-3xl overflow-hidden shadow-lifted border border-[var(--dishora-border)] bg-[var(--dishora-surface)]">
                <img
                  src={restaurant.coverUrl}
                  alt={`${restaurant.displayName} banner`}
                  fetchPriority="high"
                  onError={() => setBannerError(true)}
                  className="w-full aspect-[2/1] object-cover block bg-black/5"
                />
                <header className="p-5 sm:p-6 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[var(--dishora-accent)] text-white font-serif font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                      {restaurant.displayName?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div className="min-w-0">
                      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--dishora-text)] tracking-tight leading-none truncate">
                        {restaurant.displayName}
                      </h1>
                      <p className="text-xs text-[var(--dishora-muted-text)] italic mt-1 truncate">
                        {restaurant.description || 'Scan. Explore. Enjoy.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    {tableInfo ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--dishora-bg)] text-[var(--dishora-text)] border border-[var(--dishora-border)] shadow-2xs">
                        📍 {tableInfo.tableName}
                        {tableInfo.tableSection ? ` • ${tableInfo.tableSection}` : ''}
                      </span>
                    ) : tableSessionExpired ? (
                      <button
                        type="button"
                        onClick={() => openRescanPrompt('EXPIRED')}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200/80 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        Session Timed Out • Rescan QR
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--dishora-bg)] text-[var(--dishora-muted-text)] border border-[var(--dishora-border)]">
                        DINER PORTAL
                      </span>
                    )}
                    {itemCount > 0 && (
                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--dishora-accent)] text-white shadow-xs"
                      >
                        <ShoppingBag className="w-3 h-3" /> {itemCount} in Cart
                      </button>
                    )}
                  </div>
                </header>
              </article>
            ) : (
              <article
                className="relative rounded-3xl overflow-hidden shadow-lifted border border-[var(--dishora-border)] p-5 sm:p-6 flex flex-col justify-end min-h-[180px]"
                style={{
                  background: `linear-gradient(135deg, ${theme?.accentColor || '#B86D52'}20 0%, ${theme?.surfaceColor || '#FFFFFF'} 100%)`,
                  backgroundColor: 'var(--dishora-surface)',
                }}
              >
                {/* Decorative Floating Food Art */}
                <div className="flex justify-end mb-2">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/5 border border-[var(--dishora-border)] shadow-md">
                    <img
                      src={heroArtUrl}
                      alt={restaurant.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-dish.svg';
                      }}
                    />
                  </div>
                </div>

                <header className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[var(--dishora-accent)] text-white font-serif font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                      {restaurant.displayName?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div className="min-w-0">
                      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--dishora-text)] tracking-tight leading-none truncate">
                        {restaurant.displayName}
                      </h1>
                      <p className="text-xs text-[var(--dishora-muted-text)] italic mt-1 truncate">
                        {restaurant.description || 'Scan. Explore. Enjoy.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    {tableInfo ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--dishora-bg)] text-[var(--dishora-text)] border border-[var(--dishora-border)] shadow-2xs">
                        📍 {tableInfo.tableName}
                        {tableInfo.tableSection ? ` • ${tableInfo.tableSection}` : ''}
                      </span>
                    ) : tableSessionExpired ? (
                      <button
                        type="button"
                        onClick={() => openRescanPrompt('EXPIRED')}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200/80 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        Session Timed Out • Rescan QR
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--dishora-bg)] text-[var(--dishora-muted-text)] border border-[var(--dishora-border)]">
                        DINER PORTAL
                      </span>
                    )}
                    {itemCount > 0 && (
                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--dishora-accent)] text-white shadow-xs"
                      >
                        <ShoppingBag className="w-3 h-3" /> {itemCount} in Cart
                      </button>
                    )}
                  </div>
                </header>
              </article>
            )}

            {!tableInfo && tableSessionExpired && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-950 leading-snug">
                    No order placed in the last 30 min{expiredTableName ? ` (${expiredTableName})` : ''}. Rescan QR to order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openRescanPrompt('EXPIRED')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Rescan</span>
                </button>
              </div>
            )}

            {/* Action Menu Stack */}
            <div className="space-y-2.5">
              {/* 1. View Menu */}
              <button
                onClick={() => setViewMode('menu')}
                className="w-full p-4 rounded-2xl bg-[var(--dishora-surface)] border border-[var(--dishora-border)] hover:border-[var(--dishora-accent)] shadow-soft hover:shadow-lifted transition-all flex items-center justify-between text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-serif font-bold text-base text-[var(--dishora-text)] group-hover:text-[var(--dishora-accent)] transition-colors">
                      View Menu
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--dishora-muted-text)] mt-0.5">
                      ORDER TO YOUR TABLE • {allItems.length} DISHES
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--dishora-muted-text)] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Leave a Review */}
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl bg-[var(--dishora-surface)] border border-[var(--dishora-border)] hover:border-[var(--dishora-accent)] shadow-soft hover:shadow-lifted transition-all flex items-center justify-between text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-serif font-bold text-base text-[var(--dishora-text)] group-hover:text-[var(--dishora-accent)] transition-colors">
                      Leave a Review
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--dishora-muted-text)] mt-0.5">
                      TELL US HOW WE DID ON GOOGLE
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--dishora-muted-text)] group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* 3. Connect to Wi-Fi (shown only when owner enables Free Wi-Fi) */}
              {wifiConfig?.enabled && (
                <button
                  onClick={() => setIsWifiOpen(true)}
                  className="w-full p-4 rounded-2xl bg-[var(--dishora-surface)] border border-[var(--dishora-border)] hover:border-emerald-500/60 shadow-soft hover:shadow-lifted transition-all flex items-center justify-between text-left group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-serif font-bold text-base text-[var(--dishora-text)] group-hover:text-emerald-600 transition-colors">
                        Connect to Wi-Fi
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--dishora-muted-text)] mt-0.5">
                        TAP FOR THE PASSWORD & QR JOIN
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--dishora-muted-text)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* 4. Play Games (2-5 Players Multiplayer Suite) */}
              <button
                onClick={() => setIsGamesOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--dishora-surface)] border border-[var(--dishora-border)] hover:border-purple-500/60 shadow-soft hover:shadow-lifted transition-all flex items-center justify-between text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-serif font-bold text-base text-[var(--dishora-text)] group-hover:text-purple-600 transition-colors">
                      Play Games
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--dishora-muted-text)] mt-0.5">
                      WHILE YOU WAIT • 2–5 PLAYERS
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--dishora-muted-text)] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 5. Call Waiter / Table Assistance */}
              <button
                onClick={() => setIsCallWaiterOpen(true)}
                className="w-full p-4 rounded-2xl bg-[var(--dishora-surface)] border border-[var(--dishora-border)] hover:border-[var(--dishora-accent)] shadow-soft hover:shadow-lifted transition-all flex items-center justify-between text-left group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-terracotta/10 text-[var(--dishora-accent)] border border-[var(--dishora-accent)]/25 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-serif font-bold text-base text-[var(--dishora-text)] group-hover:text-[var(--dishora-accent)] transition-colors">
                      Call Waiter
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--dishora-muted-text)] mt-0.5">
                      WATER, CUTLERY, BILL OR ASSISTANCE
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--dishora-muted-text)] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Hub Footer */}
          <footer className="pt-8 pb-4 text-center space-y-3">
            <button
              onClick={() => {
                setFocusedDishForChat(null);
                setIsChatOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--dishora-surface)] border border-[var(--dishora-border)] text-xs font-semibold text-[var(--dishora-text)] shadow-xs hover:border-[var(--dishora-accent)] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--dishora-accent)]" />
              Ask AI Menu Concierge
            </button>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--dishora-muted-text)]">
              {restaurant.displayName} • POWERED BY MENZY
            </p>
          </footer>
        </main>
      )}

      {/* =========================================================================
          VIEW 2: FULL VISUAL MENU & TABLE ORDERING
      ========================================================================= */}
      {viewMode === 'menu' && (
        <div className="pb-32">
      {/* Sticky Quick Top Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-[var(--dishora-surface)]/95 backdrop-blur-md border-b border-[var(--dishora-border)] shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-2">
          <button
            onClick={() => setViewMode('landing')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dishora-muted-text)] hover:text-[var(--dishora-text)] transition-colors py-1 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Table Hub</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {wifiConfig?.enabled && (
              <button
                onClick={() => setIsWifiOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[11px] font-semibold hover:bg-emerald-500/20 transition-colors"
                title="Free Wi-Fi"
              >
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">Wi-Fi</span>
              </button>
            )}
            <button
              onClick={() => setIsGamesOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20 text-[11px] font-semibold hover:bg-purple-500/20 transition-colors"
              title="Play Table Games"
            >
              <Gamepad2 className="w-3 h-3" />
              <span className="hidden sm:inline">Games</span>
            </button>
            <button
              onClick={() => setIsCallWaiterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--dishora-accent)]/15 text-[var(--dishora-accent)] border border-[var(--dishora-accent)]/30 text-[11px] font-bold hover:bg-[var(--dishora-accent)] hover:text-white transition-all shadow-2xs"
            >
              <Bell className="w-3 h-3" />
              <span>Call Waiter</span>
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 rounded-full bg-[var(--dishora-bg)] hover:opacity-90 text-[var(--dishora-text)] border border-[var(--dishora-border)] transition-colors shadow-2xs shrink-0"
              title="View Table Order"
            >
              <ShoppingBag className="w-4 h-4 text-[var(--dishora-accent)]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--dishora-accent)] text-white text-[10px] font-bold flex items-center justify-center font-mono shadow">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header & Brand Banner */}
      <header className="relative bg-[var(--dishora-surface)] border-b border-[var(--dishora-border)] shadow-soft">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--dishora-accent)] font-semibold">
                  Visual Menu & Table Ordering
                </span>
                {tableInfo ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    📍 Dining at {tableInfo.tableName}
                  </span>
                ) : tableSessionExpired ? (
                  <button
                    type="button"
                    onClick={() => openRescanPrompt('EXPIRED')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300 transition-colors"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Session Expired • Rescan QR</span>
                  </button>
                ) : null}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--dishora-text)] tracking-tight">
                {restaurant.displayName}
              </h1>
              {restaurant.description && (
                <p className="text-xs sm:text-sm text-[var(--dishora-muted-text)] max-w-2xl leading-relaxed">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          {/* Search & Dietary Filters Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-taupe-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dishes, ingredients, beverages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--dishora-surface)] border border-[var(--dishora-border)] text-xs sm:text-sm text-[var(--dishora-text)] placeholder:text-taupe-400 focus:outline-none focus:ring-1 focus:ring-[var(--dishora-accent)] transition-all shadow-xs"
              />
            </div>

            {/* Dietary Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {(isIndianRestaurant
                ? [
                    { id: 'ALL', label: 'All Dishes' },
                    { id: 'VEG', label: '🟢 Veg' },
                    { id: 'NON_VEG', label: '🔴 Non-Veg' },
                    { id: 'EGG', label: '🟡 Egg' },
                  ]
                : [
                    { id: 'ALL', label: 'All Dishes' },
                    { id: 'VEGAN', label: 'Vegan' },
                    { id: 'VEGETARIAN', label: 'Vegetarian' },
                    { id: 'GLUTEN_FREE', label: 'Gluten-Free' },
                    { id: 'DAIRY_FREE', label: 'Dairy-Free' },
                  ]
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedDietaryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                    selectedDietaryFilter === f.id
                      ? 'bg-[var(--dishora-accent)] border-[var(--dishora-accent)] text-white shadow-xs'
                      : 'bg-[var(--dishora-surface)] border-[var(--dishora-border)] text-[var(--dishora-muted-text)] hover:text-[var(--dishora-text)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Menu Viewport */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 sticky top-[49px] z-20 bg-[var(--dishora-bg)]/95 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0">
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

      {/* Floating Bottom Navigation / Cart Companion */}
      <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        {itemCount > 0 ? (
          <div className="pointer-events-auto flex items-center gap-3 bg-[var(--dishora-text)] text-[var(--dishora-surface)] p-2 pr-3 pl-4 rounded-full shadow-2xl border border-white/20 animate-fade-in max-w-md w-full justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[var(--dishora-accent)] text-white font-mono text-xs font-bold flex items-center justify-center">
                {itemCount}
              </div>
              <div className="text-xs">
                <div className="font-semibold">{tableInfo?.tableName || 'Table Order'}</div>
                <div className="font-mono text-taupe-300">
                  {formatCurrencyMinor(subtotalMinor, restaurant.currency)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="py-2 px-4 rounded-full bg-[var(--dishora-accent)] hover:opacity-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <span>View Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
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
        )}
      </div>
      </div>
      )}

      {/* Dish Detail Bottom Sheet / Customization Modal */}
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

      {/* Cart Bottom Sheet */}
      <CartSheet
        restaurantId={restaurant.id}
        restaurantName={restaurant.displayName}
        currency={restaurant.currency}
        sessionId={sessionId}
        sessionToken={sessionToken}
        onOrderPlaced={handleOrderPlaced}
        onRequestRescan={(reason) => {
          setIsCartOpen(false);
          openRescanPrompt(reason);
        }}
      />

      {/* Order Confirmation Bottom Sheet */}
      <OrderConfirmationSheet
        order={placedOrder}
        isOpen={isOrderConfirmationOpen}
        onClose={() => setIsOrderConfirmationOpen(false)}
        onAddMoreItems={() => {
          setIsOrderConfirmationOpen(false);
        }}
      />

      {/* Guest Free Wi-Fi Modal */}
      {wifiConfig && (
        <WifiConnectModal
          isOpen={isWifiOpen}
          onClose={() => setIsWifiOpen(false)}
          restaurantName={restaurant.displayName}
          wifi={wifiConfig}
        />
      )}

      {/* Table Minigames (2 to 5 Players) */}
      <DinerGamesModal
        isOpen={isGamesOpen}
        onClose={() => setIsGamesOpen(false)}
        restaurantName={restaurant.displayName}
      />

      {/* Call Waiter to Table Modal */}
      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        restaurantId={restaurant.id}
        tableName={tableInfo?.tableName}
        tableId={tableInfo?.tableId}
        sessionId={sessionId}
        sessionToken={sessionToken}
        tableExpiresAt={tableInfo?.expiresAt}
        isSessionExpired={tableSessionExpired}
        expiredTableName={expiredTableName}
        onSessionExpired={expireTableSession}
        onSyncTable={setTableInfo}
        onRequestRescan={(reason) => {
          setIsCallWaiterOpen(false);
          openRescanPrompt(reason);
        }}
      />

      {/* Table Session Rescan Prompt Modal */}
      <RescanTableModal
        isOpen={isRescanOpen}
        onClose={() => setIsRescanOpen(false)}
        restaurantSlug={slug}
        restaurantName={restaurant.displayName}
        reason={rescanReason}
        expiredTableName={expiredTableName}
      />
    </div>
  );
}
