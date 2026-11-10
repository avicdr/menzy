import type { CanonicalCatalogItem } from '../types';

export const CONTINENTAL_MEDITERRANEAN_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // XV. Continental, Mediterranean, Mexican & Pub Grub (496-550)
  // =========================================================================
  {
    normalizedName: 'french onion soup',
    displayName: 'French Onion Soup',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Bistro',
    generalizedDescription:
      'Slow-caramelized sweet onion broth topped with a toasted baguette slice and melted, bubbly Gruyère cheese.',
    visualPrompt:
      'classic oven-browned lion-head stoneware soup crock overflowing around the rim with bubbling golden-blistered melted Gruyère cheese perched atop thick toasted baguette slice floating over deep mahogany caramelized French Onion broth',
    aliases: ['french onion soup', 'soupe a l oignon', 'gruyere french onion soup'],
    estimatedNutrition: { calories: 380, protein: 16, carbs: 32, fat: 21, servingGrams: 320 },
  },
  {
    normalizedName: 'cream of broccoli almond soup',
    displayName: 'Cream of Broccoli & Almond Soup',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'European Contemporary Café',
    generalizedDescription:
      'Velvety green soup made from steamed broccoli florets and cream, garnished with toasted slivered almonds.',
    visualPrompt:
      'vivid emerald-sage velvety smooth Cream of Broccoli & Almond Soup inside a broad ivory ceramic bowl finished gently with heavy cream swirl, toasted crispy slivered flaked almonds, and delicate broccoli micro-floret',
    aliases: ['cream of broccoli almond soup', 'broccoli almond soup', 'cream of broccoli soup'],
    estimatedNutrition: { calories: 270, protein: 9, carbs: 16, fat: 19, servingGrams: 280 },
  },
  {
    normalizedName: 'roasted pumpkin sage soup',
    displayName: 'Roasted Pumpkin & Sage Soup',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'European Autumn Bistro',
    generalizedDescription:
      'Silky autumn-style soup made from oven-roasted butternut squash or pumpkin infused with brown butter and sage.',
    visualPrompt:
      'glowing burnt orange-amber silky Roasted Pumpkin Soup inside a warm ceramic soup bowl topped cleanly with golden toasted pepita pumpkin seeds, crisp whole fried green sage leaf, and rich brown-butter cream swirl',
    aliases: ['roasted pumpkin sage soup', 'roasted pumpkin soup', 'butternut squash sage soup'],
    estimatedNutrition: { calories: 240, protein: 5, carbs: 26, fat: 13, servingGrams: 280 },
  },
  {
    normalizedName: 'minestrone alla genovese',
    displayName: 'Minestrone Alla Genovese',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Italian',
    generalizedDescription:
      'Hearty Italian vegetable soup loaded with beans, small pasta shells, diced veggies, tomato broth, and a swirl of pesto.',
    visualPrompt:
      'generous rustic ceramic bowl of Minestrone soup teeming cleanly with bright crimson tomato vegetable broth, white cannellini beans, small ditalini pasta, zucchini, carrots, celery, crowned neatly with bright green Genovese basil pesto drizzle and shaved parmesan',
    aliases: ['minestrone alla genovese', 'minestrone soup', 'italian vegetable minestrone'],
    estimatedNutrition: { calories: 250, protein: 10, carbs: 38, fat: 7, servingGrams: 320 },
  },
  {
    normalizedName: 'cream of wild mushroom soup',
    displayName: 'Cream of Wild Mushroom Soup',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'European Bistro',
    generalizedDescription:
      'Earthy, rich soup blended from sautéed button and porcini mushrooms, garlic, thyme, and heavy cream.',
    visualPrompt:
      'velvety taupe-ivory rich Cream of Wild Mushroom Soup inside a matte stoneware bowl garnished cleanly with pan-seared sliced golden cremini mushrooms, white cream ribbon, truffle oil gleam, and fresh thyme leaves',
    aliases: ['cream of wild mushroom soup', 'wild mushroom soup', 'cream of mushroom soup'],
    estimatedNutrition: { calories: 290, protein: 6, carbs: 16, fat: 22, servingGrams: 280 },
  },
  {
    normalizedName: 'classic waldorf salad',
    displayName: 'Classic Waldorf Salad',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'American Bistro Classic',
    generalizedDescription:
      'Crisp apple chunks, celery, seedless grapes, and toasted walnuts dressed in lemony mayonnaise over lettuce cups.',
    visualPrompt:
      'fresh pale green butter-lettuce cups inside a stoneware plate overflowing with crisp creamy lemon-dressed red-skin apple dices, crunchy green celery, halved red and green grapes, and generous toasted halved walnuts',
    aliases: ['classic waldorf salad', 'waldorf salad', 'apple walnut grape salad'],
    estimatedNutrition: { calories: 340, protein: 6, carbs: 26, fat: 25, servingGrams: 230 },
  },
  {
    normalizedName: 'watermelon feta mint salad',
    displayName: 'Watermelon, Feta & Mint Salad',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Mediterranean Café',
    generalizedDescription:
      'Chilled cubes of sweet red watermelon tossed with salty crumbled feta cheese, fresh mint, and balsamic reduction.',
    visualPrompt:
      'sharp bright ruby red sweet watermelon cubes stacked artfully on a white salad plate scattered generously with snowy crumbled white feta cheese blocks, bright green fresh mint leaves, toasted pumpkin seeds, and syrupy dark balsamic glaze',
    aliases: ['watermelon feta mint salad', 'watermelon feta salad', 'feta watermelon arugula salad'],
    estimatedNutrition: { calories: 210, protein: 7, carbs: 22, fat: 11, servingGrams: 240 },
  },
  {
    normalizedName: 'quinoa roasted beetroot orange salad',
    displayName: 'Quinoa, Roasted Beetroot & Orange Salad',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Contemporary Health Bistro',
    generalizedDescription:
      'Protein-rich quinoa tossed with earthy roasted beets, citrus segments, arugula, and honey-mustard dressing.',
    visualPrompt:
      'vibrant wellness salad bowl mounded neatly with fluffy white and red quinoa grains, jewel-like ruby roasted beetroot wedges, fresh sunny tangerine orange segments, peppery wild arugula leaves, toasted pistachios, and golden dressing sheen',
    aliases: ['quinoa roasted beetroot orange salad', 'beetroot quinoa orange salad', 'beet citrus quinoa bowl'],
    estimatedNutrition: { calories: 330, protein: 11, carbs: 46, fat: 12, servingGrams: 270 },
  },
  {
    normalizedName: 'insalata caprese',
    displayName: 'Insalata Caprese',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Italian',
    generalizedDescription:
      'Alternating slices of ripe heirloom tomatoes and fresh buffalo mozzarella topped with sweet basil leaves and extra-virgin olive oil.',
    visualPrompt:
      'impeccable fan arrangement alternating thick juicy ruby heirloom tomato rounds with milky snow-white fresh buffalo mozzarella medallions tucked delicately with whole sweet green basil leaves, cracked black pepper, sea salt, emerald olive oil, and balsamic dots',
    aliases: ['insalata caprese', 'caprese salad', 'tomato mozzarella basil salad'],
    estimatedNutrition: { calories: 310, protein: 16, carbs: 9, fat: 24, servingGrams: 230 },
  },
  {
    normalizedName: 'nicoise salad',
    displayName: 'Nicoise Salad',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Provençal',
    generalizedDescription:
      'French composed salad with boiled baby potatoes, crisp green beans, olives, cherry tomatoes, hard-boiled egg, and seared tuna or chicken.',
    visualPrompt:
      'large composed French Nicoise platter showcasing neatly sectioned pink-centered sesame seared tuna slices, quartered jammy boiled eggs, tender halved baby potatoes, crisp green haricots verts beans, black Nicoise olives, cherry tomatoes, and mixed greens',
    aliases: ['nicoise salad', 'salade nicoise', 'french tuna egg salad'],
    estimatedNutrition: { calories: 420, protein: 32, carbs: 26, fat: 21, servingGrams: 340 },
  },
  {
    normalizedName: 'baba ganoush with lavash',
    displayName: 'Baba Ganoush with Lavash',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Middle Eastern',
    generalizedDescription:
      'Smoky Middle Eastern dip made from char-roasted eggplant mashed with tahini, garlic, and lemon juice, served with crisp flatbread.',
    visualPrompt:
      'shallow ceramic mezze dish of textured creamy smoky cream-gold Baba Ganoush swirled neatly with extra-virgin olive oil, ruby pomegranate arils, parsley, and crisp baked sesame lavash crackers perched beside',
    aliases: ['baba ganoush with lavash', 'baba ganoush', 'smoky eggplant dip lavash'],
    estimatedNutrition: { calories: 310, protein: 7, carbs: 32, fat: 18, servingGrams: 220 },
  },
  {
    normalizedName: 'tzatziki with warm pita',
    displayName: 'Tzatziki with Warm Pita',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Greek',
    generalizedDescription:
      'Cooling Greek yogurt dip mixed with grated cucumber, garlic, dill, and olive oil.',
    visualPrompt:
      'cool ceramic dip bowl heaped cleanly with thick pure-white Greek Tzatziki yogurt flecked visibly with fresh green grated cucumber and feathery dill weed drenched gently with emerald olive oil alongside warm blistered triangular pita breads',
    aliases: ['tzatziki with warm pita', 'tzatziki dip', 'greek cucumber yogurt dip'],
    estimatedNutrition: { calories: 290, protein: 11, carbs: 34, fat: 12, servingGrams: 220 },
  },
  {
    normalizedName: 'beetroot walnut hummus',
    displayName: 'Beetroot & Walnut Hummus',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Contemporary Mediterranean',
    generalizedDescription:
      'Vibrant magenta chickpea-tahini dip blended with roasted red beets and topped with walnuts and feta.',
    visualPrompt:
      'striking luminous electric-magenta swirled Beetroot & Walnut Hummus inside a stoneware bowl topped cleanly with golden toasted walnut halves, snowy crumbled white feta cheese, herb microgreens, olive oil puddle, and pita triangles',
    aliases: ['beetroot walnut hummus', 'beetroot hummus', 'pink beet hummus dip'],
    estimatedNutrition: { calories: 350, protein: 11, carbs: 31, fat: 21, servingGrams: 210 },
  },
  {
    normalizedName: 'spanakopita greek spinach pie',
    displayName: 'Spanakopita (Greek Spinach Pie)',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Greek',
    generalizedDescription:
      'Crispy phyllo pastry triangles stuffed with sautéed spinach, dill, onions, and tangy feta cheese.',
    visualPrompt:
      'four delicate golden blistered crisp paper-thin flaky folded triangles of Greek Spanakopita filo pastry dusted lightly with white sesame seeds, one corner revealing vibrant green dill spinach and white feta cheese beside creamy lemon yogurt dip',
    aliases: ['spanakopita greek spinach pie', 'spanakopita', 'greek spinach feta pie'],
    estimatedNutrition: { calories: 380, protein: 13, carbs: 32, fat: 23, servingGrams: 190 },
  },
  {
    normalizedName: 'turkish cheese zaatar pide',
    displayName: "Turkish Cheese & Za'atar Pide",
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Turkish',
    generalizedDescription:
      'Boat-shaped hand-stretched Turkish flatbread baked with melted kashkaval/mozzarella cheese and aromatic za\'atar herbs.',
    visualPrompt:
      'iconic canoe boat-shaped wood-fired golden crispy Turkish Cheese Pide crust overflowing end-to-end inside with blistered melted kashkaval mozzarella cheese sprinkled abundantly with olive oil roasted green za\'atar herbs and toasted sesame',
    aliases: ['turkish cheese zaatar pide', 'cheese pide', 'zaatar pide flatbread'],
    estimatedNutrition: { calories: 640, protein: 24, carbs: 72, fat: 28, servingGrams: 320 },
  },
  {
    normalizedName: 'spiced lamb chicken turkish pide',
    displayName: 'Spiced Lamb / Chicken Turkish Pide',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Turkish',
    generalizedDescription:
      'Boat-shaped crusty flatbread topped with minced spiced lamb, tomatoes, peppers, and parsley.',
    visualPrompt:
      'long canoe boat-shaped crisp blistered Turkish Kiymali Pide stuffed with richly spiced browned minced lamb, diced tomatoes, green sweet peppers, melted cheese edge, fresh parsley, and lemon wedge alongside',
    aliases: ['spiced lamb chicken turkish pide', 'lamb pide', 'chicken turkish pide', 'kiymali pide'],
    estimatedNutrition: { calories: 690, protein: 34, carbs: 68, fat: 31, servingGrams: 350 },
  },
  {
    normalizedName: 'crispy calamari rings',
    displayName: 'Crispy Calamari Rings',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Mediterranean Seafood Bistro',
    generalizedDescription:
      'Tender squid rings dusted in seasoned semolina flour, flash-fried golden, and served with garlic aioli and lemon.',
    visualPrompt:
      'generous pile of crisp light-golden semolina-dusted fried Calamari rings and tentacles arranged inside a rustic plate beside fresh grilled yellow lemon half, chopped flat-leaf parsley, and ivory garlic aioli dip',
    aliases: ['crispy calamari rings', 'fried calamari', 'salt pepper squid rings'],
    estimatedNutrition: { calories: 430, protein: 24, carbs: 32, fat: 23, servingGrams: 210 },
  },
  {
    normalizedName: 'prawn cocktail',
    displayName: 'Prawn Cocktail',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Classic Continental Retro',
    generalizedDescription:
      'Poached chilled prawns arranged on crisp iceberg lettuce and draped in tangy Marie Rose cocktail sauce.',
    visualPrompt:
      'classic wide stemmed chilled glass bowl lined with crisp emerald shredded iceberg lettuce topped cleanly with plump curled coral-pink cold poached prawns hooked gracefully along the glass rim drenched in glossy peach-pink Marie Rose sauce and lemon twist',
    aliases: ['prawn cocktail', 'shrimp cocktail', 'marie rose prawn starter'],
    estimatedNutrition: { calories: 280, protein: 22, carbs: 10, fat: 17, servingGrams: 190 },
  },
  {
    normalizedName: 'gambas pil pil sizzling garlic prawns',
    displayName: 'Gambas Pil Pil (Sizzling Garlic Prawns)',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Spanish Tapas',
    generalizedDescription:
      'Spanish tapas dish of prawns sizzling in terracotta-baked olive oil with sliced garlic and dried guindilla chilies.',
    visualPrompt:
      'rustic terracotta Spanish cazuela dish holding glossy curled pink prawns simmering brightly inside golden-red garlic chili olive oil alongside golden sliced garlic chips, crushed whole red dried chilies, parsley, and warm crusty baguette slices',
    aliases: ['gambas pil pil sizzling garlic prawns', 'gambas pil pil', 'gambas al ajillo', 'sizzling spanish prawns'],
    estimatedNutrition: { calories: 390, protein: 26, carbs: 14, fat: 26, servingGrams: 220 },
  },
  {
    normalizedName: 'patatas bravas',
    displayName: 'Patatas Bravas',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Spanish Tapas',
    generalizedDescription:
      'Crispy fried potato cubes topped with a spicy Spanish smoked-paprika tomato sauce and creamy garlic aioli.',
    visualPrompt:
      'deep crisp golden irregular fried potato chunks Spanish Patatas Bravas arranged in a stoneware tapas bowl crisscrossed dramatically with glowing brick-red smoky paprika brava tomato sauce ribbons, white creamy garlic alioli drizzle, and fresh parsley',
    aliases: ['patatas bravas', 'spanish patatas bravas', 'bravas potatoes'],
    estimatedNutrition: { calories: 420, protein: 6, carbs: 50, fat: 22, servingGrams: 240 },
  },
  {
    normalizedName: 'mushroom truffle arancini',
    displayName: 'Mushroom & Truffle Arancini',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Sicilian / Italian Bistro',
    generalizedDescription:
      'Sicilian deep-fried risotto balls stuffed with mozzarella and wild mushrooms, served over warm marinara sauce.',
    visualPrompt:
      'four crisp deep-golden panko-crusted spherical Sicilian Risotto Arancini balls with one broken delicately open showing creamy mushroom arborio rice and stretchy white mozzarella sitting cleanly over glossy red tomato marinara and parmesan snow',
    aliases: ['mushroom truffle arancini', 'truffle arancini', 'risotto balls arancini'],
    estimatedNutrition: { calories: 480, protein: 15, carbs: 48, fat: 25, servingGrams: 220 },
  },
  {
    normalizedName: 'baked brie with honey walnuts',
    displayName: 'Baked Brie with Honey & Walnuts',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Wine & Café Bar',
    generalizedDescription:
      'Whole wheel of soft Brie cheese baked until molten, topped with warm honey, rosemary, toasted walnuts, and crostini.',
    visualPrompt:
      'whole snow-rinded mini French Brie cheese wheel inside a round ceramic baker sliced gently at the top showing oozing molten warm cream cheese drowned smoothly in golden honeycomb honey drizzle, toasted walnuts, rosemary sprig, berries, and toasted crostini slices',
    aliases: ['baked brie with honey walnuts', 'baked brie', 'honey walnut brie board'],
    estimatedNutrition: { calories: 640, protein: 24, carbs: 38, fat: 44, servingGrams: 250 },
  },
  {
    normalizedName: 'charcuterie artisanal cheese board',
    displayName: 'Charcuterie & Artisanal Cheese Board',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'European Grazing Bistro',
    generalizedDescription:
      'Wooden grazing platter featuring cured meats or gourmet cheeses, crackers, olives, grapes, nuts, and fig jam.',
    visualPrompt:
      'gorgeous circular natural wood grazing platter arranged cleanly with wedges of aged cheddar, creamy brie, blue cheese crumbles, folded prosciutto ribbons, green and black olives, plump red grapes, figs, roasted almonds, walnut halves, crisp artisan crackers, and a tiny jar of fig jam',
    aliases: ['charcuterie artisanal cheese board', 'artisanal cheese platter', 'charcuterie board', 'grazing cheese platter'],
    estimatedNutrition: { calories: 780, protein: 32, carbs: 44, fat: 54, servingGrams: 350 },
  },
  {
    normalizedName: 'korean mozzarella corn dog',
    displayName: 'Korean Mozzarella Corn Dog',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Korean Street Café',
    generalizedDescription:
      'Skewer of half-sausage and half-mozzarella dipped in yeasted batter, rolled in diced potatoes or panko, fried crisp, and dusted with sugar.',
    visualPrompt:
      'two crisp deeply golden chunky potato-cube-and-panko crusted Korean Street Corn Dogs on wooden skewers broken subtly at top to reveal dramatic stretchy white mozzarella pull crisscrossed with golden mustard and bright ketchup zigzags',
    aliases: ['korean mozzarella corn dog', 'korean corn dog', 'potato mozzarella corndog'],
    estimatedNutrition: { calories: 510, protein: 18, carbs: 46, fat: 28, servingGrams: 210 },
  },
  {
    normalizedName: 'loaded pulled chicken tacos',
    displayName: 'Loaded Pulled Chicken Tacos',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Mexican Street Grill',
    generalizedDescription:
      'Soft or hard corn taco shells filled with slow-cooked chipotle chicken, pico de gallo, sour cream, and shredded lettuce.',
    visualPrompt:
      'three neatly upright soft grilled corn tortillas tucked gently on a taco stand filled richly with smoky chipotle pulled chicken, bright fresh tomato-onion pico de gallo salsa, emerald cilantro leaves, radish rounds, sour cream drizzle, and lime wedges',
    aliases: ['loaded pulled chicken tacos', 'pulled chicken tacos', 'chipotle chicken tacos'],
    estimatedNutrition: { calories: 520, protein: 32, carbs: 46, fat: 23, servingGrams: 280 },
  },
  {
    normalizedName: 'baja crispy fish tacos',
    displayName: 'Baja Crispy Fish Tacos',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Baja Mexican Coastal',
    generalizedDescription:
      'Soft flour tortillas filled with beer-battered fried fish strips, purple cabbage slaw, and lime-cilantro crema.',
    visualPrompt:
      'three soft warm charred flour tortillas piled generously with chunky crisp beer-battered white cod fish fingers, crunchy vibrant purple-pink cabbage slaw, pickled jalapeños, cilantro sprigs, zigzags of cool lime crema, and charred lime half',
    aliases: ['baja crispy fish tacos', 'crispy fish tacos', 'baja fish tacos'],
    estimatedNutrition: { calories: 560, protein: 28, carbs: 50, fat: 28, servingGrams: 290 },
  },
  {
    normalizedName: 'spicy black bean avocado tacos',
    displayName: 'Spicy Black Bean & Avocado Tacos',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Mexican Plant-Based',
    generalizedDescription:
      'Vegetarian tacos loaded with seasoned black beans, charred corn, diced avocado, and pickled red onions.',
    visualPrompt:
      'three charred soft corn tacos overflowing with hearty glossy dark cumin-spiced black beans, sweet charred yellow corn kernels, fresh diced emerald green avocado cubes, bright magenta pickled red onions, crumbled white queso fresco, and cilantro',
    aliases: ['spicy black bean avocado tacos', 'black bean tacos', 'vegan avocado bean tacos'],
    estimatedNutrition: { calories: 450, protein: 16, carbs: 58, fat: 18, servingGrams: 270 },
  },
  {
    normalizedName: 'tex-mex chimichanga',
    displayName: 'Tex-Mex Chimichanga',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Tex-Mex',
    generalizedDescription:
      'Deep-fried flour tortilla burrito stuffed with spiced rice, beans, cheese, and chicken or veggies, topped with salsa and queso.',
    visualPrompt:
      'golden blistered crisp deep-fried rectangular Chimichanga burrito halved neatly to reveal spiced chicken/bean rice filling smothered halfway under molten yellow cheddar queso, red salsa verde-roja drizzle, guacamole scoop, and sour cream',
    aliases: ['tex-mex chimichanga', 'fried chimichanga', 'chicken veg chimichanga'],
    estimatedNutrition: { calories: 710, protein: 28, carbs: 64, fat: 38, servingGrams: 350 },
  },
  {
    normalizedName: 'chicken parmigiana',
    displayName: 'Chicken Parmigiana',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Italian-American Bistro',
    generalizedDescription:
      'Breaded, pan-fried chicken breast topped with rich marinara sauce and melted mozzarella-parmesan, served with spaghetti or mash.',
    visualPrompt:
      'golden panko-breaded crispy Chicken Breast cutlet baked bubbling with tangy bright ruby marinara tomato sauce, brown blistered melted mozzarella and aged parmesan blanket resting beside twirled herb spaghetti marinara and fresh basil leaves',
    aliases: ['chicken parmigiana', 'chicken parm', 'pollo alla parmigiana'],
    estimatedNutrition: { calories: 740, protein: 48, carbs: 54, fat: 36, servingGrams: 380 },
  },
  {
    normalizedName: 'chicken kiev',
    displayName: 'Chicken Kiev',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Eastern European / Heritage Café',
    generalizedDescription:
      'Breaded chicken breast rolled around a core of cold garlic-and-herb butter that melts and spurts when cut open.',
    visualPrompt:
      'golden oblong breadcrumb-fried Chicken Kiev cutlet cleanly sliced diagonally on a warm stoneware plate showing rich glistening liquid green parsley-garlic herb butter pouring slowly out next to creamy mashed potato swirl and buttered green peas',
    aliases: ['chicken kiev', 'garlic herb butter chicken kiev', 'heritage chicken kiev'],
    estimatedNutrition: { calories: 690, protein: 40, carbs: 38, fat: 42, servingGrams: 330 },
  },
  {
    normalizedName: 'chicken cordon bleu',
    displayName: 'Chicken Cordon Bleu',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Classic Continental Bistro',
    generalizedDescription:
      'Pounded chicken breast wrapped around chicken ham and Swiss cheese, breaded and pan-fried until crisp and golden.',
    visualPrompt:
      'crisp golden-brown oval Chicken Cordon Bleu roulade sliced into three thick clean medallions revealing spiral center layers of pink smoked chicken ham and oozy melted pale Swiss gruyere cheese garnished with creamy mustard sauce and greens',
    aliases: ['chicken cordon bleu', 'swiss ham stuffed chicken', 'cordon bleu cutlet'],
    estimatedNutrition: { calories: 680, protein: 46, carbs: 32, fat: 41, servingGrams: 320 },
  },
  {
    normalizedName: 'coq au vin bistro style',
    displayName: 'Coq au Vin (Bistro Style)',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Bistro',
    generalizedDescription:
      'Chicken slow-braised with button mushrooms, pearl onions, garlic, and herbs in a rich, glossy red-wine-style jus.',
    visualPrompt:
      'heavy dark stoneware French casserole dish displaying deeply braised glazed dark mahogany chicken thigh resting inside glossy velvety burgundy reduction sauce studded with caramelized pearl onions, brown button mushrooms, lardons, and fresh thyme sprig beside mash',
    aliases: ['coq au vin bistro style', 'coq au vin', 'french braised chicken jus'],
    estimatedNutrition: { calories: 610, protein: 40, carbs: 24, fat: 36, servingGrams: 370 },
  },
  {
    normalizedName: 'classic british fish and chips',
    displayName: 'Classic British Fish and Chips',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'British Pub Classic',
    generalizedDescription:
      'Beer-battered fillet of white fish fried golden and served with thick-cut chips, mushy peas, and tartar sauce.',
    visualPrompt:
      'dramatic giant golden-amber ultra-crisp frothy battered Atlantic white Fish fillet laid proudly over thick-cut pub chips steak fries beside a small white stoneware pot of emerald minted mushy peas, caper tartar sauce cup, and fresh lemon wedge',
    aliases: ['classic british fish and chips', 'fish and chips', 'fish chips', 'beer battered fish chips'],
    estimatedNutrition: { calories: 790, protein: 36, carbs: 74, fat: 38, servingGrams: 420 },
  },
  {
    normalizedName: 'shepherds pie',
    displayName: "Shepherd’s Pie",
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'British Pub Comfort',
    generalizedDescription:
      'Savory minced lamb cooked with carrots and peas in gravy, topped with a thick crust of mashed potato and baked golden.',
    visualPrompt:
      'bubbling individual oval stoneware gratin pie dish scooped lightly to expose dark rich savory rosemary-braised minced lamb, diced orange carrots, and green peas underneath a deeply fork-ridged golden browned cheesy mashed potato crust',
    aliases: ['shepherds pie', 'shepherd s pie', 'lamb shepherds pie'],
    estimatedNutrition: { calories: 640, protein: 32, carbs: 48, fat: 35, servingGrams: 360 },
  },
  {
    normalizedName: 'vegetarian cottage pie',
    displayName: 'Vegetarian Cottage Pie',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'British Contemporary Bistro',
    generalizedDescription:
      'Lentil and diced root vegetable ragout topped with creamy cheddar mashed potatoes and baked in a casserole.',
    visualPrompt:
      'warm baked ceramic casserole dish showing rich savory brown mushroom-lentil-vegetable ragout layered underneath a tall golden-brown baked cheddar-crust piped mashed potato crown dusted cleanly with fresh thyme leaves',
    aliases: ['vegetarian cottage pie', 'veg cottage pie', 'lentil mushroom cottage pie'],
    estimatedNutrition: { calories: 510, protein: 17, carbs: 60, fat: 22, servingGrams: 350 },
  },
  {
    normalizedName: 'grilled norwegian salmon steak',
    displayName: 'Grilled Norwegian Salmon Steak',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Contemporary European Bistro',
    generalizedDescription:
      'Pan-seared salmon fillet with crispy skin, served over asparagus spears, quinoa or mash, and lemon-dill butter sauce.',
    visualPrompt:
      'thick rosy coral-pink pan-seared Atlantic Salmon fillet crowned with crisp golden browned skin resting delicately atop charred emerald asparagus spears and herb potato mash finished with pale golden lemon-dill butter glaze and capers',
    aliases: ['grilled norwegian salmon steak', 'grilled salmon steak', 'pan seared salmon asparagus'],
    estimatedNutrition: { calories: 590, protein: 42, carbs: 24, fat: 36, servingGrams: 320 },
  },
  {
    normalizedName: 'pan-seared duck breast',
    displayName: 'Pan-Seared Duck Breast',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Fine Bistro',
    generalizedDescription:
      'Crispy-skinned duck breast sliced medium-rare and served with sweet-tart orange or cherry reduction and potato gratin.',
    visualPrompt:
      'sliced crisp cross-hatched golden caramelized Duck Breast fanned delicately showing juicy rosy pink medium-rare center resting beside golden layered potato gratin dauphinoise cake, velvety glossy dark cherry-orange gastrique reduction, and seared baby carrots',
    aliases: ['pan-seared duck breast', 'crispy duck breast', 'magret de canard'],
    estimatedNutrition: { calories: 650, protein: 36, carbs: 28, fat: 44, servingGrams: 310 },
  },
  {
    normalizedName: 'braised lamb shanks',
    displayName: 'Braised Lamb Shanks',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'European Bistro',
    generalizedDescription:
      'Slow-cooked tender lamb shank falling off the bone in a rich rosemary and root-vegetable jus over creamy polenta or mash.',
    visualPrompt:
      'dramatic towering slow-braised glistening deep mahogany Bone-In Lamb Shank standing tall over velvety pale buttered garlic mashed potatoes or polenta bathed richly in gleaming rosemary-thyme natural jus and pearl onions',
    aliases: ['braised lamb shanks', 'lamb shank mash', 'slow cooked lamb shank'],
    estimatedNutrition: { calories: 720, protein: 48, carbs: 32, fat: 44, servingGrams: 420 },
  },
  {
    normalizedName: 'herb-crusted rack of lamb',
    displayName: 'Herb-Crusted Rack of Lamb',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'European Grill Bistro',
    generalizedDescription:
      'Roasted lamb chops coated in a mustard, garlic, and parsley breadcrumb crust, served with mint jus.',
    visualPrompt:
      'three neat trimmed frenched pink juicy lamb rib cutlets generously crusted across the crown with vibrant green emerald parsley-garlic-Dijon herb breadcrumbs arranged upright beside creamy potato puree and glossy dark mint jus',
    aliases: ['herb-crusted rack of lamb', 'rack of lamb', 'herb crusted lamb chops'],
    estimatedNutrition: { calories: 670, protein: 42, carbs: 20, fat: 46, servingGrams: 310 },
  },
  {
    normalizedName: 'grilled cottage cheese steak with pepper sauce',
    displayName: 'Grilled Cottage Cheese Steak with Pepper Sauce',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Contemporary Indian-Continental Café',
    generalizedDescription:
      'Thick slab of herb-marinated paneer seared on a grill plate, served with sautéed veggies, mash, and black peppercorn sauce.',
    visualPrompt:
      'thick diamond grill-marked herb-seared golden Cottage Cheese Paneer Steak resting over creamy butter mashed potatoes beside sautéed green beans, carrots, broccoli, and glossy dark cracked black peppercorn demi-glace sauce poured cleanly across',
    aliases: ['grilled cottage cheese steak with pepper sauce', 'paneer steak pepper sauce', 'cottage cheese steak platter'],
    estimatedNutrition: { calories: 620, protein: 27, carbs: 34, fat: 42, servingGrams: 350 },
  },
  {
    normalizedName: 'ratatouille tian',
    displayName: 'Ratatouille Tian',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Provençal',
    generalizedDescription:
      'Provençal baked dish of thinly sliced zucchini, eggplant, yellow squash, and tomatoes layered over a sweet bell-pepper piperade sauce.',
    visualPrompt:
      'round rustic ceramic baking dish displaying tightly spiraled rainbow concentric shingles of roasted green zucchini, purple eggplant, golden yellow squash, and ruby Roma tomatoes glazed in herb olive oil atop red pepper piperade and fresh basil',
    aliases: ['ratatouille tian', 'provencal ratatouille', 'baked french ratatouille'],
    estimatedNutrition: { calories: 260, protein: 6, carbs: 26, fat: 15, servingGrams: 280 },
  },
  {
    normalizedName: 'eggplant parmigiana melanzane',
    displayName: 'Eggplant Parmigiana (Melanzane)',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Southern Italian',
    generalizedDescription:
      'Baked layers of breaded eggplant slices, rich tomato basil sauce, mozzarella, and parmesan cheese.',
    visualPrompt:
      'hot bubbly ceramic gratin casserole dish containing stacked tender golden browned breaded eggplant slices Melanzane alla Parmigiana layered generously with vibrant crimson basil marinara, bubbling melted buffalo mozzarella, aged parmesan, and fresh sweet basil leaves',
    aliases: ['eggplant parmigiana melanzane', 'eggplant parmigiana', 'melanzane parmigiana', 'aubergine parm'],
    estimatedNutrition: { calories: 520, protein: 22, carbs: 36, fat: 33, servingGrams: 320 },
  },
  {
    normalizedName: 'spinach ricotta cannelloni',
    displayName: 'Spinach & Ricotta Cannelloni',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'Cylindrical pasta tubes stuffed with spinach and ricotta cheese, baked in marinara and creamy white béchamel.',
    visualPrompt:
      'three plump hand-stuffed large tubular Italian Cannelloni pasta rolls bursting gently with bright green spinach and snowy ricotta baked neatly in an oval gratin dish combining rich red marinara base, ivory béchamel top glaze, and blistered parmesan',
    aliases: ['spinach ricotta cannelloni', 'cannelloni pasta', 'baked spinach ricotta cannelloni'],
    estimatedNutrition: { calories: 580, protein: 24, carbs: 56, fat: 29, servingGrams: 340 },
  },
  {
    normalizedName: 'creamy polenta with wild mushroom ragout',
    displayName: 'Creamy Polenta with Wild Mushroom Ragout',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Northern Italian Bistro',
    generalizedDescription:
      'Soft, buttery cooked cornmeal porridge topped with a hearty garlic-thyme mushroom stew.',
    visualPrompt:
      'wide shallow stoneware pasta bowl cradling velvety bright golden yellow creamy Parmesan Polenta porridge topped generously at the center with glossy dark savory thyme-roasted wild mushroom ragout, crisp parmesan curls, and herb oil',
    aliases: ['creamy polenta with wild mushroom ragout', 'polenta mushroom ragout', 'truffle polenta mushrooms'],
    estimatedNutrition: { calories: 470, protein: 13, carbs: 50, fat: 24, servingGrams: 320 },
  },
  {
    normalizedName: 'german bratwurst with sauerkraut mash',
    displayName: 'German Bratwurst with Sauerkraut & Mash',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'German Pub Grill',
    generalizedDescription:
      'Grilled savory sausages served over buttery mashed potatoes, tangy fermented cabbage, and mustard.',
    visualPrompt:
      'two glossy charred blistered golden-brown German Bratwurst sausages nested atop creamy swirled mashed potatoes alongside tangy pale golden tangy Sauerkraut ribbons, glossy wholegrain Dijon mustard pot, and dark onion gravy drizzle',
    aliases: ['german bratwurst with sauerkraut mash', 'bratwurst mash', 'german sausage sauerkraut'],
    estimatedNutrition: { calories: 670, protein: 26, carbs: 42, fat: 44, servingGrams: 360 },
  },
  {
    normalizedName: 'warm bavarian soft pretzel',
    displayName: 'Warm Bavarian Soft Pretzel',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'German Beer Garden / Pub Café',
    generalizedDescription:
      'Hand-twisted dark golden bread with a chewy crust, sprinkled with coarse salt and served with warm beer-cheese dip.',
    visualPrompt:
      'classic twisted dark mahogany glossy crusty German Laugenbrezel Soft Pretzel generously sprinkled with chunky pure-white crunchy pretzel salt crystals next to small stoneware crocks of silky cheddar-beer cheese dip and sweet Bavarian mustard',
    aliases: ['warm bavarian soft pretzel', 'bavarian soft pretzel', 'soft pretzel cheese dip'],
    estimatedNutrition: { calories: 440, protein: 12, carbs: 66, fat: 14, servingGrams: 200 },
  },
  {
    normalizedName: 'peri-peri half roast chicken',
    displayName: 'Peri-Peri Half Roast Chicken',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Portuguese-South African Flame Grill',
    generalizedDescription:
      'Flame-grilled half chicken marinated in fiery peri-peri chili sauce, served with spiced wedges and corn on the cob.',
    visualPrompt:
      'flame-charred glistening vibrant crimson-paprika Peri-Peri Half Roast Chicken beside roasted sweet golden corn-on-the-cob glazed with butter, spiced crispy potato wedges, lemon wedge, and extra peri-peri dipping cup on dark timber',
    aliases: ['peri-peri half roast chicken', 'peri peri roast chicken', 'flame grilled half chicken'],
    estimatedNutrition: { calories: 690, protein: 52, carbs: 36, fat: 36, servingGrams: 420 },
  },
  {
    normalizedName: 'sloppy joe burger',
    displayName: 'Sloppy Joe Burger',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'American Diner / Pub',
    generalizedDescription:
      'Toasted brioche bun piled high with sweet-and-tangy tomato-braised minced meat and melted cheddar cheese.',
    visualPrompt:
      'warm glazed golden brioche burger bun overflowing abundantly with rich thick glossy smoky tomato-molasses minced meat Sloppy Joe filling crowned with melted sharp yellow cheddar slice and crisp dill pickle chips beside',
    aliases: ['sloppy joe burger', 'sloppy joe sandwich', 'american sloppy joe'],
    estimatedNutrition: { calories: 620, protein: 30, carbs: 56, fat: 30, servingGrams: 290 },
  },
  {
    normalizedName: 'philly cheese steak sandwich',
    displayName: 'Philly Cheese Steak Sandwich',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'American Sandwich Shop',
    generalizedDescription:
      'Hoagie roll packed with thinly sliced sautéed meat or mushrooms, caramelized onions, peppers, and melted provolone.',
    visualPrompt:
      'soft crusty oblong Philly Hoagie baguette sandwich split neatly to overflowing capacity with thinly shaved savory seared steak or portobello slices, grilled caramelized onions, green bell peppers, and generous melted ivory provolone cheese ribbons',
    aliases: ['philly cheese steak sandwich', 'philly cheesesteak', 'cheesesteak sub'],
    estimatedNutrition: { calories: 680, protein: 34, carbs: 52, fat: 36, servingGrams: 310 },
  },
  {
    normalizedName: 'reuben sandwich',
    displayName: 'Reuben Sandwich',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'New York Deli',
    generalizedDescription:
      'Grilled rye bread sandwich layered with cured meat, Swiss cheese, tangy sauerkraut, and Russian dressing.',
    visualPrompt:
      'crisp butter-griddled marbled swirl rye bread classic Reuben Sandwich halved cleanly displaying tall rosy layers of thinly sliced cured pastrami or corned meat, melted Swiss cheese, tangy golden sauerkraut, rosy Russian dressing, and crisp pickle spear beside',
    aliases: ['reuben sandwich', 'rye reuben melt', 'deli reuben'],
    estimatedNutrition: { calories: 640, protein: 32, carbs: 46, fat: 35, servingGrams: 290 },
  },
  {
    normalizedName: 'croque monsieur',
    displayName: 'Croque Monsieur',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Bistro Café',
    generalizedDescription:
      'Classic French bistro baked ham-and-cheese sandwich topped with creamy béchamel and gruyere cheese.',
    visualPrompt:
      'golden blistered French Bistro Croque Monsieur sandwich on thick pain de mie bread baked bubbling edge-to-edge under rich ivory béchamel Mornay sauce and browned nutty melted Gruyère cheese revealing smoked ham slice inside',
    aliases: ['croque monsieur', 'french baked ham cheese toast', 'croque monsieur sandwich'],
    estimatedNutrition: { calories: 590, protein: 28, carbs: 42, fat: 34, servingGrams: 250 },
  },
  {
    normalizedName: 'croque madame',
    displayName: 'Croque Madame',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'French Bistro Brunch',
    generalizedDescription:
      'A rich baked Croque Monsieur sandwich crowned on top with a sunny-side-up or poached fried egg.',
    visualPrompt:
      'golden broiled Gruyère-and-béchamel topped French Croque Madame sandwich crowned right in the center with a glossy bright marigold runny yolk sunny-side-up egg sprinkled cleanly with cracked black pepper and chives beside green salad greens',
    aliases: ['croque madame', 'egg topped croque monsieur', 'french croque madame'],
    estimatedNutrition: { calories: 660, protein: 34, carbs: 42, fat: 39, servingGrams: 290 },
  },
  {
    normalizedName: 'banh mi vietnamese baguette sandwich',
    displayName: 'Banh Mi Vietnamese Baguette Sandwich',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'Vietnamese Street Café',
    generalizedDescription:
      'Crispy, airy rice-flour baguette stuffed with grilled lemongrass chicken or tofu, pickled carrots/daikon, cilantro, and chili mayo.',
    visualPrompt:
      'crackling pale golden airy Vietnamese Baguette split lengthwise and bursting colorfully with glazed caramel lemongrass chicken or herb tofu strips, bright orange and white pickled daikon-carrot ribbons, emerald cucumber spears, whole fresh cilantro sprigs, sliced red chili, and spicy mayo',
    aliases: ['banh mi vietnamese baguette sandwich', 'banh mi sandwich', 'vietnamese banh mi'],
    estimatedNutrition: { calories: 510, protein: 25, carbs: 58, fat: 19, servingGrams: 270 },
  },
  {
    normalizedName: 'crispy calamari po boy',
    displayName: "Crispy Calamari Po' Boy",
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'New Orleans / Louisiana Bistro',
    generalizedDescription:
      'Louisiana-style baguette sandwich overflowing with fried calamari or shrimp, shredded lettuce, tomatoes, and remoulade sauce.',
    visualPrompt:
      'warm soft French crusty Po\' Boy submarine roll piled dramatically high with crunchy golden cornmeal-fried calamari or popcorn shrimp, crisp shredded iceberg lettuce, sliced ripe tomatoes, pickles, and creamy coral spiced Cajun remoulade drizzle',
    aliases: ['crispy calamari po boy', 'po boy sandwich', 'shrimp calamari po boy'],
    estimatedNutrition: { calories: 640, protein: 26, carbs: 64, fat: 31, servingGrams: 310 },
  },
  {
    normalizedName: 'gourmet hot dog with caramelized onions',
    displayName: 'Gourmet Hot Dog with Caramelized Onions',
    category: 'Continental, Mediterranean, Mexican & Pub Grub',
    cuisine: 'American / German Pub Grill',
    generalizedDescription:
      'Smoked chicken or pork frankfurter in a soft roll topped with yellow mustard, ketchup, sauerkraut, and sweet onions.',
    visualPrompt:
      'warm toasted top-split golden brioche hot dog bun cradling a blistered plump smoked frankfurter sausage heaped generously with glossy mahogany caramelized sweet onions, tangy sauerkraut, bright yellow mustard zigzag, crispy fried shallots, and chives',
    aliases: ['gourmet hot dog with caramelized onions', 'gourmet hot dog', 'caramelized onion hot dog'],
    estimatedNutrition: { calories: 540, protein: 21, carbs: 46, fat: 30, servingGrams: 240 },
  },
];

