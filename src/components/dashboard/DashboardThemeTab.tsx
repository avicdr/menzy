'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import {
  BODY_FONT_OPTIONS,
  generateThemeVariables,
  getThemeSignature,
  HEADING_FONT_OPTIONS,
  normalizeThemeFont,
  pickContrastForeground,
  THEME_PRESETS,
  type ThemeConfig,
  validateThemeAccessibility,
} from '@/lib/theme/theme-presets';

interface ThemeBannerMeta {
  name: string;
  rationale: string;
  mode: 'prompt' | 'random';
  savedStatus?: 'draft' | 'published';
}

interface DashboardThemeTabProps {
  restaurant: any;
  rawInitialTheme: any;
  onThemeSaved?: (nextRawTheme: any) => void;
  menuItems: any[];
  coverUrl: string;
  bannerDimensions: { width: number; height: number } | null;
  isUploadingBanner: boolean;
  bannerError: string | null;
  bannerToast: string | null;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBanner: () => void;
  onSubscriptionExpired: (payload?: any) => void;
}

function normalizeRawTheme(rsTheme: any): ThemeConfig {
  if (!rsTheme) return THEME_PRESETS.WARM_EDITORIAL;
  return {
    presetKey: rsTheme.presetKey || 'WARM_EDITORIAL',
    backgroundColor: rsTheme.backgroundColor || '#F7F3EC',
    surfaceColor: rsTheme.surfaceColor || '#FFFFFF',
    primaryTextColor: rsTheme.primaryTextColor || '#35271F',
    secondaryTextColor: rsTheme.secondaryTextColor || '#7C695C',
    accentColor: rsTheme.accentColor || '#B86D52',
    secondaryAccentColor: rsTheme.secondaryAccentColor || '#70816B',
    headingFont: normalizeThemeFont(rsTheme.headingFont, 'Plus Jakarta Sans'),
    bodyFont: normalizeThemeFont(rsTheme.bodyFont, 'Inter'),
    layoutMode: rsTheme.layoutMode || 'GRID',
    cardRadius: rsTheme.cardRadius || '16px',
    buttonStyle: rsTheme.buttonStyle || 'rounded',
    imageProportions: rsTheme.imageProportions || 'square',
    texture: rsTheme.texture || 'none',
  };
}

export function DashboardThemeTab({
  restaurant,
  rawInitialTheme,
  onThemeSaved,
  menuItems,
  coverUrl,
  bannerDimensions,
  isUploadingBanner,
  bannerError,
  bannerToast,
  onBannerUpload,
  onRemoveBanner,
  onSubscriptionExpired,
}: DashboardThemeTabProps) {
  const [themeState, setThemeState] = useState<ThemeConfig>(() => normalizeRawTheme(rawInitialTheme));
  const [, setThemeWarnings] = useState<string[]>([]);
  const [themeSavedToast, setThemeSavedToast] = useState(false);
  const [themeSavedToastMode, setThemeSavedToastMode] = useState<'draft' | 'publish' | null>(null);
  const [savingThemeAction, setSavingThemeAction] = useState<'draft' | 'publish' | null>(null);
  const [themeSaveError, setThemeSaveError] = useState<string | null>(null);
  const themeSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [themePrompt, setThemePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [themeGenError, setThemeGenError] = useState<string | null>(null);
  const [generatedThemeBanner, setGeneratedThemeBanner] = useState<ThemeBannerMeta | null>(null);
  const [themeHistory, setThemeHistory] = useState<
    Array<{
      theme: ThemeConfig;
      banner: ThemeBannerMeta | null;
    }>
  >([]);
  const seenThemeSignaturesRef = useRef<string[]>([]);
  const syncedRawThemeRef = useRef<any>(rawInitialTheme);
  const hasLocalEditsRef = useRef(false);

  useEffect(() => {
    if (rawInitialTheme && rawInitialTheme !== syncedRawThemeRef.current && !hasLocalEditsRef.current) {
      syncedRawThemeRef.current = rawInitialTheme;
      setThemeState(normalizeRawTheme(rawInitialTheme));
    }
  }, [rawInitialTheme]);

  useEffect(() => {
    return () => {
      if (themeSavedTimerRef.current) {
        clearTimeout(themeSavedTimerRef.current);
      }
    };
  }, []);

  const updateThemeState = (updater: ThemeConfig | ((prev: ThemeConfig) => ThemeConfig)) => {
    hasLocalEditsRef.current = true;
    setThemeState(updater);
  };

  const applyThemeWithHistory = (nextTheme: ThemeConfig, nextBanner: ThemeBannerMeta | null) => {
    hasLocalEditsRef.current = true;
    setThemeHistory((prev) => [
      ...prev.slice(-19),
      { theme: themeState, banner: generatedThemeBanner },
    ]);
    setThemeState(nextTheme);
    setGeneratedThemeBanner(nextBanner);
    setThemeSavedToast(false);
    setThemeWarnings(validateThemeAccessibility(nextTheme).warnings);
  };

  const handleGenerateTheme = async (mode: 'prompt' | 'random', overridePrompt?: string) => {
    if (!restaurant?.id || isGeneratingTheme) return;

    const cleanPrompt = (overridePrompt ?? themePrompt).trim();
    if (mode === 'prompt' && !cleanPrompt) {
      setThemeGenError('Enter a vibe or cuisine prompt, or click Surprise Me to craft a random theme.');
      return;
    }

    if (overridePrompt !== undefined) {
      setThemePrompt(overridePrompt);
    }

    setIsGeneratingTheme(true);
    setThemeGenError(null);

    try {
      const currentSig = getThemeSignature(themeState);
      const excludeSignatures = Array.from(
        new Set([...seenThemeSignaturesRef.current, currentSig].filter(Boolean))
      ).slice(-14);

      const res = await fetch('/api/themes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          mode,
          prompt: mode === 'prompt' ? cleanPrompt : undefined,
          excludeSignatures,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 402) {
        onSubscriptionExpired(payload);
        return;
      }

      if (!res.ok || !payload?.theme) {
        throw new Error(payload?.error || 'Could not generate a theme right now. Please try again.');
      }

      const generatedSig = getThemeSignature(payload.theme);
      seenThemeSignaturesRef.current = Array.from(
        new Set([...seenThemeSignaturesRef.current, currentSig, generatedSig].filter(Boolean))
      ).slice(-14);

      applyThemeWithHistory(payload.theme, {
        name: payload.themeName || (mode === 'prompt' ? 'Prompt-Styled Look' : 'Curated Studio Look'),
        rationale:
          payload.rationale ||
          'Automatically applied to your live preview with readable typography and contrast.',
        mode,
      });
    } catch (err: any) {
      setThemeGenError(err?.message || 'Unable to generate theme right now.');
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleReturnToPreviousTheme = () => {
    if (themeHistory.length === 0) return;
    const previousSnapshot = themeHistory[themeHistory.length - 1];
    hasLocalEditsRef.current = true;
    setThemeHistory((prev) => prev.slice(0, -1));
    setThemeState(previousSnapshot.theme);
    setGeneratedThemeBanner(previousSnapshot.banner);
    setThemeGenError(null);
    setThemeSavedToast(false);
    setThemeWarnings(validateThemeAccessibility(previousSnapshot.theme).warnings);
  };

  const handleSaveTheme = async (isPublishing: boolean) => {
    if (!restaurant?.id || savingThemeAction) return;

    const actionMode: 'draft' | 'publish' = isPublishing ? 'publish' : 'draft';
    const access = validateThemeAccessibility(themeState);
    setThemeWarnings(access.warnings);
    setThemeSaveError(null);
    setThemeSavedToast(false);

    if (themeSavedTimerRef.current) {
      clearTimeout(themeSavedTimerRef.current);
    }

    if (!access.isValid && isPublishing) {
      setThemeSaveError(
        'Cannot publish theme: Low text/background contrast fails accessibility standards. Adjust colors or generate a balanced theme.'
      );
      return;
    }

    setSavingThemeAction(actionMode);
    try {
      const res = await fetch('/api/themes/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          isPublishing,
          ...themeState,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 402) {
        onSubscriptionExpired(payload);
        return;
      }

      if (!res.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Could not save theme changes. Please try again.'
        );
      }

      const savedSnapshot = { ...themeState };
      syncedRawThemeRef.current = savedSnapshot;
      hasLocalEditsRef.current = false;
      onThemeSaved?.(savedSnapshot);

      setGeneratedThemeBanner((prev) =>
        prev ? { ...prev, savedStatus: isPublishing ? 'published' : 'draft' } : null
      );
      setThemeSavedToastMode(actionMode);
      setThemeSavedToast(true);
      themeSavedTimerRef.current = setTimeout(() => {
        setThemeSavedToast(false);
        setThemeSavedToastMode(null);
      }, 3500);
    } catch (err: any) {
      setThemeSaveError(err?.message || 'Unable to save theme right now.');
    } finally {
      setSavingThemeAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 sm:p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-espresso-900">Restaurant Theme Studio</h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Customize colors, typography, card layout (Grid vs List), and inspect live updates in the diner phone view.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={savingThemeAction !== null || isGeneratingTheme}
            aria-busy={savingThemeAction === 'draft'}
            onClick={() => handleSaveTheme(false)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cream-200 text-espresso-800 font-semibold text-xs sm:text-sm hover:bg-cream-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingThemeAction === 'draft' && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            )}
            <span>{savingThemeAction === 'draft' ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            disabled={savingThemeAction !== null || isGeneratingTheme}
            aria-busy={savingThemeAction === 'publish'}
            onClick={() => handleSaveTheme(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-espresso-900 text-white font-semibold text-xs sm:text-sm hover:bg-espresso-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingThemeAction === 'publish' && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            )}
            <span>{savingThemeAction === 'publish' ? 'Publishing...' : 'Publish Theme'}</span>
          </button>
        </div>
      </div>

      {savingThemeAction !== null && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 bg-cream-50 border border-cream-300 text-espresso-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in"
        >
          <RefreshCw className="w-4 h-4 text-terracotta animate-spin shrink-0" />
          <span>
            {savingThemeAction === 'publish'
              ? 'Publishing theme and refreshing the live diner menu...'
              : 'Saving theme draft...'}
          </span>
        </div>
      )}

      {themeSaveError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{themeSaveError}</span>
        </div>
      )}

      {themeSavedToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-sage-50 border border-sage-200 text-sage-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
          <span>
            {themeSavedToastMode === 'draft'
              ? 'Theme draft saved!'
              : 'Theme saved & published! Public diner menu cache updated.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* AI & Random Nice Theme Studio */}
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-terracotta/10 border border-terracotta/20 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-espresso-900">AI Theme Designer</h3>
                  <p className="text-xs text-taupe-500 mt-0.5">
                    Describe a vibe or click Surprise Me to craft and preview a fresh look instantly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingTheme}
                onClick={() => handleGenerateTheme('random')}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                {isGeneratingTheme ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{isGeneratingTheme ? 'Crafting Theme...' : 'Surprise Me'}</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateTheme('prompt');
              }}
              className="space-y-2"
            >
              <label
                htmlFor="theme-ai-prompt"
                className="block text-xs font-semibold text-taupe-600 uppercase tracking-wider"
              >
                Describe your restaurant vibe
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="theme-ai-prompt"
                  type="text"
                  maxLength={240}
                  disabled={isGeneratingTheme}
                  value={themePrompt}
                  onChange={(e) => {
                    setThemePrompt(e.target.value);
                    if (themeGenError) setThemeGenError(null);
                  }}
                  placeholder="e.g. Candlelit Tuscan wine bar, Kyoto matcha café, coastal bistro..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-cream-300 bg-cream-50/40 text-xs sm:text-sm text-espresso-900 placeholder:text-taupe-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta transition-all"
                />
                <button
                  type="submit"
                  disabled={isGeneratingTheme || !themePrompt.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                >
                  {isGeneratingTheme ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Palette className="w-3.5 h-3.5" />
                  )}
                  <span>Style from Prompt</span>
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-taupe-500 font-medium mr-1">Try:</span>
              {[
                'Candlelit Italian wine bar',
                'Kyoto matcha café',
                'Sunlit coastal bistro',
                'Minimal Nordic bakery',
              ].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  disabled={isGeneratingTheme}
                  onClick={() => handleGenerateTheme('prompt', idea)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-cream-100 hover:bg-cream-200 text-espresso-800 border border-cream-200 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                >
                  {idea}
                </button>
              ))}
            </div>

            {themeGenError && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{themeGenError}</span>
              </div>
            )}

            {(generatedThemeBanner || themeHistory.length > 0) && (
              <div
                role="status"
                aria-live="polite"
                className="p-3.5 rounded-2xl bg-cream-50 border border-cream-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
              >
                <div className="min-w-0 space-y-0.5">
                  {generatedThemeBanner ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-espresso-900">
                          {generatedThemeBanner.name}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta">
                          {generatedThemeBanner.savedStatus === 'published'
                            ? 'Applied & Published'
                            : generatedThemeBanner.savedStatus === 'draft'
                            ? 'Applied • Draft Saved'
                            : 'Applied to Preview • Unsaved'}
                        </span>
                      </div>
                      <p className="text-[11px] text-taupe-600 leading-relaxed">
                        {generatedThemeBanner.rationale}
                      </p>
                    </>
                  ) : (
                    <div className="text-xs text-taupe-600">
                      Showing previous look •{' '}
                      <span className="font-semibold text-espresso-900">{themeHistory.length}</span>{' '}
                      earlier {themeHistory.length === 1 ? 'version' : 'versions'} in history
                    </div>
                  )}
                </div>

                {themeHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReturnToPreviousTheme}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-cream-100 text-espresso-900 border border-cream-300 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-terracotta" />
                    <span>Return to Previous</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4 Curated Hospitality Presets */}
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              Curated Hospitality Presets
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    if (themeState.presetKey !== key || generatedThemeBanner !== null) {
                      applyThemeWithHistory(preset, null);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    themeState.presetKey === key
                      ? 'border-terracotta ring-2 ring-terracotta/20 bg-cream-50'
                      : 'border-cream-200 hover:border-cream-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.backgroundColor }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                    <span className="font-semibold text-xs text-espresso-900">
                      {preset.presetKey.replace(/_/g, ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card Layout Switcher */}
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              Menu Card Layout Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateThemeState({ ...themeState, layoutMode: 'GRID' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  themeState.layoutMode === 'GRID'
                    ? 'border-espresso-900 bg-espresso-900 text-white shadow-sm'
                    : 'border-cream-300 bg-white text-espresso-800 hover:bg-cream-50'
                }`}
              >
                <div className="font-bold text-sm mb-1 flex items-center justify-between">
                  <span>Grid Cards</span>
                  {themeState.layoutMode === 'GRID' && <Check className="w-4 h-4 text-terracotta" />}
                </div>
                <p
                  className={`text-xs ${
                    themeState.layoutMode === 'GRID' ? 'text-cream-200' : 'text-taupe-500'
                  }`}
                >
                  Visual-forward two-column cards showcasing food photography
                </p>
              </button>

              <button
                type="button"
                onClick={() => updateThemeState({ ...themeState, layoutMode: 'LIST' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  themeState.layoutMode === 'LIST'
                    ? 'border-espresso-900 bg-espresso-900 text-white shadow-sm'
                    : 'border-cream-300 bg-white text-espresso-800 hover:bg-cream-50'
                }`}
              >
                <div className="font-bold text-sm mb-1 flex items-center justify-between">
                  <span>Editorial List</span>
                  {themeState.layoutMode === 'LIST' && <Check className="w-4 h-4 text-terracotta" />}
                </div>
                <p
                  className={`text-xs ${
                    themeState.layoutMode === 'LIST' ? 'text-cream-200' : 'text-taupe-500'
                  }`}
                >
                  Classic bistro rows focusing on culinary descriptions and prices
                </p>
              </button>
            </div>
          </div>

          {/* Color Palette Customization */}
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              Color Palette (Interactive)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="block text-[11px] font-medium text-taupe-600 mb-1">Background</span>
                <input
                  type="color"
                  value={themeState.backgroundColor}
                  onChange={(e) =>
                    updateThemeState({ ...themeState, backgroundColor: e.target.value })
                  }
                  className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-taupe-600 mb-1">
                  Surface Cards
                </span>
                <input
                  type="color"
                  value={themeState.surfaceColor}
                  onChange={(e) =>
                    updateThemeState({ ...themeState, surfaceColor: e.target.value })
                  }
                  className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-taupe-600 mb-1">
                  Primary Text
                </span>
                <input
                  type="color"
                  value={themeState.primaryTextColor}
                  onChange={(e) =>
                    updateThemeState({ ...themeState, primaryTextColor: e.target.value })
                  }
                  className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-taupe-600 mb-1">
                  Brand Accent
                </span>
                <input
                  type="color"
                  value={themeState.accentColor}
                  onChange={(e) =>
                    updateThemeState({ ...themeState, accentColor: e.target.value })
                  }
                  className="w-full h-11 rounded-xl cursor-pointer border border-cream-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Typography & Styling */}
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-4">
            <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
              Typography &amp; Corners
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="block text-xs font-medium text-taupe-600 mb-1">Heading Font</span>
                <select
                  value={themeState.headingFont}
                  onChange={(e) =>
                    updateThemeState({ ...themeState, headingFont: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                >
                  {HEADING_FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-taupe-600 mb-1">Body Text Font</span>
                <select
                  value={themeState.bodyFont}
                  onChange={(e) => updateThemeState({ ...themeState, bodyFont: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                >
                  {BODY_FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-taupe-600 mb-1">
                  Button Corners
                </span>
                <select
                  value={themeState.buttonStyle}
                  onChange={(e) =>
                    updateThemeState({ ...themeState, buttonStyle: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-terracotta"
                >
                  <option value="rounded">Rounded Corners (14px)</option>
                  <option value="pill">Pill Shape (Full Rounded)</option>
                  <option value="sharp">Sharp Architectural (4px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* QR Landing Hero Banner */}
          <div className="p-6 bg-white rounded-3xl border border-cream-200 shadow-soft space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-taupe-500 uppercase tracking-wider">
                  QR Landing Banner Image
                </label>
                <p className="text-[11px] text-taupe-600 mt-1">
                  Required size:{' '}
                  <strong className="text-espresso-900">1200 × 600 px (2:1 landscape)</strong> • Min
                  800 × 400 px • JPG, PNG, WebP (max 5 MB)
                </p>
              </div>
            </div>

            {bannerError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bannerError}</span>
              </div>
            )}
            {bannerToast && (
              <div className="p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-sage-600" />
                <span>{bannerToast}</span>
              </div>
            )}

            {coverUrl ? (
              <div className="space-y-2.5">
                <div className="rounded-2xl overflow-hidden border border-cream-300 bg-cream-100">
                  <img
                    src={coverUrl}
                    alt="QR Landing Banner"
                    className="w-full aspect-[2/1] object-cover block"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-taupe-500 font-mono">
                    {bannerDimensions
                      ? `Uploaded: ${bannerDimensions.width} × ${bannerDimensions.height} px`
                      : 'Ideal ratio: 1200 × 600 px (2:1)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                      {isUploadingBanner ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingBanner ? 'Uploading...' : 'Replace Banner'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploadingBanner}
                        onChange={onBannerUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isUploadingBanner}
                      onClick={onRemoveBanner}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-cream-300 hover:border-terracotta bg-cream-50/70 hover:bg-cream-50 transition-colors text-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-cream-200 flex items-center justify-center text-terracotta shadow-2xs">
                  {isUploadingBanner ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-semibold text-espresso-900">
                  {isUploadingBanner ? 'Uploading Banner...' : 'Upload Hero Banner Image'}
                </span>
                <span className="text-[11px] text-taupe-500">
                  Recommended 1200 × 600 px (2:1 wide) • Max 5 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingBanner}
                  onChange={onBannerUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Live Phone Preview (Fully Reactive) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-3 w-full sticky top-6 self-start">
          {(themeHistory.length > 0 || generatedThemeBanner) && (
            <div className="w-full max-w-[310px] sm:max-w-[340px] px-3.5 py-2.5 rounded-2xl bg-white border border-cream-200 shadow-soft flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-taupe-500">
                  Live Preview
                </div>
                <div className="text-xs font-bold text-espresso-900 truncate">
                  {generatedThemeBanner?.name || themeState.presetKey.replace(/_/g, ' ')}
                </div>
              </div>
              {themeHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleReturnToPreviousTheme}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terracotta"
                >
                  <RotateCcw className="w-3 h-3 text-terracotta" />
                  <span>Return to Previous</span>
                </button>
              )}
            </div>
          )}

          <div
            className="w-full max-w-[310px] sm:max-w-[340px] rounded-[36px] sm:rounded-[44px] border-[8px] sm:border-[10px] border-espresso-900 shadow-lifted overflow-hidden flex flex-col h-[580px] sm:h-[640px] relative mx-auto transition-colors duration-300"
            style={{
              backgroundColor: themeState.backgroundColor,
              backgroundImage:
                themeState.texture === 'gradient'
                  ? `radial-gradient(circle at top right, ${themeState.accentColor}1F, transparent 60%)`
                  : undefined,
              fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
              ...generateThemeVariables(themeState),
            }}
          >
            <div className="w-32 h-5 bg-espresso-900 rounded-b-xl mx-auto shrink-0" />

            <div
              className="border-b transition-colors duration-200 overflow-hidden"
              style={{
                backgroundColor: themeState.surfaceColor,
                borderColor: 'var(--dishora-border)',
              }}
            >
              {coverUrl && (
                <img src={coverUrl} alt="" className="w-full aspect-[2/1] object-cover block" />
              )}
              <div className="p-4">
                <h3
                  className="text-lg font-bold truncate"
                  style={{
                    fontFamily: `var(--font-serif)`,
                    color: themeState.primaryTextColor,
                  }}
                >
                  {restaurant.displayName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${themeState.accentColor}20`,
                      color: themeState.accentColor,
                      fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                    }}
                  >
                    {themeState.layoutMode === 'GRID' ? 'Grid Mode' : 'List Mode'}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{
                      color: themeState.secondaryTextColor,
                      fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                    }}
                  >
                    {themeState.headingFont} • {themeState.bodyFont}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-3 pt-3 flex gap-1.5 overflow-hidden">
              {['All', 'Popular', 'Chef Picks'].map((cat, idx) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-all"
                  style={{
                    borderRadius:
                      themeState.buttonStyle === 'pill'
                        ? '9999px'
                        : themeState.buttonStyle === 'sharp'
                        ? '4px'
                        : '10px',
                    backgroundColor: idx === 0 ? themeState.accentColor : themeState.surfaceColor,
                    color:
                      idx === 0
                        ? pickContrastForeground(themeState.accentColor)
                        : themeState.primaryTextColor,
                    border: `1px solid ${
                      idx === 0 ? themeState.accentColor : 'var(--dishora-border)'
                    }`,
                    fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
              {themeState.layoutMode === 'GRID' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {menuItems.slice(0, 4).map((item) => {
                    const img =
                      item.imageOverride?.publicUrl ||
                      item.canonical?.imageAsset?.publicUrl ||
                      '/placeholder-dish.svg';
                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden transition-all shadow-xs flex flex-col justify-between"
                        style={{
                          backgroundColor: themeState.surfaceColor,
                          border: `1px solid var(--dishora-border)`,
                          borderRadius: themeState.cardRadius,
                        }}
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          {item.isPopular && (
                            <span
                              className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs"
                              style={{
                                backgroundColor: themeState.accentColor,
                                color: pickContrastForeground(themeState.accentColor),
                                fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                              }}
                            >
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="p-2 space-y-1">
                          <div
                            className="font-semibold text-[11px] truncate"
                            style={{
                              fontFamily: `'${themeState.headingFont}', Georgia, serif`,
                              color: themeState.primaryTextColor,
                            }}
                          >
                            {item.customName}
                          </div>
                          <div
                            className="text-[9px] line-clamp-1"
                            style={{
                              fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                              color: themeState.secondaryTextColor,
                            }}
                          >
                            {item.restaurantDescription || 'Chef recipe'}
                          </div>
                          <div
                            className="font-bold text-xs pt-0.5"
                            style={{
                              color: themeState.accentColor,
                              fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                            }}
                          >
                            {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {menuItems.slice(0, 4).map((item) => {
                    const img =
                      item.imageOverride?.publicUrl ||
                      item.canonical?.imageAsset?.publicUrl ||
                      '/placeholder-dish.svg';
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 transition-all shadow-xs flex items-center gap-2.5"
                        style={{
                          backgroundColor: themeState.surfaceColor,
                          border: `1px solid var(--dishora-border)`,
                          borderRadius: themeState.cardRadius,
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-11 h-11 aspect-square rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="font-semibold text-xs truncate"
                              style={{
                                fontFamily: `'${themeState.headingFont}', Georgia, serif`,
                                color: themeState.primaryTextColor,
                              }}
                            >
                              {item.customName}
                            </span>
                            <span
                              className="font-bold text-xs shrink-0"
                              style={{
                                color: themeState.accentColor,
                                fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                              }}
                            >
                              {formatCurrencyMinor(item.priceMinor || 0, item.currency)}
                            </span>
                          </div>
                          <p
                            className="text-[10px] line-clamp-1 mt-0.5"
                            style={{
                              color: themeState.secondaryTextColor,
                              fontFamily: `'${themeState.bodyFont}', -apple-system, sans-serif`,
                            }}
                          >
                            {item.restaurantDescription || 'Culinary recipe'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="p-3 border-t"
              style={{
                backgroundColor: themeState.surfaceColor,
                borderColor: 'var(--dishora-border)',
              }}
            >
              <div
                className="w-full py-2.5 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                style={{
                  borderRadius:
                    themeState.buttonStyle === 'pill'
                      ? '9999px'
                      : themeState.buttonStyle === 'sharp'
                      ? '4px'
                      : '12px',
                  backgroundColor: themeState.primaryTextColor,
                  color: themeState.surfaceColor,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: themeState.accentColor }} />
                Ask our AI waiter
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

