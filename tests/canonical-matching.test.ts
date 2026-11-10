import { describe, it, expect, vi, afterEach } from 'vitest';
import prisma from '../src/lib/db/prisma';
import {
  normalizeDishString,
  matchCanonicalDish,
  matchCanonicalDishesBatch,
  isDietaryAndCategoryCompatible,
} from '../src/lib/canonical/matcher';
import * as geminiClient from '../src/lib/gemini/client';
import {
  CANONICAL_CATEGORY_ORDER,
  CANONICAL_GALLERY_CATALOG,
  getCanonicalDisplayMeta,
  sortCanonicalCategories,
} from '../src/lib/canonical/catalog';

describe('Shared Canonical Knowledge Matching', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('normalizes dish strings cleanly including diacritics and apostrophes', () => {
    expect(normalizeDishString('  Classic Cappuccino!!  ')).toBe('classic cappuccino');
    expect(normalizeDishString('Murgh Makhani (Butter Chicken)')).toBe('murgh makhani butter chicken');
    expect(normalizeDishString('Classic French Crème Brûlée')).toBe('classic french creme brulee');
    expect(normalizeDishString('General Tso’s Chicken')).toBe('general tsos chicken');
    expect(normalizeDishString("Shepherd’s Pie")).toBe('shepherds pie');
  });

  it('matches exact canonical dishes in database', async () => {
    const result = await matchCanonicalDish({
      dishName: 'Cappuccino',
    });

    expect(result.canonicalId).toBeDefined();
    expect(result.normalizedName).toBe('cappuccino');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('resolves known aliases', async () => {
    const result = await matchCanonicalDish({
      dishName: 'Karak Chai',
    });

    expect(result.canonicalId).toBeDefined();
    expect(result.normalizedName).toBe('masala chai');
  });

  it('never merges vegetarian and meat or seafood dishes', async () => {
    const palakPaneer = await matchCanonicalDish({
      dishName: 'Palak Paneer',
    });
    expect(palakPaneer.canonicalId).toBeTruthy();
    expect(palakPaneer.normalizedName).toBe('palak paneer');
    expect(palakPaneer.normalizedName).not.toBe('saag meat palak mutton');

    const paneerButterMasala = await matchCanonicalDish({
      dishName: 'Paneer Butter Masala',
    });
    if (paneerButterMasala.canonicalId) {
      expect(paneerButterMasala.normalizedName).not.toBe('butter chicken');
    }

    const vegClub = await matchCanonicalDish({
      dishName: 'Garden Veg Club Sandwich',
    });
    if (vegClub.canonicalId) {
      expect(vegClub.normalizedName).not.toBe('classic chicken club sandwich');
    }

    const muttonCutlet = await matchCanonicalDish({
      dishName: 'Spiced Mutton Cutlet',
    });
    if (muttonCutlet.canonicalId) {
      expect(muttonCutlet.normalizedName).not.toBe('crispy veg cutlet platter');
    }

    const vegSalmon = await matchCanonicalDish({
      dishName: 'Vegetarian Salmon Bowl',
    });
    if (vegSalmon.canonicalId) {
      expect(vegSalmon.normalizedName).not.toBe('hawaiian salmon tofu poke bowl');
    }
  });

  it('contains all 655 curated catalog dishes across all 17 categories with clean display metadata', () => {
    expect(CANONICAL_GALLERY_CATALOG).toHaveLength(655);
    const uniqueNames = new Set(CANONICAL_GALLERY_CATALOG.map((item) => item.normalizedName));
    expect(uniqueNames.size).toBe(655);

    const byCategory = CANONICAL_GALLERY_CATALOG.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    expect(byCategory).toEqual({
      'Hot & Iced Coffees': 35,
      'Teas, Matcha & Hot Infusions': 25,
      'Shakes, Smoothies, Juices & Mocktails': 30,
      'All-Day Breakfast, Eggs & Toast': 31,
      'Artisanal Breads, Croissants & Savory Bakes': 25,
      'Sandwiches, Paninis, Burgers & Wraps': 31,
      'Small Plates, Fries, Nachos & Starters': 36,
      'Pizzas & Pastas': 31,
      'Global Bowls, Salads, Sizzlers & Cafe Mains': 26,
      'Cakes, Pastries, Cookies & Confectionery': 35,
      'Awadhi, Mughlai & Lucknowi Kitchen Classics': 50,
      'North Indian, Tandoor & Punjabi Bistro Classics': 45,
      'Indian Street Food, Chaat & South Indian Cafe Fare': 40,
      'Pan-Asian, Sushi, Bao & Dim Sum': 60,
      'Continental, Mediterranean, Mexican & Pub Grub': 55,
      'Patisserie, Global Desserts & Frozen Treats': 50,
      'Artisanal Cocktails, Craft Brews, Sangrias & Specialty Drinks': 50,
    });

    expect(
      sortCanonicalCategories([...CANONICAL_CATEGORY_ORDER].reverse())
    ).toEqual(CANONICAL_CATEGORY_ORDER);

    expect(getCanonicalDisplayMeta('avocado sourdough toast').displayName).toBe(
      'Smashed Avocado Sourdough Toast'
    );
    expect(getCanonicalDisplayMeta('khow suey').category).toBe(
      'Global Bowls, Salads, Sizzlers & Cafe Mains'
    );
    expect(getCanonicalDisplayMeta('south indian filter coffee').category).toBe(
      'Hot & Iced Coffees'
    );
    expect(getCanonicalDisplayMeta('kesar badam kulfi falooda').displayName).toBe(
      'Kesar Badam Kulfi Falooda'
    );
    expect(getCanonicalDisplayMeta('mutton galouti kebab').category).toBe(
      'Awadhi, Mughlai & Lucknowi Kitchen Classics'
    );
    expect(getCanonicalDisplayMeta('classic french creme brulee').displayName).toBe(
      'Classic French Crème Brûlée'
    );
    expect(getCanonicalDisplayMeta('classic espresso martini').category).toBe(
      'Artisanal Cocktails, Craft Brews, Sangrias & Specialty Drinks'
    );
  });

  it('matches seeded dishes across categories including exact names, diacritics, apostrophes, and whole-phrase aliases', async () => {
    const requiredCases: Array<[string, string]> = [
      ['Single Espresso', 'espresso'],
      ['Double Espresso', 'doppio double espresso'],
      ['V60 Pour-Over Coffee', 'pour-over coffee'],
      ['Hazelnut Cold Coffee', 'frappe cold coffee'],
      ['South Indian Filter Coffee', 'south indian filter coffee'],
      ['Butterfly Blue Pea Tea', 'butterfly blue pea tea'],
      ['Blueberry Matcha Latte', 'blueberry iced matcha latte'],
      ['Vanilla Latte', 'cafe latte'],
      ['Oreo Thick Shake', 'thick shake'],
      ['Berry Smoothie Bowl', 'smoothie bowl'],
      ['Chili Guava Cooler', 'fruit soda cooler'],
      ['Blue Lagoon Cooler', 'blue lagoon cooler'],
      ['Middle Eastern Shakshuka', 'middle eastern shakshuka'],
      ['Aloo Patties', 'savory patties puff pastry'],
      ['Korean Cream Cheese Garlic Bun', 'korean cream cheese garlic bun'],
      ['Bombay Masala Grill Sandwich', 'bombay masala grill sandwich'],
      ['Classic Cheeseburger', 'gourmet burger'],
      ['Spicy Bun Kebab', 'bun kebab'],
      ['Falafel Wrap', 'falafel platter wrap'],
      ['Lucknowi Basket (Tokri) Chaat', 'lucknowi basket tokri chaat'],
      ['Peri-Peri Fries', 'peri peri fries'],
      ['Red Sauce Pasta', 'arrabbiata pasta'],
      ['White Sauce Pasta', 'alfredo pasta'],
      ['Pink Sauce (Rosa) Pasta', 'pink sauce pasta'],
      ['Wood-Fired Pizza', 'thin-crust wood-fired pizza'],
      ['Fresh Burrata & Arugula Pizza', 'fresh burrata arugula pizza'],
      ['Burmese Khow Suey', 'khow suey'],
      ['Paneer Sizzler', 'sizzler'],
      ['Thai Green Curry with Jasmine Rice', 'thai green curry with jasmine rice'],
      ['Lotus Biscoff Cheesecake', 'lotus biscoff cheesecake'],
      ['San Sebastian Burnt Basque Cheesecake', 'san sebastian burnt basque cheesecake'],
      ['Kesar Badam Kulfi Falooda', 'kesar badam kulfi falooda'],
      // Seeded Batch 2 dishes (Awadhi / North Indian)
      ['Galouti Kebab', 'mutton galouti kebab'],
      ['Awadhi Mutton Biryani', 'awadhi dum mutton biryani'],
      ['Veg Dum Biryani', 'subz dum biryani'],
      ['Lucknowi Nihari', 'mutton nihari'],
      ['Dal Tadka', 'dal tadka yellow dal fry'],
      ['Palak Paneer', 'palak paneer'],
      ['Shahi Tukda', 'shahi tukda'],
    ];

    for (const [dishName, expectedNormalized] of requiredCases) {
      const matched = await matchCanonicalDish({ dishName });
      expect(matched.canonicalId, `Expected canonical match for "${dishName}"`).toBeTruthy();
      expect(matched.normalizedName).toBe(expectedNormalized);
    }

    const seededRows = await prisma.canonicalDish.findMany({
      select: { normalizedName: true },
    });
    const seededSet = new Set(seededRows.map((r) => r.normalizedName));

    const batch2PendingCases: Array<[string, string]> = [
      ['Paneer Butter Masala', 'paneer butter masala'],
      ['Chole Bhature', 'pindi chole bhature'],
      ['Masala Dosa', 'classic masala dosa'],
      ['Golgappe', 'pani ke batashe five-flavour golgappe'],
      ['Dahi Puri', 'dahi batasha dahi puri'],
      ['Paneer Gua Bao', 'gua bao crispy paneer tofu'],
      ['Teriyaki Chicken Bao', 'gua bao teriyaki glazed chicken'],
      ['Spicy Veg Fried Rice', 'classic veg chicken fried rice'],
      ['Kung Pao Paneer', 'kung pao chicken paneer'],
      ['Pad Thai', 'pad thai noodles'],
      ['General Tso’s Chicken', 'general tsos chicken'],
      ['Fish & Chips', 'classic british fish and chips'],
      ['Shepherd’s Pie', 'shepherds pie'],
      ['Classic French Crème Brûlée', 'classic french creme brulee'],
      ['Matcha Green Tea Mille Crêpe Cake', 'matcha green tea mille crepe cake'],
      ['Matka Kulfi', 'matka malai kulfi'],
      ['Espresso Martini', 'classic espresso martini'],
      ['Moscow Mule', 'moscow mule in copper mug'],
      ['Dirty Chai Latte', 'dirty chai latte'],
      ['Haldi Doodh', 'golden turmeric milk latte haldi doodh'],
    ];

    for (const [dishName, expectedNormalized] of batch2PendingCases) {
      if (!seededSet.has(expectedNormalized)) continue;
      const matched = await matchCanonicalDish({ dishName });
      expect(matched.canonicalId, `Expected canonical match for seeded "${dishName}"`).toBeTruthy();
      expect(matched.normalizedName).toBe(expectedNormalized);
    }
  });

  it('preserves distinct legacy dishes and avoids false-positive sourdough hijacking', async () => {
    const avo = await matchCanonicalDish({ dishName: 'Avocado Sourdough Toast' });
    expect(avo.normalizedName).toBe('avocado sourdough toast');

    const avoFeta = await matchCanonicalDish({ dishName: 'Avocado & Feta Sourdough Toast' });
    expect(avoFeta.canonicalId).toBeTruthy();
    expect(avoFeta.normalizedName).toBe('avocado sourdough toast');
    expect(avoFeta.normalizedName).not.toBe('pesto sourdough toast');

    const almondTwice = await matchCanonicalDish({
      dishName: 'Almond Frangipane Twice-Baked Croissant',
    });
    expect(almondTwice.canonicalId).toBeTruthy();
    expect(almondTwice.normalizedName).toBe('almond frangipane croissant');

    const shahiTukda = await matchCanonicalDish({
      dishName: 'Cardamom & Rosewater Shahi Tukda',
    });
    expect(shahiTukda.canonicalId).toBeTruthy();
    expect(shahiTukda.normalizedName).toBe('shahi tukda');

    const unique = await matchCanonicalDish({ dishName: 'Chefs Signature Mystery Platter 99' });
    expect(unique.canonicalId).toBeNull();
  });

  it('enforces Egg/Eggless, Vegan/Dairy, and Food/Drink boundaries during matching', async () => {
    expect(
      isDietaryAndCategoryCompatible({
        inputNorm: 'eggless classic shakshuka',
        canonNorm: 'middle eastern shakshuka',
        termNorm: 'middle eastern shakshuka',
        strictMode: true,
      })
    ).toBe(false);

    expect(
      isDietaryAndCategoryCompatible({
        inputNorm: 'vegan paneer tikka',
        inputDietaryLabels: ['VEGAN'],
        canonNorm: 'paneer tikka',
        termNorm: 'paneer tikka',
        strictMode: true,
      })
    ).toBe(false);

    expect(
      isDietaryAndCategoryCompatible({
        inputNorm: 'espresso walnut cake',
        canonNorm: 'espresso',
        termNorm: 'espresso',
        strictMode: true,
      })
    ).toBe(false);

    expect(
      isDietaryAndCategoryCompatible({
        inputNorm: 'spicy chicken bites',
        inputDietaryLabels: ['NON_VEG'],
        canonNorm: 'paneer tikka',
        termNorm: 'paneer tikka',
        strictMode: true,
      })
    ).toBe(false);

    expect(
      isDietaryAndCategoryCompatible({
        inputNorm: 'jain shahi paneer makhani',
        inputDietaryLabels: ['JAIN', 'VEG'],
        canonNorm: 'paneer tikka masala with garlic naan',
        termNorm: 'paneer tikka masala with garlic naan',
        strictMode: true,
      })
    ).toBe(false);
  });

  it('runs a single batched Gemini semantic pass and rejects unsafe dietary suggestions', async () => {
    const fakeClient = {
      models: {
        generateContent: vi.fn(async () => ({
          text: JSON.stringify({
            matches: [
              {
                idx: 1,
                canonicalNormalizedName: 'cafe mocha',
                confidence: 0.86,
                reason: 'Dark chocolate espresso beverage',
              },
              {
                idx: 2,
                canonicalNormalizedName: 'mutton nihari',
                confidence: 0.92,
                reason: 'Should be rejected due to VEG safety guard',
              },
            ],
          }),
        })),
      },
    } as any;

    vi.spyOn(geminiClient, 'getGenAIClient').mockReturnValue(fakeClient);

    const results = await matchCanonicalDishesBatch(
      [
        { dishName: 'Cappuccino', dietaryLabels: ['VEG'] },
        { dishName: 'Artisan Belgian Cacao Velvet Sip', dietaryLabels: ['VEG'] },
        { dishName: 'Pure Veg Heritage Slow Bowl', dietaryLabels: ['VEG'] },
        { dishName: 'Classic Cappuccino', dietaryLabels: ['VEG'] },
      ],
      { useGemini: true }
    );

    expect(results).toHaveLength(4);
    expect(results[0].normalizedName).toBe('cappuccino');
    expect(results[0].matchedSource).toBe('EXACT');
    expect(results[3].normalizedName).toBe('cappuccino');
    expect(results[3].matchedSource).toBe('ALIAS');

    // Semantic match succeeded in single batch call
    expect(fakeClient.models.generateContent).toHaveBeenCalledTimes(1);
    expect(results[1].canonicalId).toBeTruthy();
    expect(results[1].normalizedName).toBe('cafe mocha');
    expect(results[1].matchedSource).toBe('GEMINI_SEMANTIC');

    // Unsafe meat suggestion for VEG dish must be blocked deterministically
    expect(results[2].canonicalId).toBeNull();
  });
});
