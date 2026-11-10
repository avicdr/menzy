export interface FaqEntry {
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQS: FaqEntry[] = [
  {
    question: 'Do restaurant guests need to download an app to use a Menzy digital menu?',
    answer:
      'No. Guests simply scan the printed QR code on their table using their smartphone camera, and the interactive digital menu opens directly in their mobile browser.',
  },
  {
    question: 'How fast can I turn my printed paper or PDF menu into a Menzy digital menu?',
    answer:
      'Most venues go live in minutes. Upload smartphone photos or PDF scans of your existing menu, and Gemini Vision OCR extracts dish names, descriptions, prices, variants, and dietary indicators automatically for review.',
  },
  {
    question: 'How do table-specific QR codes prevent orders from the wrong table?',
    answer:
      'Each table receives a unique signed QR token so the server knows the exact table without asking guests to type a table number. Sessions also expire automatically after 30 minutes without an order.',
  },
  {
    question: 'How does the AI waiter answer dietary and allergen questions safely?',
    answer:
      'The Menzy AI Waiter is strictly grounded in your published menu catalog, variant prices, dietary labels (such as Veg, Non-Veg, Egg, Vegan, Gluten-Free), and owner-provided dish notes — it never invents off-menu dishes.',
  },
  {
    question: 'What are 3D dish visuals in Menzy?',
    answer:
      'Menzy matches your dishes against a shared canonical culinary library of 3D-clay styled illustrations and lets owners generate custom stylized dish artwork inside the Illustration Lab.',
  },
];

export interface SeoLandingConfig {
  slug: string;
  path: string;
  breadcrumbName: string;
  eyebrow: string;
  h1: string;
  heroAccent?: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  capabilitiesHeading: string;
  capabilitiesSubheading: string;
  capabilities: Array<{
    title: string;
    description: string;
  }>;
  workflowHeading: string;
  workflowSteps: Array<{
    step: string;
    title: string;
    detail: string;
  }>;
  checklistHeading: string;
  checklistItems: string[];
  faqs: FaqEntry[];
  relatedLinks: Array<{
    title: string;
    description: string;
    href: string;
  }>;
}

export const SEO_LANDING_CONFIGS: Record<string, SeoLandingConfig> = {
  features: {
    slug: 'features',
    path: '/features',
    breadcrumbName: 'Features',
    eyebrow: 'Complete Hospitality Platform',
    h1: 'Everything a modern restaurant needs beyond a static PDF',
    intro:
      'Menzy combines AI menu digitization, 3D-clay dish visuals, a menu-grounded AI waiter, table-specific QR codes, contactless ordering, and a live Kitchen Display System in one workspace.',
    seoTitle: 'Restaurant Digital Menu Features — Menzy',
    seoDescription:
      'Explore Menzy features: Gemini Vision menu OCR, 3D-clay dish illustrations, grounded AI waiter, signed table QR codes, contactless ordering, and live KDS.',
    keywords: [
      'digital menu features',
      'restaurant qr menu software',
      'ai restaurant menu platform',
      'kitchen display system qr ordering',
    ],
    primaryCtaLabel: 'Create Your Menu Free',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Explore Live Menus',
    secondaryCtaHref: '/demo',
    capabilitiesHeading: 'Built end-to-end for hospitality teams',
    capabilitiesSubheading:
      'Every feature in Menzy is engineered to reduce table friction, speed up ordering, and keep your brand front and center.',
    capabilities: [
      {
        title: 'AI Menu Photo & PDF Extraction',
        description:
          'Upload smartphone photos or PDF scans of paper menus. Gemini Vision extracts categories, item names, prices, variants, and FSSAI / dietary markers automatically.',
      },
      {
        title: '3D-Clay Dish Artwork & Canonical Library',
        description:
          'Dishes match automatically against a curated canonical visual library or generate custom 3D-clay styled illustrations inside Illustration Lab with preview-before-publish approval.',
      },
      {
        title: 'Menu-Grounded AI Waiter',
        description:
          'Guests ask natural budget, pairing, spice, and dietary questions via chat and receive instant recommendations tied strictly to your live menu.',
      },
      {
        title: 'Theme Studio with Contrast Guardrails',
        description:
          'Start with Warm Editorial, Botanical Café, Midnight Espresso, or Pastel Patisserie presets and customize typography and colors with live accessibility contrast checks.',
      },
      {
        title: 'Printable 4×6" Table Tent QR Studio',
        description:
          'Generate unique cryptographic QR codes per table, rotate compromised links in one click, and offer optional one-tap Guest Wi-Fi QR cards on your table hub.',
      },
      {
        title: 'Live KDS & Floor Staff Order Terminal',
        description:
          'Receive dine-in orders and waiter assistance alerts ("Water", "Cutlery", "Bill") in real time with audio chimes, status progression, and CSV order history.',
      },
    ],
    workflowHeading: 'How venues launch with Menzy',
    workflowSteps: [
      {
        step: '01',
        title: 'Import your menu',
        detail: 'Upload photos or PDFs in Menu Studio and review extracted dishes, variants, and FSSAI / dietary labels.',
      },
      {
        step: '02',
        title: 'Style & visualize every plate',
        detail: 'Match or generate 3D-clay dish visuals in Illustration Lab and tailor typography & brand colors in Theme Studio.',
      },
      {
        step: '03',
        title: 'Print table QRs & go live',
        detail: 'Generate table-specific QR tents, invite floor or kitchen staff to `/orders`, and monitor live scan & dish analytics.',
      },
    ],
    checklistHeading: 'Included across the Menzy operating system',
    checklistItems: [
      'Real-time dish availability toggles ("86 items") without reprinting table tents',
      'Structured Dish Variants (Size, Crust, Protein, Spice Level) with itemized price add-ons',
      'Multiplayer 2–5 player browser table games to keep guests entertained while waiting',
      'Direct Google Review shortcut on the venue QR table hub',
      'Server-enforced tax %, optional service charge %, and regional INR / USD billing',
    ],
    faqs: [
      {
        question: 'Can I upload custom food photography instead of 3D illustrations?',
        answer:
          'Yes. You can reuse canonical 3D-clay illustrations, generate custom AI artwork per dish, or upload your own high-resolution dish photography in the dashboard.',
      },
      {
        question: 'Does Menzy support multiple staff logins for kitchen and waitstaff?',
        answer:
          'Yes. Owners can create role-scoped Manager, Kitchen, and Waiter accounts under Staff & Access with isolated terminal login at `/orders/login`.',
      },
    ],
    relatedLinks: [
      {
        title: 'QR Code Menu Generator',
        description: 'Generate signed per-table QR codes and printable 4×6" table tents.',
        href: '/qr-code-menu',
      },
      {
        title: 'Table Ordering System',
        description: 'Zero-confusion dine-in ordering with 30-minute idle scan protection.',
        href: '/table-ordering',
      },
      {
        title: 'Order Management & KDS',
        description: 'Real-time kitchen terminal and floor service call dispatch.',
        href: '/restaurant-order-management',
      },
    ],
  },

  'qr-code-menu': {
    slug: 'qr-code-menu',
    path: '/qr-code-menu',
    breadcrumbName: 'QR Code Menu',
    eyebrow: 'QR Code Menu Generator',
    h1: 'A fast QR code menu guests actually love using',
    intro:
      'Replace awkward pinch-and-zoom PDFs with an interactive, themed digital menu built for mobile browsers — complete with per-table QR tokens and printable table tents.',
    seoTitle: 'QR Code Menu Generator for Restaurants — Menzy',
    seoDescription:
      'Generate signed table-specific QR codes and printable 4×6 table tents linked to a visual, mobile-first digital restaurant menu with live updates.',
    keywords: [
      'qr code menu generator',
      'qr menu for restaurant',
      'restaurant qr code menu',
      'digital qr menu',
    ],
    primaryCtaLabel: 'Create Your QR Menu',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'View Live QR Demo',
    secondaryCtaHref: '/m/chai-and-chutney',
    capabilitiesHeading: 'Beyond generic QR links',
    capabilitiesSubheading:
      'Every table tent connects guests to a structured mobile table hub tailored for hospitality speed.',
    capabilities: [
      {
        title: 'Signed Per-Table QR Tokens',
        description:
          'Assign every table a unique cryptographic QR code (`tq_...`) so table ordering and waiter alerts route straight to the exact table automatically.',
      },
      {
        title: 'Instant Price & Availability Sync',
        description:
          'Mark sold-out items unavailable or launch seasonal specials in one tap — existing printed QR codes update immediately with zero reprinting.',
      },
      {
        title: 'Table Hub with Guest Wi-Fi QR & Reviews',
        description:
          'When guests scan a table QR, they land on a branded welcome hub featuring View Menu, Guest Wi-Fi connect card, Call Waiter, Table Games, and Google Review link.',
      },
    ],
    workflowHeading: 'Create your restaurant QR menu in three steps',
    workflowSteps: [
      {
        step: '01',
        title: 'Digitize your menu',
        detail: 'Upload photos or PDFs of your menu to convert every category, dish, variant, and dietary note automatically.',
      },
      {
        step: '02',
        title: 'Create tables & areas',
        detail: 'Bulk-create tables across Main Dining, Patio, or Rooftop zones with individual QR codes and rotate controls.',
      },
      {
        step: '03',
        title: 'Print 4×6" table tents',
        detail: 'Export print-ready QR posters and table cards directly from QR Studio and place them at each table.',
      },
    ],
    checklistHeading: 'Why restaurants switch from static PDFs to Menzy QR menus',
    checklistItems: [
      'Loads rapidly in iPhone and Android browsers without downloading any app',
      'Visual categories, Veg/Egg/Non-Veg FSSAI badges, and instant search filtering',
      'Rotate compromised or damaged table QR tokens anytime with one click',
      'Built-in scan telemetry showing table engagement and top viewed dishes',
    ],
    faqs: [
      {
        question: 'Will my printed QR codes break if I edit my menu prices or dishes?',
        answer:
          'Never. Table QR codes point securely to your venue slug and table token. Dish edits, stock changes, and theme updates reflect live on the same printed QR codes.',
      },
      {
        question: 'Can guests connect to our restaurant Wi-Fi directly from the QR hub?',
        answer:
          'Yes. Enable Guest Free Wi-Fi in Settings to show a one-tap Wi-Fi join card with SSID QR and copyable password right inside the scanned table hub.',
      },
    ],
    relatedLinks: [
      {
        title: 'Table QR Ordering',
        description: 'Turn table scans directly into accurate kitchen orders.',
        href: '/table-ordering',
      },
      {
        title: 'AI Digital Menu',
        description: 'Add a grounded AI waiter that recommends dishes and pairings.',
        href: '/ai-digital-menu',
      },
      {
        title: 'How to Create a QR Menu',
        description: 'Step-by-step hospitality setup guide on the Menzy blog.',
        href: '/blog/how-to-create-qr-code-menu-for-your-restaurant',
      },
    ],
  },

  'table-ordering': {
    slug: 'table-ordering',
    path: '/table-ordering',
    breadcrumbName: 'Table Ordering',
    eyebrow: 'Contactless QR Table Ordering',
    h1: 'Faster table ordering without wrong-table mistakes',
    intro:
      'Let dine-in guests browse 3D dish visuals, select size or spice variants, add special kitchen notes, and submit table orders straight to your Kitchen Display.',
    seoTitle: 'QR Table Ordering System for Restaurants — Menzy',
    seoDescription:
      'Enable secure table-specific QR ordering with cryptographic table tokens, 30-minute idle scan expiry, tax calculation, and direct KDS dispatch.',
    keywords: [
      'qr table ordering system',
      'restaurant table ordering',
      'contactless dining ordering',
      'scan to order restaurant',
    ],
    primaryCtaLabel: 'Enable Table Ordering',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Try Live Table Demo',
    secondaryCtaHref: '/demo',
    capabilitiesHeading: 'Engineered for high-accuracy dine-in service',
    capabilitiesSubheading:
      'Unlike generic link-based order forms, Menzy protects table identity and dining sessions automatically.',
    capabilities: [
      {
        title: 'Strict Cryptographic Table Resolution',
        description:
          'Orders can only be routed to a table via its signed QR token. Guests never accidentally type the wrong table number or order into someone else’s table.',
      },
      {
        title: '30-Minute Idle Session Rescan Guard',
        description:
          'If no order is placed for 30 minutes, the browser session expires cleanly and asks the guest to rescan the physical QR card — blocking leftover tabs from outside the restaurant.',
      },
      {
        title: 'One-Tap Waiter Service Calls',
        description:
          'Guests at the table can request Water, Cutlery, Napkins, Bill, or Staff Assistance in one tap, pinging floor staff immediately with audio & banner notifications.',
      },
    ],
    workflowHeading: 'How a guest table order moves from scan to plate',
    workflowSteps: [
      {
        step: '01',
        title: 'Guest scans table QR',
        detail: 'Their browser opens the table hub pinned to that exact table ID with verified pricing and tax preview.',
      },
      {
        step: '02',
        title: 'Customize & place order',
        detail: 'Diners pick dish variants, enter optional cooking notes, review subtotal + tax + service charge, and submit.',
      },
      {
        step: '03',
        title: 'Live kitchen & status tracking',
        detail: 'Orders ring immediately on `/orders` and update on the diner’s screen through Accepted, Preparing, Ready, and Served.',
      },
    ],
    checklistHeading: 'Built-in operational controls for owners & managers',
    checklistItems: [
      'Toggle New Orders on/off anytime while keeping the visual menu live',
      'Server-calculated taxes and optional service charge with clean itemization',
      'Pay-at-Counter settlement status tracking alongside kitchen ticket stages',
      'Support for Pay at Table / Counter workflows tailored for fast casual and dine-in',
    ],
    faqs: [
      {
        question: 'Can we pause incoming QR orders during an overwhelming rush?',
        answer:
          'Yes. Toggle Accept New Orders off in your dashboard Ordering Settings anytime — guests can still browse the menu and call a waiter.',
      },
      {
        question: 'How does the 30-minute table expiry work?',
        answer:
          'Each table scan creates an active ordering window that stays valid for 30 minutes without order submission. Every placed order refreshes active service continuity, and idle sessions cleanly prompt for a physical QR rescan.',
      },
    ],
    relatedLinks: [
      {
        title: 'Restaurant Order Management & KDS',
        description: 'Track kitchen prep stages and floor service calls in real time.',
        href: '/restaurant-order-management',
      },
      {
        title: 'QR Code Menu Generator',
        description: 'Generate and print signed QR tents for every table.',
        href: '/qr-code-menu',
      },
      {
        title: 'Pricing Plans',
        description: 'See predictable monthly plans for your region.',
        href: '/pricing',
      },
    ],
  },

  'restaurant-order-management': {
    slug: 'restaurant-order-management',
    path: '/restaurant-order-management',
    breadcrumbName: 'Order Management',
    eyebrow: 'Kitchen Display & Floor Dispatch',
    h1: 'Live restaurant order management and Kitchen Display (KDS)',
    intro:
      'Keep kitchen chefs and floor servers aligned in real time. Stream table orders, itemized modifiers, special cooking notes, and waiter service requests in one fast terminal.',
    seoTitle: 'Restaurant Order Management System — Menzy',
    seoDescription:
      'Manage dine-in table orders, kitchen preparation tickets, waiter service calls, and CSV order history with Menzy’s real-time KDS terminal.',
    keywords: [
      'restaurant order management system',
      'kitchen display system kds',
      'restaurant kds software',
      'table service alert software',
    ],
    primaryCtaLabel: 'Start Managing Orders',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Explore All Features',
    secondaryCtaHref: '/features',
    capabilitiesHeading: 'Built for kitchens during dinner rush',
    capabilitiesSubheading:
      'Zero complex hardware required — run `/orders` on any kitchen tablet, countertop laptop, or manager monitor.',
    capabilities: [
      {
        title: 'Real-Time Server-Sent Events Stream',
        description:
          'New table orders and customer service calls appear instantaneously without manual page reloads, paired with an optional synthesized order bell chime.',
      },
      {
        title: 'Structured Ticket Stage Progression',
        description:
          'Move tickets cleanly across Placed → Accepted → Preparing → Ready → Served, keeping the front-of-house and dining table synchronized.',
      },
      {
        title: 'Waiter Service Call Queue',
        description:
          'Receive instant requests for Water, Cutlery, Extra Napkins, or Check/Bill tagged with exact table names and section zones.',
      },
    ],
    workflowHeading: 'Role-isolated access for owners and floor staff',
    workflowSteps: [
      {
        step: '01',
        title: 'Create staff credentials',
        detail: 'Add Manager, Kitchen, or Waiter accounts in Dashboard → Staff & Access with one-click PIN/password reset.',
      },
      {
        step: '02',
        title: 'Run kitchen & floor terminal',
        detail: 'Staff sign in at `/orders/login` directly into a dedicated dark-mode KDS console scoped only to order operations.',
      },
      {
        step: '03',
        title: 'Audit history & export CSV',
        detail: 'Search past orders by ticket number or dish across date presets (`Today`, `7d`, `30d`) and export itemized CSV logs.',
      },
    ],
    checklistHeading: 'Key kitchen & floor operational safeguards',
    checklistItems: [
      'Variant breakdowns and customer dietary instructions highlighted on every ticket',
      'Per-venue dark or branded typography tokens applied automatically in the KDS view',
      'Average Order Value (AOV) and completed order summaries in History',
      'Pay-at-Counter payment mark-off and rejection/cancellation audit notes',
    ],
    faqs: [
      {
        question: 'Do staff logins give access to billing or owner settings?',
        answer:
          'No. Waiter and Kitchen staff authenticate through `/orders/login` with scoped access restricted strictly to live order fulfillment and table service requests.',
      },
      {
        question: 'Can we export order records for daily accounting?',
        answer:
          'Yes. Staff and owners can filter Order History by date range or status and download a CSV export directly from `/orders/history`.',
      },
    ],
    relatedLinks: [
      {
        title: 'Table Ordering System',
        description: 'How table-specific QR scanning keeps every order tied to the right table.',
        href: '/table-ordering',
      },
      {
        title: 'Restaurant Automation',
        description: 'Automate menu digitization, diner Q&A, and floor alerts.',
        href: '/restaurant-automation',
      },
      {
        title: 'Solutions for Restaurants',
        description: 'Designed for full-service dine-in dining rooms.',
        href: '/digital-menu-for-restaurants',
      },
    ],
  },

  'ai-digital-menu': {
    slug: 'ai-digital-menu',
    path: '/ai-digital-menu',
    breadcrumbName: 'AI Digital Menu',
    eyebrow: 'AI-Powered Menu Intelligence',
    h1: 'An AI digital menu grounded in your actual kitchen catalog',
    intro:
      'Combine Gemini Vision OCR digitization, 3D-clay visual artwork, and an always-helpful AI Waiter that answers guest allergen, budget, and pairing questions accurately.',
    seoTitle: 'AI-Powered Restaurant Menu Software — Menzy',
    seoDescription:
      'Turn static menus into an AI-powered restaurant menu with Gemini Vision OCR, 3D dish visuals, and a grounded AI waiter for allergens, pairings, and budgets.',
    keywords: [
      'ai digital menu',
      'ai restaurant menu software',
      'ai waiter for restaurants',
      'gemini ocr menu software',
    ],
    primaryCtaLabel: 'Build Your AI Menu',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Try Grounded AI Waiter Demo',
    secondaryCtaHref: '/m/chai-and-chutney',
    capabilitiesHeading: 'Three layers of culinary AI — zero hallucination',
    capabilitiesSubheading:
      'Every AI workflow in Menzy is anchored directly to structured database records approved by your team.',
    capabilities: [
      {
        title: 'Multimodal Menu Extraction (OCR)',
        description:
          'Turn crooked smartphone menu photos or dense multi-page PDFs into structured categories, prices, portion variants, and dietary classifications.',
      },
      {
        title: 'Menu-Grounded AI Waiter & Sommelier',
        description:
          'Diners ask "What vegan mains are under ₹400?" or "What drink pairs with Paneer Tikka?" and get clickable dish cards tied strictly to available items.',
      },
      {
        title: 'Canonical 3D Culinary Illustration Lab',
        description:
          'Generate cohesive 3D-clay styled food visuals per dish, preview candidates before saving, and tweak prompts anytime without losing original photography.',
      },
    ],
    workflowHeading: 'Full owner control over every AI touchpoint',
    workflowSteps: [
      {
        step: '01',
        title: 'Configure tone & guardrails',
        detail: 'Customize your AI welcome message, hospitality tone, pairing suggestions toggle, and per-session diner query limits.',
      },
      {
        step: '02',
        title: 'Test live in Dashboard Playground',
        detail: 'Preview how your AI host answers budget, gluten-free, or chef pairing prompts inside the owner console before publishing.',
      },
      {
        step: '03',
        title: 'Track customer intent insights',
        detail: 'Review diner chat question trends and most-explored dishes in Analytics to spot missing dietary options or combos.',
      },
    ],
    checklistHeading: 'Why grounded AI matters in food service',
    checklistItems: [
      'Zero invented dishes or hallucinated off-menu pricing',
      'Automatic availability checks so out-of-stock dishes aren’t recommended',
      'Multi-provider reliability with automatic AI key failover',
      'Clear allergen transparency preserving owner-verified dietary claims',
    ],
    faqs: [
      {
        question: 'Can I turn off AI diner chat on specific days or tweak how it speaks?',
        answer:
          'Yes. Inside Dashboard → AI Waiter, owners can enable or disable diner chat, toggle pairing recommendations, cap queries per session, and customize welcome copy.',
      },
      {
        question: 'How does Illustration Lab charge for 3D dish visuals?',
        answer:
          'Reusing existing approved illustrations from our shared canonical culinary library never consumes paid credits. Monthly 3D image credits are only spent when generating bespoke custom artwork.',
      },
    ],
    relatedLinks: [
      {
        title: 'Menu Visual Design Guide',
        description: 'Best practices for organizing high-converting visual menus.',
        href: '/blog/restaurant-menu-visual-design-best-practices',
      },
      {
        title: 'What Is an AI Restaurant Menu?',
        description: 'Deep dive into grounded AI waiters vs generic chatbots.',
        href: '/blog/what-is-an-ai-powered-restaurant-menu',
      },
      {
        title: 'See Pricing Tiers',
        description: 'Transparent AI query and 3D credit allowances by plan.',
        href: '/pricing',
      },
    ],
  },

  'restaurant-automation': {
    slug: 'restaurant-automation',
    path: '/restaurant-automation',
    breadcrumbName: 'Restaurant Automation',
    eyebrow: 'Hospitality Workflow Automation',
    h1: 'Automate menu updates, guest Q&A, and table dispatch',
    intro:
      'Give lean hospitality teams leverage. Eliminate manual menu re-typing, repetitive ingredient questions, wrong-table orders, and constant check-ins for water or bills.',
    seoTitle: 'Restaurant Automation Software — Menzy',
    seoDescription:
      'Streamline dining room operations with automated OCR menu imports, grounded AI diner Q&A, one-tap waiter alerts, and live KDS ticket routing.',
    keywords: [
      'restaurant automation software',
      'hospitality automation saas',
      'automate restaurant ordering',
      'smart qr table service',
    ],
    primaryCtaLabel: 'Automate Your Venue',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Explore Live Demo',
    secondaryCtaHref: '/demo',
    capabilitiesHeading: 'Practical automation that respects hospitality',
    capabilitiesSubheading:
      'Technology should handle repetitive coordination so servers can focus on genuine guest warmth.',
    capabilities: [
      {
        title: 'Automated Menu Photo-to-Web Conversion',
        description:
          'Skip hours of spreadsheet formatting. Upload menu scans and get categorized dishes, prices, and 3D visual matches ready to edit.',
      },
      {
        title: 'Self-Serve Dietary & Pairing Answers',
        description:
          'Diners get instant, grounded answers about spice levels, Jain/Veg options, or beverage pairings right at the table while servers handle plating.',
      },
      {
        title: 'Structured Waiter Request Alerts',
        description:
          'Replace waving across crowded dining rooms with quiet, categorized pings (`Bill`, `Water`, `Cutlery`, `Staff`) displaying exact table numbers.',
      },
    ],
    workflowHeading: 'From manual overhead to streamlined flow',
    workflowSteps: [
      {
        step: '01',
        title: 'Digitize & publish once',
        detail: 'Keep menu availability, pricing variants, and specials synced across all table tents automatically.',
      },
      {
        step: '02',
        title: 'Let AI handle pre-order questions',
        detail: 'Reduce table ordering hesitation with 3D dish visuals and transparent ingredient clarity.',
      },
      {
        step: '03',
        title: 'Route orders directly to KDS',
        detail: 'Eliminate handwritten chits and misheard table modifiers during Friday and Saturday peaks.',
      },
    ],
    checklistHeading: 'Built for multi-table teams across India & the US',
    checklistItems: [
      'Bulk table creation and 1-click printable table tent QR generation',
      'Real-time Redis + SSE synchronization between guest devices and kitchen terminals',
      'Downloadable CSV order history and Google Maps review conversion funnel',
      'Self-healing session expiry protecting tables from stale screenshots',
    ],
    faqs: [
      {
        question: 'Does Menzy replace our waitstaff?',
        answer:
          'Not at all — it removes repetitive back-and-forth tasks (reading out ingredients, taking standard add-on orders, chasing bills) so staff deliver better table hospitality.',
      },
    ],
    relatedLinks: [
      {
        title: 'Order Management & KDS',
        description: 'Inspect how live kitchen & waiter dispatch runs smoothly.',
        href: '/restaurant-order-management',
      },
      {
        title: 'AI Digital Menu',
        description: 'Explore OCR extraction and grounded AI hospitality.',
        href: '/ai-digital-menu',
      },
      {
        title: 'Contact Menzy Team',
        description: 'Ask about rolling out across multiple outlets.',
        href: '/contact',
      },
    ],
  },

  'digital-menu-for-restaurants': {
    slug: 'digital-menu-for-restaurants',
    path: '/digital-menu-for-restaurants',
    breadcrumbName: 'For Restaurants',
    eyebrow: 'Full-Service & Casual Dining',
    h1: 'Digital menu & QR ordering built for dine-in restaurants',
    intro:
      'Turn every table into a curated dining experience. Showcase signature dishes with 3D-clay illustrations, answer dietary questions instantly, and turn tables faster.',
    seoTitle: 'Digital Menu Software for Restaurants — Menzy',
    seoDescription:
      'Modernize full-service restaurants with interactive visual menus, FSSAI/allergen clarity, grounded AI recommendations, table QR ordering, and KDS.',
    keywords: [
      'digital menu for restaurants',
      'restaurant menu app',
      'dine in qr ordering software',
    ],
    primaryCtaLabel: 'Create Restaurant Menu',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See Chai & Chutney Live',
    secondaryCtaHref: '/m/chai-and-chutney',
    capabilitiesHeading: 'Designed around real dining room realities',
    capabilitiesSubheading:
      'Built for Indian craft kitchens, neighborhood bistros, and multi-cuisine dining rooms.',
    capabilities: [
      {
        title: 'FSSAI & Dietary Clarity First',
        description:
          'Highlight Veg, Non-Veg, Egg, Vegan, and Gluten-Free filters cleanly alongside spice levels and portion sizes.',
      },
      {
        title: 'Smart Beverage & Side Pairings',
        description:
          'Increase check size naturally as guests ask the AI host for dessert or drink pairings suited to their selected main.',
      },
      {
        title: 'Zone & Table Tent Organization',
        description:
          'Organize tables by Main Dining, Rooftop, or Private Lounge with tailored Wi-Fi onboarding and direct Google review links.',
      },
    ],
    workflowHeading: 'Launch across your dining room in one afternoon',
    workflowSteps: [
      {
        step: '01',
        title: 'Scan your existing dinner & bar menus',
        detail: 'Import appetizers, curries, mains, breads, and beverages automatically via Gemini Vision.',
      },
      {
        step: '02',
        title: 'Feature bestsellers & chef picks',
        detail: 'Badge high-margin signature plates so guests discover house favorites right away.',
      },
      {
        step: '03',
        title: 'Enable table ordering & waiter alerts',
        detail: 'Let guests add extra rounds or request water/bill cleanly without waiting for eye contact.',
      },
    ],
    checklistHeading: 'Why dine-in restaurants adopt Menzy',
    checklistItems: [
      'Warm editorial typography instead of cold utility templates',
      'Multiplayer wait-time table games keep groups engaged while dishes fire',
      'Live dish availability sync across all tables',
      'Predictable monthly INR and USD plans with zero per-order commission fees',
    ],
    faqs: [
      {
        question: 'Does Menzy charge a percentage commission per dine-in order?',
        answer:
          'No. Menzy is a flat monthly SaaS subscription — you keep 100% of your dine-in table order revenue.',
      },
    ],
    relatedLinks: [
      {
        title: 'For Cafés & Bakeries',
        description: 'Fast morning pastry & espresso table workflows.',
        href: '/digital-menu-for-cafes',
      },
      {
        title: 'Table QR Ordering',
        description: 'Learn how 30-minute idle scan expiry protects dining tables.',
        href: '/table-ordering',
      },
      {
        title: 'Explore Pricing',
        description: 'View transparent regional SaaS tiers.',
        href: '/pricing',
      },
    ],
  },

  'digital-menu-for-cafes': {
    slug: 'digital-menu-for-cafes',
    path: '/digital-menu-for-cafes',
    breadcrumbName: 'For Cafés & Bakeries',
    eyebrow: 'Cafés, Bakeries & Patisseries',
    h1: 'Visual digital menus tailored for artisanal cafés & bakeries',
    intro:
      'Delight coffee & pastry guests with botanical themes, 3D-clay espresso and tart illustrations, milk/roast variants, and built-in Guest Wi-Fi QR cards.',
    seoTitle: 'Digital Menu Software for Cafés & Bakeries — Menzy',
    seoDescription:
      'Create gorgeous visual café menus with milk & size variants, 3D pastry art, one-tap guest Wi-Fi QR cards, and table ordering.',
    keywords: [
      'digital menu for cafes',
      'cafe qr code menu',
      'bakery digital menu software',
    ],
    primaryCtaLabel: 'Create Café Menu',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See Gilded Fork Live',
    secondaryCtaHref: '/m/the-gilded-fork',
    capabilitiesHeading: 'Crafted for specialty coffee & bakery hospitality',
    capabilitiesSubheading:
      'From curated Botanical Café & Pastel Patisserie themes to effortless customization options.',
    capabilities: [
      {
        title: 'Milk, Roast & Portion Variants',
        description:
          'Configure Oat/Almond milk upgrades, iced/hot sizes, or pastry box quantities cleanly with transparent add-on pricing.',
      },
      {
        title: 'One-Tap Guest Wi-Fi QR Hub',
        description:
          'Stop writing Wi-Fi passwords on sticky notes. Share your guest SSID on the table hub with native camera-join QR codes.',
      },
      {
        title: 'Daily Sold-Out Pastry Toggles',
        description:
          'Mark freshly baked almond croissants sold out in one tap the moment the last tray leaves the counter.',
      },
    ],
    workflowHeading: 'Built for counter & small-table speed',
    workflowSteps: [
      {
        step: '01',
        title: 'Choose Botanical or Pastel themes',
        detail: 'Match your interior mood using high-contrast café typography presets.',
      },
      {
        step: '02',
        title: 'Add single-origin tasting notes to AI',
        detail: 'Let guests ask the AI host for low-acid pour-over or dairy-free brunch recommendations.',
      },
      {
        step: '03',
        title: 'Place table QRs for cozy reorder rounds',
        detail: 'Let laptop workers or weekend brunch tables order a second flat white right from their seat.',
      },
    ],
    checklistHeading: 'Built for morning rush & afternoon lounge guests',
    checklistItems: [
      'Instant pastry & seasonal drink availability updates',
      'Warm 3D-clay coffee cups, lattes, sourdough & cake illustrations',
      'Direct Google Review prompt when guests finish brunch',
      'Zero app downloads required for walk-in guests',
    ],
    faqs: [
      {
        question: 'Can cafés offer table ordering even if first orders happen at the counter?',
        answer:
          'Yes! Many cafés take initial counter orders while letting seated guests scan table QRs to view tasting notes, join Wi-Fi, or order additional drinks.',
      },
    ],
    relatedLinks: [
      {
        title: 'Live Café Demo Menu',
        description: 'Browse The Gilded Fork Café & Bistro menu live.',
        href: '/m/the-gilded-fork',
      },
      {
        title: 'Live Bakery Demo',
        description: 'Explore Bakehouse 72 Artisan Bakery demo.',
        href: '/m/bakehouse-72-demo',
      },
      {
        title: 'View Café Pricing',
        description: 'Starter plans built for single-location cafés.',
        href: '/pricing',
      },
    ],
  },

  'digital-menu-for-cloud-kitchens': {
    slug: 'digital-menu-for-cloud-kitchens',
    path: '/digital-menu-for-cloud-kitchens',
    breadcrumbName: 'Food Courts & Quick Service',
    eyebrow: 'Food Courts, QSRs & Pop-Ups',
    h1: 'High-speed QR ordering & menu management for QSR & food courts',
    intro:
      'Keep counter lines moving. Publish crisp mobile menus, manage combo variants and stock availability instantaneously, and stream paid-at-counter tickets straight to prep stations.',
    seoTitle: 'Digital Menu Software for QSRs & Food Courts — Menzy',
    seoDescription:
      'Speed up quick-service counters, pop-ups, and food courts with mobile QR menus, variant customization, real-time stock toggles, and KDS queues.',
    keywords: [
      'qsr digital menu software',
      'food court qr ordering',
      'quick service restaurant menu app',
    ],
    primaryCtaLabel: 'Launch Your Digital Menu',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Explore Order KDS',
    secondaryCtaHref: '/restaurant-order-management',
    capabilitiesHeading: 'Speed and accuracy at peak lunch rush',
    capabilitiesSubheading:
      'Designed to shorten queue decision time and keep kitchen prep stations synchronized.',
    capabilities: [
      {
        title: 'Counter & Zone QR Codes',
        description:
          'Place durable QR cards across pickup zones, standing tables, or food court seating so guests decide before stepping up.',
      },
      {
        title: 'Combo Variants & Spice Levels',
        description:
          'Handle spice choices, protein add-ons, and meal upgrades cleanly inside Dish Detail sheets without slowing down the counter.',
      },
      {
        title: 'Instant Stock Sync & Dark KDS',
        description:
          'Disable out-of-stock SKUs immediately and track tickets through Preparing → Ready from a browser-based KDS screen.',
      },
    ],
    workflowHeading: 'Built for high-volume turnover',
    workflowSteps: [
      {
        step: '01',
        title: 'Batch-import combos & bowls',
        detail: 'Upload your menu PDF or board photo to create structured categories in minutes.',
      },
      {
        step: '02',
        title: 'Configure fast mobile KDS alerts',
        detail: 'Assign prep staff directly to `/orders` with audio ticket chimes.',
      },
      {
        step: '03',
        title: 'Export daily settlement CSVs',
        detail: 'Filter historical orders by date and status cleanly after service close.',
      },
    ],
    checklistHeading: 'Everything lean food concepts need',
    checklistItems: [
      'Zero commission per order — flat monthly SaaS subscription',
      'Fast mobile menu search and category filtering',
      'Allergen and dietary badge clarity for faster customer confidence',
      'Role-scoped staff logins keeping back-office settings locked',
    ],
    faqs: [
      {
        question: 'Can multiple kitchen concepts or pickup counters use separate Menzy menus?',
        answer:
          'Yes. Each restaurant outlet gets its own slug (`/m/your-outlet`), custom branding theme, table/zone QRs, and isolated KDS order stream.',
      },
    ],
    relatedLinks: [
      {
        title: 'Order Management & KDS',
        description: 'See how live KDS ticket tracking works.',
        href: '/restaurant-order-management',
      },
      {
        title: 'Pricing Plans',
        description: 'Scale to unlimited menu dishes on Pro.',
        href: '/pricing',
      },
      {
        title: 'Features Overview',
        description: 'Review every Menzy studio & tool.',
        href: '/features',
      },
    ],
  },
};

