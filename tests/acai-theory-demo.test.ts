import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { seedAcaiTheoryDemo, ACAI_THEORY_SLUG } from '../scripts/seed-acai-theory';
import { getCache } from '../src/lib/cache/redis';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';
import { resolveLandingHeroMedia } from '../src/lib/banner/banner-validation';
import { generateThemeVariables, pickContrastForeground } from '../src/lib/theme/theme-presets';
import { formatCurrencyMinor } from '../src/lib/payments/plans';

describe('Açaí Theory Demo Restaurant Seed & Menu Experience', () => {
  beforeAll(async () => {
    // Run seed to ensure environment has fresh seed
    await seedAcaiTheoryDemo();
  });

  it('seeds the demo restaurant with correct attributes, unclaimed demo status, and tenant isolation', async () => {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: ACAI_THEORY_SLUG },
      include: {
        theme: true,
        settings: true,
        orderingSettings: true,
        tables: true,
        claimRequests: true,
      },
    });

    expect(restaurant).toBeDefined();
    expect(restaurant?.displayName).toBe('Açaí Theory');
    expect(restaurant?.country).toBe('IN');
    expect(restaurant?.city).toBe('Bengaluru');
    expect(restaurant?.currency).toBe('INR');
    expect(restaurant?.description).toBe(
      'Colourful açaí bowls, refreshing smoothies, and fresh savoury snacks.'
    );
    expect(restaurant?.isClaimed).toBe(false);
    expect(restaurant?.organizationId).toBeNull(); // Tenant isolated, unclaimed founder demo

    // Theme matches brand specifications
    expect(restaurant?.theme?.accentColor).toBe('#580284');
    expect(restaurant?.theme?.backgroundColor).toBe('#FFFFFF');
    expect(restaurant?.theme?.surfaceColor).toBe('#F5F5F5');
    expect(restaurant?.theme?.primaryTextColor).toBe('#08070F');
    expect(restaurant?.theme?.secondaryAccentColor).toBe('#FC9020');
    expect(restaurant?.theme?.cardRadius).toBe('20px');
    expect(restaurant?.theme?.buttonStyle).toBe('pill');
    expect(restaurant?.theme?.imageProportions).toBe('square');

    // Grounded AI Waiter settings
    expect(restaurant?.settings?.welcomeMessage).toContain(
      'Demo menu — prices and availability subject to confirmation.'
    );
    expect(restaurant?.settings?.allowDinerChat).toBe(true);

    // Sample orders restricted to counter payment in demo
    expect(restaurant?.orderingSettings?.paymentMode).toBe('PAY_AT_COUNTER');
  });

  it('seeds exactly 6 categories in order with exactly 23 items', async () => {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: ACAI_THEORY_SLUG },
      include: {
        menus: {
          include: {
            categories: {
              orderBy: { sortOrder: 'asc' },
              include: {
                items: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const menu = restaurant?.menus[0];
    expect(menu).toBeDefined();
    expect(menu?.categories).toHaveLength(6);

    const categoryNames = menu?.categories.map((c) => c.name);
    expect(categoryNames).toEqual([
      'Açaí Bowls',
      'Summer Bowls',
      'Overnight Oats',
      'Smoothies & Blends',
      'Super Snacks',
      'Water',
    ]);

    const allItems = menu?.categories.flatMap((c) => c.items) || [];
    expect(allItems).toHaveLength(23);

    // Verify Açaí Bowls category items and first three items constraint
    const acaiCategory = menu?.categories.find((c) => c.name === 'Açaí Bowls');
    expect(acaiCategory?.items).toHaveLength(6);
    expect(acaiCategory?.items[0].customName).toBe('OG Açaí Bowl');
    expect(acaiCategory?.items[0].priceMinor).toBe(29900);
    expect(acaiCategory?.items[1].customName).toBe('Mango Açaí Bowl');
    expect(acaiCategory?.items[1].priceMinor).toBe(24900);
    expect(acaiCategory?.items[2].customName).toBe('Dark Chocolate Açaí Bowl');
    expect(acaiCategory?.items[2].priceMinor).toBe(24900);
    expect(acaiCategory?.items[3].customName).toBe('Lychee Açaí Bowl');
    expect(acaiCategory?.items[3].priceMinor).toBe(24900);
    expect(acaiCategory?.items[4].customName).toBe('Coffee Açaí Bowl');
    expect(acaiCategory?.items[4].priceMinor).toBe(24900);
    expect(acaiCategory?.items[5].customName).toBe('Matcha Açaí Bowl');
    expect(acaiCategory?.items[5].priceMinor).toBe(29900);

    // Verify Summer Bowls
    const summerCategory = menu?.categories.find((c) => c.name === 'Summer Bowls');
    expect(summerCategory?.items).toHaveLength(1);
    expect(summerCategory?.items[0].customName).toBe('Mango Dark Chocolate Bowl');
    expect(summerCategory?.items[0].priceMinor).toBe(24900);

    // Verify Overnight Oats
    const oatsCategory = menu?.categories.find((c) => c.name === 'Overnight Oats');
    expect(oatsCategory?.items).toHaveLength(4);
    expect(oatsCategory?.items.map((i) => ({ name: i.customName, priceMinor: i.priceMinor }))).toEqual([
      { name: 'Açaí Oats Bowl', priceMinor: 19900 },
      { name: 'Mango Oats Bowl', priceMinor: 19900 },
      { name: 'Strawberry Matcha Oats Bowl', priceMinor: 19900 },
      { name: 'Tiramisu Oats Bowl', priceMinor: 19900 },
    ]);

    // Verify Smoothies & Blends
    const smoothiesCategory = menu?.categories.find((c) => c.name === 'Smoothies & Blends');
    expect(smoothiesCategory?.items).toHaveLength(7);
    expect(smoothiesCategory?.items.map((i) => ({ name: i.customName, priceMinor: i.priceMinor }))).toEqual([
      { name: 'OG Mango Smoothie', priceMinor: 22900 },
      { name: 'Dark Matter Smoothie', priceMinor: 22900 },
      { name: 'NO CAP Cold Coffee', priceMinor: 22900 },
      { name: 'Almond Aura Smoothie', priceMinor: 29900 },
      { name: 'Matcha Strawberry Blend', priceMinor: 27900 },
      { name: 'Spicy Pineapple Mango Smoothie', priceMinor: 27900 },
      { name: 'Strawberry Bliss Smoothie', priceMinor: 27900 },
    ]);

    // Verify Super Snacks
    const snacksCategory = menu?.categories.find((c) => c.name === 'Super Snacks');
    expect(snacksCategory?.items).toHaveLength(4);
    expect(snacksCategory?.items.map((i) => ({ name: i.customName, priceMinor: i.priceMinor }))).toEqual([
      { name: 'Foxnut Chaat', priceMinor: 19900 },
      { name: 'Green Hummus', priceMinor: 19900 },
      { name: 'Watermelon Feta Sandwich', priceMinor: 19900 },
      { name: 'Avocado Feta Toast', priceMinor: 27900 },
    ]);

    // Verify Water
    const waterCategory = menu?.categories.find((c) => c.name === 'Water');
    expect(waterCategory?.items).toHaveLength(1);
    expect(waterCategory?.items[0].customName).toBe('Water Bottle, 500 ml');
    expect(waterCategory?.items[0].priceMinor).toBe(2900);
  });

  it('strictly adheres to data accuracy constraints (no invented allergens, macros, bestseller labels)', async () => {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: ACAI_THEORY_SLUG },
      include: {
        menuItems: true,
      },
    });

    const items = restaurant?.menuItems || [];
    expect(items.length).toBe(23);

    for (const item of items) {
      expect(item.portionSize).toBeNull();
      expect(item.nutritionFields).toBeNull();
      expect(item.nutritionSource).toBe('NOT_PROVIDED');
      expect(item.dietaryStatus).toBeNull();
      expect(item.allergenVerification).toBeNull();
      expect(item.ingredients).toBeNull();
      expect(item.chefRecommended).toBe(false);
      expect(item.isPopular).toBe(false);
      expect(item.currency).toBe('INR');
      expect(item.isAvailable).toBe(true);
      expect(item.isPublished).toBe(true);
    }

    // Must NOT have unverified dish
    const unverifiedDish = items.find((i) =>
      i.customName.toLowerCase().includes('raw papaya')
    );
    expect(unverifiedDish).toBeUndefined();

    // Must NOT have generic Fresh Smoothies product
    const genericSmoothie = items.find((i) =>
      i.customName.toLowerCase() === 'fresh smoothies'
    );
    expect(genericSmoothie).toBeUndefined();
  });

  it('formats rupee currency cleanly and generates high contrast theme CSS variables', async () => {
    // Rupee formatting test
    expect(formatCurrencyMinor(29900, 'INR')).toBe('₹299');
    expect(formatCurrencyMinor(24900, 'INR')).toBe('₹249');
    expect(formatCurrencyMinor(19900, 'INR')).toBe('₹199');
    expect(formatCurrencyMinor(2900, 'INR')).toBe('₹29');

    // Theme accessibility test
    const themeVars = generateThemeVariables({
      presetKey: 'CUSTOM',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F5F5F5',
      primaryTextColor: '#08070F',
      secondaryTextColor: '#524C5A',
      accentColor: '#580284',
      secondaryAccentColor: '#FC9020',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: 'GRID',
      cardRadius: '20px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'none',
    }) as Record<string, string>;

    expect(themeVars['--dishora-accent']).toBe('#580284');
    expect(themeVars['--dishora-bg']).toBe('#FFFFFF');
    expect(themeVars['--dishora-surface']).toBe('#F5F5F5');
    expect(themeVars['--dishora-text']).toBe('#08070F');
    // Button ink contrast over deep purple must be crisp white
    expect(themeVars['--dishora-accent-fg']).toBe('#FFFFFF');
    expect(pickContrastForeground('#580284')).toBe('#FFFFFF');
  });

  it('loads through diner menu payload service with demo flags and fallback aliasing', async () => {
    const resultDemo = await loadDinerMenuPayload(ACAI_THEORY_SLUG);
    expect(resultDemo.status).toBe('OK');
    if (resultDemo.status === 'OK') {
      expect(resultDemo.data.restaurant.displayName).toBe('Açaí Theory');
      expect(resultDemo.data.restaurant.isClaimed).toBe(false);
      expect(resultDemo.data.restaurant.currency).toBe('INR');
      expect(resultDemo.data.menus[0].categories).toHaveLength(6);
    }

    // Direct alias check: /m/acai-theory resolves gracefully to acai-theory-demo
    const resultAlias = await loadDinerMenuPayload('acai-theory');
    expect(resultAlias.status).toBe('OK');
    if (resultAlias.status === 'OK') {
      expect(resultAlias.data.restaurant.displayName).toBe('Açaí Theory');
      expect(resultAlias.data.restaurant.isClaimed).toBe(false);
    }
  });

  it('reruns the seed idempotently without creating duplicate restaurants, categories, or items', async () => {
    // Rerun seed once
    await seedAcaiTheoryDemo();

    const restaurantsCount = await prisma.restaurant.count({
      where: { slug: ACAI_THEORY_SLUG },
    });
    expect(restaurantsCount).toBe(1);

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: ACAI_THEORY_SLUG },
      include: {
        menus: {
          include: {
            categories: {
              include: { items: true },
            },
          },
        },
      },
    });

    expect(restaurant?.menus).toHaveLength(1);
    expect(restaurant?.menus[0].categories).toHaveLength(6);
    const totalItems = restaurant?.menus[0].categories.flatMap((c) => c.items) || [];
    expect(totalItems).toHaveLength(23);

    // Rerun seed again
    await seedAcaiTheoryDemo();

    const restaurantsCountThirdRun = await prisma.restaurant.count({
      where: { slug: ACAI_THEORY_SLUG },
    });
    expect(restaurantsCountThirdRun).toBe(1);

    const categoriesCountThirdRun = await prisma.menuCategory.count({
      where: { menuId: restaurant!.menus[0].id },
    });
    expect(categoriesCountThirdRun).toBe(6);

    const itemsCountThirdRun = await prisma.restaurantMenuItem.count({
      where: { restaurantId: restaurant!.id },
    });
    expect(itemsCountThirdRun).toBe(23);
  });

  it('allows owner to customize restaurant logo and disable its view on the diner menu', async () => {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: ACAI_THEORY_SLUG },
      include: { orderingSettings: true },
    });
    expect(restaurant).toBeDefined();
    expect(restaurant?.logoUrl).toBe('/images/acai-theory-logo.png');

    // 1. Initial diner menu payload has showLogo true and logoUrl present
    const initialPayload = await loadDinerMenuPayload(ACAI_THEORY_SLUG);
    expect(initialPayload.status).toBe('OK');
    if (initialPayload.status === 'OK') {
      expect(initialPayload.data.restaurant.logoUrl).toBe('/images/acai-theory-logo.png');
      expect(initialPayload.data.restaurant.showLogo).toBe(true);
      expect(initialPayload.data.showLogo).toBe(true);

      const heroMedia = resolveLandingHeroMedia({
        coverUrl: initialPayload.data.restaurant.coverUrl,
        logoUrl: initialPayload.data.restaurant.logoUrl,
        showLogo: initialPayload.data.restaurant.showLogo,
      });
      expect(heroMedia.logoUrl).toBe('/images/acai-theory-logo.png');
    }

    // 2. Owner disables logo view on the menu (showLogo: false)
    await prisma.restaurantOrderingSettings.update({
      where: { restaurantId: restaurant!.id },
      data: {
        notificationSettings: {
          demoNotice: 'Demo menu — prices and availability subject to confirmation.',
          showLogo: false,
        },
      },
    });
    await getCache().del(`menu:slug:${ACAI_THEORY_SLUG}`);

    // 3. Diner menu payload reflects showLogo: false
    const disabledPayload = await loadDinerMenuPayload(ACAI_THEORY_SLUG);
    expect(disabledPayload.status).toBe('OK');
    if (disabledPayload.status === 'OK') {
      expect(disabledPayload.data.restaurant.showLogo).toBe(false);
      expect(disabledPayload.data.showLogo).toBe(false);

      const heroMediaDisabled = resolveLandingHeroMedia({
        coverUrl: disabledPayload.data.restaurant.coverUrl,
        logoUrl: disabledPayload.data.restaurant.logoUrl,
        showLogo: disabledPayload.data.restaurant.showLogo,
      });
      // When logo view is disabled on the menu, resolveLandingHeroMedia returns null
      expect(heroMediaDisabled.logoUrl).toBeNull();
    }

    // 4. Owner customizes logo to a new custom URL and re-enables logo view
    await prisma.restaurant.update({
      where: { id: restaurant!.id },
      data: { logoUrl: 'https://example.com/custom-acai-insignia.png' },
    });
    await prisma.restaurantOrderingSettings.update({
      where: { restaurantId: restaurant!.id },
      data: {
        notificationSettings: {
          demoNotice: 'Demo menu — prices and availability subject to confirmation.',
          showLogo: true,
        },
      },
    });
    await getCache().del(`menu:slug:${ACAI_THEORY_SLUG}`);

    const updatedPayload = await loadDinerMenuPayload(ACAI_THEORY_SLUG);
    expect(updatedPayload.status).toBe('OK');
    if (updatedPayload.status === 'OK') {
      expect(updatedPayload.data.restaurant.logoUrl).toBe(
        'https://example.com/custom-acai-insignia.png'
      );
      expect(updatedPayload.data.restaurant.showLogo).toBe(true);

      const heroMediaUpdated = resolveLandingHeroMedia({
        coverUrl: updatedPayload.data.restaurant.coverUrl,
        logoUrl: updatedPayload.data.restaurant.logoUrl,
        showLogo: updatedPayload.data.restaurant.showLogo,
      });
      expect(heroMediaUpdated.logoUrl).toBe('https://example.com/custom-acai-insignia.png');
    }

    // Restore original seed values for clean state
    await seedAcaiTheoryDemo();
  });
});
