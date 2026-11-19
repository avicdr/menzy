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

export const CUTE_AND_CUP_SLUG = 'cute-and-cup';
export const CUTE_AND_CUP_CLAIM_TOKEN = 'demo-claim-cute-and-cup-2026';

interface RawItemDef {
  name: string;
  halfPrice?: number;
  fullPrice?: number;
  price?: number;
  description: string;
  isPopular?: boolean;
  chefRecommended?: boolean;
  preferredAssetKeywords?: string[];
  canonicalSearchName?: string;
}

interface RawCategoryDef {
  name: string;
  sortOrder: number;
  items: RawItemDef[];
}

export const CUTE_AND_CUP_MENU: RawCategoryDef[] = [
  {
    name: 'Manchurian',
    sortOrder: 1,
    items: [
      {
        name: 'Veg Manchurian Gravy',
        halfPrice: 89,
        fullPrice: 169,
        description: 'Crispy vegetable dumplings simmered in a savory, aromatic dark soy and garlic gravy with fresh spring onions.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['manchurian', 'gravy', 'chinese'],
        canonicalSearchName: 'veg manchurian gravy',
      },
      {
        name: 'Gobhi Manchurian Gravy',
        halfPrice: 99,
        fullPrice: 179,
        description: 'Golden fried cauliflower florets tossed in rich Indo-Chinese ginger-garlic sauce.',
        preferredAssetKeywords: ['gobhi', 'manchurian', 'cauliflower'],
      },
      {
        name: 'Mushroom Manchurian Gravy',
        halfPrice: 120,
        fullPrice: 200,
        description: 'Tender button mushrooms coated and cooked in a deeply flavorful garlic and coriander Manchurian sauce.',
        preferredAssetKeywords: ['mushroom', 'manchurian'],
      },
      {
        name: 'Baby Corn Manchurian Gravy',
        halfPrice: 110,
        fullPrice: 190,
        description: 'Crunchy baby corn batons simmered in a spicy, umami-rich Manchurian gravy.',
        preferredAssetKeywords: ['baby corn', 'manchurian'],
      },
      {
        name: 'Chilli Paneer Manchurian Gravy',
        halfPrice: 100,
        fullPrice: 180,
        description: 'Fresh paneer cubes wok-tossed in a fusion chilli-garlic Manchurian gravy with bell peppers.',
        chefRecommended: true,
        preferredAssetKeywords: ['chilli paneer', 'paneer'],
      },
      {
        name: 'Paneer Chilli Dry',
        halfPrice: 90,
        fullPrice: 170,
        description: 'Crisp paneer cubes stir-fried with diced onions, capsicum, green chillies, and dark soy sauce.',
        isPopular: true,
        preferredAssetKeywords: ['paneer chilli', 'chilli paneer dry'],
      },
      {
        name: 'Veg Chilli Dry',
        halfPrice: 90,
        fullPrice: 170,
        description: 'Assorted seasonal vegetables wok-tossed with spicy green chillies, garlic, and oriental sauces.',
        preferredAssetKeywords: ['veg chilli', 'chilli veg'],
      },
      {
        name: 'Mushroom Chilli Dry',
        halfPrice: 110,
        fullPrice: 190,
        description: 'Stir-fried button mushrooms with fiery chillies, garlic slivers, and crunchy capsicum.',
        preferredAssetKeywords: ['mushroom chilli', 'mushroom'],
      },
      {
        name: 'Baby Corn Dry',
        halfPrice: 110,
        fullPrice: 200,
        description: 'Crisp fried baby corn tossed in spicy schezwan sauce and toasted sesame seeds.',
        preferredAssetKeywords: ['baby corn dry', 'baby corn'],
      },
    ],
  },
  {
    name: 'Sandwich',
    sortOrder: 2,
    items: [
      {
        name: 'Veg Sandwich',
        price: 59,
        description: 'Fresh white bread layered with sliced cucumber, tomato, potato masala, and tangy green chutney.',
        preferredAssetKeywords: ['bombay-veg-grilled-sandwich', 'sandwich', 'veg sandwich'],
        canonicalSearchName: 'bombay veg grilled sandwich',
      },
      {
        name: 'Paneer Sandwich',
        price: 69,
        description: 'Warm sandwich stuffed with marinated spiced cottage cheese and zesty mint mayonnaise.',
        preferredAssetKeywords: ['tandoori-paneer-club-sandwich', 'paneer sandwich'],
        canonicalSearchName: 'tandoori paneer club sandwich',
      },
      {
        name: 'Cheese Sandwich',
        price: 79,
        description: 'Gooey melted cheddar and mozzarella blend sandwiched between golden toasted bread slices.',
        isPopular: true,
        preferredAssetKeywords: ['cheese sandwich', 'grilled cheese'],
      },
      {
        name: 'Paneer Cheese Sandwich',
        price: 99,
        description: 'Signature sandwich packed with seasoned paneer cubes and generous layers of melted cheese.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['grilled-paneer-cheese-sandwich', 'paneer cheese'],
        canonicalSearchName: 'grilled paneer cheese sandwich',
      },
      {
        name: 'Paneer Corn Sandwich',
        price: 99,
        description: 'Sweet corn kernels and spiced paneer tossed in creamy dressing and grilled to perfection.',
        preferredAssetKeywords: ['paneer corn', 'sandwich'],
      },
    ],
  },
  {
    name: 'Maggi',
    sortOrder: 3,
    items: [
      {
        name: 'Plain Veg Maggi',
        price: 49,
        description: 'Classic comfort Maggi noodles simmered with fresh green peas, carrots, and special masala.',
        preferredAssetKeywords: ['butter-masala-maggi', 'maggi'],
        canonicalSearchName: 'butter masala maggi',
      },
      {
        name: 'Soup Maggi',
        price: 59,
        description: 'Piping hot soupy noodles with vegetable broth, fragrant spices, and fresh herbs.',
        preferredAssetKeywords: ['soup maggi', 'broth maggi'],
      },
      {
        name: 'Cheese Maggi',
        price: 59,
        description: 'Steaming hot Maggi noodles smothered in a blanket of melted cheese and sweet corn.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['cheese-maggi', 'cheese maggi'],
        canonicalSearchName: 'cheese maggi',
      },
      {
        name: 'Chilli Garlic Maggi',
        price: 69,
        description: 'Spicy street-style Maggi loaded with burnt garlic, fiery red chillies, and herbs.',
        isPopular: true,
        preferredAssetKeywords: ['chilli garlic maggi'],
      },
      {
        name: 'Paneer Maggi',
        price: 79,
        description: 'Hearty noodles stir-cooked with tender spiced paneer cubes and vegetable masala.',
        preferredAssetKeywords: ['paneer maggi'],
      },
      {
        name: 'Mushroom Maggi',
        price: 99,
        description: 'Rich and earthy Maggi noodles cooked with sliced button mushrooms and butter.',
        preferredAssetKeywords: ['mushroom maggi'],
      },
    ],
  },
  {
    name: 'Fried Rice',
    sortOrder: 4,
    items: [
      {
        name: 'Mix Veg Fried Rice',
        halfPrice: 59,
        fullPrice: 99,
        description: 'Fluffy long-grain rice wok-tossed with diced carrots, beans, peas, and mild Chinese seasoning.',
        isPopular: true,
        preferredAssetKeywords: ['fried rice', 'mix veg rice'],
      },
      {
        name: 'Lemon Flavour Fried Rice',
        halfPrice: 69,
        fullPrice: 129,
        description: 'Fragrant fried rice infused with zesty fresh lemon juice, curry leaves, and mustard seeds.',
        preferredAssetKeywords: ['lemon rice', 'lemon fried rice'],
      },
      {
        name: 'Paneer Fried Rice',
        halfPrice: 89,
        fullPrice: 169,
        description: 'Wok-tossed rice with golden pan-seared paneer cubes, spring onions, and garlic.',
        chefRecommended: true,
        preferredAssetKeywords: ['paneer fried rice', 'paneer rice'],
      },
      {
        name: 'Baby Corn Fried Rice',
        halfPrice: 99,
        fullPrice: 179,
        description: 'Crunchy baby corn tossed with aromatic jasmine rice, white pepper, and light soy sauce.',
        preferredAssetKeywords: ['baby corn rice'],
      },
      {
        name: 'Mexican Fried Rice',
        halfPrice: 99,
        fullPrice: 169,
        description: 'Zesty fusion rice with sweet corn, kidney beans, salsa spices, and bell peppers.',
        preferredAssetKeywords: ['mexican rice', 'mexican fried rice'],
      },
      {
        name: 'Mushroom Fried Rice',
        halfPrice: 99,
        fullPrice: 189,
        description: 'Earthy button mushrooms stir-fried with fragrant rice, black pepper, and scallions.',
        preferredAssetKeywords: ['mushroom rice', 'mushroom fried rice'],
      },
      {
        name: 'Schezwan Fried Rice',
        halfPrice: 99,
        fullPrice: 189,
        description: 'Fiery wok-tossed rice coated in homemade spicy schezwan chilli sauce and garlic.',
        isPopular: true,
        preferredAssetKeywords: ['schezwan fried rice', 'schezwan rice'],
      },
      {
        name: 'Chilli Garlic Fried Rice',
        halfPrice: 79,
        fullPrice: 149,
        description: 'Bold fried rice packed with toasted garlic slivers, dry red chillies, and soy.',
        preferredAssetKeywords: ['chilli garlic rice'],
      },
    ],
  },
  {
    name: 'Noodles',
    sortOrder: 5,
    items: [
      {
        name: 'Veg Noodles',
        halfPrice: 69,
        fullPrice: 129,
        description: 'Classic wok-tossed noodles with shredded cabbage, carrots, bell peppers, and light soy sauce.',
        preferredAssetKeywords: ['veg noodles', 'noodles'],
      },
      {
        name: 'Veg Hakka Noodles',
        halfPrice: 89,
        fullPrice: 159,
        description: 'Thin street-style Hakka noodles tossed on high heat with crisp vegetables and white pepper.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['hakka noodles', 'veg hakka'],
      },
      {
        name: 'Baby Corn Noodles',
        halfPrice: 99,
        fullPrice: 189,
        description: 'Stir-fried noodles with crisp baby corn batons, scallions, and soy ginger glaze.',
        preferredAssetKeywords: ['baby corn noodles'],
      },
      {
        name: 'Schezwan Noodles',
        halfPrice: 99,
        fullPrice: 189,
        description: 'Spicy noodles tossed in zesty schezwan pepper sauce with fresh spring onions.',
        isPopular: true,
        preferredAssetKeywords: ['schezwan noodles'],
      },
      {
        name: 'Singapore Noodles',
        halfPrice: 110,
        fullPrice: 199,
        description: 'Thin vermicelli noodles seasoned with mild aromatic curry spices and fresh julienne vegetables.',
        preferredAssetKeywords: ['singapore noodles'],
      },
      {
        name: 'Capsicum Noodles',
        halfPrice: 99,
        fullPrice: 189,
        description: 'Flavorful stir-fried noodles dominated by sweet green and yellow capsicum and garlic.',
        preferredAssetKeywords: ['capsicum noodles'],
      },
      {
        name: 'Chilli Garlic Noodles',
        halfPrice: 79,
        fullPrice: 149,
        description: 'Aromatic noodles infused with roasted garlic, cracked red chillies, and scallions.',
        preferredAssetKeywords: ['chilli garlic noodles'],
      },
      {
        name: 'Chilli Garlic Paneer Noodles',
        halfPrice: 89,
        fullPrice: 169,
        description: 'Our top noodle dish: spicy chilli garlic noodles topped with golden tossed paneer.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['chilli garlic paneer noodles', 'paneer noodles'],
      },
    ],
  },
  {
    name: 'Burger',
    sortOrder: 6,
    items: [
      {
        name: 'Veg Burger',
        price: 59,
        description: 'Golden spiced potato-herb patty inside a toasted sesame seed bun with lettuce, tomatoes, and mayo.',
        preferredAssetKeywords: ['spicy-jalapeno-veggie-burger', 'veg burger'],
        canonicalSearchName: 'spicy jalapeno veggie burger',
      },
      {
        name: 'Paneer Burger',
        price: 79,
        description: 'Crispy herb-crusted paneer steak with tangy burger sauce, sliced onions, and crisp lettuce.',
        preferredAssetKeywords: ['paneer-tikka-burger', 'paneer burger'],
        canonicalSearchName: 'paneer burger',
      },
      {
        name: 'Cheese Burger',
        price: 89,
        description: 'Classic veggie burger enriched with a thick slice of melted cheese and creamy dressing.',
        isPopular: true,
        preferredAssetKeywords: ['mexican-cheese-burger', 'cheese burger'],
        canonicalSearchName: 'mexican cheese burger',
      },
      {
        name: 'Paneer Cheese Burger',
        price: 99,
        description: 'Delicious pairing of crunchy paneer patty and melted cheddar cheese with smoky chipotle sauce.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['paneer cheese burger', 'double cheese burger'],
      },
      {
        name: 'Paneer Corn Burger',
        price: 109,
        description: 'Premium burger featuring spiced paneer patty topped with sweet golden corn and creamy garlic aioli.',
        preferredAssetKeywords: ['paneer corn burger'],
      },
    ],
  },
  {
    name: 'Pasta / Macaroni',
    sortOrder: 7,
    items: [
      {
        name: 'Red Sauce Pasta',
        halfPrice: 69,
        fullPrice: 129,
        description: 'Penne pasta tossed in tangy slow-cooked Italian tomato-basil marinara with oregano and olive oil.',
        isPopular: true,
        preferredAssetKeywords: ['arrabbiata', 'red sauce pasta'],
      },
      {
        name: 'White Sauce Pasta',
        halfPrice: 79,
        fullPrice: 149,
        description: 'Al dente penne bathed in rich velvety garlic béchamel cream sauce with sweet corn and olives.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['white-sauce-pasta', 'white sauce'],
        canonicalSearchName: 'white sauce pasta',
      },
      {
        name: 'Peri Peri Sauce Pasta',
        halfPrice: 79,
        fullPrice: 149,
        description: 'Spicy fusion penne pasta tossed in fiery peri-peri herb sauce and cream.',
        preferredAssetKeywords: ['peri peri pasta', 'spicy pasta'],
      },
      {
        name: 'Classic Pasta',
        halfPrice: 99,
        fullPrice: 189,
        description: 'Chef special pasta cooked with mixed bell peppers, mushrooms, herbs, and imported olive oil.',
        preferredAssetKeywords: ['classic-penne-alfredo', 'classic pasta'],
        canonicalSearchName: 'classic penne alfredo',
      },
      {
        name: 'Indian Style Macaroni',
        halfPrice: 49,
        fullPrice: 89,
        description: 'Nostalgic street-style desi macaroni tossed with onions, tomatoes, green chillies, and garam masala.',
        isPopular: true,
        preferredAssetKeywords: ['mac-n-cheese-pasta', 'macaroni'],
        canonicalSearchName: 'mac-n-cheese pasta',
      },
      {
        name: 'Chilli Sauce Pasta',
        halfPrice: 69,
        fullPrice: 129,
        description: 'Fiery Indo-Chinese fusion pasta tossed in red chilli garlic sauce with crunchy capsicum.',
        preferredAssetKeywords: ['chilli sauce pasta'],
      },
    ],
  },
  {
    name: 'Starters',
    sortOrder: 8,
    items: [
      {
        name: 'French Fries',
        halfPrice: 69,
        description: 'Golden crispy potato fries lightly salted, served with tomato ketchup and garlic dip.',
        preferredAssetKeywords: ['french-fries', 'fries'],
      },
      {
        name: 'French Fries Masala',
        halfPrice: 79,
        description: 'Crispy golden fries tossed in our signature blend of spicy chaat masala and herbs.',
        isPopular: true,
        preferredAssetKeywords: ['masala-french-fries', 'masala fries'],
        canonicalSearchName: 'masala french fries',
      },
      {
        name: 'Cheese Balls (8 pcs)',
        price: 99,
        description: 'Crisp golden breadcrumb balls with a molten cheesy mozzarella and herb center.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['cheese balls', 'paneer-malai-tikka'],
      },
      {
        name: 'Paneer Balls (8 pcs)',
        price: 99,
        description: 'Savory fried dumplings made of fresh spiced cottage cheese and potatoes.',
        preferredAssetKeywords: ['paneer balls', 'paneer-tikka'],
      },
      {
        name: 'Baby Corn Balls (8 pcs)',
        price: 100,
        description: 'Crunchy battered balls stuffed with tender baby corn and herbs.',
        preferredAssetKeywords: ['baby corn balls', 'paneer-hariyali-tikka'],
      },
      {
        name: 'Spring Rolls (8 pcs)',
        price: 79,
        description: 'Crisp oriental rolls filled with shredded stir-fried cabbage, carrots, and glass noodles.',
        isPopular: true,
        preferredAssetKeywords: ['spring rolls', 'grilled-paneer-tortilla-5bcf321f'],
      },
      {
        name: 'Noodles Roll (8 pcs)',
        price: 89,
        description: 'Crispy spring roll wrappers packed with seasoned Hakka noodles and spring onions.',
        preferredAssetKeywords: ['noodles roll', 'grilled-paneer-tortilla-wrap'],
      },
      {
        name: 'Paneer Roll (8 pcs)',
        price: 99,
        description: 'Golden fried rolls filled with spiced cottage cheese cubes and tangy mint dip.',
        preferredAssetKeywords: ['paneer roll', 'grilled-paneer-tortilla'],
      },
      {
        name: 'Honey Chilli Potato',
        halfPrice: 89,
        fullPrice: 149,
        description: 'Crispy potato fingers glazed in sweet honey, fiery red chilli sauce, and toasted sesame seeds.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['honey chilli potato', 'chilli potato'],
      },
      {
        name: 'Chilli Potato',
        halfPrice: 69,
        fullPrice: 110,
        description: 'Wok-tossed crispy potato wedges with diced onions, green chillies, and spicy soy garlic glaze.',
        preferredAssetKeywords: ['peri-peri-cheese-fries', 'chilli potato'],
      },
      {
        name: 'Fried Paneer',
        price: 149,
        description: 'Golden shallow-fried fresh cottage cheese cubes seasoned with black salt and chaat spices.',
        preferredAssetKeywords: ['fried paneer', 'paneer-achari-tikka'],
      },
      {
        name: 'Paneer 65',
        price: 149,
        description: 'Crispy South Indian style paneer starter tempered with fresh curry leaves, mustard seeds, and curd.',
        chefRecommended: true,
        preferredAssetKeywords: ['paneer 65'],
      },
      {
        name: 'Mushroom 65',
        price: 169,
        description: 'Crispy fried button mushrooms coated in a spicy red batter with curry leaves and green chillies.',
        preferredAssetKeywords: ['mushroom 65'],
      },
    ],
  },
  {
    name: 'Momo',
    sortOrder: 9,
    items: [
      {
        name: 'Veg Momo',
        halfPrice: 40,
        fullPrice: 79,
        description: 'Traditional Tibetan steamed dumplings filled with finely minced cabbage, carrots, onions, and spices.',
        preferredAssetKeywords: ['veg momo', 'steamed momo'],
      },
      {
        name: 'Paneer Momo',
        halfPrice: 69,
        fullPrice: 129,
        description: 'Delicate steamed dumplings stuffed with spiced cottage cheese and herbs, served with fiery red chutney.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['paneer-momos', 'paneer momo'],
        canonicalSearchName: 'paneer momos',
      },
      {
        name: 'Baby Corn Momo',
        halfPrice: 89,
        fullPrice: 179,
        description: 'Steamed momos filled with finely diced crunchy baby corn, spring onions, and oriental seasoning.',
        preferredAssetKeywords: ['baby corn momo'],
      },
    ],
  },
  {
    name: 'Fried Momo',
    sortOrder: 10,
    items: [
      {
        name: 'Fried Veg Momo',
        halfPrice: 59,
        fullPrice: 89,
        description: 'Crispy deep-fried vegetable dumplings with a crunchy outer shell and juicy vegetable filling.',
        isPopular: true,
        preferredAssetKeywords: ['fried veg momo', 'fried momo'],
      },
      {
        name: 'Fried Paneer Momo',
        halfPrice: 79,
        fullPrice: 139,
        description: 'Deep-fried golden paneer momos served piping hot with spicy red chilli garlic sauce and mayonnaise.',
        chefRecommended: true,
        preferredAssetKeywords: ['fried paneer momo'],
      },
      {
        name: 'Fried Baby Corn Momo',
        halfPrice: 89,
        fullPrice: 189,
        description: 'Crispy fried momos stuffed with spiced baby corn and scallions.',
        preferredAssetKeywords: ['fried baby corn momo'],
      },
    ],
  },
  {
    name: 'Tea / Chai',
    sortOrder: 11,
    items: [
      {
        name: 'Regular Tea',
        price: 20,
        description: 'Freshly brewed aromatic milk tea infused with crushed ginger and cardamom.',
        isPopular: true,
        preferredAssetKeywords: ['masala-tea', 'tea', 'chai'],
        canonicalSearchName: 'masala tea',
      },
      {
        name: 'Green Tea',
        price: 25,
        description: 'Soothing organic green tea leaves steeped to perfection with gentle antioxidant notes.',
        preferredAssetKeywords: ['green tea'],
      },
      {
        name: 'Lemon Tea',
        price: 25,
        description: 'Refreshing black tea brewed with fresh lemon juice, honey, and a hint of mint.',
        preferredAssetKeywords: ['peach-iced-tea', 'lemon tea'],
      },
    ],
  },
  {
    name: 'Coffee',
    sortOrder: 12,
    items: [
      {
        name: 'Hot Coffee',
        price: 30,
        description: 'Classic comforting hot coffee whipped frothy with hot milk and roasted beans.',
        preferredAssetKeywords: ['cappuccino', 'hot coffee'],
        canonicalSearchName: 'cappuccino',
      },
      {
        name: 'Cold Coffee',
        price: 69,
        description: 'Chilled creamy blended coffee with rich milk, chocolate drizzle, and vanilla ice cream.',
        isPopular: true,
        preferredAssetKeywords: ['cold coffee', 'iced coffee'],
      },
      {
        name: 'Chocolate Cold Coffee',
        price: 99,
        description: 'Decadent chilled coffee blended with rich chocolate fudge sauce and topped with chocolate curls.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['oreo-shake', 'chocolate cold coffee'],
        canonicalSearchName: 'oreo milkshake',
      },
      {
        name: 'Hazelnut Hot Coffee',
        price: 40,
        description: 'Steaming hot coffee scented with toasted hazelnut syrup and warm frothed milk.',
        preferredAssetKeywords: ['hazelnut hot coffee'],
      },
      {
        name: 'Hazelnut Cold Coffee',
        price: 99,
        description: 'Our bestseller: chilled thick coffee blended with premium roasted hazelnut extract and whipped cream.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['hazelnut-cold-coffee', 'hazelnut cold coffee'],
        canonicalSearchName: 'hazelnut cold coffee',
      },
      {
        name: 'Vanilla Hot Coffee',
        price: 40,
        description: 'Smooth hot espresso and milk infused with delicate Madagascar vanilla essence.',
        preferredAssetKeywords: ['vanilla hot coffee'],
      },
      {
        name: 'Vanilla Cold Coffee',
        price: 99,
        description: 'Frosty blended cold coffee infused with rich vanilla syrup and a scoop of vanilla gelato.',
        preferredAssetKeywords: ['vanilla cold coffee'],
      },
      {
        name: 'Butterscotch Hot Coffee',
        price: 40,
        description: 'Warm coffee swirled with golden butterscotch caramel and topped with a creamy head.',
        preferredAssetKeywords: ['butterscotch hot coffee'],
      },
      {
        name: 'Butterscotch Cold Coffee',
        price: 99,
        description: 'Thick iced coffee with sweet buttery caramel crunch and chilled milk.',
        preferredAssetKeywords: ['brownie-frappe', 'butterscotch cold coffee'],
        canonicalSearchName: 'brownie frappe',
      },
      {
        name: 'Black Coffee',
        price: 20,
        description: 'Bold unsweetened black coffee brewed from dark roasted Arabica beans.',
        preferredAssetKeywords: ['cranberry-coffee', 'black coffee'],
        canonicalSearchName: 'cranberry coffee',
      },
      {
        name: 'Honey Black Coffee',
        price: 25,
        description: 'Clean dark roast black coffee sweetened naturally with pure wild honey.',
        preferredAssetKeywords: ['honey black coffee'],
      },
    ],
  },
  {
    name: 'Drinks',
    sortOrder: 13,
    items: [
      {
        name: 'Soft Drinks',
        price: 30,
        description: 'Chilled bottled sodas and carbonated beverages served ice cold.',
        preferredAssetKeywords: ['blue-ocean', 'soft drinks'],
        canonicalSearchName: 'blue ocean',
      },
      {
        name: 'Masala Cola',
        price: 49,
        description: 'Fizzy cola poured over ice with roasted cumin, rock salt, lime juice, and fresh mint.',
        isPopular: true,
        preferredAssetKeywords: ['masala-coke', 'masala cola'],
      },
      {
        name: 'Masala Soda',
        price: 59,
        description: 'Zesty lemon soda tempered with chatpata masala, black salt, and muddled mint leaves.',
        preferredAssetKeywords: ['fresh-lime-soda', 'masala soda'],
      },
      {
        name: 'Orange Mint',
        price: 79,
        description: 'Refreshing citrus mocktail with freshly muddled mint, orange reduction, and sparkling soda.',
        chefRecommended: true,
        preferredAssetKeywords: ['mint-mojito', 'orange mint'],
        canonicalSearchName: 'classic mint mojito',
      },
      {
        name: 'Watermelon Mint',
        price: 79,
        description: 'Fresh watermelon juice muddled with garden mint leaves and sparkling soda over crushed ice.',
        isPopular: true,
        preferredAssetKeywords: ['watermelon-mojito', 'watermelon mint'],
        canonicalSearchName: 'watermelon mojito',
      },
    ],
  },
  {
    name: 'Soup',
    sortOrder: 14,
    items: [
      {
        name: 'Tomato Soup',
        price: 49,
        description: 'Velvety cream of fresh ripe tomatoes topped with crunchy butter-toasted croutons and herbs.',
        isPopular: true,
        preferredAssetKeywords: ['tomato soup', 'soup'],
      },
      {
        name: 'Hot and Sour Soup',
        price: 59,
        description: 'Fiery and tangy Indo-Chinese broth loaded with mushrooms, shredded vegetables, and white pepper.',
        preferredAssetKeywords: ['hot and sour soup'],
      },
      {
        name: 'Peking Soup',
        price: 69,
        description: 'Classic thick Chinese soup with balanced spicy vinegar undertones and shredded veggies.',
        preferredAssetKeywords: ['peking soup'],
      },
      {
        name: 'Manchow Soup',
        price: 79,
        description: 'Popular dark garlic-ginger Chinese soup served with generous crispy fried noodles on top.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['manchow soup'],
      },
      {
        name: 'Sweet Corn Soup',
        price: 89,
        description: 'Mild, comforting soup packed with sweet golden corn kernels and tender garden vegetables.',
        preferredAssetKeywords: ['sweet corn soup'],
      },
    ],
  },
  {
    name: 'Smoothie',
    sortOrder: 15,
    items: [
      {
        name: 'Banana Smoothie',
        price: 100,
        description: 'Ripe Cavendish bananas blended thick with creamy chilled milk and a hint of honey.',
        preferredAssetKeywords: ['cookies and cream', 'banana smoothie'],
      },
      {
        name: 'Banana Oats Smoothie',
        price: 110,
        description: 'Wholesome nutritious smoothie made with rolled oats, sweet bananas, and almond milk.',
        preferredAssetKeywords: ['banana oats smoothie'],
      },
      {
        name: 'Banana Chocolate Smoothie',
        price: 130,
        description: 'Rich blend of ripe banana, dark cocoa, chocolate fudge, and creamy milk.',
        chefRecommended: true,
        isPopular: true,
        preferredAssetKeywords: ['strawberry-shake', 'chocolate smoothie'],
      },
      {
        name: 'Oats Smoothie',
        price: 90,
        description: 'Light and revitalizing smoothie made with toasted oats, yogurt, honey, and cinnamon.',
        preferredAssetKeywords: ['oats smoothie'],
      },
    ],
  },
];

export async function seedCuteAndCupDemo() {
  console.log('🍵 Seeding Cute & Cup Founder Demo Restaurant...');

  // 1. Upsert Restaurant
  // We link to existing cute-and-cup-demo record if present or create under slug 'cute-and-cup'
  const existingRest = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { slug: CUTE_AND_CUP_SLUG },
        { slug: 'cute-and-cup-demo' },
      ],
    },
  });

  const restaurantData = {
    slug: CUTE_AND_CUP_SLUG,
    displayName: 'Cute & Cup',
    description: 'Vegetarian Chinese cuisine, momos, noodles, artisanal chai, cold coffee, and handcrafted cafe treats.',
    country: 'IN',
    city: 'Bhopal',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    address: 'Cute & Cup Cafe, College Road',
    phone: '+91 98765 43210',
    coverUrl: '/images/cute-and-cup-banner.jpg',
    logoUrl: '/images/cute-and-cup-banner.jpg',
    publicationState: PublicationState.PUBLISHED,
    isClaimed: false,
    organizationId: null,
  };

  const restaurant = existingRest
    ? await prisma.restaurant.update({
        where: { id: existingRest.id },
        data: restaurantData,
      })
    : await prisma.restaurant.create({
        data: restaurantData,
      });

  console.log(`📍 Restaurant ready: ${restaurant.displayName} (${restaurant.id}, slug: ${restaurant.slug})`);

  // 2. Scoped Brand Theme (Warm Editorial dark bistro cafe matching the bamboo hut, fairy lights & warm banner)
  await prisma.restaurantTheme.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      presetKey: ThemePreset.CUSTOM,
      backgroundColor: '#0E0C0A',
      surfaceColor: '#1A1613',
      primaryTextColor: '#FDF8F0',
      secondaryTextColor: '#BFA89B',
      accentColor: '#F59E0B',
      secondaryAccentColor: '#D97706',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: LayoutMode.GRID,
      cardRadius: '16px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'none',
      isPublished: true,
    },
    create: {
      restaurantId: restaurant.id,
      presetKey: ThemePreset.CUSTOM,
      backgroundColor: '#0E0C0A',
      surfaceColor: '#1A1613',
      primaryTextColor: '#FDF8F0',
      secondaryTextColor: '#BFA89B',
      accentColor: '#F59E0B',
      secondaryAccentColor: '#D97706',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Plus Jakarta Sans',
      layoutMode: LayoutMode.GRID,
      cardRadius: '16px',
      buttonStyle: 'pill',
      imageProportions: 'square',
      texture: 'none',
      isPublished: true,
    },
  });

  // 3. Restaurant Settings
  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      welcomeMessage:
        'Welcome to Cute & Cup! Explore our vegetarian Chinese cuisine, momos, noodles, chai, and handcrafted shakes.',
      aiTone: 'warm, welcoming, friendly, passionate about Chinese cuisine, momos, and cafe beverages',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 25,
    },
    create: {
      restaurantId: restaurant.id,
      welcomeMessage:
        'Welcome to Cute & Cup! Explore our vegetarian Chinese cuisine, momos, noodles, chai, and handcrafted shakes.',
      aiTone: 'warm, welcoming, friendly, passionate about Chinese cuisine, momos, and cafe beverages',
      allowDinerChat: true,
      allowPairings: true,
      maxDinerChatPerSession: 25,
    },
  });

  // 4. Ordering Settings
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
        demoNotice: 'Demo menu for Cute & Cup — orders placed here appear live on the management portal.',
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
        demoNotice: 'Demo menu for Cute & Cup — orders placed here appear live on the management portal.',
        showLogo: true,
      },
    },
  });

  // 5. Seed Tables 1..8
  for (let i = 1; i <= 8; i++) {
    const rawTableToken = `cute-and-cup-table-${i}`;
    const qrTokenHash = crypto.createHash('sha256').update(rawTableToken).digest('hex');
    await prisma.restaurantTable.upsert({
      where: {
        restaurantId_name: {
          restaurantId: restaurant.id,
          name: `Table ${i}`,
        },
      },
      update: {
        section: 'Main Cafe',
        capacity: 4,
        qrTokenHash,
        isActive: true,
      },
      create: {
        restaurantId: restaurant.id,
        name: `Table ${i}`,
        section: 'Main Cafe',
        capacity: 4,
        qrTokenHash,
        isActive: true,
      },
    });
  }

  // 6. Claim Request for Founder Demo
  const claimTokenHash = crypto.createHash('sha256').update(CUTE_AND_CUP_CLAIM_TOKEN).digest('hex');
  await prisma.claimRequest.upsert({
    where: { claimTokenHash },
    update: {
      restaurantId: restaurant.id,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      verificationNotes: 'Founder demo claim token for Cute & Cup cafe.',
    },
    create: {
      restaurantId: restaurant.id,
      claimTokenHash,
      status: ClaimStatus.UNCLAIMED,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      verificationNotes: 'Founder demo claim token for Cute & Cup cafe.',
    },
  });

  // 7. Menu Setup
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

  // 8. Delete existing categories cleanly
  await prisma.menuCategory.deleteMany({
    where: { menuId: menu.id },
  });

  // 9. Load all matchable food assets and canonical dishes
  const allAssets = await prisma.asset.findMany({
    where: {
      OR: [
        { storageKey: { contains: 'canonical' } },
        { publicUrl: { contains: 'canonical' } },
      ],
    },
    select: {
      id: true,
      storageKey: true,
      publicUrl: true,
      prompt: true,
    },
  });

  const canonicalDishes = await prisma.canonicalDish.findMany({
    select: {
      id: true,
      normalizedName: true,
      imageAssetId: true,
      imageAsset: {
        select: {
          id: true,
          publicUrl: true,
          storageKey: true,
        },
      },
    },
  });

  // Track used asset IDs and URLs to STRICTLY guarantee:
  // "no two items should have the same image"
  const usedAssetIds = new Set<string>();
  const usedPublicUrls = new Set<string>();

  function tryAssignAsset(asset: { id: string; storageKey: string; publicUrl: string } | null | undefined): string | null {
    if (!asset) return null;
    if (usedAssetIds.has(asset.id) || usedPublicUrls.has(asset.publicUrl)) {
      return null;
    }
    usedAssetIds.add(asset.id);
    usedPublicUrls.add(asset.publicUrl);
    return asset.id;
  }

  function findUniqueAssetForDish(itemDef: RawItemDef): { assetId: string | null; canonicalId: string | null } {
    let assignedAssetId: string | null = null;
    let assignedCanonicalId: string | null = null;

    // 1. Try canonicalDish match first
    if (itemDef.canonicalSearchName) {
      const canonicalMatch = canonicalDishes.find((c) =>
        c.normalizedName.toLowerCase() === itemDef.canonicalSearchName!.toLowerCase()
      );
      if (canonicalMatch) {
        assignedCanonicalId = canonicalMatch.id;
        if (canonicalMatch.imageAsset) {
          const assigned = tryAssignAsset(canonicalMatch.imageAsset);
          if (assigned) {
            assignedAssetId = assigned;
            return { assetId: assignedAssetId, canonicalId: assignedCanonicalId };
          }
        }
      }
    }

    // 2. Try preferred keywords in storageKey or prompt
    if (itemDef.preferredAssetKeywords && itemDef.preferredAssetKeywords.length > 0) {
      for (const kw of itemDef.preferredAssetKeywords) {
        const lowerKw = kw.toLowerCase();
        const candidate = allAssets.find((a) => {
          if (usedAssetIds.has(a.id) || usedPublicUrls.has(a.publicUrl)) return false;
          const keyMatch = a.storageKey.toLowerCase().includes(lowerKw);
          const promptMatch = a.prompt ? a.prompt.toLowerCase().includes(lowerKw) : false;
          return keyMatch || promptMatch;
        });

        if (candidate) {
          const assigned = tryAssignAsset(candidate);
          if (assigned) {
            assignedAssetId = assigned;
            break;
          }
        }
      }
    }

    // 3. Try exact dish name keywords
    if (!assignedAssetId) {
      const words = itemDef.name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !['gravy', 'full', 'half', 'plate'].includes(w));

      for (const word of words) {
        const candidate = allAssets.find((a) => {
          if (usedAssetIds.has(a.id) || usedPublicUrls.has(a.publicUrl)) return false;
          return (
            a.storageKey.toLowerCase().includes(word) ||
            (a.prompt && a.prompt.toLowerCase().includes(word))
          );
        });

        if (candidate) {
          const assigned = tryAssignAsset(candidate);
          if (assigned) {
            assignedAssetId = assigned;
            break;
          }
        }
      }
    }

    return { assetId: assignedAssetId, canonicalId: assignedCanonicalId };
  }

  // 10. Seed Categories, Items, and Variants
  let totalDishes = 0;
  let dishesWithImages = 0;
  let totalVariants = 0;

  for (const catData of CUTE_AND_CUP_MENU) {
    const category = await prisma.menuCategory.create({
      data: {
        menuId: menu.id,
        name: catData.name,
        sortOrder: catData.sortOrder,
      },
    });

    for (let idx = 0; idx < catData.items.length; idx++) {
      const itemDef = catData.items[idx];

      const { assetId, canonicalId } = findUniqueAssetForDish(itemDef);
      if (assetId) {
        dishesWithImages++;
      }

      // Base price in minor units (paise)
      let basePriceMinor: number;
      let hasHalfFullVariants = false;
      let fullSupplementalPriceMinor = 0;

      if (itemDef.halfPrice != null && itemDef.fullPrice != null) {
        basePriceMinor = itemDef.halfPrice * 100;
        hasHalfFullVariants = true;
        fullSupplementalPriceMinor = (itemDef.fullPrice - itemDef.halfPrice) * 100;
      } else if (itemDef.halfPrice != null) {
        basePriceMinor = itemDef.halfPrice * 100;
      } else if (itemDef.fullPrice != null) {
        basePriceMinor = itemDef.fullPrice * 100;
      } else if (itemDef.price != null) {
        basePriceMinor = itemDef.price * 100;
      } else {
        basePriceMinor = 5900;
      }

      const portionSize = hasHalfFullVariants
        ? 'Half / Full'
        : itemDef.halfPrice != null
        ? 'Half'
        : itemDef.fullPrice != null
        ? 'Full'
        : null;

      const menuItem = await prisma.restaurantMenuItem.create({
        data: {
          restaurantId: restaurant.id,
          menuId: menu.id,
          categoryId: category.id,
          canonicalId: canonicalId || null,
          imageOverrideAssetId: assetId || null,
          customName: itemDef.name,
          restaurantDescription: itemDef.description,
          priceMinor: basePriceMinor,
          currency: 'INR',
          portionSize,
          dietaryStatus: ['VEGETARIAN'],
          nutritionSource: NutritionSource.NOT_PROVIDED,
          isAvailable: true,
          isPublished: true,
          chefRecommended: Boolean(itemDef.chefRecommended),
          isPopular: Boolean(itemDef.isPopular),
          sortOrder: idx + 1,
        },
      });

      totalDishes++;

      // Seed Half / Full portion variants if present
      if (hasHalfFullVariants) {
        await prisma.dishVariant.create({
          data: {
            menuItemId: menuItem.id,
            name: 'Full',
            choiceGroup: 'Portion',
            supplementalPriceMinor: fullSupplementalPriceMinor,
            isRequired: false,
            sortOrder: 1,
          },
        });
        totalVariants++;
      }
    }
  }

  // 11. Bust diner menu caches for both slugs
  const cache = getCache();
  await Promise.all([
    cache.del(`menu:slug:${CUTE_AND_CUP_SLUG}`),
    cache.del('menu:slug:cute-and-cup-demo'),
  ]).catch(() => {});

  console.log(`\n🎉 Seed Complete for Cute & Cup!`);
  console.log(`📊 Categories: ${CUTE_AND_CUP_MENU.length}`);
  console.log(`🍛 Total Dishes: ${totalDishes}`);
  console.log(`🖼️ Dishes with Unique Canonical Images: ${dishesWithImages} (Unique Assets Used: ${usedAssetIds.size})`);
  console.log(`⚖️ Dishes with Half/Full Variants: ${totalVariants}`);
  console.log(`🔑 Claim Token: ${CUTE_AND_CUP_CLAIM_TOKEN}`);
  console.log(`🌐 Diner Link: /m/${CUTE_AND_CUP_SLUG}`);
  console.log(`🎟️ Claim Link: /claim/${CUTE_AND_CUP_CLAIM_TOKEN}`);

  return {
    restaurantId: restaurant.id,
    slug: restaurant.slug,
    categoriesCount: CUTE_AND_CUP_MENU.length,
    itemsCount: totalDishes,
    imagesAssigned: dishesWithImages,
    uniqueAssetIds: usedAssetIds.size,
    claimToken: CUTE_AND_CUP_CLAIM_TOKEN,
  };
}

if (require.main === module || process.argv[1]?.endsWith('seed-cute-and-cup.ts')) {
  seedCuteAndCupDemo()
    .catch((err) => {
      console.error('❌ Error seeding Cute & Cup demo:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
