'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';

interface DashboardNavProps {
  currentRestaurant: any;
  allRestaurants: any[];
  userEmail: string;
  planName?: string;
}

export function DashboardNav({
  currentRestaurant,
  allRestaurants,
  userEmail,
  planName = 'Starter',
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, tab: 'overview' },
    { label: 'Menu Studio', icon: Utensils, tab: 'menu' },
    { label: 'Illustration Lab', icon: Sparkles, tab: 'illustrations' },
    { label: 'Theme Studio', icon: Palette, tab: 'theme' },
    { label: 'AI Waiter', icon: Bot, tab: 'ai' },
    { label: 'QR Studio', icon: QrCode, tab: 'qr' },
    { label: 'Analytics', icon: BarChart3, tab: 'analytics' },
    { label: 'Settings', icon: Settings, tab: 'settings' },
    { label: 'Billing & Usage', icon: CreditCard, tab: 'billing' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleTabClick = (tab: string) => {
    setMobileMenuOpen(false);
    router.push(`/dashboard/${currentRestaurant.id}?tab=${tab}`);
  };

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Logo & Tagline */}
        <div className="p-5 sm:p-6 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-xl font-bold shadow-sm shrink-0">
              D
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-espresso-900">
                Dishora
              </span>
              <span className="block text-[10px] font-sans text-taupe-500 tracking-wider uppercase">
                Owner Console
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-taupe-500 hover:bg-cream-200 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restaurant Switcher */}
        <div className="px-4 py-3 border-b border-cream-200">
          <label className="block text-[10px] font-semibold text-taupe-500 uppercase tracking-wider mb-1">
            Active Restaurant
          </label>
          <div className="relative">
            <select
              value={currentRestaurant.id}
              onChange={(e) => {
                setMobileMenuOpen(false);
                router.push(`/dashboard/${e.target.value}`);
              }}
              className="w-full appearance-none bg-white border border-cream-300 rounded-xl px-3 py-2 text-xs font-semibold text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta pr-8"
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
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="px-2 py-0.5 rounded-full bg-cream-200 text-espresso-800 font-medium text-[11px]">
              {planName} Plan
            </span>
            <a
              href={`/m/${currentRestaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-terracotta hover:underline"
            >
              Live Menu <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-260px)]">
          {navItems.map((item) => {
            const isActive =
              pathname?.includes(`tab=${item.tab}`) ||
              (!pathname?.includes('tab=') && item.tab === 'overview');

            return (
              <button
                key={item.tab}
                onClick={() => handleTabClick(item.tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-espresso-900 text-cream-50 shadow-sm'
                    : 'text-espresso-700 hover:bg-cream-200/70 hover:text-espresso-900'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer user & logout */}
      <div className="p-4 border-t border-cream-200 bg-cream-100/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-espresso-900 truncate">{userEmail}</p>
            <p className="text-[10px] text-taupe-500">Verified Owner</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-xl text-taupe-500 hover:text-terracotta hover:bg-cream-200 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar (Visible only on < lg) */}
      <div className="lg:hidden w-full bg-cream-50 border-b border-cream-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white border border-cream-300 text-espresso-900 hover:bg-cream-100 active:scale-95 transition-all"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-espresso-900 text-cream-100 flex items-center justify-center font-serif text-sm font-bold shadow-sm">
              D
            </div>
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
          className="lg:hidden fixed inset-0 bg-espresso-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-Over Drawer Panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-cream-50 shadow-lifted border-r border-cream-300 transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Persistent Sidebar (>= lg) */}
      <aside className="hidden lg:flex w-64 bg-cream-50 border-r border-cream-300 flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
        <SidebarContent />
      </aside>
    </>
  );
}
