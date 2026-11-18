'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Printer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  buildEmbeddedFontCssForTent,
  buildTableTentSvg,
  fetchImageAsDataUrl,
  getTentDimensions,
  openPrintSheetForTents,
  resolveTentFonts,
  TABLE_TENT_HEADLINE_PRESETS,
  triggerPngDownload,
  triggerSvgDownload,
  type TableTentBrandContext,
  type TableTentConfig,
  type TableTentFormat,
  type TableTentTemplateId,
} from '@/lib/qr/table-tent-renderer';
import {
  BODY_FONT_OPTIONS,
  HEADING_FONT_OPTIONS,
  buildFontCssStack,
} from '@/lib/theme/theme-presets';

interface TableTentDesignerProps {
  restaurant: any;
  table: {
    id: string;
    name: string;
    section?: string | null;
    scanUrl?: string | null;
  };
  qrDataUrl: string | null;
  scanUrl: string | null;
  loading: boolean;
  config: TableTentConfig;
  onChangeConfig: (next: TableTentConfig) => void;
  brandTheme?: TableTentBrandContext['brandTheme'];
  coverUrl?: string | null;
  logoUrl?: string | null;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
}

const TEMPLATE_OPTIONS: Array<{
  id: TableTentTemplateId;
  label: string;
  desc: string;
  swatches: [string, string];
}> = [
  {
    id: 'BRAND',
    label: 'Match Brand',
    desc: 'Theme Studio colors',
    swatches: ['#FAF7F2', '#B86D52'],
  },
  {
    id: 'EDITORIAL_CREAM',
    label: 'Editorial Cream',
    desc: 'Warm cafe cardstock',
    swatches: ['#FAF6EE', '#B86D52'],
  },
  {
    id: 'MIDNIGHT_LUXE',
    label: 'Midnight Luxe',
    desc: 'Dark lounge & gold',
    swatches: ['#14110F', '#D49A54'],
  },
  {
    id: 'BOLD_ACCENT',
    label: 'Bold Header',
    desc: 'Color-block top band',
    swatches: ['#B86D52', '#FFFFFF'],
  },
];

export function TableTentDesigner({
  restaurant,
  table,
  qrDataUrl,
  scanUrl,
  loading,
  config,
  onChangeConfig,
  brandTheme,
  coverUrl,
  logoUrl,
  wifiSsid,
  wifiPassword,
}: TableTentDesignerProps) {
  const [menzyLogoDataUrl, setMenzyLogoDataUrl] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [exportingAction, setExportingAction] = useState<'png' | 'svg' | 'print' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const effectiveLogoUrl = logoUrl || restaurant?.logoUrl || null;
  const effectiveCoverUrl = coverUrl || restaurant?.coverUrl || null;
  const effectiveBrandTheme = brandTheme || restaurant?.theme || null;
  const themeDefaultFonts = resolveTentFonts(
    { headingFont: null, bodyFont: null },
    effectiveBrandTheme
  );
  const resolvedFonts = resolveTentFonts(config, effectiveBrandTheme);

  useEffect(() => {
    let active = true;
    fetchImageAsDataUrl('/logo.png').then((data) => {
      if (active) setMenzyLogoDataUrl(data);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!effectiveLogoUrl) {
      setLogoDataUrl(null);
      return;
    }
    fetchImageAsDataUrl(effectiveLogoUrl).then((data) => {
      if (active) setLogoDataUrl(data);
    });
    return () => {
      active = false;
    };
  }, [effectiveLogoUrl]);

  useEffect(() => {
    let active = true;
    if (!effectiveCoverUrl) {
      setCoverDataUrl(null);
      return;
    }
    fetchImageAsDataUrl(effectiveCoverUrl).then((data) => {
      if (active) setCoverDataUrl(data);
    });
    return () => {
      active = false;
    };
  }, [effectiveCoverUrl]);

  const previewSvg = useMemo(() => {
    if (!qrDataUrl) return '';
    return buildTableTentSvg(config, {
      restaurantName: restaurant?.displayName || 'Restaurant',
      tableName: table.name,
      tableSection: table.section || null,
      qrDataUrl,
      menzyLogoDataUrl,
      logoDataUrl,
      coverDataUrl,
      wifiSsid: wifiSsid || null,
      wifiPassword: wifiPassword || null,
      brandTheme: effectiveBrandTheme,
      useInlineCssVars: true,
      svgIdPrefix: 'designer-preview',
    });
  }, [
    config,
    restaurant?.displayName,
    effectiveBrandTheme,
    table.name,
    table.section,
    qrDataUrl,
    menzyLogoDataUrl,
    logoDataUrl,
    coverDataUrl,
    wifiSsid,
    wifiPassword,
  ]);

  const dim = getTentDimensions(config.format);
  const safeBaseName = `${(restaurant?.slug || 'menzy')}-${table.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}-${config.format === 'A4_POSTER' ? 'a4-poster' : 'table-stand'}`;

  const buildExportSvg = async () => {
    if (!qrDataUrl) return '';
    const embeddedFontCss = await buildEmbeddedFontCssForTent([
      resolvedFonts.headingFont,
      resolvedFonts.bodyFont,
    ]);
    return buildTableTentSvg(config, {
      restaurantName: restaurant?.displayName || 'Restaurant',
      tableName: table.name,
      tableSection: table.section || null,
      qrDataUrl,
      menzyLogoDataUrl,
      logoDataUrl,
      coverDataUrl,
      wifiSsid: wifiSsid || null,
      wifiPassword: wifiPassword || null,
      brandTheme: effectiveBrandTheme,
      embeddedFontCss,
      useInlineCssVars: false,
      svgIdPrefix: `export-${table.id}`,
    });
  };

  const handleDownloadSvg = async () => {
    if (!qrDataUrl || exportingAction) return;
    setExportingAction('svg');
    setExportError(null);
    try {
      const exportSvg = await buildExportSvg();
      if (exportSvg) {
        triggerSvgDownload(exportSvg, `${safeBaseName}.svg`);
      }
    } catch (err: any) {
      setExportError(err?.message || 'Could not export SVG.');
    } finally {
      setExportingAction(null);
    }
  };

  const handleDownloadPng = async () => {
    if (!qrDataUrl || exportingAction) return;
    setExportingAction('png');
    setExportError(null);
    try {
      const exportSvg = await buildExportSvg();
      if (exportSvg) {
        await triggerPngDownload(exportSvg, config.format, `${safeBaseName}.png`);
      }
    } catch (err: any) {
      setExportError(err?.message || 'Could not export PNG. Try Save SVG or Print.');
    } finally {
      setExportingAction(null);
    }
  };

  const handlePrintSingle = async () => {
    if (!qrDataUrl || exportingAction) return;
    setExportingAction('print');
    setExportError(null);
    try {
      const exportSvg = await buildExportSvg();
      if (exportSvg) {
        openPrintSheetForTents(
          [exportSvg],
          config.format,
          `${restaurant?.displayName || 'Menzy'} — ${table.name} (${dim.shortLabel})`
        );
      }
    } catch (err: any) {
      setExportError(err?.message || 'Could not prepare print sheet.');
    } finally {
      setExportingAction(null);
    }
  };

  const updateField = <K extends keyof TableTentConfig>(key: K, value: TableTentConfig[K]) => {
    onChangeConfig({ ...config, [key]: value });
  };

  const brandAccent = brandTheme?.accentColor || restaurant?.theme?.accentColor || '#B86D52';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
      {/* Left: Designer Controls */}
      <div className="lg:col-span-7 space-y-4">
        {/* Format Picker: Table Stand QR vs A4 Poster */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-taupe-500">
            Print Format
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                {
                  id: 'TABLE_STAND' as TableTentFormat,
                  title: 'Table Stand QR',
                  sub: '4×6" / A6 • Acrylic tent & table cards',
                },
                {
                  id: 'A4_POSTER' as TableTentFormat,
                  title: 'A4 Poster',
                  sub: '210×297 mm • Counter, wall & entrance',
                },
              ] as const
            ).map((opt) => {
              const active = config.format === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateField('format', opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    active
                      ? 'border-espresso-900 bg-espresso-900 text-white shadow-sm'
                      : 'border-cream-300 bg-white text-espresso-900 hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span>{opt.title}</span>
                    {active && <Check className="w-3.5 h-3.5 text-terracotta shrink-0" />}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      active ? 'text-cream-200' : 'text-taupe-500'
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Picker */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-taupe-500">
            Card Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_OPTIONS.map((tpl) => {
              const active = config.template === tpl.id;
              const sw0 =
                tpl.id === 'BRAND'
                  ? brandTheme?.backgroundColor || restaurant?.theme?.backgroundColor || tpl.swatches[0]
                  : tpl.id === 'BOLD_ACCENT'
                  ? config.accentColorOverride || brandAccent
                  : tpl.swatches[0];
              const sw1 =
                tpl.id === 'BRAND'
                  ? config.accentColorOverride || brandAccent
                  : tpl.swatches[1];
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => updateField('template', tpl.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    active
                      ? 'border-terracotta bg-cream-50 ring-2 ring-terracotta/20'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <div className="flex -space-x-1 shrink-0">
                    <span
                      className="w-4 h-4 rounded-full border border-black/15"
                      style={{ backgroundColor: sw0 }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/15"
                      style={{ backgroundColor: sw1 }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-espresso-900 truncate">{tpl.label}</div>
                    <div className="text-[10px] text-taupe-500 truncate">{tpl.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Accent Color */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream-50/80 border border-cream-200">
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              value={config.accentColorOverride || brandAccent}
              onChange={(e) => updateField('accentColorOverride', e.target.value)}
              className="w-8 h-8 rounded-lg border border-cream-300 cursor-pointer bg-white"
              aria-label="Accent color"
            />
            <div>
              <div className="text-xs font-bold text-espresso-900">Accent Color</div>
              <div className="text-[10px] text-taupe-500">
                Table badge, viewfinder corners &amp; highlights
              </div>
            </div>
          </div>
          {config.accentColorOverride && (
            <button
              type="button"
              onClick={() => updateField('accentColorOverride', null)}
              className="text-[11px] font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Typography (Heading & Body Fonts) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-taupe-500">
              Typography
            </label>
            {(config.headingFont || config.bodyFont) && (
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({ ...config, headingFont: null, bodyFont: null })
                }
                className="text-[11px] font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Theme</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="tent-heading-font"
                className="block text-[10px] font-semibold text-taupe-600 mb-1"
              >
                Heading Font
              </label>
              <select
                id="tent-heading-font"
                value={config.headingFont || ''}
                onChange={(e) => updateField('headingFont', e.target.value || null)}
                style={{
                  fontFamily: buildFontCssStack(
                    resolvedFonts.headingFont,
                    'Playfair Display'
                  ),
                }}
                className="w-full px-2.5 py-2 rounded-xl border border-cream-300 bg-white text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
              >
                <option value="">
                  Match Theme ({themeDefaultFonts.headingFont})
                </option>
                {HEADING_FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tent-body-font"
                className="block text-[10px] font-semibold text-taupe-600 mb-1"
              >
                Body Font
              </label>
              <select
                id="tent-body-font"
                value={config.bodyFont || ''}
                onChange={(e) => updateField('bodyFont', e.target.value || null)}
                style={{
                  fontFamily: buildFontCssStack(resolvedFonts.bodyFont, 'Inter'),
                }}
                className="w-full px-2.5 py-2 rounded-xl border border-cream-300 bg-white text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
              >
                <option value="">
                  Match Theme ({themeDefaultFonts.bodyFont})
                </option>
                {BODY_FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-taupe-500 mb-1">
              Headline
            </label>
            <input
              type="text"
              maxLength={60}
              value={config.headline}
              onChange={(e) => updateField('headline', e.target.value)}
              placeholder="Scan to View Menu & Order"
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {TABLE_TENT_HEADLINE_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateField('headline', preset)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cream-100 hover:bg-cream-200 text-espresso-800 border border-cream-200 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-taupe-500 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              maxLength={110}
              value={config.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Explore dish photos, dietary tags & send your order straight to our kitchen."
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
        </div>

        {/* Display Toggles */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-taupe-500">
            Card Elements
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'showLogo' as const, label: 'Restaurant Logo', available: true },
                {
                  key: 'showBanner' as const,
                  label: 'Cover Banner',
                  available: Boolean(effectiveCoverUrl),
                },
                {
                  key: 'showSection' as const,
                  label: 'Table Section',
                  available: Boolean(table.section),
                },
                { key: 'showSteps' as const, label: '3-Step Guide', available: true },
                {
                  key: 'showWifi' as const,
                  label: 'Free Wi-Fi Info',
                  available: Boolean(wifiSsid),
                },
              ] as const
            ).map((item) => {
              const checked = Boolean(config[item.key]) && item.available;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!item.available}
                  onClick={() => updateField(item.key, !config[item.key])}
                  title={!item.available ? `Configure ${item.label} in Settings first` : undefined}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors inline-flex items-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed ${
                    checked
                      ? 'bg-espresso-900 text-white border-espresso-900'
                      : 'bg-white text-espresso-800 border-cream-300 hover:bg-cream-50'
                  }`}
                >
                  {checked && <Check className="w-3 h-3 text-terracotta" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-taupe-500 flex items-center gap-1 pt-0.5">
            <Sparkles className="w-3 h-3 text-terracotta shrink-0" />
            <span>
              Menzy logo is embedded in the QR center (30% error correction) and footer lockup on all prints.
            </span>
          </p>
        </div>
      </div>

      {/* Right: Live Print Card Preview + Downloads */}
      <div className="lg:col-span-5 flex flex-col items-center space-y-3.5">
        <div className="w-full flex items-center justify-between text-[11px] px-1">
          <span className="font-bold text-espresso-900">{dim.label}</span>
          <span className="text-taupe-500 font-mono">
            {dim.pngWidth}×{dim.pngHeight}px
          </span>
        </div>

        <div className="w-full rounded-2xl bg-cream-100/90 border border-cream-200 p-4 flex items-center justify-center">
          {loading ? (
            <div className="w-full aspect-[105/148] max-w-[290px] rounded-2xl bg-white flex flex-col items-center justify-center gap-2 border border-cream-200">
              <div className="w-7 h-7 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-taupe-500">Generating high-res QR...</span>
            </div>
          ) : previewSvg ? (
            <div
              role="img"
              aria-label={`${restaurant?.displayName || 'Menu'} — ${table.name} ${dim.shortLabel}`}
              className={`w-full rounded-xl shadow-lifted border border-black/10 overflow-hidden bg-white [&>svg]:w-full [&>svg]:h-auto [&>svg]:block ${
                config.format === 'A4_POSTER' ? 'max-w-[310px]' : 'max-w-[280px]'
              }`}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : null}
        </div>

        {exportError && (
          <div className="w-full p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {exportError}
          </div>
        )}

        {/* Primary Export Actions */}
        <div className="w-full grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!previewSvg || Boolean(exportingAction)}
            onClick={handleDownloadPng}
            className="py-2.5 px-3 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>{exportingAction === 'png' ? 'Exporting...' : 'Save PNG'}</span>
          </button>

          <button
            type="button"
            disabled={!previewSvg || Boolean(exportingAction)}
            onClick={handleDownloadSvg}
            className="py-2.5 px-3 rounded-xl bg-cream-200 hover:bg-cream-300 text-espresso-900 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingAction === 'svg' ? 'Preparing...' : 'Save SVG'}</span>
          </button>

          <button
            type="button"
            disabled={!previewSvg || Boolean(exportingAction)}
            onClick={handlePrintSingle}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-cream-50 text-espresso-900 border border-cream-300 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {exportingAction === 'print' ? 'Preparing...' : `Print ${dim.shortLabel}`}
            </span>
          </button>

          <a
            href={scanUrl || table.scanUrl || `/m/${restaurant?.slug || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-terracotta hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Test Menu</span>
          </a>
        </div>

        <div className="text-[10px] text-taupe-500 text-center flex items-center gap-1">
          <FileText className="w-3 h-3 shrink-0" />
          <span>Design is saved automatically and applied to Bulk Print too.</span>
        </div>
      </div>
    </div>
  );
}
