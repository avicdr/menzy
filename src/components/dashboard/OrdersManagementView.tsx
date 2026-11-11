'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Utensils,
  ChevronRight,
  Save,
  Check,
  X,
  Eye,
  Calendar,
  Layers,
  Wifi,
  Bell,
  MapPin,
  Sparkles,
  Building2,
  Star,
  Users,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import {
  DEFAULT_ORDER_EXTENSION_MINUTES,
  DEFAULT_SCAN_TIMEOUT_MINUTES,
  extractTableSessionConfig,
  MAX_TABLE_SESSION_MINUTES,
  MIN_TABLE_SESSION_MINUTES,
  normalizeTableSessionConfigInput,
} from '@/lib/diner/table-session-config';
import {
  DEFAULT_SERVICE_CHARGE_PERCENTAGE,
  DEFAULT_TAX_PERCENTAGE,
  MAX_SERVICE_CHARGE_PERCENTAGE,
  MAX_TAX_PERCENTAGE,
  MIN_SERVICE_CHARGE_PERCENTAGE,
  MIN_TAX_PERCENTAGE,
  normalizeServiceChargeInput,
  normalizeTaxPercentageInput,
  resolveServiceChargePercentageValue,
  resolveTaxPercentageValue,
} from '@/lib/orders/tax-config';
import dynamic from 'next/dynamic';
import { Modal } from '@/components/ui/Modal';
import {
  SESSION_CACHE_TTLS,
  cacheKeys,
  clearAllDashboardSessionCaches,
  dedupeClientRequest,
  invalidateRestaurantSessionCache,
  isCacheFresh,
  readSessionCache,
  syncCachedTablesActiveOrderCounts,
  writeSessionCache,
} from '@/lib/cache/dashboard-session-cache';

const GooglePlacesModal = dynamic(
  () => import('./GooglePlacesModal').then((m) => m.GooglePlacesModal),
  { ssr: false }
);

const getOrderTableId = (order: any): string | null => order?.tableId || order?.table?.id || null;

interface CachedLiveOrdersPayload {
  orders: any[];
  calls: any[];
}

interface CachedOrderingSettingsPayload {
  orderingSettings: {
    orderingEnabled: boolean;
    acceptsNewOrders: boolean;
    allowSpecialInstructions: boolean;
    paymentMode: string;
    taxPercentage: number;
    serviceChargePercentage: number;
    maxActiveOrders: number;
    wifiEnabled: boolean;
    wifiSsid: string;
    wifiPassword: string;
    wifiSecurity: string;
  };
  tableSessionTimers: {
    scanTimeoutMinutes: string;
    orderExtensionMinutes: string;
  };
  taxInputs: {
    taxPercentage: string;
    serviceChargePercentage: string;
  };
  googleReviewUrl: string;
}

const DEFAULT_ORDERING_SETTINGS_STATE: CachedOrderingSettingsPayload['orderingSettings'] = {
  orderingEnabled: true,
  acceptsNewOrders: true,
  allowSpecialInstructions: true,
  paymentMode: 'PAY_AT_COUNTER',
  taxPercentage: 5.0,
  serviceChargePercentage: 0.0,
  maxActiveOrders: 50,
  wifiEnabled: false,
  wifiSsid: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
};

interface OrdersManagementViewProps {
  restaurant: any;
  initialSubTab?: 'live' | 'history' | 'analytics' | 'settings';
  onSubscriptionExpired?: (payload: any) => void;
  onTaxSettingsUpdated?: (taxPercentage: number, serviceChargePercentage: number) => void;
}

export function OrdersManagementView({
  restaurant,
  initialSubTab = 'live',
  onSubscriptionExpired,
  onTaxSettingsUpdated,
}: OrdersManagementViewProps) {
  const initialLiveEntry = restaurant?.id
    ? readSessionCache<CachedLiveOrdersPayload>(
        cacheKeys.ordersLive(restaurant.id),
        SESSION_CACHE_TTLS.ORDERS_LIVE_MAX_MS
      )
    : null;
  const initialTablesEntry = restaurant?.id
    ? readSessionCache<any[]>(cacheKeys.tables(restaurant.id), SESSION_CACHE_TTLS.TABLES_MAX_MS)
    : null;
  const initialAnalyticsEntry = restaurant?.id
    ? readSessionCache<any>(
        cacheKeys.ordersAnalytics(restaurant.id),
        SESSION_CACHE_TTLS.ORDERS_ANALYTICS_MAX_MS
      )
    : null;
  const initialSettingsEntry = restaurant?.id
    ? readSessionCache<CachedOrderingSettingsPayload>(
        cacheKeys.orderingSettings(restaurant.id),
        SESSION_CACHE_TTLS.TABLES_MAX_MS
      )
    : null;

  const [activeSubTab, setActiveSubTab] = useState<'live' | 'history' | 'analytics' | 'settings'>(
    initialSubTab
  );
  const [loading, setLoading] = useState<boolean>(() =>
    initialSubTab === 'live' ? !initialLiveEntry : false
  );
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Live Orders & Live Floor State
  const [liveOrders, setLiveOrders] = useState<any[]>(() => initialLiveEntry?.data?.orders ?? []);
  const [liveOrdersLoaded, setLiveOrdersLoaded] = useState<boolean>(() => Boolean(initialLiveEntry));
  const [tables, setTables] = useState<any[]>(() => initialTablesEntry?.data ?? []);
  const [serviceCalls, setServiceCalls] = useState<any[]>(
    () => initialLiveEntry?.data?.calls ?? []
  );
  const [selectedTableFilter, setSelectedTableFilter] = useState<string | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Record<string, string>>({});
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);
  const [subscriptionPaused, setSubscriptionPaused] = useState(false);
  const inFlightMutationsRef = useRef<Map<string, number>>(new Map());
  const recentlyUpdatedRef = useRef<Map<string, { status: string; expiresAt: number }>>(new Map());
  const mutationSeqRef = useRef(0);
  const inFlightPollRef = useRef(false);
  const tablesLoadedRef = useRef(Boolean(initialTablesEntry));
  const loadedRestaurantIdRef = useRef<string | null>(restaurant?.id ?? null);
  const liveOrdersRef = useRef<any[]>(liveOrders);
  liveOrdersRef.current = liveOrders;
  const serviceCallsRef = useRef<any[]>(serviceCalls);
  serviceCallsRef.current = serviceCalls;

  // History Orders
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any | null>(
    () => initialAnalyticsEntry?.data ?? null
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Ordering Settings Form (includes Table QR Session Timers, Free Wi-Fi & Google Review URL)
  const [orderingSettings, setOrderingSettings] = useState(
    () => initialSettingsEntry?.data?.orderingSettings ?? DEFAULT_ORDERING_SETTINGS_STATE
  );
  const [tableSessionTimers, setTableSessionTimers] = useState(
    () =>
      initialSettingsEntry?.data?.tableSessionTimers ?? {
        scanTimeoutMinutes: String(DEFAULT_SCAN_TIMEOUT_MINUTES),
        orderExtensionMinutes: String(DEFAULT_ORDER_EXTENSION_MINUTES),
      }
  );
  const [taxInputs, setTaxInputs] = useState(
    () =>
      initialSettingsEntry?.data?.taxInputs ?? {
        taxPercentage: String(DEFAULT_TAX_PERCENTAGE),
        serviceChargePercentage: String(DEFAULT_SERVICE_CHARGE_PERCENTAGE),
      }
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    () => initialSettingsEntry?.data?.googleReviewUrl ?? (restaurant?.googleReviewUrl || '')
  );
  const [isPlacesModalOpen, setIsPlacesModalOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Keep local state synchronized with sessionStorage if the owner switches restaurants
  useEffect(() => {
    const targetRestaurantId = restaurant?.id;
    if (!targetRestaurantId) return;

    if (loadedRestaurantIdRef.current && loadedRestaurantIdRef.current !== targetRestaurantId) {
      setSelectedTableFilter(null);
      setSelectedOrderForDetail(null);
      setHistoryOrders([]);
      setHistoryStatusFilter('ALL');
      setHistorySearch('');
      setError(null);
      setAnalyticsError(null);
    }
    loadedRestaurantIdRef.current = targetRestaurantId;

    const cachedLive = readSessionCache<CachedLiveOrdersPayload>(
      cacheKeys.ordersLive(targetRestaurantId),
      SESSION_CACHE_TTLS.ORDERS_LIVE_MAX_MS
    );
    if (cachedLive) {
      setLiveOrders(cachedLive.data?.orders ?? []);
      setServiceCalls(cachedLive.data?.calls ?? []);
      setLiveOrdersLoaded(true);
      if (activeSubTab === 'live') setLoading(false);
    } else if (activeSubTab === 'live') {
      setLiveOrders([]);
      setServiceCalls([]);
      setLiveOrdersLoaded(false);
    }

    const cachedTables = readSessionCache<any[]>(
      cacheKeys.tables(targetRestaurantId),
      SESSION_CACHE_TTLS.TABLES_MAX_MS
    );
    if (cachedTables) {
      setTables(cachedTables.data || []);
      tablesLoadedRef.current = true;
    } else {
      setTables([]);
      tablesLoadedRef.current = false;
    }

    const cachedAnalytics = readSessionCache<any>(
      cacheKeys.ordersAnalytics(targetRestaurantId),
      SESSION_CACHE_TTLS.ORDERS_ANALYTICS_MAX_MS
    );
    setAnalyticsData(cachedAnalytics?.data ?? null);

    const cachedOrdSettings = readSessionCache<CachedOrderingSettingsPayload>(
      cacheKeys.orderingSettings(targetRestaurantId),
      SESSION_CACHE_TTLS.TABLES_MAX_MS
    );
    if (cachedOrdSettings?.data) {
      setOrderingSettings(cachedOrdSettings.data.orderingSettings);
      setTableSessionTimers(cachedOrdSettings.data.tableSessionTimers);
      setTaxInputs(cachedOrdSettings.data.taxInputs);
      setGoogleReviewUrl(cachedOrdSettings.data.googleReviewUrl);
    } else {
      setOrderingSettings(DEFAULT_ORDERING_SETTINGS_STATE);
      setTableSessionTimers({
        scanTimeoutMinutes: String(DEFAULT_SCAN_TIMEOUT_MINUTES),
        orderExtensionMinutes: String(DEFAULT_ORDER_EXTENSION_MINUTES),
      });
      setTaxInputs({
        taxPercentage: String(DEFAULT_TAX_PERCENTAGE),
        serviceChargePercentage: String(DEFAULT_SERVICE_CHARGE_PERCENTAGE),
      });
      setGoogleReviewUrl(restaurant?.googleReviewUrl || '');
    }
  }, [restaurant?.id]);

  // 1. Load Live Orders + Service Calls (+ Tables if not already cached/loaded) in 1 single fast request
  const loadLiveOrders = async (silent = false, options?: { force?: boolean }) => {
    const targetRestaurantId = restaurant?.id;
    if (!targetRestaurantId) return;
    if (silent && inFlightPollRef.current) return;

    const cachedTables = readSessionCache<any[]>(
      cacheKeys.tables(targetRestaurantId),
      SESSION_CACHE_TTLS.TABLES_MAX_MS
    );
    if (cachedTables && !tablesLoadedRef.current) {
      setTables(cachedTables.data || []);
      tablesLoadedRef.current = true;
    }

    const shouldFetchTables = Boolean(options?.force) || (!cachedTables && !tablesLoadedRef.current);
    const hasLocalLive = liveOrdersLoaded || liveOrdersRef.current.length > 0;
    const isSilentMode = silent || hasLocalLive;

    inFlightPollRef.current = true;
    const fetchStartedAt = Date.now();
    try {
      if (isSilentMode) {
        if (options?.force || !silent) setRefreshingLive(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = `/api/restaurants/${targetRestaurantId}/orders?limit=50&includeCalls=1&includeTheme=0${
        shouldFetchTables ? '&includeTables=1' : ''
      }`;
      const result = await dedupeClientRequest(
        `ordersLive:${targetRestaurantId}:${shouldFetchTables ? 't' : '0'}`,
        async () => {
          const res = await fetch(url);
          if (res.status === 402) {
            const payload = await res.json().catch(() => ({}));
            clearAllDashboardSessionCaches();
            return { expired: true as const, payload };
          }
          if (res.status === 401 || res.status === 403) {
            clearAllDashboardSessionCaches();
          }
          if (!res.ok) throw new Error('Failed to load live orders');
          const data = await res.json();
          return { expired: false as const, data };
        }
      );

      if (result.expired) {
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(result.payload);
        return;
      }

      const ordersData = result.data;
      const fetchedOrders: any[] = ordersData.orders || [];
      const nextCalls: any[] = Array.isArray(ordersData.calls)
        ? ordersData.calls
        : serviceCallsRef.current;

      const prevOrders = liveOrdersRef.current;
      const now = Date.now();
      const prevById = new Map(prevOrders.map((o) => [o.id, o]));
      const handledIds = new Set<string>();
      const merged: any[] = [];

      for (const serverOrder of fetchedOrders) {
        handledIds.add(serverOrder.id);
        const inFlight = inFlightMutationsRef.current.has(serverOrder.id);
        const recent = recentlyUpdatedRef.current.get(serverOrder.id);
        const localOrder = prevById.get(serverOrder.id);

        if (inFlight) {
          if (localOrder) merged.push(localOrder);
          continue;
        }
        if (recent && recent.expiresAt > now) {
          if (recent.status === 'REJECTED' || recent.status === 'CANCELLED') {
            continue;
          }
          if (localOrder && serverOrder.status !== recent.status) {
            merged.push(localOrder);
            continue;
          }
        }
        merged.push(serverOrder);
      }

      for (const localOrder of prevOrders) {
        if (handledIds.has(localOrder.id)) continue;
        const inFlight = inFlightMutationsRef.current.has(localOrder.id);
        const recent = recentlyUpdatedRef.current.get(localOrder.id);
        if (inFlight || (recent && recent.expiresAt > now && recent.expiresAt > fetchStartedAt)) {
          if (!['REJECTED', 'CANCELLED'].includes(localOrder.status)) {
            merged.unshift(localOrder);
          }
        }
      }

      if (restaurant?.id !== targetRestaurantId) return;

      liveOrdersRef.current = merged;
      setLiveOrders(merged);
      setLiveOrdersLoaded(true);

      if (Array.isArray(ordersData.calls)) {
        serviceCallsRef.current = nextCalls;
        setServiceCalls(nextCalls);
      }

      writeSessionCache(cacheKeys.ordersLive(targetRestaurantId), {
        orders: merged,
        calls: nextCalls,
      });

      if (Array.isArray(ordersData.tables)) {
        setTables(ordersData.tables);
        tablesLoadedRef.current = true;
        writeSessionCache(cacheKeys.tables(targetRestaurantId), ordersData.tables);
      }

      syncCachedTablesActiveOrderCounts(targetRestaurantId, merged);
    } catch (err: any) {
      if (!isSilentMode) setError(err.message || 'Error loading live orders');
    } finally {
      inFlightPollRef.current = false;
      setLoading(false);
      setRefreshingLive(false);
    }
  };

  // 2. Load Order History
  const loadHistoryOrders = async (
    page = 1,
    options?: { force?: boolean; status?: string; search?: string }
  ) => {
    const targetRestaurantId = restaurant?.id;
    if (!targetRestaurantId) return;

    const statusValue = options?.status ?? historyStatusFilter;
    const searchValue = (options?.search ?? historySearch).trim();
    const queryKey = `${page}:${statusValue}:${searchValue}`;
    const cacheKey = cacheKeys.ordersHistory(targetRestaurantId, queryKey);

    const cached = options?.force
      ? null
      : readSessionCache<{ orders: any[]; pagination: any }>(
          cacheKey,
          SESSION_CACHE_TTLS.ORDERS_HISTORY_MAX_MS
        );

    if (cached?.data) {
      setHistoryOrders(cached.data.orders || []);
      setHistoryPagination(cached.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      setLoading(false);
      if (isCacheFresh(cached, SESSION_CACHE_TTLS.ORDERS_HISTORY_FRESH_MS)) {
        return;
      }
    }

    const silentRevalidate = Boolean(cached?.data);
    try {
      if (!silentRevalidate) setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (statusValue !== 'ALL') params.set('status', statusValue);
      if (searchValue) params.set('search', searchValue);

      const result = await dedupeClientRequest(cacheKey, async () => {
        const res = await fetch(`/api/restaurants/${targetRestaurantId}/orders/history?${params.toString()}`);
        if (res.status === 402) {
          const payload = await res.json().catch(() => ({}));
          clearAllDashboardSessionCaches();
          return { expired: true as const, payload };
        }
        if (res.status === 401 || res.status === 403) {
          clearAllDashboardSessionCaches();
        }
        if (!res.ok) throw new Error('Failed to load order history');
        const data = await res.json();
        const payload = {
          orders: data.orders || [],
          pagination: data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 },
        };
        writeSessionCache(cacheKey, payload);
        return { expired: false as const, payload };
      });

      if (result.expired) {
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(result.payload);
        return;
      }

      if (restaurant?.id === targetRestaurantId) {
        setHistoryOrders(result.payload.orders);
        setHistoryPagination(result.payload.pagination);
      }
    } catch (err: any) {
      if (!silentRevalidate) {
        setError(err.message || 'Error loading history');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Load Order Analytics
  const loadAnalytics = async (options?: { force?: boolean }) => {
    const targetRestaurantId = restaurant?.id;
    if (!targetRestaurantId) return;

    const cacheKey = cacheKeys.ordersAnalytics(targetRestaurantId);
    const cached = options?.force
      ? null
      : readSessionCache<any>(cacheKey, SESSION_CACHE_TTLS.ORDERS_ANALYTICS_MAX_MS);

    if (cached?.data) {
      setAnalyticsData(cached.data);
      if (isCacheFresh(cached, SESSION_CACHE_TTLS.ORDERS_ANALYTICS_FRESH_MS)) {
        return;
      }
    }

    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const result = await dedupeClientRequest(cacheKey, async () => {
        const res = await fetch(`/api/restaurants/${targetRestaurantId}/orders/analytics`);
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          clearAllDashboardSessionCaches();
          return { expired: true as const, payload: data };
        }
        if (res.status === 401 || res.status === 403) {
          clearAllDashboardSessionCaches();
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load order analytics');
        writeSessionCache(cacheKey, data);
        return { expired: false as const, data };
      });

      if (result.expired) {
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(result.payload);
        return;
      }

      if (restaurant?.id === targetRestaurantId) {
        setAnalyticsData(result.data);
      }
    } catch (err: any) {
      console.error(err);
      if (!cached?.data) {
        setAnalyticsError(err.message || 'Unable to load order analytics right now.');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // 4. Load Ordering Settings & Restaurant Profile Settings
  const loadSettings = async (options?: { force?: boolean }) => {
    const targetRestaurantId = restaurant?.id;
    if (!targetRestaurantId) return;

    const cacheKey = cacheKeys.orderingSettings(targetRestaurantId);
    const cached = options?.force
      ? null
      : readSessionCache<CachedOrderingSettingsPayload>(cacheKey, SESSION_CACHE_TTLS.TABLES_MAX_MS);

    if (cached?.data) {
      setOrderingSettings(cached.data.orderingSettings);
      setTableSessionTimers(cached.data.tableSessionTimers);
      setTaxInputs(cached.data.taxInputs);
      setGoogleReviewUrl(cached.data.googleReviewUrl);
      if (isCacheFresh(cached, SESSION_CACHE_TTLS.SETTINGS_FRESH_MS)) {
        return;
      }
    }

    try {
      const result = await dedupeClientRequest(cacheKey, async () => {
        const [ordRes, restRes] = await Promise.all([
          fetch(`/api/restaurants/${targetRestaurantId}/ordering-settings`),
          fetch(`/api/restaurant/settings?restaurantId=${targetRestaurantId}`),
        ]);
        if (ordRes.status === 402 || restRes.status === 402) {
          const pausedRes = ordRes.status === 402 ? ordRes : restRes;
          const payload = await pausedRes.json().catch(() => ({}));
          clearAllDashboardSessionCaches();
          return { expired: true as const, payload };
        }
        if (
          ordRes.status === 401 ||
          ordRes.status === 403 ||
          restRes.status === 401 ||
          restRes.status === 403
        ) {
          clearAllDashboardSessionCaches();
        }
        const ordData = ordRes.ok ? await ordRes.json() : null;
        const restData = restRes.ok ? await restRes.json() : null;
        return { expired: false as const, ordData, restData };
      });

      if (result.expired) {
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(result.payload);
        return;
      }

      if (restaurant?.id !== targetRestaurantId) return;

      let nextOrdering = orderingSettings;
      let nextTimers = tableSessionTimers;
      let nextTaxInputs = taxInputs;
      let nextReviewUrl = googleReviewUrl;

      if (result.ordData?.settings) {
        const s = result.ordData.settings;
        const wifi = s.notificationSettings?.wifi || {};
        const tableSession =
          result.ordData.tableSession ?? extractTableSessionConfig(s.notificationSettings);
        const resolvedTax = resolveTaxPercentageValue(s.taxPercentage);
        const resolvedServiceCharge = resolveServiceChargePercentageValue(s.serviceChargePercentage);

        nextOrdering = {
          orderingEnabled: s.orderingEnabled ?? true,
          acceptsNewOrders: s.acceptsNewOrders ?? true,
          allowSpecialInstructions: s.allowSpecialInstructions ?? true,
          paymentMode: s.paymentMode ?? 'PAY_AT_COUNTER',
          taxPercentage: resolvedTax,
          serviceChargePercentage: resolvedServiceCharge,
          maxActiveOrders: Number(s.maxActiveOrders) || 50,
          wifiEnabled: Boolean(wifi.enabled),
          wifiSsid: wifi.ssid || '',
          wifiPassword: wifi.password || '',
          wifiSecurity: wifi.security || 'WPA',
        };
        nextTaxInputs = {
          taxPercentage: String(resolvedTax),
          serviceChargePercentage: String(resolvedServiceCharge),
        };
        nextTimers = {
          scanTimeoutMinutes: String(tableSession.scanTimeoutMinutes),
          orderExtensionMinutes: String(tableSession.orderExtensionMinutes),
        };

        setOrderingSettings(nextOrdering);
        setTaxInputs(nextTaxInputs);
        setTableSessionTimers(nextTimers);
        onTaxSettingsUpdated?.(resolvedTax, resolvedServiceCharge);
      }

      if (result.restData?.restaurant?.googleReviewUrl !== undefined) {
        nextReviewUrl = result.restData.restaurant.googleReviewUrl || '';
        setGoogleReviewUrl(nextReviewUrl);
      }

      if (result.ordData?.settings || result.restData?.restaurant) {
        writeSessionCache(cacheKey, {
          orderingSettings: nextOrdering,
          tableSessionTimers: nextTimers,
          taxInputs: nextTaxInputs,
          googleReviewUrl: nextReviewUrl,
        });
      }
    } catch (err) {
      console.error('Failed to load ordering settings', err);
    }
  };

  useEffect(() => {
    if (restaurant?.id && !subscriptionPaused) {
      if (activeSubTab === 'live') {
        loadLiveOrders(liveOrdersLoaded || liveOrdersRef.current.length > 0);
        const interval = setInterval(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            return;
          }
          loadLiveOrders(true);
        }, 8000);
        const handleVisibilityChange = () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            loadLiveOrders(true);
          }
        };
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        return () => {
          clearInterval(interval);
          if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
      }
      if (activeSubTab === 'history') loadHistoryOrders(1);
      if (activeSubTab === 'analytics') loadAnalytics();
      if (activeSubTab === 'settings') loadSettings();
    }
  }, [restaurant?.id, activeSubTab, subscriptionPaused]);

  const handleResolveCall = async (callId: string) => {
    try {
      setResolvingCallId(callId);
      const res = await fetch(`/api/restaurants/${restaurant.id}/service-calls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        clearAllDashboardSessionCaches();
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        const nextCalls = serviceCallsRef.current.filter((c) => c.id !== callId);
        serviceCallsRef.current = nextCalls;
        setServiceCalls(nextCalls);
        writeSessionCache(cacheKeys.ordersLive(restaurant.id), {
          orders: liveOrdersRef.current,
          calls: nextCalls,
        });
        showNotification('Service call marked as attended.');
      }
    } catch (err) {
      console.error('Failed to resolve call:', err);
    } finally {
      setResolvingCallId(null);
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    if (inFlightMutationsRef.current.has(orderId)) return;

    const existingOrder = liveOrders.find((o) => o.id === orderId);
    if (!existingOrder) return;

    const seq = ++mutationSeqRef.current;
    inFlightMutationsRef.current.set(orderId, seq);
    setError(null);
    setUpdatingOrders((prev) => ({ ...prev, [orderId]: nextStatus }));

    const nowIso = new Date().toISOString();
    const isRejectedOrCancelled = nextStatus === 'REJECTED' || nextStatus === 'CANCELLED';

    const applyOptimistic = (prev: any[]) => {
      if (isRejectedOrCancelled) {
        return prev.filter((o) => o.id !== orderId);
      }
      return prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
              updatedAt: nowIso,
              ...(nextStatus === 'ACCEPTED' ? { acceptedAt: nowIso } : {}),
              ...(nextStatus === 'PREPARING' ? { preparingAt: nowIso } : {}),
              ...(nextStatus === 'READY' ? { readyAt: nowIso } : {}),
              ...(nextStatus === 'SERVED' ? { servedAt: nowIso } : {}),
              ...(nextStatus === 'COMPLETED' ? { completedAt: nowIso } : {}),
            }
          : o
      );
    };

    // Immediate optimistic transition for crisp zero-lag feel
    const optimisticOrders = applyOptimistic(liveOrdersRef.current);
    liveOrdersRef.current = optimisticOrders;
    setLiveOrders(optimisticOrders);

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        clearAllDashboardSessionCaches();
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(data);
        throw new Error(data.error || 'Subscription required');
      }
      if (!res.ok) throw new Error(data.error || 'Status update failed');

      recentlyUpdatedRef.current.set(orderId, {
        status: nextStatus,
        expiresAt: Date.now() + 5000,
      });

      const serverOrder = data.order;
      let finalOrders = liveOrdersRef.current;
      if (serverOrder && !isRejectedOrCancelled) {
        finalOrders = liveOrdersRef.current.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: serverOrder.status,
                acceptedAt: serverOrder.acceptedAt ?? o.acceptedAt,
                preparingAt: serverOrder.preparingAt ?? o.preparingAt,
                readyAt: serverOrder.readyAt ?? o.readyAt,
                servedAt: serverOrder.servedAt ?? o.servedAt,
                completedAt: serverOrder.completedAt ?? o.completedAt,
                updatedAt: serverOrder.updatedAt ?? o.updatedAt,
              }
            : o
        );
        liveOrdersRef.current = finalOrders;
        setLiveOrders(finalOrders);
      }

      writeSessionCache(cacheKeys.ordersLive(restaurant.id), {
        orders: finalOrders,
        calls: serviceCallsRef.current,
      });
      syncCachedTablesActiveOrderCounts(restaurant.id, finalOrders);
      invalidateRestaurantSessionCache(restaurant.id, ['ordersHistory', 'ordersAnalytics']);

      showNotification(`Order status updated to ${nextStatus}.`);
    } catch (err: any) {
      // Rollback optimistic transition on error
      const rolledBack = liveOrdersRef.current.some((o) => o.id === orderId)
        ? liveOrdersRef.current.map((o) => (o.id === orderId ? existingOrder : o))
        : [existingOrder, ...liveOrdersRef.current].sort(
            (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
          );
      liveOrdersRef.current = rolledBack;
      setLiveOrders(rolledBack);
      setError(err.message || 'Failed to update order');
    } finally {
      if (inFlightMutationsRef.current.get(orderId) === seq) {
        inFlightMutationsRef.current.delete(orderId);
      }
      setUpdatingOrders((prev) => {
        if (!(orderId in prev)) return prev;
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderingSettings.wifiEnabled && !orderingSettings.wifiSsid.trim()) {
      setError('Please enter your Wi-Fi Network Name (SSID) or disable Guest Free Wi-Fi.');
      return;
    }

    const parsedTimers = normalizeTableSessionConfigInput({
      scanTimeoutMinutes: tableSessionTimers.scanTimeoutMinutes.trim(),
      orderExtensionMinutes: tableSessionTimers.orderExtensionMinutes.trim(),
    });
    if (!parsedTimers.ok) {
      setError(parsedTimers.error);
      return;
    }

    const parsedTax = normalizeTaxPercentageInput(taxInputs.taxPercentage.trim());
    if (!parsedTax.ok) {
      setError(parsedTax.error);
      return;
    }

    const parsedServiceCharge = normalizeServiceChargeInput(
      taxInputs.serviceChargePercentage.trim()
    );
    if (!parsedServiceCharge.ok) {
      setError(parsedServiceCharge.error);
      return;
    }

    try {
      setIsSavingSettings(true);
      setError(null);

      // Save Ordering Settings + Table QR Timers + Wi-Fi
      const res = await fetch(`/api/restaurants/${restaurant.id}/ordering-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderingSettings,
          taxPercentage: parsedTax.taxPercentage,
          serviceChargePercentage: parsedServiceCharge.serviceChargePercentage,
          tableSession: parsedTimers.tableSession,
          wifi: {
            enabled: orderingSettings.wifiEnabled,
            ssid: orderingSettings.wifiSsid.trim(),
            password: orderingSettings.wifiSecurity === 'nopass' ? '' : orderingSettings.wifiPassword,
            security: orderingSettings.wifiSecurity,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        clearAllDashboardSessionCaches();
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(data);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      const savedTax = resolveTaxPercentageValue(
        data.settings?.taxPercentage,
        parsedTax.taxPercentage
      );
      const savedServiceCharge = resolveServiceChargePercentageValue(
        data.settings?.serviceChargePercentage,
        parsedServiceCharge.serviceChargePercentage
      );
      const nextOrderingState = {
        ...orderingSettings,
        taxPercentage: savedTax,
        serviceChargePercentage: savedServiceCharge,
      };
      const nextTaxState = {
        taxPercentage: String(savedTax),
        serviceChargePercentage: String(savedServiceCharge),
      };
      const nextTimersState = data.tableSession
        ? {
            scanTimeoutMinutes: String(data.tableSession.scanTimeoutMinutes),
            orderExtensionMinutes: String(data.tableSession.orderExtensionMinutes),
          }
        : tableSessionTimers;

      setOrderingSettings(nextOrderingState);
      setTaxInputs(nextTaxState);
      if (data.tableSession) {
        setTableSessionTimers(nextTimersState);
      }
      onTaxSettingsUpdated?.(savedTax, savedServiceCharge);

      // Also save Google Review URL if updated
      const restSettingsRes = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          googleReviewUrl: googleReviewUrl.trim(),
        }),
      });
      if (restSettingsRes.status === 402) {
        const restPayload = await restSettingsRes.json().catch(() => ({}));
        clearAllDashboardSessionCaches();
        setSubscriptionPaused(true);
        onSubscriptionExpired?.(restPayload);
        return;
      }

      writeSessionCache(cacheKeys.orderingSettings(restaurant.id), {
        orderingSettings: nextOrderingState,
        tableSessionTimers: nextTimersState,
        taxInputs: nextTaxState,
        googleReviewUrl: googleReviewUrl.trim(),
      });
      invalidateRestaurantSessionCache(restaurant.id, ['restaurantSettings', 'authMe']);

      showNotification('Ordering, table QR timer, Wi-Fi & Google Review configuration saved!');
    } catch (err: any) {
      setError(err.message || 'Error updating settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const formatPrice = (minor: number) => {
    return formatCurrencyMinor(minor, restaurant.currency || 'INR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            New Order
          </span>
        );
      case 'ACCEPTED':
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Accepted
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            In Preparation
          </span>
        );
      case 'READY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Ready on Pass
          </span>
        );
      case 'SERVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Served to Table
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cream-200 text-espresso-700 border border-cream-300">
            Completed
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cream-200 text-espresso-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center font-bold">
              <ChefHat className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-espresso-900">
              Live Orders & POS Management
            </h2>
          </div>
          <p className="text-sm text-taupe-500 max-w-2xl">
            Monitor real-time table orders, update kitchen preparation workflows, inspect historical tickets, and view telemetry on dining volumes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={`/api/restaurants/${restaurant.id}/orders/export`}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white hover:bg-cream-100 text-espresso-900 font-medium text-xs sm:text-sm transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-taupe-500" />
            Export CSV
          </a>
          <a
            href="/orders"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-cream-100 font-medium text-xs sm:text-sm transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-terracotta" />
            Open Dedicated Kitchen Terminal
          </a>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-cream-300 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('live')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'live'
              ? 'bg-espresso-900 text-cream-100 shadow-sm'
              : 'text-taupe-600 hover:bg-cream-200'
          }`}
        >
          Active Orders ({
            liveOrdersLoaded
              ? liveOrders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length
              : (analyticsData?.summary?.activeOrdersCount ?? 0)
          })
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'history'
              ? 'bg-espresso-900 text-cream-100 shadow-sm'
              : 'text-taupe-600 hover:bg-cream-200'
          }`}
        >
          Order History & Search
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'analytics'
              ? 'bg-espresso-900 text-cream-100 shadow-sm'
              : 'text-taupe-600 hover:bg-cream-200'
          }`}
        >
          Ordering Analytics
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'settings'
              ? 'bg-espresso-900 text-cream-100 shadow-sm'
              : 'text-taupe-600 hover:bg-cream-200'
          }`}
        >
          Ordering & Tax Settings
        </button>
      </div>

      {/* SUB-TAB 1: LIVE ORDERS & FLOOR METRICS */}
      {activeSubTab === 'live' && (() => {
        const activeOrdersList = liveOrders.filter((o) => !['CANCELLED', 'REJECTED', 'COMPLETED'].includes(o.status));
        const ongoingPrepCount = activeOrdersList.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
        const readyServeCount = activeOrdersList.filter((o) => o.status === 'READY').length;
        const activeTableIds = new Set([
          ...activeOrdersList.map((o) => getOrderTableId(o)).filter(Boolean),
          ...serviceCalls.map((c) => c.tableId),
        ]);
        const openCheckMinor = activeOrdersList.reduce((acc, o) => acc + (o.totalMinor || 0), 0);
        const filteredOrders = selectedTableFilter
          ? liveOrders.filter((o) => getOrderTableId(o) === selectedTableFilter)
          : liveOrders;

        return (
        <div className="space-y-6">
          {/* Live Operational Metrics HUD */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
              <div className="text-[11px] font-semibold text-taupe-500 uppercase tracking-wider flex items-center justify-between">
                <span>Active Tables</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-2xl font-serif font-bold text-espresso-900 mt-1">
                {activeTableIds.size} <span className="text-sm font-sans font-normal text-taupe-400">/ {tables.length}</span>
              </div>
              <div className="text-[11px] text-taupe-500 mt-0.5">
                {tables.length > 0 ? `${Math.round((activeTableIds.size / tables.length) * 100)}% floor occupancy` : 'No tables yet'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
              <div className="text-[11px] font-semibold text-taupe-500 uppercase tracking-wider flex items-center justify-between">
                <span>Ongoing Orders</span>
                <ChefHat className="w-4 h-4 text-terracotta" />
              </div>
              <div className="text-2xl font-serif font-bold text-terracotta mt-1">
                {ongoingPrepCount}
              </div>
              <div className="text-[11px] text-taupe-500 mt-0.5">
                {readyServeCount} ready on pass
              </div>
            </div>

            <div className={`rounded-2xl p-4 border shadow-sm transition-all ${serviceCalls.length > 0 ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400/50' : 'bg-white border-cream-200'}`}>
              <div className="text-[11px] font-semibold text-taupe-600 uppercase tracking-wider flex items-center justify-between">
                <span>Waiter Calls</span>
                <Bell className={`w-4 h-4 ${serviceCalls.length > 0 ? 'text-amber-600 animate-bounce' : 'text-taupe-400'}`} />
              </div>
              <div className={`text-2xl font-serif font-bold mt-1 ${serviceCalls.length > 0 ? 'text-amber-700' : 'text-espresso-900'}`}>
                {serviceCalls.length}
              </div>
              <div className="text-[11px] text-taupe-500 mt-0.5">
                {serviceCalls.length > 0 ? 'Tables requesting service' : 'All tables attended'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
              <div className="text-[11px] font-semibold text-taupe-500 uppercase tracking-wider flex items-center justify-between">
                <span>Open Checks Volume</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
                {formatPrice(openCheckMinor)}
              </div>
              <div className="text-[11px] text-taupe-500 mt-0.5">
                {activeOrdersList.length} active dining tickets
              </div>
            </div>
          </div>

          {/* Pending Waiter Calls Alert Strip */}
          {serviceCalls.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>Waiter Service Calls ({serviceCalls.length})</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {serviceCalls.map((call) => (
                  <div
                    key={call.id}
                    className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-espresso-900 flex items-center gap-1.5">
                        <span className="text-terracotta">{call.tableName}</span>
                        <span className="text-taupe-400">•</span>
                        <span>{call.callType}</span>
                      </div>
                      <div className="text-[11px] text-taupe-500 truncate">
                        {call.notes || 'Requested assistance'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveCall(call.id)}
                      disabled={resolvingCallId === call.id}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shrink-0 transition-colors disabled:opacity-60 inline-flex items-center gap-1"
                    >
                      {resolvingCallId === call.id && (
                        <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />
                      )}
                      {resolvingCallId === call.id ? 'Attending...' : 'Attended ✓'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Floor Status Map */}
          {tables.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-taupe-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-terracotta" />
                  <span>Live Floor Table Map</span>
                </div>
                {selectedTableFilter && (
                  <button
                    onClick={() => setSelectedTableFilter(null)}
                    className="text-xs font-semibold text-terracotta hover:underline"
                  >
                    Show All Tables
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                {tables.map((t) => {
                  const hasCall = serviceCalls.some((c) => c.tableId === t.id);
                  const tableOrders = activeOrdersList.filter((o) => getOrderTableId(o) === t.id);
                  const isActive = tableOrders.length > 0;
                  const isSelected = selectedTableFilter === t.id;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableFilter(isSelected ? null : t.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'ring-2 ring-terracotta border-terracotta bg-cream-50'
                          : hasCall
                          ? 'bg-rose-50 border-rose-300 shadow-xs'
                          : isActive
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-emerald-50/40 border-emerald-200/70 hover:bg-cream-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-espresso-900 truncate">
                          {t.name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            hasCall
                              ? 'bg-rose-500 animate-ping'
                              : isActive
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                      <div className="text-[10px] mt-1.5 font-medium text-taupe-600">
                        {hasCall
                          ? '🔔 Waiter Called!'
                          : isActive
                          ? `${tableOrders.length} Active Order${tableOrders.length > 1 ? 's' : ''}`
                          : `Free • ${t.capacity || 4} seats`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-taupe-600 font-medium">
              {selectedTableFilter ? 'Filtered table orders' : 'Real-time feed from dine-in tables'}
            </div>
            <button
              type="button"
              onClick={() => loadLiveOrders(true, { force: true })}
              disabled={loading || refreshingLive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cream-300 bg-white text-xs font-medium text-espresso-800 hover:bg-cream-100 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshingLive ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              {refreshingLive ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-taupe-500 border border-cream-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading live orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-cream-200 shadow-sm">
              <ChefHat className="w-12 h-12 text-taupe-400 mx-auto mb-3 opacity-60" />
              <h3 className="font-serif text-lg font-bold text-espresso-900 mb-1">
                {selectedTableFilter ? 'No active orders for this table' : 'No active orders at this moment'}
              </h3>
              <p className="text-sm text-taupe-500 max-w-md mx-auto mb-4">
                When diners scan table QR codes and submit their orders, tickets will immediately appear here and on the Kitchen Display System.
              </p>
              <a
                href={`/m/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-medium text-xs transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Preview Diner Menu
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const isSyncing = Boolean(updatingOrders[order.id]);
                return (
                <div
                  key={order.id}
                  aria-busy={isSyncing}
                  className="bg-white rounded-2xl border border-cream-300 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Order # and Status */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-cream-100">
                      <div>
                        <span className="font-serif text-lg font-bold text-espresso-900">
                          {order.orderNumber}
                        </span>
                        <div className="text-xs text-taupe-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.placedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSyncing && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin motion-reduce:animate-none" />
                            Syncing
                          </span>
                        )}
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Table & Diner Info */}
                    <div className="py-2.5 flex items-center justify-between text-xs text-espresso-800">
                      <div className="font-semibold bg-terracotta/10 text-terracotta px-2.5 py-1 rounded-md">
                        {order.table?.name || 'Unassigned Table'}
                        {order.table?.section ? ` (${order.table.section})` : ''}
                      </div>
                      <div className="text-taupe-500">
                        {order.customerName ? `Guest: ${order.customerName}` : 'Dine-in Guest'}
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="my-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {order.items?.map((item: any) => {
                        const variantLabel = item.variant ?? item.variantName;
                        const modifiersList = item.modifiers ?? item.selectedModifiers;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start justify-between text-xs py-1 border-b border-cream-50"
                          >
                            <div className="pr-2">
                              <span className="font-bold text-espresso-900 mr-1.5">
                                {item.quantity}x
                              </span>
                              <span className="text-espresso-800 font-medium">
                                {item.dishName ?? item.dishNameSnapshot}
                              </span>
                              {variantLabel && (
                                <span className="text-taupe-500 text-[11px] block">
                                  ({variantLabel})
                                </span>
                              )}
                              {Array.isArray(modifiersList) && modifiersList.length > 0 && (
                                <span className="text-taupe-400 text-[10px] block">
                                  + {modifiersList.map((m: any) => m.optionName ?? m.name).join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-espresso-800 shrink-0">
                              {formatPrice(item.lineTotalMinor ?? item.totalMinor ?? 0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="my-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs italic">
                        Note: "{order.specialInstructions}"
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-cream-200 mt-2">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="text-taupe-500">Total Bill:</span>
                      <span className="font-mono font-bold text-sm text-espresso-900">
                        {formatPrice(order.totalMinor)}
                      </span>
                    </div>

                    {/* Status update buttons */}
                    <div className="flex items-center gap-2">
                      {(order.status === 'PLACED' || order.status === 'PENDING') && (
                        <>
                          <button
                            onClick={() => handleStatusTransition(order.id, 'ACCEPTED')}
                            disabled={isSyncing}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                          >
                            {isSyncing && <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />}
                            Accept Order
                          </button>
                          <button
                            onClick={() => handleStatusTransition(order.id, 'REJECTED')}
                            disabled={isSyncing}
                            className="py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs transition-colors disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(order.status === 'ACCEPTED' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'PREPARING')}
                          disabled={isSyncing}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                        >
                          {isSyncing && <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />}
                          {isSyncing ? 'Updating...' : 'Start Cooking'}
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'READY')}
                          disabled={isSyncing}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                        >
                          {isSyncing && <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />}
                          {isSyncing ? 'Updating...' : 'Mark Ready 🔔'}
                        </button>
                      )}

                      {order.status === 'READY' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'SERVED')}
                          disabled={isSyncing}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                        >
                          {isSyncing && <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />}
                          {isSyncing ? 'Updating...' : 'Mark Served ✓'}
                        </button>
                      )}

                      {order.status === 'SERVED' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'COMPLETED')}
                          disabled={isSyncing}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-espresso-900 hover:bg-espresso-800 text-cream-100 font-medium text-xs transition-colors shadow-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                        >
                          {isSyncing && <RefreshCw className="w-3 h-3 animate-spin motion-reduce:animate-none" />}
                          {isSyncing ? 'Closing...' : 'Close Out'}
                        </button>
                      )}

                      {order.status === 'COMPLETED' && (
                        <div className="w-full text-center py-1 text-xs text-taupe-500 font-medium">
                          Order Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}

      {/* SUB-TAB 2: ORDER HISTORY & SEARCH */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-cream-200 bg-cream-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-taupe-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by order # or guest name..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadHistoryOrders(1, { force: true });
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-cream-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={historyStatusFilter}
                onChange={(e) => {
                  const nextStatus = e.target.value;
                  setHistoryStatusFilter(nextStatus);
                  loadHistoryOrders(1, { status: nextStatus });
                }}
                className="px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs sm:text-sm text-espresso-900 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="SERVED">Served</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                onClick={() => loadHistoryOrders(1, { force: true })}
                className="px-3.5 py-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-xs sm:text-sm font-medium transition-colors"
              >
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-taupe-500">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading order history...
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-taupe-400 mx-auto mb-3 opacity-60" />
              <h3 className="font-serif text-lg font-bold text-espresso-900 mb-1">
                No orders match your filter
              </h3>
              <p className="text-sm text-taupe-500">
                Try selecting "All Statuses" or clearing your search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-cream-100 text-taupe-600 font-semibold border-b border-cream-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Order #</th>
                    <th className="px-5 py-3.5">Placed At</th>
                    <th className="px-5 py-3.5">Table</th>
                    <th className="px-5 py-3.5">Guest</th>
                    <th className="px-5 py-3.5">Items</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {historyOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-espresso-900">
                        {ord.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 text-taupe-500 whitespace-nowrap">
                        {new Date(ord.placedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-espresso-900">
                        {ord.table?.name || 'Table'}
                      </td>
                      <td className="px-5 py-3.5 text-taupe-600">
                        {ord.customerName || 'Walk-in'}
                      </td>
                      <td className="px-5 py-3.5 text-taupe-600">
                        {ord._count?.items || ord.items?.length || 0} items
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-espresso-900">
                        {formatPrice(ord.totalMinor)}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(ord.status)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedOrderForDetail(ord)}
                          className="p-1.5 rounded-lg text-taupe-500 hover:text-espresso-900 hover:bg-cream-200 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {historyPagination.totalPages > 1 && (
                <div className="p-4 border-t border-cream-200 flex items-center justify-between text-xs text-taupe-500">
                  <div>
                    Page {historyPagination.page} of {historyPagination.totalPages} ({historyPagination.total} total orders)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={historyPagination.page <= 1}
                      onClick={() => loadHistoryOrders(historyPagination.page - 1)}
                      className="px-3 py-1.5 rounded-lg border border-cream-300 disabled:opacity-40 hover:bg-cream-100"
                    >
                      Previous
                    </button>
                    <button
                      disabled={historyPagination.page >= historyPagination.totalPages}
                      onClick={() => loadHistoryOrders(historyPagination.page + 1)}
                      className="px-3 py-1.5 rounded-lg border border-cream-300 disabled:opacity-40 hover:bg-cream-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: ORDERING ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso-900">Ordering Analytics</h3>
              <p className="text-xs text-taupe-500">Live order totals, average ticket value, top dishes, and table demand</p>
            </div>
            <button
              type="button"
              onClick={() => loadAnalytics({ force: true })}
              disabled={analyticsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-cream-300 text-xs font-semibold text-espresso-800 hover:bg-cream-50 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {analyticsError ? (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm font-medium text-red-800">{analyticsError}</p>
              <button
                type="button"
                onClick={() => loadAnalytics({ force: true })}
                className="px-4 py-2 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800"
              >
                Try Again
              </button>
            </div>
          ) : analyticsLoading && !analyticsData ? (
            <div className="bg-white rounded-2xl p-12 text-center text-taupe-500 border border-cream-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Calculating order analytics...
            </div>
          ) : analyticsData ? (
            <>
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Completed Order Value
                  </div>
                  <div className="text-2xl font-serif font-bold text-espresso-900 tabular-nums">
                    {formatPrice(analyticsData.summary?.completedOrderValueMinor ?? 0)}
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">
                    From {analyticsData.summary?.completedOrdersCount ?? 0} completed orders ({analyticsData.summary?.totalOrdersCount ?? 0} total)
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Average Order Value (AOV)
                  </div>
                  <div className="text-2xl font-serif font-bold text-terracotta tabular-nums">
                    {formatPrice(analyticsData.summary?.averageOrderValueMinor ?? 0)}
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">Per active dining ticket</div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Today's Orders
                  </div>
                  <div className="text-2xl font-serif font-bold text-emerald-700 tabular-nums">
                    {analyticsData.summary?.ordersToday ?? 0}
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">
                    {analyticsData.summary?.ordersThisWeek ?? 0} past 7 days • {analyticsData.summary?.ordersThisMonth ?? 0} this month
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Cancellation Rate
                  </div>
                  <div className="text-2xl font-serif font-bold text-espresso-800 tabular-nums">
                    {analyticsData.summary?.cancellationRatePercent ?? 0}%
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">
                    {analyticsData.summary?.cancelledOrdersCount ?? 0} cancelled or rejected
                  </div>
                </div>
              </div>

              {/* Top Dishes & Most Active Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Ordered Dishes */}
                <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                  <div className="font-serif text-lg font-bold text-espresso-900 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-terracotta" />
                    Top Ordered Dishes
                  </div>
                  {(!analyticsData.topDishes || analyticsData.topDishes.length === 0) ? (
                    <div className="text-sm text-taupe-500 py-6 text-center">
                      No order dish data collected yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.topDishes.map((dish: any, idx: number) => {
                        const maxCount = Math.max(1, analyticsData.topDishes[0]?.count || 1);
                        const pct = Math.min(100, Math.round((dish.count / maxCount) * 100));
                        return (
                          <div key={dish.name || idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-espresso-900">
                              <span>
                                #{idx + 1} {dish.name}
                              </span>
                              <span className="font-bold text-terracotta tabular-nums">
                                {dish.count} ordered
                              </span>
                            </div>
                            <div className="w-full bg-cream-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-terracotta h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Busiest Tables */}
                <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                  <div className="font-serif text-lg font-bold text-espresso-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-terracotta" />
                    Most Active Dining Tables
                  </div>
                  {(!analyticsData.ordersPerTable || analyticsData.ordersPerTable.length === 0) ? (
                    <div className="text-sm text-taupe-500 py-6 text-center">
                      No table order data recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.ordersPerTable.slice(0, 6).map((tbl: any, idx: number) => {
                        const maxCount = Math.max(1, analyticsData.ordersPerTable[0]?.count || 1);
                        const pct = Math.min(100, Math.round((tbl.count / maxCount) * 100));
                        return (
                          <div key={tbl.name || idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-espresso-900">
                              <span>{tbl.name}</span>
                              <span className="font-bold text-espresso-800 tabular-nums">
                                {tbl.count} {tbl.count === 1 ? 'order' : 'orders'}
                              </span>
                            </div>
                            <div className="w-full bg-cream-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-espresso-800 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Peak Ordering Hours */}
              <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
                <div className="font-serif text-lg font-bold text-espresso-900 mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-terracotta" />
                  Peak Ordering Hours
                </div>
                <p className="text-xs text-taupe-500 mb-4">
                  Order volume distribution by local dining hour
                </p>
                {(() => {
                  const activeHours = (analyticsData.busiestHours || []).filter((h: any) => h.count > 0);
                  if (activeHours.length === 0) {
                    return (
                      <div className="text-sm text-taupe-500 py-4 text-center">
                        No hourly ordering volume recorded yet.
                      </div>
                    );
                  }
                  const maxHourCount = Math.max(1, ...activeHours.map((h: any) => h.count));
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {activeHours.map((h: any) => {
                        const pct = Math.max(12, Math.round((h.count / maxHourCount) * 100));
                        return (
                          <div
                            key={h.hour}
                            className="p-3 rounded-xl bg-cream-50 border border-cream-200 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-semibold text-espresso-900">{h.hour}</span>
                              <span className="font-bold text-terracotta tabular-nums">{h.count}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-cream-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-terracotta"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* SUB-TAB 4: ORDERING SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-cream-200 shadow-sm max-w-3xl">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-cream-200">
            <Sliders className="w-5 h-5 text-terracotta" />
            <div>
              <h3 className="font-serif text-xl font-bold text-espresso-900">
                Ordering & Tax Configuration
              </h3>
              <p className="text-xs text-taupe-500">
                Configure table order acceptance, customer payment preferences, and applicable taxes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-cream-300 bg-cream-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderingSettings.orderingEnabled}
                  onChange={(e) =>
                    setOrderingSettings({ ...orderingSettings, orderingEnabled: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-terracotta rounded border-cream-300 focus:ring-terracotta"
                />
                <div>
                  <div className="font-semibold text-xs text-espresso-900">
                    Enable Digital Table Ordering
                  </div>
                  <div className="text-[11px] text-taupe-500 mt-0.5">
                    Allow diners who scan table QR codes to browse and place food orders.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-cream-300 bg-cream-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderingSettings.acceptsNewOrders}
                  onChange={(e) =>
                    setOrderingSettings({ ...orderingSettings, acceptsNewOrders: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-terracotta rounded border-cream-300 focus:ring-terracotta"
                />
                <div>
                  <div className="font-semibold text-xs text-espresso-900">
                    Accept New Orders Right Now
                  </div>
                  <div className="text-[11px] text-taupe-500 mt-0.5">
                    Temporarily pause kitchen orders during peak rushes without disabling the menu.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-cream-300 bg-cream-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderingSettings.allowSpecialInstructions}
                  onChange={(e) =>
                    setOrderingSettings({ ...orderingSettings, allowSpecialInstructions: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-terracotta rounded border-cream-300 focus:ring-terracotta"
                />
                <div>
                  <div className="font-semibold text-xs text-espresso-900">
                    Allow Kitchen Notes
                  </div>
                  <div className="text-[11px] text-taupe-500 mt-0.5">
                    Allow customers to provide allergy notes or prep instructions with their order.
                  </div>
                </div>
              </label>

              <div className="p-4 rounded-xl border border-cream-300 bg-cream-50/50">
                <label className="block font-semibold text-xs text-espresso-900 mb-1">
                  Settlement & Payment Mode
                </label>
                <select
                  value={orderingSettings.paymentMode}
                  onChange={(e) =>
                    setOrderingSettings({ ...orderingSettings, paymentMode: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-cream-300 bg-white text-xs text-espresso-900 focus:outline-none"
                >
                  <option value="PAY_AT_COUNTER">Pay at Counter (Default)</option>
                  <option value="PAY_AT_TABLE">Pay at Table to Waiter</option>
                  <option value="BOTH">Guest Choice (Counter or Table)</option>
                </select>
                <div className="text-[11px] text-taupe-500 mt-1">
                  Diner bills are settled in-person by restaurant staff.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3 border-t border-cream-200">
              <div>
                <label className="block text-xs font-semibold text-espresso-900 mb-1">
                  Government Tax Rate (GST / Sales Tax %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={MIN_TAX_PERCENTAGE}
                    max={MAX_TAX_PERCENTAGE}
                    required
                    value={taxInputs.taxPercentage}
                    onChange={(e) => {
                      setError(null);
                      setTaxInputs((prev) => ({
                        ...prev,
                        taxPercentage: e.target.value,
                      }));
                    }}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white text-xs sm:text-sm font-mono text-espresso-900"
                  />
                  <Percent className="w-3.5 h-3.5 text-taupe-400 absolute right-3 top-3" />
                </div>
                <span className="text-[11px] text-taupe-400 mt-1 block">
                  India standard is 5.0% GST (enter 0 for no tax)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso-900 mb-1">
                  Optional Service Charge (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={MIN_SERVICE_CHARGE_PERCENTAGE}
                    max={MAX_SERVICE_CHARGE_PERCENTAGE}
                    required
                    value={taxInputs.serviceChargePercentage}
                    onChange={(e) => {
                      setError(null);
                      setTaxInputs((prev) => ({
                        ...prev,
                        serviceChargePercentage: e.target.value,
                      }));
                    }}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white text-xs sm:text-sm font-mono text-espresso-900"
                  />
                  <Percent className="w-3.5 h-3.5 text-taupe-400 absolute right-3 top-3" />
                </div>
                <span className="text-[11px] text-taupe-400 mt-1 block">
                  Leave at 0.0% if not levied
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso-900 mb-1">
                  Max Active Orders In Flight
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={orderingSettings.maxActiveOrders}
                  onChange={(e) =>
                    setOrderingSettings({
                      ...orderingSettings,
                      maxActiveOrders: parseInt(e.target.value) || 50,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white text-xs sm:text-sm font-mono text-espresso-900"
                />
                <span className="text-[11px] text-taupe-400 mt-1 block">
                  Safety threshold against accidental spam
                </span>
              </div>
            </div>

            {/* Table QR Session Timers Section */}
            <div className="pt-6 border-t border-cream-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-espresso-900">
                    Table QR Session Timers &amp; Auto-Expiry
                  </h4>
                  <p className="text-xs text-taupe-500">
                    Control how long a scanned table QR link remains active before dining guests must rescan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-cream-200 bg-cream-50/50">
                <div>
                  <label className="block text-xs font-semibold text-espresso-900 mb-1">
                    Initial QR Scan Timeout (Minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={MIN_TABLE_SESSION_MINUTES}
                      max={MAX_TABLE_SESSION_MINUTES}
                      step={1}
                      required
                      value={tableSessionTimers.scanTimeoutMinutes}
                      onChange={(e) => {
                        setError(null);
                        setTableSessionTimers({
                          ...tableSessionTimers,
                          scanTimeoutMinutes: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-2 pr-14 rounded-xl border border-cream-300 bg-white text-xs sm:text-sm font-mono text-espresso-900"
                    />
                    <span className="text-[11px] font-mono text-taupe-500 absolute right-3 top-2.5">
                      min
                    </span>
                  </div>
                  <span className="text-[11px] text-taupe-500 mt-1 block">
                    Time after scanning the QR to place their first order (default 30 min) before needing to rescan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-espresso-900 mb-1">
                    Post-Order Extension Time (Minutes)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={MIN_TABLE_SESSION_MINUTES}
                      max={MAX_TABLE_SESSION_MINUTES}
                      step={1}
                      required
                      value={tableSessionTimers.orderExtensionMinutes}
                      onChange={(e) => {
                        setError(null);
                        setTableSessionTimers({
                          ...tableSessionTimers,
                          orderExtensionMinutes: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-2 pr-14 rounded-xl border border-cream-300 bg-white text-xs sm:text-sm font-mono text-espresso-900"
                    />
                    <span className="text-[11px] font-mono text-taupe-500 absolute right-3 top-2.5">
                      min
                    </span>
                  </div>
                  <span className="text-[11px] text-taupe-500 mt-1 block">
                    Additional ordering window granted whenever an order is placed (default 30 min) so guests can add items before expiry.
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Free Wi-Fi Section */}
            <div className="pt-6 border-t border-cream-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-espresso-900">
                    Guest Free Wi-Fi Access
                  </h4>
                  <p className="text-xs text-taupe-500">
                    Provide cafe Wi-Fi credentials to diners automatically when they scan table QR codes.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-cream-300 bg-cream-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderingSettings.wifiEnabled}
                  onChange={(e) =>
                    setOrderingSettings({ ...orderingSettings, wifiEnabled: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-cream-300 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-xs text-espresso-900">
                    Enable Guest Free Wi-Fi on Digital Menu
                  </div>
                  <div className="text-[11px] text-taupe-500 mt-0.5">
                    Displays an instant "Connect to Wi-Fi" button on the table landing page with 1-click password copy and camera scan-to-join QR.
                  </div>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-cream-200 bg-white">
                <div>
                  <label className="block text-xs font-semibold text-espresso-900 mb-1">
                    Network Name (SSID) {orderingSettings.wifiEnabled ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    value={orderingSettings.wifiSsid}
                    onChange={(e) =>
                      setOrderingSettings({ ...orderingSettings, wifiSsid: e.target.value })
                    }
                    placeholder="e.g. SoilToSoul_Guest"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 text-xs sm:text-sm font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-espresso-900 mb-1">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    disabled={orderingSettings.wifiSecurity === 'nopass'}
                    value={orderingSettings.wifiSecurity === 'nopass' ? '' : orderingSettings.wifiPassword}
                    onChange={(e) =>
                      setOrderingSettings({ ...orderingSettings, wifiPassword: e.target.value })
                    }
                    placeholder={
                      orderingSettings.wifiSecurity === 'nopass'
                        ? 'Open network (no password)'
                        : 'Enter guest Wi-Fi password'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 text-xs sm:text-sm font-mono focus:bg-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-espresso-900 mb-1">
                    Security Type
                  </label>
                  <select
                    value={orderingSettings.wifiSecurity}
                    onChange={(e) =>
                      setOrderingSettings({ ...orderingSettings, wifiSecurity: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs sm:text-sm"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                    <option value="WEP">WEP (Legacy)</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Google Business Review Section */}
            <div className="pt-6 border-t border-cream-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-espresso-900">
                    Google Business Listing & Review Link
                  </h4>
                  <p className="text-xs text-taupe-500">
                    When diners tap "Leave a Review", they will be taken straight to your Google review submission page.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=... or g.page/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white text-xs sm:text-sm font-mono text-espresso-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPlacesModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find on Google Maps</span>
                  </button>
                </div>
                <div className="text-[11px] text-taupe-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                  <span>Use the search helper to automatically lookup your restaurant and generate your direct Google review link.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-cream-200">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Google Business Finder Modal */}
      <GooglePlacesModal
        isOpen={isPlacesModalOpen}
        onClose={() => setIsPlacesModalOpen(false)}
        restaurantId={restaurant.id}
        initialQuery={`${restaurant.displayName} ${restaurant.city || ''}`.trim()}
        onSelectReviewUrl={(url) => setGoogleReviewUrl(url)}
      />

      {/* Order Detail Modal */}
      <Modal
        isOpen={Boolean(selectedOrderForDetail)}
        onClose={() => setSelectedOrderForDetail(null)}
        title={selectedOrderForDetail ? `Order ${selectedOrderForDetail.orderNumber}` : undefined}
        subtitle={
          selectedOrderForDetail
            ? `Placed ${new Date(selectedOrderForDetail.placedAt).toLocaleString()}`
            : undefined
        }
        maxWidth="lg"
        footer={
          <button
            type="button"
            onClick={() => setSelectedOrderForDetail(null)}
            className="px-4 py-2 rounded-xl bg-cream-200 hover:bg-cream-300 text-espresso-900 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        }
      >
        {selectedOrderForDetail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-cream-50 p-3 rounded-xl border border-cream-200">
              <div>
                <span className="text-taupe-500 block">Assigned Table</span>
                <span className="font-bold text-espresso-900">
                  {selectedOrderForDetail.table?.name || 'Table'}
                </span>
              </div>
              <div>
                <span className="text-taupe-500 block">Guest Name</span>
                <span className="font-bold text-espresso-900">
                  {selectedOrderForDetail.customerName || 'Walk-in Diner'}
                </span>
              </div>
              <div>
                <span className="text-taupe-500 block">Status</span>
                {getStatusBadge(selectedOrderForDetail.status)}
              </div>
            </div>

            <div>
              <div className="font-semibold text-xs text-espresso-900 uppercase tracking-wider mb-2">
                Line Items ({selectedOrderForDetail.items?.length || 0})
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto overscroll-contain pr-1">
                {selectedOrderForDetail.items?.map((it: any) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between text-xs py-1.5 border-b border-cream-100"
                  >
                    <div>
                      <div className="font-semibold text-espresso-900">
                        {it.quantity}x {it.dishNameSnapshot}
                      </div>
                      {it.variantName && (
                        <div className="text-taupe-500 text-[11px]">Variant: {it.variantName}</div>
                      )}
                      {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                        <div className="text-taupe-400 text-[10px]">
                          {it.selectedModifiers.map((m: any) => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-espresso-800 font-semibold">
                      {formatPrice(it.totalMinor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrderForDetail.specialInstructions && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 italic">
                Special Notes: "{selectedOrderForDetail.specialInstructions}"
              </div>
            )}

            <div className="pt-3 border-t border-cream-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-taupe-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatPrice(selectedOrderForDetail.subtotalMinor || 0)}</span>
              </div>
              <div className="flex justify-between text-taupe-600">
                <span>
                  {selectedOrderForDetail.taxPercentageSnapshot != null
                    ? `Tax (${selectedOrderForDetail.taxPercentageSnapshot}%):`
                    : 'Tax:'}
                </span>
                <span className="font-mono">{formatPrice(selectedOrderForDetail.taxMinor || 0)}</span>
              </div>
              {selectedOrderForDetail.serviceChargeMinor > 0 && (
                <div className="flex justify-between text-taupe-600">
                  <span>Service Charge:</span>
                  <span className="font-mono">{formatPrice(selectedOrderForDetail.serviceChargeMinor)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-espresso-900 pt-2 border-t border-cream-100">
                <span>Total Bill:</span>
                <span className="font-mono">{formatPrice(selectedOrderForDetail.totalMinor)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
