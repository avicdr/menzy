'use client';

import React from 'react';

export interface AdminCostsTabProps {
  costsData: any;
  loading: boolean;
}

export function AdminCostsTab({ costsData, loading }: AdminCostsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800">
          <div className="text-[10px] text-taupe-400 uppercase font-mono">Gemini Vision Extraction</div>
          <div className="text-xl font-bold text-cream-50 mt-1 font-mono">~$0.0025 / page</div>
          <div className="text-[11px] text-taupe-400 mt-1">Gemini 1.5 Flash Vision parser</div>
        </div>
        <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800">
          <div className="text-[10px] text-taupe-400 uppercase font-mono">AI Diner Waiter Query</div>
          <div className="text-xl font-bold text-cream-50 mt-1 font-mono">~$0.0003 / prompt</div>
          <div className="text-[11px] text-taupe-400 mt-1">Gemini 1.5 Flash grounded assistant</div>
        </div>
        <div className="p-4 bg-[#140E0A] rounded-2xl border border-espresso-800">
          <div className="text-[10px] text-taupe-400 uppercase font-mono">3D Food Illustration Gen</div>
          <div className="text-xl font-bold text-cream-50 mt-1 font-mono">~$0.0400 / image</div>
          <div className="text-[11px] text-taupe-400 mt-1">Imagen 3 / Gemini image model</div>
        </div>
      </div>

      <div className="bg-[#140E0A] rounded-3xl border border-espresso-800 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-cream-50">Per-Restaurant Operational Margins</h3>
            <p className="text-xs text-taupe-400">Actual Gemini API expenditure versus subscription revenue</p>
          </div>
          <span className="text-xs font-mono text-terracotta">Real-time Margin Telemetry</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#19120E] text-taupe-400 uppercase text-[10px] tracking-wider border-b border-espresso-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Restaurant</th>
                <th className="py-3 px-4 font-semibold">Plan / Rev</th>
                <th className="py-3 px-4 font-semibold">AI Queries</th>
                <th className="py-3 px-4 font-semibold">Images Gen</th>
                <th className="py-3 px-4 font-semibold">AI Cost (USD)</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-800/60">
              {(costsData?.restaurants || []).map((item: any) => (
                <tr key={item.restaurantId} className="hover:bg-espresso-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-cream-50">{item.restaurantName}</td>
                  <td className="py-3.5 px-4 text-taupe-300 font-mono text-[11px]">{item.subscriptionPlan}</td>
                  <td className="py-3.5 px-4 text-cream-200 font-mono">{item.totalAiRequests}</td>
                  <td className="py-3.5 px-4 text-cream-200 font-mono">{item.imagesGenerated}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-terracotta">${item.aiOperatingCostUsd}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">${item.estimatedMarginUsd}</td>
                </tr>
              ))}
              {(costsData?.restaurants || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-taupe-400">
                    {!costsData && loading
                      ? 'Loading tenant AI operational margins...'
                      : 'No tenant operational cost records logged yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

