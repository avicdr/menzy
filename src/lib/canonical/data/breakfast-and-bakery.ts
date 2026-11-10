import type { CanonicalCatalogItem } from '../types';

export const BREAKFAST_AND_BAKERY_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // IV. All-Day Breakfast, Eggs & Toast (91-120 + pesto sourdough toast)
  // =========================================================================
  {
    normalizedName: 'classic masala omelette',
    displayName: 'Classic Masala Omelette',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Indian / All-Day Breakfast',
    generalizedDescription:
      'Three-egg Indian omelette whisked with chopped onions, green chilies, tomatoes, and fresh coriander.',
    visualPrompt:
      'golden-brown folded Classic Masala Omelette flecked visibly with emerald chopped cilantro, ruby diced tomatoes, red onions, and green chili on a warm ceramic breakfast plate beside toasted buttered bread slices',
    aliases: ['classic masala omelette', 'masala omelette', 'indian masala omelette', 'desi omelette'],
    estimatedNutrition: { calories: 290, protein: 19, carbs: 8, fat: 20, servingGrams: 190 },
  },
  {
    normalizedName: 'cheese mushroom omelette',
    displayName: 'Cheese & Mushroom Omelette',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Continental Breakfast',
    generalizedDescription:
      'Fluffy folded omelette stuffed with sauteed button mushrooms and melted cheddar.',
    visualPrompt:
      'silky pale-gold French folded Cheese & Mushroom Omelette opening gently to display caramelized sliced brown mushrooms and gooey melted yellow cheddar cheese, garnished with chopped fresh chives',
    aliases: ['cheese mushroom omelette', 'mushroom cheese omelette', 'cheese and mushroom omelette'],
    estimatedNutrition: { calories: 350, protein: 22, carbs: 5, fat: 27, servingGrams: 200 },
  },
  {
    normalizedName: 'egg white souffle omelette',
    displayName: 'Egg White Souffle Omelette',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Healthy Contemporary Breakfast',
    generalizedDescription:
      'Airy, cloud-like whipped egg white omelette cooked to a golden puff.',
    visualPrompt:
      'tall puffy golden-tinged white Egg White Souffle Omelette folded gently on a minimalist stoneware plate garnished with delicate garden herbs and roasted cherry tomatoes on the vine',
    aliases: ['egg white souffle omelette', 'egg white omelette', 'souffle omelette'],
    estimatedNutrition: { calories: 165, protein: 21, carbs: 3, fat: 7, servingGrams: 170 },
  },
  {
    normalizedName: 'creamy scrambled eggs on sourdough',
    displayName: 'Creamy Scrambled Eggs on Sourdough',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Soft-curd scrambled eggs finished with butter and chives over toasted sourdough.',
    visualPrompt:
      'thick rustic toasted golden sourdough slice topped generously with velvety soft-curd buttered scrambled eggs, glistening cracked black pepper, and fresh green chive snips',
    aliases: ['creamy scrambled eggs on sourdough', 'scrambled eggs on toast', 'soft scrambled sourdough'],
    estimatedNutrition: { calories: 380, protein: 18, carbs: 30, fat: 21, servingGrams: 220 },
  },
  {
    normalizedName: 'sunny side up fried eggs',
    displayName: 'Sunny Side Up Fried Eggs',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Classic Breakfast',
    generalizedDescription:
      'Two eggs fried with intact, runny golden yolks and crisp edges.',
    visualPrompt:
      'two glossy Sunny Side Up Fried Eggs with crisp lightly lacy white edges and plump bright marigold yolks sprinkled with flaky sea salt and black pepper on a stoneware plate next to toasted artisan bread',
    aliases: ['sunny side up fried eggs', 'sunny side up', 'fried eggs', 'bulls eye eggs'],
    estimatedNutrition: { calories: 250, protein: 14, carbs: 14, fat: 15, servingGrams: 165 },
  },
  {
    normalizedName: 'eggs benedict',
    displayName: 'Eggs Benedict',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Classic Brunch Bistro',
    generalizedDescription:
      'Toasted English muffin topped with chicken ham or sauteed spinach, poached eggs, and rich hollandaise sauce.',
    visualPrompt:
      'two toasted English muffin halves layered with savory smoked chicken ham, plump poached eggs, velvety bright lemon-butter hollandaise sauce ribbons, and crisp paprika dusting with chives',
    aliases: ['eggs benedict', 'classic eggs benedict', 'breakfast eggs benedict'],
    estimatedNutrition: { calories: 520, protein: 24, carbs: 30, fat: 33, servingGrams: 260 },
  },
  {
    normalizedName: 'eggs florentine',
    displayName: 'Eggs Florentine',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Classic Brunch Bistro',
    generalizedDescription:
      'Poached eggs over a bed of creamed garlic spinach on toasted brioche with hollandaise.',
    visualPrompt:
      'golden toasted brioche rounds topped with vibrant emerald sauteed garlic spinach, two pillowy poached eggs, creamy golden hollandaise sauce, and chives on a breakfast plate',
    aliases: ['eggs florentine', 'spinach eggs benedict', 'vegetarian eggs florentine'],
    estimatedNutrition: { calories: 470, protein: 19, carbs: 29, fat: 31, servingGrams: 250 },
  },
  {
    normalizedName: 'middle eastern shakshuka',
    displayName: 'Middle Eastern Shakshuka',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Middle Eastern',
    generalizedDescription:
      'Two eggs poached in a spiced tomato and roasted bell pepper sauce, served with pita bread.',
    visualPrompt:
      'a warm matte cast-iron skillet of bubbling crimson spiced tomato and red bell pepper Shakshuka featuring two gently poached bright-yolk eggs dotted with crumbled white feta cheese, cilantro leaves, and warm blistered pita triangles beside it',
    aliases: ['middle eastern shakshuka', 'shakshuka', 'shakshouka eggs', 'baked eggs in tomato sauce'],
    estimatedNutrition: { calories: 430, protein: 20, carbs: 36, fat: 23, servingGrams: 340 },
  },
  {
    normalizedName: 'turkish eggs cilbir',
    displayName: 'Turkish Eggs (Cilbir)',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Turkish / Mediterranean Brunch',
    generalizedDescription:
      'Poached eggs served over garlicky Greek yogurt and drizzled with warm chili-infused melted butter.',
    visualPrompt:
      'a shallow stoneware bowl containing swirled cool ivory garlicky yogurt topped with two glossy poached eggs, fiery terracotta Alejandra Aleppo-chili melted butter swirls, fresh dill, and crisp sourdough dippers',
    aliases: ['turkish eggs cilbir', 'turkish eggs', 'cilbir', 'cilbir poached eggs'],
    estimatedNutrition: { calories: 390, protein: 19, carbs: 24, fat: 24, servingGrams: 260 },
  },
  {
    normalizedName: 'akuri parsi spiced scrambled eggs',
    displayName: 'Akuri (Parsi Spiced Scrambled Eggs)',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Parsi / Indian Brunch',
    generalizedDescription:
      'Soft, spicy scrambled eggs cooked with caramelized onions, ginger, and coriander, served with buttered pav.',
    visualPrompt:
      'golden saffron-tinted creamy Parsi Akuri spiced scrambled eggs folded with caramelized onions and green coriander leaves served beside two soft golden-toasted buttered pav buns on a stoneware plate',
    aliases: ['akuri parsi spiced scrambled eggs', 'parsi akuri', 'akuri', 'bharuchi akuri'],
    estimatedNutrition: { calories: 410, protein: 18, carbs: 32, fat: 23, servingGrams: 250 },
  },
  {
    normalizedName: 'avocado sourdough toast',
    displayName: 'Smashed Avocado Sourdough Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Artisanal sourdough topped with seasoned mashed avocado, cherry tomatoes, feta, and chili flakes.',
    visualPrompt:
      'thick rustic toasted artisanal Sourdough bread spread lushly with textured bright emerald mashed Hass avocado, halved jewel cherry tomatoes, crumbled white feta, red chili flakes, and delicate microgreens on a stoneware plate',
    aliases: ['avocado sourdough toast', 'smashed avocado sourdough toast', 'avocado toast', 'smashed avocado tartine'],
    estimatedNutrition: { calories: 340, protein: 9, carbs: 36, fat: 18, servingGrams: 190 },
  },
  {
    normalizedName: 'pesto sourdough toast',
    displayName: 'Pesto Sourdough Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Thick-cut, naturally leavened sourdough bread toasted and topped with basil pesto, vegetables, and cheese.',
    visualPrompt:
      'thick rustic toasted sourdough slice generously spread with vibrant emerald basil pesto, topped with blistered cherry tomatoes, creamy mozzarella, and microgreens',
    aliases: ['pesto sourdough toast', 'pesto toast', 'basil pesto sourdough toast', 'pesto cheese toast'],
    estimatedNutrition: { calories: 390, protein: 14, carbs: 38, fat: 20, servingGrams: 210 },
  },
  {
    normalizedName: 'pesto chicken sourdough toast',
    displayName: 'Pesto Chicken Sourdough Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Thick-cut sourdough topped with basil pesto, grilled chicken strips, and melted mozzarella.',
    visualPrompt:
      'thick golden toasted sourdough slice slathered with bright green basil pesto and layered neatly with char-grilled sliced chicken breast strips, melted white mozzarella cheese, roasted tomatoes, and fresh basil',
    aliases: ['pesto chicken sourdough toast', 'chicken pesto sourdough', 'grilled chicken pesto toast'],
    estimatedNutrition: { calories: 470, protein: 30, carbs: 37, fat: 22, servingGrams: 240 },
  },
  {
    normalizedName: 'creamy mushroom on toast',
    displayName: 'Creamy Mushroom on Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'European / Café Brunch',
    generalizedDescription:
      'Garlic-herb sauteed wild mushrooms in cream sauce piled onto toasted multigrain bread.',
    visualPrompt:
      'golden seed-crusted toasted multigrain bread heaped with rich velvety cream-glazed golden brown button and shiitake mushrooms, fresh thyme sprigs, cracked black pepper, and shaved parmesan',
    aliases: ['creamy mushroom on toast', 'mushroom on toast', 'garlic mushrooms toast'],
    estimatedNutrition: { calories: 360, protein: 12, carbs: 35, fat: 19, servingGrams: 220 },
  },
  {
    normalizedName: 'baked beans on toast',
    displayName: 'Baked Beans on Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'British Classic Brunch',
    generalizedDescription:
      'Tangy tomato-stewed haricot beans served over buttered toast with grated cheddar.',
    visualPrompt:
      'warm crisp buttered thick white country toast triangles topped generously with glossy terracotta tomato-sauce baked haricot beans and golden melted grated cheddar cheese with fresh parsley',
    aliases: ['baked beans on toast', 'beans on toast', 'cheesy baked beans toast'],
    estimatedNutrition: { calories: 380, protein: 16, carbs: 54, fat: 11, servingGrams: 260 },
  },
  {
    normalizedName: 'classic french toast',
    displayName: 'Classic French Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'French / Classic Café',
    generalizedDescription:
      'Thick brioche slices dipped in cinnamon-vanilla egg custard, pan-fried and dusted with powdered sugar.',
    visualPrompt:
      'two thick golden-caramelized diagonally cut slices of fluffy brioche French Toast dusted cleanly with snow-white powdered icing sugar alongside a pat of whipped butter, berries, and small maple syrup jug',
    aliases: ['classic french toast', 'french toast', 'brioche french toast', 'cinnamon french toast'],
    estimatedNutrition: { calories: 440, protein: 12, carbs: 54, fat: 19, servingGrams: 220 },
  },
  {
    normalizedName: 'caramelized banana french toast',
    displayName: 'Caramelized Banana French Toast',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Brunch Café',
    generalizedDescription:
      'Brioche French toast topped with torched bananas, walnuts, and salted caramel.',
    visualPrompt:
      'thick golden brioche French Toast stacked cleanly with bruleed amber-caramelized halved bananas, crunchy toasted walnut halves, and glistening salted caramel ribbon drizzle',
    aliases: ['caramelized banana french toast', 'banana walnut french toast', 'banoffee french toast'],
    estimatedNutrition: { calories: 560, protein: 13, carbs: 68, fat: 26, servingGrams: 260 },
  },
  {
    normalizedName: 'pancakes',
    displayName: 'American Fluffy Pancakes',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'American / Breakfast',
    generalizedDescription:
      'Stack of three thick buttermilk pancakes served with whipped butter and maple syrup.',
    visualPrompt:
      'a fluffy golden-brown stack of three thick buttermilk American Pancakes crowned with a melting pat of butter, fresh berries, and warm amber maple syrup cascading down the sides',
    aliases: ['pancakes', 'american fluffy pancakes', 'buttermilk pancakes', 'classic pancakes', 'maple pancakes'],
    estimatedNutrition: { calories: 420, protein: 10, carbs: 64, fat: 13, servingGrams: 230 },
  },
  {
    normalizedName: 'blueberry compote pancakes',
    displayName: 'Blueberry Compote Pancakes',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'American / Brunch Café',
    generalizedDescription:
      'Fluffy pancakes topped with warm homemade blueberry sauce and cream.',
    visualPrompt:
      'tall stack of three warm fluffy pancakes crowned generously with glossy indigo-purple burst blueberry compote, fresh plump whole blueberries, whipped mascarpone cream dollop, and icing sugar',
    aliases: ['blueberry compote pancakes', 'blueberry pancakes', 'berry compote pancake stack'],
    estimatedNutrition: { calories: 460, protein: 10, carbs: 70, fat: 15, servingGrams: 260 },
  },
  {
    normalizedName: 'chocolate chip pancakes',
    displayName: 'Chocolate Chip Pancakes',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'American / Breakfast',
    generalizedDescription:
      'Griddle cakes studded with melted dark chocolate chips and drizzled with chocolate fudge.',
    visualPrompt:
      'golden-brown stack of three fluffy Chocolate Chip Pancakes visibly studded with glossy dark chocolate morsels, crowned with warm rich chocolate fudge ribbons and chocolate curls',
    aliases: ['chocolate chip pancakes', 'choc chip pancakes', 'chocolate pancakes'],
    estimatedNutrition: { calories: 520, protein: 11, carbs: 74, fat: 20, servingGrams: 250 },
  },
  {
    normalizedName: 'waffle',
    displayName: 'Classic Belgian Waffle',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Belgian / Café',
    generalizedDescription:
      'Crisp, deep-grid waffle dusted with icing sugar and served with maple syrup and whipped cream.',
    visualPrompt:
      'crisp golden-baked Belgian Waffle with deep geometric pockets stacked gently and dusted with icing sugar alongside whipped cream, berries, and golden maple syrup',
    aliases: ['waffle', 'classic belgian waffle', 'belgian waffle', 'waffles', 'maple waffle'],
    estimatedNutrition: { calories: 450, protein: 8, carbs: 58, fat: 20, servingGrams: 210 },
  },
  {
    normalizedName: 'red velvet waffle',
    displayName: 'Red Velvet Waffle',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Dessert & Brunch Café',
    generalizedDescription:
      'Crimson cocoa waffle topped with sweet cream cheese frosting and white chocolate curls.',
    visualPrompt:
      'deep velvet-crimson baked waffle quarters on a stoneware plate layered cleanly with tangy ivory cream cheese frosting drizzle, delicate white chocolate shavings, and red velvet crumbles',
    aliases: ['red velvet waffle', 'red velvet waffles', 'crimson cocoa waffle'],
    estimatedNutrition: { calories: 510, protein: 8, carbs: 64, fat: 24, servingGrams: 220 },
  },
  {
    normalizedName: 'nutella banana croffle',
    displayName: 'Nutella & Banana Croffle',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Korean-French Café Trend',
    generalizedDescription:
      'Buttery croissant dough pressed in a waffle iron, topped with Nutella, sliced banana, and whipped cream.',
    visualPrompt:
      'golden crisp laminated crescent-shaped flaky croffle drizzled with glossy Nutella chocolate hazelnut spread, fanned caramelized banana coins, crushed hazelnuts, and cloud of whipped cream',
    aliases: ['nutella banana croffle', 'banana nutella croffle', 'chocolate banana croffle'],
    estimatedNutrition: { calories: 490, protein: 8, carbs: 56, fat: 26, servingGrams: 210 },
  },
  {
    normalizedName: 'pesto sundried tomato burrata croffle',
    displayName: 'Pesto, Sundried Tomato & Burrata Croffle',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Bistro',
    generalizedDescription:
      'Savory crispy croissant-waffle topped with basil pesto, sundried tomatoes, and creamy burrata cheese.',
    visualPrompt:
      'golden flaky savory croffle base topped cleanly with vibrant green basil pesto, ruby sundried tomato strips, a whole plump ball of milky fresh white burrata cheese, and baby rocket leaves',
    aliases: ['pesto sundried tomato burrata croffle', 'burrata croffle', 'savory pesto croffle'],
    estimatedNutrition: { calories: 520, protein: 16, carbs: 38, fat: 34, servingGrams: 230 },
  },
  {
    normalizedName: 'sweet crepes with berries',
    displayName: 'Sweet Crepes with Berries',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'French Patisserie / Brunch',
    generalizedDescription:
      'Paper-thin French pancakes folded with pastry cream and fresh strawberries.',
    visualPrompt:
      'two delicately lacy golden French folded triangle crepes filled visibly with silky vanilla pastry cream alongside fresh halved ruby strawberries, blueberries, and icing sugar dusting',
    aliases: ['sweet crepes with berries', 'berry crepes', 'strawberry crepes', 'french sweet crepes'],
    estimatedNutrition: { calories: 380, protein: 8, carbs: 52, fat: 15, servingGrams: 220 },
  },
  {
    normalizedName: 'savory mushroom spinach crepe',
    displayName: 'Savory Mushroom & Spinach Crepe',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'French Bistro',
    generalizedDescription:
      'Thin buckwheat crepe filled with creamed spinach, mushrooms, and Gruyere cheese.',
    visualPrompt:
      'rustic golden-brown thin folded buckwheat galette crepe peeking open to reveal creamed emerald spinach, sliced sauteed brown mushrooms, and melted nutty golden Gruyere cheese with fresh thyme',
    aliases: ['savory mushroom spinach crepe', 'spinach mushroom galette', 'savory buckwheat crepe'],
    estimatedNutrition: { calories: 410, protein: 16, carbs: 34, fat: 23, servingGrams: 240 },
  },
  {
    normalizedName: 'english breakfast platter',
    displayName: 'English Breakfast Platter',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'British Breakfast',
    generalizedDescription:
      'Full platter with two eggs, chicken sausages, hash browns, grilled tomato, sauteed mushrooms, baked beans, and toast.',
    visualPrompt:
      'generous oval stoneware plate filled neatly with full English Breakfast: two golden fried sunny-side-up eggs, browned grilled chicken sausages, crispy golden triangle hash browns, blistered half tomato, sauteed mushrooms, small pot of baked beans, and buttered toast triangles',
    aliases: ['english breakfast platter', 'full english breakfast', 'classic english breakfast'],
    estimatedNutrition: { calories: 780, protein: 34, carbs: 62, fat: 43, servingGrams: 460 },
  },
  {
    normalizedName: 'vegetarian cafe breakfast platter',
    displayName: 'Vegetarian Cafe Breakfast Platter',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Contemporary Brunch Café',
    generalizedDescription:
      'Grilled halloumi or paneer steak, hash browns, baked beans, sauteed mushrooms, grilled tomato, and toast.',
    visualPrompt:
      'wholesome Vegetarian Cafe Breakfast Platter arranged cleanly on a stoneware plate with char-grilled golden herb paneer steak slabs, crisp potato hash browns, tomato-sauced baked beans ramekin, garlic mushrooms, roasted tomato half, and sourdough toast',
    aliases: ['vegetarian cafe breakfast platter', 'veg breakfast platter', 'vegetarian english breakfast'],
    estimatedNutrition: { calories: 690, protein: 26, carbs: 64, fat: 36, servingGrams: 440 },
  },
  {
    normalizedName: 'bun maska bun makkhan',
    displayName: 'Bun Maska (Bun Makkhan)',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Irani Café / Indian',
    generalizedDescription:
      'Soft, slightly sweet harvest bun sliced and slathered generously with whipped white butter.',
    visualPrompt:
      'fluffy golden-topped round Irani café milk bread bun sliced open sideways and generously slathered inside with thick pillows of creamy ivory whipped white butter on a small porcelain plate',
    aliases: ['bun maska bun makkhan', 'bun maska', 'bun makkhan', 'irani bun maska'],
    estimatedNutrition: { calories: 290, protein: 6, carbs: 38, fat: 13, servingGrams: 120 },
  },
  {
    normalizedName: 'cinnamon raisin oatmeal bowl',
    displayName: 'Cinnamon Raisin Oatmeal Bowl',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Wholesome Breakfast Café',
    generalizedDescription:
      'Warm rolled oats cooked in milk and topped with stewed apples, cinnamon, and raisins.',
    visualPrompt:
      'creamy warm comforting oatmeal porridge in a matte stoneware bowl topped neatly with warm cinnamon-glazed apple slices, plump sweet raisins, toasted walnuts, and a light dust of ground cinnamon',
    aliases: ['cinnamon raisin oatmeal bowl', 'apple cinnamon oatmeal', 'warm porridge bowl'],
    estimatedNutrition: { calories: 330, protein: 10, carbs: 56, fat: 7, servingGrams: 290 },
  },
  {
    normalizedName: 'crispy hash browns',
    displayName: 'Crispy Hash Browns',
    category: 'All-Day Breakfast, Eggs & Toast',
    cuisine: 'Classic Breakfast Side',
    generalizedDescription:
      'Golden-fried grated potato patties seasoned with sea salt and black pepper.',
    visualPrompt:
      'three golden-amber deeply textured crisp rectangular Crispy Hash Brown potato patties stacked cleanly on a ceramic side plate beside a small cup of tomato relish',
    aliases: ['crispy hash browns', 'hash browns', 'golden hash brown patties'],
    estimatedNutrition: { calories: 270, protein: 3, carbs: 32, fat: 14, servingGrams: 140 },
  },

  // =========================================================================
  // V. Artisanal Breads, Croissants & Savory Bakes (121-145)
  // =========================================================================
  {
    normalizedName: 'croissant',
    displayName: 'Classic Butter Croissant',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'French Bakery',
    generalizedDescription:
      'Flaky, golden-brown French pastry made with laminated yeast-leavened butter dough.',
    visualPrompt:
      'golden-brown deeply laminated crescent-shaped French Classic Butter Croissant with crisp flaky pastry layers resting on a ceramic pastry plate beside a small butter curl',
    aliases: ['croissant', 'classic butter croissant', 'butter croissant', 'french croissant', 'plain croissant'],
    estimatedNutrition: { calories: 290, protein: 5, carbs: 32, fat: 16, servingGrams: 95 },
  },
  {
    normalizedName: 'pain au chocolat',
    displayName: 'Pain au Chocolat',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'French Bakery',
    generalizedDescription:
      'Cuboid laminated croissant pastry wrapped around two batons of dark chocolate.',
    visualPrompt:
      'rectangular flaky golden laminated Pain au Chocolat pastry showing crisp honeycomb layers and two thick ribbons of rich melted dark chocolate peeking cleanly from either end',
    aliases: ['pain au chocolat', 'chocolate croissant', 'chocolate pastry croissant'],
    estimatedNutrition: { calories: 350, protein: 6, carbs: 38, fat: 19, servingGrams: 110 },
  },
  {
    normalizedName: 'almond frangipane croissant',
    displayName: 'Almond Frangipane Croissant',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'French Patisserie',
    generalizedDescription:
      'Twice-baked croissant filled with sweet almond cream and topped with toasted flaked almonds.',
    visualPrompt:
      'golden twice-baked flaky croissant generously blanketed across the top with baked sweet almond frangipane crust, crisp toasted slivered almonds, and snow-like icing sugar dust',
    aliases: ['almond frangipane croissant', 'almond croissant', 'twice baked almond croissant'],
    estimatedNutrition: { calories: 420, protein: 9, carbs: 42, fat: 24, servingGrams: 130 },
  },
  {
    normalizedName: 'cheese jalapeno croissant',
    displayName: 'Cheese & Jalapeno Croissant',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Contemporary Bakery',
    generalizedDescription:
      'Savory flaky croissant baked with cheddar cheese and pickled jalapeno slices inside.',
    visualPrompt:
      'golden blistered cheddar-baked savory flaky croissant topped with crisp bubbling aged cheddar crust and green pickled jalapeno rings nestled neatly into the pastry top',
    aliases: ['cheese jalapeno croissant', 'jalapeno cheddar croissant', 'savory cheese croissant'],
    estimatedNutrition: { calories: 370, protein: 11, carbs: 31, fat: 22, servingGrams: 120 },
  },
  {
    normalizedName: 'focaccia',
    displayName: 'Rosemary Sea Salt Focaccia',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Italian Bakery',
    generalizedDescription:
      'Dimpled, olive-oil-rich Italian flatbread baked with fresh rosemary needles and flaky sea salt.',
    visualPrompt:
      'golden dimpled Italian Rosemary Sea Salt Focaccia bread squares glistening with olive oil, sea salt crystals, and aromatic rosemary sprigs on a ceramic board',
    aliases: ['focaccia', 'rosemary sea salt focaccia', 'rosemary focaccia', 'herb focaccia', 'olive oil focaccia'],
    estimatedNutrition: { calories: 260, protein: 6, carbs: 38, fat: 9, servingGrams: 120 },
  },
  {
    normalizedName: 'artisanal sourdough loaf',
    displayName: 'Artisanal Sourdough Loaf',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Artisan Boulangerie',
    generalizedDescription:
      'Naturally fermented crusty bread with a chewy crumb and mild tangy flavor.',
    visualPrompt:
      'rustic blistered golden-mahogany Artisanal Sourdough Loaf lightly dusted with flour and cut to show two thick airy open-crumb slices resting beside a small crock of salted butter',
    aliases: ['artisanal sourdough loaf', 'sourdough bread loaf', 'country sourdough loaf', 'artisan bread loaf'],
    estimatedNutrition: { calories: 230, protein: 8, carbs: 46, fat: 1, servingGrams: 100 },
  },
  {
    normalizedName: 'multigrain atta bread',
    displayName: 'Multigrain Atta Bread',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Wholesome Bakery',
    generalizedDescription:
      'Wholesome loaf baked with whole wheat flour, flaxseeds, sunflower seeds, and oats.',
    visualPrompt:
      'hearty warm brown Multigrain Atta Bread loaf crusted densely with golden rolled oats, flaxseeds, pumpkin seeds, and sunflower seeds, sliced cleanly on a timber board',
    aliases: ['multigrain atta bread', 'multigrain bread', 'seeded whole wheat bread', 'atta loaf'],
    estimatedNutrition: { calories: 245, protein: 9, carbs: 42, fat: 4.5, servingGrams: 100 },
  },
  {
    normalizedName: 'everything bagel',
    displayName: 'Everything Bagel',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'New York Bakery',
    generalizedDescription:
      'Chewy boiled-and-baked ring bread topped with sesame, poppy seeds, dried garlic, and onion.',
    visualPrompt:
      'glossy golden-crust New York boiled Everything Bagel thickly coated with black and white sesame seeds, poppy seeds, toasted garlic, onion flakes, and coarse salt beside cream cheese',
    aliases: ['everything bagel', 'bagel plain cream cheese', 'boiled bagel'],
    estimatedNutrition: { calories: 290, protein: 10, carbs: 56, fat: 2.5, servingGrams: 115 },
  },
  {
    normalizedName: 'garlic bread',
    displayName: 'Classic Garlic Bread',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'Toasted baguette slices brushed with garlic-parsley butter.',
    visualPrompt:
      'four warm slices of golden-toasted Classic Garlic Bread brushed generously with herb garlic butter, melted mozzarella edge, and chopped fresh parsley on a stoneware plate',
    aliases: ['garlic bread', 'classic garlic bread', 'toasted garlic bread', 'garlic baguette', 'herb garlic bread'],
    estimatedNutrition: { calories: 320, protein: 9, carbs: 34, fat: 16, servingGrams: 140 },
  },
  {
    normalizedName: 'cheesy pull-apart garlic bread',
    displayName: 'Cheesy Pull-Apart Garlic Bread',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Contemporary Bakery Café',
    generalizedDescription:
      'Loaf of sourdough or baguette scored and stuffed with mozzarella, garlic butter, and herbs.',
    visualPrompt:
      'round crisp golden cross-hatched loaf of Cheesy Pull-Apart Garlic Bread overflowing from every cut diamond seam with molten bubbly white mozzarella, garlic butter, and green parsley',
    aliases: ['cheesy pull-apart garlic bread', 'pull apart garlic bread', 'cheese stuffed garlic bread'],
    estimatedNutrition: { calories: 540, protein: 19, carbs: 48, fat: 30, servingGrams: 240 },
  },
  {
    normalizedName: 'wood-fired focaccia garlic bread',
    displayName: 'Wood-Fired Focaccia Garlic Bread',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'Pizza-dough style flatbread baked in a wood-fired oven with roasted garlic and mozzarella.',
    visualPrompt:
      'char-blistered artisan Wood-Fired Focaccia Garlic Bread cut into warm triangles showcasing bubbling golden mozzarella spots, whole caramelized roasted garlic cloves, and oregano oil glaze',
    aliases: ['wood-fired focaccia garlic bread', 'wood fired garlic bread', 'pizza dough garlic bread'],
    estimatedNutrition: { calories: 460, protein: 16, carbs: 50, fat: 22, servingGrams: 210 },
  },
  {
    normalizedName: 'savory patties puff pastry',
    displayName: 'Aloo Puff Patties',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Indian Bakery / Café',
    generalizedDescription:
      'Flaky, golden layered puff pastry stuffed with spiced mashed potatoes and green peas.',
    visualPrompt:
      'two crisp golden layered Aloo Puff Patties pastry triangles broken slightly at the edge to reveal warmly spiced golden mashed potatoes and bright green peas beside mint chutney',
    aliases: ['savory patties puff pastry', 'aloo puff patties', 'aloo patties', 'veg puff', 'potato puff pastry'],
    estimatedNutrition: { calories: 310, protein: 7, carbs: 30, fat: 18, servingGrams: 130 },
  },
  {
    normalizedName: 'spiced paneer puff',
    displayName: 'Spiced Paneer Puff',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Indian Bakery / Café',
    generalizedDescription:
      'Crisp bakery puff pastry filled with crumbled cottage cheese tossed in tikka masala spices.',
    visualPrompt:
      'two golden layered rectangular Spiced Paneer Puff turnovers showing visible crisp pastry sheets splitting gently to show rich spiced tomato-orange paneer cottage cheese masala filling',
    aliases: ['spiced paneer puff', 'paneer puff', 'paneer patties', 'paneer tikka puff'],
    estimatedNutrition: { calories: 340, protein: 11, carbs: 28, fat: 20, servingGrams: 135 },
  },
  {
    normalizedName: 'chicken tikka puff',
    displayName: 'Chicken Tikka Puff',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Indian Bakery / Café',
    generalizedDescription:
      'Baked puff pastry turnover filled with smoky diced chicken tikka and onions.',
    visualPrompt:
      'two golden glazed sesame-topped flaky Chicken Tikka Puff pastries resting on a warm ceramic plate, one halved to reveal smoky spiced tandoori diced chicken filling',
    aliases: ['chicken tikka puff', 'chicken puff', 'chicken patties', 'keema puff pastry'],
    estimatedNutrition: { calories: 360, protein: 15, carbs: 28, fat: 21, servingGrams: 140 },
  },
  {
    normalizedName: 'mushroom vol-au-vent',
    displayName: 'Mushroom Vol-au-Vent',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'French Patisserie / Bistro',
    generalizedDescription:
      'Small hollow puff pastry cases filled with a creamy garlic-mushroom ragout.',
    visualPrompt:
      'three delicate tall golden round fluted puff pastry Vol-au-Vent shells overflowing with silky herb-flecked creamy garlic wild mushroom ragout and fresh micro-thyme leaves',
    aliases: ['mushroom vol-au-vent', 'vol au vent', 'mushroom puff basket'],
    estimatedNutrition: { calories: 320, protein: 7, carbs: 26, fat: 21, servingGrams: 145 },
  },
  {
    normalizedName: 'spinach corn quiche',
    displayName: 'Spinach & Corn Quiche',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'French Café',
    generalizedDescription:
      'Savory shortcrust pastry tart filled with a baked custard of spinach, sweet corn, and cheese.',
    visualPrompt:
      'clean tall wedge slice of crisp golden-crusted Spinach & Corn Quiche revealing baked pale custard packed cleanly with vibrant green spinach ribbons, bright yellow sweet corn kernels, and browned cheese top',
    aliases: ['spinach corn quiche', 'spinach and corn quiche', 'veg quiche tart'],
    estimatedNutrition: { calories: 390, protein: 14, carbs: 28, fat: 25, servingGrams: 180 },
  },
  {
    normalizedName: 'chicken leek quiche',
    displayName: 'Chicken & Leek Quiche',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'French Bistro',
    generalizedDescription:
      'Savory French custard tart baked with shredded roast chicken, caramelized leeks, and gruyere.',
    visualPrompt:
      'thick golden fluted-crust slice of Chicken & Leek Quiche revealing velvety golden savory egg custard studded neatly with tender shredded chicken, delicate pale green leeks, and browned gruyere crust',
    aliases: ['chicken leek quiche', 'chicken and leek quiche', 'non veg quiche'],
    estimatedNutrition: { calories: 430, protein: 21, carbs: 25, fat: 27, servingGrams: 185 },
  },
  {
    normalizedName: 'baked cream roll',
    displayName: 'Baked Cream Roll',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Indian Retro Bakery',
    generalizedDescription:
      'Conical flaky puff pastry horn piped full of sweet whipped vanilla buttercream.',
    visualPrompt:
      'two crisp spiraled golden-brown flaky puff pastry Cream Roll cones brimming cleanly at both ends with smooth piped ivory vanilla buttercream garnished delicately with crushed green pistachio flecks',
    aliases: ['baked cream roll', 'cream roll', 'puff pastry cream horn', 'bakery cream roll'],
    estimatedNutrition: { calories: 290, protein: 4, carbs: 34, fat: 15, servingGrams: 95 },
  },
  {
    normalizedName: 'cinnamon roll',
    displayName: 'Cinnamon Roll',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Scandinavian / American Bakery',
    generalizedDescription:
      'Sweet yeast-leavened dough rolled with cinnamon sugar and topped with warm cream cheese glaze.',
    visualPrompt:
      'warm plump spiraled golden Cinnamon Roll with distinct brown-sugar cinnamon swirl layers generously draped with glossy ivory vanilla cream cheese frosting on a porcelain dessert plate',
    aliases: ['cinnamon roll', 'cinnamon swirl', 'cinnabon bun', 'iced cinnamon bun'],
    estimatedNutrition: { calories: 420, protein: 7, carbs: 60, fat: 17, servingGrams: 140 },
  },
  {
    normalizedName: 'korean cream cheese garlic bun',
    displayName: 'Korean Cream Cheese Garlic Bun',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Korean Bakery Café',
    generalizedDescription:
      'Brioche bun cut into wedges, filled with sweetened cream cheese, and dipped in savory garlic herb butter.',
    visualPrompt:
      'glossy golden-brown round brioche Korean Cream Cheese Garlic Bun scored cleanly into six petal wedges bursting generously with smooth white whipped cream cheese, garlic butter sheen, and dried parsley',
    aliases: ['korean cream cheese garlic bun', 'korean garlic bread', 'cream cheese garlic bun'],
    estimatedNutrition: { calories: 490, protein: 10, carbs: 46, fat: 29, servingGrams: 175 },
  },
  {
    normalizedName: 'jalapeno cheddar scone',
    displayName: 'Jalapeno & Cheddar Scone',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'British Bakery',
    generalizedDescription:
      'Tender, crumbly British-style baked good studded with sharp cheddar and spicy jalapenos.',
    visualPrompt:
      'rustic golden triangular savory Jalapeno & Cheddar Scone with crisp craggy cheese crust visibly flecked with orange sharp cheddar spots and diced green jalapenos beside a pat of butter',
    aliases: ['jalapeno cheddar scone', 'jalapeno and cheddar scone', 'savory cheese scone'],
    estimatedNutrition: { calories: 360, protein: 10, carbs: 36, fat: 19, servingGrams: 125 },
  },
  {
    normalizedName: 'cranberry orange muffin',
    displayName: 'Cranberry Orange Muffin',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Dome-topped bakery muffin bursting with tart cranberries and orange zest.',
    visualPrompt:
      'golden high-domed bakery Cranberry Orange Muffin speckled generously with ruby-red tangy cranberries, fine candied orange zest shreds, and coarse sparkling sugar crystals on top',
    aliases: ['cranberry orange muffin', 'orange cranberry muffin'],
    estimatedNutrition: { calories: 360, protein: 5, carbs: 52, fat: 14, servingGrams: 130 },
  },
  {
    normalizedName: 'double chocolate chip muffin',
    displayName: 'Double Chocolate Chip Muffin',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Rich cocoa muffin loaded with dark and milk chocolate chunks.',
    visualPrompt:
      'tall velvety dark-cocoa bakery Double Chocolate Chip Muffin in a warm parchment tulip wrapper crowned generously with glossy melted dark and milk chocolate chunks',
    aliases: ['double chocolate chip muffin', 'double chocolate muffin', 'chocolate chunk muffin'],
    estimatedNutrition: { calories: 440, protein: 6, carbs: 56, fat: 22, servingGrams: 140 },
  },
  {
    normalizedName: 'blueberry streusel muffin',
    displayName: 'Blueberry Streusel Muffin',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Moist vanilla muffin filled with blueberries and topped with a crunchy cinnamon crumb.',
    visualPrompt:
      'plump golden bakery Blueberry Streusel Muffin bursting cleanly with juicy purple blueberries and crowned heavily with crisp golden brown-sugar cinnamon streusel crumbles',
    aliases: ['blueberry streusel muffin', 'blueberry crumb muffin', 'blueberry muffin'],
    estimatedNutrition: { calories: 390, protein: 5, carbs: 54, fat: 17, servingGrams: 135 },
  },
  {
    normalizedName: 'classic banana walnut bread',
    displayName: 'Classic Banana Walnut Bread',
    category: 'Artisanal Breads, Croissants & Savory Bakes',
    cuisine: 'Home-Style Bakery Café',
    generalizedDescription:
      'Moist loaf cake made from mashed ripe bananas and toasted walnuts.',
    visualPrompt:
      'two thick rich mahogany-golden slices of moist Classic Banana Walnut Bread stacked casually on a plate showing dense tender crumb packed with roasted walnut halves and a pat of salted butter',
    aliases: ['classic banana walnut bread', 'banana walnut cake', 'banana walnut bread', 'banana bread slice'],
    estimatedNutrition: { calories: 350, protein: 6, carbs: 44, fat: 17, servingGrams: 120 },
  },
];

