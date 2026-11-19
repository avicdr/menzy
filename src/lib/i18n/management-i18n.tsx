'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type ManagementLang = 'en' | 'hi';

export const MANAGEMENT_LANG_STORAGE_KEY = 'menzy_mgmt_lang';
export const MANAGEMENT_LANG_CHOSEN_KEY = 'menzy_mgmt_lang_chosen';
export const MANAGEMENT_COOKIE_NEXT_LOCALE = 'NEXT_LOCALE';
export const MANAGEMENT_COOKIE_LEGACY = 'menzy_lang';

export interface ManagementLanguageContextValue {
  lang: ManagementLang;
  setLang: (l: ManagementLang) => void;
  hasChosenLang: boolean;
  setChosenLang: (l: ManagementLang) => void;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
  isLoaded: boolean;
}

export const MANAGEMENT_LANGUAGES: { id: ManagementLang; label: string; nativeLabel: string; hint: string }[] = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    hint: 'Default management console, live orders and kitchen display',
  },
  {
    id: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    hint: 'किचन डिस्प्ले, लाइव ऑर्डर्स और सभी सेटिंग्स हिंदी में',
  },
];

export const MANAGEMENT_DICTIONARY: Record<ManagementLang, Record<string, string>> = {
  en: {
    // Language Preference Modal
    'langModal.firstTimeGreeting': 'Welcome to Menzy',
    'langModal.title': 'Choose your preferred language',
    'langModal.subtitle': 'Select your preferred language for kitchen ticketing, order fulfillment, and management console.',
    'langModal.enLabel': 'English',
    'langModal.enNative': 'English',
    'langModal.enDesc': 'Clean, modern English interface for management and kitchen operations',
    'langModal.hiLabel': 'Hindi',
    'langModal.hiNative': 'हिन्दी',
    'langModal.hiDesc': 'किचन डिस्प्ले, लाइव ऑर्डर्स और सभी सेटिंग्स हिंदी में प्रबंधित करें',
    'langModal.note': 'You can switch language anytime from the top bar or settings.',
    'langModal.confirm': 'Continue to Console',
    'langModal.selectedBadge': 'Selected',
    'langModal.changeLater': 'Change anytime in top bar',
    'langModal.previewEn': 'Kitchen Prep • Ready to Serve',
    'langModal.previewHi': 'किचन तैयारी • परोसने के लिए तैयार',

    // Common terms
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.saved': 'Saved',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.loading': 'Loading...',
    'common.refresh': 'Refresh',
    'common.logout': 'Logout',
    'common.back': 'Back',
    'common.view': 'View',
    'common.details': 'Details',
    'common.total': 'Total',
    'common.notes': 'Notes',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.language': 'Language',
    'common.confirm': 'Confirm',
    'common.dismiss': 'Dismiss',
    'common.copy': 'Copy',
    'common.copied': 'Copied to clipboard',
    'common.print': 'Print',
    'common.download': 'Download',
    'common.export': 'Export',
    'common.live': 'Live',
    'common.offline': 'Offline',
    'common.online': 'Online',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Nav items
    'nav.overview': 'Overview',
    'nav.menu': 'Menu Studio',
    'nav.illustrations': 'Illustration Lab',
    'nav.theme': 'Theme Studio',
    'nav.ai': 'AI Waiter',
    'nav.tables': 'Tables & QR Codes',
    'nav.orders': 'Live Orders & POS',
    'nav.customers': 'Customers & Credit',
    'nav.staff': 'Staff & Access',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.billing': 'Billing & Usage',
    'nav.ownerConsole': 'Owner Console',
    'nav.kitchenTerminal': 'Kitchen Terminal',
    'nav.viewMenu': 'Live Menu',
    'nav.activeRestaurant': 'Active Restaurant',
    'nav.switchRestaurant': 'Switch Restaurant',
    'nav.switchLanguage': 'Switch Language',
    'nav.trialEnded': 'Trial Ended',
    'nav.planInactive': 'Plan Inactive',
    'nav.trialPlan': 'Trial Plan',
    'nav.daysRemaining': '{days}d',
    'nav.planBadge': '{plan} Plan',
    'nav.renew': 'Renew',
    'nav.setupSupport': 'Setup Queries Support',
    'nav.verifiedOwner': 'Verified Owner',

    // Kitchen terms & KDS
    'kitchen.title': 'Kitchen & Staff Terminal',
    'kitchen.subtitle': 'Kitchen Display System (KDS) & Waiter Dispatch',
    'kitchen.liveKds': 'LIVE KDS',
    'kitchen.orderTerminal': 'Order Terminal',
    'kitchen.activeTickets': 'Active Tickets',
    'kitchen.serviceCalls': 'Waiter Service Calls',
    'kitchen.tableCalls': 'Table Calls',
    'kitchen.noServiceCalls': 'No pending waiter service calls',
    'kitchen.soundAlerts': 'Sound Alerts',
    'kitchen.soundOn': 'CHIME ON',
    'kitchen.soundOff': 'MUTED',
    'kitchen.allOrders': 'All Active Orders',
    'kitchen.stationFree': 'Kitchen station free',
    'kitchen.noOrdersDesc': 'New orders will appear automatically with live audio chime',
    'kitchen.stagePlaced': 'New Orders',
    'kitchen.stageAccepted': 'Accepted',
    'kitchen.stagePreparing': 'Kitchen Prep',
    'kitchen.stageReady': 'Ready to Serve',
    'kitchen.stageServed': 'Served',
    'kitchen.stageCompleted': 'Completed',
    'kitchen.stageCancelled': 'Cancelled',
    'kitchen.stageRejected': 'Rejected',
    'kitchen.acceptOrder': 'Accept Order',
    'kitchen.startPrep': 'Start Prep',
    'kitchen.markReady': 'Mark Ready',
    'kitchen.markServed': 'Mark Served',
    'kitchen.completeOrder': 'Complete Order',
    'kitchen.rejectOrder': 'Reject',
    'kitchen.table': 'Table',
    'kitchen.tableNumber': 'Table #{table}',
    'kitchen.orderNumber': 'Order #{number}',
    'kitchen.items': 'Items',
    'kitchen.quantity': 'Qty',
    'kitchen.prepTime': 'Elapsed Time',
    'kitchen.specialInstructions': 'Kitchen Notes / Instructions',
    'kitchen.veg': 'Veg',
    'kitchen.nonVeg': 'Non-Veg',
    'kitchen.egg': 'Egg',
    'kitchen.callWaiter': 'Call Waiter',
    'kitchen.billRequested': 'Bill Requested',
    'kitchen.waterRequested': 'Water Requested',
    'kitchen.helpRequested': 'Assistance Requested',
    'kitchen.resolveCall': 'Resolve',
    'kitchen.orderHistory': 'Order History',
    'kitchen.backToKds': 'Back to Live KDS',
    'kitchen.terminalPaused': 'Kitchen & Service Terminal Paused',
    'kitchen.checkStatus': 'Check Status',
    'kitchen.switchTerminal': 'Switch or Log Out Terminal',
    'kitchen.connecting': 'Connecting to Live Kitchen Display...',
    'kitchen.dineIn': 'Dine-In',
    'kitchen.takeaway': 'Takeaway',
    'kitchen.delivery': 'Delivery',
    'kitchen.refreshOrders': 'Refresh Live Orders',
    'kitchen.minsAgo': '{mins}m ago',
    'kitchen.justNow': 'Just now',
    'kitchen.guestName': 'Guest Name',
    'kitchen.guestPhone': 'Mobile',
    'kitchen.dineInGuest': 'Dine-in Guest',
    // Kitchen extensions
    'kitchen.allTickets': 'All Tickets',
    'kitchen.new': 'New',
    'kitchen.filterAccepted': 'Accepted',
    'kitchen.filterPrep': 'Kitchen Prep',
    'kitchen.filterReady': 'Ready to Serve',
    'kitchen.filterServed': 'Served',
    'kitchen.incomingTickets': 'Incoming Tickets',
    'kitchen.queuedAcknowledged': 'Queued / Acknowledged',
    'kitchen.inPreparation': 'In Preparation',
    'kitchen.passReady': 'Pass / Ready for Table',
    'kitchen.servedTable': 'Served Table',
    'kitchen.accept': 'Accept',
    'kitchen.startCooking': 'Start Cooking',
    'kitchen.orderReadyBell': 'Order Ready 🔔',
    'kitchen.serveToTable': 'Serve to Table ✓',
    'kitchen.completeTicket': 'Complete Ticket',
    'kitchen.settleBill': 'Settle Bill',
    'kitchen.callWaiterAction': 'Call Waiter',
    'kitchen.reject': 'Reject',
    'kitchen.syncing': 'Syncing...',
    'kitchen.closing': 'Closing...',
    'kitchen.plated': 'Plated',
    'kitchen.dining': 'Dining',
    'kitchen.cookingElapsed': 'Cooking ({elapsed})',
    'kitchen.paid': 'Paid',
    'kitchen.unpaid': 'Unpaid',
    'kitchen.totalAmount': 'Total',
    'kitchen.chefNote': 'Chef Note',
    'kitchen.note': 'Note: {note}',
    'kitchen.option': 'Option: {variant}',
    'kitchen.waiterNeeded': 'Floor Waiter Needed ({count} Pending)',
    'kitchen.waiterNeededDesc': 'Diners at the tables below have requested service.',
    'kitchen.waterService': '💧 Water & Glasses',
    'kitchen.cutleryService': '🍽️ Cutlery & Napkins',
    'kitchen.billService': '🧾 Bring Bill',
    'kitchen.needsWaiter': '🙋 Needs Waiter',
    'kitchen.attending': 'Attending...',
    'kitchen.markAttended': 'Mark Attended ✓',
    'kitchen.noIncoming': 'No incoming tickets at this moment',
    'kitchen.noQueued': 'No queued tickets',
    'kitchen.stationFreeDesc': 'Kitchen station free',
    'kitchen.noDishesPass': 'No dishes on the pass',
    'kitchen.noActiveServed': 'No active tables served',
    'kitchen.liveKdsBadge': 'LIVE KDS',
    'kitchen.activeTicketsBadge': '{count} Active Tickets',
    'kitchen.tableCallsBadge': '{count} Table Calls',
    'kitchen.soundChimeOn': 'CHIME ON',
    'kitchen.soundMuted': 'MUTED',
    'kitchen.soundEnabledTitle': 'Order audio chime enabled (Click to mute)',
    'kitchen.soundDisabledTitle': 'Order audio chime disabled (Click to enable)',
    'kitchen.orderHistoryTitle': 'Order History',
    'kitchen.logoutTitle': 'Log Out Terminal',
    'kitchen.retryConnection': 'Retry Connection',

    // Order History extensions
    'history.title': 'Order History',
    'history.subtitle': '{name} • Historical Logs & Audit Records',
    'history.backToLive': 'Back to Live Kitchen Terminal',
    'history.exportCsv': 'Export CSV',
    'history.liveTerminal': 'Live Terminal',
    'history.totalOrders': 'Total Filtered Orders',
    'history.totalValue': 'Recorded Order Value',
    'history.aov': 'Average Order Value (AOV)',
    'history.searchPlaceholder': 'Search by order number or dish name...',
    'history.today': 'Today',
    'history.yesterday': 'Yesterday',
    'history.last7Days': 'Last 7 Days',
    'history.last30Days': 'Last 30 Days',
    'history.allStatuses': 'All Statuses',
    'history.thOrder': 'Order #',
    'history.thTable': 'Table',
    'history.thCustomer': 'Customer',
    'history.thDateTime': 'Date & Time',
    'history.thDishes': 'Dishes Summary',
    'history.thTotal': 'Total Amount',
    'history.thStatus': 'Status',
    'history.thHandledBy': 'Handled By',
    'history.noOrders': 'No historical orders found matching this filter criteria.',
    'history.pageInfo': 'Page {page} of {totalPages} ({totalCount} total)',
    'history.loadingLogs': 'Loading Historical Logs...',

    // Staff Login extensions
    'login.backToMenzy': 'Back to Menzy',
    'login.staffBadge': 'Staff & Kitchen KDS',
    'login.staffTitle': 'Staff Order Terminal',
    'login.venueTerminal': '{venue} Terminal',
    'login.subtitle': 'Kitchen Display System (KDS), floor waiter dispatch & live table fulfillment',
    'login.staffLoginId': 'Staff Login ID',
    'login.password': 'Password',
    'login.placeholderId': 'e.g. kitchen-01 or staff-lead',
    'login.launchTerminal': 'Launch Order Terminal',
    'login.connecting': 'Connecting to Terminal...',
    'login.quickFillDemo': 'Quick Fill Demo Accounts',
    'login.demoNote': 'Staff access accounts are configured securely by the restaurant owner in the Staff & Access portal.',

    // Dashboard Overview
    'overview.title': 'Restaurant Overview',
    'overview.liveFloor': 'Live Floor — All Tables',
    'overview.allTables': 'All Tables',
    'overview.activeTables': 'Active Tables',
    'overview.availableTables': 'Available',
    'overview.occupied': 'Occupied',
    'overview.vacant': 'Vacant',
    'overview.todaySales': "Today's Sales",
    'overview.todayOrders': "Today's Orders",
    'overview.activeOrders': 'Active Orders',
    'overview.quickActions': 'Quick Actions',
    'overview.openKds': 'Open Dedicated Kitchen Terminal',
    'overview.manageMenu': 'Manage Menu',
    'overview.viewQrCodes': 'View QR Codes',
    'overview.recentOrders': 'Recent Orders',
    'overview.noActiveOrders': 'No active orders at this moment',
    'overview.viewAllOrders': 'View All Orders',
    'overview.salesVolume': 'Sales Volume',
    'overview.averageOrder': 'Average Order',
    'overview.averageOrderValue': 'Average Order Value',
    'overview.todayRevenue': 'Today Revenue',
    'overview.totalMenuItems': 'Total Menu Items',
    'overview.qrScansToday': 'QR Scans Today',
    'overview.aiQuestions': 'AI Questions',
    'overview.creditsLeft': '3D Credits Left',
    'overview.liveSearchable': 'Live & searchable',
    'overview.loadingMenu': 'Loading menu...',
    'overview.loadingScans': 'Loading scans...',
    'overview.activeEngagement': 'Active engagement',
    'overview.noScansToday': 'No scans yet today',
    'overview.monthlyAllowance': 'of {max} monthly allowance',
    'overview.loadingUsage': 'Loading usage...',
    'overview.loadingPlan': 'Loading plan...',
    'overview.clickTableHint': 'Click any table to jump straight to its live orders.',
    'overview.manageTables': 'Manage Tables →',
    'overview.noTablesSetup': 'No tables set up yet. Add your dining tables to print QR codes and track live orders at a glance.',
    'overview.setUpTables': 'Set Up Tables',
    'overview.getDinersScanning': 'Get Diners Scanning Today',
    'overview.getDinersScanningDesc': 'Download high-resolution QR codes and printable 4x6" table tents for your tables.',
    'overview.downloadQrStudio': 'Download QR Studio',
    'overview.importMenu': 'Import Menu (Photos / PDF)',
    'overview.menuHighlights': 'Your Menu Highlights',
    'overview.openMenuStudio': 'Open Menu Studio →',
    'overview.uploadMenuPrompt': 'Upload your menu photos or PDF to get started',
    'overview.uploadMenuDesc': 'Choose multiple menu photos (JPG, PNG, WebP, HEIC) or a PDF menu — AI automatically extracts dishes, categories, prices, and Veg/Non-Veg indicators.',
    'overview.uploadMenuPhotos': 'Upload Menu Photos',
    'overview.uploadMenuPdf': 'Upload Menu PDF',
    'overview.supportTitle': 'Setup & Onboarding Support',
    'overview.supportDesc': 'For menu import, QR printing, or setup-related queries, email us anytime.',
    'overview.openBill': 'Open Bill',
    'overview.viewLiveOrders': 'View Live Orders',
    'overview.viewLiveMenu': 'View Live Diner Menu',

    // Tables & QR
    'tables.title': 'Tables & QR Codes',
    'tables.subtitle': 'Manage dining tables, generate printable table tent QR codes, and monitor floor activity',
    'tables.addTable': 'Add Single Table',
    'tables.bulkGenerate': 'Bulk Generate',
    'tables.qrDesigner': 'QR Studio',
    'tables.bulkPrint': 'Bulk Print',
    'tables.allFilter': 'All Tables',
    'tables.activeFilter': 'Active Orders',
    'tables.availableFilter': 'Available',
    'tables.hasActiveOrders': 'Active Orders',
    'tables.noActiveOrders': 'Available',
    'tables.viewLiveOrders': 'View Live Orders',
    'tables.openBill': 'Open Bill',
    'tables.capacity': 'Capacity',
    'tables.seats': '{count} Seats',
    'tables.section': 'Section',
    'tables.rotateQr': 'Rotate QR',
    'tables.disableTable': 'Disable Table',
    'tables.enableTable': 'Enable Table',
    'tables.archiveTable': 'Archive',

    // Live Orders & POS tab
    'orders.title': 'Live Orders & POS',
    'orders.subtitle': 'Monitor real-time table orders, update kitchen preparation workflows, and view telemetry',
    'orders.openDedicatedKds': 'Open Dedicated Kitchen Terminal',
    'orders.floorMap': 'All Tables Floor Map',
    'orders.liveTickets': 'Live Order Tickets',
    'orders.orderHistory': 'Order History',
    'orders.searchPlaceholder': 'Search order # or table...',
    'orders.filterAll': 'All Tables',
    'orders.filterActiveOnly': 'Active Only',
    'orders.unfilterTable': 'Show all tables',
    'orders.focusingTable': 'Filtered to Table {table}',
    'orders.accept': 'Accept',
    'orders.prep': 'Start Prep',
    'orders.ready': 'Mark Ready',
    'orders.serve': 'Mark Served',
    'orders.complete': 'Settle / Complete',

    // Menu Studio
    'menu.title': 'Menu Studio',
    'menu.categories': 'Categories',
    'menu.items': 'Menu Items',
    'menu.addItem': 'Add Dish',
    'menu.addCategory': 'Add Category',
    'menu.price': 'Price',
    'menu.description': 'Description',
    'menu.dietary': 'Dietary',
    'menu.inStock': 'In Stock',
    'menu.outOfStock': 'Out of Stock',

    // Staff
    'staff.title': 'Staff & Access',
    'staff.addStaff': 'Add Staff Member',
    'staff.role': 'Role',
    'staff.pin': 'Access PIN',

    // Customers
    'customers.title': 'Customers & Credit',
    'customers.guestProfiles': 'Guest Profiles',
    'customers.totalVisits': 'Visits',
    'customers.creditBalance': 'Credit Khata',

    // Analytics
    'analytics.title': 'Analytics & Insights',
    'analytics.revenue': 'Revenue',
    'analytics.ordersCount': 'Total Orders',
    'analytics.topDishes': 'Top Selling Dishes',

    // Settings
    'settings.title': 'Restaurant Settings',
    'settings.general': 'General',
    'settings.language': 'Language Preference',
    'settings.chooseLang': 'Choose Interface Language',

    // Billing
    'billing.title': 'Billing & Usage',
    'billing.currentPlan': 'Current Plan',
    'billing.upgrade': 'Upgrade Plan',
  },

  hi: {
    // Language Preference Modal
    'langModal.firstTimeGreeting': 'मेंज़ी में आपका स्वागत है',
    'langModal.title': 'अपनी पसंदीदा भाषा चुनें',
    'langModal.subtitle': 'किचन टिकटिंग, ऑर्डर पूर्ति और प्रबंधन कंसोल के लिए अपनी पसंदीदा भाषा चुनें।',
    'langModal.enLabel': 'English',
    'langModal.enNative': 'English',
    'langModal.enDesc': 'प्रबंधन और किचन संचालन के लिए आधुनिक अंग्रेज़ी इंटरफ़ेस',
    'langModal.hiLabel': 'Hindi',
    'langModal.hiNative': 'हिन्दी',
    'langModal.hiDesc': 'किचन डिस्प्ले, लाइव ऑर्डर्स और सभी सेटिंग्स हिंदी में प्रबंधित करें',
    'langModal.note': 'आप किसी भी समय शीर्ष नेविगेशन बार या सेटिंग्स से भाषा बदल सकते हैं।',
    'langModal.confirm': 'कंसोल पर आगे बढ़ें',
    'langModal.selectedBadge': 'चयनित',
    'langModal.changeLater': 'शीर्ष बार में कभी भी बदलें',
    'langModal.previewEn': 'Kitchen Prep • Ready to Serve',
    'langModal.previewHi': 'किचन तैयारी • परोसने के लिए तैयार',

    // Common terms
    'common.save': 'सहेजें',
    'common.saving': 'सहेजा जा रहा है...',
    'common.saved': 'सहेजा गया',
    'common.cancel': 'रद्द करें',
    'common.close': 'बंद करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.add': 'जोड़ें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.all': 'सभी',
    'common.active': 'सक्रिय',
    'common.inactive': 'निष्क्रिय',
    'common.status': 'स्थिति',
    'common.actions': 'कार्रवाइयां',
    'common.loading': 'लोड हो रहा है...',
    'common.refresh': 'रीफ़्रेश करें',
    'common.logout': 'लॉगआउट',
    'common.back': 'वापस',
    'common.view': 'देखें',
    'common.details': 'विवरण',
    'common.total': 'कुल',
    'common.notes': 'टिप्पणियाँ',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.language': 'भाषा',
    'common.confirm': 'पुष्टि करें',
    'common.dismiss': 'खारिज करें',
    'common.copy': 'कॉपी करें',
    'common.copied': 'क्लिपबोर्ड पर कॉपी किया गया',
    'common.print': 'प्रिंट करें',
    'common.download': 'डाउनलोड करें',
    'common.export': 'निर्यात करें',
    'common.live': 'लाइव',
    'common.offline': 'ऑफ़लाइन',
    'common.online': 'ऑनलाइन',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',

    // Nav items
    'nav.overview': 'अवलोकन',
    'nav.menu': 'मेनू स्टूडियो',
    'nav.illustrations': 'चित्र लैब',
    'nav.theme': 'थीम स्टूडियो',
    'nav.ai': 'एआई वेटर',
    'nav.tables': 'टेबल्स और क्यूआर कोड',
    'nav.orders': 'लाइव ऑर्डर्स और पीओएस',
    'nav.customers': 'ग्राहक और उधारी',
    'nav.staff': 'स्टाफ और अनुमतियां',
    'nav.analytics': 'एनालिटिक्स',
    'nav.settings': 'सेटिंग्स',
    'nav.billing': 'बिलिंग और उपयोग',
    'nav.ownerConsole': 'मालिक कंसोल',
    'nav.kitchenTerminal': 'किचन टर्मिनल',
    'nav.viewMenu': 'लाइव मेनू',
    'nav.activeRestaurant': 'सक्रिय रेस्तरां',
    'nav.switchRestaurant': 'रेस्तरां बदलें',
    'nav.switchLanguage': 'भाषा बदलें',
    'nav.trialEnded': 'ट्रायल समाप्त',
    'nav.planInactive': 'प्लान निष्क्रिय',
    'nav.trialPlan': 'ट्रायल प्लान',
    'nav.daysRemaining': '{days} दिन',
    'nav.planBadge': '{plan} प्लान',
    'nav.renew': 'नवीनीकरण',
    'nav.setupSupport': 'सेटअप सहायता',
    'nav.verifiedOwner': 'सत्यापित मालिक',

    // Kitchen terms & KDS
    'kitchen.title': 'किचन और स्टाफ टर्मिनल',
    'kitchen.subtitle': 'किचन डिस्प्ले सिस्टम (KDS) और वेटर डिस्पैच',
    'kitchen.liveKds': 'लाइव KDS',
    'kitchen.orderTerminal': 'ऑर्डर टर्मिनल',
    'kitchen.activeTickets': 'सक्रिय टिकट',
    'kitchen.serviceCalls': 'वेटर सर्विस कॉल्स',
    'kitchen.tableCalls': 'टेबल कॉल्स',
    'kitchen.noServiceCalls': 'कोई सर्विस कॉल लंबित नहीं है',
    'kitchen.soundAlerts': 'ध्वनि अलर्ट',
    'kitchen.soundOn': 'घंटी चालू',
    'kitchen.soundOff': 'म्यूट',
    'kitchen.allOrders': 'सभी सक्रिय ऑर्डर्स',
    'kitchen.stationFree': 'किचन स्टेशन खाली है',
    'kitchen.noOrdersDesc': 'नए ऑर्डर लाइव ऑडियो घंटी के साथ अपने आप दिखाई देंगे',
    'kitchen.stagePlaced': 'नए ऑर्डर',
    'kitchen.stageAccepted': 'स्वीकृत',
    'kitchen.stagePreparing': 'किचन तैयारी',
    'kitchen.stageReady': 'परोसने के लिए तैयार',
    'kitchen.stageServed': 'परोसा गया',
    'kitchen.stageCompleted': 'पूर्ण',
    'kitchen.stageCancelled': 'रद्द',
    'kitchen.stageRejected': 'अस्वीकृत',
    'kitchen.acceptOrder': 'ऑर्डर स्वीकार करें',
    'kitchen.startPrep': 'तैयारी शुरू करें',
    'kitchen.markReady': 'तैयार मार्क करें',
    'kitchen.markServed': 'परोसा गया मार्क करें',
    'kitchen.completeOrder': 'ऑर्डर पूरा करें',
    'kitchen.rejectOrder': 'अस्वीकार करें',
    'kitchen.table': 'टेबल',
    'kitchen.tableNumber': 'टेबल #{table}',
    'kitchen.orderNumber': 'ऑर्डर #{number}',
    'kitchen.items': 'आइटम',
    'kitchen.quantity': 'मात्रा',
    'kitchen.prepTime': 'बीता हुआ समय',
    'kitchen.specialInstructions': 'विशेष निर्देश / शेफ नोट्स',
    'kitchen.veg': 'शाकाहारी',
    'kitchen.nonVeg': 'मांसाहारी',
    'kitchen.egg': 'अंडा',
    'kitchen.callWaiter': 'वेटर बुलाएं',
    'kitchen.billRequested': 'बिल मांगा गया',
    'kitchen.waterRequested': 'पानी मांगा गया',
    'kitchen.helpRequested': 'सहायता मांगी गई',
    'kitchen.resolveCall': 'निपटारा करें',
    'kitchen.orderHistory': 'ऑर्डर इतिहास',
    'kitchen.backToKds': 'लाइव KDS पर वापस जाएं',
    'kitchen.terminalPaused': 'किचन और सर्विस टर्मिनल रुका हुआ है',
    'kitchen.checkStatus': 'स्थिति जांचें',
    'kitchen.switchTerminal': 'टर्मिनल बदलें या लॉगआउट करें',
    'kitchen.connecting': 'लाइव किचन डिस्प्ले से कनेक्ट हो रहा है...',
    'kitchen.dineIn': 'डाइन-इन',
    'kitchen.takeaway': 'टेकअवे',
    'kitchen.delivery': 'डिलीवरी',
    'kitchen.refreshOrders': 'लाइव ऑर्डर्स रीफ़्रेश करें',
    'kitchen.minsAgo': '{mins} मिनट पहले',
    'kitchen.justNow': 'अभी-अभी',
    'kitchen.guestName': 'ग्राहक का नाम',
    'kitchen.guestPhone': 'मोबाइल',
    'kitchen.dineInGuest': 'डाइन-इन अतिथि',
    // Kitchen extensions
    'kitchen.allTickets': 'सभी टिकट',
    'kitchen.new': 'नए',
    'kitchen.filterAccepted': 'स्वीकृत',
    'kitchen.filterPrep': 'किचन तैयारी',
    'kitchen.filterReady': 'परोसने के लिए तैयार',
    'kitchen.filterServed': 'परोसा गया',
    'kitchen.incomingTickets': 'आने वाले टिकट',
    'kitchen.queuedAcknowledged': 'स्वीकृत / कतार में',
    'kitchen.inPreparation': 'तैयारी में',
    'kitchen.passReady': 'पास / टेबल के लिए तैयार',
    'kitchen.servedTable': 'परोसी गई टेबल',
    'kitchen.accept': 'स्वीकार करें',
    'kitchen.startCooking': 'पकाना शुरू करें',
    'kitchen.orderReadyBell': 'ऑर्डर तैयार 🔔',
    'kitchen.serveToTable': 'टेबल पर परोसें ✓',
    'kitchen.completeTicket': 'टिकट पूरा करें',
    'kitchen.settleBill': 'बिल चुकता करें',
    'kitchen.callWaiterAction': 'वेटर बुलाएं',
    'kitchen.reject': 'अस्वीकार करें',
    'kitchen.syncing': 'सिंक हो रहा है...',
    'kitchen.closing': 'पूरा हो रहा है...',
    'kitchen.plated': 'प्लेटेड',
    'kitchen.dining': 'डाइनिंग',
    'kitchen.cookingElapsed': 'तैयार हो रहा है ({elapsed})',
    'kitchen.paid': 'भुगतान किया गया',
    'kitchen.unpaid': 'अदत्त',
    'kitchen.totalAmount': 'कुल',
    'kitchen.chefNote': 'शेफ नोट',
    'kitchen.note': 'नोट: {note}',
    'kitchen.option': 'विकल्प: {variant}',
    'kitchen.waiterNeeded': 'फ्लोर वेटर की आवश्यकता ({count} लंबित)',
    'kitchen.waiterNeededDesc': 'नीचे दी गई टेबल पर ग्राहकों ने सेवा का अनुरोध किया है।',
    'kitchen.waterService': '💧 पानी और ग्लास',
    'kitchen.cutleryService': '🍽️ चम्मच और नैपकिन',
    'kitchen.billService': '🧾 बिल लाएं',
    'kitchen.needsWaiter': '🙋 वेटर की जरूरत',
    'kitchen.attending': 'अटेंड कर रहे हैं...',
    'kitchen.markAttended': 'अटेंड किया ✓',
    'kitchen.noIncoming': 'इस समय कोई नया टिकट नहीं है',
    'kitchen.noQueued': 'कोई कतारबद्ध टिकट नहीं है',
    'kitchen.stationFreeDesc': 'किचन स्टेशन खाली है',
    'kitchen.noDishesPass': 'पास पर कोई व्यंजन नहीं है',
    'kitchen.noActiveServed': 'कोई सक्रिय परोसी गई टेबल नहीं है',
    'kitchen.liveKdsBadge': 'लाइव KDS',
    'kitchen.activeTicketsBadge': '{count} सक्रिय टिकट',
    'kitchen.tableCallsBadge': '{count} टेबल कॉल्स',
    'kitchen.soundChimeOn': 'घंटी चालू',
    'kitchen.soundMuted': 'म्यूट',
    'kitchen.soundEnabledTitle': 'ऑर्डर ऑडियो घंटी चालू (म्यूट करने के लिए क्लिक करें)',
    'kitchen.soundDisabledTitle': 'ऑर्डर ऑडियो घंटी बंद (चालू करने के लिए क्लिक करें)',
    'kitchen.orderHistoryTitle': 'ऑर्डर इतिहास',
    'kitchen.logoutTitle': 'टर्मिनल लॉगआउट करें',
    'kitchen.retryConnection': 'पुनः प्रयास करें',

    // Order History extensions
    'history.title': 'ऑर्डर इतिहास',
    'history.subtitle': '{name} • ऐतिहासिक लॉग और ऑडिट रिकॉर्ड',
    'history.backToLive': 'लाइव किचन टर्मिनल पर वापस जाएं',
    'history.exportCsv': 'CSV एक्सपोर्ट',
    'history.liveTerminal': 'लाइव टर्मिनल',
    'history.totalOrders': 'कुल फ़िल्टर किए गए ऑर्डर',
    'history.totalValue': 'दर्ज ऑर्डर मूल्य',
    'history.aov': 'औसत ऑर्डर मूल्य (AOV)',
    'history.searchPlaceholder': 'ऑर्डर नंबर या व्यंजन के नाम से खोजें...',
    'history.today': 'आज',
    'history.yesterday': 'कल',
    'history.last7Days': 'पिछले 7 दिन',
    'history.last30Days': 'पिछले 30 दिन',
    'history.allStatuses': 'सभी स्थितियां',
    'history.thOrder': 'ऑर्डर #',
    'history.thTable': 'टेबल',
    'history.thCustomer': 'ग्राहक',
    'history.thDateTime': 'दिनांक और समय',
    'history.thDishes': 'व्यंजन सारांश',
    'history.thTotal': 'कुल राशि',
    'history.thStatus': 'स्थिति',
    'history.thHandledBy': 'द्वारा प्रबंधित',
    'history.noOrders': 'इस फ़िल्टर मानदंड से मेल खाने वाले कोई ऐतिहासिक ऑर्डर नहीं मिले।',
    'history.pageInfo': 'पृष्ठ {page} का {totalPages} (कुल {totalCount})',
    'history.loadingLogs': 'ऐतिहासिक लॉग लोड हो रहे हैं...',

    // Staff Login extensions
    'login.backToMenzy': 'मेंज़ी पर वापस',
    'login.staffBadge': 'स्टाफ और किचन KDS',
    'login.staffTitle': 'स्टाफ ऑर्डर टर्मिनल',
    'login.venueTerminal': '{venue} टर्मिनल',
    'login.subtitle': 'किचन डिस्प्ले सिस्टम (KDS), वेटर डिस्पैच और लाइव टेबल ऑर्डर',
    'login.staffLoginId': 'स्टाफ लॉगिन आईडी',
    'login.password': 'पासवर्ड',
    'login.placeholderId': 'उदा. kitchen-01 या staff-lead',
    'login.launchTerminal': 'ऑर्डर टर्मिनल खोलें',
    'login.connecting': 'टर्मिनल से कनेक्ट हो रहा है...',
    'login.quickFillDemo': 'त्वरित डेमो खाते',
    'login.demoNote': 'स्टाफ खाते रेस्तरां मालिक द्वारा स्टाफ पोर्टल में सुरक्षित रूप से बनाए जाते हैं।',

    // Dashboard Overview
    'overview.title': 'रेस्तरां अवलोकन',
    'overview.liveFloor': 'लाइव फ्लोर — सभी टेबल',
    'overview.allTables': 'सभी टेबल',
    'overview.activeTables': 'सक्रिय टेबल',
    'overview.availableTables': 'उपलब्ध',
    'overview.occupied': 'व्यस्त',
    'overview.vacant': 'खाली',
    'overview.todaySales': 'आज की बिक्री',
    'overview.todayOrders': 'आज के ऑर्डर',
    'overview.activeOrders': 'सक्रिय ऑर्डर',
    'overview.quickActions': 'त्वरित क्रियाएं',
    'overview.openKds': 'समर्पित किचन टर्मिनल खोलें',
    'overview.manageMenu': 'मेनू प्रबंधित करें',
    'overview.viewQrCodes': 'क्यूआर कोड देखें',
    'overview.recentOrders': 'हाल के ऑर्डर',
    'overview.noActiveOrders': 'इस समय कोई सक्रिय ऑर्डर नहीं है',
    'overview.viewAllOrders': 'सभी ऑर्डर देखें',
    'overview.salesVolume': 'बिक्री मात्रा',
    'overview.averageOrder': 'औसत ऑर्डर मूल्य',
    'overview.averageOrderValue': 'औसत ऑर्डर मूल्य',
    'overview.todayRevenue': 'आज का राजस्व',
    'overview.totalMenuItems': 'कुल मेनू व्यंजन',
    'overview.qrScansToday': 'आज के क्यूआर स्कैन',
    'overview.aiQuestions': 'एआई प्रश्न',
    'overview.creditsLeft': '3D क्रेडिट शेष',
    'overview.liveSearchable': 'लाइव और खोजने योग्य',
    'overview.loadingMenu': 'मेनू लोड हो रहा है...',
    'overview.loadingScans': 'स्कैन लोड हो रहे हैं...',
    'overview.activeEngagement': 'सक्रिय सहभागिता',
    'overview.noScansToday': 'आज अभी तक कोई स्कैन नहीं',
    'overview.monthlyAllowance': 'मासिक सीमा {max} में से',
    'overview.loadingUsage': 'उपयोग लोड हो रहा है...',
    'overview.loadingPlan': 'प्लान लोड हो रहा है...',
    'overview.clickTableHint': 'सीधे उसके लाइव ऑर्डर देखने के लिए किसी भी टेबल पर क्लिक करें।',
    'overview.manageTables': 'टेबल्स प्रबंधित करें →',
    'overview.noTablesSetup': 'अभी तक कोई टेबल सेट नहीं की गई है। क्यूआर कोड प्रिंट करने और लाइव ऑर्डर ट्रैक करने के लिए टेबल जोड़ें।',
    'overview.setUpTables': 'टेबल सेट करें',
    'overview.getDinersScanning': 'आज ही ग्राहकों को स्कैन करवाएं',
    'overview.getDinersScanningDesc': 'अपनी डाइनिंग टेबल के लिए उच्च-रिज़ॉल्यूशन क्यूआर कोड और प्रिंटेबल टेबल टेंट डाउनलोड करें।',
    'overview.downloadQrStudio': 'क्यूआर स्टूडियो डाउनलोड करें',
    'overview.importMenu': 'मेनू आयात करें (फ़ोटो / पीडीएफ)',
    'overview.menuHighlights': 'आपके मेनू की झलक',
    'overview.openMenuStudio': 'मेनू स्टूडियो खोलें →',
    'overview.uploadMenuPrompt': 'शुरू करने के लिए अपने मेनू के फ़ोटो या पीडीएफ अपलोड करें',
    'overview.uploadMenuDesc': 'कई मेनू फ़ोटो (JPG, PNG, WebP, HEIC) या एक पीडीएफ मेनू चुनें — AI स्वचालित रूप से व्यंजन, श्रेणियां, मूल्य और शाकाहारी/मांसाहारी संकेत निकालता है।',
    'overview.uploadMenuPhotos': 'मेनू फ़ोटो अपलोड करें',
    'overview.uploadMenuPdf': 'मेनू पीडीएफ अपलोड करें',
    'overview.supportTitle': 'सेटअप और ऑनबोर्डिंग सहायता',
    'overview.supportDesc': 'मेनू आयात, क्यूआर प्रिंटिंग, या सेटअप संबंधी प्रश्नों के लिए हमें कभी भी ईमेल करें।',
    'overview.openBill': 'चालू बिल',
    'overview.viewLiveOrders': 'लाइव ऑर्डर देखें',
    'overview.viewLiveMenu': 'लाइव ग्राहक मेनू देखें',

    // Tables & QR
    'tables.title': 'टेबल्स और क्यूआर कोड',
    'tables.subtitle': 'डाइनिंग टेबल प्रबंधित करें, प्रिंट करने योग्य क्यूआर कोड बनाएं और फ्लोर गतिविधि देखें',
    'tables.addTable': 'टेबल जोड़ें',
    'tables.bulkGenerate': 'एक साथ बनाएं',
    'tables.qrDesigner': 'क्यूआर स्टूडियो',
    'tables.bulkPrint': 'थोक प्रिंट',
    'tables.allFilter': 'सभी टेबल',
    'tables.activeFilter': 'सक्रिय ऑर्डर',
    'tables.availableFilter': 'उपलब्ध',
    'tables.hasActiveOrders': 'सक्रिय ऑर्डर',
    'tables.noActiveOrders': 'उपलब्ध',
    'tables.viewLiveOrders': 'लाइव ऑर्डर देखें',
    'tables.openBill': 'चालू बिल',
    'tables.capacity': 'क्षमता',
    'tables.seats': '{count} सीटें',
    'tables.section': 'सेक्शन',
    'tables.rotateQr': 'क्यूआर बदलें',
    'tables.disableTable': 'टेबल बंद करें',
    'tables.enableTable': 'टेबल चालू करें',
    'tables.archiveTable': 'आर्काइव करें',

    // Live Orders & POS tab
    'orders.title': 'लाइव ऑर्डर्स और पीओएस',
    'orders.subtitle': 'रीयल-टाइम टेबल ऑर्डर देखें, किचन तैयारी अपडेट करें और बिक्री देखें',
    'orders.openDedicatedKds': 'समर्पित किचन टर्मिनल खोलें',
    'orders.floorMap': 'सभी टेबल फ्लोर मैप',
    'orders.liveTickets': 'लाइव ऑर्डर टिकट',
    'orders.orderHistory': 'ऑर्डर इतिहास',
    'orders.searchPlaceholder': 'ऑर्डर # या टेबल खोजें...',
    'orders.filterAll': 'सभी टेबल',
    'orders.filterActiveOnly': 'केवल सक्रिय',
    'orders.unfilterTable': 'सभी टेबल दिखाएं',
    'orders.focusingTable': 'टेबल {table} पर फ़िल्टर किया गया',
    'orders.accept': 'स्वीकार करें',
    'orders.prep': 'तैयारी शुरू करें',
    'orders.ready': 'तैयार मार्क करें',
    'orders.serve': 'परोसा गया',
    'orders.complete': 'पूरा करें / भुगतान',

    // Menu Studio
    'menu.title': 'मेनू स्टूडियो',
    'menu.categories': 'श्रेणियां',
    'menu.items': 'मेनू व्यंजन',
    'menu.addItem': 'व्यंजन जोड़ें',
    'menu.addCategory': 'श्रेणी जोड़ें',
    'menu.price': 'मूल्य',
    'menu.description': 'विवरण',
    'menu.dietary': 'आहार प्रकार',
    'menu.inStock': 'स्टॉक में है',
    'menu.outOfStock': 'अनुपलब्ध',

    // Staff
    'staff.title': 'स्टाफ और अनुमतियां',
    'staff.addStaff': 'स्टाफ सदस्य जोड़ें',
    'staff.role': 'भूमिका',
    'staff.pin': 'एक्सेस पिन',

    // Customers
    'customers.title': 'ग्राहक और उधारी',
    'customers.guestProfiles': 'ग्राहक प्रोफ़ाइल',
    'customers.totalVisits': 'विज़िट',
    'customers.creditBalance': 'उधारी खाता',

    // Analytics
    'analytics.title': 'एनालिटिक्स और रिपोर्ट',
    'analytics.revenue': 'राजस्व',
    'analytics.ordersCount': 'कुल ऑर्डर',
    'analytics.topDishes': 'सबसे लोकप्रिय व्यंजन',

    // Settings
    'settings.title': 'रेस्तरां सेटिंग्स',
    'settings.general': 'सामान्य',
    'settings.language': 'भाषा प्राथमिकता',
    'settings.chooseLang': 'इंटरफ़ेस भाषा चुनें',

    // Billing
    'billing.title': 'बिलिंग और उपयोग',
    'billing.currentPlan': 'वर्तमान योजना',
    'billing.upgrade': 'प्लान अपग्रेड करें',
  },
};

const ManagementLanguageContext = createContext<ManagementLanguageContextValue | null>(null);

export function setCookies(lang: ManagementLang) {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${MANAGEMENT_COOKIE_NEXT_LOCALE}=${encodeURIComponent(lang)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `${MANAGEMENT_COOKIE_LEGACY}=${encodeURIComponent(lang)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Non-blocking in sandboxed environments
  }
}

export function getInitialClientLang(fallback: ManagementLang = 'en'): ManagementLang {
  if (typeof window === 'undefined') return fallback;
  try {
    const local = localStorage.getItem(MANAGEMENT_LANG_STORAGE_KEY);
    if (local === 'en' || local === 'hi') return local;

    const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:NEXT_LOCALE|menzy_lang)=([^;]+)/);
    if (cookieMatch) {
      const val = decodeURIComponent(cookieMatch[1]);
      if (val === 'en' || val === 'hi') return val;
    }
  } catch {
    // Storage access may be restricted
  }
  return fallback;
}

export function getInitialChosen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MANAGEMENT_LANG_CHOSEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistManagementLanguage(lang: ManagementLang) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MANAGEMENT_LANG_STORAGE_KEY, lang);
    localStorage.setItem(MANAGEMENT_LANG_CHOSEN_KEY, 'true');
  } catch {
    // Cookies still preserve the preference when localStorage is unavailable.
  }
  setCookies(lang);
}

export function ManagementLanguageProvider({
  children,
  defaultLang = 'en',
}: {
  children: React.ReactNode;
  defaultLang?: ManagementLang;
}) {
  const [lang, setLangState] = useState<ManagementLang>(defaultLang);
  const [hasChosenLang, setHasChosenLang] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedLang = getInitialClientLang(defaultLang);
      const chosen = getInitialChosen();
      setLangState(savedLang);
      setHasChosenLang(chosen);
    } finally {
      setIsLoaded(true);
    }
  }, [defaultLang]);

  const setLang = useCallback((newL: ManagementLang) => {
    setLangState(newL);
    setHasChosenLang(true);
    persistManagementLanguage(newL);
  }, []);

  const setChosenLang = setLang;

  const t = useCallback(
    (key: string, fallback?: string, params?: Record<string, string | number>) => {
      let text = MANAGEMENT_DICTIONARY[lang]?.[key] ?? MANAGEMENT_DICTIONARY.en?.[key] ?? fallback ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    [lang]
  );

  const value = useMemo<ManagementLanguageContextValue>(
    () => ({
      lang,
      setLang,
      hasChosenLang,
      setChosenLang,
      t,
      isLoaded,
    }),
    [lang, setLang, hasChosenLang, setChosenLang, t, isLoaded]
  );

  return (
    <ManagementLanguageContext.Provider value={value}>
      {children}
    </ManagementLanguageContext.Provider>
  );
}

export function getManagementI18nDefaults(): ManagementLanguageContextValue {
  return {
    lang: 'en',
    setLang: () => {},
    hasChosenLang: true,
    setChosenLang: () => {},
    t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
      let text = MANAGEMENT_DICTIONARY.en[key] ?? fallback ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    isLoaded: true,
  };
}

export function useManagementLanguage(): ManagementLanguageContextValue {
  try {
    const context = useContext(ManagementLanguageContext);
    if (!context) {
      return getManagementI18nDefaults();
    }
    return context;
  } catch {
    return getManagementI18nDefaults();
  }
}
