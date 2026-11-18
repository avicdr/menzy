'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Plus,
  Layers,
  RotateCw,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Sparkles,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableTentDesigner } from '@/components/dashboard/TableTentDesigner';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import {
  buildEmbeddedFontCssForTent,
  buildTableTentSvg,
  fetchImageAsDataUrl,
  getDefaultTableTentConfig,
  openPrintSheetForTents,
  resolveTentFonts,
  type TableTentConfig,
} from '@/lib/qr/table-tent-renderer';
import {
  SESSION_CACHE_TTLS,
  cacheKeys,
  clearAllDashboardSessionCaches,
  dedupeClientRequest,
  isCacheFresh,
  readSessionCache,
  removeSessionCache,
  writeSessionCache,
} from '@/lib/cache/dashboard-session-cache';

interface TableRow {
  id: string;
  name: string;
  section?: string | null;
  capacity?: number | null;
  qrVersion: number;
  isActive: boolean;
  activeOrderCount?: number;
  activeOrdersTotalMinor?: number;
  latestOrderStatus?: string | null;
  hasActiveOrders?: boolean;
  scanUrl?: string;
  createdAt?: string;
}

const TABLES_POLL_INTERVAL_MS = 15_000;

const ORDER_STATUS_LABELS: Record<string, string> = {
  PLACED: 'New Order',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready to Serve',
  SERVED: 'Served · Open Check',
};

function hasTableActiveOrders(table: TableRow): boolean {
  return Boolean(table.hasActiveOrders ?? (table.activeOrderCount ?? 0) > 0);
}

interface TablesManagementViewProps {
  restaurant: any;
  theme?: any;
  coverUrl?: string | null;
  logoUrl?: string | null;
  showLogo?: boolean;
  wifi?: { enabled?: boolean; ssid?: string; password?: string } | null;
  onSubscriptionExpired?: (payload: any) => void;
}

export function TablesManagementView({
  restaurant,
  theme,
  coverUrl,
  logoUrl,
  showLogo,
  wifi,
  onSubscriptionExpired,
}: TablesManagementViewProps) {
  const initialTablesEntry = restaurant?.id
    ? readSessionCache<TableRow[]>(cacheKeys.tables(restaurant.id), SESSION_CACHE_TTLS.TABLES_MAX_MS)
    : null;

  const [tables, setTables] = useState<TableRow[]>(() => initialTablesEntry?.data ?? []);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'available'>('all');
  const [loading, setLoading] = useState<boolean>(() => !initialTablesEntry);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const loadedRestaurantIdRef = useRef<string | null>(
    initialTablesEntry && restaurant?.id ? restaurant.id : null
  );
  const subscriptionPausedRef = useRef(false);

  // Individual Table Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableSection, setTableSection] = useState('Main Dining');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Table Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(9);
  const [bulkNamingPattern, setBulkNamingPattern] = useState('Table {number}');
  const [bulkSection, setBulkSection] = useState('Main Dining');
  const [bulkCapacity, setBulkCapacity] = useState(4);

  // QR Preview Modal
  const [previewTable, setPreviewTable] = useState<any | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string | null>(null);
  const [previewScanUrl, setPreviewScanUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Bulk Export Printable View
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportData, setExportData] = useState<any | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const effectiveLogoUrl = logoUrl || restaurant?.logoUrl || null;
  const effectiveCoverUrl = coverUrl || restaurant?.coverUrl || null;
  const effectiveWifiSsid = wifi?.enabled && wifi?.ssid ? wifi.ssid : null;
  const effectiveWifiPass = wifi?.enabled && wifi?.password ? wifi.password : null;

  // Shared Table Stand / A4 QR Designer configuration (persisted per restaurant)
  const [tentConfig, setTentConfig] = useState<TableTentConfig>(() =>
    getDefaultTableTentConfig({
      showLogo: showLogo !== undefined ? showLogo : restaurant?.showLogo !== false,
      hasBanner: Boolean(effectiveCoverUrl),
      hasWifi: Boolean(effectiveWifiSsid),
    })
  );

  const [bulkBrandAssets, setBulkBrandAssets] = useState<{
    menzyLogoDataUrl: string | null;
    logoDataUrl: string | null;
    coverDataUrl: string | null;
  }>({ menzyLogoDataUrl: null, logoDataUrl: null, coverDataUrl: null });

  useEffect(() => {
    if (!restaurant?.id) return;
    try {
      const saved = window.localStorage.getItem(`menzy_tent_config_${restaurant.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setTentConfig((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [restaurant?.id]);

  const handleUpdateTentConfig = (next: TableTentConfig) => {
    setTentConfig(next);
    if (restaurant?.id) {
      try {
        window.localStorage.setItem(`menzy_tent_config_${restaurant.id}`, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
    }
  };

  useEffect(() => {
    if (!isExportOpen) return;
    let active = true;
    Promise.all([
      fetchImageAsDataUrl('/logo.png'),
      fetchImageAsDataUrl(effectiveLogoUrl),
      fetchImageAsDataUrl(effectiveCoverUrl),
    ]).then(([menzyLogoDataUrl, logoDataUrl, coverDataUrl]) => {
      if (active) {
        setBulkBrandAssets({ menzyLogoDataUrl, logoDataUrl, coverDataUrl });
      }
    });
    return () => {
      active = false;
    };
  }, [isExportOpen, effectiveLogoUrl, effectiveCoverUrl]);

  const loadTables = async (options?: { force?: boolean; silent?: boolean; background?: boolean }) => {
    const targetRestaurantId = restaurant?.id;
    if (!targetRestaurantId) return;

    const force = options?.force ?? false;
    const cached = force
      ? null
      : readSessionCache<TableRow[]>(
          cacheKeys.tables(targetRestaurantId),
          SESSION_CACHE_TTLS.TABLES_MAX_MS
        );

    if (cached) {
      setTables(cached.data || []);
      setLoading(false);
      loadedRestaurantIdRef.current = targetRestaurantId;
      if (isCacheFresh(cached, SESSION_CACHE_TTLS.TABLES_FRESH_MS)) {
        return;
      }
    }

    const silent = options?.silent ?? Boolean(cached);
    try {
      if (silent) {
        if (!options?.background) setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await dedupeClientRequest(`tables:${targetRestaurantId}`, async () => {
        const res = await fetch(`/api/restaurants/${targetRestaurantId}/tables`);
        if (res.status === 402) {
          const payload = await res.json().catch(() => ({}));
          clearAllDashboardSessionCaches();
          return { expired: true as const, payload };
        }
        if (res.status === 401 || res.status === 403) {
          clearAllDashboardSessionCaches();
        }
        if (!res.ok) throw new Error('Failed to load tables');
        const data = await res.json();
        const nextTables: TableRow[] = data.tables || [];
        writeSessionCache(cacheKeys.tables(targetRestaurantId), nextTables);
        return { expired: false as const, tables: nextTables };
      });

      if (result.expired) {
        subscriptionPausedRef.current = true;
        onSubscriptionExpired?.(result.payload);
        return;
      }

      if (restaurant?.id === targetRestaurantId) {
        setTables(result.tables);
        loadedRestaurantIdRef.current = targetRestaurantId;
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message || 'Error loading tables');
      }
    } finally {
      setLoading(false);
      if (!options?.background) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!restaurant?.id) return;

    subscriptionPausedRef.current = false;

    if (loadedRestaurantIdRef.current && loadedRestaurantIdRef.current !== restaurant.id) {
      setStatusFilter('all');
      setPreviewTable(null);
      setPreviewQrDataUrl(null);
      setIsExportOpen(false);
      setExportData(null);
    }

    const cached = readSessionCache<TableRow[]>(
      cacheKeys.tables(restaurant.id),
      SESSION_CACHE_TTLS.TABLES_MAX_MS
    );

    if (cached) {
      const cachedTables = cached.data || [];
      setTables(cachedTables);
      setLoading(false);
      loadedRestaurantIdRef.current = restaurant.id;
      const hasOrderSummaryFields =
        cachedTables.length === 0 ||
        cachedTables.every((t) => typeof t.hasActiveOrders === 'boolean');
      if (!hasOrderSummaryFields || !isCacheFresh(cached, SESSION_CACHE_TTLS.TABLES_FRESH_MS)) {
        loadTables({ force: true, silent: true, background: true });
      }
    } else {
      if (loadedRestaurantIdRef.current !== restaurant.id) {
        setTables([]);
      }
      loadTables({ force: true, silent: false });
    }

    const interval = window.setInterval(() => {
      if (subscriptionPausedRef.current || document.visibilityState === 'hidden') return;
      loadTables({ force: true, silent: true, background: true });
    }, TABLES_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [restaurant?.id]);

  // Lock body scroll and listen for Escape key when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isCreateModalOpen || isBulkModalOpen || Boolean(previewTable) || isExportOpen;
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsBulkModalOpen(false);
        setPreviewTable(null);
        setIsExportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreateModalOpen, isBulkModalOpen, previewTable, isExportOpen]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableName.trim(),
          section: tableSection,
          capacity: tableCapacity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setIsCreateModalOpen(false);
        clearAllDashboardSessionCaches();
        onSubscriptionExpired?.(data);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create table');

      setIsCreateModalOpen(false);
      setTableName('');
      removeSessionCache(cacheKeys.qrExport(restaurant.id));
      setExportData(null);
      showSuccess(`Table "${data.table.name}" created successfully!`);
      await loadTables({ force: true, silent: true });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: bulkCount,
          namingPattern: bulkNamingPattern,
          section: bulkSection,
          capacity: bulkCapacity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setIsBulkModalOpen(false);
        clearAllDashboardSessionCaches();
        onSubscriptionExpired?.(data);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to bulk generate tables');

      setIsBulkModalOpen(false);
      removeSessionCache(cacheKeys.qrExport(restaurant.id));
      setExportData(null);
      showSuccess(`Generated ${data.createdCount} tables successfully!`);
      await loadTables({ force: true, silent: true });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (table: any) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !table.isActive }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        clearAllDashboardSessionCaches();
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        removeSessionCache(cacheKeys.qrExport(restaurant.id));
        setExportData(null);
        showSuccess(`Table "${table.name}" ${!table.isActive ? 'activated' : 'disabled'}.`);
        await loadTables({ force: true, silent: true });
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRotateQr = async (table: any) => {
    if (!confirm(`Rotate QR code for "${table.name}"? Previous printed QR codes for this table will stop working.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${table.id}/rotate-qr`, {
        method: 'POST',
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        clearAllDashboardSessionCaches();
        onSubscriptionExpired?.(data);
        return;
      }
      if (res.ok) {
        removeSessionCache(cacheKeys.tableQrPreview(table.id, table.qrVersion));
        removeSessionCache(cacheKeys.qrExport(restaurant.id));
        setExportData(null);
        showSuccess(`QR code rotated for "${table.name}". New version active.`);
        await loadTables({ force: true, silent: true });
      } else {
        alert(data.error || 'Failed to rotate QR');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleArchiveTable = async (table: any) => {
    if (!confirm(`Archive table "${table.name}"? It will be removed from active lists while preserving historical orders.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${table.id}`, {
        method: 'DELETE',
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        clearAllDashboardSessionCaches();
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        removeSessionCache(cacheKeys.tableQrPreview(table.id, table.qrVersion));
        removeSessionCache(cacheKeys.qrExport(restaurant.id));
        setExportData(null);
        showSuccess(`Table "${table.name}" archived.`);
        await loadTables({ force: true, silent: true });
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenPreview = async (table: any) => {
    setPreviewTable(table);
    setPreviewQrDataUrl(null);
    setPreviewScanUrl(table.scanUrl || null);

    const previewCacheKey = cacheKeys.tableQrPreview(table.id, table.qrVersion);
    const cached = readSessionCache<{ qrDataUrl: string; targetUrl?: string }>(
      previewCacheKey,
      SESSION_CACHE_TTLS.TABLES_MAX_MS
    );
    if (cached?.data?.qrDataUrl) {
      setPreviewQrDataUrl(cached.data.qrDataUrl);
      if (cached.data.targetUrl) {
        setPreviewScanUrl(cached.data.targetUrl);
      }
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    try {
      const result = await dedupeClientRequest(previewCacheKey, async () => {
        const res = await fetch(
          `/api/qr/generate?slug=${restaurant.slug}&tableId=${table.id}&format=dataUrl`
        );
        if (res.status === 402) {
          const payload = await res.json().catch(() => ({}));
          clearAllDashboardSessionCaches();
          return { expired: true as const, payload };
        }
        if (!res.ok) return { expired: false as const, data: null };
        const data = await res.json();
        if (data?.qrDataUrl) {
          writeSessionCache(previewCacheKey, {
            qrDataUrl: data.qrDataUrl,
            targetUrl: data.targetUrl,
          });
        }
        return { expired: false as const, data };
      });

      if (result.expired) {
        setPreviewTable(null);
        onSubscriptionExpired?.(result.payload);
        return;
      }
      if (result.data) {
        setPreviewQrDataUrl(result.data.qrDataUrl);
        if (result.data.targetUrl) {
          setPreviewScanUrl(result.data.targetUrl);
        }
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenBulkExport = async () => {
    setIsExportOpen(true);
    const exportCacheKey = cacheKeys.qrExport(restaurant.id);
    const cached = readSessionCache<any>(exportCacheKey, SESSION_CACHE_TTLS.TABLES_MAX_MS);
    if (cached?.data) {
      setExportData(cached.data);
      setExportLoading(false);
      return;
    }

    setExportLoading(true);
    try {
      const result = await dedupeClientRequest(exportCacheKey, async () => {
        const res = await fetch(`/api/restaurants/${restaurant.id}/tables/qr-export`);
        if (res.status === 402) {
          const payload = await res.json().catch(() => ({}));
          clearAllDashboardSessionCaches();
          return { expired: true as const, payload };
        }
        if (!res.ok) return { expired: false as const, data: null };
        const data = await res.json();
        writeSessionCache(exportCacheKey, data);
        return { expired: false as const, data };
      });

      if (result.expired) {
        setIsExportOpen(false);
        onSubscriptionExpired?.(result.payload);
        return;
      }
      if (result.data) {
        setExportData(result.data);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const currency = restaurant?.currency || 'INR';
  const enabledTablesCount = tables.filter((t) => t.isActive).length;
  const tablesWithActiveOrdersCount = tables.filter(hasTableActiveOrders).length;
  const availableTablesCount = tables.filter((t) => t.isActive && !hasTableActiveOrders(t)).length;
  const activeOrdersTotal = tables.reduce((sum, t) => sum + (t.activeOrderCount || 0), 0);
  const openBillTotalMinor = tables.reduce((sum, t) => sum + (t.activeOrdersTotalMinor || 0), 0);

  const filteredTables = tables.filter((table) => {
    const isOccupied = hasTableActiveOrders(table);
    if (statusFilter === 'active') return isOccupied;
    if (statusFilter === 'available') return table.isActive && !isOccupied;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-espresso-900">Dining Tables & QR Codes</h2>
          <p className="text-xs sm:text-sm text-taupe-500">
            Create dining tables, generate unguessable QR codes, and download printable table tents.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadTables({ force: true, silent: tables.length > 0 })}
            disabled={isRefreshing || loading}
            aria-label="Refresh tables"
            title="Refresh tables"
            className="px-3 py-2 rounded-xl bg-white border border-cream-300 hover:bg-cream-50 text-espresso-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-taupe-600 ${isRefreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenBulkExport}
            className="px-3.5 py-2 rounded-xl bg-white border border-cream-300 hover:bg-cream-50 text-espresso-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-terracotta" />
            <span>Print All Table Tents</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk Generate</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Table</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
          <span className="text-[10px] font-semibold text-taupe-500 uppercase tracking-wider">Total Dining Tables</span>
          <div className="text-3xl font-bold font-mono text-espresso-900 mt-1">{tables.length}</div>
          <div className="text-xs text-taupe-400 mt-1">Configured for {restaurant.displayName}</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
          <span className="text-[10px] font-semibold text-taupe-500 uppercase tracking-wider">Active Tables</span>
          <div className="text-3xl font-bold font-mono text-emerald-700 mt-1">{enabledTablesCount}</div>
          <div className="text-xs text-taupe-400 mt-1">{tables.length - enabledTablesCount} currently paused</div>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-soft transition-colors ${
            tablesWithActiveOrdersCount > 0
              ? 'bg-gradient-to-br from-terracotta-50 via-amber-50/50 to-white border-terracotta-300'
              : 'bg-white border-cream-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-taupe-500 uppercase tracking-wider">
              Tables with Active Orders
            </span>
            {tablesWithActiveOrdersCount > 0 && (
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-terracotta-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-terracotta" />
              </span>
            )}
          </div>
          <div className="text-3xl font-bold font-mono text-terracotta mt-1">
            {tablesWithActiveOrdersCount}
          </div>
          <div className="text-xs text-taupe-500 mt-1">
            {tablesWithActiveOrdersCount > 0
              ? `${activeOrdersTotal} open ${activeOrdersTotal === 1 ? 'order' : 'orders'}${
                  openBillTotalMinor > 0 ? ` • ${formatCurrencyMinor(openBillTotalMinor, currency)} open` : ''
                }`
              : 'No active dining sessions right now'}
          </div>
        </div>
      </div>

      {/* Summary Strip & Filter Pills */}
      {!loading && tables.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl border border-cream-200 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Filter tables by order status">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-espresso-900 text-white shadow-xs'
                  : 'bg-cream-100 text-espresso-800 hover:bg-cream-200'
              }`}
            >
              All Tables ({tables.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'active'}
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-terracotta text-white shadow-xs'
                  : tablesWithActiveOrdersCount > 0
                    ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 hover:bg-terracotta-100'
                    : 'bg-cream-100 text-taupe-600 hover:bg-cream-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  statusFilter === 'active'
                    ? 'bg-white'
                    : tablesWithActiveOrdersCount > 0
                      ? 'bg-terracotta animate-pulse motion-reduce:animate-none'
                      : 'bg-taupe-400'
                }`}
              />
              <span>Active Orders ({tablesWithActiveOrdersCount})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'available'}
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                statusFilter === 'available'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50/70 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  statusFilter === 'available' ? 'bg-white' : 'bg-emerald-500'
                }`}
              />
              <span>Available ({availableTablesCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-taupe-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live status · refreshes every 15s</span>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-taupe-500">Loading tables & QR tokens...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cream-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto text-taupe-400">
            <QrCode className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-espresso-900">No tables created yet</h3>
          <p className="text-xs text-taupe-500 max-w-sm mx-auto">
            Generate dining tables with unique, permanent QR codes for your café or restaurant. Diners scan each table's QR to browse and send orders to your kitchen.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-espresso-900 text-white text-xs font-semibold shadow hover:bg-espresso-800 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Generate Tables</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold shadow hover:bg-terracotta-600 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Single Table</span>
            </button>
          </div>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-cream-200 space-y-2.5">
          <p className="text-sm font-semibold text-espresso-900">
            {statusFilter === 'active'
              ? 'No tables have active orders right now.'
              : 'No available tables right now.'}
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="px-3.5 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold transition-colors"
          >
            Show All Tables ({tables.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTables.map((table) => {
            const isOccupied = hasTableActiveOrders(table);
            const activeCount = table.activeOrderCount ?? 0;
            const statusLabel = table.latestOrderStatus
              ? ORDER_STATUS_LABELS[table.latestOrderStatus] || table.latestOrderStatus
              : null;

            return (
              <div
                key={table.id}
                className={`p-5 rounded-2xl transition-all flex flex-col justify-between ${
                  isOccupied
                    ? 'bg-gradient-to-br from-terracotta-50 via-amber-50/50 to-white border-2 border-terracotta-400 shadow-lifted ring-1 ring-terracotta-200/70'
                    : table.isActive
                      ? 'bg-white border border-cream-200 shadow-soft'
                      : 'bg-cream-100/50 border border-cream-300 opacity-75 shadow-soft'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isOccupied && (
                          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                            <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-terracotta-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-terracotta" />
                          </span>
                        )}
                        <h3 className="font-bold text-lg text-espresso-900 leading-tight truncate">
                          {table.name}
                        </h3>
                      </div>
                      <div className="text-xs text-taupe-500 mt-0.5">
                        {table.section || 'Main Dining'} • Capacity: {table.capacity || 4} guests
                      </div>
                    </div>

                    {isOccupied ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-terracotta text-white shadow-2xs shrink-0 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse motion-reduce:animate-none" />
                        <span>Live Order</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          table.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-cream-200 text-taupe-500'
                        }`}
                      >
                        {table.isActive ? 'Available' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  {/* Prominent Active Order Panel */}
                  {isOccupied && (
                    <div className="p-3 rounded-xl bg-white/90 border border-terracotta-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300/80 text-amber-950 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse motion-reduce:animate-none" />
                          {activeCount === 1 ? '1 Active Order' : `${activeCount} Active Orders`}
                        </span>

                        {typeof table.activeOrdersTotalMinor === 'number' && (
                          <span className="font-mono font-bold text-sm text-espresso-900">
                            {formatCurrencyMinor(table.activeOrdersTotalMinor, currency)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {statusLabel ? (
                          <span className="text-[11px] font-semibold text-terracotta-700">
                            {statusLabel}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-taupe-500">
                            Open dining session
                          </span>
                        )}

                        <Link
                          href={`/dashboard/${restaurant.id}?tab=orders&tableId=${table.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-terracotta-700 hover:text-terracotta-600 hover:underline shrink-0"
                        >
                          <span>View Live Orders</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Permanent QR Code • Never Expires</span>
                  </div>

                  <div className="text-[11px] text-taupe-400 font-mono">
                    QR Token Version: v{table.qrVersion}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div
                  className={`pt-4 mt-3 border-t flex items-center justify-between gap-2 ${
                    isOccupied ? 'border-terracotta-200/70' : 'border-cream-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenPreview(table)}
                      className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="View QR Code & Table Tent"
                    >
                      <Eye className="w-3.5 h-3.5 text-terracotta" />
                      <span className="text-[11px]">View QR</span>
                    </button>

                    <a
                      href={`/api/qr/generate?slug=${restaurant.slug}&tableId=${table.id}&format=svg`}
                      download
                      className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Download SVG QR"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-[11px]">SVG</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRotateQr(table)}
                      className="p-2 rounded-lg text-taupe-500 hover:text-amber-700 hover:bg-cream-100 transition-colors"
                      title="Rotate QR Code Token (Invalidates old printed codes)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(table)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        table.isActive
                          ? 'text-taupe-500 hover:text-red-700 hover:bg-red-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {table.isActive ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => handleArchiveTable(table)}
                      className="p-2 rounded-lg text-taupe-400 hover:text-red-600 hover:bg-cream-100 transition-colors"
                      title="Archive table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD SINGLE TABLE
      ========================================================================= */}
      {/* =========================================================================
          MODAL: CREATE SINGLE TABLE
      ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Dining Table"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-taupe-500 hover:text-espresso-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-table-form"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Table'}
            </button>
          </>
        }
      >
        <form id="create-table-form" onSubmit={handleCreateTable} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">
              Table Name or Number
            </label>
            <input
              type="text"
              required
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. Table 04, Patio 02, VIP Booth"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Section / Area
              </label>
              <input
                type="text"
                value={tableSection}
                onChange={(e) => setTableSection(e.target.value)}
                placeholder="e.g. Main Floor, Patio, Bar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: BULK GENERATE TABLES
      ========================================================================= */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Generate Tables"
        icon={<Layers className="w-4 h-4 text-amber-400" />}
        maxWidth="lg"
        bodyClassName="space-y-4"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-taupe-500 hover:text-espresso-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="bulk-tables-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : `Generate ${bulkCount} Tables`}
            </button>
          </>
        }
      >
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Permanent, Life-Persistent QR Codes:</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Generated table QR codes are persistent and never expire. You can print them on tabletop tents or acrylic stands once and use them indefinitely.
            </p>
          </div>
        </div>

        <form id="bulk-tables-form" onSubmit={handleBulkCreate} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-taupe-700">
                How Many Tables Do You Have?
              </label>
              <span className="text-xs font-bold font-mono text-espresso-900">
                {bulkCount} {bulkCount === 1 ? 'Table' : 'Tables'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {[5, 10, 15, 20, 25, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBulkCount(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    bulkCount === num
                      ? 'bg-espresso-900 text-white shadow-xs scale-105'
                      : 'bg-cream-100 text-espresso-800 hover:bg-cream-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="100"
              required
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">
              Naming Pattern
            </label>
            <input
              type="text"
              required
              value={bulkNamingPattern}
              onChange={(e) => setBulkNamingPattern(e.target.value)}
              placeholder="Table {number} (e.g. Table 01, Table 02...)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
            <div className="text-[11px] text-taupe-500 mt-1 flex flex-wrap items-center justify-between gap-2">
              <span>Use &#123;number&#125; to insert auto-incrementing numbers</span>
              <span className="font-medium text-espresso-900">
                Preview: {bulkNamingPattern.replace('{number}', '01')} ... {bulkNamingPattern.replace('{number}', bulkCount < 10 ? `0${bulkCount}` : `${bulkCount}`)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Section
              </label>
              <input
                type="text"
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Default Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: VIEW QR & TABLE STAND / A4 DESIGNER
      ========================================================================= */}
      <Modal
        isOpen={Boolean(previewTable)}
        onClose={() => setPreviewTable(null)}
        title={
          <span className="text-xs font-bold font-mono text-terracotta">
            QR Designer — Table Stand &amp; A4 Poster
          </span>
        }
        subtitle={
          previewTable
            ? `Customize and download print-ready QR artwork for ${previewTable.name} with Menzy branding.`
            : undefined
        }
        maxWidth="4xl"
        className="font-sans"
      >
        {previewTable && (
          <TableTentDesigner
            restaurant={restaurant}
            table={previewTable}
            qrDataUrl={previewQrDataUrl}
            scanUrl={previewScanUrl}
            loading={previewLoading}
            config={tentConfig}
            onChangeConfig={handleUpdateTentConfig}
            brandTheme={theme || restaurant?.theme}
            coverUrl={effectiveCoverUrl}
            logoUrl={effectiveLogoUrl}
            wifiSsid={effectiveWifiSsid}
            wifiPassword={effectiveWifiPass}
          />
        )}
      </Modal>

      {/* =========================================================================
          MODAL: BULK PRINTABLE TABLE STANDS & A4 POSTERS
      ========================================================================= */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Bulk Printable QR Cards"
        subtitle={`Uses your saved QR Designer style for all ${tables.length} tables in ${restaurant.displayName}.`}
        maxWidth="5xl"
        className="font-sans"
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-cream-100 border border-cream-200 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => handleUpdateTentConfig({ ...tentConfig, format: 'TABLE_STAND' })}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  tentConfig.format === 'TABLE_STAND'
                    ? 'bg-espresso-900 text-white shadow-2xs'
                    : 'text-espresso-800 hover:bg-cream-200'
                }`}
              >
                Table Stand (4/sheet)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateTentConfig({ ...tentConfig, format: 'A4_POSTER' })}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  tentConfig.format === 'A4_POSTER'
                    ? 'bg-espresso-900 text-white shadow-2xs'
                    : 'text-espresso-800 hover:bg-cream-200'
                }`}
              >
                A4 Poster (1/page)
              </button>
            </div>
            <button
              type="button"
              disabled={!exportData?.tables?.length}
              onClick={async () => {
                if (!exportData?.tables?.length) return;
                const activeBrandTheme = theme || restaurant?.theme || null;
                const resolvedFonts = resolveTentFonts(tentConfig, activeBrandTheme);
                const embeddedFontCss = await buildEmbeddedFontCssForTent([
                  resolvedFonts.headingFont,
                  resolvedFonts.bodyFont,
                ]);
                const svgs = exportData.tables.map((t: any, idx: number) =>
                  buildTableTentSvg(tentConfig, {
                    restaurantName: exportData.restaurantName || restaurant.displayName,
                    tableName: t.name,
                    tableSection: t.section || null,
                    qrDataUrl: t.qrDataUrl,
                    menzyLogoDataUrl: bulkBrandAssets.menzyLogoDataUrl,
                    logoDataUrl: bulkBrandAssets.logoDataUrl,
                    coverDataUrl: bulkBrandAssets.coverDataUrl,
                    wifiSsid: effectiveWifiSsid,
                    wifiPassword: effectiveWifiPass,
                    brandTheme: activeBrandTheme,
                    embeddedFontCss: idx === 0 ? embeddedFontCss : undefined,
                    useInlineCssVars: false,
                    svgIdPrefix: `print-${t.id}`,
                  })
                );
                openPrintSheetForTents(
                  svgs,
                  tentConfig.format,
                  `${exportData.restaurantName || restaurant.displayName} — All Table QRs`
                );
              }}
              className="px-3.5 py-1.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {tentConfig.format === 'A4_POSTER' ? 'Print All A4 Posters' : 'Print All Table Stands'}
              </span>
            </button>
          </div>
        }
      >
        {exportLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-taupe-500">Rendering high-res QR codes for all tables...</p>
          </div>
        ) : exportData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exportData.tables.map((t: any) => {
              const cardSvg = buildTableTentSvg(tentConfig, {
                restaurantName: exportData.restaurantName || restaurant.displayName,
                tableName: t.name,
                tableSection: t.section || null,
                qrDataUrl: t.qrDataUrl,
                menzyLogoDataUrl: bulkBrandAssets.menzyLogoDataUrl,
                logoDataUrl: bulkBrandAssets.logoDataUrl,
                coverDataUrl: bulkBrandAssets.coverDataUrl,
                wifiSsid: effectiveWifiSsid,
                wifiPassword: effectiveWifiPass,
                brandTheme: theme || restaurant?.theme || null,
                useInlineCssVars: true,
                svgIdPrefix: `bulk-${t.id}`,
              });
              return (
                <div
                  key={t.id}
                  className="p-3 bg-cream-50/80 border border-cream-200 rounded-2xl flex flex-col items-center gap-2 shadow-xs"
                >
                  <div
                    role="img"
                    aria-label={`${exportData.restaurantName} — ${t.name}`}
                    className="w-full max-w-[240px] rounded-xl shadow-sm border border-black/10 overflow-hidden bg-white [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: cardSvg }}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

