import 'dotenv/config';
import crypto from 'crypto';
import {
  NutritionSource,
  ThemePreset,
  LayoutMode,
  PublicationState,
  ClaimStatus,
  MenuType,
  MenuVisibility,
} from '@prisma/client';
import prisma from '../src/lib/db/prisma';
import { getCache } from '../src/lib/cache/redis';

export const THE_GRAVITY_SLUG = 'the-gravity-demo';
export const THE_GRAVITY_ALIAS_SLUG = 'the-gravity';
export const THE_GRAVITY_CLAIM_TOKEN = 'demo-claim-the-gravity-2026';

interface GravityItemSeed {
  name: string;
  priceMinor: number;
  description: string;
  assetFilename?: string;
  canonicalNormalizedName?: string;
  chefRecommended?: boolean;
  isPopular?: boolean;
  variants?: Array<{
    name: string;
    supplementalPriceMinor: number;
  }>;
}

interface GravityCategorySeed {
  name: string;
  sortOrder: number;
  items: GravityItemSeed[];
}

const GRAVITY_MENU_DATA: GravityCategorySeed[] = [
  {
    name: 'Sizzlers',
    sortOrder: 1,
    items: [
      {
        name: 'Paneer Shashlik Steak',
        priceMinor: 35000,
        description: 'Charred cottage cheese steak skewers tossed with sweet peppers and onions, served over sizzling buttered herb rice with smoky pepper sauce.',
        assetFilename: '571c49d7-19a6-467d-90b4-15d972430483.webp',
        canonicalNormalizedName: 'cottage cheese shashlik sizzler',
        chefRecommended: true,
      },
      {
        name: 'Chilli Chicken Sizzler (Noodle/Rice)',
        priceMinor: 35000,
        description: 'Spicy wok-tossed chili chicken served on a smoking cast-iron platter with your choice of noodles or fragrant fried rice and crispy vegetables.',
        assetFilename: 'ae4f735e-59fd-49e1-888e-947d3b9ca17d.webp',
        canonicalNormalizedName: 'grilled chicken steak sizzler',
        isPopular: true,
      },
    ],
  },
  {
    name: 'Chinese Starters',
    sortOrder: 2,
    items: [
      {
        name: 'Honey Chilli Potato',
        priceMinor: 24000,
        description: 'Crispy finger potatoes glazed in a sweet-spicy chili-honey sauce, toasted white sesame seeds, and fresh spring onion greens.',
        assetFilename: '21d2f1eb-d6e5-4247-bcbb-2ff244f8875f.webp',
        canonicalNormalizedName: 'crispy lotus stem in honey chilli',
        isPopular: true,
      },
      {
        name: 'Dragon Chicken',
        priceMinor: 31000,
        description: 'Crispy chicken strips tossed with dried red chilies, roasted cashew nuts, and fiery Schezwan-soy glaze.',
        assetFilename: 'ede78d82-1cf6-437b-a9b3-b06583cf577b.webp',
        canonicalNormalizedName: 'dragon chicken',
        chefRecommended: true,
      },
    ],
  },
  {
    name: 'Tandoori Starters',
    sortOrder: 3,
    items: [
      {
        name: 'Paneer Tikka',
        priceMinor: 28000,
        description: 'Succulent cubes of cottage cheese marinated in spiced yogurt and roasted in a clay tandoor with onions and capsicum, served with mint chutney.',
        assetFilename: 'paneer_tikka.webp',
        canonicalNormalizedName: 'paneer tikka',
        isPopular: true,
      },
      {
        name: 'Paneer Achari Tikka',
        priceMinor: 29000,
        description: 'Cottage cheese cubes marinated in tangy mixed-pickle spices, kalonji, fennel, and mustard oil, chargrilled to perfection.',
        assetFilename: 'paneer_achari_tikka.webp',
        canonicalNormalizedName: 'paneer achari tikka',
      },
      {
        name: 'Paneer Hariyali Tikka',
        priceMinor: 29000,
        description: 'Soft paneer cubes marinated in a vibrant green paste of fresh mint, coriander, spinach, and roasted spices, chargrilled over live coals.',
        assetFilename: 'paneer_hariyali_tikka.webp',
        canonicalNormalizedName: 'paneer hariyali tikka',
      },
      {
        name: 'Paneer Malai Tikka',
        priceMinor: 31000,
        description: 'Melt-in-the-mouth paneer cubes coated in a luxurious marinade of cashew paste, heavy cream, cardamom, and white pepper, grilled gently.',
        assetFilename: 'paneer_malai_tikka.webp',
        canonicalNormalizedName: 'paneer malai tikka',
        chefRecommended: true,
      },
    ],
  },
  {
    name: 'Pizza',
    sortOrder: 4,
    items: [
      {
        name: 'Paneer Tikka Pizza',
        priceMinor: 30000,
        description: 'Crisp wood-fired pizza generously loaded with marinated paneer tikka cubes, red and green capsicum, sliced onions, sweet corn, and bubbly mozzarella.',
        assetFilename: 'a41226cb-8839-4b20-8f0a-e096b683f698.webp',
        canonicalNormalizedName: 'paneer tikka pizza',
        isPopular: true,
      },
    ],
  },
  {
    name: 'Gravity Garlic Breads',
    sortOrder: 5,
    items: [
      {
        name: 'Cheese Garlic Bread',
        priceMinor: 16000,
        description: 'Freshly baked artisanal baguette brushed with rich garlic-herb butter and baked under a thick golden layer of molten mozzarella.',
        assetFilename: '2693786d-633e-47e3-9eaf-d76e8fd0cca4.webp',
        canonicalNormalizedName: 'cheesy pull-apart garlic bread',
        isPopular: true,
      },
    ],
  },
  {
    name: 'Burger',
    sortOrder: 6,
    items: [
      {
        name: 'Paneer Tikka Burger',
        priceMinor: 18000,
        description: 'Golden crunchy paneer steak patty tucked inside a toasted sesame brioche bun with spiced mint mayo, lettuce, sliced red onions, and melted cheese.',
        assetFilename: 'e2c55c7f-0144-443e-a2a9-f8c5c0bd91ec.webp',
        canonicalNormalizedName: 'paneer tikka burger',
        isPopular: true,
      },
    ],
  },
  {
    name: 'Non-Veg Main Course',
    sortOrder: 7,
    items: [
      {
        name: 'Butter Chicken',
        priceMinor: 34000,
        description: 'Tender chargrilled chicken tikka pieces simmered in an iconic velvety tomato, butter, and cashew gravy, finished with cream and dried fenugreek.',
        assetFilename: '50540b11-bee4-42b0-9e08-d3aeb371e563.webp',
        canonicalNormalizedName: 'butter chicken',
        chefRecommended: true,
        isPopular: true,
        variants: [
          { name: 'Half', supplementalPriceMinor: 0 },
          { name: 'Full', supplementalPriceMinor: 31000 },
        ],
      },
    ],
  },
  {
    name: 'Kofta',
    sortOrder: 8,
    items: [
      {
        name: 'Gravity Malai Kofta',
        priceMinor: 29000,
        description: 'Delicate potato and paneer dumplings stuffed with dried fruit, bathed in a silky smooth golden cashew-cream gravy with fragrant cardamom.',
        assetFilename: '8e887f76-0fa6-46bc-88e6-534e02132c04.webp',
        canonicalNormalizedName: 'malai kofta',
        chefRecommended: true,
      },
    ],
  },
  {
    name: 'Dal',
    sortOrder: 9,
    items: [
      {
        name: 'Dal Makhani',
        priceMinor: 24000,
        description: 'Slow-cooked black lentils and red kidney beans simmered overnight on low embers with butter, cream, and subtle ginger-tomato spices.',
        assetFilename: '6ab3498b-6fd6-4b3c-8653-a7d63cd08a48.webp',
        canonicalNormalizedName: 'classic dal makhani bowl',
        isPopular: true,
      },
    ],
  },
  {
    name: 'Boneless',
    sortOrder: 10,
    items: [
      {
        name: 'Chicken Tikka Biryani',
        priceMinor: 54000,
        description: 'Fragrant long-grain aged basmati rice layered with smoky chargrilled boneless chicken tikka, caramelized onions, saffron, and mint, cooked on dum.',
        assetFilename: '73648f09-56bd-4b4c-bea6-2f8d43806f27.webp',
        canonicalNormalizedName: 'murgh dum biryani',
        chefRecommended: true,
        isPopular: true,
      },
    ],
  },
  {
    name: 'South Indian',
    sortOrder: 11,
    items: [
      {
        name: 'Masala Dosa',
        priceMinor: 15000,
        description: 'Golden crispy fermented rice-lentil crepe filled with spiced mustard-tempered potato masala, served with piping vegetable sambar and coconut chutney.',
        assetFilename: 'a3e2ebbe-698e-41b4-8ad2-0693da142d01.webp',
        canonicalNormalizedName: 'classic masala dosa',
      },
    ],
  },
  {
    name: 'Shakes',
    sortOrder: 12,
    items: [
      {
        name: 'Oreo Shake',
        priceMinor: 21000,
        description: 'Creamy thick milkshake blended with vanilla ice cream and crunchy Oreo cookies, topped with whipped cream, chocolate drizzle, and an Oreo cookie.',
        assetFilename: '1bd80069-7a42-42da-b1b3-7b54e36ac04a.webp',
        canonicalNormalizedName: 'oreo shake',
        isPopular: true,
      },
      {
        name: 'Mango Shake',
        priceMinor: 19000,
        description: 'Luscious ripe mangoes blended thick with chilled creamy milk and vanilla ice cream, topped with fresh fruit cubes.',
        assetFilename: 'acb51b0e-1168-4c40-91e1-f53aae9e624b.webp',
        canonicalNormalizedName: 'peach iced tea',
      },
    ],
  },
  {
    name: 'Beverages',
    sortOrder: 13,
    items: [
      {
        name: 'Brownie Frappe',
        priceMinor: 22500,
        description: 'Decadent chilled blended frappe loaded with rich dark chocolate, fudgy brownie chunks, chocolate drizzle, and whipped cream.',
        assetFilename: '9f8c0fbe-71c9-4af6-a552-03cda9daa78b.webp',
        canonicalNormalizedName: 'brownie frappe',
        chefRecommended: true,
        isPopular: true,
      },
      {
        name: 'Cappuccino',
        priceMinor: 14500,
        description: 'Smooth full-bodied espresso with velvety textured steamed milk and microfoam, sprinkled with roasted coffee beans.',
        assetFilename: '6fedcc10-580e-42c7-b9eb-6412038d068d.webp',
        canonicalNormalizedName: 'cappuccino',
      },
      {
        name: 'Cranberry Coffee',
        priceMinor: 18500,
        description: 'Sophisticated layered specialty coffee featuring tart ruby cranberry reduction over clear ice cubes, topped with a bold shot of dark espresso and fragrant rosemary.',
        assetFilename: 'cranberryCoffee.webp',
        canonicalNormalizedName: 'cranberry coffee',
        chefRecommended: true,
      },
    ],
  },
  {
    name: 'Mocktails',
    sortOrder: 14,
    items: [
      {
        name: 'Blue Ocean',
        priceMinor: 16000,
        description: 'Electric blue and violet citrus cooler with floating fresh blueberries, bright lemon slices, mint, and effervescent sparkling soda.',
        assetFilename: '908df799-a463-4abb-a9b7-dfea2bcac778.webp',
        canonicalNormalizedName: 'blue ocean',
        isPopular: true,
      },
      {
        name: 'Watermelon Mojito',
        priceMinor: 17000,
        description: 'Refreshing thirst-quencher with freshly pressed watermelon juice, muddled mint, lime, and sparkling soda over crushed ice, garnished with a watermelon wedge.',
        assetFilename: '49f57521-3a62-4bce-af7a-b1eca1a5974f.webp',
        canonicalNormalizedName: 'watermelon mojito',
        isPopular: true,
      },
      {
        name: 'Spicy Guava Brain Freeze',
        priceMinor: 20000,
        description: 'Vibrant chilled mocktail made with pink guava nectar, crushed ice, spicy red chili-salt rim, lemon slice, and cooling mint.',
        assetFilename: 'bd9cba0b-3ccd-4e5a-9583-b613ee834fb2.webp',
        canonicalNormalizedName: 'spicy guava brain freeze',
        chefRecommended: true,
      },
    ],
  },
  {
    name: 'Chai',
    sortOrder: 15,
    items: [
      {
        name: 'Masala Tea',
        priceMinor: 6000,
        description: 'Authentic Indian milk tea slow-brewed with crushed fresh ginger, green cardamom pods, cinnamon bark, and Assam tea leaves.',
        assetFilename: 'd3491d15-f405-4d1a-9b5d-020402159b7d.webp',
        canonicalNormalizedName: 'masala tea',
        isPopular: true,
      },
    ],
  },
];

async function findAssetForSeed(filename?: string): Promise<string | null> {
  if (!filename) return null;
  const asset = await prisma.asset.findFirst({
    where: {
      OR: [
        { storageKey: { contains: filename } },
        { publicUrl: { contains: filename } },
        { prompt: { contains: filename } },
      ],
    },
    select: { id: true },
  });
  return asset?.id || null;
}

export async function seedTheGravityDemo() {
  console.log('🌌 Seeding The Gravity Demo Restaurant (Rich Dark Aesthetic)...');

  // 1. Upsert Restaurant
  const coverUrl = '/images/the-gravity-banner.webp';
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: THE_GRAVITY_SLUG },
    update: {
      displayName: 'The Gravity',
      description: 'An upscale culinary haven blending sizzling signatures, artisanal stone-baked pizzas, vibrant tandoori grills, and handcrafted brews in an intimate, rich dark ambiance.',
      country: 'IN',
      city: 'New Delhi',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      address: 'Plot 14, Sector 29, City Center, New Delhi 110001',
      phone: '+91 98765 43210',
      coverUrl,
      publicationState: PublicationState.PUBLISHED,
      isClaimed: false, // Explicitly marked as demo / claimable
      organizationId: null,
    },
    create: {
      slug: THE_GRAVITY_SLUG,
      displayName: 'The Gravity',
      description: 'An upscale culinary haven blending sizzling signatures, artisanal stone-baked pizzas, vibrant tandoori grills, and handcrafted brews in an intimate, rich dark ambiance.',
      country: 'IN',
      city: 'New Delhi',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      address: 'Plot 14, Sector 29, City Center, New Delhi 110001',
      phone: '+91 98765 43210',
      coverUrl,
      publicationState: PublicationState.PUBLISHED,
      isClaimed: false, // Explicitly marked as demo / claimable
      organizationId: null,
    },
  });

  // 2. Customized Theme — Rich Dark Aesthetic Vibe
  await prisma.restaurantTheme.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      presetKey: ThemePreset.CUSTOM,
      backgroundColor: '#12100E', // Deep rich charcoal obsidian
      surfaceColor: '#1C1713', // Warm dark surface
      primaryTextColor: '#FAF7F2', // Luminous warm ivory text
      secondaryTextColor: '#A89F91', // Muted champagne taupe
      accentColor: '#D4883A', // Warm amber / gold glow
      secondaryAccentColor: '#E8B058', // Rich gold highlight
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      layoutMode: LayoutMode.GRID,
      cardRadius: '18px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'none',
      isPublished: true,
      publishedSettings: {
        mobileGridColumns: 1,
      },
    },
    create: {
      restaurantId: restaurant.id,
      presetKey: ThemePreset.CUSTOM,
      backgroundColor: '#12100E',
      surfaceColor: '#1C1713',
      primaryTextColor: '#FAF7F2',
      secondaryTextColor: '#A89F91',
      accentColor: '#D4883A',
      secondaryAccentColor: '#E8B058',
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      layoutMode: LayoutMode.GRID,
      cardRadius: '18px',
      buttonStyle: 'rounded',
      imageProportions: 'square',
      texture: 'none',
      isPublished: true,
      publishedSettings: {
        mobileGridColumns: 1,
      },
    },
  });

  // 3. Restaurant Settings & Grounded AI Waiter Tone
  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      welcomeMessage:
        'Welcome to The Gravity! Immerse yourself in our sizzling grill steaks, wood-fired pizzas, rich curries, and handcrafted mocktails in an elegant, rich dark ambience. Demo menu — prices and availability subject to confirmation.',
      aiTone: 'sophisticated, warm, culinary-expert, hospitable, concise',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 30,
    },
    create: {
      restaurantId: restaurant.id,
      welcomeMessage:
        'Welcome to The Gravity! Immerse yourself in our sizzling grill steaks, wood-fired pizzas, rich curries, and handcrafted mocktails in an elegant, rich dark ambience. Demo menu — prices and availability subject to confirmation.',
      aiTone: 'sophisticated, warm, culinary-expert, hospitable, concise',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 30,
    },
  });

  // 4. Demo Ordering Settings
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

  // 5. Demo Table for Table QR Ordering
  const tableTokenRaw = 'demo-thegravity-table7';
  const qrTokenHash = crypto.createHash('sha256').update(tableTokenRaw).digest('hex');
  await prisma.restaurantTable.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: 'Table 7',
      },
    },
    update: {
      section: 'Terrace Dining',
      capacity: 4,
      qrTokenHash,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: 'Table 7',
      section: 'Terrace Dining',
      capacity: 4,
      qrTokenHash,
      isActive: true,
    },
  });

  // 6. Claim Request for Owner Claim Flow
  const claimTokenHash = crypto.createHash('sha256').update(THE_GRAVITY_CLAIM_TOKEN).digest('hex');
  await prisma.claimRequest.upsert({
    where: { claimTokenHash },
    update: {
      restaurantId: restaurant.id,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      verificationNotes: 'Founder demo menu for The Gravity with rich dark aesthetic vibe and realistic food photography.',
    },
    create: {
      restaurantId: restaurant.id,
      claimTokenHash,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      verificationNotes: 'Founder demo menu for The Gravity with rich dark aesthetic vibe and realistic food photography.',
    },
  });

  // 7. Menu & Categories
  let menu = await prisma.menu.findFirst({
    where: { restaurantId: restaurant.id },
  });

  if (!menu) {
    menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        title: 'Main Dining Menu',
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
        title: 'Main Dining Menu',
        type: MenuType.ALL_DAY,
        visibility: MenuVisibility.PUBLIC,
        active: true,
      },
    });
  }

  // Clear existing categories for clean idempotent seeding
  await prisma.menuCategory.deleteMany({
    where: { menuId: menu.id },
  });

  let totalItemsSeeded = 0;
  for (const catData of GRAVITY_MENU_DATA) {
    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: catData.name,
        sortOrder: catData.sortOrder,
      },
    });

    for (let itemIdx = 0; itemIdx < catData.items.length; itemIdx += 1) {
      const itemData = catData.items[itemIdx];

      // Find image override asset if specified
      const imageOverrideAssetId = await findAssetForSeed(itemData.assetFilename);

      // Find canonical dish if specified and sync primary image if missing
      let canonicalId: string | null = null;
      if (itemData.canonicalNormalizedName) {
        const canonical = await prisma.canonicalDish.findUnique({
          where: { normalizedName: itemData.canonicalNormalizedName },
          select: { id: true, imageAssetId: true },
        });
        if (canonical) {
          canonicalId = canonical.id;
          if (!canonical.imageAssetId && imageOverrideAssetId) {
            await prisma.canonicalDish.update({
              where: { id: canonical.id },
              data: { imageAssetId: imageOverrideAssetId },
            });
            await prisma.canonicalAsset.upsert({
              where: {
                canonicalId_assetId: {
                  canonicalId: canonical.id,
                  assetId: imageOverrideAssetId,
                },
              },
              update: { isApproved: true },
              create: {
                canonicalId: canonical.id,
                assetId: imageOverrideAssetId,
                isApproved: true,
                reuseCount: 1,
              },
            });
          }
        }
      }

      const createdItem = await prisma.restaurantMenuItem.create({
        data: {
          restaurantId: restaurant.id,
          menuId: menu.id,
          categoryId: category.id,
          canonicalId,
          imageOverrideAssetId,
          customName: itemData.name,
          restaurantDescription: itemData.description,
          priceMinor: itemData.priceMinor,
          currency: 'INR',
          portionSize: null,
          nutritionSource: NutritionSource.NOT_PROVIDED,
          isAvailable: true,
          isPublished: true,
          chefRecommended: itemData.chefRecommended || false,
          isPopular: itemData.isPopular || false,
          sortOrder: itemIdx + 1,
        },
      });

      // Create variants if specified (e.g. Butter Chicken Half/Full)
      if (itemData.variants && itemData.variants.length > 0) {
        for (let vIdx = 0; vIdx < itemData.variants.length; vIdx += 1) {
          const v = itemData.variants[vIdx];
          await prisma.dishVariant.create({
            data: {
              menuItemId: createdItem.id,
              name: v.name,
              choiceGroup: 'Portion',
              supplementalPriceMinor: v.supplementalPriceMinor,
              isRequired: true,
              sortOrder: vIdx + 1,
            },
          });
        }
      }

      totalItemsSeeded += 1;
    }
  }

  // Invalidate Redis caches for both the primary and alias slugs
  const cache = getCache();
  await Promise.all([
    cache.del(`menu:slug:${THE_GRAVITY_SLUG}`),
    cache.del(`menu:slug:${THE_GRAVITY_ALIAS_SLUG}`),
    cache.del('canonical:library:all'),
  ]).catch(() => undefined);

  console.log(`✨ The Gravity Demo Restaurant seeded successfully! (${totalItemsSeeded} dishes across ${GRAVITY_MENU_DATA.length} categories)`);
  console.log(`🌐 Diner Portal: /m/${THE_GRAVITY_ALIAS_SLUG} (or /m/${THE_GRAVITY_SLUG})`);
  console.log(`🔑 Claim Portal: /claim/${THE_GRAVITY_CLAIM_TOKEN}`);
}

if (process.argv[1]?.includes('seed-the-gravity')) {
  seedTheGravityDemo()
    .then(async () => {
      await prisma.$disconnect().catch(() => undefined);
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('The Gravity seed failed:', err);
      await prisma.$disconnect().catch(() => undefined);
      process.exit(1);
    });
}
