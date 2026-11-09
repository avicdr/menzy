export interface ThemeConfig {
  presetKey: 'WARM_EDITORIAL' | 'MIDNIGHT_ESPRESSO' | 'BOTANICAL_CAFE' | 'PASTEL_PATISSERIE' | 'CUSTOM';
  backgroundColor: string;
  surfaceColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  secondaryAccentColor: string;
  headingFont: string;
  bodyFont: string;
  layoutMode: 'GRID' | 'LIST';
  cardRadius: string;
  buttonStyle: 'rounded' | 'pill' | 'sharp';
  imageProportions: 'square' | 'wide' | 'compact';
  texture: 'none' | 'paper' | 'gradient';
}

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  WARM_EDITORIAL: {
    presetKey: 'WARM_EDITORIAL',
    backgroundColor: '#F7F3EC',
    surfaceColor: '#FFFFFF',
    primaryTextColor: '#35271F',
    secondaryTextColor: '#7C695C',
    accentColor: '#B86D52',
    secondaryAccentColor: '#70816B',
    headingFont: 'Instrument Serif',
    bodyFont: 'DM Sans',
    layoutMode: 'GRID',
    cardRadius: '16px',
    buttonStyle: 'rounded',
    imageProportions: 'square',
    texture: 'none',
  },
  MIDNIGHT_ESPRESSO: {
    presetKey: 'MIDNIGHT_ESPRESSO',
    backgroundColor: '#191816',
    surfaceColor: '#292621',
    primaryTextColor: '#F3EBDD',
    secondaryTextColor: '#B3A697',
    accentColor: '#C6975A',
    secondaryAccentColor: '#70816B',
    headingFont: 'DM Serif Display',
    bodyFont: 'Manrope',
    layoutMode: 'GRID',
    cardRadius: '14px',
    buttonStyle: 'rounded',
    imageProportions: 'square',
    texture: 'none',
  },
  BOTANICAL_CAFE: {
    presetKey: 'BOTANICAL_CAFE',
    backgroundColor: '#F2F4EA',
    surfaceColor: '#FFFFFF',
    primaryTextColor: '#263C30',
    secondaryTextColor: '#5A6E60',
    accentColor: '#77916F',
    secondaryAccentColor: '#B86D52',
    headingFont: 'Playfair Display',
    bodyFont: 'DM Sans',
    layoutMode: 'GRID',
    cardRadius: '18px',
    buttonStyle: 'pill',
    imageProportions: 'square',
    texture: 'paper',
  },
  PASTEL_PATISSERIE: {
    presetKey: 'PASTEL_PATISSERIE',
    backgroundColor: '#FFF4F2',
    surfaceColor: '#FFFFFF',
    primaryTextColor: '#573641',
    secondaryTextColor: '#8C6774',
    accentColor: '#D98A9B',
    secondaryAccentColor: '#70816B',
    headingFont: 'Instrument Serif',
    bodyFont: 'Plus Jakarta Sans',
    layoutMode: 'GRID',
    cardRadius: '20px',
    buttonStyle: 'pill',
    imageProportions: 'square',
    texture: 'none',
  },
};

/**
 * Calculates relative luminance for WCAG contrast checks
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;
  const rgb = [
    parseInt(cleanHex.substring(0, 2), 16) / 255,
    parseInt(cleanHex.substring(2, 4), 16) / 255,
    parseInt(cleanHex.substring(4, 6), 16) / 255,
  ].map((val) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)));

  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Calculates WCAG contrast ratio between two hex colors
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validates theme colors for minimum readability standards
 */
export function validateThemeAccessibility(theme: Partial<ThemeConfig>): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const bg = theme.backgroundColor || '#F7F3EC';
  const text = theme.primaryTextColor || '#35271F';
  const surface = theme.surfaceColor || '#FFFFFF';

  const textBgRatio = getContrastRatio(text, bg);
  const textSurfaceRatio = getContrastRatio(text, surface);

  if (textBgRatio < 4.5) {
    warnings.push(`Low contrast between main background (${bg}) and text (${text}): ${textBgRatio.toFixed(1)}:1 (minimum recommended is 4.5:1).`);
  }
  if (textSurfaceRatio < 4.5) {
    warnings.push(`Low contrast between card surface (${surface}) and text (${text}): ${textSurfaceRatio.toFixed(1)}:1.`);
  }

  return {
    isValid: textBgRatio >= 3.0 && textSurfaceRatio >= 3.0, // Block if severely unreadable (<3.0)
    warnings,
  };
}

/**
 * Generates dynamic inline CSS variables from a ThemeConfig
 */
export function generateThemeVariables(theme: ThemeConfig): React.CSSProperties {
  const isDark = getLuminance(theme.backgroundColor || '#F7F3EC') < 0.25;
  const border = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const buttonRadius =
    theme.buttonStyle === 'pill' ? '9999px' : theme.buttonStyle === 'sharp' ? '4px' : '14px';

  return {
    '--dishora-bg': theme.backgroundColor,
    '--dishora-surface': theme.surfaceColor,
    '--dishora-text': theme.primaryTextColor,
    '--dishora-muted-text': theme.secondaryTextColor,
    '--dishora-accent': theme.accentColor,
    '--dishora-secondary-accent': theme.secondaryAccentColor,
    '--dishora-border': border,
    '--dishora-card-radius': theme.cardRadius || '16px',
    '--dishora-button-radius': buttonRadius,
    '--card-radius': theme.cardRadius || '16px',
    '--font-heading': theme.headingFont,
    '--font-body': theme.bodyFont,
  } as React.CSSProperties;
}

