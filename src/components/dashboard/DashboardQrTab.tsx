'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

interface DashboardQrTabProps {
  restaurant: any;
  qrData: { qrDataUrl: string; targetUrl: string } | null;
  setQrData: React.Dispatch<
    React.SetStateAction<{ qrDataUrl: string; targetUrl: string } | null>
  >;
  isSubscriptionExpired: boolean;
  onSubscriptionExpired: (payload?: any) => void;
}

export function DashboardQrTab({
  restaurant,
  qrData,
  setQrData,
  isSubscriptionExpired,
  onSubscriptionExpired,
}: DashboardQrTabProps) {
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!restaurant?.slug || qrData || isSubscriptionExpired) return;
    let cancelled = false;
    setQrLoading(true);
    fetch(`/api/qr/generate?slug=${restaurant.slug}`, { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 402) {
          const payload = await res.json().catch(() => ({}));
          if (!cancelled) onSubscriptionExpired(payload);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((qData) => {
        if (!cancelled && qData) {
          setQrData(qData);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant?.slug, qrData, isSubscriptionExpired, onSubscriptionExpired, setQrData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft">
        <h2 className="font-serif text-xl font-bold text-espresso-900">QR Studio</h2>
        <p className="text-xs sm:text-sm text-taupe-500 mt-1">
          Generate high-resolution printable table tent QR art for your dining tables.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="p-8 bg-white rounded-3xl border border-cream-300 shadow-lifted flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-2xl font-bold">
            {restaurant.displayName?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-espresso-900">
              {restaurant.displayName}
            </h3>
            <p className="text-xs text-taupe-500 mt-0.5">See it. Ask it. Crave it.</p>
          </div>

          {qrData?.qrDataUrl ? (
            <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 shadow-inner">
              <img src={qrData.qrDataUrl} alt="Table QR" className="w-56 h-56 object-contain" />
            </div>
          ) : (
            <div className="w-56 h-56 bg-cream-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-xs text-taupe-500">
              {qrLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin motion-reduce:animate-none text-terracotta" />
                  <span>Generating QR...</span>
                </>
              ) : (
                <span>Preparing QR...</span>
              )}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-terracotta">
              Scan for Visual Menu &amp; AI Sommelier
            </p>
            <p className="text-[11px] text-taupe-400">No app installation or account required</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <h3 className="font-serif text-lg font-bold text-espresso-900">
            Printable Asset Exports
          </h3>
          <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed">
            Export vector SVG for professional offset printing or high-resolution PNG for tabletop displays.
          </p>

          <div className="space-y-3 pt-2">
            <a
              href={`/api/qr/generate?slug=${restaurant.slug}&format=svg`}
              download
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Print-Ready SVG
            </a>
            {qrData?.qrDataUrl && (
              <a
                href={qrData.qrDataUrl}
                download={`${restaurant.slug}-qr.png`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cream-100 border border-cream-300 text-espresso-800 font-semibold text-xs sm:text-sm hover:bg-cream-200 transition-colors"
              >
                <Download className="w-4 h-4" /> Download High-Res PNG
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

