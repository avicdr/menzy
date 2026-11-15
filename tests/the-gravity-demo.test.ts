import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import prisma from '../src/lib/db/prisma';
import { loadDinerMenuPayload } from '../src/lib/diner/diner-menu-loader';
import {
  THE_GRAVITY_SLUG,
  THE_GRAVITY_ALIAS_SLUG,
  THE_GRAVITY_CLAIM_TOKEN,
  seedTheGravityDemo,
} from '../scripts/seed-the-gravity';

describe('The Gravity Demo Restaurant', () => {
  it('seeds The Gravity idempotently with claimable status and dark aesthetic theme', async () => {
    // Run seed
    await seedTheGravityDemo();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: THE_GRAVITY_SLUG },
      include: {
        theme: true,
        settings: true,
        tables: true,
      },
    });

    expect(restaurant, 'The Gravity restaurant must exist in database').toBeDefined();
    expect(restaurant?.displayName).toBe('The Gravity');
    expect(restaurant?.isClaimed).toBe(false);
    expect(restaurant?.coverUrl).toBe('/images/the-gravity-banner.webp');

    // Rich Dark Aesthetic Theme
    expect(restaurant?.theme?.presetKey).toBe('CUSTOM');
    expect(restaurant?.theme?.backgroundColor).toBe('#12100E');
    expect(restaurant?.theme?.surfaceColor).toBe('#1C1713');
    expect(restaurant?.theme?.primaryTextColor).toBe('#FAF7F2');
    expect(restaurant?.theme?.accentColor).toBe('#D4883A');
    expect(restaurant?.theme?.headingFont).toBe('Playfair Display');

    // Claim Request verification
    const claimTokenHash = crypto
      .createHash('sha256')
      .update(THE_GRAVITY_CLAIM_TOKEN)
      .digest('hex');
    const claim = await prisma.claimRequest.findUnique({
      where: { claimTokenHash },
    });
    expect(claim, 'Claim request must exist').toBeDefined();
    expect(claim?.restaurantId).toBe(restaurant?.id);
    expect(claim?.status).toBe('UNCLAIMED');
  });

  it('loads diner menu via both primary slug and alias slug with all 25 dishes', async () => {
    const primaryResult = await loadDinerMenuPayload(THE_GRAVITY_SLUG);
    const aliasResult = await loadDinerMenuPayload(THE_GRAVITY_ALIAS_SLUG);

    expect(primaryResult.status).toBe('OK');
    expect(aliasResult.status).toBe('OK');

    if (primaryResult.status !== 'OK' || aliasResult.status !== 'OK') return;

    expect(primaryResult.data.restaurant.displayName).toBe('The Gravity');
    expect(aliasResult.data.restaurant.displayName).toBe('The Gravity');
    expect(primaryResult.data.restaurant.isClaimed).toBe(false);
    expect(primaryResult.data.restaurant.coverUrl).toBe('/images/the-gravity-banner.webp');

    // Check categories and items
    const menu = primaryResult.data.menus[0];
    expect(menu).toBeDefined();

    const categories = menu.categories;
    expect(categories.length).toBe(15);

    const allDishes = categories.flatMap((c: any) => c.items);
    expect(allDishes.length).toBe(25);

    // Verify key dishes from user prompt
    const expectedDishes = [
      { name: 'Paneer Shashlik Steak', category: 'Sizzlers', priceMinor: 35000 },
      { name: 'Chilli Chicken Sizzler (Noodle/Rice)', category: 'Sizzlers', priceMinor: 35000 },
      { name: 'Honey Chilli Potato', category: 'Chinese Starters', priceMinor: 24000 },
      { name: 'Dragon Chicken', category: 'Chinese Starters', priceMinor: 31000 },
      { name: 'Paneer Tikka Pizza', category: 'Pizza', priceMinor: 30000 },
      { name: 'Cheese Garlic Bread', category: 'Gravity Garlic Breads', priceMinor: 16000 },
      { name: 'Paneer Tikka Burger', category: 'Burger', priceMinor: 18000 },
      { name: 'Butter Chicken', category: 'Non-Veg Main Course', priceMinor: 34000 },
      { name: 'Gravity Malai Kofta', category: 'Kofta', priceMinor: 29000 },
      { name: 'Dal Makhani', category: 'Dal', priceMinor: 24000 },
      { name: 'Chicken Tikka Biryani', category: 'Boneless', priceMinor: 54000 },
      { name: 'Masala Dosa', category: 'South Indian', priceMinor: 15000 },
      { name: 'Oreo Shake', category: 'Shakes', priceMinor: 21000 },
      { name: 'Mango Shake', category: 'Shakes', priceMinor: 19000 },
      { name: 'Brownie Frappe', category: 'Beverages', priceMinor: 22500 },
      { name: 'Cappuccino', category: 'Beverages', priceMinor: 14500 },
      { name: 'Blue Ocean', category: 'Mocktails', priceMinor: 16000 },
      { name: 'Watermelon Mojito', category: 'Mocktails', priceMinor: 17000 },
      { name: 'Spicy Guava Brain Freeze', category: 'Mocktails', priceMinor: 20000 },
      { name: 'Masala Tea', category: 'Chai', priceMinor: 6000 },
      // Plus the named asset items
      { name: 'Paneer Tikka', category: 'Tandoori Starters', priceMinor: 28000 },
      { name: 'Paneer Achari Tikka', category: 'Tandoori Starters', priceMinor: 29000 },
      { name: 'Paneer Hariyali Tikka', category: 'Tandoori Starters', priceMinor: 29000 },
      { name: 'Paneer Malai Tikka', category: 'Tandoori Starters', priceMinor: 31000 },
      { name: 'Cranberry Coffee', category: 'Beverages', priceMinor: 18500 },
    ];

    for (const exp of expectedDishes) {
      const found = allDishes.find((d: any) => d.customName === exp.name);
      expect(found, `Dish "${exp.name}" must exist on menu`).toBeDefined();
      expect(found.priceMinor).toBe(exp.priceMinor);

      // Verify each dish has an image (imageOverride or canonical imageAsset)
      const hasImage = Boolean(found.imageOverride?.publicUrl || found.canonical?.imageAsset?.publicUrl);
      expect(hasImage, `Dish "${exp.name}" must have an image`).toBe(true);
    }

    // Verify Butter Chicken has Half and Full variants
    const butterChicken = allDishes.find((d: any) => d.customName === 'Butter Chicken');
    expect(butterChicken?.variants?.length).toBe(2);
    expect(butterChicken?.variants?.[0]?.name).toBe('Half');
    expect(butterChicken?.variants?.[0]?.supplementalPriceMinor).toBe(0);
    expect(butterChicken?.variants?.[1]?.name).toBe('Full');
    expect(butterChicken?.variants?.[1]?.supplementalPriceMinor).toBe(31000);
  });
});

