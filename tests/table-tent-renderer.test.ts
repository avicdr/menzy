import { describe, it, expect } from 'vitest';
import {
  buildTableTentSvg,
  getDefaultTableTentConfig,
  getTentDimensions,
  resolveTentFonts,
  resolveTentPalette,
} from '../src/lib/qr/table-tent-renderer';

describe('Table Stand & A4 QR Poster Renderer', () => {
  const sampleQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
  const sampleMenzyLogo = 'data:image/png;base64,MENZYLOGOBASE64DATA';

  it('generates exact Table Stand (A6/4x6) and A4 Poster SVG dimensions with Menzy logo embedded', () => {
    const baseConfig = getDefaultTableTentConfig({ showLogo: true, hasBanner: false, hasWifi: true });
    const ctx = {
      restaurantName: 'The J&H Cafe',
      tableName: 'Table 01',
      tableSection: 'Terrace',
      qrDataUrl: sampleQr,
      menzyLogoDataUrl: sampleMenzyLogo,
      wifiSsid: 'JHCafe_5G',
      wifiPassword: 'freshcoffee',
    };

    const standSvg = buildTableTentSvg({ ...baseConfig, format: 'TABLE_STAND' }, ctx);
    expect(standSvg).toContain('width="105mm" height="148mm"');
    expect(standSvg).toContain('The J&amp;H Cafe');
    expect(standSvg).toContain('Table 01  •  Terrace');
    expect(standSvg).toContain('POWERED BY MENZY');
    // Embedded in both QR center badge and bottom Menzy footer lockup
    expect(standSvg.split(sampleMenzyLogo).length - 1).toBe(2);
    expect(standSvg).toContain('Free Wi-Fi: JHCafe_5G');

    const a4Svg = buildTableTentSvg({ ...baseConfig, format: 'A4_POSTER', template: 'MIDNIGHT_LUXE' }, ctx);
    expect(a4Svg).toContain('width="210mm" height="297mm"');
    expect(a4Svg).toContain('fill="#14110F"');
    expect(a4Svg).toContain('POWERED BY MENZY');
    expect(a4Svg.split(sampleMenzyLogo).length - 1).toBe(2);

    expect(getTentDimensions('TABLE_STAND').pngWidth).toBe(1200);
    expect(getTentDimensions('A4_POSTER').pngWidth).toBe(1654);
  });

  it('resolves brand theme colors cleanly and respects custom accent override', () => {
    const palette = resolveTentPalette(
      'BRAND',
      {
        backgroundColor: '#12100E',
        surfaceColor: '#1C1713',
        primaryTextColor: '#FAF7F2',
        secondaryTextColor: '#A89F91',
        accentColor: '#D4883A',
      },
      '#2B7A5B'
    );

    expect(palette.cardBg).toBe('#12100E');
    expect(palette.isDark).toBe(true);
    expect(palette.accentColor).toBe('#2B7A5B');
    expect(palette.qrFrameBg).toBe('#FFFFFF');
  });

  it('resolves and applies custom heading and body fonts faithfully', () => {
    const defaultFonts = resolveTentFonts(
      { headingFont: null, bodyFont: null },
      { headingFont: 'DM Serif Display', bodyFont: 'Manrope' }
    );
    expect(defaultFonts.headingFont).toBe('DM Serif Display');
    expect(defaultFonts.bodyFont).toBe('Manrope');

    const customFonts = resolveTentFonts(
      { headingFont: 'Lora', bodyFont: 'Outfit' },
      { headingFont: 'Playfair Display', bodyFont: 'Inter' }
    );
    expect(customFonts.headingFont).toBe('Lora');
    expect(customFonts.bodyFont).toBe('Outfit');

    const config = {
      ...getDefaultTableTentConfig(),
      headingFont: 'Lora',
      bodyFont: 'Outfit',
    };

    // Export SVG with embedded font CSS
    const exportSvg = buildTableTentSvg(config, {
      restaurantName: 'Bistro 42',
      tableName: 'Table 07',
      qrDataUrl: sampleQr,
      menzyLogoDataUrl: sampleMenzyLogo,
      logoDataUrl: 'data:image/png;base64,LOGO',
      embeddedFontCss: "@font-face{font-family:'Lora';src:url('data:font/woff2;base64,AAA');}",
      useInlineCssVars: false,
      svgIdPrefix: 'custom-t7',
    });

    expect(exportSvg).toContain("@font-face{font-family:'Lora'");
    expect(exportSvg).toContain('font-family="&apos;Lora&apos;, Georgia, &apos;Times New Roman&apos;, serif"');
    expect(exportSvg).toContain('font-family="&apos;Outfit&apos;, -apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, sans-serif"');
    expect(exportSvg).toContain('id="custom-t7-cardClip"');
    expect(exportSvg).toContain('clip-path="url(#custom-t7-cardClip)"');
    expect(exportSvg).toContain('id="custom-t7-logoClip"');
    expect(exportSvg).toContain('clip-path="url(#custom-t7-logoClip)"');

    // Live preview SVG with CSS variables
    const previewSvg = buildTableTentSvg(config, {
      restaurantName: 'Bistro 42',
      tableName: 'Table 07',
      qrDataUrl: sampleQr,
      menzyLogoDataUrl: sampleMenzyLogo,
      useInlineCssVars: true,
      svgIdPrefix: 'preview-t7',
    });

    expect(previewSvg).toContain('--font-next-lora');
    expect(previewSvg).toContain('--font-next-outfit');
    expect(previewSvg).toContain('id="preview-t7-cardClip"');
  });
});
