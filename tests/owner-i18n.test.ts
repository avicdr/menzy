import { describe, it, expect } from 'vitest';
import {
  MANAGEMENT_DICTIONARY,
  useManagementLanguage,
  ManagementLanguageProvider,
} from '../src/lib/i18n/management-i18n';

describe('Owner Dashboard Bilingual Hindi & English Integration', () => {
  const NAV_KEYS = [
    'nav.overview',
    'nav.menu',
    'nav.illustrations',
    'nav.theme',
    'nav.ai',
    'nav.tables',
    'nav.orders',
    'nav.customers',
    'nav.staff',
    'nav.analytics',
    'nav.settings',
    'nav.billing',
  ];

  it('provides complete Hindi and English translations for all 12 navigation items', () => {
    for (const key of NAV_KEYS) {
      expect(MANAGEMENT_DICTIONARY.en[key]).toBeDefined();
      expect(MANAGEMENT_DICTIONARY.hi[key]).toBeDefined();
      expect(MANAGEMENT_DICTIONARY.en[key].length).toBeGreaterThan(0);
      expect(MANAGEMENT_DICTIONARY.hi[key].length).toBeGreaterThan(0);
    }

    expect(MANAGEMENT_DICTIONARY.en['nav.overview']).toBe('Overview');
    expect(MANAGEMENT_DICTIONARY.hi['nav.overview']).toBe('अवलोकन');
    expect(MANAGEMENT_DICTIONARY.en['nav.tables']).toBe('Tables & QR Codes');
    expect(MANAGEMENT_DICTIONARY.hi['nav.tables']).toBe('टेबल्स और क्यूआर कोड');
    expect(MANAGEMENT_DICTIONARY.en['nav.orders']).toBe('Live Orders & POS');
    expect(MANAGEMENT_DICTIONARY.hi['nav.orders']).toBe('लाइव ऑर्डर्स और पीओएस');
  });

  it('provides translations for trial badge, days left, and logout button', () => {
    expect(MANAGEMENT_DICTIONARY.en['nav.trialEnded']).toBe('Trial Ended');
    expect(MANAGEMENT_DICTIONARY.hi['nav.trialEnded']).toBe('ट्रायल समाप्त');

    expect(MANAGEMENT_DICTIONARY.en['nav.planInactive']).toBe('Plan Inactive');
    expect(MANAGEMENT_DICTIONARY.hi['nav.planInactive']).toBe('प्लान निष्क्रिय');

    expect(MANAGEMENT_DICTIONARY.en['nav.trialPlan']).toBe('Trial Plan');
    expect(MANAGEMENT_DICTIONARY.hi['nav.trialPlan']).toBe('ट्रायल प्लान');

    expect(MANAGEMENT_DICTIONARY.en['nav.daysRemaining']).toBe('{days}d');
    expect(MANAGEMENT_DICTIONARY.hi['nav.daysRemaining']).toBe('{days} दिन');

    expect(MANAGEMENT_DICTIONARY.en['common.logout']).toBe('Logout');
    expect(MANAGEMENT_DICTIONARY.hi['common.logout']).toBe('लॉगआउट');
  });

  it('provides translations for Overview tab operational metrics: Today Revenue, Today Orders, Active Tables, Average Order', () => {
    expect(MANAGEMENT_DICTIONARY.en['overview.todayRevenue']).toBe('Today Revenue');
    expect(MANAGEMENT_DICTIONARY.hi['overview.todayRevenue']).toBe('आज का राजस्व');

    expect(MANAGEMENT_DICTIONARY.en['overview.todayOrders']).toBe("Today's Orders");
    expect(MANAGEMENT_DICTIONARY.hi['overview.todayOrders']).toBe('आज के ऑर्डर');

    expect(MANAGEMENT_DICTIONARY.en['overview.activeTables']).toBe('Active Tables');
    expect(MANAGEMENT_DICTIONARY.hi['overview.activeTables']).toBe('सक्रिय टेबल');

    expect(MANAGEMENT_DICTIONARY.en['overview.averageOrder']).toBe('Average Order');
    expect(MANAGEMENT_DICTIONARY.hi['overview.averageOrder']).toBe('औसत ऑर्डर मूल्य');
  });

  it('provides translations for Overview quick action buttons and section titles', () => {
    expect(MANAGEMENT_DICTIONARY.en['overview.liveFloor']).toBe('Live Floor — All Tables');
    expect(MANAGEMENT_DICTIONARY.hi['overview.liveFloor']).toBe('लाइव फ्लोर — सभी टेबल');

    expect(MANAGEMENT_DICTIONARY.en['overview.viewLiveOrders']).toBe('View Live Orders');
    expect(MANAGEMENT_DICTIONARY.hi['overview.viewLiveOrders']).toBe('लाइव ऑर्डर देखें');

    expect(MANAGEMENT_DICTIONARY.en['overview.manageTables']).toBe('Manage Tables →');
    expect(MANAGEMENT_DICTIONARY.hi['overview.manageTables']).toBe('टेबल्स प्रबंधित करें →');

    expect(MANAGEMENT_DICTIONARY.en['overview.getDinersScanning']).toBe('Get Diners Scanning Today');
    expect(MANAGEMENT_DICTIONARY.hi['overview.getDinersScanning']).toBe('आज ही ग्राहकों को स्कैन करवाएं');

    expect(MANAGEMENT_DICTIONARY.en['overview.downloadQrStudio']).toBe('Download QR Studio');
    expect(MANAGEMENT_DICTIONARY.hi['overview.downloadQrStudio']).toBe('क्यूआर स्टूडियो डाउनलोड करें');

    expect(MANAGEMENT_DICTIONARY.en['overview.importMenu']).toBe('Import Menu (Photos / PDF)');
    expect(MANAGEMENT_DICTIONARY.hi['overview.importMenu']).toBe('मेनू आयात करें (फ़ोटो / पीडीएफ)');

    expect(MANAGEMENT_DICTIONARY.en['overview.menuHighlights']).toBe('Your Menu Highlights');
    expect(MANAGEMENT_DICTIONARY.hi['overview.menuHighlights']).toBe('आपके मेनू की झलक');

    expect(MANAGEMENT_DICTIONARY.en['overview.openMenuStudio']).toBe('Open Menu Studio →');
    expect(MANAGEMENT_DICTIONARY.hi['overview.openMenuStudio']).toBe('मेनू स्टूडियो खोलें →');
  });
});
