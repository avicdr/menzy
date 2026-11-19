'use client';

import React from 'react';
import { Globe, Languages } from 'lucide-react';
import { useManagementLanguage, ManagementLang } from '@/lib/i18n/management-i18n';

export interface LanguageSwitcherProps {
  variant?: 'toggle' | 'dropdown' | 'compact';
  theme?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export function LanguageSwitcher({
  variant = 'toggle',
  theme = 'light',
  size = 'sm',
  className = '',
  showIcon = false,
}: LanguageSwitcherProps) {
  const { lang, setLang } = useManagementLanguage();

  const isDark = theme === 'dark';

  if (variant === 'compact') {
    // Single compact toggle button: flips between en and hi
    const nextLang: ManagementLang = lang === 'en' ? 'hi' : 'en';
    const nextLabel = lang === 'en' ? 'हिन्दी' : 'English';

    return (
      <button
        type="button"
        onClick={() => setLang(nextLang)}
        className={`inline-flex items-center gap-1.5 rounded-xl font-medium transition-all ${
          size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } ${
          isDark
            ? 'bg-espresso-900 border border-espresso-700 text-cream-100 hover:bg-espresso-800'
            : 'bg-white border border-cream-300 text-espresso-800 hover:bg-cream-50'
        } ${className}`}
        title={`Switch language to ${nextLabel}`}
        aria-label={`Current language: ${lang === 'en' ? 'English' : 'हिन्दी'}. Switch to ${nextLabel}`}
      >
        <Globe className={`shrink-0 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-terracotta`} />
        <span className="font-semibold">{lang === 'en' ? 'EN' : 'हि'}</span>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        {showIcon && (
          <Languages className="w-3.5 h-3.5 text-taupe-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as ManagementLang)}
          aria-label="Management Language"
          className={`appearance-none font-medium rounded-xl border focus:outline-none focus:ring-1 focus:ring-terracotta transition-colors ${
            showIcon ? 'pl-8 pr-7' : 'px-2.5 pr-7'
          } ${size === 'sm' ? 'py-1 text-xs' : 'py-1.5 text-sm'} ${
            isDark
              ? 'bg-espresso-900 border-espresso-700 text-cream-100'
              : 'bg-white border-cream-300 text-espresso-800'
          }`}
        >
          <option value="en">English (EN)</option>
          <option value="hi">हिन्दी (HI)</option>
        </select>
      </div>
    );
  }

  // Default: Segmented Pill Toggle [ EN | हिन्दी ]
  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center p-0.5 rounded-xl border transition-colors select-none ${
        isDark
          ? 'bg-espresso-900/90 border-espresso-700/80 shadow-inner'
          : 'bg-cream-100/90 border-cream-300/80'
      } ${className}`}
    >
      {showIcon && (
        <span className="pl-1.5 pr-0.5 text-taupe-400">
          <Globe className="w-3.5 h-3.5" />
        </span>
      )}

      {/* English Pill */}
      <button
        type="button"
        role="button"
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
        className={`rounded-lg font-medium transition-all ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          lang === 'en'
            ? isDark
              ? 'bg-terracotta text-white font-bold shadow-sm'
              : 'bg-white text-espresso-950 font-bold shadow-sm border border-cream-200/80'
            : isDark
            ? 'text-taupe-400 hover:text-cream-100'
            : 'text-taupe-600 hover:text-espresso-900'
        }`}
      >
        EN
      </button>

      {/* Hindi Pill */}
      <button
        type="button"
        role="button"
        aria-pressed={lang === 'hi'}
        onClick={() => setLang('hi')}
        className={`rounded-lg font-medium transition-all ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          lang === 'hi'
            ? isDark
              ? 'bg-terracotta text-white font-bold shadow-sm'
              : 'bg-white text-espresso-950 font-bold shadow-sm border border-cream-200/80'
            : isDark
            ? 'text-taupe-400 hover:text-cream-100'
            : 'text-taupe-600 hover:text-espresso-900'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
