import { describe, it, expect } from 'vitest';
import {
  buildTableTentSvg,
  getDefaultTableTentConfig,
  getTentDimensions,
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
});
