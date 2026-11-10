import type { CanonicalCatalogItem } from '../types';

export const PATISSERIE_FROZEN_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // XVI. Patisserie, Global Desserts & Frozen Treats (551-600)
  // =========================================================================
  {
    normalizedName: 'classic french creme brulee',
    displayName: 'Classic French Crème Brûlée',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'French Patisserie',
    generalizedDescription:
      'Rich vanilla-bean baked custard topped with a contrasting layer of hard, torch-caramelized sugar.',
    visualPrompt:
      'classic shallow white fluted porcelain ramekin of pale velvety Madagascar vanilla-bean Crème Brûlée custard crowned cleanly with a glassy amber-mahogany crackly torched sugar crust garnished beside fresh raspberry and mint sprig',
    aliases: ['classic french creme brulee', 'creme brulee', 'vanilla bean creme brulee'],
    estimatedNutrition: { calories: 390, protein: 6, carbs: 32, fat: 27, servingGrams: 150 },
  },
  {
    normalizedName: 'vanilla bean panna cotta with berry coulis',
    displayName: 'Vanilla Bean Panna Cotta with Berry Coulis',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Italian Dessert',
    generalizedDescription:
      'Silky, set Italian sweetened cream molded and served chilled with a tart raspberry-strawberry sauce.',
    visualPrompt:
      'trembling snow-white unmolded dome of speckled Vanilla Bean Panna Cotta resting gracefully on a minimalist stoneware plate surrounded cleanly by glossy crimson ruby raspberry-strawberry coulis pool, fresh raspberries, and mint leaf',
    aliases: ['vanilla bean panna cotta with berry coulis', 'vanilla panna cotta', 'panna cotta berry'],
    estimatedNutrition: { calories: 330, protein: 4, carbs: 28, fat: 23, servingGrams: 150 },
  },
  {
    normalizedName: 'sticky toffee pudding',
    displayName: 'Sticky Toffee Pudding',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'British Patisserie',
    generalizedDescription:
      'Moist warm sponge cake made with finely chopped dates, drenched in hot butterscotch toffee sauce and served with vanilla bean ice cream.',
    visualPrompt:
      'warm deeply moist dark amber caramelized date-sponge cake square drenched lavishly with gleaming rich golden-brown butterscotch toffee sauce inside a shallow stoneware dish crowned with a melting scoop of speckled vanilla bean ice cream',
    aliases: ['sticky toffee pudding', 'date toffee pudding', 'english toffee cake'],
    estimatedNutrition: { calories: 560, protein: 6, carbs: 74, fat: 27, servingGrams: 220 },
  },
  {
    normalizedName: 'warm apple pie with cinnamon ice cream',
    displayName: 'Warm Apple Pie with Cinnamon Ice Cream',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Shortcrust pastry pie filled with spiced Bramley apples and raisins, baked golden and served warm a la mode.',
    visualPrompt:
      'tall golden lattice-crust slice of Warm Apple Pie revealing glossy cinnamon-glazed caramelized apple slices and raisins beside a melting round scoop of vanilla-cinnamon bean ice cream dusted lightly with cinnamon spice on a ceramic plate',
    aliases: ['warm apple pie with cinnamon ice cream', 'warm apple pie', 'apple pie a la mode'],
    estimatedNutrition: { calories: 490, protein: 5, carbs: 68, fat: 22, servingGrams: 210 },
  },
  {
    normalizedName: 'pecan pie',
    displayName: 'Pecan Pie',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Southern American Bakery',
    generalizedDescription:
      'Southern-style shortcrust tart filled with a rich, caramelized corn-syrup and brown-sugar custard loaded with toasted pecan halves.',
    visualPrompt:
      'neat crisp buttery crust wedge slice of Southern Pecan Pie packed symmetrically on top with glossy caramelized deeply amber roasted pecan halves over rich gooey brown-sugar custard next to a rosette of softly whipped cream',
    aliases: ['pecan pie', 'southern caramel pecan tart', 'maple pecan pie slice'],
    estimatedNutrition: { calories: 540, protein: 6, carbs: 62, fat: 31, servingGrams: 160 },
  },
  {
    normalizedName: 'classic lemon meringue tart',
    displayName: 'Classic Lemon Meringue Tart',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'French / Classic Patisserie',
    generalizedDescription:
      'Crisp sweet tart shell filled with sharp, zesty lemon curd and topped with torched peaks of fluffy Italian meringue.',
    visualPrompt:
      'crisp golden fluted pate sucree tartlet filled neatly with glossy sunny yellow lemon curd crowned high with dramatic sculpted snow-white Italian meringue peaks gently toasted toasted-gold by torch tip on a porcelain plate',
    aliases: ['classic lemon meringue tart', 'lemon meringue tart', 'lemon meringue pie'],
    estimatedNutrition: { calories: 380, protein: 5, carbs: 52, fat: 17, servingGrams: 140 },
  },
  {
    normalizedName: 'belgian chocolate ganache tart',
    displayName: 'Belgian Chocolate Ganache Tart',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Belgian / French Patisserie',
    generalizedDescription:
      'Chocolate shortcrust pastry shell filled with a dense, glossy, no-bake dark chocolate and heavy cream ganache.',
    visualPrompt:
      'refined dark cocoa crisp shortcrust tartlet shell filled smooth to the brim with flawless mirror-gloss obsidian-dark Belgian Chocolate Ganache crowned delicately with crisp chocolate shard and tiny gold-dust fleck',
    aliases: ['belgian chocolate ganache tart', 'chocolate ganache tart', 'dark chocolate tart'],
    estimatedNutrition: { calories: 430, protein: 6, carbs: 42, fat: 27, servingGrams: 135 },
  },
  {
    normalizedName: 'fresh strawberry custard tartlet',
    displayName: 'Fresh Strawberry & Custard Tartlet',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'French Patisserie',
    generalizedDescription:
      'Individual buttery tart shell piped with vanilla pastry cream and topped with glazed fresh strawberries.',
    visualPrompt:
      'round crisp golden buttery French pate sablée tartlet shell brimming gently with velvety pale-yellow vanilla-bean creme patissiere topped in a rosette crown with glistening apricot-glazed sliced fresh ruby strawberries and green pistachio dust',
    aliases: ['fresh strawberry custard tartlet', 'strawberry tart', 'french berry tartlet'],
    estimatedNutrition: { calories: 340, protein: 5, carbs: 42, fat: 17, servingGrams: 135 },
  },
  {
    normalizedName: 'salted caramel peanut tart',
    displayName: 'Salted Caramel & Peanut Tart',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Crisp pastry shell filled with chewy salted caramel and roasted peanuts, topped with dark chocolate glaze.',
    visualPrompt:
      'crisp dark chocolate tartlet sliced slightly at one quarter to show golden flowing salted caramel packed tightly with roasted crunchy peanuts resting cleanly under mirror dark chocolate ganache drizzle and flaky sea salt crystals',
    aliases: ['salted caramel peanut tart', 'caramel peanut chocolate tart', 'snickers patisserie tart'],
    estimatedNutrition: { calories: 470, protein: 8, carbs: 44, fat: 30, servingGrams: 145 },
  },
  {
    normalizedName: 'mille-feuille napoleon pastry',
    displayName: 'Mille-Feuille (Napoleon Pastry)',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'French Patisserie',
    generalizedDescription:
      'Three layers of crisp, caramelized puff pastry alternating with layers of smooth vanilla diplomat cream and berries.',
    visualPrompt:
      'architectural three-tier classic French Mille-Feuille rectangular slice stacking wafer-crisp caramelized golden flaky puff pastry sheets between plump rosettes of piped vanilla bean diplomat cream, fresh raspberries, and fine icing sugar',
    aliases: ['mille-feuille napoleon pastry', 'mille feuille', 'napoleon pastry slice'],
    estimatedNutrition: { calories: 440, protein: 6, carbs: 46, fat: 26, servingGrams: 145 },
  },
  {
    normalizedName: 'profiteroles cream puffs',
    displayName: 'Profiteroles (Cream Puffs)',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'French Patisserie',
    generalizedDescription:
      'Choux pastry spheres filled with chilled whipped cream or vanilla ice cream and drenched in warm dark chocolate sauce.',
    visualPrompt:
      'pyramid of four golden airy round baked choux Profiterole puffs overflowing gently with cool whipped cream or vanilla ice cream drowned artistically beneath glossy satin warm dark chocolate sauce cascades and slivered toasted almonds',
    aliases: ['profiteroles cream puffs', 'profiteroles', 'chocolate cream puffs'],
    estimatedNutrition: { calories: 450, protein: 7, carbs: 44, fat: 28, servingGrams: 170 },
  },
  {
    normalizedName: 'spanish churros with hot chocolate dip',
    displayName: 'Spanish Churros with Hot Chocolate Dip',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Spanish Patisserie Café',
    generalizedDescription:
      'Ridged strips of fried choux dough tossed in cinnamon sugar and served with a pot of thick dark chocolate.',
    visualPrompt:
      'crisp deeply star-ridged golden Spanish Churro batons coated evenly in sparkling cinnamon-sugar crystals piled neatly in parchment beside a warm porcelain dipping pot brimming with ultra-thick satin glossy melted dark chocolate',
    aliases: ['spanish churros with hot chocolate dip', 'spanish churros', 'churros chocolate sauce'],
    estimatedNutrition: { calories: 480, protein: 7, carbs: 62, fat: 23, servingGrams: 190 },
  },
  {
    normalizedName: 'sicilian cannoli',
    displayName: 'Sicilian Cannoli',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Italian / Sicilian Patisserie',
    generalizedDescription:
      'Crisp, fried pastry tubes filled to order with sweetened whipped ricotta cheese, candied orange peel, and chocolate chips.',
    visualPrompt:
      'two crisp blistered golden Sicilian Cannoli pastry tubes piped lavishly from both open ends with smooth snowy sweetened ricotta cream dipped at one end with vibrant crushed emerald pistachios and the other with dark chocolate chips and candied orange peel',
    aliases: ['sicilian cannoli', 'ricotta cannoli', 'italian cannoli'],
    estimatedNutrition: { calories: 390, protein: 8, carbs: 42, fat: 21, servingGrams: 140 },
  },
  {
    normalizedName: 'pavlova with fresh berries',
    displayName: 'Pavlova with Fresh Berries',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Australian / New Zealand Patisserie',
    generalizedDescription:
      'Crisp-shell, marshmallow-center baked meringue nest topped with unsweetened whipped cream, kiwi, passionfruit, and berries.',
    visualPrompt:
      'delicate billowing snow-white fluted baked Pavlova meringue nest crowned generously with soft billowy whipped cream peaks, vibrant green kiwi rounds, jewel-like glossy red strawberries, blueberries, golden passionfruit pulp seeds, and mint leaf',
    aliases: ['pavlova with fresh berries', 'berry pavlova', 'meringue pavlova dessert'],
    estimatedNutrition: { calories: 350, protein: 5, carbs: 56, fat: 13, servingGrams: 175 },
  },
  {
    normalizedName: 'eton mess',
    displayName: 'Eton Mess',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'British Classic Dessert',
    generalizedDescription:
      'Traditional English dessert consisting of a crushed mixture of strawberries, crunchy meringue pieces, and whipped heavy cream.',
    visualPrompt:
      'chilled stemmed wide dessert glass swirling lush soft white Chantilly whipped cream, bright crushed ruby fresh strawberries, strawberry coulis ribbons, chunky crisp snow-white meringue shards, and fresh mint crown',
    aliases: ['eton mess', 'strawberry meringue cream dessert'],
    estimatedNutrition: { calories: 370, protein: 4, carbs: 44, fat: 20, servingGrams: 185 },
  },
  {
    normalizedName: 'english sherry trifle non-alcoholic',
    displayName: 'English Sherry Trifle (Non-Alcoholic)',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'British Classic Dessert',
    generalizedDescription:
      'Layered glass dessert of fruit-syrup-soaked sponge cake, custard, fresh fruit, jelly, and whipped cream.',
    visualPrompt:
      'clear footed crystal glass trifle bowl displaying crisp horizontal celebration layers: ruby red berry jelly, golden fruit-soaked sponge cake cubes, velvety pale yellow custard, thick white whipped cream swirls, and toasted almonds on top',
    aliases: ['english sherry trifle non-alcoholic', 'english trifle', 'berry custard trifle bowl'],
    estimatedNutrition: { calories: 410, protein: 6, carbs: 58, fat: 17, servingGrams: 220 },
  },
  {
    normalizedName: 'bread and butter pudding',
    displayName: 'Bread and Butter Pudding',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'British Bakery',
    generalizedDescription:
      'Slices of buttered brioche layered with raisins inside a baked nutmeg-vanilla egg custard.',
    visualPrompt:
      'individual warm ivory ceramic gratin bowl of classic British Bread & Butter Pudding showcasing overlapping golden toasted brioche triangles nestled gently in set baked vanilla-nutmeg custard dotted with sweet plump raisins and creme anglaise pool',
    aliases: ['bread and butter pudding', 'brioche bread pudding', 'warm vanilla bread pudding'],
    estimatedNutrition: { calories: 440, protein: 10, carbs: 56, fat: 20, servingGrams: 200 },
  },
  {
    normalizedName: 'austrian sachertorte slice',
    displayName: 'Austrian Sachertorte Slice',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Austrian / Viennese Patisserie',
    generalizedDescription:
      'Dense chocolate sponge cake with a thin layer of apricot jam inside, coated in dark chocolate icing.',
    visualPrompt:
      'sleek immaculate wedge slice of rich dark Viennese Sachertorte revealing subtle vibrant amber apricot jam layer gleaming subtly underneath dark satin chocolate glaze served beside an unsweetened fluffy whipped cream quenelle',
    aliases: ['austrian sachertorte slice', 'sachertorte', 'apricot dark chocolate cake'],
    estimatedNutrition: { calories: 460, protein: 6, carbs: 54, fat: 25, servingGrams: 150 },
  },
  {
    normalizedName: 'german black forest gateau',
    displayName: 'German Black Forest Gateau',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'German Patisserie',
    generalizedDescription:
      'Multiple layers of chocolate sponge soaked in cherry syrup with whipped cream and morello cherries.',
    visualPrompt:
      'grand multi-tiered rich German Schwarzwälder Kirschtorte gateau slice showcasing three dark cocoa sponge tiers packed between billowing whipped cream and dark ruby morello cherry compote blanketed with dark chocolate shavings and cherry on top',
    aliases: ['german black forest gateau', 'black forest gateau', 'schwarzwalder kirschtorte'],
    estimatedNutrition: { calories: 430, protein: 6, carbs: 49, fat: 24, servingGrams: 165 },
  },
  {
    normalizedName: 'matcha green tea mille crepe cake',
    displayName: 'Matcha Green Tea Mille Crêpe Cake',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Japanese-French Patisserie',
    generalizedDescription:
      'Twenty paper-thin matcha crepes stacked with delicate layers of light green tea pastry cream in between.',
    visualPrompt:
      'breathtaking immaculate sharp slice of Matcha Mille Crêpe Cake displaying twenty wafer-thin green tea crepe layers neatly separated by delicate ivory and pale-jade whipped cream bands dusted richly atop with ceremonial emerald matcha powder',
    aliases: ['matcha green tea mille crepe cake', 'matcha mille crepe cake', 'green tea crepe cake'],
    estimatedNutrition: { calories: 420, protein: 8, carbs: 42, fat: 25, servingGrams: 155 },
  },
  {
    normalizedName: 'mango cheesecake seasonal',
    displayName: 'Mango Cheesecake (Seasonal)',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Seasonal Patisserie',
    generalizedDescription:
      'Creamy no-bake cheesecake topped with a thick glaze of sweet Alphonso mango puree and fresh mango cubes.',
    visualPrompt:
      'tall velvety clean white slice of chilled cheesecake sitting on crisp golden cookie crumb base crowned with thick luminous saffron-gold Alphonso mango glaze layer, clean fresh ripe mango dices, and tiny mint sprig on a porcelain plate',
    aliases: ['mango cheesecake seasonal', 'mango cheesecake', 'alphonso mango cheesecake'],
    estimatedNutrition: { calories: 430, protein: 6, carbs: 44, fat: 25, servingGrams: 160 },
  },
  {
    normalizedName: 'nutella ferrero rocher cake',
    displayName: 'Nutella Ferrero Rocher Cake',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Chocolate Patisserie',
    generalizedDescription:
      'Decadent chocolate hazelnut sponge layered with Nutella buttercream, crushed wafers, and roasted hazelnuts.',
    visualPrompt:
      'decadent rich slice of layered Nutella Hazelnut Chocolate Cake coated cleanly with textured roasted-hazelnut chocolate shell drip, lush hazelnut buttercream frosting swirl, crisp wafer flakes, and a whole golden-dusted hazelnut praline truffle',
    aliases: ['nutella ferrero rocher cake', 'ferrero rocher cake', 'nutella hazelnut cake'],
    estimatedNutrition: { calories: 550, protein: 8, carbs: 54, fat: 34, servingGrams: 170 },
  },
  {
    normalizedName: 'pistachio rosewater tres leches',
    displayName: 'Pistachio & Rosewater Tres Leches',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Fusion Patisserie',
    generalizedDescription:
      'Sponge cake soaked in three milks infused with fragrant rosewater and topped with crushed Iranian pistachios.',
    visualPrompt:
      'tender pastel green pistachio milk-soaked square Tres Leches cake bathed in glistening emerald-ivory rosewater milk glaze inside a deep dish crowned generously with soft cream peaks, crisp green Iranian pistachio crumbles, and pink rose petals',
    aliases: ['pistachio rosewater tres leches', 'pistachio tres leches', 'rose pistachio milk cake'],
    estimatedNutrition: { calories: 440, protein: 9, carbs: 50, fat: 23, servingGrams: 180 },
  },
  {
    normalizedName: 'vegan dark chocolate avocado mousse',
    displayName: 'Vegan Dark Chocolate Avocado Mousse',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Wellness / Plant-Based Café',
    generalizedDescription:
      'Silky, dairy-free chocolate mousse blended from ripe avocados, raw cacao powder, almond milk, and maple syrup.',
    visualPrompt:
      'glass dessert coupe brimming with whipped ultra-silky dark cocoa satin peaks of Vegan Chocolate Avocado Mousse dusted delicately with raw cacao nibs, fresh red raspberries, and mint sprig garnish',
    aliases: ['vegan dark chocolate avocado mousse', 'vegan chocolate mousse', 'dark chocolate avocado mousse'],
    estimatedNutrition: { calories: 290, protein: 4, carbs: 26, fat: 21, servingGrams: 145 },
  },
  {
    normalizedName: 'chia seed coconut pudding',
    displayName: 'Chia Seed Coconut Pudding',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Wellness Café Dessert',
    generalizedDescription:
      'Soaked chia seeds in creamy coconut milk sweetened with honey and topped with mango and toasted almonds.',
    visualPrompt:
      'clear glass dessert parfait jar filled neatly with plump creamy white coconut-soaked chia pudding layered brightly with golden fresh mango puree cubes, toasted coconut flakes, sliced almonds, and fresh blueberries',
    aliases: ['chia seed coconut pudding', 'coconut chia pudding', 'mango chia seed parfait'],
    estimatedNutrition: { calories: 310, protein: 7, carbs: 32, fat: 18, servingGrams: 200 },
  },
  {
    normalizedName: 'lemon blueberry loaf cake',
    displayName: 'Lemon Blueberry Loaf Cake',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Bakery Café',
    generalizedDescription:
      'Moist tea-time pound cake bursting with whole blueberries and drizzled with a tangy lemon-sugar icing.',
    visualPrompt:
      'two thick plush pale-butter tender slices of Lemon Blueberry Loaf Cake packed inside with burst deep-blue wild blueberries crowned across the top with dripping translucent snowy tart lemon-sugar glaze and lemon zest curl',
    aliases: ['lemon blueberry loaf cake', 'blueberry lemon pound cake', 'lemon loaf cake'],
    estimatedNutrition: { calories: 370, protein: 5, carbs: 52, fat: 16, servingGrams: 130 },
  },
  {
    normalizedName: 'marble tea cake',
    displayName: 'Marble Tea Cake',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Classic Bakery',
    generalizedDescription:
      'Classic vanilla and rich cocoa batters swirled together and baked into a tender, buttery loaf slice.',
    visualPrompt:
      'two neat golden rectangular slices of buttery tender Marble Tea Cake displaying distinct marbled swirls of warm vanilla pound batter and deep dark chocolate cocoa batter on a ceramic tea saucer',
    aliases: ['marble tea cake', 'chocolate vanilla marble cake', 'marble loaf slice'],
    estimatedNutrition: { calories: 360, protein: 5, carbs: 46, fat: 17, servingGrams: 120 },
  },
  {
    normalizedName: 'red velvet cream cheese cupcake',
    displayName: 'Red Velvet Cream Cheese Cupcake',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'American Bakery',
    generalizedDescription:
      'Individual crimson cocoa cake topped with a high swirl of tangy Philadelphia cream cheese frosting.',
    visualPrompt:
      'tall crimson velvet cocoa cupcake nestled in a crisp pleated ivory paper liner crowned dramatically with a tall piped peak rosette swirl of snowy tangy cream cheese frosting sprinkled with ruby red velvet crumbs',
    aliases: ['red velvet cream cheese cupcake', 'red velvet cupcake', 'cream cheese frosted cupcake'],
    estimatedNutrition: { calories: 390, protein: 5, carbs: 48, fat: 20, servingGrams: 115 },
  },
  {
    normalizedName: 'salted caramel chocolate cupcake',
    displayName: 'Salted Caramel Chocolate Cupcake',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Bakery',
    generalizedDescription:
      'Moist dark chocolate cupcake with a liquid salted caramel core and chocolate fudge frosting.',
    visualPrompt:
      'rich dark chocolate cupcake piped tall with glossy chocolate fudge frosting swirl drizzled generously with golden thick salted caramel ribbons and crunchy flaky sea salt crystals inside a parchment wrapper',
    aliases: ['salted caramel chocolate cupcake', 'chocolate salted caramel cupcake'],
    estimatedNutrition: { calories: 420, protein: 5, carbs: 54, fat: 21, servingGrams: 125 },
  },
  {
    normalizedName: 'cake pops',
    displayName: 'Cake Pops',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Patisserie Café',
    generalizedDescription:
      'Bite-sized spheres of crumbled cake mixed with frosting on a lollipop stick, dipped in colorful melted chocolate and sprinkles.',
    visualPrompt:
      'trio of glossy candy-coated spherical gourmet Cake Pops standing cleanly upright on white lollipop sticks coated in pastel blush strawberry chocolate, rich dark chocolate, and ivory white glaze topped with festive sprinkles and gold drizzle',
    aliases: ['cake pops', 'chocolate cake pop', 'truffle cake lollipops'],
    estimatedNutrition: { calories: 290, protein: 3, carbs: 36, fat: 15, servingGrams: 95 },
  },
  {
    normalizedName: 'fudgy blondie butterscotch brownie',
    displayName: 'Fudgy Blondie (Butterscotch Brownie)',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'American Bakery',
    generalizedDescription:
      'Dense, chewy brown-sugar bar studded with white chocolate chips and toasted pecans.',
    visualPrompt:
      'thick golden amber caramel-crust chewy Fudgy Blondie square stacked casually on a plate visibly loaded inside with creamy white chocolate chunks and toasted roasted pecan pieces with subtle caramel drizzle',
    aliases: ['fudgy blondie butterscotch brownie', 'fudgy blondie', 'butterscotch brownie', 'white chocolate blondie'],
    estimatedNutrition: { calories: 390, protein: 5, carbs: 48, fat: 20, servingGrams: 115 },
  },
  {
    normalizedName: 'red velvet white chocolate cookie',
    displayName: 'Red Velvet White Chocolate Cookie',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Cookie Bar',
    generalizedDescription:
      'Soft-baked crimson cookie packed with creamy white chocolate chunks.',
    visualPrompt:
      'two plump soft-baked crinkle-top deep ruby-crimson Red Velvet cookies broken subtly to reveal gooey chewy texture richly stuffed with generous ivory white chocolate chunks on a minimalist ceramic dessert plate',
    aliases: ['red velvet white chocolate cookie', 'red velvet cookie', 'crimson white choc chunk cookie'],
    estimatedNutrition: { calories: 330, protein: 4, carbs: 42, fat: 16, servingGrams: 95 },
  },
  {
    normalizedName: 'double dark chocolate chunk cookie',
    displayName: 'Double Dark Chocolate Chunk Cookie',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Cookie Bar',
    generalizedDescription:
      'Bakery-style thick, gooey cocoa cookie loaded with 70% dark chocolate callets and flaky sea salt.',
    visualPrompt:
      'thick chunky dark-cocoa bakery cookie broken softly open in half displaying melted gooey pools of 70% dark couverture chocolate chunks glistening cleanly with bright white Maldon sea salt flakes on top',
    aliases: ['double dark chocolate chunk cookie', 'dark chocolate chunk cookie', 'sea salt double choc cookie'],
    estimatedNutrition: { calories: 360, protein: 5, carbs: 44, fat: 19, servingGrams: 100 },
  },
  {
    normalizedName: 'matcha white chocolate cookie',
    displayName: 'Matcha & White Chocolate Cookie',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Japanese Bakery Café',
    generalizedDescription:
      'Earthy green-tea butter cookie studded with sweet white chocolate chips.',
    visualPrompt:
      'two plump chewy pastel moss-green ceremonial Matcha butter cookies studded generously across golden crisp edges with sweet creamy white chocolate chips resting on a porcelain plate',
    aliases: ['matcha white chocolate cookie', 'matcha cookie', 'green tea white choc cookie'],
    estimatedNutrition: { calories: 320, protein: 4, carbs: 40, fat: 16, servingGrams: 90 },
  },
  {
    normalizedName: 'cinnamon sugar cronut',
    displayName: 'Cinnamon Sugar Cronut',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'New York Bakery Innovation',
    generalizedDescription:
      'Croissant-doughnut hybrid pastry fried until flaky, rolled in cinnamon sugar, and filled with vanilla pastry cream.',
    visualPrompt:
      'tall flaky deeply multi-layered circular fried laminated Cronut ring rolled sparkling evenly in warm cinnamon sugar and crowned neatly with glossy vanilla-sugar glaze ribbons and vanilla cream dollop',
    aliases: ['cinnamon sugar cronut', 'cronut', 'croissant donut filled'],
    estimatedNutrition: { calories: 470, protein: 6, carbs: 52, fat: 27, servingGrams: 130 },
  },
  {
    normalizedName: 'boston cream donut',
    displayName: 'Boston Cream Donut',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'American Bakery',
    generalizedDescription:
      'Yeast-raised round doughnut filled with vanilla custard and topped with a glossy dark chocolate glaze.',
    visualPrompt:
      'plump round golden pillowy yeast donut capped neatly with mirror-gloss dark chocolate fudge icing and sliced half gently revealing lush pale golden vanilla pastry cream center oozing slightly',
    aliases: ['boston cream donut', 'boston creme doughnut', 'chocolate custard donut'],
    estimatedNutrition: { calories: 360, protein: 6, carbs: 44, fat: 18, servingGrams: 115 },
  },
  {
    normalizedName: 'strawberry frosted ring donut',
    displayName: 'Strawberry Frosted Ring Donut',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Classic Bakery Café',
    generalizedDescription:
      'Fluffy fried ring doughnut dipped in sweet pink strawberry icing and rainbow sprinkles.',
    visualPrompt:
      'cheerful golden airy ring doughnut coated evenly atop with glossy pastel-pink smooth strawberry glaze frosting scattered festively with colorful matte rainbow sugar sprinkles on a cream plate',
    aliases: ['strawberry frosted ring donut', 'pink frosted donut', 'strawberry sprinkle donut'],
    estimatedNutrition: { calories: 310, protein: 4, carbs: 41, fat: 14, servingGrams: 95 },
  },
  {
    normalizedName: 'artisanal gelato pistachio',
    displayName: 'Artisanal Gelato – Pistachio',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Italian Gelateria',
    generalizedDescription:
      'Dense, low-air Italian frozen dessert churned with roasted Bronte-style pistachio paste.',
    visualPrompt:
      'chilled small footed silver-style coupe holding two lush sculpted ribbons of earthy natural muted sage-green Sicilian Bronte Pistachio Gelato sprinkled lightly with crunchy chopped green pistachios and crisp wafer biscuit',
    aliases: ['artisanal gelato pistachio', 'pistachio gelato', 'bronte pistachio ice cream'],
    estimatedNutrition: { calories: 290, protein: 6, carbs: 28, fat: 17, servingGrams: 140 },
  },
  {
    normalizedName: 'artisanal gelato stracciatella',
    displayName: 'Artisanal Gelato – Stracciatella',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Italian Gelateria',
    generalizedDescription:
      'Milk-based fior di latte gelato drizzled with melted dark chocolate that hardens and shatters into fine flakes during churning.',
    visualPrompt:
      'chilled ceramic gelateria cup heaped gracefully with dense snow-white fior di latte Stracciatella gelato richly ribboned and speckled throughout with irregular crisp dark chocolate shards and delicate cocoa curl',
    aliases: ['artisanal gelato stracciatella', 'stracciatella gelato', 'chocolate chip gelato'],
    estimatedNutrition: { calories: 280, protein: 5, carbs: 29, fat: 16, servingGrams: 140 },
  },
  {
    normalizedName: 'mango passionfruit sorbet',
    displayName: 'Mango Passionfruit Sorbet',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Gelateria',
    generalizedDescription:
      'Dairy-free, refreshing frozen fruit dessert churned from ripe mango and tangy passionfruit puree.',
    visualPrompt:
      'two vibrant silky bright saffron-tangerine icy-matte scoops of dairy-free Mango Passionfruit Sorbet inside a chilled crystal glass garnished cleanly with glossy golden passionfruit seeds and fresh crisp green mint sprig',
    aliases: ['mango passionfruit sorbet', 'mango sorbet', 'vegan mango passionfruit sorbet'],
    estimatedNutrition: { calories: 180, protein: 1, carbs: 44, fat: 0.5, servingGrams: 150 },
  },
  {
    normalizedName: 'raspberry dark chocolate sorbet',
    displayName: 'Raspberry Dark Chocolate Sorbet',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Intense, velvety vegan sorbet combining tart red raspberries or rich cocoa with sugar syrup.',
    visualPrompt:
      'dramatic duo of intense crimson-ruby Raspberry Sorbet and obsidian-velvet Dark Chocolate Sorbet quenelles seated side-by-side inside a chilled matte bowl accented with plump fresh red raspberries and dark cocoa crisp',
    aliases: ['raspberry dark chocolate sorbet', 'chocolate raspberry sorbet', 'dark chocolate vegan sorbet'],
    estimatedNutrition: { calories: 220, protein: 2, carbs: 46, fat: 4, servingGrams: 150 },
  },
  {
    normalizedName: 'classic banana split sundae',
    displayName: 'Classic Banana Split Sundae',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'American Soda Fountain',
    generalizedDescription:
      'Halved banana in a boat dish with scoops of vanilla, chocolate, and strawberry ice cream, sauces, nuts, and cherries.',
    visualPrompt:
      'classic oblong clear glass banana-split boat dish cradling split lengthwise caramelized-golden banana flanking scoops of vanilla, chocolate, and pink strawberry ice cream topped with whipped cream rosettes, hot fudge drizzle, chopped nuts, and bright maraschino cherries',
    aliases: ['classic banana split sundae', 'banana split', 'retro banana split sundae'],
    estimatedNutrition: { calories: 690, protein: 9, carbs: 94, fat: 32, servingGrams: 340 },
  },
  {
    normalizedName: 'death by chocolate sundae',
    displayName: 'Death by Chocolate Sundae',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Dessert Parlor Classic',
    generalizedDescription:
      'Tall sundae glass layered with chocolate cake, brownie chunks, chocolate ice cream, hot fudge, whipped cream, and wafers.',
    visualPrompt:
      'towering wide crystal parlor sundae glass packed richly in layers of fudgy brownie chunks, dark chocolate ice cream scoops, sponge cake crumble, molten hot chocolate fudge cascades, whipped cream cloud, roasted nuts, and crisp chocolate wafer cigar sticks',
    aliases: ['death by chocolate sundae', 'death by chocolate', 'dbc ice cream sundae'],
    estimatedNutrition: { calories: 790, protein: 11, carbs: 102, fat: 38, servingGrams: 350 },
  },
  {
    normalizedName: 'fried ice cream',
    displayName: 'Fried Ice Cream',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Contemporary Asian-Mexican Dessert',
    generalizedDescription:
      'Scoop of hard-frozen vanilla ice cream coated in a crunchy cornflake-cinnamon crust and flash-fried for a warm-cold contrast.',
    visualPrompt:
      'golden crunchy cinnamon-cornflake-crusted sphere of flash-fried ice cream sliced open on one side exposing pure snow-white frozen vanilla bean ice cream inside resting in whipped cream, golden caramel-honey ribbons, and cherry crown',
    aliases: ['fried ice cream', 'crispy cornflake fried ice cream', 'tempura ice cream'],
    estimatedNutrition: { calories: 440, protein: 6, carbs: 56, fat: 21, servingGrams: 185 },
  },
  {
    normalizedName: 'japanese mochi ice cream',
    displayName: 'Japanese Mochi Ice Cream',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Japanese Contemporary',
    generalizedDescription:
      'Bite-sized spheres of premium ice cream encased in a soft, chewy pounded sticky-rice dough (mochi) skin.',
    visualPrompt:
      'four delicate pastel powdery dusted Japanese Mochi Ice Cream globes (jade matcha green, strawberry blush pink, mango gold, black sesame gray) with one cut cleanly showing plump creamy ice cream core inside chewy translucent rice dough on a slate tray',
    aliases: ['japanese mochi ice cream', 'mochi ice cream', 'assorted ice cream mochi'],
    estimatedNutrition: { calories: 280, protein: 4, carbs: 46, fat: 9, servingGrams: 135 },
  },
  {
    normalizedName: 'thai mango sticky rice',
    displayName: 'Thai Mango Sticky Rice',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Thai Dessert',
    generalizedDescription:
      'Sweet glutinous rice steamed with thick coconut cream and served alongside ripe yellow mango slices and toasted sesame.',
    visualPrompt:
      'authentic vibrant Thai Mango Sticky Rice plated cleanly on a banana leaf lined stoneware dish showing glossy pearl coconut-cream sticky rice mound poured with creamy white coconut sauce beside fanned sun-bright golden Alphonso mango slices and toasted white sesame seeds',
    aliases: ['thai mango sticky rice', 'mango sticky rice', 'khao niao mamuang'],
    estimatedNutrition: { calories: 410, protein: 6, carbs: 72, fat: 12, servingGrams: 250 },
  },
  {
    normalizedName: 'fried banana fritters with honey',
    displayName: 'Fried Banana Fritters with Honey',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Asian-Fusion Dessert',
    generalizedDescription:
      'Batter-fried caramelized ripe banana slices drizzled with golden honey and served with vanilla ice cream.',
    visualPrompt:
      'four crispy deeply golden batter-fried banana halves gleaming softly under thick cascading golden honey drizzle and white toasted sesame seeds arranged neatly next to a scoop of creamy vanilla bean ice cream and mint sprig',
    aliases: ['fried banana fritters with honey', 'honey banana fritters', 'pisang goreng ice cream'],
    estimatedNutrition: { calories: 430, protein: 5, carbs: 66, fat: 16, servingGrams: 210 },
  },
  {
    normalizedName: 'date pancake darsaan',
    displayName: 'Date Pancake (Darsaan)',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Indo-Chinese Café Dessert',
    generalizedDescription:
      'Crispy fried wonton noodle strips tossed in warm honey and sesame seeds, served with a scoop of cold vanilla ice cream.',
    visualPrompt:
      'crunchy golden tangled honeycomb heap of glassy honey-glazed crisp fried flat wonton ribbons sprinkled heavily with toasted white sesame seeds crowned cleanly with a round cool scoop of vanilla bean ice cream on a white dessert plate',
    aliases: ['date pancake darsaan', 'darsaan', 'crispy honey noodles ice cream'],
    estimatedNutrition: { calories: 490, protein: 6, carbs: 68, fat: 22, servingGrams: 210 },
  },
  {
    normalizedName: 'paan ice cream',
    displayName: 'Paan Ice Cream',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'Indian Heritage Dessert',
    generalizedDescription:
      'Refreshing Indian digestif ice cream churned with betel leaves (meetha paan), gulkand (rose petal preserve), and fennel seeds.',
    visualPrompt:
      'two vibrant pastel pistachio-mint green scoops of creamy Indian Paan Ice Cream inside a brushed brass dessert bowl garnished cleanly with glossy sweet ruby gulkand rose petal jam, candied multicolored fennel saunf, and delicate shredded betel leaf confetti',
    aliases: ['paan ice cream', 'meetha paan ice cream', 'calcutta paan gelato'],
    estimatedNutrition: { calories: 290, protein: 5, carbs: 38, fat: 13, servingGrams: 150 },
  },
  {
    normalizedName: 'matka malai kulfi',
    displayName: 'Matka Malai Kulfi',
    category: 'Patisserie, Global Desserts & Frozen Treats',
    cuisine: 'North Indian Heritage',
    generalizedDescription:
      'Traditional no-churn dense milk ice cream set inside a small earthen clay pot, infused with cardamom, saffron, and nuts.',
    visualPrompt:
      'charming hand-thrown traditional terracotta clay matka pot brimming with rich creamy pale saffron-ivory slow-reduced Matka Malai Kulfi topped richly with crushed green pistachios, slivered almonds, crimson saffron strands, and dried rose petals',
    aliases: ['matka malai kulfi', 'matka kulfi', 'earthen pot malai kulfi'],
    estimatedNutrition: { calories: 330, protein: 8, carbs: 36, fat: 18, servingGrams: 160 },
  },
];

