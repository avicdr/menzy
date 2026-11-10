'use client';

import React, { useState, useEffect } from 'react';
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
import { Portal } from '@/components/ui/Portal';
import { GooglePlacesModal } from './GooglePlacesModal';

interface OrdersManagementViewProps {
  restaurant: any;
}

export function OrdersManagementView({ restaurant }: OrdersManagementViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'history' | 'analytics' | 'settings'>('live');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Orders & Live Floor State
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [serviceCalls, setServiceCalls] = useState<any[]>([]);
  const [selectedTableFilter, setSelectedTableFilter] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // History Orders
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Ordering Settings Form (includes Free Wi-Fi & Google Review URL)
  const [orderingSettings, setOrderingSettings] = useState({
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
  });
  const [googleReviewUrl, setGoogleReviewUrl] = useState(restaurant?.googleReviewUrl || '');
  const [isPlacesModalOpen, setIsPlacesModalOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // 1. Load Live Orders + Tables + Service Calls
  const loadLiveOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [ordersRes, tablesRes, callsRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurant.id}/orders?limit=50`),
        fetch(`/api/restaurants/${restaurant.id}/tables`),
        fetch(`/api/restaurants/${restaurant.id}/service-calls`),
      ]);
      if (!ordersRes.ok) throw new Error('Failed to load live orders');
      const ordersData = await ordersRes.json();
      setLiveOrders(ordersData.orders || []);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData.tables || []);
      }

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setServiceCalls(callsData.calls || []);
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Error loading live orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Load Order History
  const loadHistoryOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (historyStatusFilter !== 'ALL') params.set('status', historyStatusFilter);
      if (historySearch.trim()) params.set('search', historySearch.trim());

      const res = await fetch(`/api/restaurants/${restaurant.id}/orders/history?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load order history');
      const data = await res.json();
      setHistoryOrders(data.orders || []);
      setHistoryPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message || 'Error loading history');
    } finally {
      setLoading(false);
    }
  };

  // 3. Load Order Analytics
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch(`/api/restaurants/${restaurant.id}/orders/analytics`);
      if (!res.ok) throw new Error('Failed to load order analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // 4. Load Ordering Settings & Restaurant Profile Settings
  const loadSettings = async () => {
    try {
      const [ordRes, restRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurant.id}/ordering-settings`),
        fetch(`/api/restaurant/settings?restaurantId=${restaurant.id}`),
      ]);
      if (ordRes.ok) {
        const data = await ordRes.json();
        if (data.settings) {
          const wifi = data.settings.notificationSettings?.wifi || {};
          setOrderingSettings({
            orderingEnabled: data.settings.orderingEnabled ?? true,
            acceptsNewOrders: data.settings.acceptsNewOrders ?? true,
            allowSpecialInstructions: data.settings.allowSpecialInstructions ?? true,
            paymentMode: data.settings.paymentMode ?? 'PAY_AT_COUNTER',
            taxPercentage: Number(data.settings.taxPercentage) || 5.0,
            serviceChargePercentage: Number(data.settings.serviceChargePercentage) || 0.0,
            maxActiveOrders: Number(data.settings.maxActiveOrders) || 50,
            wifiEnabled: Boolean(wifi.enabled),
            wifiSsid: wifi.ssid || '',
            wifiPassword: wifi.password || '',
            wifiSecurity: wifi.security || 'WPA',
          });
        }
      }
      if (restRes.ok) {
        const rData = await restRes.json();
        if (rData.restaurant?.googleReviewUrl) {
          setGoogleReviewUrl(rData.restaurant.googleReviewUrl);
        }
      }
    } catch (err) {
      console.error('Failed to load ordering settings', err);
    }
  };

  useEffect(() => {
    if (restaurant?.id) {
      if (activeSubTab === 'live') {
        loadLiveOrders();
        const interval = setInterval(() => loadLiveOrders(true), 8000);
        return () => clearInterval(interval);
      }
      if (activeSubTab === 'history') loadHistoryOrders(1);
      if (activeSubTab === 'analytics') loadAnalytics();
      if (activeSubTab === 'settings') loadSettings();
    }
  }, [restaurant?.id, activeSubTab]);

  const handleResolveCall = async (callId: string) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/service-calls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      if (res.ok) {
        setServiceCalls((prev) => prev.filter((c) => c.id !== callId));
        showNotification('Service call marked as attended.');
      }
    } catch (err) {
      console.error('Failed to resolve call:', err);
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      setStatusUpdating(orderId);
      const res = await fetch(`/api/restaurants/${restaurant.id}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');
      showNotification(`Order status updated to ${nextStatus}.`);
      loadLiveOrders(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderingSettings.wifiEnabled && !orderingSettings.wifiSsid.trim()) {
      setError('Please enter your Wi-Fi Network Name (SSID) or disable Guest Free Wi-Fi.');
      return;
    }

    try {
      setIsSavingSettings(true);
      setError(null);

      // Save Ordering Settings + Wi-Fi
      const res = await fetch(`/api/restaurants/${restaurant.id}/ordering-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderingSettings,
          wifi: {
            enabled: orderingSettings.wifiEnabled,
            ssid: orderingSettings.wifiSsid.trim(),
            password: orderingSettings.wifiSecurity === 'nopass' ? '' : orderingSettings.wifiPassword,
            security: orderingSettings.wifiSecurity,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      // Also save Google Review URL if updated
      await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          googleReviewUrl: googleReviewUrl.trim(),
        }),
      });

      showNotification('Ordering, Wi-Fi & Google Review configuration saved!');
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
          Active Orders ({liveOrders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length})
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
          ...activeOrdersList.filter((o) => o.tableId).map((o) => o.tableId),
          ...serviceCalls.map((c) => c.tableId),
        ]);
        const openCheckMinor = activeOrdersList.reduce((acc, o) => acc + (o.totalMinor || 0), 0);
        const filteredOrders = selectedTableFilter
          ? liveOrders.filter((o) => o.tableId === selectedTableFilter)
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
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shrink-0 transition-colors"
                    >
                      Attended ✓
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
                  const tableOrders = activeOrdersList.filter((o) => o.tableId === t.id);
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
              onClick={() => loadLiveOrders(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cream-300 bg-white text-xs font-medium text-espresso-800 hover:bg-cream-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
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
                      <div>{getStatusBadge(order.status)}</div>
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
                            disabled={statusUpdating === order.id}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={() => handleStatusTransition(order.id, 'REJECTED')}
                            disabled={statusUpdating === order.id}
                            className="py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(order.status === 'ACCEPTED' || order.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'PREPARING')}
                          disabled={statusUpdating === order.id}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                        >
                          Start Cooking
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'READY')}
                          disabled={statusUpdating === order.id}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                        >
                          Mark Ready 🔔
                        </button>
                      )}

                      {order.status === 'READY' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'SERVED')}
                          disabled={statusUpdating === order.id}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                        >
                          Mark Served ✓
                        </button>
                      )}

                      {order.status === 'SERVED' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'COMPLETED')}
                          disabled={statusUpdating === order.id}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-espresso-900 hover:bg-espresso-800 text-cream-100 font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                        >
                          Close Out
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
              ))}
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
                  if (e.key === 'Enter') loadHistoryOrders(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-cream-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={historyStatusFilter}
                onChange={(e) => {
                  setHistoryStatusFilter(e.target.value);
                  setTimeout(() => loadHistoryOrders(1), 50);
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
                onClick={() => loadHistoryOrders(1)}
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
          {analyticsLoading || !analyticsData ? (
            <div className="bg-white rounded-2xl p-12 text-center text-taupe-500 border border-cream-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Calculating order analytics...
            </div>
          ) : (
            <>
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Total Order Value
                  </div>
                  <div className="text-2xl font-serif font-bold text-espresso-900">
                    {formatPrice(analyticsData.summary?.completedOrderValueMinor || 0)}
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">
                    From {analyticsData.summary?.completedOrders || 0} completed orders
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Average Order Value (AOV)
                  </div>
                  <div className="text-2xl font-serif font-bold text-terracotta">
                    {formatPrice(analyticsData.summary?.aovMinor || 0)}
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">Per dining table ticket</div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Today's Orders
                  </div>
                  <div className="text-2xl font-serif font-bold text-emerald-700">
                    {analyticsData.summary?.todayCount || 0}
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">
                    {analyticsData.summary?.weekCount || 0} past 7 days
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
                  <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
                    Cancellation Rate
                  </div>
                  <div className="text-2xl font-serif font-bold text-espresso-800">
                    {analyticsData.summary?.cancellationRatePercent || 0}%
                  </div>
                  <div className="text-xs text-taupe-500 mt-1">
                    {analyticsData.summary?.cancelledOrders || 0} cancelled
                  </div>
                </div>
              </div>

              {/* Top Dishes & Peak Hours Grid */}
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
                        const maxCount = analyticsData.topDishes[0]?.count || 1;
                        const pct = Math.round((dish.count / maxCount) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-espresso-900">
                              <span>
                                #{idx + 1} {dish.name}
                              </span>
                              <span className="font-bold text-terracotta">
                                {dish.count} ordered
                              </span>
                            </div>
                            <div className="w-full bg-cream-100 rounded-full h-2">
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
                  {(!analyticsData.busiestTables || analyticsData.busiestTables.length === 0) ? (
                    <div className="text-sm text-taupe-500 py-6 text-center">
                      No table order data recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.busiestTables.map((tbl: any, idx: number) => {
                        const maxCount = analyticsData.busiestTables[0]?.count || 1;
                        const pct = Math.round((tbl.count / maxCount) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-espresso-900">
                              <span>{tbl.name}</span>
                              <span className="font-bold text-espresso-800">
                                {tbl.count} orders
                              </span>
                            </div>
                            <div className="w-full bg-cream-100 rounded-full h-2">
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
            </>
          )}
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
                    step="0.1"
                    min="0"
                    max="100"
                    value={orderingSettings.taxPercentage}
                    onChange={(e) =>
                      setOrderingSettings({
                        ...orderingSettings,
                        taxPercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white text-xs sm:text-sm font-mono text-espresso-900"
                  />
                  <Percent className="w-3.5 h-3.5 text-taupe-400 absolute right-3 top-3" />
                </div>
                <span className="text-[11px] text-taupe-400 mt-1 block">
                  India standard is 5.0% GST
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-espresso-900 mb-1">
                  Optional Service Charge (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={orderingSettings.serviceChargePercentage}
                    onChange={(e) =>
                      setOrderingSettings({
                        ...orderingSettings,
                        serviceChargePercentage: parseFloat(e.target.value) || 0,
                      })
                    }
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
      {selectedOrderForDetail && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-espresso-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedOrderForDetail(null);
            }}
          >
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-lifted border border-cream-300 animate-modal-content max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-200">
              <div>
                <span className="font-serif text-xl font-bold text-espresso-900">
                  Order {selectedOrderForDetail.orderNumber}
                </span>
                <div className="text-xs text-taupe-500 mt-0.5">
                  Placed {new Date(selectedOrderForDetail.placedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1 rounded-lg text-taupe-400 hover:bg-cream-200 hover:text-espresso-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-cream-50 p-3 rounded-xl border border-cream-200">
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
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
                  <span>Tax ({selectedOrderForDetail.taxPercentageSnapshot || 0}%):</span>
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

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-4 py-2 rounded-xl bg-cream-200 hover:bg-cream-300 text-espresso-900 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Portal>
    )}
    </div>
  );
}
