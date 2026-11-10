import 'dotenv/config';
import { PlanTier, NutritionSource, AssetType, ThemePreset, LayoutMode, PublicationState, ClaimStatus } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';

function hashStaffPassword(plainText: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plainText, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting Menzy database seeding...');

  // 1. Seed Plan Catalog
  const plans = [
    {
      key: 'IN_STARTER',
      tier: PlanTier.STARTER,
      name: 'Starter (India)',
      country: 'IN',
      currency: 'INR',
      priceMinor: 99900,
      itemLimit: 50,
      imageCreditsMonthly: 15,
      aiQuestionsMonthly: 1000,
      features: { allowColors: false, allowPairings: false, analytics: 'BASIC' },
    },
    {
      key: 'IN_GROWTH',
      tier: PlanTier.GROWTH,
      name: 'Growth (India)',
      country: 'IN',
      currency: 'INR',
      priceMinor: 179900,
      itemLimit: 100,
      imageCreditsMonthly: 40,
      aiQuestionsMonthly: 3000,
      features: { allowColors: true, allowPairings: true, analytics: 'ADVANCED' },
    },
    {
      key: 'IN_PRO',
      tier: PlanTier.PRO,
      name: 'Pro (India)',
      country: 'IN',
      currency: 'INR',
      priceMinor: 269900,
      itemLimit: 9999,
      imageCreditsMonthly: 100,
      aiQuestionsMonthly: 6000,
      features: { allowColors: true, allowPairings: true, allowMultipleMenus: true, analytics: 'ADVANCED' },
    },
    {
      key: 'US_STARTER',
      tier: PlanTier.STARTER,
      name: 'Starter (US)',
      country: 'US',
      currency: 'USD',
      priceMinor: 2900,
      itemLimit: 50,
      imageCreditsMonthly: 15,
      aiQuestionsMonthly: 1000,
      features: { allowColors: false, allowPairings: false, analytics: 'BASIC' },
    },
    {
      key: 'US_GROWTH',
      tier: PlanTier.GROWTH,
      name: 'Growth (US)',
      country: 'US',
      currency: 'USD',
      priceMinor: 5900,
      itemLimit: 100,
      imageCreditsMonthly: 40,
      aiQuestionsMonthly: 3000,
      features: { allowColors: true, allowPairings: true, analytics: 'ADVANCED' },
    },
    {
      key: 'US_PRO',
      tier: PlanTier.PRO,
      name: 'Pro (US)',
      country: 'US',
      currency: 'USD',
      priceMinor: 11900,
      itemLimit: 9999,
      imageCreditsMonthly: 100,
      aiQuestionsMonthly: 6000,
      features: { allowColors: true, allowPairings: true, allowMultipleMenus: true, analytics: 'ADVANCED' },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Plan catalog seeded.');

  // 2. Cost Rates
  const costRates = [
    {
      modelId: 'gemini-2.5-flash',
      inputTokenRatePerMillion: 0.15,
      outputTokenRatePerMillion: 0.60,
      imageRatePerUnit: 0.0,
    },
    {
      modelId: 'imagen-3.0-generate-002',
      inputTokenRatePerMillion: 0.0,
      outputTokenRatePerMillion: 0.0,
      imageRatePerUnit: 0.03,
    },
  ];

  for (const rate of costRates) {
    await prisma.costRateVersion.upsert({
      where: { modelId: rate.modelId },
      update: rate,
      create: rate,
    });
  }
  console.log('✅ AI cost rates seeded.');

  // 3. Shared Canonical Dish Library with Approved Illustrations
  const canonicalDishesData = [
    {
      normalizedName: 'cappuccino',
      aliases: ['espresso with steamed milk foam', 'traditional cappuccino'],
      cuisine: 'Italian / Café',
      generalizedDescription: 'A classic espresso drink balanced with equal parts espresso, steamed milk, and velvety foam.',
      estimatedNutrition: { calories: 120, protein: 6, carbs: 9, fat: 4, servingGrams: 240 },
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'flat white',
      aliases: ['australian flat white', 'microfoam flat white'],
      cuisine: 'Australian / Café',
      generalizedDescription: 'Double shot of rich espresso layered with finely textured microfoam milk.',
      estimatedNutrition: { calories: 110, protein: 7, carbs: 8, fat: 4, servingGrams: 200 },
      imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'paneer tikka',
      aliases: ['tandoori paneer', 'paneer tikka kebab'],
      cuisine: 'North Indian',
      generalizedDescription: 'Chunks of cottage cheese marinated in spiced yogurt, skewered with bell peppers and onions, and charred in a clay tandoor.',
      estimatedNutrition: { calories: 280, protein: 16, carbs: 10, fat: 18, servingGrams: 220 },
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'butter chicken',
      aliases: ['murgh makhani', 'chicken makhani'],
      cuisine: 'North Indian',
      generalizedDescription: 'Tender tandoor-roasted chicken simmered in a velvety tomato, butter, and cashew cream sauce.',
      estimatedNutrition: { calories: 450, protein: 28, carbs: 12, fat: 32, servingGrams: 300 },
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'truffle mushroom pasta',
      aliases: ['wild mushroom truffle tagliatelle', 'pasta ai funghi'],
      cuisine: 'Italian / Contemporary',
      generalizedDescription: 'Handcrafted pasta ribbons tossed in a delicate black truffle emulsion with sautéed wild forest mushrooms and aged parmesan.',
      estimatedNutrition: { calories: 520, protein: 14, carbs: 68, fat: 22, servingGrams: 280 },
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'avocado sourdough toast',
      aliases: ['avocado toast', 'smashed avocado tartine'],
      cuisine: 'Contemporary Café',
      generalizedDescription: 'Crushed ripe Hass avocado on toasted artisanal sourdough, finished with extra virgin olive oil, flaky sea salt, and microgreens.',
      estimatedNutrition: { calories: 340, protein: 9, carbs: 36, fat: 18, servingGrams: 190 },
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'masala chai',
      aliases: ['karak chai', 'spiced milk tea', 'indian spiced tea'],
      cuisine: 'Indian',
      generalizedDescription: 'Slow-brewed Assam black tea simmered with fresh ginger, crushed green cardamom, cloves, and whole milk.',
      estimatedNutrition: { calories: 130, protein: 4, carbs: 16, fat: 5, servingGrams: 200 },
      imageUrl: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=600&q=80',
    },
    {
      normalizedName: 'tiramisu',
      aliases: ['classic italian tiramisu'],
      cuisine: 'Italian',
      generalizedDescription: 'Espresso-soaked Savoiardi ladyfingers layered with whipped mascarpone cream and dusted with bitter cocoa powder.',
      estimatedNutrition: { calories: 380, protein: 6, carbs: 42, fat: 21, servingGrams: 150 },
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    },
  ];

  for (const item of canonicalDishesData) {
    const asset = await prisma.asset.create({
      data: {
        type: AssetType.AI_ILLUSTRATION,
        storageKey: `canonical/${item.normalizedName.replace(/\s+/g, '-')}.webp`,
        publicUrl: item.imageUrl,
        mime: 'image/jpeg',
        source: 'SEED',
        prompt: `3D-clay-style illustration of ${item.normalizedName}`,
        generationModel: 'imagen-3.0-generate-002',
      },
    });

    const canonical = await prisma.canonicalDish.upsert({
      where: { normalizedName: item.normalizedName },
      update: {
        aliases: item.aliases,
        cuisine: item.cuisine,
        generalizedDescription: item.generalizedDescription,
        estimatedNutrition: item.estimatedNutrition,
        imageAssetId: asset.id,
      },
      create: {
        normalizedName: item.normalizedName,
        aliases: item.aliases,
        cuisine: item.cuisine,
        generalizedDescription: item.generalizedDescription,
        estimatedNutrition: item.estimatedNutrition,
        imageAssetId: asset.id,
      },
    });

    for (const alias of item.aliases) {
      await prisma.canonicalAlias.upsert({
        where: {
          canonicalId_normalizedAlias: {
            canonicalId: canonical.id,
            normalizedAlias: alias,
          },
        },
        update: {},
        create: {
          canonicalId: canonical.id,
          normalizedAlias: alias,
        },
      });
    }

    await prisma.canonicalAsset.upsert({
      where: {
        canonicalId_assetId: {
          canonicalId: canonical.id,
          assetId: asset.id,
        },
      },
      update: {},
      create: {
        canonicalId: canonical.id,
        assetId: asset.id,
        reuseCount: 1,
      },
    });
  }
  console.log('✅ Canonical dishes & aliases seeded.');

  // 4. Seed Indian Restaurant: "Chai & Chutney Craft Kitchen"
  const passwordHash = crypto.createHash('sha256').update('dishora2026!').digest('hex');

  // Clean up previous seed runs for full idempotency
  await prisma.restaurant.deleteMany({
    where: { slug: { in: ['chai-and-chutney', 'the-gilded-fork', 'bakehouse-72-demo'] } },
  });
  await prisma.subscription.deleteMany({
    where: { providerSubscriptionId: { in: ['sub_test_in_growth_01', 'sub_test_us_starter_01'] } },
  });
  await prisma.organization.deleteMany({
    where: { name: { in: ['Chai & Chutney Hospitality Group', 'Gilded Hospitality Partners', 'Demo Holdings (Founder Seeded)'] } },
  });

  const aaravUser = await prisma.user.upsert({
    where: { email: 'aarav@chaiandchutney.in' },
    update: {},
    create: {
      email: 'aarav@chaiandchutney.in',
      name: 'Aarav Sharma',
      phone: '+919876543210',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const indianOrg = await prisma.organization.create({
    data: {
      name: 'Chai & Chutney Hospitality Group',
      ownerUserId: aaravUser.id,
      billingCountry: 'IN',
      billingCurrency: 'INR',
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: aaravUser.id,
      organizationId: indianOrg.id,
      role: 'OWNER',
    },
  });

  // Indian Subscription
  await prisma.subscription.create({
    data: {
      organizationId: indianOrg.id,
      provider: 'RAZORPAY',
      planKey: 'IN_GROWTH',
      providerSubscriptionId: 'sub_test_in_growth_01',
      providerCustomerId: 'cust_in_aarav_01',
      status: 'ACTIVE',
      currency: 'INR',
      billingPeriod: 'MONTHLY',
      paidThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Credit Ledger
  await prisma.creditLedger.create({
    data: {
      organizationId: indianOrg.id,
      creditType: 'IMAGE_GENERATION',
      delta: 50,
      balanceAfter: 50,
      reason: 'Monthly Growth plan credit allocation',
      idempotencyKey: `init_credits_${indianOrg.id}`,
    },
  });

  const indianRestaurant = await prisma.restaurant.create({
    data: {
      organizationId: indianOrg.id,
      slug: 'chai-and-chutney',
      displayName: 'Chai & Chutney Craft Kitchen',
      description: 'Progressive Indian small plates, aromatic claypot biryanis, and artisanal house-brewed chais in Indiranagar.',
      country: 'IN',
      city: 'Bengaluru',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      address: '100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      phone: '+91 80 4123 4567',
      email: 'hello@chaiandchutney.in',
      logoUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      publicationState: PublicationState.PUBLISHED,
      isClaimed: true,
    },
  });

  await prisma.restaurantSettings.create({
    data: {
      restaurantId: indianRestaurant.id,
      welcomeMessage: 'Namaste! Welcome to Chai & Chutney. Ask our AI waiter for spicy recommendations or beverage pairings.',
      aiTone: 'warm, welcoming, knowledgeable about Indian spices and regional culinary roots',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 25,
    },
  });

  await prisma.restaurantTheme.create({
    data: {
      restaurantId: indianRestaurant.id,
      presetKey: ThemePreset.WARM_EDITORIAL,
      backgroundColor: '#F7F3EC',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#35271F',
      secondaryTextColor: '#7C695C',
      accentColor: '#B86D52',
      secondaryAccentColor: '#70816B',
      headingFont: 'Lora',
      bodyFont: 'DM Sans',
      layoutMode: LayoutMode.GRID,
      cardRadius: '16px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'none',
      isPublished: true,
    },
  });

  // Indian Tables - 9 Tables (Table 01 to Table 09)
  const indianTableTokens = [
    { name: 'Table 01', token: 'cc_tbl_token_01', section: 'Main Dining', cap: 2 },
    { name: 'Table 02', token: 'cc_tbl_token_02', section: 'Main Dining', cap: 4 },
    { name: 'Table 03', token: 'cc_tbl_token_03', section: 'Main Dining', cap: 4 },
    { name: 'Table 04', token: 'cc_tbl_token_04', section: 'Main Dining', cap: 4 },
    { name: 'Table 05', token: 'cc_tbl_token_05', section: 'Window Alcove', cap: 2 },
    { name: 'Table 06', token: 'cc_tbl_token_06', section: 'Veranda', cap: 6 },
    { name: 'Table 07', token: 'cc_tbl_token_07', section: 'Veranda', cap: 6 },
    { name: 'Table 08', token: 'cc_tbl_token_08', section: 'Courtyard Garden', cap: 8 },
    { name: 'Table 09', token: 'cc_tbl_token_09', section: 'Courtyard Garden', cap: 8 },
  ];

  for (const tbl of indianTableTokens) {
    const qrTokenHash = crypto.createHash('sha256').update(tbl.token).digest('hex');
    await prisma.restaurantTable.upsert({
      where: { qrTokenHash },
      update: { name: tbl.name, section: tbl.section, capacity: tbl.cap, isActive: true },
      create: {
        restaurantId: indianRestaurant.id,
        name: tbl.name,
        section: tbl.section,
        capacity: tbl.cap,
        qrTokenHash,
        qrVersion: 1,
        isActive: true,
      },
    });
  }

  // Indian Restaurant Ordering Settings
  await prisma.restaurantOrderingSettings.upsert({
    where: { restaurantId: indianRestaurant.id },
    update: {},
    create: {
      restaurantId: indianRestaurant.id,
      orderingEnabled: true,
      acceptsNewOrders: true,
      allowSpecialInstructions: true,
      paymentMode: 'PAY_AT_COUNTER',
      taxPercentage: 5.0,
      serviceChargePercentage: 0.0,
      maxActiveOrders: 50,
    },
  });

  const indianMenu = await prisma.menu.create({
    data: {
      restaurantId: indianRestaurant.id,
      title: 'All Day Dining & Chai',
      active: true,
    },
  });

  const catBrews = await prisma.menuCategory.create({
    data: { menuId: indianMenu.id, name: 'Signature Teas & Coolers', sortOrder: 1 },
  });
  const catSmallPlates = await prisma.menuCategory.create({
    data: { menuId: indianMenu.id, name: 'Small Plates & Chaats', sortOrder: 2 },
  });
  const catTandoor = await prisma.menuCategory.create({
    data: { menuId: indianMenu.id, name: 'Tandoor & Mains', sortOrder: 3 },
  });
  const catDesserts = await prisma.menuCategory.create({
    data: { menuId: indianMenu.id, name: 'Artisanal Desserts', sortOrder: 4 },
  });

  // Link canonical items & custom dishes
  const canonChai = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'masala chai' } });
  const canonPaneer = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'paneer tikka' } });
  const canonButterChicken = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'butter chicken' } });

  await prisma.restaurantMenuItem.createMany({
    data: [
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catBrews.id,
        canonicalId: canonChai?.id,
        customName: 'Adrak Elaichi Kulhad Chai',
        restaurantDescription: 'Slow-simmered Assam orthodox blend with freshly bruised ginger, green cardamom pods, and farm-fresh organic milk served in a fragrant clay kulhad.',
        priceMinor: 12000,
        currency: 'INR',
        portionSize: '200ml serving',
        ingredients: ['Assam Black Tea', 'Fresh Ginger', 'Cardamom', 'Whole Milk', 'Brown Sugar'],
        dietaryStatus: ['VEG', 'GLUTEN_FREE'],
        allergenVerification: { contains: ['Dairy'], freeOf: ['Gluten', 'Nuts', 'Soy'], unverified: [] },
        nutritionFields: { calories: 140, protein: 4, carbs: 18, fat: 5 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catBrews.id,
        customName: 'Kokum Jeera Sparkler',
        restaurantDescription: 'Sun-dried Malabar kokum extract infused with roasted cumin, pink rock salt, and effervescent soda.',
        priceMinor: 18000,
        currency: 'INR',
        portionSize: '300ml glass',
        ingredients: ['Kokum Extract', 'Roasted Cumin', 'Himalayan Pink Salt', 'Mint', 'Sparkling Water'],
        dietaryStatus: ['VEG', 'VEGAN', 'GLUTEN_FREE'],
        allergenVerification: { contains: [], freeOf: ['Dairy', 'Gluten', 'Nuts'], unverified: [] },
        nutritionFields: { calories: 65, protein: 0.5, carbs: 15, fat: 0 },
        nutritionSource: NutritionSource.RESTAURANT_PROVIDED,
        isAvailable: true,
        chefRecommended: false,
        isPopular: false,
        sortOrder: 2,
      },
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catSmallPlates.id,
        canonicalId: canonPaneer?.id,
        customName: 'Smoked Malai Paneer Tikka',
        restaurantDescription: 'Silken cubes of organic dairy cottage cheese basted with hung yogurt, yellow chili paste, and kasoori methi, charred over fragrant charcoal.',
        priceMinor: 38000,
        currency: 'INR',
        portionSize: '6 skewers (approx 240g)',
        ingredients: ['Organic Paneer', 'Hung Curd', 'Mustard Oil', 'Fenugreek Leaves', 'Bell Peppers', 'Mint Chutney'],
        dietaryStatus: ['VEG', 'GLUTEN_FREE'],
        allergenVerification: { contains: ['Dairy', 'Mustard'], freeOf: ['Gluten', 'Eggs', 'Peanuts'], unverified: ['Tree Nuts'] },
        nutritionFields: { calories: 320, protein: 18, carbs: 8, fat: 24 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catSmallPlates.id,
        customName: 'Tandoori Egg Bhurji Kebab Roll',
        restaurantDescription: 'Spiced farm-fresh egg scramble folded with caramelized onions, green chilies, and mint chutney wrapped in a flaky paratha.',
        priceMinor: 24000,
        currency: 'INR',
        portionSize: '1 large roll (approx 210g)',
        ingredients: ['Farm Eggs', 'Onions', 'Tomatoes', 'Green Chilies', 'Coriander', 'Wheat Paratha'],
        dietaryStatus: ['EGG'],
        allergenVerification: { contains: ['Eggs', 'Gluten'], freeOf: ['Peanuts'], unverified: [] },
        nutritionFields: { calories: 380, protein: 15, carbs: 32, fat: 19 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: false,
        isPopular: true,
        sortOrder: 2,
      },
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catTandoor.id,
        canonicalId: canonButterChicken?.id,
        customName: 'Old Delhi Velvet Butter Chicken',
        restaurantDescription: 'Boneless tender chicken thigh roasted in clay oven and folded into a rich strained tomato gravy finished with white butter and honey.',
        priceMinor: 52000,
        currency: 'INR',
        portionSize: 'Serves 2 (approx 380g)',
        ingredients: ['Tandoori Chicken', 'San Marzano Tomatoes', 'Churned White Butter', 'Cashew Paste', 'Kashmiri Chili', 'Honey'],
        dietaryStatus: ['NON_VEG', 'GLUTEN_FREE'],
        allergenVerification: { contains: ['Dairy', 'Cashews (Tree Nuts)'], freeOf: ['Gluten', 'Peanuts'], unverified: [] },
        nutritionFields: { calories: 490, protein: 32, carbs: 14, fat: 34 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catTandoor.id,
        customName: 'Jain Shahi Paneer Makhani',
        restaurantDescription: 'Pure vegetarian royal cottage cheese simmered in a velvety cashew and tomato gravy prepared strictly without onion, garlic, or root vegetables.',
        priceMinor: 48000,
        currency: 'INR',
        portionSize: 'Serves 2 (approx 350g)',
        ingredients: ['Fresh Paneer', 'Vine Tomatoes', 'Cashew Paste', 'Ghee', 'Saffron', 'Green Cardamom'],
        dietaryStatus: ['VEG', 'JAIN', 'GLUTEN_FREE'],
        allergenVerification: { contains: ['Dairy', 'Tree Nuts (Cashew)'], freeOf: ['Gluten', 'Eggs', 'Onion', 'Garlic'], unverified: [] },
        nutritionFields: { calories: 440, protein: 17, carbs: 12, fat: 36 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: false,
        isPopular: false,
        sortOrder: 2,
      },
      {
        restaurantId: indianRestaurant.id,
        menuId: indianMenu.id,
        categoryId: catDesserts.id,
        customName: 'Cardamom & Rosewater Shahi Tukda',
        restaurantDescription: 'Crispy ghee-toasted brioche steeped in saffron rabri, garnished with toasted silvered pistachios and edible rose petals.',
        priceMinor: 26000,
        currency: 'INR',
        portionSize: 'Single portion (160g)',
        ingredients: ['Brioche Bread', 'Desi Ghee', 'Reduced Milk (Rabri)', 'Kashmiri Saffron', 'Pistachios', 'Rosewater'],
        dietaryStatus: ['VEG'],
        allergenVerification: { contains: ['Gluten', 'Dairy', 'Tree Nuts (Pistachio)'], freeOf: ['Peanuts', 'Eggs'], unverified: [] },
        nutritionFields: { calories: 390, protein: 7, carbs: 54, fat: 16 },
        nutritionSource: NutritionSource.AI_ESTIMATED,
        isAvailable: true,
        chefRecommended: false,
        isPopular: false,
        sortOrder: 1,
      },
    ],
  });
  console.log('✅ Chai & Chutney (India) restaurant seeded.');

  // 5. Seed US Bistro: "The Gilded Fork Café & Bistro"
  const elenaUser = await prisma.user.upsert({
    where: { email: 'elena@gildedbistro.com' },
    update: {},
    create: {
      email: 'elena@gildedbistro.com',
      name: 'Elena Vance',
      phone: '+14155552671',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const usOrg = await prisma.organization.create({
    data: {
      name: 'Gilded Hospitality Partners',
      ownerUserId: elenaUser.id,
      billingCountry: 'US',
      billingCurrency: 'USD',
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: elenaUser.id,
      organizationId: usOrg.id,
      role: 'OWNER',
    },
  });

  await prisma.subscription.create({
    data: {
      organizationId: usOrg.id,
      provider: 'RAZORPAY',
      planKey: 'US_GROWTH',
      providerSubscriptionId: 'sub_test_us_growth_01',
      providerCustomerId: 'cust_us_elena_01',
      status: 'ACTIVE',
      currency: 'USD',
      billingPeriod: 'MONTHLY',
      paidThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const usRestaurant = await prisma.restaurant.create({
    data: {
      organizationId: usOrg.id,
      slug: 'the-gilded-fork',
      displayName: 'The Gilded Fork Café & Bistro',
      description: 'Artisanal espresso, fresh-baked morning pastries, and Northern California seasonal comfort plates in Presidio Heights.',
      country: 'US',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      address: '3245 Sacramento St, San Francisco, CA 94115',
      phone: '+1 (415) 555-8930',
      email: 'concierge@gildedbistro.com',
      logoUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
      publicationState: PublicationState.PUBLISHED,
      isClaimed: true,
    },
  });

  await prisma.restaurantSettings.create({
    data: {
      restaurantId: usRestaurant.id,
      welcomeMessage: 'Welcome to The Gilded Fork! Ask our digital sommelier for wine pairings, gluten-free options, or daily specials.',
      aiTone: 'refined, polite, relaxed Northern California hospitality style',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 25,
    },
  });

  await prisma.restaurantTheme.create({
    data: {
      restaurantId: usRestaurant.id,
      presetKey: ThemePreset.BOTANICAL_CAFE,
      backgroundColor: '#F2F4EA',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#263C30',
      secondaryTextColor: '#5A6E60',
      accentColor: '#77916F',
      secondaryAccentColor: '#B86D52',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
      layoutMode: LayoutMode.GRID,
      cardRadius: '18px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'paper',
      isPublished: true,
    },
  });

  const usMenu = await prisma.menu.create({
    data: {
      restaurantId: usRestaurant.id,
      title: 'Bistro & Patio Menu',
      active: true,
    },
  });

  const usCatCoffee = await prisma.menuCategory.create({
    data: { menuId: usMenu.id, name: 'Specialty Coffee & Beverages', sortOrder: 1 },
  });
  const usCatMains = await prisma.menuCategory.create({
    data: { menuId: usMenu.id, name: 'Handcrafted Mains', sortOrder: 2 },
  });
  const usCatPastry = await prisma.menuCategory.create({
    data: { menuId: usMenu.id, name: 'Desserts & Sweets', sortOrder: 3 },
  });

  const canonFlatWhite = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'flat white' } });
  const canonPasta = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'truffle mushroom pasta' } });
  const canonAvoToast = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'avocado sourdough toast' } });
  const canonTiramisu = await prisma.canonicalDish.findUnique({ where: { normalizedName: 'tiramisu' } });

  await prisma.restaurantMenuItem.createMany({
    data: [
      {
        restaurantId: usRestaurant.id,
        menuId: usMenu.id,
        categoryId: usCatCoffee.id,
        canonicalId: canonFlatWhite?.id,
        customName: 'Oat Milk Golden Flat White',
        restaurantDescription: 'Double shot of Ethiopian Yirgacheffe espresso with velvety steamed Minor Figures oat milk and a sprinkle of raw vanilla bean.',
        priceMinor: 650,
        currency: 'USD',
        portionSize: '8 oz cup',
        ingredients: ['Espresso', 'Oat Milk', 'Madagascar Vanilla Bean'],
        dietaryStatus: ['VEGAN', 'DAIRY_FREE'],
        allergenVerification: { contains: ['Oats'], freeOf: ['Dairy', 'Nuts', 'Soy'], unverified: [] },
        nutritionFields: { calories: 125, protein: 3, carbs: 16, fat: 4.5 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        restaurantId: usRestaurant.id,
        menuId: usMenu.id,
        categoryId: usCatMains.id,
        canonicalId: canonPasta?.id,
        customName: 'Black Truffle Tagliatelle',
        restaurantDescription: 'House-extruded egg tagliatelle, sautéed chanterelle and hedgehog mushrooms, cultured French butter, and shaved Umbrian winter black truffles.',
        priceMinor: 2800,
        currency: 'USD',
        portionSize: 'Main entrée (290g)',
        ingredients: ['Fresh Tagliatelle', 'Chanterelle Mushrooms', 'Black Truffle Butter', '24-Month Parmigiano-Reggiano', 'Maldon Sea Salt'],
        dietaryStatus: ['VEGETARIAN'],
        allergenVerification: { contains: ['Gluten', 'Eggs', 'Dairy'], freeOf: ['Peanuts', 'Fish'], unverified: [] },
        nutritionFields: { calories: 540, protein: 16, carbs: 64, fat: 24 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: true,
        isPopular: true,
        sortOrder: 1,
      },
      {
        restaurantId: usRestaurant.id,
        menuId: usMenu.id,
        categoryId: usCatMains.id,
        canonicalId: canonAvoToast?.id,
        customName: 'Citrus Smashed Avocado Tartine',
        restaurantDescription: 'Tartine Bakery sesame country loaf, Hass avocado tossed with Meyer lemon juice, pickled shallots, Persian feta, and Aleppo chili flakes.',
        priceMinor: 1700,
        currency: 'USD',
        portionSize: '2 large slices',
        ingredients: ['Country Sourdough Bread', 'Hass Avocado', 'Sheep Milk Feta', 'Meyer Lemon', 'Pickled Shallots', 'Aleppo Pepper'],
        dietaryStatus: ['VEGETARIAN', 'GLUTEN_FREE'],
        allergenVerification: { contains: ['Gluten', 'Dairy', 'Sesame'], freeOf: ['Peanuts', 'Tree Nuts', 'Eggs'], unverified: [] },
        nutritionFields: { calories: 390, protein: 11, carbs: 42, fat: 21 },
        nutritionSource: NutritionSource.RESTAURANT_VERIFIED,
        isAvailable: true,
        chefRecommended: false,
        isPopular: false,
        sortOrder: 2,
      },
      {
        restaurantId: usRestaurant.id,
        menuId: usMenu.id,
        categoryId: usCatPastry.id,
        canonicalId: canonTiramisu?.id,
        customName: 'Espresso Cocoa Tiramisu Tartlet',
        restaurantDescription: 'Individual tartlet with crisp almond sable crust, house cold-brew soaked ladyfingers, whipped mascarpone sabayon, and Valrhona dark cocoa.',
        priceMinor: 1100,
        currency: 'USD',
        portionSize: '1 tartlet (140g)',
        ingredients: ['Mascarpone Cheese', 'Espresso', 'Egg Yolks', 'Sugar', 'Ladyfingers', 'Almond Flour', 'Valrhona Cocoa'],
        dietaryStatus: ['VEGETARIAN'],
        allergenVerification: { contains: ['Gluten', 'Dairy', 'Eggs', 'Tree Nuts (Almond)'], freeOf: ['Peanuts'], unverified: [] },
        nutritionFields: { calories: 360, protein: 6, carbs: 38, fat: 20 },
        nutritionSource: NutritionSource.AI_ESTIMATED,
        isAvailable: true,
        chefRecommended: true,
        isPopular: true,
        sortOrder: 1,
      },
    ],
  });
  console.log('✅ The Gilded Fork (US) bistro seeded.');

  // US Tables (Table 01 to Table 04)
  const usTableTokens = [
    { name: 'Table 01', token: 'us_tbl_token_01', section: 'Dining Room', cap: 2 },
    { name: 'Table 02', token: 'us_tbl_token_02', section: 'Dining Room', cap: 4 },
    { name: 'Table 03', token: 'us_tbl_token_03', section: 'Patio', cap: 4 },
    { name: 'Table 04', token: 'us_tbl_token_04', section: 'Patio', cap: 6 },
  ];

  for (const tbl of usTableTokens) {
    const qrTokenHash = crypto.createHash('sha256').update(tbl.token).digest('hex');
    await prisma.restaurantTable.upsert({
      where: { qrTokenHash },
      update: { name: tbl.name, section: tbl.section, capacity: tbl.cap, isActive: true },
      create: {
        restaurantId: usRestaurant.id,
        name: tbl.name,
        section: tbl.section,
        capacity: tbl.cap,
        qrTokenHash,
        qrVersion: 1,
        isActive: true,
      },
    });
  }

  // US Restaurant Ordering Settings
  await prisma.restaurantOrderingSettings.upsert({
    where: { restaurantId: usRestaurant.id },
    update: {},
    create: {
      restaurantId: usRestaurant.id,
      orderingEnabled: true,
      acceptsNewOrders: true,
      allowSpecialInstructions: true,
      paymentMode: 'PAY_AT_COUNTER',
      taxPercentage: 8.5,
      serviceChargePercentage: 4.0,
      maxActiveOrders: 30,
    },
  });

  // Seed Staff Accounts
  const staffHash = hashStaffPassword('dishora2026!');

  await prisma.restaurantStaff.upsert({
    where: { loginId: 'manager-chai' },
    update: { passwordHash: staffHash, isActive: true },
    create: {
      restaurantId: indianRestaurant.id,
      displayName: 'Vikram Mehta (Floor Manager)',
      loginId: 'manager-chai',
      passwordHash: staffHash,
      role: 'MANAGER',
      isActive: true,
    },
  });

  await prisma.restaurantStaff.upsert({
    where: { loginId: 'kitchen-chai' },
    update: { passwordHash: staffHash, isActive: true },
    create: {
      restaurantId: indianRestaurant.id,
      displayName: 'Chef Ramesh (Head Chef)',
      loginId: 'kitchen-chai',
      passwordHash: staffHash,
      role: 'KITCHEN',
      isActive: true,
    },
  });

  await prisma.restaurantStaff.upsert({
    where: { loginId: 'waiter-chai' },
    update: { passwordHash: staffHash, isActive: true },
    create: {
      restaurantId: indianRestaurant.id,
      displayName: 'Anil Kumar (Lead Server)',
      loginId: 'waiter-chai',
      passwordHash: staffHash,
      role: 'WAITER',
      isActive: true,
    },
  });

  await prisma.restaurantStaff.upsert({
    where: { loginId: 'kitchen-gilded' },
    update: { passwordHash: staffHash, isActive: true },
    create: {
      restaurantId: usRestaurant.id,
      displayName: 'Chef Julien (Executive Chef)',
      loginId: 'kitchen-gilded',
      passwordHash: staffHash,
      role: 'KITCHEN',
      isActive: true,
    },
  });

  // Seed Dish Modifiers
  const chaiItem = await prisma.restaurantMenuItem.findFirst({
    where: { restaurantId: indianRestaurant.id, customName: { contains: 'Chai' } },
  });
  if (chaiItem) {
    const sizeGroup = await prisma.menuModifierGroup.create({
      data: {
        restaurantMenuItemId: chaiItem.id,
        name: 'Cup Size',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 1,
      },
    });
    await prisma.menuModifierOption.createMany({
      data: [
        { modifierGroupId: sizeGroup.id, name: 'Clay Kulhad (Standard)', priceMinor: 0, sortOrder: 1 },
        { modifierGroupId: sizeGroup.id, name: 'Sharing Pot (Serves 2)', priceMinor: 12000, sortOrder: 2 },
      ],
    });

    const milkGroup = await prisma.menuModifierGroup.create({
      data: {
        restaurantMenuItemId: chaiItem.id,
        name: 'Milk Preference',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: 2,
      },
    });
    await prisma.menuModifierOption.createMany({
      data: [
        { modifierGroupId: milkGroup.id, name: 'A2 Farm Cow Milk', priceMinor: 0, sortOrder: 1 },
        { modifierGroupId: milkGroup.id, name: 'Oat Milk', priceMinor: 5000, sortOrder: 2 },
      ],
    });
  }

  const coffeeItem = await prisma.restaurantMenuItem.findFirst({
    where: { restaurantId: usRestaurant.id, customName: { contains: 'Flat White' } },
  });
  if (coffeeItem) {
    const milkGroup = await prisma.menuModifierGroup.create({
      data: {
        restaurantMenuItemId: coffeeItem.id,
        name: 'Milk Preference',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: 1,
      },
    });
    await prisma.menuModifierOption.createMany({
      data: [
        { modifierGroupId: milkGroup.id, name: 'Minor Figures Oat Milk', priceMinor: 0, sortOrder: 1 },
        { modifierGroupId: milkGroup.id, name: 'House Almond Milk', priceMinor: 75, sortOrder: 2 },
        { modifierGroupId: milkGroup.id, name: 'Organic Whole Milk', priceMinor: 0, sortOrder: 3 },
      ],
    });

    const extraGroup = await prisma.menuModifierGroup.create({
      data: {
        restaurantMenuItemId: coffeeItem.id,
        name: 'Add-ons',
        required: false,
        minSelections: 0,
        maxSelections: 2,
        sortOrder: 2,
      },
    });
    await prisma.menuModifierOption.createMany({
      data: [
        { modifierGroupId: extraGroup.id, name: 'Extra Espresso Shot', priceMinor: 150, sortOrder: 1 },
        { modifierGroupId: extraGroup.id, name: 'Vanilla Bean Syrup', priceMinor: 75, sortOrder: 2 },
      ],
    });
  }

  // 6. Seed Founder Demo Menu ready for Claim Workflow: "Bakehouse 72 Artisan Bakery"
  const demoRestaurant = await prisma.restaurant.create({
    data: {
      slug: 'bakehouse-72-demo',
      displayName: 'Bakehouse 72 Artisan Bakery',
      description: 'Handcrafted sourdoughs, laminated croissants, and single-origin pour-overs.',
      country: 'IN',
      city: 'Mumbai',
      currency: 'INR',
      publicationState: PublicationState.PUBLISHED,
      isClaimed: false, // Unclaimed demo!
    },
  });

  await prisma.restaurantTheme.create({
    data: {
      restaurantId: demoRestaurant.id,
      presetKey: ThemePreset.PASTEL_PATISSERIE,
      backgroundColor: '#FFF4F2',
      surfaceColor: '#FFFFFF',
      primaryTextColor: '#573641',
      secondaryTextColor: '#8C6774',
      accentColor: '#D98A9B',
      secondaryAccentColor: '#70816B',
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

  const demoMenu = await prisma.menu.create({
    data: {
      restaurantId: demoRestaurant.id,
      title: 'Bakery Counter',
      active: true,
    },
  });

  const demoCat = await prisma.menuCategory.create({
    data: { menuId: demoMenu.id, name: 'Fresh Morning Bakes', sortOrder: 1 },
  });

  await prisma.restaurantMenuItem.create({
    data: {
      restaurantId: demoRestaurant.id,
      menuId: demoMenu.id,
      categoryId: demoCat.id,
      customName: 'Almond Frangipane Twice-Baked Croissant',
      restaurantDescription: 'Flaky artisanal butter croissant soaked in orange blossom syrup, filled with rich almond cream and topped with toasted sliced almonds.',
      priceMinor: 24000,
      currency: 'INR',
      portionSize: '1 piece (130g)',
      ingredients: ['Flour', 'French Butter', 'Almond Flour', 'Eggs', 'Orange Blossom Water'],
      dietaryStatus: ['VEGETARIAN'],
      allergenVerification: { contains: ['Gluten', 'Dairy', 'Eggs', 'Tree Nuts (Almond)'], freeOf: ['Peanuts'], unverified: [] },
      nutritionFields: { calories: 420, protein: 8, carbs: 46, fat: 22 },
      nutritionSource: NutritionSource.AI_ESTIMATED,
      isAvailable: true,
      chefRecommended: true,
    },
  });

  // Create Claim Token for founder demo
  const rawClaimToken = 'demo-claim-bakehouse72-secret2026';
  const claimTokenHash = crypto.createHash('sha256').update(rawClaimToken).digest('hex');

  await prisma.claimRequest.create({
    data: {
      restaurantId: demoRestaurant.id,
      claimTokenHash,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      verificationNotes: 'Founder created demo menu from public Instagram/Zomato menu with permission.',
    },
  });

  console.log(`✅ Founder demo restaurant seeded: /m/bakehouse-72-demo (Claim Token: ${rawClaimToken})`);
  console.log('🎉 Menzy database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
