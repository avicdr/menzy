import 'dotenv/config';
import {
  NutritionSource,
  ThemePreset,
  LayoutMode,
  PublicationState,
  ClaimStatus,
  MenuType,
  MenuVisibility,
} from '@prisma/client';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { getCache } from '../src/lib/cache/redis';

export const ACAI_THEORY_SLUG = 'acai-theory-demo';

export async function seedAcaiTheoryDemo() {
  console.log('🍇 Seeding Açaí Theory Demo Restaurant...');

  // 1. Upsert Restaurant (Unclaimed Demo Restaurant)
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: ACAI_THEORY_SLUG },
    update: {
      displayName: 'Açaí Theory',
      description: 'Colourful açaí bowls, refreshing smoothies, and fresh savoury snacks.',
      country: 'IN',
      city: 'Bengaluru',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      address: '2017, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560008',
      phone: '+91 96860 06660',
      logoUrl: '/images/acai-theory-logo.png',
      publicationState: PublicationState.PUBLISHED,
      isClaimed: false, // Explicitly marked as demo / unclaimed
      organizationId: null, // Unattached to any claimed organization
    },
    create: {
      slug: ACAI_THEORY_SLUG,
      displayName: 'Açaí Theory',
      description: 'Colourful açaí bowls, refreshing smoothies, and fresh savoury snacks.',
      country: 'IN',
      city: 'Bengaluru',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      address: '2017, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560008',
      phone: '+91 96860 06660',
      logoUrl: '/images/acai-theory-logo.png',
      publicationState: PublicationState.PUBLISHED,
      isClaimed: false, // Explicitly marked as demo / unclaimed
      organizationId: null, // Unattached to any claimed organization
    },
  });

  // 2. Scoped Brand Theme Configuration
  await prisma.restaurantTheme.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      presetKey: ThemePreset.CUSTOM,
      backgroundColor: '#FFFFFF', // Clean White
      surfaceColor: '#F5F5F5', // Secondary Light Neutral Surface
      primaryTextColor: '#08070F', // Rich dark ink text
      secondaryTextColor: '#524C5A', // High-contrast readable secondary text
      accentColor: '#580284', // Primary brand purple
      secondaryAccentColor: '#FC9020', // Small optional orange accent
      headingFont: 'Plus Jakarta Sans', // Rounded, readable typography
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: LayoutMode.GRID,
      cardRadius: '20px', // Playful, rounded cards
      buttonStyle: 'pill', // Rounded purple category controls and buttons
      imageProportions: 'square', // Large appetising visuals
      texture: 'none',
      isPublished: true,
    },
    create: {
      restaurantId: restaurant.id,
      presetKey: ThemePreset.CUSTOM,
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F5F5F5',
      primaryTextColor: '#08070F',
      secondaryTextColor: '#524C5A',
      accentColor: '#580284',
      secondaryAccentColor: '#FC9020',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: LayoutMode.GRID,
      cardRadius: '20px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'none',
      isPublished: true,
    },
  });

  // 3. Restaurant Settings & Grounded AI Waiter Tone
  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      welcomeMessage:
        'Welcome to Açaí Theory! Explore our colourful açaí bowls, refreshing smoothies, and savoury super snacks. Demo menu — prices and availability subject to confirmation.',
      aiTone: 'bright, playful, knowledgeable, concise, hospitality-focused',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 25,
    },
    create: {
      restaurantId: restaurant.id,
      welcomeMessage:
        'Welcome to Açaí Theory! Explore our colourful açaí bowls, refreshing smoothies, and savoury super snacks. Demo menu — prices and availability subject to confirmation.',
      aiTone: 'bright, playful, knowledgeable, concise, hospitality-focused',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 25,
    },
  });

  // 4. Demo Ordering Settings (Sample Orders restricted to demo environment with counter payment)
  await prisma.restaurantOrderingSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      orderingEnabled: true,
      acceptsNewOrders: true,
      allowSpecialInstructions: true,
      paymentMode: 'PAY_AT_COUNTER',
      taxPercentage: 5.0,
      serviceChargePercentage: 0.0,
      notificationSettings: {
        demoNotice: 'Demo menu — prices and availability subject to confirmation.',
        showLogo: true,
      },
    },
    create: {
      restaurantId: restaurant.id,
      orderingEnabled: true,
      acceptsNewOrders: true,
      allowSpecialInstructions: true,
      paymentMode: 'PAY_AT_COUNTER',
      taxPercentage: 5.0,
      serviceChargePercentage: 0.0,
      notificationSettings: {
        demoNotice: 'Demo menu — prices and availability subject to confirmation.',
        showLogo: true,
      },
    },
  });

  // 5. Demo Table for Table QR Ordering flow
  const tableTokenRaw = 'demo-acaitheory-table1';
  const qrTokenHash = crypto.createHash('sha256').update(tableTokenRaw).digest('hex');
  await prisma.restaurantTable.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: 'Table 1',
      },
    },
    update: {
      section: 'Demo Dining',
      capacity: 4,
      qrTokenHash,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: 'Table 1',
      section: 'Demo Dining',
      capacity: 4,
      qrTokenHash,
      isActive: true,
    },
  });

  // 6. Claim Request for Founder Demo
  const rawClaimToken = 'demo-claim-acaitheory-indiranagar-2026';
  const claimTokenHash = crypto.createHash('sha256').update(rawClaimToken).digest('hex');
  await prisma.claimRequest.upsert({
    where: { claimTokenHash },
    update: {
      restaurantId: restaurant.id,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      verificationNotes: 'Founder demo menu for Açaí Theory Indiranagar with public listing pricing.',
    },
    create: {
      restaurantId: restaurant.id,
      claimTokenHash,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      verificationNotes: 'Founder demo menu for Açaí Theory Indiranagar with public listing pricing.',
    },
  });

  // 7. Upsert Menu
  let menu = await prisma.menu.findFirst({
    where: { restaurantId: restaurant.id },
  });

  if (!menu) {
    menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        title: 'All Day Menu',
        type: MenuType.ALL_DAY,
        visibility: MenuVisibility.PUBLIC,
        active: true,
        sortOrder: 1,
      },
    });
  } else {
    menu = await prisma.menu.update({
      where: { id: menu.id },
      data: {
        title: 'All Day Menu',
        type: MenuType.ALL_DAY,
        visibility: MenuVisibility.PUBLIC,
        active: true,
      },
    });
  }

  // 8. Idempotently Sync Categories & Dishes (Delete existing categories for clean rerun)
  await prisma.menuCategory.deleteMany({
    where: { menuId: menu.id },
  });

  // 23 menu items across 6 categories
  const CATEGORIES_DATA = [
    {
      name: 'Açaí Bowls',
      sortOrder: 1,
      items: [
        {
          name: 'OG Açaí Bowl',
          priceMinor: 29900,
          description: 'Pure açaí sorbet for the classic açaí experience.',
          sortOrder: 1,
        },
        {
          name: 'Mango Açaí Bowl',
          priceMinor: 24900,
          description: 'Mango sorbet layered with açaí sorbet.',
          sortOrder: 2,
        },
        {
          name: 'Dark Chocolate Açaí Bowl',
          priceMinor: 24900,
          description: 'Dark chocolate gelato layered with açaí sorbet.',
          sortOrder: 3,
        },
        {
          name: 'Lychee Açaí Bowl',
          priceMinor: 24900,
          description: 'Lychee sorbet layered with açaí sorbet.',
          sortOrder: 4,
        },
        {
          name: 'Coffee Açaí Bowl',
          priceMinor: 24900,
          description: 'Coffee sorbet layered with açaí sorbet.',
          sortOrder: 5,
        },
        {
          name: 'Matcha Açaí Bowl',
          priceMinor: 29900,
          description: 'Matcha gelato layered with açaí sorbet.',
          sortOrder: 6,
        },
      ],
    },
    {
      name: 'Summer Bowls',
      sortOrder: 2,
      items: [
        {
          name: 'Mango Dark Chocolate Bowl',
          priceMinor: 24900,
          description: 'Tropical mango sorbet paired with dark chocolate.',
          sortOrder: 1,
        },
      ],
    },
    {
      name: 'Overnight Oats',
      sortOrder: 3,
      items: [
        {
          name: 'Açaí Oats Bowl',
          priceMinor: 19900,
          description: 'Overnight oats with açaí sorbet, granola, and banana.',
          sortOrder: 1,
        },
        {
          name: 'Mango Oats Bowl',
          priceMinor: 19900,
          description: 'Overnight oats with mango sorbet, granola, and coconut flakes.',
          sortOrder: 2,
        },
        {
          name: 'Strawberry Matcha Oats Bowl',
          priceMinor: 19900,
          description: 'Overnight oats with matcha sorbet, strawberry compote, and granola.',
          sortOrder: 3,
        },
        {
          name: 'Tiramisu Oats Bowl',
          priceMinor: 19900,
          description: 'Coffee-infused overnight oats with chocolate and granola, finished with cocoa.',
          sortOrder: 4,
        },
      ],
    },
    {
      name: 'Smoothies & Blends',
      sortOrder: 4,
      items: [
        {
          name: 'OG Mango Smoothie',
          priceMinor: 22900,
          description: 'Mango sorbet blended with milk.',
          sortOrder: 1,
        },
        {
          name: 'Dark Matter Smoothie',
          priceMinor: 22900,
          description: 'Dark chocolate, banana, milk, and peanut butter.',
          sortOrder: 2,
        },
        {
          name: 'NO CAP Cold Coffee',
          priceMinor: 22900,
          description: 'Coffee sorbet blended with milk.',
          sortOrder: 3,
        },
        {
          name: 'Almond Aura Smoothie',
          priceMinor: 29900,
          description: 'Banana, milk, roasted almonds, dates, and cinnamon.',
          sortOrder: 4,
        },
        {
          name: 'Matcha Strawberry Blend',
          priceMinor: 27900,
          description: 'Matcha and milk with a strawberry compote layer.',
          sortOrder: 5,
        },
        {
          name: 'Spicy Pineapple Mango Smoothie',
          priceMinor: 27900,
          description: 'Mango and pineapple with a jalapeño kick.',
          sortOrder: 6,
        },
        {
          name: 'Strawberry Bliss Smoothie',
          priceMinor: 27900,
          description: 'Strawberry, banana, milk, dates, strawberry compote, and curd.',
          sortOrder: 7,
        },
      ],
    },
    {
      name: 'Super Snacks',
      sortOrder: 5,
      items: [
        {
          name: 'Foxnut Chaat',
          priceMinor: 19900,
          description: 'Air-fried makhana with sprouts, peanuts, vegetables, and tangy spices.',
          sortOrder: 1,
        },
        {
          name: 'Green Hummus',
          priceMinor: 19900,
          description: 'Chickpea, pistachio, and herb hummus with roasted tomatoes and whole wheat lavash.',
          sortOrder: 2,
        },
        {
          name: 'Watermelon Feta Sandwich',
          priceMinor: 19900,
          description: 'Watermelon and feta layered with mint and walnuts.',
          sortOrder: 3,
        },
        {
          name: 'Avocado Feta Toast',
          priceMinor: 27900,
          description: 'Sourdough with whipped feta, avocado-onion smash, roasted tomatoes, herbs, and chilli flakes.',
          sortOrder: 4,
        },
      ],
    },
    {
      name: 'Water',
      sortOrder: 6,
      items: [
        {
          name: 'Water Bottle, 500 ml',
          priceMinor: 2900,
          description: '500 ml packaged drinking water.',
          sortOrder: 1,
        },
      ],
    },
  ];

  let totalItemsSeeded = 0;
  for (const catData of CATEGORIES_DATA) {
    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: catData.name,
        sortOrder: catData.sortOrder,
      },
    });

    const itemsToCreate = catData.items.map((dish) => ({
      restaurantId: restaurant.id,
      menuId: menu.id,
      categoryId: category.id,
      customName: dish.name,
      restaurantDescription: dish.description,
      priceMinor: dish.priceMinor,
      currency: 'INR',
      portionSize: null,
      nutritionSource: NutritionSource.NOT_PROVIDED,
      isAvailable: true,
      isPublished: true,
      chefRecommended: false,
      isPopular: false,
      sortOrder: dish.sortOrder,
    }));

    await prisma.restaurantMenuItem.createMany({
      data: itemsToCreate,
    });

    totalItemsSeeded += itemsToCreate.length;
  }

  // Bust diner menu caches for both slugs
  const cache = getCache();
  await Promise.all([
    cache.del(`menu:slug:${ACAI_THEORY_SLUG}`),
    cache.del('menu:slug:acai-theory'),
  ]).catch(() => {});

  console.log(`✅ Seeded ${CATEGORIES_DATA.length} categories and ${totalItemsSeeded} dishes.`);
  console.log(`🍇 Açaí Theory Demo live at /m/${ACAI_THEORY_SLUG}`);
  return {
    restaurantId: restaurant.id,
    slug: restaurant.slug,
    categoriesCount: CATEGORIES_DATA.length,
    itemsCount: totalItemsSeeded,
    claimToken: rawClaimToken,
  };
}

if (require.main === module || process.argv[1]?.endsWith('seed-acai-theory.ts')) {
  seedAcaiTheoryDemo()
    .catch((err) => {
      console.error('❌ Error seeding Açaí Theory demo:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
