'use client';

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { FssaiMarker } from '@/components/diner/DietaryBadge';
import { formatCurrencyMinor } from '@/lib/payments/plans';

interface DashboardAnalyticsTabProps {
  restaurant: any;
  menuItems: any[];
  analyticsData: any;
  analyticsLoading: boolean;
  analyticsError: string | null;
  isIndianRestaurant: boolean;
  onRefreshAnalytics: (restaurantId: string) => void;
  onNavigate: (url: string) => void;
}

export function DashboardAnalyticsTab({
  restaurant,
  menuItems,
  analyticsData,
  analyticsLoading,
  analyticsError,
  isIndianRestaurant,
  onRefreshAnalytics,
  onNavigate,
}: DashboardAnalyticsTabProps) {
  const fallbackTotalItems = menuItems.length;
  const fallbackCounts = menuItems.reduce(
    (acc, item) => {
      const tags = ((item.dietaryStatus as string[]) || []).map((t: string) =>
        String(t).toUpperCase()
      );
      const hasVeg = tags.some((t) => ['VEG', 'VEGETARIAN', 'PURE_VEG'].includes(t));
      const hasNonVeg = tags.some((t) => ['NON_VEG', 'NON-VEG', 'NONVEG'].includes(t));
      const hasEgg = tags.some((t) => ['EGG', 'CONTAINS_EGG', 'EGGETARIAN'].includes(t));
      const hasVegan = tags.includes('VEGAN');
      const hasGf = tags.includes('GLUTEN_FREE') || tags.includes('GF');
      const hasDf = tags.includes('DAIRY_FREE') || tags.includes('DF');
      if (hasVeg) acc.veg++;
      if (hasNonVeg) acc.nonVeg++;
      if (hasEgg) acc.egg++;
      if (hasVegan) acc.vegan++;
      if (hasVeg || hasVegan) acc.vegetarianOrVegan++;
      if (hasGf) acc.glutenFree++;
      if (hasDf) acc.dairyFree++;
      return acc;
    },
    { veg: 0, nonVeg: 0, egg: 0, vegetarianOrVegan: 0, vegan: 0, glutenFree: 0, dairyFree: 0 }
  );

  const dietary = analyticsData?.dietary ?? {
    totalItems: fallbackTotalItems,
    ...fallbackCounts,
  };
  const dietaryTotal = dietary.totalItems || 0;
  const pctOfMenu = (count: number) =>
    dietaryTotal > 0 ? Math.min(100, Math.round((count / dietaryTotal) * 100)) : 0;

  const totalScans = analyticsData?.scans?.total ?? 0;
  const scansToday = analyticsData?.scans?.today ?? 0;
  const scans30Days = analyticsData?.scans?.last30Days ?? 0;
  const chatQueries30Days = analyticsData?.aiUsage?.chatQueries30Days ?? 0;
  const chatQueriesTotal = analyticsData?.aiUsage?.chatQueriesTotal ?? 0;
  const dishViews30Days = analyticsData?.dishViews?.last30Days ?? 0;
  const viewsPerScan = analyticsData?.dishViews?.viewsPerScan30Days;
  const orders30Days = analyticsData?.orders?.total30Days ?? 0;
  const revenueMinor30Days = analyticsData?.orders?.revenueMinor30Days ?? 0;
  const scanToOrderRate = analyticsData?.orders?.scanToOrderRatePercent ?? 0;
  const bestsellerShare = analyticsData?.orders?.bestsellerSharePercent;
  const topDishes: any[] = Array.isArray(analyticsData?.topDishes)
    ? analyticsData.topDishes
    : [];
  const currency = analyticsData?.currency || restaurant.currency;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl font-bold text-espresso-900">
            Dining &amp; Menu Analytics
          </h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Live diner QR scans, AI concierge questions, dish views, and menu composition across the last 30 days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-cream-50 border border-cream-200 text-xs text-taupe-600 font-medium">
            Last 30 Days
          </span>
          <button
            type="button"
            onClick={() => onNavigate(`/dashboard/${restaurant.id}?tab=orders&subtab=analytics`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream-50 border border-cream-200 text-xs font-semibold text-espresso-800 hover:bg-cream-100 transition-colors"
          >
            <span>Ordering Analytics</span>
            <ArrowRight className="w-3.5 h-3.5 text-terracotta" />
          </button>
          <button
            type="button"
            onClick={() => onRefreshAnalytics(restaurant.id)}
            disabled={analyticsLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {analyticsError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-900"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{analyticsError}</span>
          </div>
          <button
            type="button"
            onClick={() => onRefreshAnalytics(restaurant.id)}
            className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {analyticsLoading && !analyticsData ? (
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          aria-label="Loading analytics metrics"
        >
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3 animate-pulse"
            >
              <div className="h-3 w-24 bg-cream-200 rounded" />
              <div className="h-8 w-16 bg-cream-200 rounded" />
              <div className="h-3 w-32 bg-cream-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                Total QR Scans
              </span>
              <div className="text-3xl font-bold text-espresso-900 mt-2 tabular-nums">
                {totalScans}
              </div>
              <div
                className={`text-xs mt-1 flex items-center gap-1 ${
                  scansToday > 0 ? 'text-sage-700' : 'text-taupe-500'
                }`}
              >
                {totalScans > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      +{scansToday} today • {scans30Days} in 30d
                    </span>
                  </>
                ) : (
                  <span>No QR scans recorded yet</span>
                )}
              </div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                AI Questions Asked
              </span>
              <div className="text-3xl font-bold text-espresso-900 mt-2 tabular-nums">
                {chatQueries30Days}
              </div>
              <div className="text-xs text-taupe-500 mt-1">
                {chatQueriesTotal > 0
                  ? `Last 30 days • ${chatQueriesTotal} total`
                  : 'No AI concierge queries yet'}
              </div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                Dish Detail Views
              </span>
              <div className="text-3xl font-bold text-terracotta mt-2 tabular-nums">
                {dishViews30Days}
              </div>
              <div className="text-xs text-taupe-500 mt-1">
                {viewsPerScan != null
                  ? `${viewsPerScan} views per QR scan (30d)`
                  : dishViews30Days > 0
                  ? 'Real dish detail clicks (30d)'
                  : 'No dish clicks recorded yet'}
              </div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-cream-200 shadow-soft">
              <span className="text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                Table Orders (30d)
              </span>
              <div className="text-3xl font-bold text-emerald-700 mt-2 tabular-nums">
                {orders30Days}
              </div>
              <div className="text-xs text-taupe-500 mt-1">
                {orders30Days > 0 ? (
                  <>
                    {formatCurrencyMinor(revenueMinor30Days, currency)}
                    {scans30Days > 0 ? ` • ${scanToOrderRate}% scan conversion` : ''}
                    {bestsellerShare != null ? ` • ${bestsellerShare}% featured` : ''}
                  </>
                ) : (
                  'No table orders placed yet'
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-espresso-900">
                    Dietary Distribution
                  </h3>
                  <p className="text-xs text-taupe-500">
                    Share of {dietaryTotal} active menu {dietaryTotal === 1 ? 'dish' : 'dishes'}
                  </p>
                </div>
              </div>

              {dietaryTotal === 0 ? (
                <div className="py-8 text-center text-xs text-taupe-500 bg-cream-50 rounded-2xl border border-cream-200 px-4 space-y-2">
                  <p>No menu items added yet.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/dashboard/${restaurant.id}?tab=menu`)}
                    className="font-semibold text-terracotta hover:underline"
                  >
                    Add dishes in Menu Studio →
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {isIndianRestaurant ? (
                    <>
                      {[
                        {
                          label: 'Pure Veg',
                          marker: 'VEG' as const,
                          count: dietary.veg || 0,
                          barClass: 'bg-green-600',
                        },
                        {
                          label: 'Non-Veg',
                          marker: 'NON_VEG' as const,
                          count: dietary.nonVeg || 0,
                          barClass: 'bg-[#7B3F00]',
                        },
                        {
                          label: 'Contains Egg',
                          marker: 'EGG' as const,
                          count: dietary.egg || 0,
                          barClass: 'bg-amber-500',
                        },
                      ].map((row) => {
                        const pct = pctOfMenu(row.count);
                        return (
                          <div key={row.label}>
                            <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                              <span className="flex items-center gap-1.5">
                                <FssaiMarker type={row.marker} /> {row.label}
                              </span>
                              <span className="tabular-nums">
                                {row.count} {row.count === 1 ? 'item' : 'items'} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                              <div
                                className={`h-full ${row.barClass} rounded-full transition-all duration-300`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {[
                        {
                          label: 'Vegetarian / Vegan',
                          count: dietary.vegetarianOrVegan || 0,
                          barClass: 'bg-emerald-600',
                        },
                        { label: 'Vegan', count: dietary.vegan || 0, barClass: 'bg-teal-600' },
                        {
                          label: 'Gluten-Free',
                          count: dietary.glutenFree || 0,
                          barClass: 'bg-amber-600',
                        },
                        {
                          label: 'Dairy-Free',
                          count: dietary.dairyFree || 0,
                          barClass: 'bg-sky-600',
                        },
                      ].map((row) => {
                        const pct = pctOfMenu(row.count);
                        return (
                          <div key={row.label}>
                            <div className="flex justify-between text-xs font-semibold text-espresso-800 mb-1">
                              <span>{row.label}</span>
                              <span className="tabular-nums">
                                {row.count} {row.count === 1 ? 'item' : 'items'} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                              <div
                                className={`h-full ${row.barClass} rounded-full transition-all duration-300`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
              <div>
                <h3
                  id="analytics-top-dishes-heading"
                  className="font-serif text-lg font-bold text-espresso-900"
                >
                  Top Engaged Dishes
                </h3>
                <p className="text-xs text-taupe-500">
                  Ranked by real dish card clicks, AI questions, and table orders in the last 30 days
                </p>
              </div>

              {topDishes.length === 0 ? (
                <div className="py-10 px-4 text-center bg-cream-50 rounded-2xl border border-cream-200 space-y-2.5">
                  <Utensils className="w-7 h-7 text-taupe-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-medium text-espresso-900">
                    No diner dish activity recorded yet
                  </p>
                  <p className="text-xs text-taupe-500 max-w-md mx-auto">
                    When guests view dish details, ask your AI waiter, or place table orders, your most engaged dishes will appear here automatically.
                  </p>
                  <a
                    href={`/m/${restaurant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline pt-1"
                  >
                    <span>Open Live Diner Menu</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="analytics-top-dishes-heading"
                  className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-terracotta/40 rounded-xl"
                >
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-cream-50 text-taupe-500 border-b border-cream-200 uppercase font-semibold text-[10px]">
                      <tr>
                        <th scope="col" className="py-2.5 px-3">
                          Dish
                        </th>
                        <th scope="col" className="py-2.5 px-3 text-center">
                          Views
                        </th>
                        <th scope="col" className="py-2.5 px-3 text-center">
                          AI Queries
                        </th>
                        <th scope="col" className="py-2.5 px-3 text-center">
                          Orders
                        </th>
                        <th scope="col" className="py-2.5 px-3 text-right">
                          Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {topDishes.map((item: any, idx: number) => {
                        const total = item.totalEngagement ?? item.interactions ?? 0;
                        const tierLabel =
                          total >= 10 ? 'Top Performer' : total >= 3 ? 'Trending' : 'Active';
                        const tierClass =
                          total >= 10
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : total >= 3
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-cream-100 text-espresso-700 border border-cream-200';
                        return (
                          <tr key={item.id || idx}>
                            <th scope="row" className="py-3 px-3 font-normal text-left">
                              <div className="font-semibold text-espresso-900">{item.name}</div>
                              {item.categoryName && (
                                <div className="text-[11px] text-taupe-500">
                                  {item.categoryName}
                                </div>
                              )}
                            </th>
                            <td className="py-3 px-3 text-center font-semibold text-espresso-800 tabular-nums">
                              {item.views ?? 0}
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-terracotta tabular-nums">
                              {item.chatQueries ?? 0}
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-emerald-700 tabular-nums">
                              {item.orders ?? 0}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tierClass}`}
                              >
                                {tierLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

