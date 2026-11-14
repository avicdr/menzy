import type { CanonicalCatalogItem } from '../types';

export const CAFE_SPECIALTIES_CATALOG: CanonicalCatalogItem[] = [
  {
    normalizedName: 'hazelnut cold coffee',
    displayName: 'Hazelnut Cold Coffee',
    category: 'Cold Coffee',
    cuisine: 'Café / Beverages',
    generalizedDescription:
      'Chilled rich coffee blended with milk, roasted hazelnut syrup, and ice, crowned with whipped cream and crushed hazelnuts.',
    visualPrompt:
      'chilled tall faceted glass of Hazelnut Cold Coffee swirled with creamy milk and coffee layers, crowned with whipped cream, chocolate drizzle, and crushed hazelnuts on a wooden tabletop',
    aliases: [
      'hazelnut cold coffee',
      'iced hazelnut coffee',
      'hazelnut frappe',
      'hazelnut iced latte',
      'cold coffee hazelnut',
    ],
    estimatedNutrition: { calories: 240, protein: 5, carbs: 32, fat: 10, servingGrams: 350 },
  },
  {
    normalizedName: 'oreo shake',
    displayName: 'Oreo Shake',
    category: 'Shakes',
    cuisine: 'Dessert / Shakes',
    generalizedDescription:
      'Creamy thick milkshake blended with vanilla ice cream and crunchy Oreo cookies, topped with whipped cream, chocolate drizzle, and an Oreo cookie.',
    visualPrompt:
      'tall ribbed glass of thick Oreo Shake with dark chocolate drizzles down the glass, crowned with fluffy whipped cream, chocolate cookie crumbs, and a whole Oreo cookie on a dark slate board',
    aliases: [
      'oreo shake',
      'oreo milkshake',
      'cookies and cream shake',
      'oreo thick shake',
      'chocolate oreo shake',
    ],
    estimatedNutrition: { calories: 380, protein: 7, carbs: 54, fat: 16, servingGrams: 380 },
  },
  {
    normalizedName: 'mint mojito',
    displayName: 'Mint Mojito',
    category: 'Mojitos',
    cuisine: 'Beverages / Mocktails',
    generalizedDescription:
      'Crisp, effervescent mocktail with muddled fresh mint leaves, zesty lime wedges, simple syrup, and sparkling soda over crushed ice.',
    visualPrompt:
      'tall crystal highball glass of sparkling Mint Mojito packed with crushed ice, lime wheels, and vibrant emerald mint sprigs with fizzing bubbles on a terrazzo tabletop',
    aliases: [
      'mint mojito',
      'classic mint mojito',
      'virgin mint mojito',
      'lime mint cooler',
      'fresh mint mojito',
    ],
    estimatedNutrition: { calories: 95, protein: 0.5, carbs: 24, fat: 0, servingGrams: 300 },
  },
  {
    normalizedName: 'white sauce pasta',
    displayName: 'White Sauce Pasta',
    category: 'Pasta',
    cuisine: 'Italian / Continental',
    generalizedDescription:
      'Al dente penne pasta tossed in a rich, velvety garlic béchamel white sauce with sweet corn, bell peppers, sliced black olives, and herbs, served with toasted garlic bread.',
    visualPrompt:
      'wide dark ceramic shallow bowl of creamy White Sauce Penne Pasta with black olives, sweet corn, diced red and yellow bell peppers, shaved cheese, and golden toasted garlic bread slices',
    aliases: [
      'white sauce pasta',
      'alfredo pasta',
      'creamy white sauce penne',
      'penne alfredo',
      'cheese white sauce pasta',
      'veg white sauce pasta',
    ],
    estimatedNutrition: { calories: 480, protein: 14, carbs: 62, fat: 20, servingGrams: 360 },
  },
  {
    normalizedName: 'grilled paneer tortilla',
    displayName: 'Grilled Paneer Tortilla',
    category: 'Wraps',
    cuisine: 'Fusion / Mexican',
    generalizedDescription:
      'Toasted flour tortilla wrap filled with spiced marinated grilled paneer cubes, crunchy peppers, onions, shredded lettuce, and chipotle mayo sauce.',
    visualPrompt:
      'halved Grilled Paneer Tortilla wrap showing savory spiced golden paneer cubes, crisp bell peppers, and creamy sauce filling with char grill marks on a black stone platter with dipping cup',
    aliases: [
      'grilled paneer tortilla',
      'paneer tortilla wrap',
      'paneer wrap',
      'grilled paneer roll',
      'paneer burrito wrap',
      'mexican paneer wrap',
    ],
    estimatedNutrition: { calories: 420, protein: 18, carbs: 45, fat: 18, servingGrams: 280 },
  },
  {
    normalizedName: 'paneer momos',
    displayName: 'Paneer Momos',
    category: 'Momos',
    cuisine: 'Tibetan / Himalayan',
    generalizedDescription:
      'Delicately pleated steamed dumplings stuffed with seasoned spiced cottage cheese, minced vegetables, and herbs, served with fiery red chutney and creamy mayo.',
    visualPrompt:
      'circular ceramic plate of six hand-pleated Steamed Paneer Momos sprinkled with toasted sesame seeds and fresh coriander, with a central ramekin of spicy red chilli chutney and creamy mayo',
    aliases: [
      'paneer momos',
      'steamed paneer momos',
      'cottage cheese momos',
      'veg paneer dumplings',
      'paneer dim sum',
    ],
    estimatedNutrition: { calories: 310, protein: 13, carbs: 38, fat: 12, servingGrams: 220 },
  },
  {
    normalizedName: 'grilled paneer cheese sandwich',
    displayName: 'Grilled Paneer Cheese Sandwich',
    category: 'Sandwiches',
    cuisine: 'Café / Indian Snack',
    generalizedDescription:
      'Golden-toasted bread layered with spiced paneer cubes, melted mozzarella cheese, sweet corn, and crisp capsicum, served with mint chutney and ketchup.',
    visualPrompt:
      'diagonal halves of a golden crisp Grilled Paneer Cheese Sandwich with melted gooey cheese stretch, spiced paneer cubes, and corn on a rustic wooden paddle with green chutney and ketchup bowls',
    aliases: [
      'grilled paneer cheese sandwich',
      'paneer cheese sandwich',
      'paneer grilled sandwich',
      'cheese paneer sandwich',
      'toasted paneer sandwich',
    ],
    estimatedNutrition: { calories: 440, protein: 17, carbs: 48, fat: 20, servingGrams: 260 },
  },
  {
    normalizedName: 'masala french fries',
    displayName: 'Masala French Fries',
    category: 'Snacks',
    cuisine: 'Fast Food / Finger Food',
    generalizedDescription:
      'Crispy golden potato fries tossed in a zesty peri-peri and chaat masala spice blend with fresh herbs, served with a creamy dipping sauce.',
    visualPrompt:
      'heap of crispy golden Masala French Fries dusted with bright orange-red spice seasoning and finely chopped cilantro on a round slate platter with a small bowl of creamy garlic dip',
    aliases: [
      'masala french fries',
      'masala fries',
      'peri peri fries',
      'spicy fries',
      'seasoned fries',
      'chatpata fries',
    ],
    estimatedNutrition: { calories: 340, protein: 4, carbs: 46, fat: 16, servingGrams: 200 },
  },
  {
    normalizedName: 'double cheese pizza',
    displayName: 'Double Cheese Pizza',
    category: 'Pizza',
    cuisine: 'Italian / Pizza',
    generalizedDescription:
      'Hand-stretched pizza topped with herb tomato sauce and an abundant double layer of bubbling mozzarella and cheddar cheese, sweet corn, and crisp peppers.',
    visualPrompt:
      'hot baked Double Cheese Pizza sliced on a dark wooden peel with generous melted cheese pull, bell peppers, corn kernels, and oregano seasoning on baking parchment',
    aliases: [
      'double cheese pizza',
      'cheese burst pizza',
      'double cheese margherita',
      'extra cheese pizza',
      'two cheese pizza',
    ],
    estimatedNutrition: { calories: 680, protein: 28, carbs: 74, fat: 30, servingGrams: 350 },
  },
  {
    normalizedName: 'bun makhan masala with masala tea',
    displayName: 'Bun Makhan (Masala) with Masala Tea',
    category: 'Tea & Bun',
    cuisine: 'Irani Café / Indian Street Food',
    generalizedDescription:
      'A soft toasted bakery bun slathered with generous white butter and special chaat spices, paired with a hot glass of aromatic spiced masala chai.',
    visualPrompt:
      'soft split round bun spread thick with melting white butter and spiced seasoning on a vintage brass plate, accompanied by a steaming glass of spiced cutting masala chai on a rustic wooden table with whole spices',
    aliases: [
      'bun makhan masala with masala tea',
      'bun makhan and tea',
      'bun maska chai',
      'bun maska with masala chai',
      'irani bun maska chai',
      'bun makhan',
    ],
    estimatedNutrition: { calories: 390, protein: 7, carbs: 48, fat: 19, servingGrams: 300 },
  },
  {
    normalizedName: 'cheese maggi',
    displayName: 'Cheese Maggi',
    category: 'Maggi',
    cuisine: 'Indian Street Food / Café',
    generalizedDescription:
      'Classic Indian spiced instant noodles cooked with sweet corn, carrots, peas, and Maggi masala, topped with a thick blanket of grilled melted cheese.',
    visualPrompt:
      'steaming black bowl of golden Cheese Maggi noodles loaded with sweet corn, carrots, and peas under a browned melted cheese layer lifted with a silver fork',
    aliases: [
      'cheese maggi',
      'cheese masala maggi',
      'veg cheese maggi',
      'cheesy maggi noodles',
      'spicy cheese maggi',
    ],
    estimatedNutrition: { calories: 410, protein: 11, carbs: 52, fat: 18, servingGrams: 280 },
  },
  {
    normalizedName: 'mexican cheese burger',
    displayName: 'Mexican Cheese Burger',
    category: 'Burgers',
    cuisine: 'Mexican / Fast Food',
    generalizedDescription:
      'Toasted sesame brioche bun loaded with a spiced crispy vegetable patty, melted cheese sauce, salsa, pickled jalapeños, crispy tortilla chips, and spicy chipotle mayo.',
    visualPrompt:
      'halved Mexican Cheese Burger showing layers of spiced crispy patty, melted yellow cheese, salsa, jalapeño slices, and nacho crunch on a wooden slate board with chipotle sauce ramekin',
    aliases: [
      'mexican cheese burger',
      'mexican burger',
      'spicy mexican burger',
      'cheese burger mexican style',
      'veg mexican burger',
    ],
    estimatedNutrition: { calories: 520, protein: 16, carbs: 58, fat: 25, servingGrams: 320 },
  },
  {
    normalizedName: 'mac-n-cheese pasta',
    displayName: 'Mac-n-cheese Pasta',
    category: 'Pasta',
    cuisine: 'Italian / Continental',
    generalizedDescription: 'Elbow macaroni folded through a rich, creamy cheese sauce and finished with herbs.',
    visualPrompt: 'bowl of glossy creamy mac-n-cheese pasta with browned cheese, herbs, and natural baked texture',
    aliases: ['mac-n-cheese pasta', 'mac and cheese pasta', 'mac n cheese', 'macaroni and cheese'],
    estimatedNutrition: { calories: 510, protein: 16, carbs: 58, fat: 23, servingGrams: 340 },
  },
  {
    normalizedName: 'strawberry mojito',
    displayName: 'Strawberry Mojito',
    category: 'Mojitos',
    cuisine: 'Beverages / Mocktails',
    generalizedDescription: 'Sparkling strawberry and lime cooler with fresh mint over ice.',
    visualPrompt: 'tall glass of sparkling strawberry mojito with lime, mint, ice, and fresh strawberry garnish',
    aliases: ['strawberry mojito', 'strawberry cooler'],
    estimatedNutrition: { calories: 105, protein: 0, carbs: 25, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'blueberry mojito',
    displayName: 'Blueberry Mojito',
    category: 'Mojitos',
    cuisine: 'Beverages / Mocktails',
    generalizedDescription: 'Bright blueberry and lime cooler with mint and sparkling soda.',
    visualPrompt: 'tall glass of blueberry mojito with lime, mint, ice, and blueberries',
    aliases: ['blueberry mojito', 'blueberry cooler'],
    estimatedNutrition: { calories: 105, protein: 0, carbs: 25, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'orange mojito',
    displayName: 'Orange Mojito',
    category: 'Mojitos',
    cuisine: 'Beverages / Mocktails',
    generalizedDescription: 'Citrus orange cooler with mint, lime, ice, and sparkling soda.',
    visualPrompt: 'tall glass of orange mojito with orange slices, lime, mint, ice, and fizz',
    aliases: ['orange mojito', 'orange cooler'],
    estimatedNutrition: { calories: 110, protein: 0, carbs: 27, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'berry mojito',
    displayName: 'Berry Mojito',
    category: 'Mojitos',
    cuisine: 'Beverages / Mocktails',
    generalizedDescription: 'Mixed berry and lime cooler with mint, ice, and sparkling soda.',
    visualPrompt: 'tall glass of berry mojito with mixed berries, lime, mint, ice, and sparkling soda',
    aliases: ['berry mojito', 'mixed berry cooler'],
    estimatedNutrition: { calories: 110, protein: 0, carbs: 27, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'lemon mint cooler',
    displayName: 'Lemon Mint Cooler',
    category: 'Mojitos',
    cuisine: 'Beverages / Mocktails',
    generalizedDescription: 'Fresh lemon and mint cooler served chilled over ice.',
    visualPrompt: 'clear glass of lemon mint cooler with lemon, mint leaves, ice, and sparkling bubbles',
    aliases: ['lemon mint cooler', 'shikanji', 'nimbu shikanji'],
    estimatedNutrition: { calories: 85, protein: 0, carbs: 21, fat: 0, servingGrams: 300 },
  },
  {
    normalizedName: 'strawberry shake',
    displayName: 'Strawberry Shake',
    category: 'Shakes',
    cuisine: 'Dessert / Shakes',
    generalizedDescription: 'Thick strawberry milkshake blended with ice cream and topped with whipped cream.',
    visualPrompt: 'tall strawberry shake with pink cream, whipped cream, strawberry garnish, and chocolate drizzle',
    aliases: ['strawberry shake', 'strawberry milkshake', 'strawberry super shake'],
    estimatedNutrition: { calories: 360, protein: 7, carbs: 52, fat: 15, servingGrams: 380 },
  },
  {
    normalizedName: 'loaded cheese nachos',
    displayName: 'Loaded Cheese Nachos',
    category: 'Snacks',
    cuisine: 'Mexican / Café Snacks',
    generalizedDescription: 'Crisp tortilla chips layered with melted cheese, vegetables, herbs, and fresh salsa.',
    visualPrompt: 'loaded cheese nachos on a dark plate with melted cheese, diced vegetables, herbs, and salsa',
    aliases: ['loaded cheese nachos', 'cheese and corn nachos', 'cheese corn nachos'],
    estimatedNutrition: { calories: 420, protein: 12, carbs: 48, fat: 21, servingGrams: 280 },
  },
];
