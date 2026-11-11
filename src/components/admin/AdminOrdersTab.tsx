'use client';

import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

export interface AdminOrdersTabProps {
  ordersData: any;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function AdminOrdersTab({
  ordersData,
  loading,
  refreshing,
  onRefresh,
}: AdminOrdersTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
          <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
            Total Platform Orders
          </div>
          <div className="text-3xl font-serif font-bold text-cream-50">
            {ordersData?.metrics?.totalOrders || 0}
          </div>
          <div className="text-xs text-taupe-400 mt-1">Across all tenant venues</div>
        </div>

        <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
          <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
            Active In-Flight Orders
          </div>
          <div className="text-3xl font-serif font-bold text-amber-400">
            {ordersData?.metrics?.activeOrdersCount || 0}
          </div>
          <div className="text-xs text-taupe-400 mt-1">Pending, cooking, or ready</div>
        </div>

        <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
          <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
            Platform Gross Volume
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-400">
            ₹{Math.round((ordersData?.metrics?.grossVolumeMinor || 0) / 100).toLocaleString()}
          </div>
          <div className="text-xs text-taupe-400 mt-1">Total dining GMV processed</div>
        </div>

        <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 shadow-md">
          <div className="text-[10px] font-semibold text-taupe-400 uppercase tracking-wider mb-1">
            Tables & Staff Terminals
          </div>
          <div className="text-3xl font-serif font-bold text-cream-50">
            {ordersData?.metrics?.totalTables || 0}{' '}
            <span className="text-sm font-sans font-normal text-taupe-400">
              / {ordersData?.metrics?.totalStaff || 0} staff
            </span>
          </div>
          <div className="text-xs text-taupe-400 mt-1">QR enabled dining points</div>
        </div>
      </div>

      {ordersData?.metrics?.statusBreakdown && (
        <div className="bg-[#140E0A] p-5 rounded-2xl border border-espresso-800/80 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-taupe-400 uppercase tracking-wider mr-2">
            Status Distribution:
          </span>
          {Object.entries(ordersData.metrics.statusBreakdown).map(([st, cnt]: [string, any]) => (
            <div
              key={st}
              className="px-3 py-1.5 rounded-xl bg-espresso-900 border border-espresso-700/60 text-xs flex items-center gap-2"
            >
              <span className="font-mono font-bold text-cream-50">{cnt}</span>
              <span className="text-taupe-400">{st}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-cream-50">
              Recent Platform Dine-In Orders
            </h3>
            <p className="text-xs text-taupe-400">
              Cross-tenant ordering activity and POS transactions
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl text-taupe-400 hover:text-cream-50 hover:bg-espresso-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {(!ordersData?.recentOrders || ordersData.recentOrders.length === 0) ? (
          <div className="py-12 text-center text-taupe-500 text-xs">
            {!ordersData && loading
              ? 'Loading cross-tenant orders...'
              : 'No orders recorded on the platform yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order #</th>
                  <th className="py-3 px-4 font-semibold">Restaurant Venue</th>
                  <th className="py-3 px-4 font-semibold">Table</th>
                  <th className="py-3 px-4 font-semibold">Items</th>
                  <th className="py-3 px-4 font-semibold">Bill Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso-800/60">
                {ordersData.recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-espresso-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cream-50">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-cream-100 flex items-center gap-1.5">
                        {ord.restaurant?.displayName || 'Restaurant'}
                        <a
                          href={`/m/${ord.restaurant?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-taupe-400 hover:text-terracotta"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-[10px] text-taupe-400">
                        {ord.restaurant?.city}, {ord.restaurant?.country}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-cream-200">
                      {ord.table?.name || 'Table'}
                      {ord.table?.section ? ` (${ord.table.section})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-taupe-300">
                      {ord._count?.items || 0} items
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      {ord.currency === 'USD' ? '$' : '₹'}
                      {(ord.totalMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'PLACED' || ord.status === 'ACCEPTED'
                            ? 'bg-amber-950 border border-amber-800/70 text-amber-300'
                            : ord.status === 'PREPARING'
                            ? 'bg-orange-950 border border-orange-800/70 text-orange-300'
                            : ord.status === 'READY'
                            ? 'bg-emerald-950 border border-emerald-800/70 text-emerald-300'
                            : ord.status === 'SERVED' || ord.status === 'COMPLETED'
                            ? 'bg-espresso-800 text-taupe-300'
                            : 'bg-red-950 border border-red-800/70 text-red-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-taupe-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(ord.placedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

