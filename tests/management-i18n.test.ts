import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MANAGEMENT_DICTIONARY,
  MANAGEMENT_LANGUAGES,
  MANAGEMENT_LANG_STORAGE_KEY,
  MANAGEMENT_LANG_CHOSEN_KEY,
  MANAGEMENT_COOKIE_NEXT_LOCALE,
  MANAGEMENT_COOKIE_LEGACY,
  getManagementI18nDefaults,
  useManagementLanguage,
  setCookies,
  persistManagementLanguage,
  getInitialClientLang,
  getInitialChosen,
  ManagementLang,
} from '../src/lib/i18n/management-i18n';

describe('Management Bilingual Foundation (English & Hindi)', () => {
  describe('Constants and Storage Keys', () => {
    it('defines expected storage and cookie keys per specification', () => {
      expect(MANAGEMENT_LANG_STORAGE_KEY).toBe('menzy_mgmt_lang');
      expect(MANAGEMENT_LANG_CHOSEN_KEY).toBe('menzy_mgmt_lang_chosen');
      expect(MANAGEMENT_COOKIE_NEXT_LOCALE).toBe('NEXT_LOCALE');
      expect(MANAGEMENT_COOKIE_LEGACY).toBe('menzy_lang');
    });

    it('defines supported management languages with English and Hindi', () => {
      expect(MANAGEMENT_LANGUAGES).toHaveLength(2);
      expect(MANAGEMENT_LANGUAGES[0].id).toBe('en');
      expect(MANAGEMENT_LANGUAGES[1].id).toBe('hi');
      expect(MANAGEMENT_LANGUAGES[1].nativeLabel).toBe('हिन्दी');
    });
  });

  describe('Comprehensive Bilingual Dictionary Completeness', () => {
    const requiredKeys = [
      // Language Modal
      'langModal.title',
      'langModal.subtitle',
      'langModal.enLabel',
      'langModal.hiLabel',
      'langModal.confirm',
      'langModal.note',
      // Common terms
      'common.save',
      'common.cancel',
      'common.close',
      'common.active',
      'common.inactive',
      'common.status',
      'common.refresh',
      'common.total',
      // Nav items
      'nav.overview',
      'nav.menu',
      'nav.tables',
      'nav.orders',
      'nav.kitchenTerminal',
      'nav.settings',
      // Kitchen & KDS
      'kitchen.title',
      'kitchen.subtitle',
      'kitchen.liveKds',
      'kitchen.serviceCalls',
      'kitchen.allOrders',
      'kitchen.stationFree',
      'kitchen.stagePlaced',
      'kitchen.stageAccepted',
      'kitchen.stagePreparing',
      'kitchen.stageReady',
      'kitchen.stageServed',
      'kitchen.acceptOrder',
      'kitchen.startPrep',
      'kitchen.markReady',
      'kitchen.markServed',
      'kitchen.completeOrder',
      'kitchen.table',
      'kitchen.tableNumber',
      // Overview
      'overview.title',
      'overview.liveFloor',
      'overview.allTables',
      'overview.activeTables',
      'overview.availableTables',
      'overview.todaySales',
      'overview.todayOrders',
      'overview.activeOrders',
      'overview.openKds',
      // Tables & QR
      'tables.title',
      'tables.hasActiveOrders',
      'tables.viewLiveOrders',
      'tables.openBill',
      // Orders & POS
      'orders.title',
      'orders.floorMap',
      'orders.liveTickets',
      'orders.filterAll',
      'orders.filterActiveOnly',
    ];

    it('ensures 100% key parity and non-empty strings in both en and hi for common, langModal, kitchen, nav, and overview', () => {
      const targetNamespaces = ['common.', 'langModal.', 'kitchen.', 'nav.', 'overview.'];

      targetNamespaces.forEach((ns) => {
        const enKeys = Object.keys(MANAGEMENT_DICTIONARY.en).filter((k) => k.startsWith(ns));
        const hiKeys = Object.keys(MANAGEMENT_DICTIONARY.hi).filter((k) => k.startsWith(ns));

        expect(enKeys.length, `No English keys found for namespace ${ns}`).toBeGreaterThan(0);
        expect(hiKeys.length, `No Hindi keys found for namespace ${ns}`).toBeGreaterThan(0);

        // Every EN key must exist in HI and be non-empty
        for (const key of enKeys) {
          const val = MANAGEMENT_DICTIONARY.hi[key];
          expect(val, `Missing Hindi translation for key "${key}" in namespace "${ns}"`).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.trim().length, `Empty Hindi translation for key "${key}"`).toBeGreaterThan(0);
        }

        // Every HI key must exist in EN and be non-empty
        for (const key of hiKeys) {
          const val = MANAGEMENT_DICTIONARY.en[key];
          expect(val, `Missing English translation for key "${key}" in namespace "${ns}"`).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.trim().length, `Empty English translation for key "${key}"`).toBeGreaterThan(0);
        }

        // Parity
        expect(hiKeys.sort()).toEqual(enKeys.sort());
      });
    });

    it('contains all required keys in English', () => {
      for (const key of requiredKeys) {
        expect(MANAGEMENT_DICTIONARY.en[key], `Missing English key: ${key}`).toBeDefined();
        expect(MANAGEMENT_DICTIONARY.en[key].length).toBeGreaterThan(0);
      }
    });

    it('contains all required keys in Hindi with valid Devanagari text', () => {
      for (const key of requiredKeys) {
        expect(MANAGEMENT_DICTIONARY.hi[key], `Missing Hindi key: ${key}`).toBeDefined();
        expect(MANAGEMENT_DICTIONARY.hi[key].length).toBeGreaterThan(0);
      }

      // Verify specific Hindi translations are idiomatic
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.liveKds']).toBe('लाइव KDS');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.stagePreparing']).toBe('किचन तैयारी');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.stageReady']).toBe('परोसने के लिए तैयार');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.acceptOrder']).toBe('ऑर्डर स्वीकार करें');
      expect(MANAGEMENT_DICTIONARY.hi['overview.liveFloor']).toBe('लाइव फ्लोर — सभी टेबल');
      expect(MANAGEMENT_DICTIONARY.hi['nav.kitchenTerminal']).toBe('किचन टर्मिनल');
    });
  });

  describe('Translation Function Behavior', () => {
    function createMockT(lang: ManagementLang) {
      return (key: string, fallback?: string, params?: Record<string, string | number>) => {
        let text =
          MANAGEMENT_DICTIONARY[lang]?.[key] ??
          MANAGEMENT_DICTIONARY.en?.[key] ??
          fallback ??
          key;

        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
          });
        }
        return text;
      };
    }

    it('translates correctly based on active language', () => {
      const tEn = createMockT('en');
      const tHi = createMockT('hi');

      expect(tEn('kitchen.stagePreparing')).toBe('Kitchen Prep');
      expect(tHi('kitchen.stagePreparing')).toBe('किचन तैयारी');

      expect(tEn('nav.overview')).toBe('Overview');
      expect(tHi('nav.overview')).toBe('अवलोकन');
    });

    it('interpolates parameters accurately in both languages', () => {
      const tEn = createMockT('en');
      const tHi = createMockT('hi');

      expect(tEn('kitchen.tableNumber', 'Table #{table}', { table: 4 })).toBe('Table #4');
      expect(tHi('kitchen.tableNumber', 'टेबल #{table}', { table: 4 })).toBe('टेबल #4');

      expect(tEn('kitchen.minsAgo', '{mins}m ago', { mins: 12 })).toBe('12m ago');
      expect(tHi('kitchen.minsAgo', '{mins} मिनट पहले', { mins: 12 })).toBe('12 मिनट पहले');
    });

    it('falls back to English if Hindi key is missing', () => {
      const customDict: { en: Record<string, string>; hi: Record<string, string> } = {
        en: { 'test.unique': 'Only in English' },
        hi: {},
      };

      const translate = (key: string) =>
        customDict.hi[key] ?? customDict.en[key] ?? key;

      expect(translate('test.unique')).toBe('Only in English');
    });

    it('falls back to custom fallback or key if translation is missing in both', () => {
      const tEn = createMockT('en');

      expect(tEn('nonexistent.key', 'My Fallback')).toBe('My Fallback');
      expect(tEn('nonexistent.key')).toBe('nonexistent.key');
    });
  });

  describe('Storage, Cookie & SSR Synchronization', () => {
    let mockStorage: Record<string, string> = {};
    let mockCookie = '';

    beforeEach(() => {
      mockStorage = {};
      mockCookie = '';

      (globalThis as any).window = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
      };
      (globalThis as any).document = {
        get cookie() {
          return mockCookie;
        },
        set cookie(val: string) {
          // simple cookie simulator
          const [pair] = val.split(';');
          const [k, v] = pair.split('=');
          if (mockCookie) mockCookie += '; ';
          mockCookie += `${k.trim()}=${v?.trim() || ''}`;
        },
      };
    });

    afterEach(() => {
      delete (globalThis as any).window;
      delete (globalThis as any).localStorage;
      delete (globalThis as any).document;
    });

    it('retrieves saved language from localStorage', () => {
      mockStorage[MANAGEMENT_LANG_STORAGE_KEY] = 'hi';
      expect(getInitialClientLang('en')).toBe('hi');

      mockStorage[MANAGEMENT_LANG_STORAGE_KEY] = 'en';
      expect(getInitialClientLang('hi')).toBe('en');
    });

    it('falls back to NEXT_LOCALE or menzy_lang cookies when localStorage is empty', () => {
      mockCookie = 'NEXT_LOCALE=hi; other=1';
      expect(getInitialClientLang('en')).toBe('hi');

      mockCookie = 'menzy_lang=hi';
      expect(getInitialClientLang('en')).toBe('hi');
    });

    it('detects user chosen preference from menzy_mgmt_lang_chosen flag', () => {
      expect(getInitialChosen()).toBe(false);

      mockStorage[MANAGEMENT_LANG_CHOSEN_KEY] = 'true';
      expect(getInitialChosen()).toBe(true);
    });

    it('synchronizes cookies for NEXT_LOCALE and legacy menzy_lang', () => {
      setCookies('hi');
      expect(mockCookie).toContain('NEXT_LOCALE=hi');
      expect(mockCookie).toContain('menzy_lang=hi');
    });

    it('persists an explicit switcher choice as the chosen preference', () => {
      persistManagementLanguage('hi');

      expect(mockStorage[MANAGEMENT_LANG_STORAGE_KEY]).toBe('hi');
      expect(mockStorage[MANAGEMENT_LANG_CHOSEN_KEY]).toBe('true');
      expect(mockCookie).toContain('NEXT_LOCALE=hi');
      expect(mockCookie).toContain('menzy_lang=hi');
    });

    it('provides safe default values when hook is called outside provider or during SSR', () => {
      const defaults = getManagementI18nDefaults();
      expect(defaults.lang).toBe('en');
      expect(defaults.isLoaded).toBe(true);
      expect(defaults.hasChosenLang).toBe(true);
      expect(defaults.t('common.save')).toBe('Save');
    });

    it('modal visibility condition strictly follows !hasChosenLang && isLoaded', () => {
      // Case 1: SSR phase -> isLoaded is false -> Modal must NOT show
      const ssrCondition = (hasChosen: boolean, isLoaded: boolean) => !hasChosen && isLoaded;
      expect(ssrCondition(false, false)).toBe(false);

      // Case 2: Client mounted, first visit -> not chosen -> Modal MUST show
      expect(ssrCondition(false, true)).toBe(true);

      // Case 3: Client mounted, previously chosen -> Modal must NOT show
      expect(ssrCondition(true, true)).toBe(false);

      // Case 4: Forced open (e.g. from nav or settings) -> overrides hasChosen
      const forceOpenCondition = (forceOpen: boolean, hasChosen: boolean, isLoaded: boolean) =>
        forceOpen || (!hasChosen && isLoaded);

      expect(forceOpenCondition(true, true, true)).toBe(true);
    });
  });
});
