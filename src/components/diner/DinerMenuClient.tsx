'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  Sparkles,
  UtensilsCrossed,
  ShieldAlert,
  ShoppingBag,
  ArrowRight,
  BookOpen,
  Star,
  Wifi,
  Gamepad2,
  Bell,
  ChevronRight,
  ChevronLeft,
  QrCode,
  Clock,
  Mail,
} from 'lucide-react';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';
import { DishCard } from '@/components/diner/DishCard';
import { useCart } from '@/lib/diner/cart-context';
import {
  DEFAULT_SCAN_TIMEOUT_MINUTES,
  type TableSessionTimeoutKind,
} from '@/lib/diner/table-session-config';
import { generateThemeVariables, THEME_PRESETS } from '@/lib/theme/theme-presets';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { matchesDietaryFilter } from '@/lib/diner/dietary';
import { resolveLandingHeroMedia } from '@/lib/banner/banner-validation';

const DishDetailSheet = dynamic(
  () => import('@/components/diner/DishDetailSheet').then((m) => m.DishDetailSheet),
  { ssr: false }
);
const AIChatSheet = dynamic(
  () => import('@/components/diner/AIChatSheet').then((m) => m.AIChatSheet),
  { ssr: false }
);
const CartSheet = dynamic(
  () => import('@/components/diner/CartSheet').then((m) => m.CartSheet),
  { ssr: false }
);
const OrderConfirmationSheet = dynamic(
  () => import('@/components/diner/OrderConfirmationSheet').then((m) => m.OrderConfirmationSheet),
  { ssr: false }
);
const DinerGamesModal = dynamic(
  () => import('@/components/diner/DinerGamesModal').then((m) => m.DinerGamesModal),
  { ssr: false }
);
const WifiConnectModal = dynamic(
  () => import('@/components/diner/WifiConnectModal').then((m) => m.WifiConnectModal),
  { ssr: false }
);
const CallWaiterModal = dynamic(
  () => import('@/components/diner/CallWaiterModal').then((m) => m.CallWaiterModal),
  { ssr: false }
);
const RescanTableModal = dynamic(
  () => import('@/components/diner/RescanTableModal').then((m) => m.RescanTableModal),
  { ssr: false }
);

export interface DinerMenuClientProps {
  initialSlug: string;
  initialMenuData?: Record<string, any> | null;
  initialPausedPayload?: Record<string, any> | null;
  initialError?: string | null;
  initialViewMode?: 'landing' | 'menu';
  initialTableToken?: string | null;
  initialTableIdParam?: string | null;
}

const TableRemainingBadge = React.memo(function TableRemainingBadge({
  expiresAt,
}: {
  expiresAt?: string;
}) {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        setNowMs(Date.now());
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const expiresMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresMs) || expiresMs <= nowMs) return null;
  const mins = Math.max(1, Math.ceil((expiresMs - nowMs) / 60_000));
  return <> • {mins}m left</>;
});

export function DinerMenuClient({
  initialSlug,
  initialMenuData = null,
  initialPausedPayload = null,
  initialError = null,
  initialViewMode = 'landing',
  initialTableToken = null,
  initialTableIdParam = null,
}: DinerMenuClientProps) {
  const slug = initialSlug;
  const incomingTableToken = initialTableToken || null;
  const tableIdParam = initialTableIdParam || null;
  const incomingQueryKey = incomingTableToken || tableIdParam || null;

  const {
    tableInfo,
    setTableInfo,
    tableSessionExpired,
    expiredTableName,
    expiredTimeoutMinutes,
    expiredTimeoutKind,
    extendTableSession,
    expireTableSession,
    itemCount,
    subtotalMinor,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [data, setData] = useState<any>(initialMenuData);
  const [loading, setLoading] = useState<boolean>(
    !initialMenuData && !initialPausedPayload && !initialError
  );
  const [error, setError] = useState<string | null>(initialError || null);
  const [pausedState, setPausedState] = useState<{
    paused: boolean;
    code?: string;
    message?: string;
    restaurantName?: string;
    supportEmail?: string;
  } | null>(() =>
    initialPausedPayload
      ? {
          paused: true,
          code: initialPausedPayload.code,
          message:
            initialPausedPayload.error ||
            "This restaurant's 14-day free trial or subscription has ended. Live menu viewing and ordering will resume once renewed in the Owner Panel.",
          restaurantName: initialPausedPayload.restaurant?.displayName,
          supportEmail: initialPausedPayload.supportEmail || SUPPORT_EMAIL_DISPLAY,
        }
      : null
  );

  const restaurantNameRef = useRef<string | undefined>(undefined);
  restaurantNameRef.current = data?.restaurant?.displayName;

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
  const [viewMode, setViewMode] = useState<'landing' | 'menu'>(initialViewMode);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isWifiOpen, setIsWifiOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isRescanOpen, setIsRescanOpen] = useState(false);
  const [rescanReason, setRescanReason] = useState<'EXPIRED' | 'REQUIRED' | 'INVALID_TOKEN'>(
    'EXPIRED'
  );
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Order Confirmation sheet
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = useState(false);

  const markMenuPaused = useCallback(
    (payload?: any) => {
      setIsChatOpen(false);
      setIsCartOpen(false);
      setIsCallWaiterOpen(false);
      setIsRescanOpen(false);
      setPausedState({
        paused: true,
        code: payload?.code,
        message:
          payload?.error ||
          "This restaurant's 14-day free trial or subscription has ended. Live menu viewing and ordering will resume once renewed in the Owner Panel.",
        restaurantName: payload?.restaurant?.displayName || restaurantNameRef.current,
        supportEmail: payload?.supportEmail || SUPPORT_EMAIL_DISPLAY,
      });
    },
    [setIsCartOpen]
  );

  // Refs to prevent redundant reloads when SSR hydrated data or history.replaceState strips ?t=...
  const initializedMenuSlugRef = useRef<string | null>(initialMenuData ? slug : null);
  const sessionInitAttemptedRef = useRef<boolean>(false);
  const processedScanTokenRef = useRef<string | null>(null);
  const autoPromptedExpiredRef = useRef<boolean>(false);

  const openRescanPrompt = useCallback((reason: 'EXPIRED' | 'REQUIRED' | 'INVALID_TOKEN') => {
    setRescanReason(reason);
    setIsRescanOpen(true);
  }, []);

  useEffect(() => {
    setBannerError(false);
    setLogoError(false);
  }, [data?.restaurant?.coverUrl, data?.restaurant?.logoUrl]);

  // 1. Load menu (if missing from SSR) & initialize table session in background without serial blocking
  useEffect(() => {
    if (!slug || initialPausedPayload || initialError) return;

    const alreadyLoadedForSlug = initializedMenuSlugRef.current === slug;
    if (
      alreadyLoadedForSlug &&
      sessionInitAttemptedRef.current &&
      !incomingQueryKey
    ) {
      return;
    }
    if (
      alreadyLoadedForSlug &&
      incomingQueryKey &&
      processedScanTokenRef.current === incomingQueryKey
    ) {
      return;
    }

    let cancelled = false;

    async function loadMenuAndSession() {
      try {
        const storedSessionToken = (() => {
          try {
            return localStorage.getItem(`dishora_session_${slug}`) || undefined;
          } catch {
            return undefined;
          }
        })();

        const menuPromise = !alreadyLoadedForSlug
          ? fetch(`/api/diner/menu?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
          : Promise.resolve(null);

        sessionInitAttemptedRef.current = true;
        const sessionPromise = fetch('/api/diner/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantSlug: slug,
            tableToken: incomingTableToken || undefined,
            t: incomingTableToken || undefined,
            tableId: !incomingTableToken && tableIdParam ? tableIdParam : undefined,
            sessionToken: storedSessionToken,
          }),
        });

        // Handle menu immediately if fetched client-side (never wait for session to paint menu)
        if (!alreadyLoadedForSlug) {
          setLoading(true);
          const menuRes = await menuPromise;
          if (!cancelled && menuRes) {
            if (menuRes.status === 402) {
              const pausedPayload = await menuRes.json().catch(() => ({}));
              if (!cancelled) {
                markMenuPaused(pausedPayload);
              }
              return;
            }
            if (!menuRes.ok) {
              throw new Error('Menu not found');
            }
            const menuData = await menuRes.json();
            if (cancelled) return;
            setData(menuData);
            initializedMenuSlugRef.current = slug;
            setLoading(false);
          }
        }

        const sessRes = await sessionPromise;
        if (cancelled) return;

        if (sessRes.status === 402) {
          const pausedPayload = await sessRes.json().catch(() => ({}));
          if (!cancelled) {
            markMenuPaused(pausedPayload);
          }
          return;
        }

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
              timeoutMinutes: sessData.timeoutMinutes ?? undefined,
              timeoutKind: sessData.timeoutKind ?? undefined,
              scanTimeoutMinutes: sessData.scanTimeoutMinutes ?? undefined,
              orderExtensionMinutes: sessData.orderExtensionMinutes ?? undefined,
            });
          } else if (sessData.sessionExpired) {
            expireTableSession(sessData.expiredTableName || null, {
              timeoutMinutes: sessData.timeoutMinutes ?? null,
              timeoutKind: sessData.timeoutKind ?? null,
            });
            autoPromptedExpiredRef.current = true;
            openRescanPrompt('EXPIRED');
          } else {
            setTableInfo(null);
          }

          // Strip single-scan QR query params from URL cleanly after binding
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

    loadMenuAndSession();
    return () => {
      cancelled = true;
    };
  }, [
    slug,
    initialPausedPayload,
    initialError,
    incomingTableToken,
    tableIdParam,
    incomingQueryKey,
    setTableInfo,
    expireTableSession,
    openRescanPrompt,
    markMenuPaused,
  ]);

  // 2. Enforce customized idle timeout in real time across timers, focus & visibility changes
  useEffect(() => {
    if (!tableInfo?.expiresAt) return;

    const checkTimeout = () => {
      const currentNow = Date.now();
      const expiresMs = Date.parse(tableInfo.expiresAt!);
      if (!Number.isNaN(expiresMs) && currentNow > expiresMs) {
        expireTableSession(tableInfo.tableName, {
          timeoutMinutes: tableInfo.timeoutMinutes ?? null,
          timeoutKind: tableInfo.timeoutKind ?? null,
        });
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
  }, [
    tableInfo?.expiresAt,
    tableInfo?.tableName,
    tableInfo?.timeoutMinutes,
    tableInfo?.timeoutKind,
    expireTableSession,
    openRescanPrompt,
  ]);

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
          const ingredientsText = Array.isArray(it.ingredients) ? it.ingredients.join(' ') : '';
          itemsList.push({
            ...it,
            categoryName: cat.name,
            _searchText: `${it.customName || ''} ${it.restaurantDescription || ''} ${ingredientsText}`.toLowerCase(),
          });
        }
      }
    }
    return { categories: catList, allItems: itemsList };
  }, [data]);

  const isIndianRestaurant =
    data?.restaurant?.country === 'IN' || data?.restaurant?.currency === 'INR';

  // Filter items
  const filteredDishes = useMemo(() => {
    const trimmedSearch = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (activeCategory !== 'ALL' && item.categoryId !== activeCategory) {
        return false;
      }

      if (selectedDietaryFilter !== 'ALL' && !matchesDietaryFilter(item, selectedDietaryFilter)) {
        return false;
      }

      if (trimmedSearch && !item._searchText.includes(trimmedSearch)) {
        return false;
      }

      return true;
    });
  }, [allItems, activeCategory, selectedDietaryFilter, searchQuery]);

  // Handle open dish details
  const restaurantIdForInteraction = data?.restaurant?.id;
  const handleOpenDetail = useCallback(
    (dish: any) => {
      setSelectedDish(dish);
      setIsDetailOpen(true);

      if (restaurantIdForInteraction && dish?.id) {
        fetch('/api/diner/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            restaurantId: restaurantIdForInteraction,
            menuItemId: dish.id,
            eventType: 'EXPAND',
            sessionToken: sessionToken || undefined,
          }),
        }).catch(() => {});
      }
    },
    [restaurantIdForInteraction, sessionToken]
  );

  const theme = data?.theme || data?.restaurant?.theme;
  const themeVars = useMemo(() => {
    return theme
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
  }, [theme]);

  const handleAskAboutDish = (dish: any) => {
    setIsDetailOpen(false);
    setFocusedDishForChat(dish);
    setIsChatOpen(true);
  };

  const handleOrderPlaced = (
    order: any,
    tableSession?: {
      lastOrderAt: string;
      expiresAt: string;
      timeoutMinutes?: number;
      timeoutKind?: TableSessionTimeoutKind;
      scanTimeoutMinutes?: number;
      orderExtensionMinutes?: number;
    }
  ) => {
    if (tableSession?.lastOrderAt && tableSession?.expiresAt) {
      extendTableSession(tableSession.lastOrderAt, tableSession.expiresAt, {
        timeoutMinutes: tableSession.timeoutMinutes,
        timeoutKind: tableSession.timeoutKind,
        scanTimeoutMinutes: tableSession.scanTimeoutMinutes,
        orderExtensionMinutes: tableSession.orderExtensionMinutes,
      });
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

  if (pausedState) {
    const supportEmail = pausedState.supportEmail || SUPPORT_EMAIL_DISPLAY;
    const supportMailHref = `mailto:${supportEmail}` || SUPPORT_EMAIL_HREF;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC] p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-cream-300 shadow-lifted space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            {pausedState.restaurantName && (
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-terracotta">
                {pausedState.restaurantName}
              </p>
            )}
            <h1 className="font-serif text-2xl font-bold text-espresso-900">
              Digital Menu Temporarily Paused
            </h1>
          </div>
          <p className="text-sm text-taupe-600 leading-relaxed">
            {pausedState.message ||
              "This restaurant's 14-day free trial or subscription has ended. Live menu viewing and table ordering will resume once renewed in the Owner Panel."}
          </p>
          <div className="pt-3 border-t border-cream-200 space-y-2">
            <p className="text-xs text-taupe-500">
              Restaurant owner? Sign in to buy a subscription in your Billing panel, or email for setup-related queries:
            </p>
            <a
              href={supportMailHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs font-mono font-bold text-espresso-900 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-terracotta" />
              <span>{supportEmail}</span>
            </a>
          </div>
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
            {error ||
              'The requested restaurant menu could not be loaded. Please check the QR code or link.'}
          </p>
        </div>
      </div>
    );
  }

  const { restaurant } = data;
  const wifiConfig = data.wifi;
  const configuredScanTimeoutMinutes: number =
    data?.tableSession?.scanTimeoutMinutes ?? DEFAULT_SCAN_TIMEOUT_MINUTES;
  const effectiveExpiredTimeoutMinutes =
    expiredTimeoutMinutes ?? configuredScanTimeoutMinutes;

  const layoutMode = theme?.layoutMode || 'GRID';

  const reviewUrl =
    restaurant.googleReviewUrl?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${restaurant.displayName} ${restaurant.city || ''} review`.trim()
    )}`;

  const { bannerUrl: heroBannerUrl, logoUrl: heroLogoUrl } = resolveLandingHeroMedia({
    coverUrl: restaurant.coverUrl,
    bannerError,
    logoUrl: restaurant.logoUrl,
    logoError,
  });

  return (
    <div
      style={themeVars as React.CSSProperties}
      className="min-h-screen bg-[var(--dishora-bg)] text-[var(--dishora-text)] selection:bg-[var(--dishora-accent)] selection:text-[var(--dishora-accent-fg,#FFFFFF)] transition-colors duration-200 font-sans"
    >
      {/* =========================================================================
          VIEW 1: HOSPITALITY LANDING HUB (QR SCAN FIRST SCREEN)
      ========================================================================= */}
      {viewMode === 'landing' && (
        <main className="min-h-screen max-w-md mx-auto px-4 py-6 sm:py-10 flex flex-col justify-between">
          <div className="space-y-4 animate-fade-in">
            {/* Hero Branded Card */}
            {heroBannerUrl ? (
              <article className="rounded-3xl overflow-hidden shadow-lifted border border-[var(--dishora-border)] bg-[var(--dishora-surface)]">
                <img
                  src={heroBannerUrl}
                  alt={`${restaurant.displayName} banner`}
                  width={800}
                  height={400}
                  fetchPriority="high"
                  decoding="async"
                  onError={() => setBannerError(true)}
                  className="w-full aspect-[2/1] object-cover block bg-black/5"
                />
                <header className="p-5 sm:p-6 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] font-serif font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
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
                        <TableRemainingBadge expiresAt={tableInfo.expiresAt} />
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
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] shadow-xs"
                      >
                        <ShoppingBag className="w-3 h-3" /> {itemCount} in Cart
                      </button>
                    )}
                  </div>
                </header>
              </article>
            ) : (
              <article
                className="relative rounded-3xl overflow-hidden shadow-lifted border border-[var(--dishora-border)] p-5 sm:p-6 flex flex-col justify-end"
                style={{
                  background: `linear-gradient(135deg, ${theme?.accentColor || '#B86D52'}20 0%, ${theme?.surfaceColor || '#FFFFFF'} 100%)`,
                  backgroundColor: 'var(--dishora-surface)',
                }}
              >
                {heroLogoUrl && (
                  <div className="flex justify-end mb-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/5 border border-[var(--dishora-border)] shadow-md">
                      <img
                        src={heroLogoUrl}
                        alt={restaurant.displayName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={() => setLogoError(true)}
                      />
                    </div>
                  </div>
                )}

                <header className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] font-serif font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
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
                        <TableRemainingBadge expiresAt={tableInfo.expiresAt} />
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
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] shadow-xs"
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
                    {expiredTimeoutKind === 'ORDER_EXTENSION'
                      ? `Your ${effectiveExpiredTimeoutMinutes}-min post-order window ended${
                          expiredTableName ? ` (${expiredTableName})` : ''
                        }. Rescan QR to order.`
                      : `No order placed in the last ${effectiveExpiredTimeoutMinutes} min${
                          expiredTableName ? ` (${expiredTableName})` : ''
                        }. Rescan QR to order.`}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--dishora-accent)]/15 text-[var(--dishora-accent)] border border-[var(--dishora-accent)]/30 text-[11px] font-bold hover:bg-[var(--dishora-accent)] hover:text-[var(--dishora-accent-fg,#FFFFFF)] transition-all shadow-2xs"
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
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] text-[10px] font-bold flex items-center justify-center font-mono shadow">
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
                        <TableRemainingBadge expiresAt={tableInfo.expiresAt} />
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
                          ? 'bg-[var(--dishora-accent)] border-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] shadow-xs'
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
                    ? 'bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] shadow-sm'
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
                      ? 'bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] shadow-sm'
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
                <h3 className="font-serif text-lg text-[var(--dishora-text)] mb-1">
                  No dishes match your search
                </h3>
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
                {filteredDishes.map((item, index) => (
                  <DishCard
                    key={item.id}
                    item={item}
                    layoutMode={layoutMode}
                    onSelect={handleOpenDetail}
                    priority={index < 2}
                    eager={index < 4}
                    deferRender={index >= 6}
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
                  <div className="w-7 h-7 rounded-full bg-[var(--dishora-accent)] text-[var(--dishora-accent-fg,#FFFFFF)] font-mono text-xs font-bold flex items-center justify-center">
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
                  className="py-2 px-4 rounded-full bg-[var(--dishora-accent)] hover:opacity-95 text-[var(--dishora-accent-fg,#FFFFFF)] font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
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

      {/* Lazy Modals / Bottom Sheets */}
      {isDetailOpen && (
        <DishDetailSheet
          item={selectedDish}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onAskAboutDish={handleAskAboutDish}
        />
      )}

      {isChatOpen && (
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
          onMenuPaused={markMenuPaused}
        />
      )}

      {isCartOpen && (
        <CartSheet
          restaurantId={restaurant.id}
          restaurantName={restaurant.displayName}
          currency={restaurant.currency}
          sessionId={sessionId}
          sessionToken={sessionToken}
          defaultTimeoutMinutes={configuredScanTimeoutMinutes}
          onOrderPlaced={handleOrderPlaced}
          onRequestRescan={(reason) => {
            setIsCartOpen(false);
            openRescanPrompt(reason);
          }}
          onMenuPaused={markMenuPaused}
        />
      )}

      {isOrderConfirmationOpen && (
        <OrderConfirmationSheet
          order={placedOrder}
          isOpen={isOrderConfirmationOpen}
          onClose={() => setIsOrderConfirmationOpen(false)}
          onAddMoreItems={() => {
            setIsOrderConfirmationOpen(false);
          }}
        />
      )}

      {wifiConfig && isWifiOpen && (
        <WifiConnectModal
          isOpen={isWifiOpen}
          onClose={() => setIsWifiOpen(false)}
          restaurantName={restaurant.displayName}
          wifi={wifiConfig}
        />
      )}

      {isGamesOpen && (
        <DinerGamesModal
          isOpen={isGamesOpen}
          onClose={() => setIsGamesOpen(false)}
          restaurantName={restaurant.displayName}
        />
      )}

      {isCallWaiterOpen && (
        <CallWaiterModal
          isOpen={isCallWaiterOpen}
          onClose={() => setIsCallWaiterOpen(false)}
          restaurantId={restaurant.id}
          tableName={tableInfo?.tableName}
          tableId={tableInfo?.tableId}
          sessionId={sessionId}
          sessionToken={sessionToken}
          tableExpiresAt={tableInfo?.expiresAt}
          timeoutMinutes={tableInfo?.timeoutMinutes ?? configuredScanTimeoutMinutes}
          timeoutKind={tableInfo?.timeoutKind ?? 'SCAN'}
          isSessionExpired={tableSessionExpired}
          expiredTableName={expiredTableName}
          expiredTimeoutMinutes={effectiveExpiredTimeoutMinutes}
          expiredTimeoutKind={expiredTimeoutKind}
          onSessionExpired={expireTableSession}
          onSyncTable={setTableInfo}
          onRequestRescan={(reason) => {
            setIsCallWaiterOpen(false);
            openRescanPrompt(reason);
          }}
          onMenuPaused={markMenuPaused}
        />
      )}

      {isRescanOpen && (
        <RescanTableModal
          isOpen={isRescanOpen}
          onClose={() => setIsRescanOpen(false)}
          restaurantSlug={slug}
          restaurantName={restaurant.displayName}
          reason={rescanReason}
          expiredTableName={expiredTableName}
          timeoutMinutes={effectiveExpiredTimeoutMinutes}
          timeoutKind={expiredTimeoutKind}
        />
      )}
    </div>
  );
}
