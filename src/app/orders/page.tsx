'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChefHat,
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  RefreshCw,
  Utensils,
  History,
  Check,
  ChevronRight,
  Flame,
  Volume2,
  Eye,
  X,
  Sparkles,
  MapPin,
  Timer,
  Layers,
  FileText,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { Portal } from '@/components/ui/Portal';
import { generateStaffTypographyVars } from '@/lib/theme/theme-presets';

/**
 * Web Audio API synthesized order bell chime (no external audio assets required)
 */
function playOrderChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.4); // D6

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.85);
    osc2.stop(ctx.currentTime + 0.85);
  } catch (err) {
    console.warn('Audio chime playback blocked or not supported:', err);
  }
}

export default function StaffOrderPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Waiter Service Calls
  const [serviceCalls, setServiceCalls] = useState<any[]>([]);
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);
  const previousCallCount = useRef(0);

  // Active filter tab for responsive / tablet view
  const [activeStageFilter, setActiveStageFilter] = useState<'ALL' | 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED'>('ALL');

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousPlacedCount = useRef(0);

  // Load sound setting from localStorage
  useEffect(() => {
    try {
      const savedSound = localStorage.getItem('dishora_order_sound_enabled');
      if (savedSound === 'true') setSoundEnabled(true);
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playOrderChime();
    try {
      localStorage.setItem('dishora_order_sound_enabled', String(next));
    } catch {}
  };

  // Fetch active orders & service calls via the staff-aware _auto endpoint
  const fetchOrders = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);

      const [ordersRes, callsRes] = await Promise.all([
        fetch('/api/restaurants/_auto/orders', {
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch('/api/restaurants/_auto/service-calls', {
          headers: { 'Cache-Control': 'no-cache' },
        }).catch(() => null),
      ]);

      if (ordersRes.status === 401) {
        router.push('/orders/login');
        return;
      }

      if (ordersRes.status === 403) {
        const errJson = await ordersRes.json().catch(() => ({}));
        setError(errJson.error || 'Access denied for this restaurant.');
        return;
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setRestaurantData(data);
        setOrders(data.orders || []);
        setError(null);

        // Detect new incoming orders and trigger audio chime
        const placedCount = (data.orders || []).filter((o: any) => o.status === 'PLACED').length;
        if (placedCount > previousPlacedCount.current && soundEnabled) {
          playOrderChime();
        }
        previousPlacedCount.current = placedCount;
      }

      if (callsRes && callsRes.ok) {
        const callsData = await callsRes.json();
        const activeCalls = callsData.calls || [];
        setServiceCalls(activeCalls);

        // Sound alert if new waiter call arrived
        if (activeCalls.length > previousCallCount.current && soundEnabled) {
          playOrderChime();
        }
        previousCallCount.current = activeCalls.length;
      }
    } catch (err: any) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolveCall = async (callId: string) => {
    try {
      setResolvingCallId(callId);
      const res = await fetch('/api/restaurants/_auto/service-calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      if (res.ok) {
        setServiceCalls((prev) => prev.filter((c) => c.id !== callId));
        previousCallCount.current = Math.max(0, previousCallCount.current - 1);
      }
    } catch (err) {
      console.error('Failed to resolve waiter call:', err);
    } finally {
      setResolvingCallId(null);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 4-second polling loop
    const interval = setInterval(() => {
      fetchOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleUpdateStatus = async (orderId: string, targetStatus: string, reason?: string) => {
    try {
      const restId = restaurantData?.restaurantId || '_auto';

      const res = await fetch(`/api/restaurants/${restId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, reason }),
      });

      if (res.ok) {
        await fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        const data = await res.json();
        alert(`Status update failed: ${data.error || 'Action rejected'}`);
      }
    } catch (err: any) {
      alert(`Error updating order: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/staff/logout', { method: 'POST' });
    router.push('/orders/login');
  };

  // Format relative elapsed time with urgency classification
  const getElapsedInfo = (dateStr: string) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);

    let text = `${elapsedSeconds}s`;
    if (mins >= 1) text = `${mins}m`;
    if (mins >= 60) text = `${Math.floor(mins / 60)}h ${mins % 60}m`;

    let urgency: 'normal' | 'warn' | 'critical' = 'normal';
    if (mins >= 15) urgency = 'critical';
    else if (mins >= 7) urgency = 'warn';

    return { text, mins, urgency };
  };

  const staffTypographyStyle = useMemo(
    () => generateStaffTypographyVars(restaurantData?.restaurantTheme),
    [restaurantData?.restaurantTheme]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C0907] text-cream-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif font-semibold tracking-wide text-cream-100">
            Connecting to Live Kitchen Display...
          </p>
        </div>
      </div>
    );
  }

  const placedOrders = orders.filter((o) => o.status === 'PLACED');
  const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const servedOrders = orders.filter((o) => o.status === 'SERVED');

  return (
    <div
      style={staffTypographyStyle}
      className="min-h-screen bg-[#0A0705] text-cream-100 flex flex-col font-sans selection:bg-terracotta selection:text-white"
    >
      {/* =========================================================================
          OPERATIONAL KDS HEADER BAR
      ========================================================================= */}
      <header className="px-4 sm:px-6 py-3.5 bg-[#140E0A]/95 backdrop-blur-md border-b border-espresso-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-700 text-white flex items-center justify-center font-bold shadow-lg shadow-terracotta/20 border border-terracotta-400/30 shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-cream-50 tracking-tight leading-tight">
                {restaurantData?.restaurantName || 'Order Terminal'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE KDS
              </span>
            </div>
            <div className="text-[11px] text-taupe-400 flex items-center gap-2 mt-0.5">
              <span className="font-medium text-cream-200">{restaurantData?.actor?.name || 'Staff User'}</span>
              <span className="text-taupe-600">•</span>
              <span className="font-mono text-terracotta-400 font-semibold tracking-wider uppercase text-[10px]">
                {restaurantData?.actor?.role || 'TERMINAL'}
              </span>
              <span className="text-taupe-600">•</span>
              <span className="font-mono text-taupe-400 text-[10px]">{orders.length} Active Tickets</span>
              {serviceCalls.length > 0 && (
                <>
                  <span className="text-taupe-600">•</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                    <Bell className="w-3 h-3 text-amber-400" />
                    {serviceCalls.length} Table Calls
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Strip */}
        <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto">
          {/* Sound Chime Toggle */}
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              soundEnabled
                ? 'bg-amber-950/80 border-amber-600/70 text-amber-300 ring-1 ring-amber-500/30'
                : 'bg-espresso-900 border-espresso-800 text-taupe-400 hover:text-white hover:bg-espresso-800'
            }`}
            title={soundEnabled ? 'Order audio chime enabled (Click to mute)' : 'Order audio chime disabled (Click to enable)'}
          >
            {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> : <BellOff className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono">{soundEnabled ? 'CHIME ON' : 'MUTED'}</span>
          </button>

          {/* Refresh Action */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2 rounded-xl text-taupe-300 hover:text-white hover:bg-espresso-800 border border-espresso-800 transition-colors shrink-0"
            title="Refresh Live Orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-terracotta' : ''}`} />
          </button>

          {/* Order History */}
          <Link
            href="/orders/history"
            className="px-3 py-1.5 rounded-xl bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Order History</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-taupe-400 hover:text-rose-400 hover:bg-espresso-800 border border-espresso-800 transition-colors shrink-0"
            title="Log Out Terminal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Banner if any */}
      {error && (
        <div className="bg-rose-950 border-b border-rose-800 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchOrders(true)} className="underline hover:text-white font-medium">
            Retry Connection
          </button>
        </div>
      )}

      {/* Live Table Service Calls Alert Banner */}
      {serviceCalls.length > 0 && (
        <div className="bg-gradient-to-r from-[#2B1705] via-[#3D1E08] to-[#2B1705] border-b-2 border-amber-500 px-4 sm:px-6 py-3 shadow-2xl relative z-10 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 animate-bounce">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                    Floor Waiter Needed ({serviceCalls.length} Pending)
                  </span>
                </div>
                <p className="text-[11px] text-taupe-300">
                  Diners at the tables below have requested service.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {serviceCalls.map((call) => {
                const elapsed = getElapsedInfo(call.requestedAt);
                const icon =
                  call.callType === 'WATER'
                    ? '💧 Water & Glasses'
                    : call.callType === 'CUTLERY'
                    ? '🍽️ Cutlery & Napkins'
                    : call.callType === 'BILL'
                    ? '🧾 Bring Bill'
                    : '🙋 Needs Waiter';
                return (
                  <div
                    key={call.id}
                    className="p-2.5 px-3.5 rounded-2xl bg-black/70 border border-amber-500/50 text-xs flex items-center gap-3 shrink-0 shadow-lg"
                  >
                    <div>
                      <div className="font-bold text-cream-50 flex items-center gap-1.5">
                        <span className="text-amber-300 font-mono text-sm">{call.tableName}</span>
                        {call.tableSection && (
                          <span className="text-[10px] text-taupe-400">({call.tableSection})</span>
                        )}
                        <span className="text-taupe-500">•</span>
                        <span className="text-cream-100 font-semibold">{icon}</span>
                      </div>
                      <div className="text-[10px] text-taupe-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-amber-400 font-medium">{elapsed.text} ago</span>
                        {call.notes && (
                          <>
                            <span className="text-taupe-600">•</span>
                            <span className="text-amber-200/90 italic truncate max-w-[160px]">
                              "{call.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveCall(call.id)}
                      disabled={resolvingCallId === call.id}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-espresso-950 font-bold text-xs transition-all shadow active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {resolvingCallId === call.id ? 'Attending...' : 'Mark Attended ✓'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Responsive View Tabs (Mobile/Tablet stage selector) */}
      <div className="px-4 py-2 bg-[#100B08] border-b border-espresso-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar lg:hidden">
        {[
          { id: 'ALL', label: 'All Tickets', count: orders.length },
          { id: 'PLACED', label: 'New', count: placedOrders.length, color: 'text-rose-400' },
          { id: 'ACCEPTED', label: 'Accepted', count: acceptedOrders.length, color: 'text-amber-400' },
          { id: 'PREPARING', label: 'Kitchen Prep', count: preparingOrders.length, color: 'text-orange-400' },
          { id: 'READY', label: 'Ready to Serve', count: readyOrders.length, color: 'text-blue-400' },
          { id: 'SERVED', label: 'Served', count: servedOrders.length, color: 'text-emerald-400' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStageFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeStageFilter === tab.id
                ? 'bg-terracotta text-white shadow-md'
                : 'bg-espresso-900/80 text-taupe-300 hover:text-white border border-espresso-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/40">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* =========================================================================
          MAIN KANBAN WORKSPACE
      ========================================================================= */}
      <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 min-w-[1160px] h-full items-start">

          {/* COLUMN 1: NEW ORDERS (PLACED) */}
          {(activeStageFilter === 'ALL' || activeStageFilter === 'PLACED') && (
            <div className="bg-[#120D0A] rounded-2xl border border-rose-900/40 flex flex-col max-h-[calc(100vh-125px)] shadow-lg ring-1 ring-rose-500/10">
              <div className="p-3.5 border-b border-espresso-800/90 flex items-center justify-between bg-gradient-to-r from-[#1B110D] to-[#140D09] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-sm tracking-tight text-cream-50">
                    Incoming Tickets
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/80">
                  {placedOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {placedOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.placedAt);
                  return (
                    <div
                      key={order.id}
                      className="p-4 bg-gradient-to-br from-[#1C130D] to-[#140D0A] rounded-2xl border-2 border-rose-500/70 shadow-xl space-y-3 animate-fade-in relative overflow-hidden"
                    >
                      {/* Top Order Identifier Strip */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-mono font-bold text-lg text-cream-50 tracking-wider">
                            #{order.orderNumber}
                          </div>
                          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{order.table?.name || 'Table'}</span>
                            {order.table?.section && (
                              <span className="text-[10px] text-taupe-400 font-normal">
                                ({order.table.section})
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            elapsed.urgency === 'critical'
                              ? 'bg-rose-500 text-white animate-pulse'
                              : elapsed.urgency === 'warn'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          <Timer className="w-3 h-3" />
                          {elapsed.text}
                        </span>
                      </div>

                      {/* Line Items List */}
                      <div className="divide-y divide-espresso-800/70 text-xs space-y-2 pt-1 border-t border-espresso-800/70">
                        {order.items.map((it: any) => (
                          <div key={it.id} className="pt-2 first:pt-0">
                            <div className="font-semibold text-cream-100 flex items-start justify-between gap-2">
                              <span className="text-[13px] leading-tight">
                                <span className="font-mono font-bold text-terracotta mr-1.5 text-sm">
                                  {it.quantity}×
                                </span>
                                {it.dishName}
                              </span>
                              <span className="font-mono text-taupe-400 text-xs shrink-0">
                                {formatCurrencyMinor(it.lineTotalMinor, order.currency)}
                              </span>
                            </div>

                            {it.variant && (
                              <div className="text-[11px] text-taupe-400 pl-5 mt-0.5 font-medium">
                                Option: {it.variant}
                              </div>
                            )}

                            {it.modifiers && it.modifiers.length > 0 && (
                              <div className="text-[10px] text-amber-300/80 pl-5 mt-0.5">
                                + {it.modifiers.map((m: any) => m.optionName).join(', ')}
                              </div>
                            )}

                            {it.specialInstructions && (
                              <div className="text-[11px] text-amber-200 bg-amber-950/60 border border-amber-700/50 rounded-lg px-2 py-1 mt-1 font-medium italic">
                                "{it.specialInstructions}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Diner Note */}
                      {order.specialInstructions && (
                        <div className="p-2.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-xs text-amber-200 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="font-medium italic">Note: {order.specialInstructions}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2.5 border-t border-espresso-800 flex items-center justify-between gap-2">
                        <span className="font-bold font-mono text-sm text-terracotta tracking-tight">
                          {formatCurrencyMinor(order.totalMinor, order.currency)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'REJECTED', 'Kitchen unable to fulfill')}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {placedOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-taupe-500 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-espresso-700" />
                    <span>No incoming tickets at this moment</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COLUMN 2: ACCEPTED TICKETS */}
          {(activeStageFilter === 'ALL' || activeStageFilter === 'ACCEPTED') && (
            <div className="bg-[#120D0A] rounded-2xl border border-espresso-800/90 flex flex-col max-h-[calc(100vh-125px)] shadow-lg">
              <div className="p-3.5 border-b border-espresso-800/90 flex items-center justify-between bg-gradient-to-r from-[#18110D] to-[#130D09] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h3 className="font-serif font-bold text-sm tracking-tight text-cream-50">
                    Queued / Acknowledged
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80">
                  {acceptedOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {acceptedOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.placedAt);
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 bg-[#17110D] rounded-xl border border-espresso-700/80 shadow space-y-2.5 animate-fade-in"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-mono font-bold text-base text-cream-50">
                            #{order.orderNumber}
                          </div>
                          <div className="text-xs font-bold text-amber-300 mt-0.5">
                            📍 {order.table?.name}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-taupe-400 bg-black/40 px-2 py-0.5 rounded">
                          {elapsed.text}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-cream-200">
                        {order.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between">
                            <span>
                              <b className="font-mono text-terracotta mr-1">{it.quantity}×</b> {it.dishName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-espresso-800 flex items-center justify-between">
                        <span className="font-mono text-xs text-taupe-300">
                          {formatCurrencyMinor(order.totalMinor, order.currency)}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                          className="px-3 py-1 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                        >
                          <Flame className="w-3.5 h-3.5" /> Start Cooking
                        </button>
                      </div>
                    </div>
                  );
                })}

                {acceptedOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-taupe-500">
                    No queued tickets
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COLUMN 3: KITCHEN PREPARING */}
          {(activeStageFilter === 'ALL' || activeStageFilter === 'PREPARING') && (
            <div className="bg-[#120D0A] rounded-2xl border border-orange-900/30 flex flex-col max-h-[calc(100vh-125px)] shadow-lg ring-1 ring-orange-500/10">
              <div className="p-3.5 border-b border-espresso-800/90 flex items-center justify-between bg-gradient-to-r from-[#1B110D] to-[#140D09] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  <h3 className="font-serif font-bold text-sm tracking-tight text-cream-50">
                    In Preparation
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-950 text-orange-300 border border-orange-800/80">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {preparingOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.placedAt);
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 bg-[#17110D] rounded-xl border border-orange-700/50 shadow-md space-y-2.5 animate-fade-in"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-mono font-bold text-base text-cream-50">
                            #{order.orderNumber}
                          </div>
                          <div className="text-xs font-bold text-amber-300 mt-0.5">
                            📍 {order.table?.name}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-orange-300 bg-orange-950/80 border border-orange-800/50 px-2 py-0.5 rounded">
                          Cooking ({elapsed.text})
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-cream-100">
                        {order.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between">
                            <span>
                              <b className="font-mono text-orange-400 mr-1">{it.quantity}×</b> {it.dishName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-espresso-800 flex items-center justify-between">
                        <span className="font-mono text-xs text-taupe-300">
                          {formatCurrencyMinor(order.totalMinor, order.currency)}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'READY')}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Bell className="w-3.5 h-3.5" /> Order Ready 🔔
                        </button>
                      </div>
                    </div>
                  );
                })}

                {preparingOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-taupe-500">
                    Kitchen station free
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COLUMN 4: READY FOR PICKUP / PASS */}
          {(activeStageFilter === 'ALL' || activeStageFilter === 'READY') && (
            <div className="bg-[#120D0A] rounded-2xl border border-blue-900/40 flex flex-col max-h-[calc(100vh-125px)] shadow-lg ring-1 ring-blue-500/10">
              <div className="p-3.5 border-b border-espresso-800/90 flex items-center justify-between bg-gradient-to-r from-[#10141A] to-[#120D0A] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                  <h3 className="font-serif font-bold text-sm tracking-tight text-cream-50">
                    Pass / Ready for Table
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/80">
                  {readyOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {readyOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.placedAt);
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 bg-[#17110D] rounded-xl border-2 border-blue-500/70 shadow-lg space-y-2.5 animate-fade-in"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-mono font-bold text-base text-cream-50">
                            #{order.orderNumber}
                          </div>
                          <div className="text-xs font-bold text-amber-300 mt-0.5">
                            📍 {order.table?.name}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/60">
                          Plated
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-cream-200">
                        {order.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between">
                            <span>
                              <b className="font-mono text-blue-400 mr-1">{it.quantity}×</b> {it.dishName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-espresso-800 flex items-center justify-between">
                        <span className="font-mono text-xs text-taupe-300">
                          {formatCurrencyMinor(order.totalMinor, order.currency)}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" /> Serve to Table ✓
                        </button>
                      </div>
                    </div>
                  );
                })}

                {readyOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-taupe-500">
                    No dishes on the pass
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COLUMN 5: SERVED & CLOSE-OUT */}
          {(activeStageFilter === 'ALL' || activeStageFilter === 'SERVED') && (
            <div className="bg-[#120D0A] rounded-2xl border border-espresso-800/90 flex flex-col max-h-[calc(100vh-125px)] shadow-lg">
              <div className="p-3.5 border-b border-espresso-800/90 flex items-center justify-between bg-gradient-to-r from-[#18110D] to-[#130D09] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="font-serif font-bold text-sm tracking-tight text-cream-50">
                    Served Table
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  {servedOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {servedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-[#17110D] rounded-xl border border-espresso-800 shadow space-y-2 opacity-95 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="font-mono font-bold text-base text-cream-50">
                          #{order.orderNumber}
                        </div>
                        <div className="text-xs text-taupe-400 mt-0.5">📍 {order.table?.name}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        Dining
                      </span>
                    </div>

                    <div className="pt-2 border-t border-espresso-800 flex items-center justify-between">
                      <span className="font-mono text-xs text-taupe-300">
                        {formatCurrencyMinor(order.totalMinor, order.currency)}
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        className="px-3 py-1 rounded-xl bg-espresso-800 hover:bg-espresso-700 text-cream-200 text-xs font-semibold transition-colors"
                      >
                        Complete Ticket
                      </button>
                    </div>
                  </div>
                ))}

                {servedOrders.length === 0 && (
                  <div className="py-16 text-center text-xs text-taupe-500">
                    No active tables served
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}