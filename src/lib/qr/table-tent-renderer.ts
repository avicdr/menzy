import { pickContrastForeground } from '@/lib/theme/theme-presets';

export type TableTentFormat = 'TABLE_STAND' | 'A4_POSTER';
export type TableTentTemplateId =
  | 'BRAND'
  | 'EDITORIAL_CREAM'
  | 'MIDNIGHT_LUXE'
  | 'BOLD_ACCENT';

export interface TableTentConfig {
  format: TableTentFormat;
  template: TableTentTemplateId;
  accentColorOverride: string | null;
  headline: string;
  subtitle: string;
  showLogo: boolean;
  showBanner: boolean;
  showSection: boolean;
  showSteps: boolean;
  showWifi: boolean;
}

export interface TableTentBrandContext {
  restaurantName: string;
  tableName: string;
  tableSection?: string | null;
  qrDataUrl: string;
  menzyLogoDataUrl?: string | null;
  logoDataUrl?: string | null;
  coverDataUrl?: string | null;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  brandTheme?: {
    backgroundColor?: string | null;
    surfaceColor?: string | null;
    primaryTextColor?: string | null;
    secondaryTextColor?: string | null;
    accentColor?: string | null;
    headingFont?: string | null;
    bodyFont?: string | null;
  } | null;
}

export const TABLE_TENT_HEADLINE_PRESETS = [
  'Scan to View Menu & Order',
  'Hungry? Scan for Our Digital Menu',
  'Explore Dishes & Order From Your Table',
  'Browse Photos, Pairings & Order Instantly',
] as const;

export function getDefaultTableTentConfig(options?: {
  showLogo?: boolean;
  hasBanner?: boolean;
  hasWifi?: boolean;
}): TableTentConfig {
  return {
    format: 'TABLE_STAND',
    template: 'BRAND',
    accentColorOverride: null,
    headline: 'Scan to View Menu & Order',
    subtitle: 'Explore dish photos, dietary tags & send your order straight to our kitchen.',
    showLogo: options?.showLogo !== false,
    showBanner: Boolean(options?.hasBanner),
    showSection: true,
    showSteps: true,
    showWifi: Boolean(options?.hasWifi),
  };
}

export interface ResolvedTentPalette {
  cardBg: string;
  surfaceBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  accentFg: string;
  borderColor: string;
  qrFrameBg: string;
  headerBg: string | null;
  headerTextColor: string | null;
  isDark: boolean;
}

export function resolveTentPalette(
  template: TableTentTemplateId,
  brandTheme?: TableTentBrandContext['brandTheme'],
  accentOverride?: string | null
): ResolvedTentPalette {
  const brandAccent = accentOverride || brandTheme?.accentColor || '#B86D52';

  if (template === 'MIDNIGHT_LUXE') {
    const accent = accentOverride || '#D49A54';
    return {
      cardBg: '#14110F',
      surfaceBg: '#1E1916',
      textColor: '#FAF6F0',
      mutedColor: '#B5A89A',
      accentColor: accent,
      accentFg: pickContrastForeground(accent),
      borderColor: 'rgba(212, 154, 84, 0.36)',
      qrFrameBg: '#FFFFFF',
      headerBg: null,
      headerTextColor: null,
      isDark: true,
    };
  }

  if (template === 'EDITORIAL_CREAM') {
    const accent = accentOverride || '#B86D52';
    return {
      cardBg: '#FAF6EE',
      surfaceBg: '#FFFFFF',
      textColor: '#2B211A',
      mutedColor: '#756458',
      accentColor: accent,
      accentFg: pickContrastForeground(accent),
      borderColor: '#DFD3C3',
      qrFrameBg: '#FFFFFF',
      headerBg: null,
      headerTextColor: null,
      isDark: false,
    };
  }

  if (template === 'BOLD_ACCENT') {
    const accent = brandAccent;
    return {
      cardBg: '#FFFFFF',
      surfaceBg: '#FAF8F5',
      textColor: '#1E1916',
      mutedColor: '#6D6057',
      accentColor: accent,
      accentFg: pickContrastForeground(accent),
      borderColor: '#E5DDD3',
      qrFrameBg: '#FFFFFF',
      headerBg: accent,
      headerTextColor: pickContrastForeground(accent),
      isDark: false,
    };
  }

  // BRAND — auto-synced to restaurant's Theme Studio palette
  const cardBg = brandTheme?.backgroundColor || '#FAF7F2';
  const surfaceBg = brandTheme?.surfaceColor || '#FFFFFF';
  const textColor = brandTheme?.primaryTextColor || '#2B231D';
  const mutedColor = brandTheme?.secondaryTextColor || '#7C695C';
  const isDark = pickContrastForeground(cardBg) === '#FFFFFF';

  return {
    cardBg,
    surfaceBg,
    textColor,
    mutedColor,
    accentColor: brandAccent,
    accentFg: pickContrastForeground(brandAccent),
    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(43,35,29,0.16)',
    qrFrameBg: '#FFFFFF',
    headerBg: null,
    headerTextColor: null,
    isDark,
  };
}

function escapeXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTextLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines.slice(0, maxLines);
}

export function getTentDimensions(format: TableTentFormat): {
  viewWidth: number;
  viewHeight: number;
  mmWidth: number;
  mmHeight: number;
  pngWidth: number;
  pngHeight: number;
  label: string;
  shortLabel: string;
} {
  if (format === 'A4_POSTER') {
    return {
      viewWidth: 840,
      viewHeight: 1188,
      mmWidth: 210,
      mmHeight: 297,
      pngWidth: 1654,
      pngHeight: 2339,
      label: 'A4 Poster (210 × 297 mm)',
      shortLabel: 'A4 Poster',
    };
  }
  return {
    viewWidth: 600,
    viewHeight: 850,
    mmWidth: 105,
    mmHeight: 148,
    pngWidth: 1200,
    pngHeight: 1700,
    label: 'Table Stand QR (A6 / 4×6")',
    shortLabel: 'Table Stand',
  };
}

/**
 * Build a self-contained print-ready SVG for either a Table Stand (A6 / 4x6") or A4 Poster.
 * Used both for vector SVG downloads, high-res PNG rasterization, and clean print sheets.
 */
export function buildTableTentSvg(
  config: TableTentConfig,
  ctx: TableTentBrandContext
): string {
  const dim = getTentDimensions(config.format);
  const W = dim.viewWidth;
  const H = dim.viewHeight;
  const isA4 = config.format === 'A4_POSTER';
  const scale = isA4 ? 1.4 : 1;

  const palette = resolveTentPalette(
    config.template,
    ctx.brandTheme,
    config.accentColorOverride
  );

  const headingFont = ctx.brandTheme?.headingFont
    ? `'${ctx.brandTheme.headingFont}', Georgia, 'Times New Roman', serif`
    : `Georgia, 'Times New Roman', serif`;
  const bodyFont = ctx.brandTheme?.bodyFont
    ? `'${ctx.brandTheme.bodyFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    : `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

  const pad = Math.round(32 * scale);
  const innerPad = Math.round(44 * scale);
  const hasBanner = Boolean(config.showBanner && ctx.coverDataUrl);
  const hasBoldHeader = Boolean(palette.headerBg) && !hasBanner;
  const headerBandHeight = hasBanner
    ? Math.round(145 * scale)
    : hasBoldHeader
    ? Math.round(148 * scale)
    : 0;

  // Vertical cursor for clean balanced layout
  let y = hasBanner
    ? headerBandHeight + Math.round(34 * scale)
    : hasBoldHeader
    ? headerBandHeight + Math.round(32 * scale)
    : Math.round(68 * scale);

  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.mmWidth}mm" height="${dim.mmHeight}mm" viewBox="0 0 ${W} ${H}">`
  );

  // Defs for clipping banner & rounded logo
  const logoSize = Math.round(52 * scale);
  const logoY = hasBanner
    ? headerBandHeight - Math.round(logoSize / 2)
    : hasBoldHeader
    ? Math.round(24 * scale)
    : y;

  parts.push(`<defs>
    <clipPath id="cardClip"><rect x="0" y="0" width="${W}" height="${H}" rx="${Math.round(24 * scale)}" /></clipPath>
    <clipPath id="logoClip"><rect x="${W / 2 - logoSize / 2}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${Math.round(14 * scale)}" /></clipPath>
  </defs>`);

  // Card Base
  parts.push(`<g clip-path="url(#cardClip)">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${escapeXml(palette.cardBg)}" />`);

  // Subtle decorative border frame
  if (!hasBanner && !hasBoldHeader) {
    parts.push(
      `<rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${H - pad * 2}" rx="${Math.round(18 * scale)}" fill="none" stroke="${escapeXml(palette.borderColor)}" stroke-width="${Math.round(1.5 * scale)}" />`
    );
    parts.push(
      `<rect x="${innerPad}" y="${innerPad}" width="${W - innerPad * 2}" height="${H - innerPad * 2}" rx="${Math.round(13 * scale)}" fill="none" stroke="${escapeXml(palette.borderColor)}" stroke-width="${Math.round(0.8 * scale)}" stroke-opacity="0.65" />`
    );
  } else {
    parts.push(
      `<rect x="${Math.round(14 * scale)}" y="${Math.round(14 * scale)}" width="${W - Math.round(28 * scale)}" height="${H - Math.round(28 * scale)}" rx="${Math.round(18 * scale)}" fill="none" stroke="${escapeXml(palette.borderColor)}" stroke-width="${Math.round(1.2 * scale)}" />`
    );
  }

  // Optional Cover Banner Top Strip
  if (hasBanner && ctx.coverDataUrl) {
    parts.push(
      `<image href="${escapeXml(ctx.coverDataUrl)}" x="0" y="0" width="${W}" height="${headerBandHeight}" preserveAspectRatio="xMidYMid slice" />`
    );
    parts.push(
      `<rect x="0" y="0" width="${W}" height="${headerBandHeight}" fill="rgba(18, 14, 11, 0.32)" />`
    );
  } else if (hasBoldHeader && palette.headerBg) {
    parts.push(
      `<rect x="0" y="0" width="${W}" height="${headerBandHeight}" fill="${escapeXml(palette.headerBg)}" />`
    );
  }

  // Logo / Monogram
  if (config.showLogo) {
    const lx = W / 2 - logoSize / 2;
    const badgeFill = hasBoldHeader ? 'rgba(255,255,255,0.18)' : palette.accentColor;
    const badgeStroke = hasBanner ? palette.cardBg : 'none';
    parts.push(
      `<rect x="${lx}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${Math.round(14 * scale)}" fill="${escapeXml(badgeFill)}" stroke="${escapeXml(badgeStroke)}" stroke-width="${hasBanner ? Math.round(4 * scale) : 0}" />`
    );
    if (ctx.logoDataUrl) {
      parts.push(
        `<image href="${escapeXml(ctx.logoDataUrl)}" x="${lx}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)" />`
      );
    } else {
      const initial = (ctx.restaurantName || 'M').trim().charAt(0).toUpperCase() || 'M';
      const initialColor = hasBoldHeader ? palette.headerTextColor || '#FFFFFF' : palette.accentFg;
      parts.push(
        `<text x="${W / 2}" y="${logoY + logoSize * 0.67}" text-anchor="middle" fill="${escapeXml(initialColor)}" font-family="${escapeXml(headingFont)}" font-size="${Math.round(24 * scale)}" font-weight="700">${escapeXml(initial)}</text>`
      );
    }
    if (!hasBanner && !hasBoldHeader) {
      y += logoSize + Math.round(18 * scale);
    } else if (hasBanner) {
      y = headerBandHeight + Math.round(logoSize / 2) + Math.round(22 * scale);
    }
  }

  // Restaurant Name
  const nameFontSize = Math.round((ctx.restaurantName.length > 22 ? 20 : 25) * scale);
  if (hasBoldHeader && palette.headerTextColor) {
    const nameY = config.showLogo ? logoY + logoSize + Math.round(36 * scale) : Math.round(78 * scale);
    parts.push(
      `<text x="${W / 2}" y="${nameY}" text-anchor="middle" fill="${escapeXml(palette.headerTextColor)}" font-family="${escapeXml(headingFont)}" font-size="${nameFontSize}" font-weight="700" letter-spacing="-0.02em">${escapeXml(ctx.restaurantName)}</text>`
    );
    if (config.showSection && ctx.tableSection) {
      parts.push(
        `<text x="${W / 2}" y="${nameY + Math.round(24 * scale)}" text-anchor="middle" fill="${escapeXml(palette.headerTextColor)}" fill-opacity="0.82" font-family="${escapeXml(bodyFont)}" font-size="${Math.round(11 * scale)}" font-weight="600" letter-spacing="0.16em">${escapeXml(ctx.tableSection.toUpperCase())}</text>`
      );
    }
  } else {
    parts.push(
      `<text x="${W / 2}" y="${y + Math.round(18 * scale)}" text-anchor="middle" fill="${escapeXml(palette.textColor)}" font-family="${escapeXml(headingFont)}" font-size="${nameFontSize}" font-weight="700" letter-spacing="-0.02em">${escapeXml(ctx.restaurantName)}</text>`
    );
    y += Math.round(32 * scale);
  }

  // Table Badge Pill (Table 01 • Section)
  const tableLabel =
    config.showSection && ctx.tableSection && !hasBoldHeader
      ? `${ctx.tableName}  •  ${ctx.tableSection}`
      : ctx.tableName;
  const pillFontSize = Math.round(16 * scale);
  const pillWidth = Math.min(
    W - innerPad * 2 - Math.round(24 * scale),
    Math.max(Math.round(150 * scale), Math.round(tableLabel.length * 11 * scale + 52 * scale))
  );
  const pillHeight = Math.round(38 * scale);
  const pillY = y + Math.round(8 * scale);

  parts.push(
    `<rect x="${W / 2 - pillWidth / 2}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${Math.round(19 * scale)}" fill="${escapeXml(palette.accentColor)}" />`
  );
  parts.push(
    `<text x="${W / 2}" y="${pillY + Math.round(24 * scale)}" text-anchor="middle" fill="${escapeXml(palette.accentFg)}" font-family="${escapeXml(bodyFont)}" font-size="${pillFontSize}" font-weight="700" letter-spacing="0.02em">${escapeXml(tableLabel)}</text>`
  );
  y = pillY + pillHeight + Math.round(28 * scale);

  // Headline & Subtitle
  const headlineLines = wrapTextLines(config.headline || 'Scan to View Menu & Order', isA4 ? 32 : 28, 2);
  const headlineSize = Math.round(20 * scale);
  for (const line of headlineLines) {
    parts.push(
      `<text x="${W / 2}" y="${y}" text-anchor="middle" fill="${escapeXml(palette.textColor)}" font-family="${escapeXml(headingFont)}" font-size="${headlineSize}" font-weight="700">${escapeXml(line)}</text>`
    );
    y += Math.round(25 * scale);
  }

  const subtitleLines = wrapTextLines(config.subtitle || '', isA4 ? 46 : 42, 2);
  const subtitleSize = Math.round(12.5 * scale);
  if (subtitleLines.length > 0) {
    y += Math.round(2 * scale);
    for (const line of subtitleLines) {
      parts.push(
        `<text x="${W / 2}" y="${y}" text-anchor="middle" fill="${escapeXml(palette.mutedColor)}" font-family="${escapeXml(bodyFont)}" font-size="${subtitleSize}" font-weight="500">${escapeXml(line)}</text>`
      );
      y += Math.round(17 * scale);
    }
  }

  // Reserve bottom space for steps, wifi, and mandatory Menzy logo footer so QR fits cleanly with zero overlap
  const footerReserve =
    Math.round(68 * scale) +
    (config.showWifi && ctx.wifiSsid ? Math.round(44 * scale) : 0) +
    (config.showSteps ? Math.round(50 * scale) : 0);

  const availableForQr = H - y - footerReserve - Math.round(26 * scale);
  const qrBoxSize = Math.max(
    Math.round(190 * scale),
    Math.min(Math.round((isA4 ? 330 : 275) * scale), availableForQr)
  );
  const qrBoxX = W / 2 - qrBoxSize / 2;
  const qrBoxY = y + Math.max(Math.round(8 * scale), Math.round((availableForQr - qrBoxSize) / 2));
  const qrInnerPad = Math.round(16 * scale);

  // Crisp QR Card + Subtle Viewfinder Corner Brackets
  parts.push(
    `<rect x="${qrBoxX}" y="${qrBoxY}" width="${qrBoxSize}" height="${qrBoxSize}" rx="${Math.round(20 * scale)}" fill="${escapeXml(palette.qrFrameBg)}" stroke="${escapeXml(palette.borderColor)}" stroke-width="${Math.round(1.5 * scale)}" />`
  );

  // 4 Viewfinder Accent Corners
  const brLen = Math.round(22 * scale);
  const brOff = Math.round(8 * scale);
  const brStroke = Math.round(3 * scale);
  const x1 = qrBoxX - brOff;
  const y1 = qrBoxY - brOff;
  const x2 = qrBoxX + qrBoxSize + brOff;
  const y2 = qrBoxY + qrBoxSize + brOff;
  parts.push(
    `<path d="M ${x1} ${y1 + brLen} L ${x1} ${y1} L ${x1 + brLen} ${y1} M ${x2 - brLen} ${y1} L ${x2} ${y1} L ${x2} ${y1 + brLen} M ${x1} ${y2 - brLen} L ${x1} ${y2} L ${x1 + brLen} ${y2} M ${x2 - brLen} ${y2} L ${x2} ${y2} L ${x2} ${y2 - brLen}" fill="none" stroke="${escapeXml(palette.accentColor)}" stroke-width="${brStroke}" stroke-linecap="round" stroke-linejoin="round" />`
  );

  if (ctx.qrDataUrl) {
    const qrDrawSize = qrBoxSize - qrInnerPad * 2;
    const qrDrawX = qrBoxX + qrInnerPad;
    const qrDrawY = qrBoxY + qrInnerPad;
    parts.push(
      `<image href="${escapeXml(ctx.qrDataUrl)}" x="${qrDrawX}" y="${qrDrawY}" width="${qrDrawSize}" height="${qrDrawSize}" />`
    );

    // Centered Menzy Logo Emblem inside QR (safe <= 18% width with Error Correction Level H)
    const centerBadgeSize = Math.round(qrDrawSize * 0.19);
    const centerLogoSize = Math.round(centerBadgeSize * 0.78);
    const badgeX = Math.round(W / 2 - centerBadgeSize / 2);
    const badgeY = Math.round(qrDrawY + qrDrawSize / 2 - centerBadgeSize / 2);
    const logoImgX = Math.round(W / 2 - centerLogoSize / 2);
    const logoImgY = Math.round(qrDrawY + qrDrawSize / 2 - centerLogoSize / 2);

    parts.push(
      `<rect x="${badgeX}" y="${badgeY}" width="${centerBadgeSize}" height="${centerBadgeSize}" rx="${Math.round(centerBadgeSize * 0.24)}" fill="#FFFFFF" stroke="${escapeXml(palette.borderColor)}" stroke-width="${Math.round(1 * scale)}" />`
    );
    if (ctx.menzyLogoDataUrl) {
      parts.push(
        `<image href="${escapeXml(ctx.menzyLogoDataUrl)}" x="${logoImgX}" y="${logoImgY}" width="${centerLogoSize}" height="${centerLogoSize}" preserveAspectRatio="xMidYMid meet" />`
      );
    } else {
      parts.push(
        `<text x="${W / 2}" y="${badgeY + Math.round(centerBadgeSize * 0.68)}" text-anchor="middle" fill="#B86D52" font-family="${escapeXml(headingFont)}" font-size="${Math.round(centerBadgeSize * 0.56)}" font-weight="700">M</text>`
      );
    }
  }

  let bottomY = qrBoxY + qrBoxSize + Math.round(34 * scale);

  // Optional 3-step guest cue
  if (config.showSteps) {
    const steps = ['01  Scan QR', '02  Explore Menu', '03  Order at Table'];
    const stepText = steps.join('    •    ');
    parts.push(
      `<text x="${W / 2}" y="${bottomY}" text-anchor="middle" fill="${escapeXml(palette.textColor)}" fill-opacity="0.82" font-family="${escapeXml(bodyFont)}" font-size="${Math.round(11.5 * scale)}" font-weight="600" letter-spacing="0.03em">${escapeXml(stepText)}</text>`
    );
    bottomY += Math.round(32 * scale);
  }

  // Optional Free Wi-Fi Pill
  if (config.showWifi && ctx.wifiSsid) {
    const wifiText = ctx.wifiPassword
      ? `Free Wi-Fi: ${ctx.wifiSsid}  •  Pass: ${ctx.wifiPassword}`
      : `Free Wi-Fi: ${ctx.wifiSsid}`;
    const wifiW = Math.min(
      W - innerPad * 2 - Math.round(24 * scale),
      Math.max(Math.round(210 * scale), Math.round(wifiText.length * 6.8 * scale + 36 * scale))
    );
    const wifiH = Math.round(28 * scale);
    parts.push(
      `<rect x="${W / 2 - wifiW / 2}" y="${bottomY - Math.round(18 * scale)}" width="${wifiW}" height="${wifiH}" rx="${Math.round(14 * scale)}" fill="${escapeXml(palette.surfaceBg)}" stroke="${escapeXml(palette.borderColor)}" stroke-width="${Math.round(1 * scale)}" />`
    );
    parts.push(
      `<text x="${W / 2}" y="${bottomY}" text-anchor="middle" fill="${escapeXml(palette.mutedColor)}" font-family="${escapeXml(bodyFont)}" font-size="${Math.round(10.5 * scale)}" font-weight="600">${escapeXml(wifiText)}</text>`
    );
    bottomY += Math.round(30 * scale);
  }

  // Mandatory Menzy Logo + Wordmark Footer Lockup on every printed QR
  const footerCenterY = Math.max(bottomY + Math.round(8 * scale), H - Math.round(58 * scale));
  const menzyIconSize = Math.round(20 * scale);
  const lockupGap = Math.round(8 * scale);
  const labelText = 'POWERED BY MENZY';
  const approxTextW = Math.round(labelText.length * 6.6 * scale);
  const totalLockupW = menzyIconSize + lockupGap + approxTextW;
  const lockupStartX = Math.round(W / 2 - totalLockupW / 2);

  if (ctx.menzyLogoDataUrl) {
    parts.push(
      `<image href="${escapeXml(ctx.menzyLogoDataUrl)}" x="${lockupStartX}" y="${Math.round(footerCenterY - menzyIconSize / 2)}" width="${menzyIconSize}" height="${menzyIconSize}" preserveAspectRatio="xMidYMid meet" />`
    );
  } else {
    parts.push(
      `<rect x="${lockupStartX}" y="${Math.round(footerCenterY - menzyIconSize / 2)}" width="${menzyIconSize}" height="${menzyIconSize}" rx="${Math.round(5 * scale)}" fill="#B86D52" />`
    );
    parts.push(
      `<text x="${lockupStartX + Math.round(menzyIconSize / 2)}" y="${footerCenterY + Math.round(4 * scale)}" text-anchor="middle" fill="#FFFFFF" font-family="${escapeXml(headingFont)}" font-size="${Math.round(11 * scale)}" font-weight="700">M</text>`
    );
  }
  parts.push(
    `<text x="${lockupStartX + menzyIconSize + lockupGap}" y="${footerCenterY + Math.round(3.5 * scale)}" text-anchor="start" fill="${escapeXml(palette.mutedColor)}" fill-opacity="0.88" font-family="${escapeXml(bodyFont)}" font-size="${Math.round(9.8 * scale)}" font-weight="700" letter-spacing="0.18em">${labelText}</text>`
  );

  parts.push(`</g></svg>`);
  return parts.join('');
}

/**
 * Fetch an image URL and convert it to an inline data URL so SVG downloads and PNG canvas
 * exports remain 100% self-contained without CORS/tainted-canvas issues.
 */
export async function fetchImageAsDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function triggerSvgDownload(svgMarkup: string, filename: string) {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function triggerPngDownload(
  svgMarkup: string,
  format: TableTentFormat,
  filename: string
): Promise<void> {
  const dim = getTentDimensions(format);
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not rasterize table tent preview.'));
      el.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = dim.pngWidth;
    canvas.height = dim.pngHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported in this browser.');
    ctx.drawImage(img, 0, 0, dim.pngWidth, dim.pngHeight);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
    );
    if (!pngBlob) throw new Error('Could not generate PNG image.');

    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/**
 * Open a clean, properly paginated print window:
 * - A4_POSTER: 1 full-page A4 poster per table
 * - TABLE_STAND: 4 crisp A6 (105x148mm) table stands per A4 sheet (2x2 grid) ready to cut & insert
 */
export function openPrintSheetForTents(
  svgs: string[],
  format: TableTentFormat,
  documentTitle: string
) {
  const printWin = window.open('', '_blank', 'width=960,height=780');
  if (!printWin) {
    window.print();
    return;
  }

  const isA4 = format === 'A4_POSTER';
  const pagesHtml = isA4
    ? svgs
        .map(
          (svg) =>
            `<div class="a4-page">${svg}</div>`
        )
        .join('')
    : (() => {
        const sheets: string[] = [];
        for (let i = 0; i < svgs.length; i += 4) {
          const chunk = svgs.slice(i, i + 4);
          sheets.push(
            `<div class="stand-sheet">${chunk
              .map((svg) => `<div class="stand-cell">${svg}</div>`)
              .join('')}</div>`
          );
        }
        return sheets.join('');
      })();

  printWin.document.open();
  printWin.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeXml(documentTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #f3f1ed; font-family: system-ui, sans-serif; }
    .a4-page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto 12px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      break-after: page;
    }
    .a4-page svg { width: 210mm; height: 297mm; display: block; }
    .stand-sheet {
      width: 210mm;
      height: 297mm;
      margin: 0 auto 12px;
      padding: 0;
      background: #fff;
      display: grid;
      grid-template-columns: 105mm 105mm;
      grid-template-rows: 148.5mm 148.5mm;
      page-break-after: always;
      break-after: page;
    }
    .stand-cell {
      width: 105mm;
      height: 148.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0.25mm dashed rgba(0, 0, 0, 0.18);
      padding: 2mm;
    }
    .stand-cell svg { width: 101mm; height: 144mm; display: block; }
    @media print {
      html, body { background: #fff; }
      .a4-page, .stand-sheet { margin: 0; }
      .a4-page:last-child, .stand-sheet:last-child { page-break-after: auto; break-after: auto; }
    }
  </style>
</head>
<body>
  ${pagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`);
  printWin.document.close();
}
