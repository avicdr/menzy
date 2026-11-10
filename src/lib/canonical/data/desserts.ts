import type { CanonicalCatalogItem } from '../types';

export const DESSERTS_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // X. Cakes, Pastries, Cookies & Confectionery (266-300)
  // =========================================================================
  {
    normalizedName: 'new york baked cheesecake',
    displayName: 'New York Baked Cheesecake',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'American Patisserie',
    generalizedDescription:
      'Dense, rich cream cheese cake baked on a buttery graham cracker crust.',
    visualPrompt:
      'tall immaculate wedge slice of velvety pale ivory New York Baked Cheesecake with gently golden baked top on a golden graham-biscuit base resting cleanly on a ceramic plate with a single berry accent',
    aliases: ['new york baked cheesecake', 'new york cheesecake', 'ny cheesecake', 'classic baked cheesecake'],
    estimatedNutrition: { calories: 440, protein: 8, carbs: 35, fat: 30, servingGrams: 165 },
  },
  {
    normalizedName: 'cheesecake',
    displayName: 'Blueberry Cheesecake Slice',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Creamy cheesecake topped with a glossy, tangy wild blueberry compote.',
    visualPrompt:
      'tall clean slice of creamy Cheesecake on a crisp biscuit crust crowned generously with glossy indigo-purple blueberry compote and plump fresh blueberries on a minimalist stoneware plate',
    aliases: ['cheesecake', 'blueberry cheesecake slice', 'blueberry cheesecake', 'berry cheesecake'],
    estimatedNutrition: { calories: 420, protein: 7, carbs: 38, fat: 27, servingGrams: 160 },
  },
  {
    normalizedName: 'lotus biscoff cheesecake',
    displayName: 'Lotus Biscoff Cheesecake',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Chilled or baked cheesecake topped with melted Lotus Biscoff spread and spiced speculoos cookie crumbs.',
    visualPrompt:
      'clean tall slice of chilled Lotus Biscoff Cheesecake on a deep amber spiced speculoos crumb crust glazed lavishly on top with glossy melted caramelized cookie spread drip, crushed biscuit edges, and a crisp whole rectangular caramelized biscuit tucked into the top cream rosette',
    aliases: ['lotus biscoff cheesecake', 'biscoff cheesecake', 'speculoos cheesecake'],
    estimatedNutrition: { calories: 490, protein: 7, carbs: 46, fat: 31, servingGrams: 170 },
  },
  {
    normalizedName: 'san sebastian burnt basque cheesecake',
    displayName: 'San Sebastian Burnt Basque Cheesecake',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Spanish Patisserie',
    generalizedDescription:
      'Crustless cheesecake baked at high heat for a caramelized top and custard-like center.',
    visualPrompt:
      'authentic rustic crustless slice of San Sebastian Burnt Basque Cheesecake nestled in ruffled parchment edge showing a deeply toasted dark-mahogany caramelized crust giving way cleanly to a lush oozy golden custard center beside a small pouring jug of melted chocolate ganache',
    aliases: ['san sebastian burnt basque cheesecake', 'basque cheesecake', 'san sebastian cheesecake', 'burnt basque cheesecake'],
    estimatedNutrition: { calories: 460, protein: 8, carbs: 32, fat: 34, servingGrams: 165 },
  },
  {
    normalizedName: 'tiramisu',
    displayName: 'Classic Italian Tiramisu',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Italian',
    generalizedDescription:
      'Coffee-soaked savoiardi ladyfingers layered with mascarpone sabayon and dusted with dark cocoa powder.',
    visualPrompt:
      'clean layered square portion of Classic Italian Tiramisu showing espresso-soaked savoiardi ladyfinger sponge alternating with pale mascarpone cream dusted thickly with dark bitter cocoa powder',
    aliases: ['tiramisu', 'classic italian tiramisu', 'classic tiramisu', 'italian tiramisu'],
    estimatedNutrition: { calories: 380, protein: 6, carbs: 42, fat: 21, servingGrams: 150 },
  },
  {
    normalizedName: 'truffle pastry',
    displayName: 'Belgian Dark Chocolate Truffle Pastry',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Moist chocolate sponge layered and coated with silky dark chocolate ganache.',
    visualPrompt:
      'glossy multi-layered tall rectangular slice of Belgian Dark Chocolate Truffle Pastry showing moist dark cocoa sponge layers bonded neatly with dense satin-smooth chocolate ganache frosting and dark chocolate curl',
    aliases: ['truffle pastry', 'belgian dark chocolate truffle pastry', 'chocolate truffle pastry', 'dutch truffle pastry'],
    estimatedNutrition: { calories: 410, protein: 5, carbs: 46, fat: 23, servingGrams: 150 },
  },
  {
    normalizedName: 'french opera pastry',
    displayName: 'French Opera Pastry',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'French Patisserie',
    generalizedDescription:
      'Multi-layered almond sponge cake soaked in coffee syrup, layered with coffee buttercream and dark chocolate ganache.',
    visualPrompt:
      'impeccable sharp architectural rectangular slice of French Opera Pastry showcasing distinct razor-clean layers of coffee-soaked joconde almond sponge, pale coffee buttercream, dark chocolate ganache, mirror-glaze chocolate top, and subtle edible gold leaf fleck',
    aliases: ['french opera pastry', 'opera cake slice', 'opera pastry'],
    estimatedNutrition: { calories: 430, protein: 6, carbs: 42, fat: 26, servingGrams: 135 },
  },
  {
    normalizedName: 'white chocolate mocha pastry',
    displayName: 'White Chocolate Mocha Pastry',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Light sponge cake layered with espresso-infused white chocolate mousse and shavings.',
    visualPrompt:
      'delicate layered slice of White Chocolate Mocha Pastry displaying pale vanilla-coffee sponge alternating cleanly with airy ivory espresso white-chocolate mousse crowned with velvety white chocolate curls and a coffee bean garnish',
    aliases: ['white chocolate mocha pastry', 'white mocha cake slice', 'white chocolate coffee pastry'],
    estimatedNutrition: { calories: 390, protein: 5, carbs: 41, fat: 23, servingGrams: 140 },
  },
  {
    normalizedName: 'classic black forest pastry',
    displayName: 'Classic Black Forest Pastry',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'German / Classic Patisserie',
    generalizedDescription:
      'Chocolate sponge layered with whipped cream and sour cherries, topped with chocolate curls.',
    visualPrompt:
      'classic tall neat slice of Classic Black Forest Pastry showing dark cocoa sponge layers filled clearly with fluffy pure white whipped cream and ruby sour cherry compote, blanketed with dark chocolate shavings and topped with a glossy red cherry',
    aliases: ['classic black forest pastry', 'black forest pastry', 'black forest cake slice'],
    estimatedNutrition: { calories: 380, protein: 5, carbs: 44, fat: 20, servingGrams: 150 },
  },
  {
    normalizedName: 'fresh fruit gateau pastry',
    displayName: 'Fresh Fruit Gateau Pastry',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Classic Patisserie',
    generalizedDescription:
      'Vanilla sponge cake layered with diplomat cream and loaded with kiwi, pineapple, and berries.',
    visualPrompt:
      'airy delicate layered white vanilla Fresh Fruit Gateau Pastry slice stacked cleanly with whipped cream, golden diced mango-pineapple, vibrant emerald sliced kiwi, fresh glossy strawberries, and blueberries on top',
    aliases: ['fresh fruit gateau pastry', 'fresh fruit pastry', 'pineapple fresh cream pastry', 'fruit cake slice'],
    estimatedNutrition: { calories: 330, protein: 4, carbs: 42, fat: 16, servingGrams: 145 },
  },
  {
    normalizedName: 'red velvet cream cheese pastry',
    displayName: 'Red Velvet Cream Cheese Pastry',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'American Patisserie',
    generalizedDescription:
      'Crimson cocoa cake layered with tangy cream cheese frosting.',
    visualPrompt:
      'striking tall slice of deep crimson Red Velvet Cake layered boldly with smooth snow-white tangy cream cheese frosting, garnished cleanly around top edge with fine ruby red velvet cake crumbs on a ceramic plate',
    aliases: ['red velvet cream cheese pastry', 'red velvet pastry', 'red velvet cake slice'],
    estimatedNutrition: { calories: 420, protein: 5, carbs: 46, fat: 24, servingGrams: 150 },
  },
  {
    normalizedName: 'banoffee pie',
    displayName: 'Banoffee Pie',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'British / Patisserie',
    generalizedDescription:
      'Buttery biscuit crust filled with dulce de leche caramel, sliced bananas, and whipped cream.',
    visualPrompt:
      'generous clean slice of Banoffee Pie showing golden biscuit crumb crust, amber dulce de leche caramel, fresh banana slices, billowing whipped cream, and dark chocolate curls',
    aliases: ['banoffee pie', 'banana toffee pie', 'banoffee tart'],
    estimatedNutrition: { calories: 440, protein: 5, carbs: 54, fat: 23, servingGrams: 165 },
  },
  {
    normalizedName: 'tres leches milk cake',
    displayName: 'Tres Leches Milk Cake',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Latin American Patisserie',
    generalizedDescription:
      'Sponge cake soaked in three kinds of milk (evaporated, condensed, and heavy cream) and topped with whipped cream.',
    visualPrompt:
      'plump golden sponge square of Tres Leches Milk Cake sitting cleanly inside a shallow stoneware dish pooled gently in glistening ivory sweet three-milk sauce, topped with soft whipped cream, fine cinnamon dust, and fresh strawberry slice',
    aliases: ['tres leches milk cake', 'tres leches cake', 'three milk cake'],
    estimatedNutrition: { calories: 410, protein: 7, carbs: 49, fat: 20, servingGrams: 175 },
  },
  {
    normalizedName: 'eclair',
    displayName: 'Classic Chocolate Eclair',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'French / Patisserie',
    generalizedDescription:
      'Oblong choux pastry filled with vanilla pastry cream and dipped in dark chocolate fondant.',
    visualPrompt:
      'elongated golden French Classic Chocolate Eclair made of airy crisp choux pastry crowned with mirror-gloss dark chocolate fondant glaze on a ceramic pastry plate',
    aliases: ['eclair', 'classic chocolate eclair', 'chocolate eclair', 'french eclair'],
    estimatedNutrition: { calories: 280, protein: 5, carbs: 31, fat: 15, servingGrams: 105 },
  },
  {
    normalizedName: 'nutella hazelnut eclair',
    displayName: 'Nutella Hazelnut Eclair',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary French Patisserie',
    generalizedDescription:
      'Crisp choux pastry piped with Nutella mousse and topped with roasted hazelnuts.',
    visualPrompt:
      'elegant elongated choux Nutella Hazelnut Eclair piped cleanly with chocolate-hazelnut pastry cream peaks, glossy brown Nutella ganache glaze, toasted chopped caramelized hazelnuts, and chocolate curls',
    aliases: ['nutella hazelnut eclair', 'hazelnut eclair', 'nutella eclair'],
    estimatedNutrition: { calories: 340, protein: 6, carbs: 34, fat: 20, servingGrams: 120 },
  },
  {
    normalizedName: 'macaron',
    displayName: 'Assorted French Macarons',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'French / Patisserie',
    generalizedDescription:
      'Delicate almond-meringue sandwich cookies filled with pistachio, raspberry, salted caramel, or chocolate ganache.',
    visualPrompt:
      'four pastel jewel-toned Assorted French Macarons (pistachio green, raspberry rose, salted caramel amber, dark chocolate) with crisp ruffled feet arranged neatly on a porcelain dessert plate',
    aliases: ['macaron', 'assorted french macarons', 'french macarons', 'french macaron'],
    estimatedNutrition: { calories: 220, protein: 4, carbs: 30, fat: 9, servingGrams: 75 },
  },
  {
    normalizedName: 'brownie',
    displayName: 'Warm Walnut Chocolate Brownie',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'American / Café',
    generalizedDescription:
      'Fudgy dark chocolate brownie studded with roasted walnuts.',
    visualPrompt:
      'rich crackly-top square Warm Walnut Chocolate Brownie with dense fudgy interior dotted visibly with toasted walnut halves and drizzled lightly with dark chocolate fudge sauce',
    aliases: ['brownie', 'warm walnut chocolate brownie', 'walnut brownie', 'chocolate brownie', 'fudge brownie'],
    estimatedNutrition: { calories: 370, protein: 5, carbs: 45, fat: 19, servingGrams: 120 },
  },
  {
    normalizedName: 'sizzling hot fudge brownie sundae',
    displayName: 'Sizzling Hot Fudge Brownie Sundae',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Indian-American Dessert Café',
    generalizedDescription:
      'Warm chocolate brownie served on a hot sizzler plate with vanilla ice cream and bubbling chocolate sauce.',
    visualPrompt:
      'dramatic oval black cast-iron sizzler plate set on a warm wooden board holding a rich dark chocolate brownie wedge crowned with a crisp round scoop of creamy white vanilla ice cream drowning in bubbling glossy hot chocolate fudge sauce and crushed roasted nuts',
    aliases: ['sizzling hot fudge brownie sundae', 'sizzling brownie', 'brownie sizzler'],
    estimatedNutrition: { calories: 640, protein: 8, carbs: 74, fat: 35, servingGrams: 260 },
  },
  {
    normalizedName: 'molten choco lava cake chocolate fondant',
    displayName: 'Molten Choco Lava Cake (Chocolate Fondant)',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'French Bistro Dessert',
    generalizedDescription:
      'Warm individual chocolate cake with a liquid dark chocolate center.',
    visualPrompt:
      'warm round dark cocoa dome Molten Choco Lava Cake gently split at one edge to pour a glossy satin river of rich liquid dark chocolate ganache onto a plate dusted lightly with icing sugar beside fresh raspberry garnish',
    aliases: ['molten choco lava cake chocolate fondant', 'choco lava cake', 'chocolate fondant', 'molten lava cake'],
    estimatedNutrition: { calories: 430, protein: 6, carbs: 48, fat: 24, servingGrams: 140 },
  },
  {
    normalizedName: 'affogato',
    displayName: 'Brownie Affogato',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Italian / Contemporary Café',
    generalizedDescription:
      'Warm fudgy brownie cubes topped with vanilla gelato and drowned in a shot of hot espresso.',
    visualPrompt:
      'Italian Brownie Affogato inside a footed dessert glass with creamy vanilla bean gelato sitting atop warm dark brownie chunks as fresh hot espresso pours and puddles gently around the base',
    aliases: ['affogato', 'brownie affogato', 'espresso affogato', 'gelato affogato'],
    estimatedNutrition: { calories: 290, protein: 5, carbs: 34, fat: 15, servingGrams: 190 },
  },
  {
    normalizedName: 'skillet-baked chocolate chip cookie pizookie',
    displayName: 'Skillet-Baked Chocolate Chip Cookie (Pizookie)',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'American Dessert Café',
    generalizedDescription:
      'Giant gooey chocolate chip cookie baked in a cast-iron skillet and topped with vanilla ice cream.',
    visualPrompt:
      'individual mini black cast-iron skillet holding a thick golden-brown gooey baked Chocolate Chip Cookie studded heavily with melted dark chocolate chunks and crowned cleanly with a scoop of melting vanilla bean ice cream',
    aliases: ['skillet-baked chocolate chip cookie pizookie', 'pizookie', 'skillet cookie', 'cookie skillet'],
    estimatedNutrition: { calories: 620, protein: 7, carbs: 76, fat: 33, servingGrams: 240 },
  },
  {
    normalizedName: 'spiced carrot cake with cream cheese frosting',
    displayName: 'Spiced Carrot Cake with Cream Cheese Frosting',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'British / American Bakery',
    generalizedDescription:
      'Moist cake made with grated carrots, cinnamon, and walnuts, frosted with cream cheese icing.',
    visualPrompt:
      'plump layered wedge of Spiced Carrot Cake showing tender warm amber crumb speckled visibly with grated carrots, cinnamon spice, and toasted walnuts bonded and topped with rich ivory vanilla cream cheese frosting and walnut halves',
    aliases: ['spiced carrot cake with cream cheese frosting', 'carrot cake', 'walnut carrot cake'],
    estimatedNutrition: { calories: 460, protein: 6, carbs: 49, fat: 27, servingGrams: 165 },
  },
  {
    normalizedName: 'sugar-free almond flour chocolate cake',
    displayName: 'Sugar-Free Almond Flour Chocolate Cake',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Wellness / Keto Patisserie',
    generalizedDescription:
      'Guilt-free, gluten-free chocolate cake made with almond meal and sweetened with stevia.',
    visualPrompt:
      'dense velvety dark Sugar-Free Almond Flour Chocolate Cake slice finished with matte dark ganache glaze, crisp toasted slivered flaked almonds, and fresh raspberries on a ceramic plate',
    aliases: ['sugar-free almond flour chocolate cake', 'keto chocolate cake', 'gluten free almond chocolate cake'],
    estimatedNutrition: { calories: 310, protein: 9, carbs: 14, fat: 25, servingGrams: 130 },
  },
  {
    normalizedName: 'baklava',
    displayName: 'Turkish Pistachio Baklava',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Middle Eastern / Mediterranean',
    generalizedDescription:
      'Crisp layers of phyllo pastry filled with chopped pistachios and drenched in honey-rosewater syrup.',
    visualPrompt:
      'three golden diamond-cut crisp flaky pieces of Turkish Pistachio Baklava packed richly inside with vivid emerald ground pistachios and gleaming lightly with honey rosewater syrup on a plate',
    aliases: ['baklava', 'turkish pistachio baklava', 'pistachio baklava', 'turkish baklava'],
    estimatedNutrition: { calories: 330, protein: 6, carbs: 36, fat: 19, servingGrams: 100 },
  },
  {
    normalizedName: 'artisanal hazelnut praline laddoo',
    displayName: 'Artisanal Hazelnut Praline Laddoo',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Indian Mithai Café',
    generalizedDescription:
      'Fusion Indian-cafe sweet combining roasted hazelnuts, chocolate, and traditional laddoo base.',
    visualPrompt:
      'four sculpted rich chocolate-bronze round gourmet Artisanal Hazelnut Praline Laddoos nestled neatly inside fluted gold-foil paper petit-four cups dusted lightly with crushed toasted hazelnuts and dark cocoa nibs on a ceramic tray',
    aliases: ['artisanal hazelnut praline laddoo', 'hazelnut praline laddoo', 'chocolate hazelnut ladoo'],
    estimatedNutrition: { calories: 290, protein: 5, carbs: 26, fat: 19, servingGrams: 90 },
  },
  {
    normalizedName: 'blueberry white chocolate laddoo',
    displayName: 'Blueberry & White Chocolate Laddoo',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Indian Mithai Café',
    generalizedDescription:
      'Contemporary mithai infused with dried blueberries and creamy white chocolate.',
    visualPrompt:
      'four delicate ivory-and-pastel-violet artisanal mithai truffle laddoos studded visibly with dried indigo blueberries, creamy white chocolate glaze, and subtle green crushed pistachio garnish arranged neatly on a ceramic plate',
    aliases: ['blueberry white chocolate laddoo', 'blueberry mithai ladoo', 'white chocolate ladoo'],
    estimatedNutrition: { calories: 270, protein: 4, carbs: 30, fat: 15, servingGrams: 90 },
  },
  {
    normalizedName: 'lemon crinkle cookies',
    displayName: 'Lemon Crinkle Cookies',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Bakery',
    generalizedDescription:
      'Soft, zesty lemon cookies coated in powdered sugar with a crackled surface.',
    visualPrompt:
      'four sunny pastel-lemon soft baked crinkle cookies with distinct snowy powdered-sugar crackle fissures resting cleanly on a pale stoneware pastry plate next to subtle lemon zest curl',
    aliases: ['lemon crinkle cookies', 'lemon crinkle cookie', 'lemon sugar cookies'],
    estimatedNutrition: { calories: 240, protein: 3, carbs: 36, fat: 10, servingGrams: 85 },
  },
  {
    normalizedName: 'oatmeal raisin cookies',
    displayName: 'Oatmeal & Raisin Cookies',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Chewy spiced bakery cookies made with rolled oats, brown sugar, and plump raisins.',
    visualPrompt:
      'stack of three rustic golden-brown chewy bakery Oatmeal & Raisin Cookies visibly textured with hearty rolled oats and plump dark sweet raisins on a clean stoneware plate',
    aliases: ['oatmeal raisin cookies', 'oatmeal cookie', 'oatmeal and raisin cookies'],
    estimatedNutrition: { calories: 280, protein: 4, carbs: 42, fat: 11, servingGrams: 95 },
  },
  {
    normalizedName: 'italian chocolate almond biscotti',
    displayName: 'Italian Chocolate Almond Biscotti',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Italian Bakery',
    generalizedDescription:
      'Twice-baked crunchy almond-chocolate biscuits designed for dipping into coffee.',
    visualPrompt:
      'four crisp angled golden twice-baked Italian Almond Biscotti cookies studded with whole roasted almonds and half-dipped cleanly in glossy dark chocolate beside an espresso cup',
    aliases: ['italian chocolate almond biscotti', 'chocolate almond biscotti', 'almond biscotti'],
    estimatedNutrition: { calories: 230, protein: 5, carbs: 29, fat: 11, servingGrams: 75 },
  },
  {
    normalizedName: 'french palmier elephant ears',
    displayName: 'French Palmier (Elephant Ears)',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'French Bakery',
    generalizedDescription:
      'Crisp, caramelized puff pastry cookies rolled in sugar and baked into a heart shape.',
    visualPrompt:
      'three golden-amber caramelized flaky puff pastry French Palmier heart-shaped biscuits showing tight crisp spiraled swirls glistening softly with toasted sugar crust on a ceramic tea plate',
    aliases: ['french palmier elephant ears', 'french palmier', 'palmier cookie', 'elephant ears pastry'],
    estimatedNutrition: { calories: 260, protein: 3, carbs: 32, fat: 14, servingGrams: 75 },
  },
  {
    normalizedName: 'scottish butter shortbread',
    displayName: 'Scottish Butter Shortbread',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Scottish / Classic Bakery',
    generalizedDescription:
      'Crumbly, melt-in-the-mouth rectangular biscuits made from butter, sugar, and flour.',
    visualPrompt:
      'four neat pale golden rectangular Scottish Butter Shortbread fingers pricked with classic parallel fork holes and dusted lightly with fine caster sugar stacked crisply on a porcelain saucer',
    aliases: ['scottish butter shortbread', 'butter shortbread', 'shortbread fingers'],
    estimatedNutrition: { calories: 290, protein: 3, carbs: 33, fat: 16, servingGrams: 80 },
  },
  {
    normalizedName: 'glazed ring donut',
    displayName: 'Glazed Ring Donut',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Yeast-leavened fried dough ring coated in a glossy vanilla sugar glaze.',
    visualPrompt:
      'fluffy golden plump yeast-raised ring donut coated smoothly in luminous translucent shiny ivory vanilla sugar glaze on a clean cream porcelain plate',
    aliases: ['glazed ring donut', 'classic glazed donut', 'original glazed doughnut'],
    estimatedNutrition: { calories: 270, protein: 4, carbs: 34, fat: 13, servingGrams: 80 },
  },
  {
    normalizedName: 'belgian chocolate fondue pot',
    displayName: 'Belgian Chocolate Fondue Pot',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Belgian Dessert Bar',
    generalizedDescription:
      'Warm ceramic pot of melted dark chocolate served with skewered strawberries, marshmallows, brownies, and waffle cubes.',
    visualPrompt:
      'charming warm ivory ceramic Belgian Chocolate Fondue pot brimming with glossy satin dark chocolate surrounded cleanly on a sharing tray by ruby fresh strawberries, fluffy marshmallows, cubed brownies, banana chunks, and waffle pieces with two fondue forks',
    aliases: ['belgian chocolate fondue pot', 'chocolate fondue', 'fondue platter'],
    estimatedNutrition: { calories: 720, protein: 9, carbs: 86, fat: 38, servingGrams: 340 },
  },
  {
    normalizedName: 'thai rolled ice cream',
    displayName: 'Thai Rolled Ice Cream',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'Contemporary Dessert Bar',
    generalizedDescription:
      'Liquid ice cream base poured onto a freezing metal plate, mixed with fruits or cookies, and scraped into tight rolls.',
    visualPrompt:
      'pastel berry-or-cookie swirled cup brimming cleanly with five tight neat cylindrical coils of handmade Thai Rolled Ice Cream topped with fresh strawberries, dark Oreo cookie crumb, and crisp rolled wafer stick',
    aliases: ['thai rolled ice cream', 'rolled ice cream', 'stir fried ice cream rolls'],
    estimatedNutrition: { calories: 380, protein: 6, carbs: 49, fat: 18, servingGrams: 200 },
  },
  {
    normalizedName: 'kesar badam kulfi falooda',
    displayName: 'Kesar Badam Kulfi Falooda',
    category: 'Cakes, Pastries, Cookies & Confectionery',
    cuisine: 'North Indian Heritage Dessert',
    generalizedDescription:
      'Traditional dense saffron-almond frozen milk dessert topped with vermicelli noodles, rose syrup, and sweet basil seeds.',
    visualPrompt:
      'tall fluted glass goblet filled with vibrant ruby rose syrup, delicate silky falooda vermicelli noodles, plump soaked black sabja basil seeds, thick sliced golden saffron-almond kulfi wedges, pistachio slivers, and dried rose petals',
    aliases: ['kesar badam kulfi falooda', 'kulfi falooda', 'kesar falooda', 'royal falooda'],
    estimatedNutrition: { calories: 460, protein: 11, carbs: 58, fat: 21, servingGrams: 280 },
  },
];

