'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  History,
  ArrowLeft,
  Download,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Utensils,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { generateStaffTypographyVars } from '@/lib/theme/theme-presets';

export default function StaffOrderHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);

  // Filters
  const [range, setRange] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const loadHistory = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      // First ensure session is valid and get restaurant ID
      const autoRes = await fetch('/api/restaurants/_auto/orders');
      if (autoRes.status === 401) {
        router.push('/orders/login');
        return;
      }

      const autoData = await autoRes.json();
      setRestaurantData(autoData);

      const params = new URLSearchParams({
        range,
        page: String(page),
        pageSize: '25',
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const restId = autoData?.restaurantId || '_auto';
      const res = await fetch(`/api/restaurants/${restId}/orders/history?${params.toString()}`);
      if (res.ok) {
        const histData = await res.json();
        setOrders(histData.orders || []);
        setMetrics(histData.metrics || null);
        setPagination(histData.pagination || null);
        if (histData.restaurantTheme) {
          setRestaurantData((prev: any) => ({
            ...prev,
            restaurantTheme: histData.restaurantTheme,
          }));
        }
      }
    } catch (err: any) {
      console.error('History load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [range, statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHistory(true);
  };

  const handleExportCsv = () => {
    const restId = restaurantData?.restaurantId || '_auto';
    const params = new URLSearchParams({ range });
    if (statusFilter) params.append('status', statusFilter);
    window.open(`/api/restaurants/${restId}/orders/export?${params.toString()}`, '_blank');
  };

  const staffTypographyStyle = useMemo(
    () => generateStaffTypographyVars(restaurantData?.restaurantTheme),
    [restaurantData?.restaurantTheme]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0A08] text-cream-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif">Loading Historical Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={staffTypographyStyle}
      className="min-h-screen bg-[#0C0907] text-cream-100 flex flex-col font-sans selection:bg-terracotta selection:text-white"
    >
      {/* Header */}
      <header className="px-4 sm:px-6 py-3.5 bg-[#140E0A]/95 backdrop-blur-md border-b border-espresso-800 flex items-center justify-between gap-3 shrink-0 shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl text-taupe-400 hover:text-white hover:bg-espresso-800 transition-colors"
            title="Back to Live Kitchen Terminal"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-lg font-bold text-cream-50 leading-tight">Order History</h1>
            <p className="text-[11px] text-taupe-400">
              {restaurantData?.restaurantName || 'Restaurant Terminal'} • Historical Logs & Audit Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl bg-espresso-800 hover:bg-espresso-700 border border-espresso-700 text-cream-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <Link
            href="/orders"
            className="px-3.5 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Live Terminal</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800 shadow">
            <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">
              Total Filtered Orders
            </span>
            <div className="text-2xl font-bold font-mono text-cream-50 mt-1">
              {pagination?.totalCount || 0}
            </div>
          </div>
          <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800 shadow">
            <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">
              Recorded Order Value
            </span>
            <div className="text-2xl font-bold font-mono text-terracotta mt-1">
              {formatCurrencyMinor(metrics?.totalOrderValueMinor || 0, metrics?.currency || 'INR')}
            </div>
          </div>
          <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800 shadow">
            <span className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatCurrencyMinor(metrics?.averageOrderValueMinor || 0, metrics?.currency || 'INR')}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-taupe-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order number or dish name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ colorScheme: 'dark', backgroundColor: '#1A120D', color: '#FAF7F2' }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A120D] border border-espresso-700 text-xs text-cream-50 placeholder:text-taupe-500 focus:outline-none focus:border-terracotta dark-input"
            />
          </form>

          {/* Quick Date Range Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRange(r.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  range === r.id
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-espresso-800/80 text-taupe-300 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ colorScheme: 'dark', backgroundColor: '#1A120D', color: '#FAF7F2' }}
              className="px-3 py-1.5 rounded-xl bg-[#1A120D] border border-espresso-700 text-xs text-cream-50 focus:outline-none focus:border-terracotta dark-input ml-1"
            >
              <option value="" className="bg-[#1A120D] text-white">All Statuses</option>
              <option value="COMPLETED" className="bg-[#1A120D] text-white">Completed</option>
              <option value="SERVED" className="bg-[#1A120D] text-white">Served</option>
              <option value="READY" className="bg-[#1A120D] text-white">Ready</option>
              <option value="PREPARING" className="bg-[#1A120D] text-white">Preparing</option>
              <option value="ACCEPTED" className="bg-[#1A120D] text-white">Accepted</option>
              <option value="PLACED" className="bg-[#1A120D] text-white">Placed</option>
              <option value="REJECTED" className="bg-[#1A120D] text-white">Rejected</option>
              <option value="CANCELLED" className="bg-[#1A120D] text-white">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-4 sm:p-6 shadow-md">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order #</th>
                  <th className="py-3 px-4 font-semibold">Table</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Dishes Summary</th>
                  <th className="py-3 px-4 font-semibold">Total Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-espresso-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cream-50">#{o.orderNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-300">📍 {o.tableName}</td>
                    <td className="py-3.5 px-4 font-mono text-taupe-400 text-[11px]">
                      {new Date(o.placedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-cream-200 max-w-xs truncate" title={o.itemsSummary}>
                      {o.itemsSummary}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-terracotta">
                      {formatCurrencyMinor(o.totalMinor, o.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'COMPLETED' || o.status === 'SERVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/70'
                            : o.status === 'REJECTED' || o.status === 'CANCELLED'
                            ? 'bg-red-950 text-red-300 border border-red-800/70'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/70'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-taupe-400 font-mono text-[11px]">
                      {o.handledBy}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-taupe-400">
                      No historical orders found matching this filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pt-4 border-t border-espresso-800 flex items-center justify-between text-xs text-taupe-400">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-1.5 rounded-lg bg-espresso-800 hover:bg-espresso-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

