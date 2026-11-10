import type { CanonicalCatalogItem } from '../types';

export const SANDWICHES_AND_STARTERS_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // VI. Sandwiches, Paninis, Burgers & Wraps (146-175 + gourmet burger)
  // =========================================================================
  {
    normalizedName: 'spinach corn cheese grilled sandwich',
    displayName: 'Spinach, Corn & Cheese Grilled Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Indian Café',
    generalizedDescription:
      'Jumbo bread stuffed with a creamy béchamel mix of sweet corn, spinach, and mozzarella.',
    visualPrompt:
      'two crisp golden grill-striped triangle halves of Spinach, Corn & Cheese Grilled Sandwich oozing thick creamy white béchamel packed visibly with bright green spinach and sweet golden corn kernels',
    aliases: ['spinach corn cheese grilled sandwich', 'spinach corn sandwich', 'corn spinach grilled sandwich'],
    estimatedNutrition: { calories: 470, protein: 16, carbs: 46, fat: 24, servingGrams: 240 },
  },
  {
    normalizedName: 'bombay masala grill sandwich',
    displayName: 'Bombay Masala Grill Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Mumbai Street Café',
    generalizedDescription:
      'Three-layer street-style sandwich with green chutney, spiced potatoes, beetroot, cucumber, and sev.',
    visualPrompt:
      'stacked golden-crisp three-layer Bombay Masala Grill Sandwich cut in half revealing distinct colorful layers of emerald coriander mint chutney, turmeric-spiced potato mash, ruby beetroot rounds, crisp cucumber, cheese, and fine crunchy golden sev with a side of chutney',
    aliases: ['bombay masala grill sandwich', 'bombay masala sandwich', 'mumbai grilled sandwich', 'masala toast sandwich'],
    estimatedNutrition: { calories: 490, protein: 12, carbs: 62, fat: 21, servingGrams: 270 },
  },
  {
    normalizedName: 'vegetarian club sandwich',
    displayName: 'Vegetarian Club Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Classic Café',
    generalizedDescription:
      'Triple-decker toasted sandwich layered with coleslaw, cheese, lettuce, tomato, and grilled veggies.',
    visualPrompt:
      'tall neat triple-decker Vegetarian Club Sandwich cut diagonally into pinned triangle quarters showing crunchy coleslaw, melted cheddar cheese, vibrant tomato slices, cucumber, lettuce, and char-grilled bell peppers beside crisp potato fries',
    aliases: ['vegetarian club sandwich', 'veg club sandwich', 'veggie club sandwich'],
    estimatedNutrition: { calories: 530, protein: 15, carbs: 56, fat: 27, servingGrams: 310 },
  },
  {
    normalizedName: 'classic chicken club sandwich',
    displayName: 'Classic Chicken Club Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Classic Bistro',
    generalizedDescription:
      'Triple-decker toast with roast chicken, fried egg, chicken ham, lettuce, tomato, and mayo.',
    visualPrompt:
      'tall triple-decker Classic Chicken Club Sandwich held cleanly with bamboo cocktail picks showing layers of toasted bread, sliced herb roast chicken, fried egg edge, chicken ham, tomato, iceberg lettuce, and golden fries on the plate',
    aliases: ['classic chicken club sandwich', 'chicken club sandwich', 'club sandwich chicken'],
    estimatedNutrition: { calories: 670, protein: 38, carbs: 50, fat: 34, servingGrams: 340 },
  },
  {
    normalizedName: 'jumbo chicken tikka sandwich',
    displayName: 'Jumbo Chicken Tikka Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Indian Bistro Café',
    generalizedDescription:
      'Grilled brown bread loaded with smoky chicken tikka chunks, mint mayo, and onions.',
    visualPrompt:
      'hearty grilled whole-wheat Jumbo Chicken Tikka Sandwich cut diagonally showing packed juicy spiced tandoori chicken tikka morsels, cool pale-green mint mayo, crispy purple onion rings, and melted cheese',
    aliases: ['jumbo chicken tikka sandwich', 'chicken tikka sandwich', 'tikka grilled sandwich'],
    estimatedNutrition: { calories: 580, protein: 36, carbs: 46, fat: 27, servingGrams: 290 },
  },
  {
    normalizedName: 'grilled cottage cheese charred broccoli sandwich',
    displayName: 'Grilled Cottage Cheese & Charred Broccoli Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Contemporary Health Café',
    generalizedDescription:
      'Multigrain panini filled with marinated paneer, charred broccoli, and bell peppers.',
    visualPrompt:
      'seeded multigrain toasted panini halved cleanly to showcase thick golden spiced paneer slabs, char-roasted emerald broccoli florets, sweet roasted red bell peppers, and herbed cream spread',
    aliases: ['grilled cottage cheese charred broccoli sandwich', 'paneer broccoli sandwich', 'cottage cheese panini'],
    estimatedNutrition: { calories: 510, protein: 24, carbs: 44, fat: 26, servingGrams: 275 },
  },
  {
    normalizedName: 'tofu avocado vegan sandwich',
    displayName: 'Tofu & Avocado Vegan Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Plant-Based Contemporary Café',
    generalizedDescription:
      'Sourdough sandwich layered with grilled herb tofu, sliced avocado, tomato, and vegan mayo.',
    visualPrompt:
      'crusty toasted country sourdough Tofu & Avocado Vegan Sandwich stacked neatly with golden herb-seared tofu steaks, lush fanned green avocado slices, heirloom red tomatoes, arugula leaves, and creamy vegan herb dressing',
    aliases: ['tofu avocado vegan sandwich', 'vegan tofu sandwich', 'avocado tofu sourdough sandwich'],
    estimatedNutrition: { calories: 470, protein: 20, carbs: 46, fat: 23, servingGrams: 265 },
  },
  {
    normalizedName: 'cheddar cheese croissant sandwich',
    displayName: 'Cheddar Cheese Croissant Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Bakery Café',
    generalizedDescription:
      'Buttery croissant sliced and filled with melted cheddar, lettuce, and mustard mayo.',
    visualPrompt:
      'flaky golden crescent butter croissant sliced horizontally and filled cleanly with melted sharp aged orange cheddar cheese layers, crisp emerald green oakleaf lettuce, tomato, and grainy Dijon mustard mayo',
    aliases: ['cheddar cheese croissant sandwich', 'croissant sandwich', 'cheese croissant melt'],
    estimatedNutrition: { calories: 460, protein: 16, carbs: 35, fat: 28, servingGrams: 185 },
  },
  {
    normalizedName: 'toasted everything bagel sandwich',
    displayName: 'Toasted Everything Bagel Sandwich',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'New York Bakery Café',
    generalizedDescription:
      'Everything bagel smeared with herb cream cheese, cucumber, capers, and tomato.',
    visualPrompt:
      'seed-crusted Toasted Everything Bagel halved and stacked generously with thick pillowy chive herb cream cheese, crisp thin cucumber ribbons, juicy red tomato slices, briny capers, and finely shaved red onion',
    aliases: ['toasted everything bagel sandwich', 'bagel sandwich', 'cream cheese bagel sandwich'],
    estimatedNutrition: { calories: 430, protein: 14, carbs: 58, fat: 15, servingGrams: 220 },
  },
  {
    normalizedName: 'italian caprese panini',
    displayName: 'Italian Caprese Panini',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Italian Café',
    generalizedDescription:
      'Pressed ciabatta sandwich with fresh buffalo mozzarella, ripe tomatoes, basil pesto, and balsamic glaze.',
    visualPrompt:
      'crisp grill-seared ciabatta Italian Caprese Panini halved to show thick white melted buffalo mozzarella pearls, ruby Roma tomato slices, bright emerald pesto, whole basil leaves, and dark syrupy balsamic reduction drizzle',
    aliases: ['italian caprese panini', 'caprese panini', 'mozzarella tomato panini', 'caprese sandwich'],
    estimatedNutrition: { calories: 510, protein: 21, carbs: 45, fat: 27, servingGrams: 255 },
  },
  {
    normalizedName: 'mushroom swiss melt panini',
    displayName: 'Mushroom & Swiss Melt Panini',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Contemporary Bistro',
    generalizedDescription:
      'Grilled sourdough panini packed with caramelized onions, sauteed mushrooms, and melted Swiss cheese.',
    visualPrompt:
      'press-grilled sourdough Mushroom & Swiss Melt Panini showing crusty golden char ridges, packed richly inside with glossy sautéed brown garlic mushrooms, jammy caramelized onions, and oozy pale Swiss cheese melt',
    aliases: ['mushroom swiss melt panini', 'mushroom cheese panini', 'mushroom melt sandwich'],
    estimatedNutrition: { calories: 530, protein: 21, carbs: 47, fat: 28, servingGrams: 260 },
  },
  {
    normalizedName: 'panini grilled sandwich',
    displayName: 'Pesto Grilled Vegetable Panini',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'Ciabatta bread pressed with zucchini, bell peppers, eggplant, pesto, and provolone.',
    visualPrompt:
      'two crisp diagonally halved Pesto Grilled Vegetable Panini sandwiches on golden ciabatta bread with dark grill marks filled with charred zucchini, bell peppers, melted cheese, and basil pesto',
    aliases: ['panini grilled sandwich', 'pesto grilled vegetable panini', 'grilled vegetable panini', 'veggie panini', 'panini'],
    estimatedNutrition: { calories: 480, protein: 19, carbs: 46, fat: 24, servingGrams: 240 },
  },
  {
    normalizedName: 'crispy veg herb burger',
    displayName: 'Crispy Veg Herb Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Classic Café',
    generalizedDescription:
      'Sesame bun with a crunchy potato-pea-herb patty, iceberg lettuce, cheese slice, and burger sauce.',
    visualPrompt:
      'golden sesame-seeded burger bun holding a thick crunchy herb-flecked vegetable-potato patty, crisp iceberg lettuce leaves, ripe tomato, melted cheddar slice, and creamy tangy house burger sauce',
    aliases: ['crispy veg herb burger', 'crispy veg burger', 'veg herb burger', 'classic veg burger'],
    estimatedNutrition: { calories: 560, protein: 15, carbs: 64, fat: 27, servingGrams: 270 },
  },
  {
    normalizedName: 'spicy jalapeno cheese burger',
    displayName: 'Spicy Jalapeno & Cheese Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Contemporary Burger Bar',
    generalizedDescription:
      'Burger topped with pickled jalapenos, nacho cheese sauce, and chipotle mayo.',
    visualPrompt:
      'tall glossy brioche bun Spicy Jalapeno & Cheese Burger overflowing with golden molten nacho cheese sauce, fiery green pickled jalapeno slices, crunchy patty, chipotle-pink mayo, and lettuce',
    aliases: ['spicy jalapeno cheese burger', 'jalapeno cheese burger', 'fiery jalapeno burger'],
    estimatedNutrition: { calories: 640, protein: 22, carbs: 54, fat: 36, servingGrams: 290 },
  },
  {
    normalizedName: 'cottage cheese steak burger',
    displayName: 'Cottage Cheese Steak Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Indian Contemporary Burger Bar',
    generalizedDescription:
      'Thick slab of peri-peri spiced grilled paneer served in a brioche bun with coleslaw.',
    visualPrompt:
      'soft toasted brioche bun stacked high with a thick char-grilled peri-peri glazed golden cottage cheese paneer steak slab, crisp shredded cabbage slaw, pickled red onions, and herb sauce',
    aliases: ['cottage cheese steak burger', 'paneer burger', 'peri peri paneer burger', 'grilled paneer burger'],
    estimatedNutrition: { calories: 610, protein: 26, carbs: 50, fat: 33, servingGrams: 280 },
  },
  {
    normalizedName: 'classic crispy fried chicken burger',
    displayName: 'Classic Crispy Fried Chicken Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'American Diner',
    generalizedDescription:
      'Buttermilk-fried chicken thigh fillet in a brioche bun with pickles and garlic aioli.',
    visualPrompt:
      'plump golden craggy buttermilk fried chicken thigh fillet nestled inside a glossy brioche burger bun with crinkle-cut dill pickles, creamy pale garlic aioli, and crisp lettuce leaf',
    aliases: ['classic crispy fried chicken burger', 'crispy chicken burger', 'fried chicken burger', 'nashville chicken burger'],
    estimatedNutrition: { calories: 690, protein: 35, carbs: 56, fat: 36, servingGrams: 300 },
  },
  {
    normalizedName: 'grilled peri-peri chicken burger',
    displayName: 'Grilled Peri-Peri Chicken Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Flame Grill Bistro',
    generalizedDescription:
      'Flame-grilled spicy chicken breast burger with caramelized onions and cheese.',
    visualPrompt:
      'flame-charred chili-glazed peri-peri chicken breast fillet stacked in a toasted brioche bun with jammy amber caramelized onions, melted cheddar slice, and crisp greens',
    aliases: ['grilled peri-peri chicken burger', 'peri peri chicken burger', 'grilled chicken burger'],
    estimatedNutrition: { calories: 580, protein: 38, carbs: 46, fat: 26, servingGrams: 285 },
  },
  {
    normalizedName: 'mutton juicy lucy burger',
    displayName: 'Mutton Juicy Lucy Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Gourmet Burger House',
    generalizedDescription:
      'Gourmet burger featuring a minced lamb patty stuffed with molten cheddar cheese inside the meat.',
    visualPrompt:
      'halved Gourmet Mutton Juicy Lucy Burger in a glazed brioche bun showing a thick seared browned lamb patty centered with molten oozing golden cheddar cheese pocket, pickles, and caramelized onions',
    aliases: ['mutton juicy lucy burger', 'juicy lucy lamb burger', 'lamb burger', 'mutton burger'],
    estimatedNutrition: { calories: 740, protein: 36, carbs: 45, fat: 46, servingGrams: 315 },
  },
  {
    normalizedName: 'pulled jackfruit bbq burger',
    displayName: 'Pulled Jackfruit BBQ Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Plant-Based Bistro',
    generalizedDescription:
      'Slow-cooked shredded raw jackfruit in smoky barbecue sauce served on a toasted bun with slaw.',
    visualPrompt:
      'generous vegan brioche bun brimming with fibrous slow-braised Pulled Jackfruit coated in glossy dark smoky mahogany BBQ glaze topped with crisp crunchy purple-and-white apple slaw and dill pickles',
    aliases: ['pulled jackfruit bbq burger', 'jackfruit burger', 'vegan bbq burger'],
    estimatedNutrition: { calories: 470, protein: 11, carbs: 68, fat: 17, servingGrams: 270 },
  },
  {
    normalizedName: 'gourmet burger',
    displayName: 'Gourmet Burger',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'American / Bistro',
    generalizedDescription:
      'Classic handcrafted burger in a brioche bun with aged cheddar, lettuce, tomato, and house sauces.',
    visualPrompt:
      'tall artisanal Gourmet Burger inside a glossy golden brioche bun stacked with thick seared patty, melted aged cheddar slice, crisp green butter lettuce, ruby tomato slice, and creamy house sauce',
    aliases: ['gourmet burger', 'classic cheeseburger', 'cheeseburger', 'smash burger', 'house classic burger'],
    estimatedNutrition: { calories: 690, protein: 32, carbs: 52, fat: 38, servingGrams: 310 },
  },
  {
    normalizedName: 'bun kebab',
    displayName: 'Street-Style Bun Kebab',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'South Asian Street Café',
    generalizedDescription:
      'Shallow-fried spiced lentil and vegetable or mutton patty served in a soft bun with green chutney and onion rings.',
    visualPrompt:
      'warm toasted soft sesame Street-Style Bun Kebab stuffed with a golden pan-seared spiced lentil-kebab patty, crisp red onion rings, fresh green mint chutney, and folded egg layer',
    aliases: ['bun kebab', 'street-style bun kebab', 'bun kabab', 'spicy bun kebab'],
    estimatedNutrition: { calories: 460, protein: 22, carbs: 48, fat: 20, servingGrams: 240 },
  },
  {
    normalizedName: 'awadhi galouti kebab sliders',
    displayName: 'Awadhi Galouti Kebab Sliders',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Lucknowi / Modern Indian Café',
    generalizedDescription:
      'Mini brioche buns holding melt-in-the-mouth Lucknowi mutton or mushroom galouti kebabs with saffron mayo.',
    visualPrompt:
      'three dainty glazed mini brioche slider buns stuffed with velvety dark-seared Lucknowi Galouti Kebab patties, golden saffron mayo ribbons, pickled crisp pink onions, and delicate cilantro sprig',
    aliases: ['awadhi galouti kebab sliders', 'galouti kebab sliders', 'galouti sliders', 'lucknowi kebab slider'],
    estimatedNutrition: { calories: 490, protein: 24, carbs: 44, fat: 24, servingGrams: 225 },
  },
  {
    normalizedName: 'falafel platter wrap',
    displayName: 'Falafel Greek Pita Wrap',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Middle Eastern / Mediterranean',
    generalizedDescription:
      'Warm pita bread wrapped around crispy chickpea falafel, hummus, pickled turnips, and tahini.',
    visualPrompt:
      'Mediterranean Falafel Greek Pita Wrap resting beside crisp herb chickpea falafel balls, swirled creamy hummus in a ceramic dish, vibrant pink pickled turnips, crisp lettuce, and creamy tahini drizzle',
    aliases: ['falafel platter wrap', 'falafel greek pita wrap', 'falafel wrap', 'falafel pita', 'falafel platter'],
    estimatedNutrition: { calories: 520, protein: 18, carbs: 62, fat: 22, servingGrams: 310 },
  },
  {
    normalizedName: 'paneer tikka kathi roll',
    displayName: 'Paneer Tikka Kathi Roll',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'North Indian Street Café',
    generalizedDescription:
      'Flaky paratha roll stuffed with charred paneer tikka, sliced onions, and mint chutney.',
    visualPrompt:
      'two diagonally cut crisp flaky lachha paratha wrap rolls packed visibly with bright orange charred paneer tikka cubes, sliced red onions, bell peppers, and emerald green mint chutney served in parchment paper',
    aliases: ['paneer tikka kathi roll', 'paneer kathi roll', 'paneer tikka roll', 'paneer frankie'],
    estimatedNutrition: { calories: 540, protein: 22, carbs: 54, fat: 26, servingGrams: 260 },
  },
  {
    normalizedName: 'lebanese chicken shawarma wrap',
    displayName: 'Lebanese Chicken Shawarma Wrap',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Lebanese / Middle Eastern',
    generalizedDescription:
      'Thin khubz flatbread filled with rotisserie-spiced chicken strips, toum (garlic sauce), and fries.',
    visualPrompt:
      'tightly wrapped lightly toasted golden khubz shawarma wrap cut neatly in half to reveal tender spiced shaved rotisserie chicken, thick creamy ivory toum garlic sauce, crisp fries inside, and pickled pink turnip next to a small toum ramekin',
    aliases: ['lebanese chicken shawarma wrap', 'chicken shawarma wrap', 'chicken shawarma', 'shawarma roll'],
    estimatedNutrition: { calories: 590, protein: 32, carbs: 56, fat: 26, servingGrams: 290 },
  },
  {
    normalizedName: 'mexican bean cheese quesadilla',
    displayName: 'Mexican Bean & Cheese Quesadilla',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Mexican / Tex-Mex',
    generalizedDescription:
      'Grilled flour tortilla folded with refried pinto beans, sweet corn, jalapenos, and Monterey Jack cheese.',
    visualPrompt:
      'four neat crisp charred golden folded flour tortilla quesadilla wedges oozing melted white Monterey Jack cheese packed with hearty refried pinto beans, sweet corn, and green jalapenos next to small bowls of salsa and guacamole',
    aliases: ['mexican bean cheese quesadilla', 'veg quesadilla', 'bean and cheese quesadilla', 'cheese quesadilla'],
    estimatedNutrition: { calories: 510, protein: 19, carbs: 56, fat: 23, servingGrams: 270 },
  },
  {
    normalizedName: 'smoky bbq chicken quesadilla',
    displayName: 'Smoky BBQ Chicken Quesadilla',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Tex-Mex Grill',
    generalizedDescription:
      'Toasted tortilla stuffed with barbecue shredded chicken, bell peppers, and melted cheddar, served with sour cream.',
    visualPrompt:
      'golden skillet-toasted tortilla quesadilla triangles overflowing with smoky mahogany BBQ shredded chicken, charred sweet bell peppers, red onions, and melted sharp cheddar next to cool sour cream swirl cup',
    aliases: ['smoky bbq chicken quesadilla', 'chicken quesadilla', 'bbq chicken quesadilla'],
    estimatedNutrition: { calories: 570, protein: 31, carbs: 49, fat: 27, servingGrams: 280 },
  },
  {
    normalizedName: 'classic mumbai vada pav',
    displayName: 'Classic Mumbai Vada Pav',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Mumbai Street Food',
    generalizedDescription:
      'Soft pav bun stuffed with a batter-fried spicy potato dumpling and dry garlic-chili chutney.',
    visualPrompt:
      'fluffy square butter-warmed Indian ladi pav bun embracing a golden crisp gram-flour fried batata vada potato patty layered inside with bright fiery red dry garlic chutney, green chutney, and fried salted green chili alongside',
    aliases: ['classic mumbai vada pav', 'vada pav', 'mumbai vada pav', 'batata vada pav'],
    estimatedNutrition: { calories: 360, protein: 8, carbs: 54, fat: 12, servingGrams: 170 },
  },
  {
    normalizedName: 'schezwan cheese vada pav',
    displayName: 'Schezwan Cheese Vada Pav',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Mumbai Fusion Street Café',
    generalizedDescription:
      'Fusion vada pav topped with spicy Indo-Chinese Schezwan sauce and grated cheese.',
    visualPrompt:
      'soft toasted square pav stuffed cleanly with crisp golden potato vada, generous glossy vibrant red spicy Schezwan chili garlic chutney, and a fluffy snowy heap of finely grated processed cheese',
    aliases: ['schezwan cheese vada pav', 'cheese vada pav', 'schezwan vada pav'],
    estimatedNutrition: { calories: 440, protein: 12, carbs: 55, fat: 19, servingGrams: 200 },
  },
  {
    normalizedName: 'keema pav',
    displayName: 'Keema Pav',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Irani Café / Mumbai',
    generalizedDescription:
      'Spiced minced mutton curry (keema) served with toasted, butter-slathered pav buns.',
    visualPrompt:
      'rich slow-braised mahogany spiced minced mutton keema dotted cleanly with green peas, fresh coriander, ginger juliennes, and lime wedge in a copper-stoneware bowl beside two glossy butter-toasted soft pav buns',
    aliases: ['keema pav', 'mutton keema pav', 'irani kheema pav'],
    estimatedNutrition: { calories: 640, protein: 32, carbs: 48, fat: 35, servingGrams: 330 },
  },
  {
    normalizedName: 'bombay pav bhaji',
    displayName: 'Bombay Pav Bhaji',
    category: 'Sandwiches, Paninis, Burgers & Wraps',
    cuisine: 'Mumbai Street Café',
    generalizedDescription:
      'Mashed spiced mixed-vegetable gravy topped with a cube of butter and served with toasted pav buns.',
    visualPrompt:
      'vibrant rich crimson-terracotta spiced smooth Pav Bhaji vegetable curry crowned right at the center with a melting square cube of yellow salted butter beside finely diced red onions, lime wedge, and two buttered griddle-toasted pav buns',
    aliases: ['bombay pav bhaji', 'pav bhaji', 'mumbai pav bhaji', 'butter pav bhaji'],
    estimatedNutrition: { calories: 610, protein: 14, carbs: 74, fat: 28, servingGrams: 360 },
  },

  // =========================================================================
  // VII. Small Plates, Fries, Nachos & Starters (176-210 + paneer tikka)
  // =========================================================================
  {
    normalizedName: 'classic salted french fries',
    displayName: 'Classic Salted French Fries',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Classic Café Side',
    generalizedDescription:
      'Crisp, golden deep-fried potato batons seasoned with sea salt.',
    visualPrompt:
      'tall stoneware cup or ceramic bowl heaped cleanly with crisp golden-yellow classic salted French Fries lightly speckled with sea salt flakes beside a small ramekin of rich ruby tomato ketchup',
    aliases: ['classic salted french fries', 'french fries', 'salted fries', 'classic fries'],
    estimatedNutrition: { calories: 350, protein: 4, carbs: 46, fat: 17, servingGrams: 170 },
  },
  {
    normalizedName: 'peri peri fries',
    displayName: 'Peri-Peri Spiced Fries',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Crispy French fries tossed in fiery African bird\'s-eye chili spice mix.',
    visualPrompt:
      'crispy golden-brown Peri-Peri Spiced Fries coated evenly with vibrant orange-red spicy chili-herb seasoning inside a stoneware bowl beside creamy garlic dip',
    aliases: ['peri peri fries', 'peri-peri spiced fries', 'peri-peri fries', 'piri piri fries', 'spicy fries'],
    estimatedNutrition: { calories: 380, protein: 5, carbs: 48, fat: 18, servingGrams: 180 },
  },
  {
    normalizedName: 'cheesy masala fries',
    displayName: 'Cheesy Masala Fries',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Indian Fusion Café',
    generalizedDescription:
      'French fries smothered in warm liquid cheddar cheese sauce and Indian chaat spices.',
    visualPrompt:
      'golden crispy French fries inside a shallow ceramic platter generously drenched with glossy molten cheddar cheese sauce ribbons, tangy chaat masala dust, jalapeno slices, and chopped fresh cilantro',
    aliases: ['cheesy masala fries', 'loaded cheese fries', 'masala cheese fries', 'cheese fries'],
    estimatedNutrition: { calories: 490, protein: 12, carbs: 50, fat: 27, servingGrams: 220 },
  },
  {
    normalizedName: 'truffle parmesan fries',
    displayName: 'Truffle & Parmesan Fries',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'European Bistro',
    generalizedDescription:
      'Shoestring fries tossed in white truffle oil, grated Parmigiano-Reggiano, and fresh parsley.',
    visualPrompt:
      'delicate thin golden shoestring French fries dusted cleanly with snowy aged grated Parmigiano-Reggiano cheese, bright green finely chopped flat-leaf parsley, and aromatic truffle sheen beside aioli ramekin',
    aliases: ['truffle parmesan fries', 'truffle and parmesan fries', 'truffle fries', 'parmesan truffle fries'],
    estimatedNutrition: { calories: 440, protein: 10, carbs: 46, fat: 24, servingGrams: 190 },
  },
  {
    normalizedName: 'crispy zucchini fries',
    displayName: 'Crispy Zucchini Fries',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Mediterranean Bistro',
    generalizedDescription:
      'Panko-crusted zucchini sticks fried crisp and served with garlic herb dip.',
    visualPrompt:
      'crisp golden-brown panko-breaded green zucchini batons stacked neatly on a ceramic plate with hints of vibrant green zucchini peeking at the ends beside cool creamy garlic herb dip',
    aliases: ['crispy zucchini fries', 'zucchini fries', 'panko zucchini sticks'],
    estimatedNutrition: { calories: 290, protein: 7, carbs: 29, fat: 16, servingGrams: 165 },
  },
  {
    normalizedName: 'beer-battered onion rings',
    displayName: 'Beer-Battered Onion Rings',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'American Diner / Bistro',
    generalizedDescription:
      'Thick sweet onion rings dipped in airy batter and fried golden.',
    visualPrompt:
      'tall neat stack of thick golden puffy crunchy battered Onion Rings resting cleanly on a stoneware plate next to smoky chipotle dipping sauce',
    aliases: ['beer-battered onion rings', 'onion rings', 'crispy onion rings'],
    estimatedNutrition: { calories: 410, protein: 6, carbs: 50, fat: 21, servingGrams: 185 },
  },
  {
    normalizedName: 'potato wedges with sour cream',
    displayName: 'Potato Wedges with Sour Cream',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Classic Pub Café',
    generalizedDescription:
      'Seasoned skin-on potato wedges fried crisp and served with sour cream and chive dip.',
    visualPrompt:
      'thick rustic skin-on golden-roasted herb-dusted Potato Wedges arranged around a cool ceramic dipping bowl of thick white sour cream topped with bright green chive snips',
    aliases: ['potato wedges with sour cream', 'potato wedges', 'seasoned wedges'],
    estimatedNutrition: { calories: 390, protein: 6, carbs: 52, fat: 17, servingGrams: 220 },
  },
  {
    normalizedName: 'loaded nachos',
    displayName: 'Overloaded Tex-Mex Nachos',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Mexican / Tex-Mex',
    generalizedDescription:
      'Corn tortilla chips layered with melted queso, refried beans, jalapenos, tomato salsa, and sour cream.',
    visualPrompt:
      'generous stoneware platter of crisp corn tortilla Overloaded Tex-Mex Nachos smothered in warm melted cheddar queso, black beans, bright fresh pico de gallo salsa, cool sour cream dollops, and jalapenos',
    aliases: ['loaded nachos', 'overloaded tex-mex nachos', 'nachos', 'cheese nachos', 'tex mex nachos'],
    estimatedNutrition: { calories: 640, protein: 19, carbs: 64, fat: 34, servingGrams: 320 },
  },
  {
    normalizedName: 'bbq chicken loaded nachos',
    displayName: 'BBQ Chicken Loaded Nachos',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Tex-Mex Grill',
    generalizedDescription:
      'Tortilla chips topped with pulled barbecue chicken, melted cheddar, olives, and guacamole.',
    visualPrompt:
      'piled crisp corn tortilla chips crowned with smoky mahogany pulled BBQ chicken shreds, melted golden cheddar cheese, black olive rings, and lush emerald guacamole dollops',
    aliases: ['bbq chicken loaded nachos', 'chicken nachos', 'barbecue chicken nachos'],
    estimatedNutrition: { calories: 690, protein: 32, carbs: 58, fat: 36, servingGrams: 340 },
  },
  {
    normalizedName: 'bruschetta',
    displayName: 'Classic Tomato & Basil Bruschetta',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Italian',
    generalizedDescription:
      'Grilled baguette slices rubbed with garlic and topped with diced heirloom tomatoes, basil, and olive oil.',
    visualPrompt:
      'three slices of char-grilled rustic baguette Classic Tomato & Basil Bruschetta topped with diced ruby heirloom tomatoes, fresh emerald basil ribbons, balsamic glaze, and olive oil',
    aliases: ['bruschetta', 'classic tomato basil bruschetta', 'tomato bruschetta', 'classic bruschetta'],
    estimatedNutrition: { calories: 250, protein: 6, carbs: 32, fat: 11, servingGrams: 160 },
  },
  {
    normalizedName: 'creamy mushroom bruschetta',
    displayName: 'Creamy Mushroom Bruschetta',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'Toasted crostini topped with garlic-sauteed cremini mushrooms and thyme.',
    visualPrompt:
      'three crisp olive-oil toasted golden baguette crostini topped generously with silky garlic butter glazed caramelized cremini mushrooms, whipped ricotta swipe underneath, fresh thyme leaves, and shaved parmesan',
    aliases: ['creamy mushroom bruschetta', 'mushroom bruschetta', 'mushroom crostini'],
    estimatedNutrition: { calories: 310, protein: 9, carbs: 31, fat: 17, servingGrams: 170 },
  },
  {
    normalizedName: 'mac and cheese crusted balls',
    displayName: 'Mac and Cheese Crusted Balls',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'American Comfort Food',
    generalizedDescription:
      'Deep-fried panko-breaded spheres of creamy macaroni and cheddar cheese.',
    visualPrompt:
      'five golden-brown crunchy panko-breaded round fried Mac and Cheese Balls arranged neatly on a ceramic plate with one cracked gently open revealing creamy cheddar elbow macaroni beside red marinara dip',
    aliases: ['mac and cheese crusted balls', 'mac and cheese balls', 'fried mac n cheese bites'],
    estimatedNutrition: { calories: 470, protein: 16, carbs: 42, fat: 26, servingGrams: 200 },
  },
  {
    normalizedName: 'jalapeno cheese poppers',
    displayName: 'Jalapeno Cheese Poppers',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Tex-Mex / Pub Bites',
    generalizedDescription:
      'Crispy breaded bites filled with molten cream cheese and diced jalapenos.',
    visualPrompt:
      'six crisp golden breadcrumb-fried Jalapeno Cheese Poppers with one sliced showing molten white cream cheese dotted cleanly with diced green jalapenos beside tangy herb ranch dip',
    aliases: ['jalapeno cheese poppers', 'jalapeno poppers', 'cheese jalapeno bites'],
    estimatedNutrition: { calories: 410, protein: 12, carbs: 32, fat: 26, servingGrams: 180 },
  },
  {
    normalizedName: 'crispy corn cigar rolls',
    displayName: 'Crispy Corn Cigar Rolls',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Contemporary Asian-Fusion Café',
    generalizedDescription:
      'Thin spring-roll pastry cigars stuffed with spiced cheese, sweet corn, and herbs, fried crisp.',
    visualPrompt:
      'tall neat teepee stack or fanned arrangement of slender golden crunchy fried pastry Cigar Rolls halved on the bias showing molten cheese, bright yellow sweet corn kernels, and chili herbs beside sweet chili sauce',
    aliases: ['crispy corn cigar rolls', 'cheese corn cigar rolls', 'cigar rolls', 'corn cheese rolls'],
    estimatedNutrition: { calories: 430, protein: 13, carbs: 40, fat: 24, servingGrams: 185 },
  },
  {
    normalizedName: 'mozzarella cheese sticks',
    displayName: 'Mozzarella Cheese Sticks',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Italian-American Bistro',
    generalizedDescription:
      'Breaded batons of mozzarella fried until golden with a stretchy cheese pull, served with marinara.',
    visualPrompt:
      'five golden crisp herb-breaded fried Mozzarella Cheese Sticks stacked like logs with one broken gently showing pure stretchy white melted mozzarella pull beside a bowl of rich red marinara sauce',
    aliases: ['mozzarella cheese sticks', 'cheese sticks', 'fried mozzarella'],
    estimatedNutrition: { calories: 460, protein: 21, carbs: 32, fat: 27, servingGrams: 190 },
  },
  {
    normalizedName: 'hara bhara kebab',
    displayName: 'Hara Bhara Kebab',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'North Indian Starter',
    generalizedDescription:
      'Pan-seared vegetarian patties made from spinach, green peas, and potatoes, topped with a cashew nut.',
    visualPrompt:
      'four crisp emerald-green pan-seared round Hara Bhara Kebab patties studded neatly at the center top with a golden toasted split cashew nut half, served with cool green mint chutney and pickled onion rings',
    aliases: ['hara bhara kebab', 'spinach pea kebab', 'veg hara bhara kabab'],
    estimatedNutrition: { calories: 310, protein: 9, carbs: 34, fat: 15, servingGrams: 190 },
  },
  {
    normalizedName: 'paneer corn fritters',
    displayName: 'Paneer Corn Fritters',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Contemporary Indian Café',
    generalizedDescription:
      'Crispy fried bites of cottage cheese and sweet corn seasoned with crushed black pepper.',
    visualPrompt:
      'golden craggy crisp-fried Paneer Corn Fritters patties bursting visibly with sweet yellow corn kernels and tender white paneer crumbs served with tamarind-mint dipping sauce',
    aliases: ['paneer corn fritters', 'corn paneer bites', 'paneer sweet corn pakora'],
    estimatedNutrition: { calories: 370, protein: 15, carbs: 28, fat: 22, servingGrams: 190 },
  },
  {
    normalizedName: 'paneer tikka',
    displayName: 'Paneer Tikka',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'North Indian',
    generalizedDescription:
      'Chunks of cottage cheese marinated in spiced yogurt, skewered with bell peppers and onions, and charred in a clay tandoor.',
    visualPrompt:
      'char-grilled tandoori marinated golden-orange Paneer Tikka cubes skewered cleanly with smoky green capsicum, red onions, and tomato squares beside green mint coriander chutney and fresh lime wedge',
    aliases: ['paneer tikka', 'tandoori paneer', 'paneer tikka kebab', 'smoked paneer tikka'],
    estimatedNutrition: { calories: 280, protein: 16, carbs: 10, fat: 18, servingGrams: 220 },
  },
  {
    normalizedName: 'lebanese mezze platter',
    displayName: 'Lebanese Mezze Platter',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Lebanese / Mediterranean',
    generalizedDescription:
      'Sharing platter with classic hummus, beetroot hummus, baba ganoush, falafel, pickled veggies, and warm pita bread.',
    visualPrompt:
      'generous circular stoneware Lebanese Mezze Platter arranged neatly with small bowls of creamy chickpea hummus, vibrant pink beetroot hummus, smoky baba ganoush, crisp herb falafel balls, olives, pickled turnips, and warm triangles of blistered pita bread',
    aliases: ['lebanese mezze platter', 'mezze platter', 'mediterranean mezze board'],
    estimatedNutrition: { calories: 640, protein: 20, carbs: 74, fat: 30, servingGrams: 420 },
  },
  {
    normalizedName: 'classic chickpea hummus with pita',
    displayName: 'Classic Chickpea Hummus with Pita',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Middle Eastern',
    generalizedDescription:
      'Smooth puree of chickpeas, tahini, lemon, and garlic drizzled with olive oil and paprika.',
    visualPrompt:
      'shallow ceramic bowl of satin-smooth swirled creamy Classic Chickpea Hummus pooled at the center with golden extra-virgin olive oil, whole cooked chickpeas, sumac paprika dust, and warm soft pita wedges beside',
    aliases: ['classic chickpea hummus with pita', 'hummus and pita', 'classic hummus'],
    estimatedNutrition: { calories: 390, protein: 12, carbs: 46, fat: 18, servingGrams: 240 },
  },
  {
    normalizedName: 'muhammara dip platter',
    displayName: 'Muhammara Dip Platter',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Syrian / Levantine',
    generalizedDescription:
      'Syrian roasted red pepper and walnut dip flavored with pomegranate molasses, served with lavash.',
    visualPrompt:
      'vibrant roasted crimson-terracotta Muhammara walnut-red pepper dip swirled in a shallow stoneware bowl topped with chopped toasted walnuts, olive oil shimmer, dark pomegranate syrup drizzle, and crisp seeded flatbread lavash crackers',
    aliases: ['muhammara dip platter', 'muhammara', 'roasted red pepper walnut dip'],
    estimatedNutrition: { calories: 380, protein: 8, carbs: 32, fat: 25, servingGrams: 210 },
  },
  {
    normalizedName: 'guacamole tortilla chips',
    displayName: 'Guacamole & Tortilla Chips',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Mexican',
    generalizedDescription:
      'Freshly mashed avocado with lime, cilantro, onion, and tomato served with salted corn chips.',
    visualPrompt:
      'bright emerald-green chunky fresh Guacamole studded with diced red tomato, white onion, and fresh cilantro inside a stoneware bowl surrounded by crisp golden triangular salted corn tortilla chips and lime wedge',
    aliases: ['guacamole tortilla chips', 'chips and guacamole', 'fresh guacamole', 'avocado dip with nachos'],
    estimatedNutrition: { calories: 420, protein: 6, carbs: 42, fat: 26, servingGrams: 230 },
  },
  {
    normalizedName: 'truffle mushroom cream cheese crystal dimsum',
    displayName: 'Truffle Mushroom & Cream Cheese Crystal Dimsum',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Contemporary Cantonese',
    generalizedDescription:
      'Translucent wheat-starch dumplings filled with wild mushrooms, cream cheese, and truffle oil.',
    visualPrompt:
      'four jewel-like pleated translucent glossy crystal dimsum dumplings arranged neatly inside a warm natural bamboo steamer lined with perforated parchment revealing dark wild mushroom & truffle cream cheese filling inside',
    aliases: ['truffle mushroom cream cheese crystal dimsum', 'truffle mushroom dimsum', 'cream cheese dimsum'],
    estimatedNutrition: { calories: 290, protein: 8, carbs: 36, fat: 13, servingGrams: 180 },
  },
  {
    normalizedName: 'spicy vegetable water chestnut dimsum',
    displayName: 'Spicy Vegetable & Water Chestnut Dimsum',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Asian Dimsum Bar',
    generalizedDescription:
      'Steamed crystal dumplings filled with crunchy water chestnuts and Asian greens.',
    visualPrompt:
      'four delicate intricately pleated emerald-tinted translucent Spicy Vegetable & Water Chestnut crystal dimsum dumplings resting inside a woven bamboo steamer basket beside ruby chili crisp oil dish',
    aliases: ['spicy vegetable water chestnut dimsum', 'veg water chestnut dimsum', 'spicy veg dimsum'],
    estimatedNutrition: { calories: 240, protein: 6, carbs: 38, fat: 7, servingGrams: 180 },
  },
  {
    normalizedName: 'paneer chilli cheese gyoza',
    displayName: 'Paneer, Chilli & Cheese Gyoza',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Indo-Japanese Café Fusion',
    generalizedDescription:
      'Pan-seared Japanese-style dumplings stuffed with spicy cottage cheese and cheddar.',
    visualPrompt:
      'five crescent-shaped pleated Japanese Gyoza dumplings with crisp golden pan-seared lacy lacy bottoms arranged neatly on an oblong ceramic plate beside dark soy chili sesame dip',
    aliases: ['paneer chilli cheese gyoza', 'paneer gyoza', 'cheese chilli dumplings'],
    estimatedNutrition: { calories: 360, protein: 14, carbs: 38, fat: 17, servingGrams: 200 },
  },
  {
    normalizedName: 'steamed chicken momos',
    displayName: 'Steamed Chicken Momos',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Himalayan / Tibetan Café',
    generalizedDescription:
      'Tibetan-style dumplings filled with minced chicken and aromatics, served with fiery red chili chutney.',
    visualPrompt:
      'six plump hand-crimped silky white Steamed Chicken Momos arranged neatly inside a classic circular metal steamer platter alongside a small bowl of vibrant fiery orange-red Tibetan tomato garlic chili chutney',
    aliases: ['steamed chicken momos', 'chicken momos', 'himalayan chicken dumplings'],
    estimatedNutrition: { calories: 330, protein: 22, carbs: 38, fat: 9, servingGrams: 210 },
  },
  {
    normalizedName: 'peri-peri fried chicken strips',
    displayName: 'Peri-Peri Fried Chicken Strips',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Contemporary Grill Café',
    generalizedDescription:
      'Crispy chicken tenders tossed in peri-peri seasoning with chipotle dip.',
    visualPrompt:
      'five golden craggy fried chicken tender strips generously dusted with warm orange-red peri-peri chili spice served in a ceramic snack boat beside creamy peach-toned chipotle mayo',
    aliases: ['peri-peri fried chicken strips', 'chicken tenders peri peri', 'crispy chicken strips'],
    estimatedNutrition: { calories: 470, protein: 32, carbs: 28, fat: 25, servingGrams: 220 },
  },
  {
    normalizedName: 'bbq chicken wings',
    displayName: 'BBQ Chicken Wings',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'American Grill',
    generalizedDescription:
      'Juicy chicken wings glazed in smoky-sweet barbecue sauce and sesame seeds.',
    visualPrompt:
      'six glazed glistening mahogany-brown smoky BBQ Chicken Wings sprinkled cleanly with toasted white sesame seeds and sliced green scallions on an oblong ceramic plate',
    aliases: ['bbq chicken wings', 'barbecue chicken wings', 'smoky bbq wings'],
    estimatedNutrition: { calories: 520, protein: 34, carbs: 24, fat: 32, servingGrams: 260 },
  },
  {
    normalizedName: 'hot buffalo chicken wings',
    displayName: 'Hot Buffalo Chicken Wings',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'American Grill',
    generalizedDescription:
      'Crispy fried wings tossed in tangy cayenne pepper hot sauce, served with blue cheese dip.',
    visualPrompt:
      'six bright fiery tangerine-crimson glazed crisp Hot Buffalo Chicken Wings alongside crisp chilled celery sticks and a ramekin of creamy chunky white blue cheese dressing',
    aliases: ['hot buffalo chicken wings', 'buffalo wings', 'spicy buffalo wings'],
    estimatedNutrition: { calories: 510, protein: 33, carbs: 10, fat: 37, servingGrams: 250 },
  },
  {
    normalizedName: 'butter garlic prawns',
    displayName: 'Butter Garlic Prawns',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Coastal Bistro',
    generalizedDescription:
      'Tiger prawns sauteed in sizzling butter, minced garlic, white wine (or lemon), and parsley.',
    visualPrompt:
      'plump curled pink-and-coral tail-on tiger prawns shimmering in golden garlic herb butter sauce with minced browned garlic bits, fresh flat-leaf parsley, and charred lemon wedge in a stoneware tapas pan',
    aliases: ['butter garlic prawns', 'garlic butter shrimp', 'garlic prawns'],
    estimatedNutrition: { calories: 340, protein: 28, carbs: 5, fat: 23, servingGrams: 200 },
  },
  {
    normalizedName: 'fish fingers with tartar sauce',
    displayName: 'Fish Fingers with Tartar Sauce',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'British Pub Café',
    generalizedDescription:
      'Crumb-fried fillets of white fish served with lemon wedges and caper tartar sauce.',
    visualPrompt:
      'five neat golden-crusted panko breaded white Fish Finger fillets stacked gently on a stoneware platter beside fresh yellow lemon wedges and a ceramic ramekin of chunky herb-caper tartar sauce',
    aliases: ['fish fingers with tartar sauce', 'crispy fish fingers', 'fish tenders'],
    estimatedNutrition: { calories: 420, protein: 24, carbs: 34, fat: 21, servingGrams: 215 },
  },
  {
    normalizedName: 'ghee-roasted peri-peri makhana',
    displayName: 'Ghee-Roasted Peri-Peri Makhana',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Healthy Indian Café Snack',
    generalizedDescription:
      'Crunchy puffed lotus seeds roasted in clarified butter and spicy peri-peri dust.',
    visualPrompt:
      'ceramic snack bowl brimming cleanly with crisp round white-and-coral puffed lotus seeds (makhana) evenly coated with warm red peri-peri spice dust and tiny curry leaf garnish',
    aliases: ['ghee-roasted peri-peri makhana', 'peri peri makhana', 'roasted foxnuts', 'spiced makhana'],
    estimatedNutrition: { calories: 190, protein: 5, carbs: 26, fat: 8, servingGrams: 75 },
  },
  {
    normalizedName: 'lucknowi basket tokri chaat',
    displayName: 'Lucknowi Basket (Tokri) Chaat',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Awadhi / North Indian Street Food',
    generalizedDescription:
      'Crispy edible fried-potato basket filled with aloo tikki, sprouts, yogurt, tamarind chutney, mint chutney, and pomegranate.',
    visualPrompt:
      'crisp lacy golden edible woven fried potato Tokri basket filled cleanly with spiced aloo tikki, creamy cool yogurt drizzle, glossy sweet tamarind chutney, green mint chutney, crisp nylon sev, and jewel ruby pomegranate arils',
    aliases: ['lucknowi basket tokri chaat', 'tokri chaat', 'basket chaat', 'katori chaat'],
    estimatedNutrition: { calories: 410, protein: 9, carbs: 56, fat: 17, servingGrams: 260 },
  },
  {
    normalizedName: 'crispy palak patta chaat',
    displayName: 'Crispy Palak Patta Chaat',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'North Indian Contemporary Café',
    generalizedDescription:
      'Batter-fried crisp spinach leaves drizzled with sweetened yogurt, tamarind-date chutney, and sev.',
    visualPrompt:
      'golden-crisp whole gram-batter fried spinach leaves fanned carefully on a ceramic plate laced artistically with cool ivory beaten dahi yogurt, dark amber tamarind chutney, emerald mint chutney, sev, and pomegranate seeds',
    aliases: ['crispy palak patta chaat', 'palak patta chaat', 'crispy spinach chaat'],
    estimatedNutrition: { calories: 340, protein: 7, carbs: 42, fat: 16, servingGrams: 210 },
  },
  {
    normalizedName: 'punjabi samosa',
    displayName: 'Punjabi Samosa',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'North Indian',
    generalizedDescription:
      'Triangular flaky pastry cone stuffed with cumin-spiced potatoes and peas, deep-fried golden.',
    visualPrompt:
      'two crisp blistered golden-brown tetrahedral Punjabi Samosas resting beside cool emerald mint coriander chutney and glossy sweet brown tamarind chutney on a plate',
    aliases: ['punjabi samosa', 'aloo samosa', 'classic samosa', 'samosa plate'],
    estimatedNutrition: { calories: 380, protein: 7, carbs: 48, fat: 18, servingGrams: 180 },
  },
  {
    normalizedName: 'mutton cutlet',
    displayName: 'Mutton Cutlet',
    category: 'Small Plates, Fries, Nachos & Starters',
    cuisine: 'Kolkata Heritage Café',
    generalizedDescription:
      'Old-school coffee-house style spiced minced mutton patty coated in breadcrumbs and shallow-fried.',
    visualPrompt:
      'two crisp diamond-shaped golden breadcrumb-crusted Kolkata Mutton Cutlets on a porcelain plate served cleanly beside mustard kasundi dip, thin julienned beet-onion salad, and lime wedge',
    aliases: ['mutton cutlet', 'kolkata mutton cutlet', 'crumb fried mutton cutlet'],
    estimatedNutrition: { calories: 440, protein: 24, carbs: 26, fat: 26, servingGrams: 200 },
  },
];

