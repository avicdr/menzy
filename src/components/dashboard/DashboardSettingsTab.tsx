'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Mail,
  Percent,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  Wifi,
} from 'lucide-react';
import {
  DEFAULT_ORDER_EXTENSION_MINUTES,
  DEFAULT_SCAN_TIMEOUT_MINUTES,
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
} from '@/lib/orders/tax-config';
import {
  clearAllDashboardSessionCaches,
  invalidateRestaurantSessionCache,
} from '@/lib/cache/dashboard-session-cache';

const GooglePlacesModal = dynamic(
  () => import('@/components/dashboard/GooglePlacesModal').then((m) => m.GooglePlacesModal),
  { ssr: false }
);

interface DashboardSettingsTabProps {
  restaurant: any;
  setRestaurant: React.Dispatch<React.SetStateAction<any>>;
  settingsForm: {
    displayName: string;
    description: string;
    address: string;
    city: string;
    country: string;
    currency: string;
    timezone: string;
    phone: string;
    email: string;
    googleReviewUrl: string;
    coverUrl: string;
    logoUrl?: string;
    showLogo?: boolean;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  wifiForm: {
    enabled: boolean;
    ssid: string;
    password: string;
    security: 'WPA' | 'WEP' | 'nopass';
  };
  setWifiForm: React.Dispatch<React.SetStateAction<any>>;
  tableSessionForm: {
    scanTimeoutMinutes: string;
    orderExtensionMinutes: string;
  };
  setTableSessionForm: React.Dispatch<React.SetStateAction<any>>;
  taxForm: {
    taxPercentage: string;
    serviceChargePercentage: string;
  };
  setTaxForm: React.Dispatch<React.SetStateAction<any>>;
  bannerDimensions: { width: number; height: number } | null;
  isUploadingBanner: boolean;
  bannerError: string | null;
  bannerToast: string | null;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBanner: () => void;
  isUploadingLogo?: boolean;
  logoError?: string | null;
  logoToast?: string | null;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo?: () => void;
  onToggleShowLogo?: (enabled: boolean) => void;
  supportEmail: string;
  supportMailHref: string;
  onSubscriptionExpired: (payload?: any) => void;
}

export function DashboardSettingsTab({
  restaurant,
  setRestaurant,
  settingsForm,
  setSettingsForm,
  wifiForm,
  setWifiForm,
  tableSessionForm,
  setTableSessionForm,
  taxForm,
  setTaxForm,
  bannerDimensions,
  isUploadingBanner,
  bannerError,
  bannerToast,
  onBannerUpload,
  onRemoveBanner,
  isUploadingLogo,
  logoError,
  logoToast,
  onLogoUpload,
  onRemoveLogo,
  onToggleShowLogo,
  supportEmail,
  supportMailHref,
  onSubscriptionExpired,
}: DashboardSettingsTabProps) {
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPlacesModalOpen, setIsPlacesModalOpen] = useState(false);

  const handleSaveRestaurantSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    if (wifiForm.enabled && !wifiForm.ssid.trim()) {
      setSettingsError(
        'Please enter your Wi-Fi Network Name (SSID) or disable Guest Free Wi-Fi.'
      );
      return;
    }

    const parsedTableSession = normalizeTableSessionConfigInput({
      scanTimeoutMinutes: tableSessionForm.scanTimeoutMinutes.trim(),
      orderExtensionMinutes: tableSessionForm.orderExtensionMinutes.trim(),
    });
    if (!parsedTableSession.ok) {
      setSettingsError(parsedTableSession.error);
      return;
    }

    const parsedTax = normalizeTaxPercentageInput(taxForm.taxPercentage.trim());
    if (!parsedTax.ok) {
      setSettingsError(parsedTax.error);
      return;
    }

    const parsedServiceCharge = normalizeServiceChargeInput(
      taxForm.serviceChargePercentage.trim()
    );
    if (!parsedServiceCharge.ok) {
      setSettingsError(parsedServiceCharge.error);
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          ...settingsForm,
          taxPercentage: parsedTax.taxPercentage,
          serviceChargePercentage: parsedServiceCharge.serviceChargePercentage,
          tableSession: parsedTableSession.tableSession,
          wifi: {
            enabled: wifiForm.enabled,
            ssid: wifiForm.ssid.trim(),
            password: wifiForm.security === 'nopass' ? '' : wifiForm.password,
            security: wifiForm.security,
          },
        }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        clearAllDashboardSessionCaches();
        onSubscriptionExpired(payload);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRestaurant(data.restaurant);
        if (data.wifi) {
          setWifiForm({
            enabled: Boolean(data.wifi.enabled),
            ssid: data.wifi.ssid || '',
            password: data.wifi.password || '',
            security: ['WPA', 'WEP', 'nopass'].includes(data.wifi.security)
              ? data.wifi.security
              : 'WPA',
          });
        }
        if (data.tableSession) {
          setTableSessionForm({
            scanTimeoutMinutes: String(data.tableSession.scanTimeoutMinutes),
            orderExtensionMinutes: String(data.tableSession.orderExtensionMinutes),
          });
        }
        if (
          data.taxPercentage !== undefined ||
          data.serviceChargePercentage !== undefined
        ) {
          setTaxForm({
            taxPercentage: String(data.taxPercentage ?? parsedTax.taxPercentage),
            serviceChargePercentage: String(
              data.serviceChargePercentage ?? parsedServiceCharge.serviceChargePercentage
            ),
          });
        }
        invalidateRestaurantSessionCache(restaurant.id, [
          'restaurantSettings',
          'orderingSettings',
          'authMe',
        ]);
        setSettingsSavedToast(true);
        setTimeout(() => setSettingsSavedToast(false), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSettingsError(errData.error || 'Failed to update restaurant settings');
      }
    } catch {
      setSettingsError('Error updating restaurant settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-espresso-900">Restaurant Settings</h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Manage restaurant profile, tax percentage, banner image, guest Wi-Fi credentials, address, currency, and review links.
          </p>
        </div>

        <button
          type="submit"
          form="settings-form"
          disabled={isSavingSettings}
          className="px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-terracotta" />
          {isSavingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {settingsError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{settingsError}</span>
        </div>
      )}

      {settingsSavedToast && (
        <div className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-sage-600" />
          Restaurant settings saved and public cache updated!
        </div>
      )}

      <form id="settings-form" onSubmit={handleSaveRestaurantSettings} className="space-y-6">
        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <h3 className="font-serif text-lg font-bold text-espresso-900">Restaurant Identity</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Restaurant Display Name *
              </label>
              <input
                type="text"
                required
                value={settingsForm.displayName}
                onChange={(e) => setSettingsForm({ ...settingsForm, displayName: e.target.value })}
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Tagline / Description
              </label>
              <input
                type="text"
                value={settingsForm.description}
                onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                placeholder="e.g. Modern Indian Craft Kitchen & Chai Bar"
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">Country</label>
              <select
                value={settingsForm.country}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  const newCurrency = newCountry === 'US' ? 'USD' : 'INR';
                  const newTz = newCountry === 'US' ? 'America/New_York' : 'Asia/Kolkata';
                  setSettingsForm({
                    ...settingsForm,
                    country: newCountry,
                    currency: newCurrency,
                    timezone: newTz,
                  });
                }}
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white"
              >
                <option value="IN">India (IN)</option>
                <option value="US">United States (US)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">Currency</label>
              <select
                value={settingsForm.currency}
                onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">City</label>
              <input
                type="text"
                value={settingsForm.city}
                onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-terracotta/15 text-terracotta flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-espresso-900">
                  Taxes &amp; Billing Charges
                </h3>
                <p className="text-xs text-taupe-500">
                  Configure the tax percentage and optional service charge applied to diner table orders.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-cream-100 text-espresso-900 border border-cream-300 shrink-0 self-start sm:self-center">
              {taxForm.taxPercentage !== '' ? taxForm.taxPercentage : DEFAULT_TAX_PERCENTAGE}% tax
              {Number(taxForm.serviceChargePercentage) > 0
                ? ` • ${taxForm.serviceChargePercentage}% service`
                : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-tax-percentage"
                className="block text-xs font-semibold text-taupe-600 mb-1"
              >
                Tax Percentage (GST / Sales Tax %)
              </label>
              <div className="relative">
                <input
                  id="settings-tax-percentage"
                  type="number"
                  min={MIN_TAX_PERCENTAGE}
                  max={MAX_TAX_PERCENTAGE}
                  step="0.01"
                  required
                  value={taxForm.taxPercentage}
                  onChange={(e) => {
                    setSettingsError(null);
                    setTaxForm({
                      ...taxForm,
                      taxPercentage: e.target.value,
                    });
                  }}
                  placeholder={String(DEFAULT_TAX_PERCENTAGE)}
                  className="w-full px-3.5 py-2 pr-10 border border-cream-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
                <span className="text-xs font-mono text-taupe-500 absolute right-3.5 top-2.5">
                  %
                </span>
              </div>
              <p className="text-[11px] text-taupe-500 mt-1">
                Shown as Taxes ({taxForm.taxPercentage !== '' ? taxForm.taxPercentage : DEFAULT_TAX_PERCENTAGE}%) on diner bills. Enter 0 for tax-free or GST-inclusive menu prices.
              </p>
            </div>

            <div>
              <label
                htmlFor="settings-service-charge-percentage"
                className="block text-xs font-semibold text-taupe-600 mb-1"
              >
                Optional Service Charge (%)
              </label>
              <div className="relative">
                <input
                  id="settings-service-charge-percentage"
                  type="number"
                  min={MIN_SERVICE_CHARGE_PERCENTAGE}
                  max={MAX_SERVICE_CHARGE_PERCENTAGE}
                  step="0.01"
                  required
                  value={taxForm.serviceChargePercentage}
                  onChange={(e) => {
                    setSettingsError(null);
                    setTaxForm({
                      ...taxForm,
                      serviceChargePercentage: e.target.value,
                    });
                  }}
                  placeholder={String(DEFAULT_SERVICE_CHARGE_PERCENTAGE)}
                  className="w-full px-3.5 py-2 pr-10 border border-cream-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
                <span className="text-xs font-mono text-taupe-500 absolute right-3.5 top-2.5">
                  %
                </span>
              </div>
              <p className="text-[11px] text-taupe-500 mt-1">
                Leave at 0 if your restaurant does not add a separate service charge.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso-900">
                QR Landing Banner Image
              </h3>
              <p className="text-xs text-taupe-500 mt-0.5">
                Displayed at the top of your restaurant&apos;s diner QR landing card above your menu and quick actions.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-900 shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
              Recommended: 1200 × 600 px (2:1 Landscape)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-espresso-800">
            <span>
              <strong className="text-espresso-900">Ideal Size:</strong> 1200 × 600 px (2:1 wide banner)
            </span>
            <span>
              <strong className="text-espresso-900">Minimum:</strong> 800 × 400 px
            </span>
            <span>
              <strong className="text-espresso-900">Formats:</strong> JPG, PNG, WebP (Max 5 MB)
            </span>
          </div>

          {bannerError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bannerError}</span>
            </div>
          )}

          {bannerToast && (
            <div className="p-3 rounded-2xl bg-sage-50 border border-sage-200 text-xs sm:text-sm text-sage-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>{bannerToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-cream-300 bg-cream-100 aspect-[2/1] flex items-center justify-center relative">
                {settingsForm.coverUrl ? (
                  <img
                    src={settingsForm.coverUrl}
                    alt="Restaurant QR landing banner preview"
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className="text-center p-4 space-y-1">
                    <ImageIcon className="w-7 h-7 text-taupe-400 mx-auto" />
                    <p className="text-xs font-semibold text-taupe-600">No banner uploaded yet</p>
                    <p className="text-[11px] text-taupe-400">
                      Preview canvas • 1200 × 600 px (2:1)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs">
                  {isUploadingBanner ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-terracotta" />
                  ) : (
                    <Upload className="w-4 h-4 text-terracotta" />
                  )}
                  <span>
                    {isUploadingBanner
                      ? 'Uploading Banner...'
                      : settingsForm.coverUrl
                      ? 'Upload New Banner'
                      : 'Upload Banner Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingBanner}
                    onChange={onBannerUpload}
                    className="hidden"
                  />
                </label>

                {settingsForm.coverUrl && (
                  <button
                    type="button"
                    disabled={isUploadingBanner}
                    onClick={onRemoveBanner}
                    className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Banner
                  </button>
                )}
              </div>

              {bannerDimensions && (
                <p
                  className={`text-xs font-medium ${
                    bannerDimensions.width < 800 ||
                    bannerDimensions.height < 400 ||
                    bannerDimensions.width <= bannerDimensions.height
                      ? 'text-amber-700'
                      : 'text-sage-700'
                  }`}
                >
                  Detected resolution:{' '}
                  <strong>
                    {bannerDimensions.width} × {bannerDimensions.height} px
                  </strong>
                  {(bannerDimensions.width < 800 ||
                    bannerDimensions.height < 400 ||
                    bannerDimensions.width <= bannerDimensions.height) &&
                    ' — Tip: Use at least 800 × 400 px in wide 2:1 landscape (1200 × 600 px ideal) for best fit without cropping.'}
                </p>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-taupe-500 mb-1">
                  Or paste Banner Image URL (1200 × 600 px recommended)
                </label>
                <input
                  type="text"
                  value={settingsForm.coverUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, coverUrl: e.target.value })}
                  placeholder="/uploads/banners/... or https://..."
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Logo & Menu Header Display Card */}
        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso-900">
                Restaurant Logo &amp; Menu Header
              </h3>
              <p className="text-xs text-taupe-500 mt-0.5">
                Customize your brand logo, upload a custom insignia, or disable the logo view completely on the menu.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-900 shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
              Recommended: 400 × 400 px (1:1 Square)
            </span>
          </div>

          {/* Visibility Toggle Card */}
          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-espresso-900">
                Display Logo on Diner Menu
              </span>
              <p className="text-[11px] text-taupe-600">
                When enabled, your logo (or initial badge) appears beside your restaurant name on the QR landing hub and visual menu. When disabled, the logo badge is completely hidden for a minimalist, typography-first menu header.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settingsForm.showLogo !== false}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setSettingsForm((prev: any) => ({ ...prev, showLogo: nextVal }));
                  if (onToggleShowLogo) {
                    onToggleShowLogo(nextVal);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta"></div>
              <span className="ml-2.5 text-xs font-semibold text-espresso-900">
                {settingsForm.showLogo !== false ? 'Visible on Menu' : 'Disabled / Hidden'}
              </span>
            </label>
          </div>

          {logoError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{logoError}</span>
            </div>
          )}

          {logoToast && (
            <div className="p-3 rounded-2xl bg-sage-50 border border-sage-200 text-xs sm:text-sm text-sage-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>{logoToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Logo Preview Canvas */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl border border-cream-300 bg-cream-100 min-h-[160px] relative">
              {settingsForm.logoUrl ? (
                <div className={`relative ${settingsForm.showLogo === false ? 'opacity-40 grayscale' : ''}`}>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-cream-300 bg-white shadow-sm flex items-center justify-center">
                    <img
                      src={settingsForm.logoUrl}
                      alt="Restaurant logo preview"
                      className="w-full h-full object-cover block"
                    />
                  </div>
                  {settingsForm.showLogo === false && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-espresso-900 text-white text-[9px] font-mono font-bold uppercase tracking-wider shadow">
                      Hidden on Menu
                    </span>
                  )}
                </div>
              ) : (
                <div className={`text-center space-y-1.5 ${settingsForm.showLogo === false ? 'opacity-40' : ''}`}>
                  <div className="w-16 h-16 rounded-full bg-terracotta text-white font-serif font-bold text-2xl flex items-center justify-center shadow-sm mx-auto">
                    {restaurant.displayName?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                  <p className="text-[11px] font-semibold text-taupe-600">Default Initial Badge</p>
                  <p className="text-[10px] text-taupe-400">
                    {settingsForm.showLogo === false ? 'Hidden on Menu' : 'Used when no image uploaded'}
                  </p>
                </div>
              )}
            </div>

            {/* Logo Actions */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs">
                  {isUploadingLogo ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-terracotta" />
                  ) : (
                    <Upload className="w-4 h-4 text-terracotta" />
                  )}
                  <span>
                    {isUploadingLogo
                      ? 'Uploading Logo...'
                      : settingsForm.logoUrl
                      ? 'Upload New Logo'
                      : 'Upload Logo Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingLogo}
                    onChange={onLogoUpload}
                    className="hidden"
                  />
                </label>

                {settingsForm.logoUrl && (
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={onRemoveLogo}
                    className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Logo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-taupe-500 mb-1">
                  Or paste Logo Image URL (Square 1:1 or SVG)
                </label>
                <input
                  type="text"
                  value={settingsForm.logoUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                  placeholder="/images/... or /uploads/logos/... or https://..."
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
              </div>

              <p className="text-[11px] text-taupe-500">
                Recommended: 400 × 400 px square PNG, JPG, or WebP with transparent or solid background.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-espresso-900">
                  Table QR Session Timers &amp; Auto-Expiry
                </h3>
                <p className="text-xs text-taupe-500">
                  Set how long a scanned table QR link remains active before guests must rescan.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200 shrink-0 self-start sm:self-center">
              {tableSessionForm.scanTimeoutMinutes || DEFAULT_SCAN_TIMEOUT_MINUTES}m scan • +
              {tableSessionForm.orderExtensionMinutes || DEFAULT_ORDER_EXTENSION_MINUTES}m order
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Initial QR Scan Timeout (Minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_TABLE_SESSION_MINUTES}
                  max={MAX_TABLE_SESSION_MINUTES}
                  step={1}
                  required
                  value={tableSessionForm.scanTimeoutMinutes}
                  onChange={(e) => {
                    setSettingsError(null);
                    setTableSessionForm({
                      ...tableSessionForm,
                      scanTimeoutMinutes: e.target.value,
                    });
                  }}
                  className="w-full px-3.5 py-2 pr-14 border border-cream-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
                <span className="text-[11px] font-mono text-taupe-500 absolute right-3.5 top-2.5">
                  min
                </span>
              </div>
              <p className="text-[11px] text-taupe-500 mt-1">
                After scanning a table QR, guests have this many minutes to place an order before they must rescan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Post-Order Extension Time (Minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_TABLE_SESSION_MINUTES}
                  max={MAX_TABLE_SESSION_MINUTES}
                  step={1}
                  required
                  value={tableSessionForm.orderExtensionMinutes}
                  onChange={(e) => {
                    setSettingsError(null);
                    setTableSessionForm({
                      ...tableSessionForm,
                      orderExtensionMinutes: e.target.value,
                    });
                  }}
                  className="w-full px-3.5 py-2 pr-14 border border-cream-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
                />
                <span className="text-[11px] font-mono text-taupe-500 absolute right-3.5 top-2.5">
                  min
                </span>
              </div>
              <p className="text-[11px] text-taupe-500 mt-1">
                Whenever an order is placed, the timer extends by this many minutes so guests can order additional items before expiring.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-espresso-900">
                  Guest Free Wi-Fi Access
                </h3>
                <p className="text-xs text-taupe-500">
                  Share Wi-Fi on your QR landing hub with 1-tap camera QR connect &amp; password copy.
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 self-start sm:self-center ${
                wifiForm.enabled && wifiForm.ssid.trim()
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-cream-100 text-taupe-600 border border-cream-200'
              }`}
            >
              {wifiForm.enabled && wifiForm.ssid.trim() ? 'Shown to Diners' : 'Hidden on QR Hub'}
            </span>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-cream-300 bg-cream-50/60 cursor-pointer hover:border-emerald-400 transition-colors">
            <input
              type="checkbox"
              checked={wifiForm.enabled}
              onChange={(e) => {
                setSettingsError(null);
                setWifiForm({ ...wifiForm, enabled: e.target.checked });
              }}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-cream-300 focus:ring-emerald-500"
            />
            <div>
              <div className="font-semibold text-xs sm:text-sm text-espresso-900">
                Offer Free Guest Wi-Fi on QR Landing Page
              </div>
              <div className="text-[11px] text-taupe-500 mt-0.5">
                Displays a &ldquo;Connect to Wi-Fi&rdquo; action card when diners scan any table QR code.
              </div>
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Network Name (SSID) {wifiForm.enabled ? '*' : ''}
              </label>
              <input
                type="text"
                value={wifiForm.ssid}
                onChange={(e) => {
                  setSettingsError(null);
                  setWifiForm({ ...wifiForm, ssid: e.target.value });
                }}
                placeholder="e.g. SoilToSoul_Guest"
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Wi-Fi Password
              </label>
              <input
                type="text"
                disabled={wifiForm.security === 'nopass'}
                value={wifiForm.security === 'nopass' ? '' : wifiForm.password}
                onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                placeholder={
                  wifiForm.security === 'nopass'
                    ? 'Open network (no password)'
                    : 'Enter guest Wi-Fi password'
                }
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-terracotta disabled:bg-cream-100 disabled:text-taupe-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Security Type
              </label>
              <select
                value={wifiForm.security}
                onChange={(e) =>
                  setWifiForm({
                    ...wifiForm,
                    security: (e.target.value as 'WPA' | 'WEP' | 'nopass') || 'WPA',
                  })
                }
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
              >
                <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                <option value="WEP">WEP (Legacy)</option>
                <option value="nopass">None (Open Network)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
          <h3 className="font-serif text-lg font-bold text-espresso-900">Location &amp; Contact</h3>

          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">
              Full Street Address
            </label>
            <input
              type="text"
              value={settingsForm.address}
              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              placeholder="e.g. 12, Indiranagar 100ft Road, Bengaluru, Karnataka 560038"
              className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                placeholder="hello@restaurant.com"
                className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">
              Google Maps / Review Link
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={settingsForm.googleReviewUrl}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, googleReviewUrl: e.target.value })
                }
                placeholder="https://search.google.com/local/writereview?placeid=... or g.page/..."
                className="flex-1 px-3.5 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-terracotta font-mono"
              />
              <button
                type="button"
                onClick={() => setIsPlacesModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Maps</span>
              </button>
            </div>
            <p className="text-[11px] text-taupe-500 mt-1">
              When diners tap &quot;Leave a Review&quot;, this link opens directly. Search maps to auto-locate your place.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-taupe-600">
          <span>Need help configuring your menu, tables, or QR timers? Email for setup queries:</span>
          <a
            href={supportMailHref}
            className="inline-flex items-center gap-1.5 font-mono font-bold text-espresso-900 hover:text-terracotta shrink-0"
          >
            <Mail className="w-3.5 h-3.5 text-terracotta" />
            <span>{supportEmail}</span>
          </a>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingSettings}
            className="px-5 py-2.5 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-terracotta" />
            {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {isPlacesModalOpen && (
        <GooglePlacesModal
          isOpen={isPlacesModalOpen}
          onClose={() => setIsPlacesModalOpen(false)}
          restaurantId={restaurant.id}
          initialQuery={`${settingsForm.displayName || restaurant.displayName} ${
            settingsForm.city || restaurant.city || ''
          }`.trim()}
          onSelectReviewUrl={(url) => setSettingsForm({ ...settingsForm, googleReviewUrl: url })}
        />
      )}
    </div>
  );
}

