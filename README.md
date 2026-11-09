# Dishora — See it. Ask it. Crave it.

**Dishora** is a production-ready, multi-tenant SaaS application that converts physical restaurant menus and PDFs into interactive AI-powered visual dining menus featuring 3D-styled food illustrations and an intelligent conversational AI waiter.

Designed for hospitality venues across **India (INR ₹)** and the **United States (USD $)**.

---

## 🌟 Core Highlights

- **Menu First, AI Second**: Diners immediately access the full visual, categorized menu. AI acts as a non-intrusive companion.
- **3D-Clay Food Illustrations**: Stylized contemporary 2D illustrations with consistent editorial perspective and tableware lighting.
- **Shared Canonical Dish Library**: Archetypes (e.g. *Cappuccino*, *Paneer Tikka*, *Butter Chicken*) share approved assets across venues without contaminating restaurant-specific prices, recipes, or allergen claims.
- **Grounded Conversational AI Waiter**: Gemini-powered conversational assistant grounded exclusively in published dishes, with strict allergen safety fallbacks and dietary filtering.
- **Atomic Sliding-Window Rate Limiting**: 25 requests per 5-minute rolling window per device session and client IP with live countdown cooldown UI.
- **Owner Dashboard & Theme Studio**: Live interactive mobile preview, 4 curated hospitality presets (*Warm Editorial*, *Midnight Espresso*, *Botanical Café*, *Pastel Patisserie*), WCAG contrast validation, and real-time cache invalidation.
- **QR Studio**: Downloadable SVG, PNG, and 4x6" printable table tents.
- **Founder Super-Admin Console**: Environment-credentialed (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`) single administrator portal with renewal watchlists, complimentary entitlement overrides, cost accounting per model/venue, and private claim link generation.
- **Razorpay Subscriptions**: Server-verified checkout, raw HMAC webhook verification, idempotent event processing, and automatic monthly credit refreshing.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node v26)
- PostgreSQL running locally on port `5432` (or via Docker)
- Redis (optional; automatically falls back to built-in in-memory cache/sliding window store)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dishora?schema=public"
```

### 4. Database Setup & Seeding
Push the Prisma schema and run the comprehensive seed script:
```bash
# Push schema to PostgreSQL
npm run db:push

# Seed plans, canonical dishes, Indian cafe, US bistro, and founder demo
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Background Worker (Optional / Production)
In a separate terminal:
```bash
npm run worker
```

---

## 🧪 Testing

Dishora includes automated unit and integration tests covering rate limiting, canonical matching, HMAC webhook verification, and tenant auth:

```bash
npm run test
```

---

## 🔑 Demo Accounts & Pre-Seeded Venues

| Role / Venue | URL / Route | Credentials |
|---|---|---|
| **Indian Café (INR)** | `/m/chai-and-chutney` | Owner: `aarav@chaiandchutney.in` / `dishora2026!` |
| **US Bistro (USD)** | `/m/the-gilded-fork` | Owner: `elena@gildedbistro.com` / `dishora2026!` |
| **Founder Demo** | `/m/bakehouse-72-demo` | Claim Token: `demo-claim-bakehouse72-secret2026` |
| **Owner Dashboard** | `/dashboard` | Login at `/login` with either owner account |
| **Founder Admin** | `/admin` | Login at `/admin/login`: `founder@dishora.app` / `dishora2026!` |

---

## 🏛️ Project Architecture

```
├── prisma/
│   ├── schema.prisma          # 28 models covering identity, multi-tenancy, canonical dishes, jobs, and billing
│   └── seed.ts                # Seed data for plans, canonical archetypes, and demo restaurants
├── src/
│   ├── app/
│   │   ├── (auth)/            # Owner login & signup
│   │   ├── (owner)/dashboard/ # Restaurant owner console (Overview, Menu, Illustrations, Theme, QR, Billing)
│   │   ├── admin/             # Founder super-admin console & authentication
│   │   ├── claim/[token]/     # Owner demo claim redemption flow
│   │   ├── m/[slug]/          # Public diner visual menu experience & AI chat sheet
│   │   ├── api/               # Typed REST API endpoints
│   │   └── page.tsx           # Marketing website
│   ├── components/
│   │   ├── diner/             # DishCard, DishDetailSheet, AIChatSheet, DietaryBadge
│   │   └── dashboard/         # DashboardNav and owner controls
│   ├── lib/
│   │   ├── db/                # Prisma client singleton
│   │   ├── auth/              # Owner & founder JWT/HMAC session management
│   │   ├── gemini/            # Vision OCR extractor, illustration generator, grounded diner chat
│   │   ├── canonical/         # Canonical matcher & deduplication engine
│   │   ├── cache/             # Redis sliding-window rate limiter & cache
│   │   ├── theme/             # Theme tokens, presets & WCAG contrast validator
│   │   ├── payments/          # Plan catalog & Razorpay webhook processor
│   │   ├── storage/           # Storage adapter with local fallback
│   │   └── analytics/         # AI operating cost calculator & event tracker
│   └── workers/               # Background worker for extraction & generation jobs
└── tests/                     # Vitest test suites
```

---

## 🔒 Security & Privacy Guarantees

1. **Strict Multi-Tenant Isolation**: Tenant ID checks enforced at the database level on all mutations.
2. **Deterministic Allergy Safety**: AI never invents allergen-free claims; communicates uncertainty when ingredients are not verified by restaurant staff.
3. **Sliding-Window Protection**: Atomic Redis sliding window prevents API abuse and budget overruns.
4. **Environment-Gated Super-Admin**: Admin session cookies verified with SHA-256 HMAC and isolated from standard customer tables.

