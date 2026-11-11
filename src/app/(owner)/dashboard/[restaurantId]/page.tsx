'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import {
  Upload,
  CheckCircle2,
  QrCode,
  ExternalLink,
  Camera,
  ArrowRight,
  TrendingUp,
  X,
  FileText,
  Clock,
  Lock,
  Mail,
  CreditCard,
} from 'lucide-react';
import { Portal } from '@/components/ui/Portal';
import {
  MENU_PDF_ACCEPT,
  MENU_PHOTO_ACCEPT,
} from '@/lib/menu/menu-file-validator';
import { formatCurrencyMinor, FREE_TRIAL_DAYS } from '@/lib/payments/plans';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';
import {
  DEFAULT_ORDER_EXTENSION_MINUTES,
  DEFAULT_SCAN_TIMEOUT_MINUTES,
} from '@/lib/diner/table-session-config';
import {
  DEFAULT_SERVICE_CHARGE_PERCENTAGE,
  DEFAULT_TAX_PERCENTAGE,
} from '@/lib/orders/tax-config';

const TabLoadingFallback = () => (
  <div className="p-10 bg-white rounded-3xl border border-cream-200 shadow-soft flex items-center justify-center min-h-[260px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-taupe-500 font-medium">Loading studio...</span>
    </div>
  </div>
);

const DashboardMenuTab = dynamic(
  () => import('@/components/dashboard/DashboardMenuTab').then((m) => m.DashboardMenuTab),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardIllustrationTab = dynamic(
  () =>
    import('@/components/dashboard/DashboardIllustrationTab').then(
      (m) => m.DashboardIllustrationTab
    ),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardThemeTab = dynamic(
  () => import('@/components/dashboard/DashboardThemeTab').then((m) => m.DashboardThemeTab),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardAiTab = dynamic(
  () => import('@/components/dashboard/DashboardAiTab').then((m) => m.DashboardAiTab),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardQrTab = dynamic(
  () => import('@/components/dashboard/DashboardQrTab').then((m) => m.DashboardQrTab),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardAnalyticsTab = dynamic(
  () =>
    import('@/components/dashboard/DashboardAnalyticsTab').then((m) => m.DashboardAnalyticsTab),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardSettingsTab = dynamic(
  () => import('@/components/dashboard/DashboardSettingsTab').then((m) => m.DashboardSettingsTab),
  { ssr: false, loading: TabLoadingFallback }
);
const DashboardBillingTab = dynamic(
  () => import('@/components/dashboard/DashboardBillingTab').then((m) => m.DashboardBillingTab),
  { ssr: false, loading: TabLoadingFallback }
);
const TablesManagementView = dynamic(
  () =>
    import('@/components/dashboard/TablesManagementView').then((m) => m.TablesManagementView),
  { ssr: false, loading: TabLoadingFallback }
);
const OrdersManagementView = dynamic(
  () =>
    import('@/components/dashboard/OrdersManagementView').then((m) => m.OrdersManagementView),
  { ssr: false, loading: TabLoadingFallback }
);
const StaffManagementView = dynamic(
  () => import('@/components/dashboard/StaffManagementView').then((m) => m.StaffManagementView),
  { ssr: false, loading: TabLoadingFallback }
);

export default function RestaurantDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-100">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RestaurantDashboardContent />
    </React.Suspense>
  );
}

function RestaurantDashboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const restaurantId = params?.restaurantId as string;
  const currentTab = searchParams.get('tab') || 'overview';
  const currentTabRef = React.useRef(currentTab);
  currentTabRef.current = currentTab;
  const rawSubTab = searchParams.get('subtab');
  const initialOrdersSubTab: 'live' | 'history' | 'analytics' | 'settings' =
    rawSubTab === 'analytics' || rawSubTab === 'history' || rawSubTab === 'settings'
      ? rawSubTab
      : 'live';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [billingUsage, setBillingUsage] = useState<any>(null);
  const [targetOrgAccess, setTargetOrgAccess] = useState<any>(null);
  const [expiredGate, setExpiredGate] = useState<any | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubscriptionExpired = useCallback((payload?: any) => {
    setExpiredGate((prev: any) =>
      payload && typeof payload === 'object'
        ? payload
        : prev || { paused: true, code: 'TRIAL_EXPIRED' }
    );
  }, []);

  // Raw config slices passed down to lazily loaded studio tabs
  const [rawTheme, setRawTheme] = useState<any>(null);
  const [rawSettings, setRawSettings] = useState<any>(null);

  // Shared Menu Upload / Extraction State (triggered from Overview empty state & Menu Studio)
  const [isUploadingMenu, setIsUploadingMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSuccess, setExtractionSuccess] = useState<string | null>(null);
  const [isDraggingMenuFiles, setIsDraggingMenuFiles] = useState(false);
  const menuPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const menuPdfInputRef = React.useRef<HTMLInputElement | null>(null);
  const [extractionToast, setExtractionToast] = useState<{
    id: number;
    title: string;
    subtitle?: string;
  } | null>(null);
  const extractionToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showExtractionToast = useCallback((title: string, subtitle?: string) => {
    if (extractionToastTimerRef.current) {
      clearTimeout(extractionToastTimerRef.current);
    }
    const id = Date.now();
    setExtractionToast({ id, title, subtitle });
    extractionToastTimerRef.current = setTimeout(() => {
      setExtractionToast((current) => (current?.id === id ? null : current));
    }, 5500);
  }, []);

  useEffect(() => {
    return () => {
      if (extractionToastTimerRef.current) {
        clearTimeout(extractionToastTimerRef.current);
      }
    };
  }, []);

  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Analytics State (Overview KPI card + Analytics tab)
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const analyticsRequestRef = React.useRef(0);

  const loadAnalytics = useCallback(
    async (targetRestaurantId: string) => {
      const reqId = ++analyticsRequestRef.current;
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);
        const res = await fetch(`/api/restaurant/analytics?restaurantId=${targetRestaurantId}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          if (analyticsRequestRef.current === reqId) {
            handleSubscriptionExpired(data);
          }
          return;
        }
        if (!res.ok || !data?.success) {
          throw new Error(data.error || 'Failed to load restaurant analytics');
        }
        if (analyticsRequestRef.current === reqId) {
          setAnalyticsData(data);
        }
      } catch (err: any) {
        if (analyticsRequestRef.current === reqId) {
          console.error('Analytics load error:', err);
          setAnalyticsError(err.message || 'Unable to load analytics data.');
        }
      } finally {
        if (analyticsRequestRef.current === reqId) {
          setAnalyticsLoading(false);
        }
      }
    },
    [handleSubscriptionExpired]
  );

  // Settings & Banner State (shared between Settings Tab & Theme Studio Banner section)
  const [settingsForm, setSettingsForm] = useState({
    displayName: '',
    description: '',
    address: '',
    city: '',
    country: 'IN',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    phone: '',
    email: '',
    googleReviewUrl: '',
    coverUrl: '',
  });
  const [wifiForm, setWifiForm] = useState<{
    enabled: boolean;
    ssid: string;
    password: string;
    security: 'WPA' | 'WEP' | 'nopass';
  }>({
    enabled: false,
    ssid: '',
    password: '',
    security: 'WPA',
  });
  const [tableSessionForm, setTableSessionForm] = useState<{
    scanTimeoutMinutes: string;
    orderExtensionMinutes: string;
  }>({
    scanTimeoutMinutes: String(DEFAULT_SCAN_TIMEOUT_MINUTES),
    orderExtensionMinutes: String(DEFAULT_ORDER_EXTENSION_MINUTES),
  });
  const [taxForm, setTaxForm] = useState<{
    taxPercentage: string;
    serviceChargePercentage: string;
  }>({
    taxPercentage: String(DEFAULT_TAX_PERCENTAGE),
    serviceChargePercentage: String(DEFAULT_SERVICE_CHARGE_PERCENTAGE),
  });
  const handleTaxSettingsUpdated = useCallback(
    (taxPercentage: number, serviceChargePercentage: number) => {
      setTaxForm({
        taxPercentage: String(taxPercentage),
        serviceChargePercentage: String(serviceChargePercentage),
      });
    },
    []
  );
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerToast, setBannerToast] = useState<string | null>(null);
  const [bannerDimensions, setBannerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Cached QR Studio State
  const [qrData, setQrData] = useState<{ qrDataUrl: string; targetUrl: string } | null>(null);

  // Progressive non-blocking background fetch state
  const [secondaryLoading, setSecondaryLoading] = useState({
    items: true,
    billing: true,
    settings: true,
  });
  const skipInitialSettingsEffectRef = React.useRef<string | null>(null);

  // Load session & restaurant details
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setAnalyticsData(null);
        setAnalyticsError(null);
        setQrData(null);
        setBillingUsage(null);
        setMenuItems([]);
        setRawTheme(null);
        setRawSettings(null);
        setSecondaryLoading({ items: true, billing: true, settings: true });

        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (cancelled) return;
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        if (cancelled) return;
        setCurrentUser(meData.user);

        // Find requested restaurant & owning organization
        let targetRest: any = null;
        let targetOrg: any = null;
        for (const org of meData.user.organizations || []) {
          for (const r of org.restaurants || []) {
            if (r.id === restaurantId || r.slug === restaurantId) {
              targetRest = r;
              targetOrg = org;
              break;
            }
          }
          if (targetRest) break;
        }

        if (!targetRest) {
          targetOrg = meData.user.organizations?.[0] || null;
          targetRest = targetOrg?.restaurants?.[0] || null;
        }

        if (!targetRest) {
          setSecondaryLoading({ items: false, billing: false, settings: false });
          return;
        }

        const initialAccess = targetOrg?.access || null;
        setTargetOrgAccess(initialAccess);
        setExpiredGate(
          initialAccess?.expired
            ? { paused: true, code: initialAccess.reason, ...initialAccess }
            : null
        );
        setCheckoutNotice(null);

        setRestaurant(targetRest);
        setSettingsForm({
          displayName: targetRest.displayName || '',
          description: targetRest.description || '',
          address: targetRest.address || '',
          city: targetRest.city || '',
          country: targetRest.country || 'IN',
          currency: targetRest.currency || 'INR',
          timezone: targetRest.timezone || 'Asia/Kolkata',
          phone: targetRest.phone || '',
          email: targetRest.email || '',
          googleReviewUrl: targetRest.googleReviewUrl || '',
          coverUrl: targetRest.coverUrl || '',
        });

        if (currentTabRef.current === 'settings') {
          skipInitialSettingsEffectRef.current = targetRest.id;
        }

        // Unblock dashboard shell immediately after core auth resolves
        setLoading(false);

        const loadItemsPromise = initialAccess?.expired
          ? (() => {
              setSecondaryLoading((prev) => ({ ...prev, items: false }));
              return Promise.resolve();
            })()
          : fetch(`/api/menus/items?restaurantId=${targetRest.id}`, { cache: 'no-store' })
              .then(async (res) => {
                if (res.status === 402) {
                  const payload = await res.json().catch(() => ({}));
                  if (!cancelled) handleSubscriptionExpired(payload);
                  return null;
                }
                return res.ok ? res.json() : null;
              })
              .then((itemsData) => {
                if (!cancelled && itemsData) {
                  setMenuItems(itemsData.items || []);
                }
              })
              .catch(() => {})
              .finally(() => {
                if (!cancelled) {
                  setSecondaryLoading((prev) => ({ ...prev, items: false }));
                }
              });

        const loadBillingPromise = fetch(`/api/billing/usage?restaurantId=${targetRest.id}`, {
          cache: 'no-store',
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((billData) => {
            if (!cancelled && billData) {
              setBillingUsage(billData);
              if (billData.access) {
                setTargetOrgAccess(billData.access);
                if (billData.access.expired) {
                  handleSubscriptionExpired({
                    paused: true,
                    code: billData.access.reason,
                    ...billData.access,
                  });
                } else {
                  setExpiredGate(null);
                }
              }
            }
          })
          .catch(() => {})
          .finally(() => {
            if (!cancelled) {
              setSecondaryLoading((prev) => ({ ...prev, billing: false }));
            }
          });

        const loadSettingsPromise = initialAccess?.expired
          ? (() => {
              setSecondaryLoading((prev) => ({ ...prev, settings: false }));
              return Promise.resolve();
            })()
          : fetch(`/api/restaurant/settings?restaurantId=${targetRest.id}`, { cache: 'no-store' })
              .then(async (res) => {
                if (res.status === 402) {
                  const payload = await res.json().catch(() => ({}));
                  if (!cancelled) handleSubscriptionExpired(payload);
                  return null;
                }
                return res.ok ? res.json() : null;
              })
              .then((rsData) => {
                if (cancelled || !rsData) return;

                if (rsData.theme) {
                  setRawTheme(rsData.theme);
                }

                if (rsData.settings) {
                  setRawSettings(rsData.settings);
                }

                if (rsData.wifi) {
                  setWifiForm({
                    enabled: Boolean(rsData.wifi.enabled),
                    ssid: rsData.wifi.ssid || '',
                    password: rsData.wifi.password || '',
                    security: ['WPA', 'WEP', 'nopass'].includes(rsData.wifi.security)
                      ? rsData.wifi.security
                      : 'WPA',
                  });
                }

                if (rsData.tableSession) {
                  setTableSessionForm({
                    scanTimeoutMinutes: String(
                      rsData.tableSession.scanTimeoutMinutes ?? DEFAULT_SCAN_TIMEOUT_MINUTES
                    ),
                    orderExtensionMinutes: String(
                      rsData.tableSession.orderExtensionMinutes ?? DEFAULT_ORDER_EXTENSION_MINUTES
                    ),
                  });
                }

                if (
                  rsData.taxPercentage !== undefined ||
                  rsData.serviceChargePercentage !== undefined
                ) {
                  setTaxForm({
                    taxPercentage: String(rsData.taxPercentage ?? DEFAULT_TAX_PERCENTAGE),
                    serviceChargePercentage: String(
                      rsData.serviceChargePercentage ?? DEFAULT_SERVICE_CHARGE_PERCENTAGE
                    ),
                  });
                }

                if (rsData.restaurant) {
                  setRestaurant(rsData.restaurant);
                  setSettingsForm({
                    displayName: rsData.restaurant.displayName || '',
                    description: rsData.restaurant.description || '',
                    address: rsData.restaurant.address || '',
                    city: rsData.restaurant.city || '',
                    country: rsData.restaurant.country || 'IN',
                    currency: rsData.restaurant.currency || 'INR',
                    timezone: rsData.restaurant.timezone || 'Asia/Kolkata',
                    phone: rsData.restaurant.phone || '',
                    email: rsData.restaurant.email || '',
                    googleReviewUrl: rsData.restaurant.googleReviewUrl || '',
                    coverUrl: rsData.restaurant.coverUrl || '',
                  });
                }
              })
              .catch(() => {})
              .finally(() => {
                if (!cancelled) {
                  setSecondaryLoading((prev) => ({ ...prev, settings: false }));
                }
              });

        await Promise.allSettled([loadItemsPromise, loadBillingPromise, loadSettingsPromise]);
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, router, handleSubscriptionExpired]);

  // Keep analytics metrics fresh whenever Overview or Analytics tab is active
  useEffect(() => {
    if (
      (currentTab === 'analytics' || currentTab === 'overview') &&
      restaurant?.id &&
      !expiredGate &&
      !targetOrgAccess?.expired
    ) {
      loadAnalytics(restaurant.id);
    }
  }, [currentTab, restaurant?.id, loadAnalytics, expiredGate, targetOrgAccess?.expired]);

  // Keep table session timers, Wi-Fi & profile settings fresh whenever owner navigates to Settings tab
  useEffect(() => {
    if (currentTab !== 'settings' || !restaurant?.id || expiredGate || targetOrgAccess?.expired) {
      return;
    }
    if (skipInitialSettingsEffectRef.current === restaurant.id) {
      skipInitialSettingsEffectRef.current = null;
      return;
    }

    fetch(`/api/restaurant/settings?restaurantId=${restaurant.id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 402) {
          const payload = await res.json().catch(() => ({}));
          handleSubscriptionExpired(payload);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((rsData) => {
        if (!rsData) return;
        if (rsData.wifi) {
          setWifiForm({
            enabled: Boolean(rsData.wifi.enabled),
            ssid: rsData.wifi.ssid || '',
            password: rsData.wifi.password || '',
            security: ['WPA', 'WEP', 'nopass'].includes(rsData.wifi.security)
              ? rsData.wifi.security
              : 'WPA',
          });
        }
        if (rsData.tableSession) {
          setTableSessionForm({
            scanTimeoutMinutes: String(
              rsData.tableSession.scanTimeoutMinutes ?? DEFAULT_SCAN_TIMEOUT_MINUTES
            ),
            orderExtensionMinutes: String(
              rsData.tableSession.orderExtensionMinutes ?? DEFAULT_ORDER_EXTENSION_MINUTES
            ),
          });
        }
        if (
          rsData.taxPercentage !== undefined ||
          rsData.serviceChargePercentage !== undefined
        ) {
          setTaxForm({
            taxPercentage: String(rsData.taxPercentage ?? DEFAULT_TAX_PERCENTAGE),
            serviceChargePercentage: String(
              rsData.serviceChargePercentage ?? DEFAULT_SERVICE_CHARGE_PERCENTAGE
            ),
          });
        }
        if (rsData.restaurant) {
          setRestaurant(rsData.restaurant);
          setSettingsForm({
            displayName: rsData.restaurant.displayName || '',
            description: rsData.restaurant.description || '',
            address: rsData.restaurant.address || '',
            city: rsData.restaurant.city || '',
            country: rsData.restaurant.country || 'IN',
            currency: rsData.restaurant.currency || 'INR',
            timezone: rsData.restaurant.timezone || 'Asia/Kolkata',
            phone: rsData.restaurant.phone || '',
            email: rsData.restaurant.email || '',
            googleReviewUrl: rsData.restaurant.googleReviewUrl || '',
            coverUrl: rsData.restaurant.coverUrl || '',
          });
        }
      })
      .catch(() => {});
  }, [currentTab, restaurant?.id, expiredGate, targetOrgAccess?.expired, handleSubscriptionExpired]);

  const isIndianRestaurant = restaurant?.country === 'IN' || restaurant?.currency === 'INR';

  // OCR Menu Extraction (supports photos & multi-page PDFs; client-menu-upload dynamically imported on demand)
  const processMenuFiles = async (rawFiles: FileList | File[] | null | undefined) => {
    if (!rawFiles || rawFiles.length === 0 || isUploadingMenu) return;

    if (currentTabRef.current !== 'menu') {
      router.push(`/dashboard/${restaurant.id}?tab=menu`);
    }

    setIsUploadingMenu(true);
    setExtractionError(null);
    setExtractionSuccess(null);
    setUploadProgress('Checking & optimizing menu files...');

    try {
      const { readApiErrorMessage, uploadMenuFilesInBatches, validateAndPrepareMenuFiles } =
        await import('@/lib/menu/client-menu-upload');

      const prepared = await validateAndPrepareMenuFiles(rawFiles);
      setUploadProgress(`Uploading ${prepared.summaryLabel} to secure storage...`);

      const uploadResult = await uploadMenuFilesInBatches({
        restaurantId: restaurant.id,
        files: prepared.files,
        onProgress: (msg) => setUploadProgress(msg),
      });

      if (uploadResult.expired) {
        handleSubscriptionExpired(uploadResult.payload);
        return;
      }

      setUploadProgress(
        prepared.pdfCount > 0
          ? 'AI reading PDF menu pages, dishes, prices & canonical 3D matches...'
          : 'AI reading menu photos, dishes, prices & canonical 3D matches...'
      );

      const extractRes = await fetch('/api/menus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          uploadId: uploadResult.uploadId,
          jobId: uploadResult.jobId,
        }),
      });

      if (extractRes.status === 402) {
        const payload = await extractRes.json().catch(() => ({}));
        handleSubscriptionExpired(payload);
        return;
      }

      if (!extractRes.ok) {
        const msg = await readApiErrorMessage(
          extractRes,
          'Menu extraction failed. Please try again later.'
        );
        throw new Error(msg);
      }

      const extractData = await extractRes.json().catch(() => ({}));
      if (!extractData?.success) {
        throw new Error(extractData?.error || 'Menu extraction failed. Please try again later.');
      }

      setExtractionError(null);
      const addedCount =
        typeof extractData.extractedItemsCount === 'number'
          ? extractData.extractedItemsCount
          : Array.isArray(extractData.items)
          ? extractData.items.length
          : 0;
      const scannedCount =
        typeof extractData.totalExtractedCount === 'number'
          ? extractData.totalExtractedCount
          : addedCount;
      const duplicatesSkipped =
        typeof extractData.duplicatesSkippedCount === 'number'
          ? extractData.duplicatesSkippedCount
          : 0;
      const canonicalMatched =
        typeof extractData.canonicalMatchedCount === 'number'
          ? extractData.canonicalMatchedCount
          : 0;

      const toastTitle = `${scannedCount} ${scannedCount === 1 ? 'item' : 'items'} extracted`;
      const subtitleParts: string[] = [];
      if (duplicatesSkipped > 0) {
        subtitleParts.push(
          `${addedCount} new added, ${duplicatesSkipped} duplicate${duplicatesSkipped === 1 ? '' : 's'} skipped`
        );
      }
      if (canonicalMatched > 0) {
        subtitleParts.push(`${canonicalMatched} matched with canonical 3D visuals`);
      }

      showExtractionToast(
        toastTitle,
        subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Added to your menu studio'
      );

      const linkedMsg =
        canonicalMatched > 0 ? ` (${canonicalMatched} matched with canonical 3D visuals)` : '';
      const skippedMsg =
        duplicatesSkipped > 0
          ? ` — ${duplicatesSkipped} duplicate${duplicatesSkipped === 1 ? '' : 's'} skipped`
          : '';
      setExtractionSuccess(
        `Extracted ${addedCount} ${addedCount === 1 ? 'dish' : 'dishes'} from ${prepared.summaryLabel} successfully${linkedMsg}${skippedMsg}!`
      );

      const itemsRes = await fetch(`/api/menus/items?restaurantId=${restaurant.id}`, {
        cache: 'no-store',
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setMenuItems(itemsData.items || []);
      }
    } catch (err: any) {
      console.error('Menu extraction failed:', err);
      setExtractionSuccess(null);
      setExtractionError(
        err.message ||
          'Menu extraction failed. Please ensure the menu photos or PDF are clear and legible, and please try again later.'
      );
    } finally {
      setIsUploadingMenu(false);
      setUploadProgress(null);
    }
  };

  const handleMenuFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const selected = Array.from(files);
    e.target.value = '';
    await processMenuFiles(selected);
  };

  const handleMenuDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploadingMenu && !isDraggingMenuFiles) {
      setIsDraggingMenuFiles(true);
    }
  };

  const handleMenuDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDraggingMenuFiles(false);
  };

  const handleMenuDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMenuFiles(false);
    if (isUploadingMenu) return;
    const dropped = e.dataTransfer?.files;
    if (dropped && dropped.length > 0) {
      await processMenuFiles(Array.from(dropped));
    }
  };

  // Toggle Menu Publication State (PUBLISHED vs DRAFT)
  const handleTogglePublication = async () => {
    if (!restaurant?.id || isTogglingPublish) return;
    const isCurrentlyPublished = restaurant.publicationState === 'PUBLISHED';
    const nextState = isCurrentlyPublished ? 'DRAFT' : 'PUBLISHED';
    setIsTogglingPublish(true);
    try {
      const res = await fetch('/api/menus/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          publishState: nextState,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        handleSubscriptionExpired(data);
        return;
      }
      if (res.ok && data.publicationState) {
        setRestaurant((prev: any) =>
          prev ? { ...prev, publicationState: data.publicationState } : prev
        );
      } else {
        alert(data.error || 'Failed to update menu publication status');
      }
    } catch {
      alert('Failed to update menu publication status');
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const readBannerDimensions = (file: File): Promise<{ width: number; height: number } | null> =>
    new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(objectUrl);
        resolve(dims);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant?.id) return;

    setBannerError(null);
    setBannerToast(null);

    const normalizedType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(normalizedType)) {
      setBannerError(
        'Unsupported format. Please upload a JPG, PNG, or WebP image (1200 × 600 px recommended).'
      );
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerError('Banner file size must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }

    setIsUploadingBanner(true);
    try {
      const dims = await readBannerDimensions(file);
      const formData = new FormData();
      formData.append('restaurantId', restaurant.id);
      formData.append('folder', 'banners');
      formData.append('file', file);
      if (dims?.width) formData.append('width', String(dims.width));
      if (dims?.height) formData.append('height', String(dims.height));

      const uploadRes = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (uploadRes.status === 402) {
        handleSubscriptionExpired(uploadData);
        return;
      }
      if (!uploadRes.ok || !uploadData?.asset?.publicUrl) {
        throw new Error(uploadData?.error || 'Failed to upload banner image');
      }

      const uploadedUrl = uploadData.asset.publicUrl as string;
      const saveRes = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          coverUrl: uploadedUrl,
        }),
      });
      const saveData = await saveRes.json().catch(() => ({}));
      if (saveRes.status === 402) {
        handleSubscriptionExpired(saveData);
        return;
      }
      if (!saveRes.ok) {
        throw new Error(saveData?.error || 'Banner uploaded but failed to save to restaurant profile');
      }

      setSettingsForm((prev) => ({ ...prev, coverUrl: uploadedUrl }));
      setRestaurant(saveData.restaurant || { ...restaurant, coverUrl: uploadedUrl });
      setBannerDimensions(dims);
      setBannerToast(
        dims
          ? `Banner updated live (${dims.width} × ${dims.height} px)!`
          : 'Banner image uploaded and published to your QR landing hub!'
      );
      setTimeout(() => setBannerToast(null), 4000);
    } catch (err: any) {
      setBannerError(err?.message || 'Error uploading banner image.');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleRemoveBanner = async () => {
    if (!restaurant?.id) return;
    setIsUploadingBanner(true);
    setBannerError(null);
    setBannerToast(null);
    try {
      const res = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          coverUrl: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to remove banner image');
      }
      setSettingsForm((prev) => ({ ...prev, coverUrl: '' }));
      setRestaurant(data.restaurant || { ...restaurant, coverUrl: null });
      setBannerDimensions(null);
      setBannerToast('Banner image removed.');
      setTimeout(() => setBannerToast(null), 3000);
    } catch (err: any) {
      setBannerError(err?.message || 'Error removing banner image');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif text-espresso-700">Loading Owner Console...</p>
        </div>
      </div>
    );
  }

  const allRestaurants =
    currentUser?.organizations?.flatMap((o: any) => o.restaurants) || [restaurant];
  const effectiveAccess = billingUsage?.access ?? targetOrgAccess ?? null;
  const isSubscriptionExpired = Boolean(
    expiredGate || (effectiveAccess && effectiveAccess.allowed === false)
  );
  const isTrialActive = Boolean(!isSubscriptionExpired && effectiveAccess?.isTrial);
  const isTrialEnded = Boolean(
    isSubscriptionExpired &&
      (effectiveAccess?.isTrialExpired ||
        expiredGate?.trialExpired ||
        expiredGate?.code === 'TRIAL_EXPIRED')
  );
  const planName = billingUsage?.plan?.name || effectiveAccess?.planName || 'Trial';
  const supportEmail =
    billingUsage?.supportEmail ||
    effectiveAccess?.supportEmail ||
    expiredGate?.supportEmail ||
    SUPPORT_EMAIL_DISPLAY;
  const supportMailHref = `mailto:${supportEmail}` || SUPPORT_EMAIL_HREF;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream-100/40 w-full">
      <DashboardNav
        currentRestaurant={restaurant}
        allRestaurants={allRestaurants}
        userEmail={currentUser?.email || ''}
        planName={planName}
        currentTab={currentTab}
        subscriptionExpired={isSubscriptionExpired}
        isTrial={isTrialActive}
        daysRemaining={effectiveAccess?.daysRemaining ?? null}
        supportEmail={supportEmail}
      />

      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-cream-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso-900">
              {restaurant.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-taupe-500 mt-1">
              {restaurant.city}, {restaurant.country} • Currency: {restaurant.currency}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTogglePublication}
              disabled={isTogglingPublish || isSubscriptionExpired}
              title={
                isSubscriptionExpired
                  ? 'Buy a subscription in Billing to reactivate publishing.'
                  : restaurant.publicationState === 'PUBLISHED'
                  ? 'Menu is published and indexable by search engines. Click to switch to Draft.'
                  : 'Menu is currently in Draft status. Click to publish live.'
              }
              className={`w-full sm:w-auto justify-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-60 ${
                isSubscriptionExpired
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : restaurant.publicationState === 'PUBLISHED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSubscriptionExpired
                    ? 'bg-red-500'
                    : restaurant.publicationState === 'PUBLISHED'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
              {isSubscriptionExpired
                ? 'Paused • Subscription Required'
                : isTogglingPublish
                ? 'Updating...'
                : restaurant.publicationState === 'PUBLISHED'
                ? 'Live & Published'
                : 'Publish Menu Live'}
            </button>

            <a
              href={`/m/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-cream-300 text-xs sm:text-sm font-semibold text-espresso-800 hover:bg-cream-50 shadow-sm transition-all"
            >
              <ExternalLink className="w-4 h-4 text-terracotta" />
              View Live Diner Menu
            </a>
          </div>
        </div>

        {/* Active 14-Day Free Trial Banner */}
        {isTrialActive && (
          <div
            role="status"
            className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm text-espresso-900">
                  14-Day Free Trial (Trial Plan) —{' '}
                  {effectiveAccess?.daysRemaining ?? FREE_TRIAL_DAYS}{' '}
                  {(effectiveAccess?.daysRemaining ?? FREE_TRIAL_DAYS) === 1 ? 'day' : 'days'}{' '}
                  remaining
                </div>
                <p className="text-xs text-taupe-600 mt-0.5 leading-relaxed">
                  No payment method or credit card required during trial. After day{' '}
                  {FREE_TRIAL_DAYS}, workspace &amp; diner menu pause until a subscription is
                  purchased. Setup-related queries? Email{' '}
                  <a
                    href={supportMailHref}
                    className="font-mono font-bold text-espresso-900 underline hover:text-terracotta"
                  >
                    {supportEmail}
                  </a>
                  .
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${restaurant.id}?tab=billing`)}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-terracotta" />
              Buy Subscription
            </button>
          </div>
        )}

        {/* Hard Expiry Gate for Non-Billing Tabs */}
        {isSubscriptionExpired && currentTab !== 'billing' && (
          <div
            role="region"
            aria-label="Subscription required"
            className="p-6 sm:p-10 bg-white rounded-3xl border border-red-200 shadow-lifted space-y-6 animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold uppercase tracking-wider">
                  Workspace &amp; Diner Menu Paused
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">
                  {isTrialEnded
                    ? 'Your 14-Day Free Trial Has Ended'
                    : 'Active Subscription Required to Continue'}
                </h2>
                <p className="text-xs sm:text-sm text-taupe-600 leading-relaxed max-w-2xl">
                  All features for <strong>{restaurant.displayName}</strong> — including your live
                  diner QR menu, AI menu assistant, table ordering, Kitchen Display terminal, and
                  dashboard editing — have stopped because your{' '}
                  {isTrialEnded ? '14-day free Trial' : 'subscription'} has ended. Buy a
                  subscription plan in the Billing panel to resume immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-espresso-900">
                    Reactivate in Billing Panel
                  </h3>
                  <p className="text-xs text-taupe-600 mt-1">
                    Choose Starter, Growth, or Pro to unlock your menu and all tables instantaneously.
                    All your existing dishes, 3D visuals, and table QR codes are safely preserved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/${restaurant.id}?tab=billing`)}
                  className="w-full sm:w-fit inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Buy Subscription in Billing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-espresso-900">
                    Setup &amp; Activation Assistance
                  </h3>
                  <p className="text-xs text-taupe-600 mt-1">
                    Have setup-related queries, GST invoicing questions, or need help activating
                    your restaurant? Reach us directly by email.
                  </p>
                </div>
                <a
                  href={supportMailHref}
                  className="w-full sm:w-fit inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-cream-300 hover:border-espresso-900 text-espresso-900 text-xs sm:text-sm font-mono font-bold transition-colors"
                >
                  <Mail className="w-4 h-4 text-terracotta" />
                  <span>{supportEmail}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {!isSubscriptionExpired && (
          <>
            <input
              ref={menuPhotoInputRef}
              type="file"
              multiple
              accept={MENU_PHOTO_ACCEPT}
              onChange={handleMenuFileUpload}
              disabled={isUploadingMenu}
              tabIndex={-1}
              aria-label="Upload menu photos"
              className="sr-only"
            />
            <input
              ref={menuPdfInputRef}
              type="file"
              multiple
              accept={MENU_PDF_ACCEPT}
              onChange={handleMenuFileUpload}
              disabled={isUploadingMenu}
              tabIndex={-1}
              aria-label="Upload menu PDF"
              className="sr-only"
            />

            {currentTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                    <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                      Total Menu Items
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2 tabular-nums">
                      {secondaryLoading.items && menuItems.length === 0 ? '—' : menuItems.length}
                    </div>
                    <div className="text-[11px] sm:text-xs text-sage-700 mt-1 flex items-center gap-1">
                      {secondaryLoading.items && menuItems.length === 0 ? (
                        <span className="text-taupe-500">Loading menu...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Live &amp; searchable
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                    <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                      QR Scans Today
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2 tabular-nums">
                      {analyticsLoading && !analyticsData ? '—' : analyticsData?.scans?.today ?? 0}
                    </div>
                    {analyticsLoading && !analyticsData ? (
                      <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                        Loading scans...
                      </div>
                    ) : (analyticsData?.scans?.today ?? 0) > 0 ? (
                      <div className="text-[11px] sm:text-xs text-sage-700 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" /> Active engagement
                      </div>
                    ) : (
                      <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                        No scans yet today
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                    <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                      AI Questions
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-espresso-900 mt-2 tabular-nums">
                      {billingUsage ? billingUsage.chatQueriesThisMonth ?? 0 : '—'}
                    </div>
                    <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                      {billingUsage
                        ? `of ${billingUsage.maxChatQueries} monthly allowance`
                        : 'Loading usage...'}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
                    <span className="text-[10px] sm:text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                      3D Credits Left
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-terracotta mt-2 tabular-nums">
                      {billingUsage ? billingUsage.remainingImageCredits ?? 0 : '—'}
                    </div>
                    <div className="text-[11px] sm:text-xs text-taupe-500 mt-1">
                      {billingUsage?.plan?.name ? `${billingUsage.plan.name} plan` : 'Loading plan...'}
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 bg-gradient-to-r from-cream-100 to-cream-50 rounded-3xl border border-cream-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-espresso-900">
                      Get Diners Scanning Today
                    </h3>
                    <p className="text-xs sm:text-sm text-taupe-600 mt-0.5">
                      Download high-resolution QR codes and printable 4x6&quot; table tents for your tables.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/${restaurant.id}?tab=qr`)}
                      className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-espresso-900 text-white text-xs sm:text-sm font-semibold hover:bg-espresso-800 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4 text-terracotta" /> Download QR Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/${restaurant.id}?tab=menu`)}
                      className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-white border border-cream-300 text-espresso-800 text-xs sm:text-sm font-semibold hover:bg-cream-100 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-espresso-700" /> Import Menu (Photos / PDF)
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg font-bold text-espresso-900">
                      Your Menu Highlights
                    </h3>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/${restaurant.id}?tab=menu`)}
                      className="text-xs font-semibold text-terracotta hover:underline"
                    >
                      Open Menu Studio &rarr;
                    </button>
                  </div>

                  {secondaryLoading.items && menuItems.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[0, 1, 2].map((idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200 animate-pulse motion-reduce:animate-none"
                        >
                          <div className="w-16 h-16 rounded-xl bg-cream-200 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-cream-200 rounded w-3/4" />
                            <div className="h-3 bg-cream-200 rounded w-1/3" />
                            <div className="h-4 bg-cream-200 rounded w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div
                      onDragOver={handleMenuDragOver}
                      onDragLeave={handleMenuDragLeave}
                      onDrop={handleMenuDrop}
                      className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 transition-colors ${
                        isDraggingMenuFiles
                          ? 'border-terracotta bg-terracotta-50/40'
                          : 'border-cream-300 bg-cream-50/70'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-espresso-900">
                            Upload your menu photos or PDF to get started
                          </h4>
                          <p className="text-xs text-taupe-600 mt-1 max-w-xl">
                            Choose multiple menu photos (JPG, PNG, WebP, HEIC) or a PDF menu — AI
                            automatically extracts dishes, categories, prices, and Veg/Non-Veg
                            indicators.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            disabled={isUploadingMenu}
                            onClick={() => menuPhotoInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-espresso-900 text-white text-xs font-semibold hover:bg-espresso-800 disabled:opacity-50 transition-colors inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                          >
                            <Camera className="w-3.5 h-3.5 text-terracotta" />
                            <span>Upload Menu Photos</span>
                          </button>
                          <button
                            type="button"
                            disabled={isUploadingMenu}
                            onClick={() => menuPdfInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-white border border-cream-300 text-espresso-900 text-xs font-semibold hover:bg-cream-100 disabled:opacity-50 transition-colors inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                          >
                            <FileText className="w-3.5 h-3.5 text-terracotta" />
                            <span>Upload Menu PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {menuItems.slice(0, 3).map((item) => {
                        const img =
                          item.imageOverride?.publicUrl ||
                          item.canonical?.imageAsset?.publicUrl ||
                          '/placeholder-dish.svg';
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200"
                          >
                            <img
                              src={img}
                              alt={item.customName}
                              className="w-16 h-16 aspect-square rounded-xl object-cover bg-white shrink-0 border border-cream-200"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm text-espresso-900 truncate">
                                {item.customName}
                              </h4>
                              <span className="text-xs font-bold text-espresso-700">
                                {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                              </span>
                              <div className="mt-1">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    item.isAvailable
                                      ? 'bg-sage-100 text-sage-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {item.isAvailable ? 'In Stock' : 'Sold Out'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cream-100 text-terracotta flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-espresso-900">
                        Setup &amp; Onboarding Support
                      </div>
                      <p className="text-xs text-taupe-500">
                        For menu import, QR printing, or setup-related queries, email us anytime.
                      </p>
                    </div>
                  </div>
                  <a
                    href={supportMailHref}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs font-mono font-bold text-espresso-900 shrink-0 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-terracotta" />
                    <span>{supportEmail}</span>
                  </a>
                </div>
              </div>
            )}

            {currentTab === 'menu' && (
              <DashboardMenuTab
                restaurant={restaurant}
                menuItems={menuItems}
                setMenuItems={setMenuItems}
                secondaryLoadingItems={secondaryLoading.items}
                isIndianRestaurant={isIndianRestaurant}
                isUploadingMenu={isUploadingMenu}
                uploadProgress={uploadProgress}
                isDraggingMenuFiles={isDraggingMenuFiles}
                extractionError={extractionError}
                setExtractionError={setExtractionError}
                extractionSuccess={extractionSuccess}
                setExtractionSuccess={setExtractionSuccess}
                menuPhotoInputRef={menuPhotoInputRef}
                menuPdfInputRef={menuPdfInputRef}
                handleMenuDragOver={handleMenuDragOver}
                handleMenuDragLeave={handleMenuDragLeave}
                handleMenuDrop={handleMenuDrop}
                onSubscriptionExpired={handleSubscriptionExpired}
                onBillingUpdated={setBillingUsage}
              />
            )}

            {currentTab === 'illustrations' && (
              <DashboardIllustrationTab
                restaurant={restaurant}
                menuItems={menuItems}
                setMenuItems={setMenuItems}
                remainingImageCredits={billingUsage?.remainingImageCredits ?? 15}
                onBillingUpdated={setBillingUsage}
                onSubscriptionExpired={handleSubscriptionExpired}
              />
            )}

            {currentTab === 'theme' && (
              <DashboardThemeTab
                restaurant={restaurant}
                rawInitialTheme={rawTheme}
                onThemeSaved={setRawTheme}
                menuItems={menuItems}
                coverUrl={settingsForm.coverUrl}
                bannerDimensions={bannerDimensions}
                isUploadingBanner={isUploadingBanner}
                bannerError={bannerError}
                bannerToast={bannerToast}
                onBannerUpload={handleBannerUpload}
                onRemoveBanner={handleRemoveBanner}
                onSubscriptionExpired={handleSubscriptionExpired}
              />
            )}

            {currentTab === 'ai' && (
              <DashboardAiTab
                restaurant={restaurant}
                rawInitialSettings={rawSettings}
                onAiSettingsSaved={setRawSettings}
                menuItems={menuItems}
                onSubscriptionExpired={handleSubscriptionExpired}
              />
            )}

            {currentTab === 'qr' && (
              <DashboardQrTab
                restaurant={restaurant}
                qrData={qrData}
                setQrData={setQrData}
                isSubscriptionExpired={isSubscriptionExpired}
                onSubscriptionExpired={handleSubscriptionExpired}
              />
            )}

            {currentTab === 'tables' && restaurant && (
              <div className="animate-fade-in">
                <TablesManagementView
                  restaurant={restaurant}
                  onSubscriptionExpired={handleSubscriptionExpired}
                />
              </div>
            )}

            {currentTab === 'orders' && restaurant && (
              <div className="animate-fade-in">
                <OrdersManagementView
                  restaurant={restaurant}
                  initialSubTab={initialOrdersSubTab}
                  onSubscriptionExpired={handleSubscriptionExpired}
                  onTaxSettingsUpdated={handleTaxSettingsUpdated}
                />
              </div>
            )}

            {currentTab === 'staff' && restaurant && (
              <div className="animate-fade-in">
                <StaffManagementView
                  restaurant={restaurant}
                  onSubscriptionExpired={handleSubscriptionExpired}
                />
              </div>
            )}

            {currentTab === 'analytics' && (
              <DashboardAnalyticsTab
                restaurant={restaurant}
                menuItems={menuItems}
                analyticsData={analyticsData}
                analyticsLoading={analyticsLoading}
                analyticsError={analyticsError}
                isIndianRestaurant={isIndianRestaurant}
                onRefreshAnalytics={loadAnalytics}
                onNavigate={(url) => router.push(url)}
              />
            )}

            {currentTab === 'settings' && (
              <DashboardSettingsTab
                restaurant={restaurant}
                setRestaurant={setRestaurant}
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
                wifiForm={wifiForm}
                setWifiForm={setWifiForm}
                tableSessionForm={tableSessionForm}
                setTableSessionForm={setTableSessionForm}
                taxForm={taxForm}
                setTaxForm={setTaxForm}
                bannerDimensions={bannerDimensions}
                isUploadingBanner={isUploadingBanner}
                bannerError={bannerError}
                bannerToast={bannerToast}
                onBannerUpload={handleBannerUpload}
                onRemoveBanner={handleRemoveBanner}
                supportEmail={supportEmail}
                supportMailHref={supportMailHref}
                onSubscriptionExpired={handleSubscriptionExpired}
              />
            )}
          </>
        )}

        {currentTab === 'billing' && (
          <DashboardBillingTab
            restaurant={restaurant}
            billingUsage={billingUsage}
            effectiveAccess={effectiveAccess}
            isSubscriptionExpired={isSubscriptionExpired}
            isTrialActive={isTrialActive}
            isTrialEnded={isTrialEnded}
            supportEmail={supportEmail}
            supportMailHref={supportMailHref}
            checkoutNotice={checkoutNotice}
            setCheckoutNotice={setCheckoutNotice}
          />
        )}
      </main>

      {extractionToast && (
        <Portal>
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-[140] max-w-sm w-[calc(100vw-2.5rem)] sm:w-auto p-3.5 bg-espresso-900/95 backdrop-blur-md border border-sage-600/60 text-cream-50 rounded-2xl shadow-2xl flex items-start gap-3 animate-fade-in"
          >
            <div className="w-8 h-8 rounded-xl bg-sage-500/20 text-sage-300 border border-sage-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <div className="text-xs sm:text-sm font-semibold text-white leading-snug">
                {extractionToast.title}
              </div>
              {extractionToast.subtitle && (
                <div className="text-[11px] text-cream-300 mt-0.5 leading-snug">
                  {extractionToast.subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setExtractionToast(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-cream-300 hover:text-white hover:bg-white/10 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </Portal>
      )}
    </div>
  );
}
