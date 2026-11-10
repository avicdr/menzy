import type { CanonicalCatalogItem } from '../types';

export const TEAS_AND_DRINKS_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // II. Teas, Matcha & Hot Infusions (36-60)
  // =========================================================================
  {
    normalizedName: 'masala chai',
    displayName: 'Kadak Masala Chai',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Indian',
    generalizedDescription:
      'Black tea boiled with milk, crushed ginger, green cardamom, cloves, and cinnamon.',
    visualPrompt:
      'steaming Kadak Masala Chai poured in a rustic terracotta clay kulhad cup beside whole green cardamom pods, cinnamon bark, fresh ginger slices, and whole cloves on a sandstone coaster',
    aliases: ['masala chai', 'kadak masala chai', 'karak chai', 'indian spiced tea', 'cutting chai', 'spiced milk tea'],
    estimatedNutrition: { calories: 130, protein: 4, carbs: 16, fat: 5, servingGrams: 200 },
  },
  {
    normalizedName: 'edible cup masala tea',
    displayName: 'Edible Cup Masala Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Indian Café Innovation',
    generalizedDescription:
      'Hot spiced milk tea served inside a crunchy, edible biscuit wafer cup.',
    visualPrompt:
      'rich creamy spiced masala chai served inside a crisp toasted textured waffle-biscuit edible wafer cup on a ceramic plate with whole cardamom spices nearby',
    aliases: ['edible cup masala tea', 'biscuit cup chai', 'edible cup chai', 'wafer cup masala chai'],
    estimatedNutrition: { calories: 210, protein: 5, carbs: 30, fat: 7, servingGrams: 210 },
  },
  {
    normalizedName: 'english breakfast tea',
    displayName: 'English Breakfast Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'British / Classic Café',
    generalizedDescription:
      'Robust, full-bodied black tea served hot with milk and sugar on the side.',
    visualPrompt:
      'a classic ceramic porcelain teacup of amber English Breakfast Tea next to a matching teapot, tiny ceramic milk pitcher, and sugar cubes on a clean cafe saucer',
    aliases: ['english breakfast tea', 'english breakfast', 'assam breakfast tea', 'classic black tea'],
    estimatedNutrition: { calories: 30, protein: 1, carbs: 4, fat: 1, servingGrams: 250 },
  },
  {
    normalizedName: 'earl grey tea',
    displayName: 'Earl Grey Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'British / Classic Café',
    generalizedDescription:
      'Fragrant black tea infused with citrusy bergamot oil.',
    visualPrompt:
      'translucent burnished copper-amber Earl Grey Tea in a clear glass teacup with subtle blue cornflower petals floating in the pot and a fresh bergamot lemon twist on the saucer',
    aliases: ['earl grey tea', 'earl grey', 'bergamot black tea'],
    estimatedNutrition: { calories: 5, protein: 0, carbs: 1, fat: 0, servingGrams: 240 },
  },
  {
    normalizedName: 'darjeeling first flush',
    displayName: 'Darjeeling First Flush',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Indian / Specialty Tea',
    generalizedDescription:
      'Delicate, floral loose-leaf black tea brewed without milk.',
    visualPrompt:
      'a glass teapot and matching clear tasting cup filled with pale champagne-gold Darjeeling First Flush tea alongside delicate steeped loose tea leaves',
    aliases: ['darjeeling first flush', 'darjeeling tea', 'first flush black tea'],
    estimatedNutrition: { calories: 2, protein: 0, carbs: 0.5, fat: 0, servingGrams: 240 },
  },
  {
    normalizedName: 'chamomile herbal tea',
    displayName: 'Chamomile Herbal Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Herbal Tisane',
    generalizedDescription:
      'Caffeine-free infusion of dried chamomile flowers with soothing apple-like notes.',
    visualPrompt:
      'sunlit golden Chamomile Herbal Tea in a clear double-walled glass teacup containing gentle whole yellow-and-white chamomile blossoms and a small honey dipper nearby',
    aliases: ['chamomile herbal tea', 'chamomile tea', 'calming chamomile', 'caffeine free chamomile'],
    estimatedNutrition: { calories: 5, protein: 0, carbs: 1, fat: 0, servingGrams: 240 },
  },
  {
    normalizedName: 'moroccan mint green tea',
    displayName: 'Moroccan Mint Green Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'North African / Café',
    generalizedDescription:
      'Green gunpowder tea brewed with fresh spearmint leaves and sugar.',
    visualPrompt:
      'sparkling pale olive-gold Moroccan Mint Green Tea inside an ornate faceted clear tea glass packed with crisp fresh emerald spearmint sprigs on a brushed brass tray',
    aliases: ['moroccan mint green tea', 'moroccan mint tea', 'spearmint green tea', 'kahwa mint tea'],
    estimatedNutrition: { calories: 45, protein: 0, carbs: 11, fat: 0, servingGrams: 240 },
  },
  {
    normalizedName: 'lemongrass ginger tea',
    displayName: 'Lemongrass & Ginger Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Asian Herbal Infusion',
    generalizedDescription:
      'Invigorating herbal tisane brewed with fresh lemongrass stalks and ginger root.',
    visualPrompt:
      'aromatic pale amber Lemongrass & Ginger Tea in a clear ceramic-rimmed mug showing fresh trimmed lemongrass stalks and golden ginger slices steeping softly',
    aliases: ['lemongrass ginger tea', 'lemongrass and ginger tea', 'ginger lemongrass infusion'],
    estimatedNutrition: { calories: 15, protein: 0, carbs: 3, fat: 0, servingGrams: 240 },
  },
  {
    normalizedName: 'butterfly blue pea tea',
    displayName: 'Butterfly Blue Pea Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Botanical Herbal Tea',
    generalizedDescription:
      'Vibrant cobalt-blue herbal tea made from Clitoria ternatea flowers that turns purple with lemon.',
    visualPrompt:
      'vivid jewel cobalt-blue Butterfly Blue Pea Tea in a clear glass teapot and cup showing a gradient shift to violet-magenta beside dried blue pea blossoms and a fresh lemon wedge',
    aliases: ['butterfly blue pea tea', 'blue pea flower tea', 'blue tea', 'aparajita tea'],
    estimatedNutrition: { calories: 10, protein: 0, carbs: 2, fat: 0, servingGrams: 250 },
  },
  {
    normalizedName: 'hibiscus berry iced tea',
    displayName: 'Hibiscus Berry Iced Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Contemporary Tea Bar',
    generalizedDescription:
      'Tart, ruby-red herbal infusion served chilled with berries and mint.',
    visualPrompt:
      'a luminous crimson ruby-red Hibiscus Berry Iced Tea over sparkling ice cubes inside a tall glass cup garnished with raspberries, blueberries, dried hibiscus petals, and a mint sprig',
    aliases: ['hibiscus berry iced tea', 'hibiscus iced tea', 'berry hibiscus cooler'],
    estimatedNutrition: { calories: 70, protein: 0.2, carbs: 17, fat: 0, servingGrams: 340 },
  },
  {
    normalizedName: 'sea buckthorn zen tea',
    displayName: 'Sea Buckthorn Zen Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Himalayan Botanical',
    generalizedDescription:
      'Tangy, antioxidant-rich herbal tea made from Himalayan sea buckthorn berries.',
    visualPrompt:
      'glowing tangerine-amber Sea Buckthorn Zen Tea inside a stoneware-glazed ceramic cup accompanied by bright orange sea buckthorn berries and a green tea leaf accent',
    aliases: ['sea buckthorn zen tea', 'sea buckthorn tea', 'himalayan berry tea'],
    estimatedNutrition: { calories: 40, protein: 0.3, carbs: 9, fat: 0.2, servingGrams: 240 },
  },
  {
    normalizedName: 'rose petal cooling tea',
    displayName: 'Rose Petal Cooling Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Floral Botanical Café',
    generalizedDescription:
      'Fragrant chilled tea infused with dried organic rose petals and honey.',
    visualPrompt:
      'blush-pink crystal-clear Rose Petal Cooling Tea over clear ice in a highball glass accented with velvety crimson dried rosebuds and floating pink rose petals',
    aliases: ['rose petal cooling tea', 'rose iced tea', 'gulab cooling tea'],
    estimatedNutrition: { calories: 60, protein: 0.1, carbs: 15, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'classic hot matcha latte',
    displayName: 'Classic Hot Matcha Latte',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Japanese / Contemporary Café',
    generalizedDescription:
      'Ceremonial-grade green tea powder whisked with hot water and steamed milk.',
    visualPrompt:
      'velvety jade-emerald Classic Hot Matcha Latte inside a warm speckled ceramic bowl cup topped with crisp rosetta steamed-milk pour art and light matcha dust',
    aliases: ['classic hot matcha latte', 'hot matcha latte', 'matcha latte', 'hot matcha'],
    estimatedNutrition: { calories: 165, protein: 7, carbs: 17, fat: 6, servingGrams: 260 },
  },
  {
    normalizedName: 'iced matcha latte',
    displayName: 'Iced Matcha Latte',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Japanese / Contemporary Café',
    generalizedDescription:
      'Whisked green tea poured over chilled milk and ice cubes.',
    visualPrompt:
      'a vibrant layered Iced Matcha Latte in a clear tall glass showing creamy white milk marbled cleanly with lush ceremonial emerald matcha over crystal ice cubes',
    aliases: ['iced matcha latte', 'iced matcha', 'ceremonial iced matcha'],
    estimatedNutrition: { calories: 160, protein: 7, carbs: 18, fat: 5, servingGrams: 320 },
  },
  {
    normalizedName: 'blueberry iced matcha latte',
    displayName: 'Blueberry Iced Matcha Latte',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Japanese / Modern Café',
    generalizedDescription:
      'Layered drink with blueberry compote at the bottom, milk in the middle, and green matcha on top.',
    visualPrompt:
      'a tri-layered Blueberry Iced Matcha Latte in a crystal glass with deep violet-indigo blueberry jam at the bottom, silky white milk over ice in the middle, and vibrant emerald matcha green on top with fresh blueberries',
    aliases: ['blueberry iced matcha latte', 'blueberry matcha latte', 'iced blueberry matcha'],
    estimatedNutrition: { calories: 210, protein: 7, carbs: 30, fat: 5, servingGrams: 340 },
  },
  {
    normalizedName: 'strawberry iced matcha latte',
    displayName: 'Strawberry Iced Matcha Latte',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Japanese / Modern Café',
    generalizedDescription:
      'Fresh strawberry puree layered with cold milk and ceremonial matcha.',
    visualPrompt:
      'a tri-color Strawberry Iced Matcha Latte in a tall glass showing rosy crushed strawberry puree at the base, chilled milk over clear ice cubes, and bright whisked green matcha poured cleanly over top',
    aliases: ['strawberry iced matcha latte', 'strawberry matcha latte', 'iced strawberry matcha'],
    estimatedNutrition: { calories: 205, protein: 7, carbs: 29, fat: 5, servingGrams: 340 },
  },
  {
    normalizedName: 'artisanal iced tea',
    displayName: 'Peach Iced Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Chilled black tea sweetened with ripe peach puree and garnished with peach slices.',
    visualPrompt:
      'amber jewel-toned Peach Iced Tea in a tall crystal glass over clear ice cubes garnished with golden peach wedges and crisp green mint sprigs',
    aliases: ['artisanal iced tea', 'peach iced tea', 'iced tea', 'chilled peach tea'],
    estimatedNutrition: { calories: 90, protein: 0.2, carbs: 22, fat: 0, servingGrams: 350 },
  },
  {
    normalizedName: 'lemon mint iced tea',
    displayName: 'Lemon Mint Iced Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Crisp iced black tea muddled with fresh lemon juice and mint leaves.',
    visualPrompt:
      'golden-amber Lemon Mint Iced Tea in a tall highball glass packed with ice cubes, bright yellow lemon slices, and verdant fresh mint leaves',
    aliases: ['lemon mint iced tea', 'lemon iced tea', 'mint iced tea', 'classic lemon tea'],
    estimatedNutrition: { calories: 85, protein: 0.2, carbs: 21, fat: 0, servingGrams: 350 },
  },
  {
    normalizedName: 'hot chocolate',
    displayName: 'Classic Hot Chocolate',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Steamed milk blended with dark cocoa powder and topped with whipped cream.',
    visualPrompt:
      'a cozy ceramic mug of Classic Hot Chocolate crowned generously with swirled whipped cream and fine dark chocolate cocoa dust',
    aliases: ['hot chocolate', 'classic hot chocolate', 'hot cocoa', 'chocolate milk hot'],
    estimatedNutrition: { calories: 250, protein: 8, carbs: 30, fat: 11, servingGrams: 260 },
  },
  {
    normalizedName: 'belgian dark hot chocolate',
    displayName: 'Belgian Dark Hot Chocolate',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Belgian Patisserie',
    generalizedDescription:
      'Thick, decadent European-style drinking chocolate made with melted 70% dark couverture.',
    visualPrompt:
      'ultra-thick glossy 70% Belgian Dark Hot Chocolate in a warm ceramic cup beside delicate square shards of dark couverture chocolate and a cocoa spoon',
    aliases: ['belgian dark hot chocolate', 'belgian hot chocolate', 'european hot chocolate', 'sipping chocolate'],
    estimatedNutrition: { calories: 330, protein: 7, carbs: 34, fat: 19, servingGrams: 220 },
  },
  {
    normalizedName: 'hazelnut hot chocolate',
    displayName: 'Hazelnut Hot Chocolate',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Contemporary Patisserie',
    generalizedDescription:
      'Rich hot cocoa infused with roasted hazelnut praline paste.',
    visualPrompt:
      'silky dark Hazelnut Hot Chocolate in an earthy ceramic mug topped with velvet microfoam, crushed caramelized hazelnut praline, and chocolate curls',
    aliases: ['hazelnut hot chocolate', 'nutella hot chocolate', 'praline hot cocoa'],
    estimatedNutrition: { calories: 320, protein: 8, carbs: 34, fat: 17, servingGrams: 260 },
  },
  {
    normalizedName: 'marshmallow hot cocoa',
    displayName: 'Marshmallow Hot Cocoa',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Classic Café',
    generalizedDescription:
      'Creamy hot chocolate topped with toasted mini marshmallows.',
    visualPrompt:
      'warm chocolate Marshmallow Hot Cocoa in a broad matte mug heaped with golden lightly torched mini marshmallows and a soft drizzle of fudge sauce',
    aliases: ['marshmallow hot cocoa', 'marshmallow hot chocolate', 'toasted marshmallow cocoa'],
    estimatedNutrition: { calories: 295, protein: 7, carbs: 42, fat: 11, servingGrams: 270 },
  },
  {
    normalizedName: 'classic boba bubble milk tea',
    displayName: 'Classic Boba (Bubble) Milk Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Taiwanese / Café',
    generalizedDescription:
      'Chilled black milk tea served with chewy brown-sugar tapioca pearls.',
    visualPrompt:
      'creamy caramel-beige Classic Boba Milk Tea inside a rounded clear cafe cup showing glossy black chewy tapioca boba pearls settled evenly at the bottom over crystal ice cubes and a wide matte boba straw',
    aliases: ['classic boba bubble milk tea', 'boba milk tea', 'bubble tea', 'brown sugar boba tea', 'taiwanese milk tea'],
    estimatedNutrition: { calories: 310, protein: 4, carbs: 58, fat: 7, servingGrams: 400 },
  },
  {
    normalizedName: 'taro bubble tea',
    displayName: 'Taro Bubble Tea',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Taiwanese / Café',
    generalizedDescription:
      'Creamy, pastel-purple sweet taro root drink served with chewy boba pearls.',
    visualPrompt:
      'pastel lavender-purple Taro Bubble Tea over ice cubes inside a wide rounded crystal cup packed at the bottom with glossy dark chewy tapioca boba pearls',
    aliases: ['taro bubble tea', 'taro boba tea', 'taro milk tea', 'purple bubble tea'],
    estimatedNutrition: { calories: 330, protein: 5, carbs: 60, fat: 8, servingGrams: 400 },
  },
  {
    normalizedName: 'kashmiri kahwa',
    displayName: 'Kashmiri Kahwa',
    category: 'Teas, Matcha & Hot Infusions',
    cuisine: 'Kashmiri / Indian',
    generalizedDescription:
      'Traditional green tea brewed with saffron strands, cinnamon bark, cardamom, and slivered almonds.',
    visualPrompt:
      'glowing golden saffron-infused Kashmiri Kahwa in an etched clear glass cup topped cleanly with crisp slivered blanched almonds, saffron filaments, and whole cardamom on a tray',
    aliases: ['kashmiri kahwa', 'kahwa tea', 'saffron almond kahwa'],
    estimatedNutrition: { calories: 65, protein: 2, carbs: 8, fat: 3, servingGrams: 220 },
  },

  // =========================================================================
  // III. Shakes, Smoothies, Juices & Mocktails (61-90)
  // =========================================================================
  {
    normalizedName: 'thick shake',
    displayName: 'Oreo Crumble Thick Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Vanilla ice cream blended with milk and Oreo cookies, topped with whipped cream.',
    visualPrompt:
      'a rich creamy Oreo Crumble Thick Shake in a tall glass rimmed with crushed dark sandwich cookie crumbs and topped with whipped cream and an Oreo cookie wedge',
    aliases: ['thick shake', 'oreo crumble thick shake', 'oreo shake', 'oreo thick shake', 'cookies and cream shake'],
    estimatedNutrition: { calories: 480, protein: 10, carbs: 62, fat: 21, servingGrams: 380 },
  },
  {
    normalizedName: 'ferrero rocher hazelnut shake',
    displayName: 'Ferrero Rocher Hazelnut Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Indulgent Dessert Bar',
    generalizedDescription:
      'Indulgent milkshake blended with chocolate-hazelnut Ferrero Rocher pralines.',
    visualPrompt:
      'a decadent Ferrero Rocher Hazelnut Shake in a tall faceted glass drizzled inside with hazelnut ganache, crowned with whipped cream, crushed toasted hazelnuts, and a whole nutty chocolate truffle sphere',
    aliases: ['ferrero rocher hazelnut shake', 'ferrero rocher shake', 'ferrero shake', 'hazelnut praline shake'],
    estimatedNutrition: { calories: 560, protein: 11, carbs: 58, fat: 31, servingGrams: 390 },
  },
  {
    normalizedName: 'lotus biscoff shake',
    displayName: 'Lotus Biscoff Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Contemporary Dessert Bar',
    generalizedDescription:
      'Creamy milkshake blended with caramelized Biscoff spread and topped with crushed speculoos biscuits.',
    visualPrompt:
      'caramel-beige Lotus Biscoff Shake inside a tall glass streaked with golden caramelized spread, whipped cream swirl, speculoos crumbs, and a crisp whole rectangular caramelized biscuit',
    aliases: ['lotus biscoff shake', 'biscoff shake', 'speculoos milkshake', 'biscoff thick shake'],
    estimatedNutrition: { calories: 540, protein: 9, carbs: 66, fat: 26, servingGrams: 390 },
  },
  {
    normalizedName: 'belgian chocolate brownie shake',
    displayName: 'Belgian Chocolate Brownie Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Dessert Bar',
    generalizedDescription:
      'Thick chocolate shake blended with chunks of fudgy chocolate brownie.',
    visualPrompt:
      'deep dark Belgian Chocolate Brownie Shake in a tall cafe glass crowned with chocolate whipped cream, fudgy brownie cubes, and thick dark fudge drizzle',
    aliases: ['belgian chocolate brownie shake', 'brownie shake', 'chocolate brownie thick shake', 'fudge brownie shake'],
    estimatedNutrition: { calories: 580, protein: 11, carbs: 68, fat: 29, servingGrams: 400 },
  },
  {
    normalizedName: 'kitkat crunch shake',
    displayName: 'KitKat Crunch Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Contemporary Dessert Bar',
    generalizedDescription:
      'Milkshake blended with crispy chocolate-coated wafer fingers.',
    visualPrompt:
      'chocolate-caramel KitKat Crunch Shake in a tall clear glass topped with pillowy cream, crunchy chocolate wafer crumbles, and two whole crisp chocolate wafer fingers tucked beside the rim',
    aliases: ['kitkat crunch shake', 'kitkat shake', 'kit kat milkshake', 'chocolate wafer shake'],
    estimatedNutrition: { calories: 510, protein: 10, carbs: 64, fat: 23, servingGrams: 380 },
  },
  {
    normalizedName: 'fresh strawberry milkshake',
    displayName: 'Fresh Strawberry Milkshake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Classic Café',
    generalizedDescription:
      'Sweet pink milkshake blended with fresh strawberries and vanilla ice cream.',
    visualPrompt:
      'blush rose-pink Fresh Strawberry Milkshake inside a tall fluted diner glass crowned with whipped cream, fresh halved glossy red strawberries, and delicate strawberry compote swirl',
    aliases: ['fresh strawberry milkshake', 'strawberry milkshake', 'strawberry thick shake', 'berry milkshake'],
    estimatedNutrition: { calories: 390, protein: 8, carbs: 54, fat: 15, servingGrams: 360 },
  },
  {
    normalizedName: 'caramel banana shake',
    displayName: 'Caramel Banana Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Classic Café',
    generalizedDescription:
      'Creamy blended drink made with ripe bananas, milk, and salted caramel sauce.',
    visualPrompt:
      'creamy ivory-gold Caramel Banana Shake inside a tall glass layered with salted amber caramel ribbons inside the glass and crowned with banana coins and caramel drizzle',
    aliases: ['caramel banana shake', 'salted caramel banana shake', 'banana caramel milkshake'],
    estimatedNutrition: { calories: 410, protein: 9, carbs: 64, fat: 13, servingGrams: 360 },
  },
  {
    normalizedName: 'chia seed cold coffee',
    displayName: 'Chia Seed Cold Coffee',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Healthy Contemporary Café',
    generalizedDescription:
      'Protein-rich iced coffee blended with soaked chia seeds and almond or dairy milk.',
    visualPrompt:
      'chilled light-roast Chia Seed Cold Coffee inside a clear mason tumbler showing hydrated black chia seeds suspended neatly in creamy almond-coffee milk over ice',
    aliases: ['chia seed cold coffee', 'chia cold brew shake', 'iced chia coffee'],
    estimatedNutrition: { calories: 185, protein: 6, carbs: 19, fat: 9, servingGrams: 340 },
  },
  {
    normalizedName: 'mixed berry smoothie',
    displayName: 'Mixed Berry Smoothie',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Smoothie Bar',
    generalizedDescription:
      'Thick blend of blueberries, raspberries, strawberries, and Greek yogurt.',
    visualPrompt:
      'rich deep magenta-violet Mixed Berry Smoothie inside a flared glass garnished cleanly with fresh blueberries, blackberries, a strawberry, and a small mint leaf',
    aliases: ['mixed berry smoothie', 'berry yogurt smoothie', 'triple berry smoothie'],
    estimatedNutrition: { calories: 250, protein: 11, carbs: 42, fat: 4, servingGrams: 340 },
  },
  {
    normalizedName: 'mango passionfruit smoothie',
    displayName: 'Mango Passionfruit Smoothie',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Tropical Smoothie Bar',
    generalizedDescription:
      'Tropical blend of Alphonso mango puree, passionfruit, and yogurt.',
    visualPrompt:
      'vibrant sunlit marigold-orange Mango Passionfruit Smoothie inside a clear tumbler crowned with glossy passionfruit pulp seeds and a carved fresh mango wedge',
    aliases: ['mango passionfruit smoothie', 'alphonso mango smoothie', 'mango yogurt smoothie'],
    estimatedNutrition: { calories: 270, protein: 8, carbs: 52, fat: 3.5, servingGrams: 350 },
  },
  {
    normalizedName: 'avocado spinach green smoothie',
    displayName: 'Avocado Spinach Green Smoothie',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Wellness Café',
    generalizedDescription:
      'Nutrient-dense blend of creamy avocado, baby spinach, banana, and coconut water.',
    visualPrompt:
      'silky pastel pistachio-green Avocado Spinach Green Smoothie in a clear tumbler accented with hemp hearts, a thin slice of green avocado, and fresh baby spinach leaf beside it',
    aliases: ['avocado spinach green smoothie', 'green detox smoothie', 'avocado green smoothie'],
    estimatedNutrition: { calories: 260, protein: 5, carbs: 31, fat: 14, servingGrams: 350 },
  },
  {
    normalizedName: 'smoothie bowl',
    displayName: 'Acai Berry Smoothie Bowl',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Contemporary Wellness Café',
    generalizedDescription:
      'Thick purple acai puree bowl topped with homemade granola, chia seeds, and sliced kiwi.',
    visualPrompt:
      'deep violet Acai Berry Smoothie Bowl in a stoneware bowl neatly arranged in rows with sliced bright green kiwi, fresh blueberries, toasted golden granola clusters, and chia seeds',
    aliases: ['smoothie bowl', 'acai berry smoothie bowl', 'acai bowl', 'berry smoothie bowl', 'acai smoothie bowl'],
    estimatedNutrition: { calories: 340, protein: 9, carbs: 56, fat: 9, servingGrams: 340 },
  },
  {
    normalizedName: 'tropical mango smoothie bowl',
    displayName: 'Tropical Mango Smoothie Bowl',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Contemporary Wellness Café',
    generalizedDescription:
      'Blended mango and coconut base topped with toasted coconut flakes, almonds, and berries.',
    visualPrompt:
      'thick bright saffron-gold Tropical Mango Smoothie Bowl served in a handcrafted ceramic bowl neatly garnished with crisp toasted coconut ribbons, sliced almonds, strawberries, and raspberries',
    aliases: ['tropical mango smoothie bowl', 'mango smoothie bowl', 'mango coconut bowl'],
    estimatedNutrition: { calories: 360, protein: 8, carbs: 58, fat: 11, servingGrams: 350 },
  },
  {
    normalizedName: 'virgin mojito',
    displayName: 'Classic Virgin Mojito',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Mocktail Bar',
    generalizedDescription:
      'Muddled lime wedges, fresh mint leaves, and sugar topped with crushed ice and club soda.',
    visualPrompt:
      'a sparkling Classic Virgin Mojito in a highball glass packed with crushed clear ice, muddled green lime wedges, vibrant mint leaves, and crisp effervescent soda bubbles',
    aliases: ['virgin mojito', 'classic virgin mojito', 'mojito', 'mint mojito', 'lime mint mojito'],
    estimatedNutrition: { calories: 110, protein: 0.2, carbs: 27, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'watermelon mint mojito',
    displayName: 'Watermelon Mint Mojito',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Mocktail Bar',
    generalizedDescription:
      'Fresh watermelon chunks muddled with mint, lime, and sparkling soda.',
    visualPrompt:
      'bright coral-red Watermelon Mint Mojito inside a highball glass over crushed ice with muddled fresh watermelon cubes, crisp green mint leaves, lime wheels, and sparkling fizz bubbles',
    aliases: ['watermelon mint mojito', 'watermelon mojito', 'fresh watermelon cooler'],
    estimatedNutrition: { calories: 120, protein: 0.5, carbs: 29, fat: 0, servingGrams: 340 },
  },
  {
    normalizedName: 'green apple mojito',
    displayName: 'Green Apple Mojito',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Mocktail Bar',
    generalizedDescription:
      'Tart green apple syrup muddled with lime, mint leaves, and fizzy soda.',
    visualPrompt:
      'vivid emerald-chartreuse Green Apple Mojito inside a crystal glass packed with ice cubes, crisp thin Granny Smith green apple fan slices, lime wedges, and fresh mint leaves',
    aliases: ['green apple mojito', 'apple mint mojito', 'green apple fizz'],
    estimatedNutrition: { calories: 125, protein: 0.2, carbs: 31, fat: 0, servingGrams: 330 },
  },
  {
    normalizedName: 'fruit soda cooler',
    displayName: 'Guava Chilli Soda',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Indian Fusion Mocktail Bar',
    generalizedDescription:
      'Pink guava nectar mixed with club soda and rimmed with spicy red chili salt.',
    visualPrompt:
      'a glowing ruby-pink Guava Chilli Soda mocktail in a clear glass over ice cubes with a fiery red chili-salt rim, crisp lime wheel, and mint garnish',
    aliases: [
      'fruit soda cooler',
      'guava chilli soda',
      'guava chili cooler',
      'guava chilli cooler',
      'chili guava cooler',
      'chili guava soda',
      'spicy pink guava cooler',
    ],
    estimatedNutrition: { calories: 120, protein: 0.4, carbs: 29, fat: 0, servingGrams: 330 },
  },
  {
    normalizedName: 'blue lagoon cooler',
    displayName: 'Blue Lagoon Cooler',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Mocktail Bar',
    generalizedDescription:
      'Citrusy mocktail made with blue curacao syrup, lemon juice, and Lemon-Lime soda.',
    visualPrompt:
      'brilliant turquoise electric-blue Blue Lagoon Cooler inside a stemmed hurricane glass packed with crushed clear ice, a sugar-dusted yellow lemon wheel, and maraschino cherry accent',
    aliases: ['blue lagoon cooler', 'blue lagoon', 'blue curacao mocktail', 'blue lagoon mocktail'],
    estimatedNutrition: { calories: 135, protein: 0, carbs: 34, fat: 0, servingGrams: 340 },
  },
  {
    normalizedName: 'cranberry ginger fizz',
    displayName: 'Cranberry Ginger Fizz',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Mocktail Bar',
    generalizedDescription:
      'Tart cranberry juice topped with spicy ginger ale and a lime wheel.',
    visualPrompt:
      'jewel garnet-crimson Cranberry Ginger Fizz in a highball glass over clear ice cubes with effervescent ginger bubbles, a crisp lime wheel, whole red cranberries, and rosemary sprig',
    aliases: ['cranberry ginger fizz', 'cranberry ginger ale mocktail', 'cranberry fizz'],
    estimatedNutrition: { calories: 115, protein: 0.2, carbs: 28, fat: 0, servingGrams: 320 },
  },
  {
    normalizedName: 'kala khatta slush',
    displayName: 'Kala Khatta Slush',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Indian Street Mocktail',
    generalizedDescription:
      'Tangy, spiced blackberry-flavored shaved ice refresher with black salt and cumin.',
    visualPrompt:
      'deep plum-violet crushed-ice Kala Khatta Slush inside a clear rock glass rimmed with warm roasted-cumin rock salt, topped with a fresh green lime wedge and ice crystals',
    aliases: ['kala khatta slush', 'kala khatta', 'kala khatta cooler', 'jamun kala khatta'],
    estimatedNutrition: { calories: 130, protein: 0.3, carbs: 32, fat: 0, servingGrams: 300 },
  },
  {
    normalizedName: 'cold-pressed orange juice',
    displayName: 'Cold-Pressed Orange Juice',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Juice Bar',
    generalizedDescription:
      '100% pure, unpasteurized juice pressed from fresh Valencia oranges.',
    visualPrompt:
      'bright sunny tangerine Cold-Pressed Orange Juice in a minimalist clean cylindrical glass resting beside fresh halved Valencia oranges',
    aliases: ['cold-pressed orange juice', 'fresh orange juice', 'orange juice', 'valencia orange juice'],
    estimatedNutrition: { calories: 140, protein: 2, carbs: 33, fat: 0.3, servingGrams: 300 },
  },
  {
    normalizedName: 'watermelon mint cold-pressed juice',
    displayName: 'Watermelon Mint Cold-Pressed Juice',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Juice Bar',
    generalizedDescription:
      'Hydrating fresh-pressed watermelon juice infused with a hint of mint.',
    visualPrompt:
      'vibrant crimson Watermelon Mint Cold-Pressed Juice in a clear carafe-style glass garnished cleanly with fresh bright-green mint leaves and small triangle slice of sweet watermelon',
    aliases: ['watermelon mint cold-pressed juice', 'watermelon juice', 'fresh watermelon mint juice'],
    estimatedNutrition: { calories: 95, protein: 1.5, carbs: 22, fat: 0.2, servingGrams: 300 },
  },
  {
    normalizedName: 'pineapple ginger detox juice',
    displayName: 'Pineapple Ginger Detox Juice',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Juice Bar / Wellness',
    generalizedDescription:
      'Freshly pressed pineapple juice spiked with raw ginger and turmeric.',
    visualPrompt:
      'sunny golden-saffron Pineapple Ginger Detox Juice inside a minimalist crystal tumbler with natural gentle foam froth next to fresh pineapple chunks and sliced ginger root',
    aliases: ['pineapple ginger detox juice', 'pineapple ginger juice', 'turmeric pineapple detox'],
    estimatedNutrition: { calories: 135, protein: 1, carbs: 32, fat: 0.2, servingGrams: 300 },
  },
  {
    normalizedName: 'abc apple beetroot carrot glow juice',
    displayName: 'ABC (Apple, Beetroot, Carrot) Glow Juice',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Juice Bar / Wellness',
    generalizedDescription:
      'Earthy, vitamin-rich cold-pressed juice blend of apple, beet, and carrot.',
    visualPrompt:
      'deep velvet crimson-ruby ABC Apple Beetroot Carrot Juice inside a clear cylindrical glass alongside subtle clean slices of red apple, golden carrot, and ruby beetroot',
    aliases: ['abc apple beetroot carrot glow juice', 'abc juice', 'abc glow juice', 'apple beet carrot juice'],
    estimatedNutrition: { calories: 130, protein: 2, carbs: 30, fat: 0.2, servingGrams: 300 },
  },
  {
    normalizedName: 'pomegranate citrus refresher',
    displayName: 'Pomegranate Citrus Refresher',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Juice Bar',
    generalizedDescription:
      'Freshly extracted ruby pomegranate juice mixed with sweet lime.',
    visualPrompt:
      'glowing garnet Pomegranate Citrus Refresher over ice in a flared tumbler glass floating ruby pomegranate jewel arils and a crisp pale green sweet-lime wedge',
    aliases: ['pomegranate citrus refresher', 'fresh pomegranate juice', 'anar mosambi juice'],
    estimatedNutrition: { calories: 145, protein: 1.5, carbs: 35, fat: 0.3, servingGrams: 310 },
  },
  {
    normalizedName: 'peach palmer',
    displayName: 'Peach Palmer',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Contemporary Café',
    generalizedDescription:
      'Half iced black tea and half fresh peach lemonade served over ice.',
    visualPrompt:
      'ombre amber-to-golden Peach Palmer in a tall clear glass showing iced black tea layered over pale peach lemonade with ice cubes, lemon wheel, and peach slice',
    aliases: ['peach palmer', 'arnold palmer peach', 'peach lemonade iced tea'],
    estimatedNutrition: { calories: 110, protein: 0.3, carbs: 27, fat: 0, servingGrams: 340 },
  },
  {
    normalizedName: 'cucumber elderflower cooler',
    displayName: 'Cucumber Elderflower Cooler',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Botanical Mocktail Bar',
    generalizedDescription:
      'Crisp cucumber ribbons muddled with floral elderflower cordial and tonic water.',
    visualPrompt:
      'crystalline pale celadon-green Cucumber Elderflower Cooler in a stemmed spritz glass curled inside with fresh green cucumber ribbons, fine sparkling bubbles, and delicate white elderflower garnish',
    aliases: ['cucumber elderflower cooler', 'elderflower cucumber spritz', 'cucumber tonic mocktail'],
    estimatedNutrition: { calories: 85, protein: 0.2, carbs: 21, fat: 0, servingGrams: 310 },
  },
  {
    normalizedName: 'spiced jamun cooler',
    displayName: 'Spiced Jamun Cooler',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Indian Craft Mocktail',
    generalizedDescription:
      'Summer mocktail made from mashed Indian black plum pulp, black salt, and soda.',
    visualPrompt:
      'luminous deep indigo-purple Spiced Jamun Cooler in a clear rock glass over ice cubes with a spicy black-salt rim, fresh purple jamun berries, and a crisp mint leaf',
    aliases: ['spiced jamun cooler', 'jamun cooler', 'jamun soda', 'jamun shots cooler'],
    estimatedNutrition: { calories: 105, protein: 0.6, carbs: 25, fat: 0, servingGrams: 310 },
  },
  {
    normalizedName: 'peanut butter banana protein shake',
    displayName: 'Peanut Butter Banana Protein Shake',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Fitness / Wellness Café',
    generalizedDescription:
      'Post-workout shake with whey protein, natural peanut butter, banana, and oats.',
    visualPrompt:
      'thick velvety warm-tan Peanut Butter Banana Protein Shake inside a clear minimalist glass topped with rolled oats, sliced banana rounds, and a ribbon of creamy peanut butter',
    aliases: ['peanut butter banana protein shake', 'protein shake', 'peanut butter protein smoothie'],
    estimatedNutrition: { calories: 420, protein: 29, carbs: 42, fat: 15, servingGrams: 380 },
  },
  {
    normalizedName: 'awadhi thandai milk',
    displayName: 'Awadhi Thandai Milk',
    category: 'Shakes, Smoothies, Juices & Mocktails',
    cuisine: 'Awadhi / Indian',
    generalizedDescription:
      'Chilled milk infused with almonds, fennel seeds, watermelon kernels, rose petals, and saffron.',
    visualPrompt:
      'creamy pale saffron-gold Awadhi Thandai Milk inside a hammered brass-lined matka glass cup garnished cleanly with crushed green pistachios, crimson dried rose petals, and bright saffron strands',
    aliases: ['awadhi thandai milk', 'kesar thandai', 'thandai', 'badam thandai'],
    estimatedNutrition: { calories: 290, protein: 9, carbs: 32, fat: 14, servingGrams: 300 },
  },
];
