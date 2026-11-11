'use client';

import React, { useEffect, useState } from 'react';
import { MenzyLogo } from '@/components/brand/MenzyLogo';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Utensils,
  Sparkles,
  Palette,
  Bot,
  QrCode,
  BarChart3,
  Settings,
  CreditCard,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  ChefHat,
  Users,
  Lock,
  Mail,
} from 'lucide-react';
import { SUPPORT_EMAIL_DISPLAY, SUPPORT_EMAIL_HREF } from '@/lib/support/contact';

interface DashboardNavProps {
  currentRestaurant: any;
  allRestaurants: any[];
  userEmail: string;
  planName?: string;
  currentTab?: string;
  subscriptionExpired?: boolean;
  isTrial?: boolean;
  daysRemaining?: number | null;
  supportEmail?: string;
}

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, tab: 'overview' },
  { label: 'Menu Studio', icon: Utensils, tab: 'menu' },
  { label: 'Illustration Lab', icon: Sparkles, tab: 'illustrations' },
  { label: 'Theme Studio', icon: Palette, tab: 'theme' },
  { label: 'AI Waiter', icon: Bot, tab: 'ai' },
  { label: 'Tables & QR Codes', icon: QrCode, tab: 'tables' },
  { label: 'Live Orders & POS', icon: ChefHat, tab: 'orders' },
  { label: 'Staff & Access', icon: Users, tab: 'staff' },
  { label: 'Analytics', icon: BarChart3, tab: 'analytics' },
  { label: 'Settings', icon: Settings, tab: 'settings' },
  { label: 'Billing & Usage', icon: CreditCard, tab: 'billing' },
] as const;

interface SidebarContentProps {
  currentRestaurant: any;
  allRestaurants: any[];
  userEmail: string;
  planName: string;
  currentTab: string;
  subscriptionExpired: boolean;
  isTrial: boolean;
  daysRemaining: number | null;
  supportEmail: string;
  onSelectTab: (tab: string) => void;
  onSelectRestaurant: (restaurantId: string) => void;
  onCloseMobileMenu: () => void;
  onLogout: () => void;
}

function SidebarContent({
  currentRestaurant,
  allRestaurants,
  userEmail,
  planName,
  currentTab,
  subscriptionExpired,
  isTrial,
  daysRemaining,
  supportEmail,
  onSelectTab,
  onSelectRestaurant,
  onCloseMobileMenu,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-cream-50">
      <div className="shrink-0">
        {/* Brand Logo & Tagline */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MenzyLogo size={34} />
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-espresso-900">
                Menzy
              </span>
              <span className="block text-[10px] font-sans text-taupe-500 tracking-wider uppercase">
                Owner Console
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-taupe-500 hover:bg-cream-200 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant Switcher */}
        <div className="px-4 py-2.5 border-b border-cream-200">
          <label className="block text-[10px] font-semibold text-taupe-500 uppercase tracking-wider mb-1">
            Active Restaurant
          </label>
          <div className="relative">
            <select
              value={currentRestaurant.id}
              onChange={(e) => onSelectRestaurant(e.target.value)}
              className="w-full appearance-none bg-white border border-cream-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta pr-8"
            >
              {allRestaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName} ({r.city || r.country})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-taupe-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Plan badge & live link */}
          <div className="mt-2 flex items-center justify-between text-xs gap-1.5">
            {subscriptionExpired ? (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-semibold text-[11px] truncate">
                {planName.toLowerCase() === 'trial' ? 'Trial Ended' : 'Plan Inactive'}
              </span>
            ) : isTrial ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-[11px] truncate">
                Trial Plan{daysRemaining ? ` • ${daysRemaining}d` : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-cream-200 text-espresso-800 font-medium text-[11px] truncate">
                {planName} Plan
              </span>
            )}
            <a
              href={`/m/${currentRestaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-terracotta hover:underline shrink-0"
            >
              Live Menu <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Nav Links (internally scrollable on ultra-short viewports without moving page) */}
      <nav
        aria-label="Console sections"
        className="flex-1 min-h-0 px-3 py-2.5 space-y-0.5 overflow-y-auto overscroll-contain"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.tab;
          const isLocked = subscriptionExpired && item.tab !== 'billing';

          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-espresso-900 text-cream-50 shadow-sm'
                  : isLocked
                  ? 'text-taupe-400 hover:bg-cream-200/50 hover:text-taupe-600'
                  : item.tab === 'billing' && subscriptionExpired
                  ? 'bg-terracotta/10 text-terracotta border border-terracotta/30 hover:bg-terracotta/15'
                  : 'text-espresso-700 hover:bg-cream-200/70 hover:text-espresso-900'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 shrink-0 opacity-70" />
              ) : item.tab === 'billing' && subscriptionExpired ? (
                <span className="px-1.5 py-0.5 rounded-full bg-terracotta text-white text-[9px] font-bold uppercase shrink-0">
                  Renew
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Setup Queries Support */}
      <div className="shrink-0 px-4 py-2.5 border-t border-cream-200 bg-cream-50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-taupe-500">
          Setup Queries Support
        </p>
        <a
          href={supportEmail ? `mailto:${supportEmail}` : SUPPORT_EMAIL_HREF}
          className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-espresso-900 hover:text-terracotta transition-colors"
        >
          <Mail className="w-3.5 h-3.5 text-terracotta shrink-0" />
          <span>{supportEmail}</span>
        </a>
      </div>

      {/* Footer user & logout */}
      <div className="shrink-0 px-4 py-3 border-t border-cream-200 bg-cream-100/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-espresso-900 truncate">{userEmail}</p>
            <p className="text-[10px] text-taupe-500">Verified Owner</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Log Out"
            aria-label="Log Out"
            className="p-2 rounded-xl text-taupe-500 hover:text-terracotta hover:bg-cream-200 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardNav({
  currentRestaurant,
  allRestaurants,
  userEmail,
  planName = 'Trial',
  currentTab = 'overview',
  subscriptionExpired = false,
  isTrial = false,
  daysRemaining = null,
  supportEmail = SUPPORT_EMAIL_DISPLAY,
}: DashboardNavProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleTabClick = (tab: string) => {
    setMobileMenuOpen(false);
    router.push(`/dashboard/${currentRestaurant.id}?tab=${tab}`);
  };

  const handleRestaurantChange = (restaurantId: string) => {
    setMobileMenuOpen(false);
    router.push(`/dashboard/${restaurantId}`);
  };

  const sharedSidebarProps = {
    currentRestaurant,
    allRestaurants,
    userEmail,
    planName,
    currentTab,
    subscriptionExpired,
    isTrial,
    daysRemaining,
    supportEmail,
    onSelectTab: handleTabClick,
    onSelectRestaurant: handleRestaurantChange,
    onCloseMobileMenu: () => setMobileMenuOpen(false),
    onLogout: handleLogout,
  };

  return (
    <>
      {/* Mobile Top App Bar (Visible only on < lg) */}
      <div className="lg:hidden w-full bg-cream-50 border-b border-cream-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white border border-cream-300 text-espresso-900 hover:bg-cream-100 active:scale-95 transition-all"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <MenzyLogo size={28} className="rounded-lg" />
            <div className="min-w-0">
              <span className="font-serif text-sm font-bold text-espresso-900 truncate block max-w-[150px] sm:max-w-xs">
                {currentRestaurant.displayName}
              </span>
            </div>
          </div>
        </div>

        <a
          href={`/m/${currentRestaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-200 border border-cream-300 text-xs font-semibold text-espresso-800 hover:bg-cream-300 transition-all shrink-0"
        >
          <span>Live Menu</span>
          <ExternalLink className="w-3 h-3 text-terracotta" />
        </a>
      </div>

      {/* Mobile Slide-Over Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-espresso-950/60 backdrop-blur-sm z-40 transition-opacity overscroll-contain touch-none"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Drawer Panel */}
      <div
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen ? true : undefined}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 h-dvh w-72 max-w-[85vw] bg-cream-50 shadow-lifted border-r border-cream-300 flex flex-col overflow-hidden transform transition-transform duration-300 ease-out overscroll-contain ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent {...sharedSidebarProps} />
      </div>

      {/* Desktop Persistent Sticky Sidebar (>= lg) */}
      <aside
        aria-label="Owner console sidebar"
        className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-cream-50 border-r border-cream-300 lg:sticky lg:top-0 lg:self-start lg:h-dvh overflow-hidden z-20"
      >
        <SidebarContent {...sharedSidebarProps} />
      </aside>
    </>
  );
}
