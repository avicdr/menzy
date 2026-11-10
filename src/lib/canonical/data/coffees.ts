import type { CanonicalCatalogItem } from '../types';

export const COFFEES_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // I. Hot & Iced Coffees (1-35)
  // =========================================================================
  {
    normalizedName: 'espresso',
    displayName: 'Single Espresso',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A 1-ounce concentrated shot of coffee topped with golden-brown crema.',
    visualPrompt:
      'a single concentrated shot of dark espresso topped with velvety golden-brown crema in a warm ceramic demitasse cup and matching saucer with roasted coffee beans',
    aliases: ['single espresso', 'espresso', 'espresso shot', 'solo espresso'],
    estimatedNutrition: { calories: 5, protein: 0.3, carbs: 0.5, fat: 0, servingGrams: 45 },
  },
  {
    normalizedName: 'doppio double espresso',
    displayName: 'Doppio (Double Espresso)',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A double shot of espresso extracted using twice the amount of finely ground coffee.',
    visualPrompt:
      'a full-bodied Doppio Double Espresso in a thick-walled stoneware espresso cup with rich hazelnut-tiger crema and a small stainless steel espresso spoon',
    aliases: ['doppio double espresso', 'doppio', 'double espresso', 'double shot espresso'],
    estimatedNutrition: { calories: 10, protein: 0.5, carbs: 1, fat: 0, servingGrams: 75 },
  },
  {
    normalizedName: 'ristretto',
    displayName: 'Ristretto',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A short, highly concentrated espresso shot pulled with finer grinds and half the water.',
    visualPrompt:
      'a compact intense short pull of Ristretto espresso with syrupy amber-brown crema inside a petite clear fluted shot glass on a ceramic saucer',
    aliases: ['ristretto', 'espresso ristretto', 'double ristretto', 'short black'],
    estimatedNutrition: { calories: 5, protein: 0.2, carbs: 0.4, fat: 0, servingGrams: 30 },
  },
  {
    normalizedName: 'lungo',
    displayName: 'Lungo',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A "long" espresso pulled with extra water for a milder, larger cup.',
    visualPrompt:
      'an Italian Lungo long-pulled espresso served in a slightly taller porcelain coffee cup with smooth pale golden crema on a neutral linen coaster',
    aliases: ['lungo', 'espresso lungo', 'caffe lungo', 'long espresso'],
    estimatedNutrition: { calories: 10, protein: 0.4, carbs: 0.8, fat: 0, servingGrams: 120 },
  },
  {
    normalizedName: 'hot americano',
    displayName: 'Hot Americano',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Espresso shots diluted with hot water to match the strength of drip coffee.',
    visualPrompt:
      'a steaming Hot Americano in a matte stoneware mug showing dark roasted black coffee with a subtle caramel-toned crema ring on top',
    aliases: ['hot americano', 'americano', 'caffe americano', 'long black coffee'],
    estimatedNutrition: { calories: 10, protein: 0.4, carbs: 1, fat: 0, servingGrams: 260 },
  },
  {
    normalizedName: 'iced americano',
    displayName: 'Iced Americano',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Double espresso poured over cold water and ice cubes.',
    visualPrompt:
      'a tall crystal-clear glass of Iced Americano packed with sparkling clear ice cubes showing deep mahogany coffee swirls cascading down chilled water',
    aliases: ['iced americano', 'cold americano', 'ice americano'],
    estimatedNutrition: { calories: 10, protein: 0.4, carbs: 1, fat: 0, servingGrams: 300 },
  },
  {
    normalizedName: 'cappuccino',
    displayName: 'Classic Cappuccino',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'Equal parts espresso, steamed milk, and thick, velvety milk foam.',
    visualPrompt:
      'a Classic Cappuccino in a rounded stoneware cafe cup and saucer, topped with glossy thick milk microfoam, delicate rosetta latte art, and subtle dusted cocoa powder',
    aliases: ['cappuccino', 'classic cappuccino', 'traditional cappuccino', 'hot cappuccino', 'dry cappuccino'],
    estimatedNutrition: { calories: 120, protein: 6, carbs: 9, fat: 4, servingGrams: 240 },
  },
  {
    normalizedName: 'cinnamon cappuccino',
    displayName: 'Cinnamon Cappuccino',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A classic cappuccino dusted with aromatic ground cinnamon over the foam.',
    visualPrompt:
      'a warm Cinnamon Cappuccino in a cream ceramic cup crowned with billowing white milk foam generously dusted with warm terracotta ground cinnamon and a whole cinnamon quill on the saucer',
    aliases: ['cinnamon cappuccino', 'spiced cappuccino', 'cinnamon spiced cappuccino'],
    estimatedNutrition: { calories: 125, protein: 6, carbs: 10, fat: 4, servingGrams: 240 },
  },
  {
    normalizedName: 'dark roast cappuccino',
    displayName: 'Dark Roast Cappuccino',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Specialty Coffee',
    generalizedDescription:
      'Cappuccino brewed with deeply roasted, bold coffee beans.',
    visualPrompt:
      'a bold Dark Roast Cappuccino served in a charcoal-speckled ceramic cup showing rich dark-crema milk foam ring and glossy white steamed foam peak',
    aliases: ['dark roast cappuccino', 'strong cappuccino', 'intense cappuccino'],
    estimatedNutrition: { calories: 120, protein: 6, carbs: 9, fat: 4, servingGrams: 240 },
  },
  {
    normalizedName: 'cafe latte',
    displayName: 'Cafe Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A single or double espresso topped with steamed milk and a thin layer of microfoam.',
    visualPrompt:
      'a creamy Cafe Latte in a wide handcrafted cream-ceramic mug resting on a stoneware saucer, crowned with smooth steamed milk microfoam and tulip pour art',
    aliases: ['cafe latte', 'caffe latte', 'latte', 'hot latte', 'vanilla latte'],
    estimatedNutrition: { calories: 150, protein: 8, carbs: 13, fat: 6, servingGrams: 300 },
  },
  {
    normalizedName: 'iced cafe latte',
    displayName: 'Iced Cafe Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Chilled milk poured over ice and crowned with freshly pulled espresso.',
    visualPrompt:
      'a chilled glass tumbler of Iced Cafe Latte showing clear ice cubes floating in creamy cold milk with dramatic espresso caramel marbling descending from top to bottom',
    aliases: ['iced cafe latte', 'iced latte', 'cold latte', 'iced caffe latte'],
    estimatedNutrition: { calories: 140, protein: 7, carbs: 12, fat: 6, servingGrams: 320 },
  },
  {
    normalizedName: 'flat white',
    displayName: 'Flat White',
    category: 'Hot & Iced Coffees',
    cuisine: 'Australian / Café',
    generalizedDescription:
      'Double ristretto topped with silky, glossy microfoam milk.',
    visualPrompt:
      'an Australian Flat White in a compact ceramic tulip cup showing a deep caramel crema halo around glossy microfoam milk with a tight centered heart pour art',
    aliases: ['flat white', 'australian flat white', 'microfoam flat white', 'oat milk flat white'],
    estimatedNutrition: { calories: 110, protein: 7, carbs: 8, fat: 4, servingGrams: 200 },
  },
  {
    normalizedName: 'cortado',
    displayName: 'Cortado',
    category: 'Hot & Iced Coffees',
    cuisine: 'Spanish / Café',
    generalizedDescription:
      'Equal parts espresso and warm steamed milk served in a small glass.',
    visualPrompt:
      'a balanced Spanish Cortado served in a compact fluted Gibraltar clear glass on a small stoneware plate showing equal warm espresso and silky steamed milk layers',
    aliases: ['cortado', 'espresso cortado', 'spanish cortado', 'gibraltar coffee'],
    estimatedNutrition: { calories: 75, protein: 4, carbs: 5, fat: 3, servingGrams: 135 },
  },
  {
    normalizedName: 'espresso macchiato',
    displayName: 'Espresso Macchiato',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Café',
    generalizedDescription:
      'A shot of espresso "stained" with a small dollop of foamed milk.',
    visualPrompt:
      'an authentic Italian Espresso Macchiato in a porcelain demitasse cup featuring dark golden crema marked at the center with a neat pearl dollop of velvety white milk foam',
    aliases: ['espresso macchiato', 'caffe macchiato', 'traditional macchiato'],
    estimatedNutrition: { calories: 25, protein: 1.5, carbs: 2, fat: 1, servingGrams: 60 },
  },
  {
    normalizedName: 'caramel macchiato',
    displayName: 'Caramel Macchiato',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Steamed milk and vanilla syrup stained with espresso and finished with a caramel crosshatch.',
    visualPrompt:
      'a tall clear cafe mug of layered Caramel Macchiato showing creamy milk, golden espresso heart layer, frothy white foam cap, and a crisp golden caramel drizzle crosshatch grid',
    aliases: ['caramel macchiato', 'iced caramel macchiato', 'salted caramel macchiato'],
    estimatedNutrition: { calories: 230, protein: 8, carbs: 32, fat: 7, servingGrams: 320 },
  },
  {
    normalizedName: 'piccolo latte',
    displayName: 'Piccolo Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Australian / Café',
    generalizedDescription:
      'A single ristretto shot topped with warm, silky milk in a small demitasse glass.',
    visualPrompt:
      'an Australian Piccolo Latte poured into a clear petite 100ml faceted demitasse glass resting on a stoneware saucer with silky microfoam rosetta',
    aliases: ['piccolo latte', 'piccolo', 'ristretto piccolo'],
    estimatedNutrition: { calories: 65, protein: 3.5, carbs: 4.5, fat: 2.5, servingGrams: 110 },
  },
  {
    normalizedName: 'cafe mocha',
    displayName: 'Cafe Mocha',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Espresso combined with rich chocolate ganache and steamed milk.',
    visualPrompt:
      'a decadent Cafe Mocha in a warm ceramic cup showing rich chocolate-espresso cream topped with pillowy foam, dark cocoa dusting, and glossy chocolate drizzle ribbons',
    aliases: ['cafe mocha', 'caffe mocha', 'mocha', 'hot mocha', 'chocolate mocha'],
    estimatedNutrition: { calories: 220, protein: 7, carbs: 28, fat: 8, servingGrams: 300 },
  },
  {
    normalizedName: 'white chocolate mocha',
    displayName: 'White Chocolate Mocha',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Espresso blended with creamy white chocolate sauce and steamed milk.',
    visualPrompt:
      'a lush White Chocolate Mocha in an ivory ceramic mug crowned with airy whipped cream and delicate white chocolate shavings and curls',
    aliases: ['white chocolate mocha', 'white mocha', 'iced white chocolate mocha'],
    estimatedNutrition: { calories: 270, protein: 8, carbs: 34, fat: 11, servingGrams: 300 },
  },
  {
    normalizedName: 'iced sea salt mocha',
    displayName: 'Iced Sea Salt Mocha',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Chilled chocolate espresso latte topped with a savoury-sweet sea salt cream foam.',
    visualPrompt:
      'an Iced Sea Salt Mocha in a tall chilled cafe glass showing dark iced chocolate espresso layered underneath a thick, glossy ivory cloud of sea-salt cold foam dusted lightly with cocoa',
    aliases: ['iced sea salt mocha', 'sea salt mocha', 'salted chocolate iced coffee'],
    estimatedNutrition: { calories: 250, protein: 6, carbs: 29, fat: 12, servingGrams: 340 },
  },
  {
    normalizedName: 'roasted hazelnut latte',
    displayName: 'Roasted Hazelnut Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Espresso and steamed milk infused with toasted hazelnut syrup.',
    visualPrompt:
      'a warm Roasted Hazelnut Latte in a matte sand stoneware mug crowned with smooth latte art, finely chopped roasted hazelnuts, and a pair of whole hazelnuts on the saucer',
    aliases: ['roasted hazelnut latte', 'hazelnut latte', 'iced hazelnut latte', 'nutty hazelnut coffee'],
    estimatedNutrition: { calories: 210, protein: 7, carbs: 25, fat: 8, servingGrams: 300 },
  },
  {
    normalizedName: 'irish coffee non-alcoholic',
    displayName: 'Irish Coffee (Non-Alcoholic)',
    category: 'Hot & Iced Coffees',
    cuisine: 'Classic Café Bar',
    generalizedDescription:
      'Black coffee sweetened with brown sugar and Irish cream syrup, topped with cold heavy cream.',
    visualPrompt:
      'a classic stemmed glass mug of Non-Alcoholic Irish Coffee showing deep amber brown-sugar coffee clearly separated below a thick collar of chilled velvety heavy cream dusted lightly with cocoa',
    aliases: ['irish coffee non-alcoholic', 'irish coffee', 'zero proof irish coffee', 'virgin irish coffee', 'irish cream coffee'],
    estimatedNutrition: { calories: 190, protein: 2, carbs: 18, fat: 12, servingGrams: 260 },
  },
  {
    normalizedName: 'tiramisu latte',
    displayName: 'Tiramisu Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Italian / Contemporary Café',
    generalizedDescription:
      'Flavored latte infused with mascarpone, cocoa, and savoiardi biscuit notes.',
    visualPrompt:
      'an indulgent Tiramisu Latte in a wide fluted clear mug crowned with mascarpone cream foam, dark cocoa dusting, and a crisp golden savoiardi ladyfinger biscuit resting across the rim',
    aliases: ['tiramisu latte', 'iced tiramisu latte', 'mascarpone coffee latte'],
    estimatedNutrition: { calories: 260, protein: 7, carbs: 30, fat: 12, servingGrams: 310 },
  },
  {
    normalizedName: 'iced saffron kesar latte',
    displayName: 'Iced Saffron (Kesar) Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Indian / Contemporary Café',
    generalizedDescription:
      'Chilled espresso with milk infused with aromatic saffron strands and cardamom.',
    visualPrompt:
      'a luminous golden-hued Iced Saffron Kesar Latte over crystal ice cubes showing warm gold saffron-cardamom milk marbled with dark espresso and crowned with crimson saffron threads',
    aliases: ['iced saffron kesar latte', 'kesar latte', 'saffron latte', 'iced kesar espresso latte'],
    estimatedNutrition: { calories: 170, protein: 7, carbs: 19, fat: 6, servingGrams: 320 },
  },
  {
    normalizedName: 'strawberry foam latte',
    displayName: 'Strawberry Foam Latte',
    category: 'Hot & Iced Coffees',
    cuisine: 'Modern Café Fusion',
    generalizedDescription:
      'Iced latte topped with a sweet, airy pink strawberry cold foam.',
    visualPrompt:
      'an Iced Strawberry Foam Latte in a crystal glass over ice cubes layered with pale milk, roasted espresso, and a pillowy blush-pink strawberry cold foam cap garnished with a freeze-dried strawberry shard',
    aliases: ['strawberry foam latte', 'iced strawberry latte', 'pink foam latte'],
    estimatedNutrition: { calories: 190, protein: 6, carbs: 26, fat: 6, servingGrams: 330 },
  },
  {
    normalizedName: 'mont blanc coffee',
    displayName: 'Mont Blanc Coffee',
    category: 'Hot & Iced Coffees',
    cuisine: 'Specialty Coffee',
    generalizedDescription:
      'Iced black coffee or espresso topped with spiced orange peel, nutmeg, and sweet cream foam.',
    visualPrompt:
      'a specialty Mont Blanc Coffee in a short faceted crystal glass showing dark chilled black coffee beneath a sculpted snow-white sweet cream foam peak finished with freshly grated nutmeg and a twist of orange zest',
    aliases: ['mont blanc coffee', 'mont blanc iced coffee', 'orange cream cold brew'],
    estimatedNutrition: { calories: 165, protein: 2, carbs: 14, fat: 11, servingGrams: 250 },
  },
  {
    normalizedName: 'pour-over coffee',
    displayName: 'V60 Pour-Over',
    category: 'Hot & Iced Coffees',
    cuisine: 'Specialty Coffee',
    generalizedDescription:
      'Clean, aromatic black coffee brewed manually through a ridged conical paper filter.',
    visualPrompt:
      'artisanal V60 Pour-Over coffee brewed with a spiral ceramic V60 dripper perched over a fluted glass carafe beside a clean tasting mug of ruby-amber single-origin filter coffee',
    aliases: ['pour-over coffee', 'v60 pour-over', 'v60 pour over', 'pour over coffee', 'manual brew'],
    estimatedNutrition: { calories: 5, protein: 0.3, carbs: 0.5, fat: 0, servingGrams: 240 },
  },
  {
    normalizedName: 'chemex brew',
    displayName: 'Chemex Brew',
    category: 'Hot & Iced Coffees',
    cuisine: 'Specialty Coffee',
    generalizedDescription:
      'Crisp, sediment-free drip coffee brewed in an hourglass glass flask.',
    visualPrompt:
      'an iconic hourglass glass Chemex coffee carafe with wooden collar and leather tie filled with bright ruby-brown black coffee beside two clear glass tasting cups',
    aliases: ['chemex brew', 'chemex coffee', 'chemex pour over'],
    estimatedNutrition: { calories: 5, protein: 0.3, carbs: 0.5, fat: 0, servingGrams: 260 },
  },
  {
    normalizedName: 'french press',
    displayName: 'French Press',
    category: 'Hot & Iced Coffees',
    cuisine: 'European / Specialty Coffee',
    generalizedDescription:
      'Full-bodied coffee brewed by steeping coarse grounds in hot water and pressing a mesh plunger.',
    visualPrompt:
      'a polished glass and brushed brass French Press coffee plunger filled with rich dark steeped coffee next to a warm ceramic coffee mug',
    aliases: ['french press', 'french press coffee', 'cafetiere coffee', 'plunger coffee'],
    estimatedNutrition: { calories: 8, protein: 0.4, carbs: 0.5, fat: 0.2, servingGrams: 250 },
  },
  {
    normalizedName: 'aeropress coffee',
    displayName: 'AeroPress Coffee',
    category: 'Hot & Iced Coffees',
    cuisine: 'Specialty Coffee',
    generalizedDescription:
      'Smooth, low-acid coffee brewed using rapid air-pressure extraction.',
    visualPrompt:
      'a sleek matte ceramic tasting mug of silky single-origin AeroPress black coffee resting on a warm timber board beside a compact cylindrical coffee press',
    aliases: ['aeropress coffee', 'aeropress', 'aero press brew'],
    estimatedNutrition: { calories: 5, protein: 0.3, carbs: 0.5, fat: 0, servingGrams: 220 },
  },
  {
    normalizedName: 'cold brew',
    displayName: 'Classic Cold Brew',
    category: 'Hot & Iced Coffees',
    cuisine: 'Specialty Coffee',
    generalizedDescription:
      'Coarse coffee grounds steeped in cold water for 18 hours, served over ice.',
    visualPrompt:
      'a tall crystal tumbler filled with dark velvety Classic Cold Brew coffee over large square clear ice cubes on a minimalist stoneware coaster',
    aliases: ['cold brew', 'classic cold brew', 'cold brew coffee', 'iced cold brew', 'slow steeped coffee'],
    estimatedNutrition: { calories: 15, protein: 0.5, carbs: 1, fat: 0, servingGrams: 300 },
  },
  {
    normalizedName: 'cranberry cold brew',
    displayName: 'Cranberry Cold Brew',
    category: 'Hot & Iced Coffees',
    cuisine: 'Specialty Coffee Fusion',
    generalizedDescription:
      'Tangy cranberry juice layered with smooth cold brew coffee over ice.',
    visualPrompt:
      'a stunning two-tone Cranberry Cold Brew in a tall clear glass over clear ice showing jewel ruby cranberry juice at the base floating beneath dark brown cold brew coffee with a rosemary sprig and fresh cranberries',
    aliases: ['cranberry cold brew', 'cranberry coffee', 'iced cranberry espresso'],
    estimatedNutrition: { calories: 85, protein: 0.4, carbs: 20, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'guava spiced coffee',
    displayName: 'Guava Spiced Coffee',
    category: 'Hot & Iced Coffees',
    cuisine: 'Indian Café Fusion',
    generalizedDescription:
      'Tropical pink guava nectar paired with chilled espresso or cold brew.',
    visualPrompt:
      'a layered Guava Spiced Coffee in a clear rock glass with coral-pink tropical guava nectar over ice crowned with dark espresso crema and a pinch of chili-salt lime garnish',
    aliases: ['guava spiced coffee', 'guava cold brew', 'pink guava coffee'],
    estimatedNutrition: { calories: 95, protein: 0.6, carbs: 22, fat: 0, servingGrams: 300 },
  },
  {
    normalizedName: 'vietnamese iced coffee',
    displayName: 'Vietnamese Iced Coffee',
    category: 'Hot & Iced Coffees',
    cuisine: 'Vietnamese / Café',
    generalizedDescription:
      'Strong dark-roast drip coffee poured over sweetened condensed milk and ice.',
    visualPrompt:
      'authentic Vietnamese Iced Coffee in a ribbed glass showing creamy ivory sweetened condensed milk layer at the bottom, ice cubes, dark roasted coffee, and a small brushed metal phin dripper resting atop a coaster',
    aliases: ['vietnamese iced coffee', 'ca phe sua da', 'vietnamese cold coffee', 'condensed milk iced coffee'],
    estimatedNutrition: { calories: 195, protein: 4, carbs: 29, fat: 6, servingGrams: 280 },
  },
  {
    normalizedName: 'south indian filter coffee',
    displayName: 'South Indian Filter Coffee',
    category: 'Hot & Iced Coffees',
    cuisine: 'South Indian',
    generalizedDescription:
      'Frothy, chicory-blended coffee decoction mixed with hot boiled milk and sugar.',
    visualPrompt:
      'traditional South Indian Filter Coffee served in a gleaming brushed brass davara and tumbler set overflowing with thick caramelized froth bubbles',
    aliases: ['south indian filter coffee', 'filter kaapi', 'madras filter coffee', 'kumbakonam degree coffee'],
    estimatedNutrition: { calories: 145, protein: 5, carbs: 19, fat: 5, servingGrams: 200 },
  },
  {
    normalizedName: 'frappe cold coffee',
    displayName: 'Classic Cafe Frappe',
    category: 'Hot & Iced Coffees',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Blended iced coffee whipped until frothy, served tall with a drizzle of chocolate.',
    visualPrompt:
      'an indulgent frothy Classic Cafe Frappe in a tall clear glass crowned with whipped cream swirl, dark chocolate drizzle, and coffee bean dust',
    aliases: ['frappe cold coffee', 'classic cafe frappe', 'cafe frappe', 'cold coffee', 'coffee frappe', 'hazelnut cold coffee', 'classic cold coffee'],
    estimatedNutrition: { calories: 260, protein: 6, carbs: 36, fat: 10, servingGrams: 350 },
  },
];

