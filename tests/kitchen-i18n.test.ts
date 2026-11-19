import { describe, it, expect } from 'vitest';
import {
  MANAGEMENT_DICTIONARY,
  ManagementLang,
} from '../src/lib/i18n/management-i18n';

describe('Kitchen & Staff Terminal Bilingual (Hindi & English) Integration', () => {
  const languages: ManagementLang[] = ['en', 'hi'];

  describe('Filter Pills Translations', () => {
    const filterKeys = [
      'kitchen.allTickets',
      'kitchen.new',
      'kitchen.filterAccepted',
      'kitchen.filterPrep',
      'kitchen.filterReady',
      'kitchen.filterServed',
    ];

    it.each(languages)('has all filter pills in %s', (lang) => {
      filterKeys.forEach((key) => {
        expect(MANAGEMENT_DICTIONARY[lang][key]).toBeDefined();
        expect(MANAGEMENT_DICTIONARY[lang][key].trim().length).toBeGreaterThan(0);
      });
    });

    it('has authentic Hindi filter pills', () => {
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.allTickets']).toBe('सभी टिकट');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.new']).toBe('नए');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.filterAccepted']).toBe('स्वीकृत');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.filterPrep']).toBe('किचन तैयारी');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.filterReady']).toBe('परोसने के लिए तैयार');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.filterServed']).toBe('परोसा गया');
    });
  });

  describe('Status Badges & Action Buttons', () => {
    const actionKeys = [
      'kitchen.accept',
      'kitchen.startCooking',
      'kitchen.orderReadyBell',
      'kitchen.serveToTable',
      'kitchen.completeTicket',
      'kitchen.settleBill',
      'kitchen.reject',
      'kitchen.callWaiterAction',
    ];

    it.each(languages)('has all action buttons and badges in %s', (lang) => {
      actionKeys.forEach((key) => {
        expect(MANAGEMENT_DICTIONARY[lang][key]).toBeDefined();
        expect(MANAGEMENT_DICTIONARY[lang][key].trim().length).toBeGreaterThan(0);
      });
    });

    it('has authentic Hindi action labels', () => {
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.accept']).toBe('स्वीकार करें');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.startCooking']).toBe('पकाना शुरू करें');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.orderReadyBell']).toContain('ऑर्डर तैयार');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.serveToTable']).toContain('टेबल पर परोसें');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.completeTicket']).toBe('टिकट पूरा करें');
      expect(MANAGEMENT_DICTIONARY.hi['kitchen.reject']).toBe('अस्वीकार करें');
    });
  });

  describe('Order Card Metadata & Empty States', () => {
    const metadataKeys = [
      'kitchen.table',
      'kitchen.items',
      'kitchen.note',
      'kitchen.option',
      'kitchen.dineInGuest',
      'kitchen.soundChimeOn',
      'kitchen.soundMuted',
      'kitchen.totalAmount',
      'kitchen.paid',
      'kitchen.unpaid',
      'kitchen.minsAgo',
      'kitchen.justNow',
      'kitchen.noIncoming',
      'kitchen.noQueued',
      'kitchen.stationFreeDesc',
      'kitchen.noDishesPass',
      'kitchen.noActiveServed',
    ];

    it.each(languages)('has all card metadata and empty states in %s', (lang) => {
      metadataKeys.forEach((key) => {
        expect(MANAGEMENT_DICTIONARY[lang][key]).toBeDefined();
        expect(MANAGEMENT_DICTIONARY[lang][key].trim().length).toBeGreaterThan(0);
      });
    });

    it('formats parameter placeholders correctly in both English and Hindi', () => {
      const enNote = MANAGEMENT_DICTIONARY.en['kitchen.note'].replace('{note}', 'Extra spicy');
      expect(enNote).toBe('Note: Extra spicy');

      const hiNote = MANAGEMENT_DICTIONARY.hi['kitchen.note'].replace('{note}', 'कम मिर्च');
      expect(hiNote).toBe('नोट: कम मिर्च');

      const enOption = MANAGEMENT_DICTIONARY.en['kitchen.option'].replace('{variant}', 'Large');
      expect(enOption).toBe('Option: Large');

      const hiOption = MANAGEMENT_DICTIONARY.hi['kitchen.option'].replace('{variant}', 'बड़ा');
      expect(hiOption).toBe('विकल्प: बड़ा');

      const enElapsed = MANAGEMENT_DICTIONARY.en['kitchen.cookingElapsed'].replace('{elapsed}', '5m');
      expect(enElapsed).toBe('Cooking (5m)');

      const hiElapsed = MANAGEMENT_DICTIONARY.hi['kitchen.cookingElapsed'].replace('{elapsed}', '5m');
      expect(hiElapsed).toBe('तैयार हो रहा है (5m)');
    });
  });

  describe('Waiter Dispatch and Table Service', () => {
    it.each(languages)('has all waiter service call strings in %s', (lang) => {
      const keys = [
        'kitchen.waiterNeeded',
        'kitchen.waiterNeededDesc',
        'kitchen.waterService',
        'kitchen.cutleryService',
        'kitchen.billService',
        'kitchen.needsWaiter',
        'kitchen.attending',
        'kitchen.markAttended',
      ];
      keys.forEach((key) => {
        expect(MANAGEMENT_DICTIONARY[lang][key]).toBeDefined();
        expect(MANAGEMENT_DICTIONARY[lang][key].trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Order History & Staff Login', () => {
    it.each(languages)('has history and login strings in %s', (lang) => {
      const keys = [
        'history.title',
        'history.thCustomer',
        'history.exportCsv',
        'history.liveTerminal',
        'history.totalOrders',
        'history.searchPlaceholder',
        'login.backToMenzy',
        'login.staffBadge',
        'login.staffTitle',
        'login.staffLoginId',
        'login.password',
        'login.launchTerminal',
      ];
      keys.forEach((key) => {
        expect(MANAGEMENT_DICTIONARY[lang][key]).toBeDefined();
        expect(MANAGEMENT_DICTIONARY[lang][key].trim().length).toBeGreaterThan(0);
      });
    });
  });
});
