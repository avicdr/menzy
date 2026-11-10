export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  keywords: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  ctaPath: string;
  ctaLabel: string;
}

export const BLOG_POSTS: BlogArticle[] = [
  {
    slug: 'how-to-create-qr-code-menu-for-your-restaurant',
    title: 'How to Create a QR Code Menu for Your Restaurant (Step-by-Step Guide)',
    description:
      'Learn how to turn a printed paper or PDF menu into a fast, mobile-first table QR menu with 3D dish visuals, dietary clarity, and zero app downloads.',
    category: 'QR Menus',
    readTime: '6 min read',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    authorName: 'Menzy Hospitality Team',
    keywords: [
      'how to create a qr code menu',
      'qr code menu generator',
      'restaurant qr menu',
      'digital menu for restaurants',
    ],
    sections: [
      {
        heading: '1. Skip static PDF uploads',
        paragraphs: [
          'The biggest mistake restaurants make when going digital is uploading a pinch-and-zoom PDF. On a 6-inch mobile screen, multi-column paper menus force diners to zoom awkwardly just to read prices or check whether a dish contains dairy or nuts.',
          'A structured digital menu renders natively in mobile browsers, loads in under a second on cellular connections, and adapts typography, currency formatting, and dietary indicators cleanly.',
        ],
      },
      {
        heading: '2. Digitize existing menus automatically with AI OCR',
        paragraphs: [
          'Re-typing 80 to 150 items manually slows down onboarding. Modern tools like Menzy accept smartphone photos or PDF scans of your current paper menu and extract dish names, prices, variants, descriptions, and dietary markers automatically.',
        ],
        bullets: [
          'Review every extracted dish, variant price, and allergen note before publishing.',
          'Tag vegetarian, egg, and non-vegetarian items cleanly — essential for FSSAI compliance in India.',
          'Pair dishes with 3D-clay food visuals or custom uploaded photos so signature items stand out.',
        ],
      },
      {
        heading: '3. Generate table-specific QR codes and printable table tents',
        paragraphs: [
          'Instead of printing one generic QR link for the entire dining room, assign a unique cryptographic table QR token to each table. When a guest scans Table 4, their browser opens the menu scoped strictly to Table 4.',
          'Print high-resolution 4×6" table tents directly from the dashboard — complete with optional one-tap Guest Wi-Fi QR access so diners get online reliably even inside thick-walled spaces.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do guests need to download a mobile app to scan my QR menu?',
        answer:
          'No. Modern iPhone and Android cameras open your Menzy QR menu directly in Safari or Chrome with no app install or account creation required.',
      },
      {
        question: 'Can I update sold-out items or prices without reprinting QR table tents?',
        answer:
          'Yes. Availability toggles, price edits, and seasonal specials update live across existing printed table QRs immediately.',
      },
    ],
    ctaPath: '/qr-code-menu',
    ctaLabel: 'Explore Menzy QR Code Menu Generator',
  },
  {
    slug: 'digital-menu-software-for-restaurants-india',
    title: 'Digital Menu Software for Restaurants in India: What to Look For in 2026',
    description:
      'Compare key requirements for Indian restaurants adopting QR menus: FSSAI dietary clarity, predictable INR billing, guest Wi-Fi QR cards, and table ordering.',
    category: 'India Hospitality',
    readTime: '7 min read',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    authorName: 'Menzy Hospitality Team',
    keywords: [
      'digital menu software india',
      'qr menu software india',
      'restaurant table ordering system india',
    ],
    sections: [
      {
        heading: 'FSSAI Veg, Egg & Non-Veg indicators first',
        paragraphs: [
          'Unlike Western menu apps where vegetarian markers are an afterthought, Indian guests scan immediately for green Veg, brown Non-Veg, and Eggetarian symbols. Reliable software treats FSSAI classification as first-class structured data alongside spice hints and Jain/gluten-free tags.',
        ],
      },
      {
        heading: 'Predictable local INR pricing without steep USD conversion fees',
        paragraphs: [
          'Many global SaaS menu tools charge US dollar tiers tailored for North American ticket averages. Indian cafés, quick-service spots, and multi-outlet dining rooms benefit from clear regional INR plans starting at ₹999/month.',
        ],
        bullets: [
          'Starter plans covering up to 50 dishes, 15 custom 3D image credits/mo, and 1,000 AI diner queries/mo.',
          'Growth and Pro tiers scaling up to Unlimited dishes, 100 custom 3D image credits/mo, and 6,000 AI queries/mo.',
          'Transparent monthly billing in INR via Razorpay without surprise foreign-exchange markups.',
        ],
      },
      {
        heading: 'Direct table ordering plus one-tap waiter assistance',
        paragraphs: [
          'During peak weekend dinner rushes, servers get tied up answering routine ingredient questions or walking back and forth for water and bills. Combine digital browsing with optional direct-to-kitchen QR ordering and quick service-call buttons ("Water", "Cutlery", "Bill") to improve table turns.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How much does Menzy cost in India?',
        answer:
          'Menzy plans in India start at ₹999/month (Starter), ₹1,799/month (Growth), and ₹2,699/month (Pro), billed transparently in INR.',
      },
      {
        question: 'Does Menzy support GST tax configuration on table orders?',
        answer:
          'Yes. Restaurant operators can configure tax percentage, optional service charge percentage, and pay-at-counter workflows from dashboard ordering settings.',
      },
    ],
    ctaPath: '/pricing',
    ctaLabel: 'See Regional Plans & Pricing',
  },
  {
    slug: 'table-specific-qr-ordering-vs-traditional-ordering',
    title: 'How Table-Specific QR Ordering Works (and Prevents Wrong-Table Orders)',
    description:
      'Understand cryptographic table tokens, 30-minute idle scan expiry, and how modern Kitchen Display Systems keep dine-in ordering fast and accurate.',
    category: 'Table Ordering',
    readTime: '5 min read',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    authorName: 'Menzy Hospitality Team',
    keywords: [
      'restaurant table ordering system',
      'contactless restaurant ordering',
      'qr code ordering system',
    ],
    sections: [
      {
        heading: 'Why generic menu links break down once ordering is turned on',
        paragraphs: [
          'Asking hurried guests to type their own table number from a dropdown invites typos — leading to chilled drinks delivered to Table 5 instead of Table 3, or playful remote orders from someone who left the café two hours earlier.',
        ],
      },
      {
        heading: 'Cryptographic per-table QR tokens and 30-minute idle protection',
        paragraphs: [
          'Every table in Menzy receives a signed opaque token (`tq_...`) backed by a table QR version hash. The server resolves the exact table strictly from that valid token.',
        ],
        bullets: [
          'Cross-table isolation: A guest scanning Table 3 cannot inject orders or waiter calls into Table 5.',
          '30-minute inactivity rescan guard: If no order is placed from that device for 30 minutes, the browser asks the diner to rescan the table QR — blocking old sessions after guests leave.',
          'Instant QR rotation: Replace a damaged tent and invalidate the previous table QR token in one click.',
        ],
      },
      {
        heading: 'Live Kitchen Display (KDS) & floor staff terminal',
        paragraphs: [
          'Orders stream directly into `/orders` via real-time Server-Sent Events with synthesized bell alerts, variant breakdowns, special instructions, and status progression from Pending → Preparing → Ready → Served.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What happens if a customer tries ordering from a screenshot scanned yesterday?',
        answer:
          'Sessions expire automatically after 30 minutes without placing an order, prompting the browser to rescan the live QR code on the table.',
      },
      {
        question: 'Can managers disable online ordering temporarily during kitchen peak hours?',
        answer:
          'Yes. Staff and owners can toggle New Orders on or off anytime without hiding the visual digital menu or AI waiter.',
      },
    ],
    ctaPath: '/table-ordering',
    ctaLabel: 'Learn About Table QR Ordering',
  },
  {
    slug: 'what-is-an-ai-powered-restaurant-menu',
    title: 'What Is an AI-Powered Restaurant Menu? How Grounded AI Waiters Actually Work',
    description:
      'Discover how menu-grounded AI assistants answer guest allergen questions, handle budget filters, and suggest pairings without inventing dishes.',
    category: 'AI Waiter',
    readTime: '6 min read',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    authorName: 'Menzy Hospitality Team',
    keywords: [
      'ai digital menu',
      'ai restaurant menu',
      'ai waiter for restaurants',
    ],
    sections: [
      {
        heading: 'Grounded in your live kitchen menu — never generic web trivia',
        paragraphs: [
          'Unconstrained chatbots are risky in food service because a generic model might recommend a dish you removed last month or guess allergen safety carelessly. An AI-powered digital menu strictly retrieves your verified menu catalog, current prices, portion variants, and ingredient/allergen tags before composing any answer.',
        ],
      },
      {
        heading: 'High-value questions diners ask most often',
        bullets: [
          'Budget filtering: "What spicy appetizers do you have under ₹400?" or "Mains under $20"',
          'Dietary filtering: "Show nut-free gluten-free choices" or "Pure Veg high-protein bowls"',
          'Pairing suggestions: "Which drink goes best with Smoked Malai Paneer Tikka?"',
        ],
        paragraphs: [
          'Each AI response links straight to interactive dish cards so guests can inspect nutrition estimates and add items right into their table order.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How does the restaurant control the AI waiter tone and boundaries?',
        answer:
          'Owners configure a custom welcome message, conversational tone (e.g., Warm Editorial or Concierge), per-session query caps, and toggle pairing recommendations directly inside the Dashboard AI Waiter tab.',
      },
    ],
    ctaPath: '/ai-digital-menu',
    ctaLabel: 'Explore Menzy AI Digital Menus',
  },
  {
    slug: 'restaurant-menu-visual-design-best-practices',
    title: 'Visual Digital Menu Design Best Practices: Increasing Average Order Value',
    description:
      'Practical principles for structuring digital categories, custom restaurant themes, 3D dish artwork consistency, and mobile checkout flow.',
    category: 'Menu Design',
    readTime: '5 min read',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    authorName: 'Menzy Hospitality Team',
    keywords: [
      'restaurant menu design best practices',
      '3d restaurant menu',
      'interactive restaurant menu',
    ],
    sections: [
      {
        heading: 'Consistent visual language beats inconsistent phone snapshots',
        paragraphs: [
          'Mixed lighting across dish photos makes a menu look cluttered. Stylized 3D-clay culinary illustrations match lighting, plate angle, and warm neutral backdrops across every category — from iced lattes to claypot biryanis — while preserving authentic visual recognition.',
        ],
      },
      {
        heading: 'Accessible contrast & brand theme presets',
        paragraphs: [
          'Good restaurant branding carries onto the guest’s phone. Menzy Theme Studio includes curated accessible typography & color presets (Warm Editorial, Botanical Café, Midnight Espresso, Pastel Patisserie) with automated contrast warnings so menus remain legible in dim candlelight dining rooms.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can we match our menu colors and typography to our interior decor?',
        answer:
          'Yes. Select from curated theme presets or customize background, surface, accent colors, card radius, and editorial fonts with live contrast validation.',
      },
    ],
    ctaPath: '/features',
    ctaLabel: 'Tour Menzy Theme & 3D Studio',
  },
];

export function getBlogPostBySlug(slug: string): BlogArticle | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

