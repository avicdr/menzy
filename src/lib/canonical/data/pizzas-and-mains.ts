import type { CanonicalCatalogItem } from '../types';

export const PIZZAS_AND_MAINS_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // VIII. Pizzas & Pastas (211-240 + truffle mushroom pasta)
  // =========================================================================
  {
    normalizedName: 'thin-crust wood-fired pizza',
    displayName: 'Classic Margherita Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Thin-crust pizza topped with San Marzano tomato sauce, fresh mozzarella, and sweet basil leaves.',
    visualPrompt:
      'artisanal whole Thin-Crust Classic Margherita Pizza with blistered wood-fired leopard-spotted crust, tangy San Marzano tomato sauce, melted buffalo mozzarella islands, and fresh basil leaves',
    aliases: ['thin-crust wood-fired pizza', 'classic margherita pizza', 'margherita pizza', 'wood-fired pizza', 'neapolitan pizza'],
    estimatedNutrition: { calories: 680, protein: 26, carbs: 82, fat: 26, servingGrams: 360 },
  },
  {
    normalizedName: 'veggie supreme pizza',
    displayName: 'Veggie Supreme Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian Café',
    generalizedDescription:
      'Pizza topped with bell peppers, onions, sweet corn, black olives, and mushrooms.',
    visualPrompt:
      'wood-fired golden thin-crust Veggie Supreme Pizza covered generously with colorful red and yellow bell peppers, red onion rings, golden sweet corn kernels, sliced black olives, button mushrooms, and mozzarella over tomato sauce',
    aliases: ['veggie supreme pizza', 'farmhouse veg pizza', 'supreme vegetarian pizza'],
    estimatedNutrition: { calories: 720, protein: 27, carbs: 86, fat: 28, servingGrams: 390 },
  },
  {
    normalizedName: 'genovese pesto pizza',
    displayName: 'Genovese Pesto Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'White-base pizza spread with basil pesto, topped with cherry tomatoes, mozzarella, and pine nuts.',
    visualPrompt:
      'artisan thin-crust Genovese Pesto Pizza featuring vibrant green basil pesto swirls over melted white mozzarella, halved ruby roasted cherry tomatoes, and toasted golden pine nuts',
    aliases: ['genovese pesto pizza', 'pesto pizza', 'basil pesto pizza'],
    estimatedNutrition: { calories: 740, protein: 26, carbs: 74, fat: 37, servingGrams: 370 },
  },
  {
    normalizedName: 'spicy nawabi paneer pizza',
    displayName: 'Spicy Nawabi Paneer Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Indo-Italian Café Fusion',
    generalizedDescription:
      'Fusion pizza topped with marinated paneer tikka, onions, capsicum, and green chilies.',
    visualPrompt:
      'crisp wood-fired pizza generously loaded with char-spiced saffron-orange paneer tikka cubes, sliced red onions, green capsicum strips, slit spicy green chilies, mozzarella, and mint-chili swirl',
    aliases: ['spicy nawabi paneer pizza', 'paneer tikka pizza', 'tandoori paneer pizza'],
    estimatedNutrition: { calories: 790, protein: 34, carbs: 79, fat: 36, servingGrams: 400 },
  },
  {
    normalizedName: 'mushroom trio feta pizza',
    displayName: 'Mushroom Trio & Feta Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Gourmet Italian Bistro',
    generalizedDescription:
      'Gourmet wood-fired pizza topped with shiitake, button, and oyster mushrooms plus crumbled feta.',
    visualPrompt:
      'rustic charred thin-crust pizza covered cleanly with sautéed shiitake, cremini button, and golden oyster mushrooms alongside snowy crumbled Greek feta cheese, fresh thyme, and mozzarella',
    aliases: ['mushroom trio feta pizza', 'wild mushroom feta pizza', 'three mushroom pizza'],
    estimatedNutrition: { calories: 710, protein: 27, carbs: 76, fat: 32, servingGrams: 375 },
  },
  {
    normalizedName: 'grigio truffle mushroom pizza',
    displayName: 'Grigio Truffle Mushroom Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Gourmet Italian Bistro',
    generalizedDescription:
      'White-sauce pizza topped with mushroom duxelles, mozzarella, and truffle oil drizzle.',
    visualPrompt:
      'artisan white-base Neapolitan pizza spread cleanly with velvety earthy mushroom truffle cream duxelles, melted mozzarella, sliced cremini mushrooms, shaved parmesan, and subtle fresh parsley',
    aliases: ['grigio truffle mushroom pizza', 'truffle pizza', 'white truffle mushroom pizza'],
    estimatedNutrition: { calories: 760, protein: 26, carbs: 74, fat: 39, servingGrams: 370 },
  },
  {
    normalizedName: 'quattro formaggi four cheese pizza',
    displayName: 'Quattro Formaggi (Four Cheese) Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Artisanal pizza topped with a blend of mozzarella, gorgonzola, parmesan, and cheddar.',
    visualPrompt:
      'wood-fired thin-crust Italian Quattro Formaggi white pizza richly melted and blistered golden with distinct cheeses — mozzarella, creamy blue-veined gorgonzola pockets, sharp cheddar, and aged parmesan crackled with black pepper',
    aliases: ['quattro formaggi four cheese pizza', 'quattro formaggi pizza', 'four cheese pizza'],
    estimatedNutrition: { calories: 820, protein: 35, carbs: 74, fat: 42, servingGrams: 370 },
  },
  {
    normalizedName: 'piccante spicy pepperoni pizza',
    displayName: 'Piccante Spicy Pepperoni Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian-American',
    generalizedDescription:
      'Thin-crust pizza topped with spicy cured pepperoni slices, chili flakes, and mozzarella.',
    visualPrompt:
      'classic thin-crust wood-fired Piccante Pepperoni Pizza covered edge-to-edge with crisp cupped ruby red pepperoni rounds, bubbling melted golden mozzarella, red chili flakes, and basil leaf',
    aliases: ['piccante spicy pepperoni pizza', 'pepperoni pizza', 'spicy pepperoni pizza'],
    estimatedNutrition: { calories: 840, protein: 35, carbs: 76, fat: 43, servingGrams: 380 },
  },
  {
    normalizedName: 'smoked chicken tikka pizza',
    displayName: 'Smoked Chicken Tikka Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Indo-Italian Bistro',
    generalizedDescription:
      'Indian-Italian fusion pizza topped with smoky tandoori chicken chunks, red onion, and cilantro.',
    visualPrompt:
      'wood-fired golden pizza topped generously with juicy charred tandoori chicken tikka pieces, sweet crisp red onion rings, jalapenos, melted mozzarella, and fresh emerald cilantro leaves',
    aliases: ['smoked chicken tikka pizza', 'chicken tikka pizza', 'tandoori chicken pizza'],
    estimatedNutrition: { calories: 810, protein: 42, carbs: 78, fat: 35, servingGrams: 400 },
  },
  {
    normalizedName: 'bbq chicken caramelized onion pizza',
    displayName: 'BBQ Chicken & Caramelized Onion Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Contemporary Bistro',
    generalizedDescription:
      'Pizza topped with barbecue-glazed chicken, sweet caramelized onions, and mozzarella.',
    visualPrompt:
      'crisp artisan wood-fired pizza layered with mahogany smoky BBQ pulled chicken pieces, glossy jammy caramelized onion ribbons, bubbling mozzarella-cheddar blend, BBQ swirl, and fresh cilantro',
    aliases: ['bbq chicken caramelized onion pizza', 'bbq chicken pizza', 'barbecue chicken pizza'],
    estimatedNutrition: { calories: 820, protein: 40, carbs: 84, fat: 34, servingGrams: 400 },
  },
  {
    normalizedName: 'fresh burrata arugula pizza',
    displayName: 'Fresh Burrata & Arugula Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Contemporary Italian',
    generalizedDescription:
      'Wood-fired pizza finished post-bake with a whole ball of creamy fresh burrata and rocket leaves.',
    visualPrompt:
      'blistered Neapolitan San Marzano tomato pizza centered dramatically with a whole snow-white glistening ball of fresh creamy Burrata cheese surrounded by vibrant crisp green wild arugula rocket leaves and cherry tomatoes',
    aliases: ['fresh burrata arugula pizza', 'burrata pizza', 'burrata rocket pizza'],
    estimatedNutrition: { calories: 780, protein: 30, carbs: 78, fat: 38, servingGrams: 390 },
  },
  {
    normalizedName: 'dessert chocolate pizza',
    displayName: 'Dessert Chocolate Pizza',
    category: 'Pizzas & Pastas',
    cuisine: 'Contemporary Dessert Bar',
    generalizedDescription:
      'Sweet pizza dough topped with melted hazelnut chocolate spread, white chocolate chips, and marshmallows.',
    visualPrompt:
      'golden baked sweet flatbread Dessert Chocolate Pizza cut into wedges smothered richly with glossy dark Nutella hazelnut fudge, white chocolate morsels, toasted mini marshmallows, and fresh sliced strawberries',
    aliases: ['dessert chocolate pizza', 'nutella chocolate pizza', 'sweet chocolate pizza'],
    estimatedNutrition: { calories: 760, protein: 12, carbs: 102, fat: 34, servingGrams: 320 },
  },
  {
    normalizedName: 'aglio e olio pasta',
    displayName: 'Spaghetti Aglio e Olio',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Classic Neapolitan spaghetti tossed with golden garlic slices, extra-virgin olive oil, red chili flakes, and parsley.',
    visualPrompt:
      'glossy twirled nest of golden Spaghetti Aglio e Olio in a white ceramic pasta bowl featuring sautéed golden garlic chips, red chili flakes, flat-leaf parsley, and extra-virgin olive oil',
    aliases: ['aglio e olio pasta', 'spaghetti aglio e olio', 'aglio e olio', 'garlic chili oil pasta'],
    estimatedNutrition: { calories: 510, protein: 14, carbs: 66, fat: 21, servingGrams: 300 },
  },
  {
    normalizedName: 'arrabbiata pasta',
    displayName: 'Penne Arrabbiata (Red Sauce)',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Penne pasta tossed in a fiery garlic-infused crushed tomato sauce with fresh basil.',
    visualPrompt:
      'ribbed Penne Arrabbiata pasta coated evenly in vibrant fiery ruby crushed-tomato garlic-chili sauce topped with fresh green basil and shaved parmesan inside a stoneware bowl',
    aliases: ['arrabbiata pasta', 'penne arrabbiata', 'penne arrabbiata red sauce', 'red sauce pasta', 'spicy tomato pasta'],
    estimatedNutrition: { calories: 480, protein: 15, carbs: 72, fat: 14, servingGrams: 320 },
  },
  {
    normalizedName: 'alfredo pasta',
    displayName: 'Penne Alfredo (White Sauce)',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian / Contemporary Café',
    generalizedDescription:
      'Pasta coated in a velvety sauce of butter, heavy cream, garlic, and parmesan cheese.',
    visualPrompt:
      'silky Penne Alfredo coated luxuriously in thick ivory butter-cream parmesan sauce cracked with black pepper and herbs inside a deep ceramic pasta bowl',
    aliases: ['alfredo pasta', 'penne alfredo', 'penne alfredo white sauce', 'fettuccine alfredo'],
    estimatedNutrition: { calories: 640, protein: 18, carbs: 66, fat: 34, servingGrams: 330 },
  },
  {
    normalizedName: 'pink sauce pasta',
    displayName: 'Pink Sauce (Mama Rosa) Pasta',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian / Contemporary Café',
    generalizedDescription:
      'Penne or fusilli tossed in a balanced blend of tangy tomato marinara and rich creamy Alfredo.',
    visualPrompt:
      'creamy coral-rose Pink Sauce Mama Rosa penne pasta blending tomato marinara and rich Alfredo cream garnished with basil leaf and grated parmesan in a stoneware bowl',
    aliases: ['pink sauce pasta', 'pink sauce mama rosa pasta', 'pink sauce rosa pasta', 'rosa pasta', 'pink pasta'],
    estimatedNutrition: { calories: 560, protein: 16, carbs: 68, fat: 24, servingGrams: 320 },
  },
  {
    normalizedName: 'fettuccine in creamy pesto sauce',
    displayName: 'Fettuccine in Creamy Pesto Sauce',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'Flat ribbon pasta coated in a rich blend of basil-pine-nut pesto and heavy cream.',
    visualPrompt:
      'twirled silky ribbons of Fettuccine pasta bathed in pale pastel-emerald basil-pine-nut cream pesto sauce crowned with toasted golden pine nuts, parmesan flakes, and fresh basil leaf in a ceramic bowl',
    aliases: ['fettuccine in creamy pesto sauce', 'creamy pesto pasta', 'pesto fettuccine', 'basil pesto pasta'],
    estimatedNutrition: { calories: 650, protein: 17, carbs: 62, fat: 37, servingGrams: 320 },
  },
  {
    normalizedName: 'farfalle in wild mushroom sauce',
    displayName: 'Farfalle in Wild Mushroom Sauce',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'Bow-tie pasta tossed in an earthy, creamy porcini and button mushroom sauce.',
    visualPrompt:
      'plump bow-tie Farfalle pasta tossed neatly with golden sautéed button and porcini wild mushrooms coated in rich velvety cream sauce topped with fresh chopped thyme and parmesan',
    aliases: ['farfalle in wild mushroom sauce', 'mushroom farfalle', 'creamy wild mushroom bow tie pasta'],
    estimatedNutrition: { calories: 590, protein: 16, carbs: 64, fat: 29, servingGrams: 320 },
  },
  {
    normalizedName: 'burrata pasta in tomato basil sauce',
    displayName: 'Burrata Pasta in Tomato Basil Sauce',
    category: 'Pizzas & Pastas',
    cuisine: 'Contemporary Italian',
    generalizedDescription:
      'Rigatoni or penne in fresh tomato marinara crowned with creamy burrata cheese.',
    visualPrompt:
      'wide ceramic bowl of tubular rigatoni pasta coated glossy red in chunky sweet cherry-tomato basil marinara, topped right at the peak with a creamy whole snow-white Burrata cheese orb and basil leaf',
    aliases: ['burrata pasta in tomato basil sauce', 'burrata pasta', 'rigatoni burrata marinara'],
    estimatedNutrition: { calories: 640, protein: 22, carbs: 70, fat: 30, servingGrams: 350 },
  },
  {
    normalizedName: 'spaghetti chicken bolognese',
    displayName: 'Spaghetti Chicken Bolognese',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Spaghetti topped with a slow-simmered savory minced chicken and tomato herb ragù.',
    visualPrompt:
      'twirled nest of golden Spaghetti noodles crowned with hearty slow-braised deep crimson minced Chicken Bolognese ragù sauce, aged parmesan snow, and crisp green basil sprig in a stoneware bowl',
    aliases: ['spaghetti chicken bolognese', 'chicken bolognese', 'bolognese pasta chicken'],
    estimatedNutrition: { calories: 620, protein: 34, carbs: 68, fat: 22, servingGrams: 350 },
  },
  {
    normalizedName: 'chicken cacciatore pasta',
    displayName: 'Chicken Cacciatore Pasta',
    category: 'Pizzas & Pastas',
    cuisine: 'Rustic Italian',
    generalizedDescription:
      'Hunter-style pasta cooked with braised chicken, bell peppers, onions, herbs, and tomato sauce.',
    visualPrompt:
      'rustic ceramic bowl of penne pasta folded with tender braised herbed chicken pieces, sautéed red and yellow bell peppers, sweet onions, olives, and rich rustic tomato cacciatore sauce',
    aliases: ['chicken cacciatore pasta', 'cacciatore chicken pasta', 'hunter style chicken pasta'],
    estimatedNutrition: { calories: 610, protein: 33, carbs: 65, fat: 23, servingGrams: 350 },
  },
  {
    normalizedName: 'lasagna',
    displayName: 'Classic Baked Vegetable Lasagna',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Layered pasta sheets baked with mixed vegetables, tomato marinara, creamy béchamel, and mozzarella.',
    visualPrompt:
      'bubbling golden-brown baked ceramic stoneware gratin dish holding a clean stacked portion of Classic Vegetable Lasagna with pasta layers, chunky zucchini-pepper-tomato ragu, creamy béchamel, and browned mozzarella cheese',
    aliases: ['lasagna', 'classic baked vegetable lasagna', 'veg lasagna', 'vegetable lasagna', 'baked lasagna'],
    estimatedNutrition: { calories: 620, protein: 24, carbs: 56, fat: 32, servingGrams: 340 },
  },
  {
    normalizedName: 'roasted mushroom lasagna',
    displayName: 'Roasted Mushroom Lasagna',
    category: 'Pizzas & Pastas',
    cuisine: 'Gourmet Italian',
    generalizedDescription:
      'Rich baked lasagna layered with sauteed garlic mushrooms, spinach, ricotta, and white sauce.',
    visualPrompt:
      'golden baked rectangular stoneware dish with crisp browned bubbly parmesan-mozzarella top sliced neatly to reveal white pasta lasagna layers filled with earthy caramelized mushrooms, wilted spinach, and creamy white béchamel-ricotta',
    aliases: ['roasted mushroom lasagna', 'mushroom spinach lasagna', 'white sauce mushroom lasagna'],
    estimatedNutrition: { calories: 640, protein: 26, carbs: 50, fat: 36, servingGrams: 340 },
  },
  {
    normalizedName: 'classic chicken lasagna',
    displayName: 'Classic Chicken Lasagna',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian-American',
    generalizedDescription:
      'Baked pasta layers filled with spiced minced chicken ragù, béchamel, and melted cheddar-mozzarella.',
    visualPrompt:
      'steaming oven-baked casserole dish of Classic Chicken Lasagna sliced neatly showing rich layered sheets, thick red-spiced minced chicken ragu, velvety white béchamel, and golden melted cheese blanket on top',
    aliases: ['classic chicken lasagna', 'chicken lasagna', 'baked minced chicken lasagna'],
    estimatedNutrition: { calories: 690, protein: 38, carbs: 52, fat: 36, servingGrams: 360 },
  },
  {
    normalizedName: 'ravioli',
    displayName: 'Spinach & Ricotta Ravioli',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Handmade pasta pillows stuffed with spinach and ricotta cheese, served in sage-butter or pink sauce.',
    visualPrompt:
      'plump fluted square Spinach & Ricotta Ravioli pillows showing delicate green herb flecks in glistening golden brown-sage butter sauce with crispy sage leaves and shaved parmesan in a bowl',
    aliases: ['ravioli', 'spinach ricotta ravioli', 'spinach and ricotta ravioli', 'cheese ravioli'],
    estimatedNutrition: { calories: 470, protein: 18, carbs: 54, fat: 20, servingGrams: 270 },
  },
  {
    normalizedName: 'mac and cheese',
    displayName: 'Baked Mac and Cheese',
    category: 'Pizzas & Pastas',
    cuisine: 'American / Comfort Food',
    generalizedDescription:
      'Elbow macaroni baked in a rich three-cheese Mornay sauce with a crunchy breadcrumb crust.',
    visualPrompt:
      'baked Mac and Cheese in a round stoneware skillet featuring plump elbow macaroni drenched in glossy melted cheddar Mornay sauce with a golden blistered crunchy panko-herb crumb crust',
    aliases: ['mac and cheese', 'baked mac and cheese', 'mac n cheese', 'macaroni and cheese'],
    estimatedNutrition: { calories: 580, protein: 21, carbs: 56, fat: 29, servingGrams: 290 },
  },
  {
    normalizedName: 'risotto',
    displayName: 'Truffle Hunter Mushroom Risotto',
    category: 'Pizzas & Pastas',
    cuisine: 'Northern Italian',
    generalizedDescription:
      'Creamy Arborio rice slow-cooked with wild mushrooms, vegetable stock, parmesan, and truffle oil.',
    visualPrompt:
      'creamy glossy Italian Truffle Hunter Mushroom Risotto in a wide shallow stoneware bowl topped cleanly with golden seared wild forest mushrooms, shaved black truffle curls, thyme, and crisp parmesan tuile',
    aliases: ['risotto', 'truffle hunter mushroom risotto', 'mushroom risotto', 'truffle risotto', 'wild mushroom risotto'],
    estimatedNutrition: { calories: 520, protein: 14, carbs: 64, fat: 22, servingGrams: 300 },
  },
  {
    normalizedName: 'sun-dried tomato basil risotto',
    displayName: 'Sun-Dried Tomato & Basil Risotto',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian Bistro',
    generalizedDescription:
      'Italian Arborio rice cooked to a creamy consistency with tangy sun-dried tomatoes and parmesan.',
    visualPrompt:
      'warm sunset-coral tinted creamy Sun-Dried Tomato & Basil Risotto in a shallow cream ceramic bowl garnished cleanly with ruby sun-dried tomato ribbons, green basil oil drizzle, whole basil leaves, and shaved parmesan',
    aliases: ['sun-dried tomato basil risotto', 'tomato risotto', 'sundried tomato risotto'],
    estimatedNutrition: { calories: 490, protein: 13, carbs: 66, fat: 19, servingGrams: 300 },
  },
  {
    normalizedName: 'potato gnocchi in pomodoro',
    displayName: 'Potato Gnocchi in Pomodoro',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian',
    generalizedDescription:
      'Soft potato dumplings tossed in fresh tomato-basil sauce and topped with shaved parmesan.',
    visualPrompt:
      'plump pillowy ridged golden-ivory Potato Gnocchi dumplings bathed gently in velvety bright ruby tomato-basil pomodoro sauce, garnished with fresh basil leaves and wide parmesan ribbons in a stoneware pasta dish',
    aliases: ['potato gnocchi in pomodoro', 'gnocchi pomodoro', 'tomato basil gnocchi', 'gnocchi pasta'],
    estimatedNutrition: { calories: 490, protein: 13, carbs: 74, fat: 15, servingGrams: 290 },
  },
  {
    normalizedName: 'spaghetti carbonara',
    displayName: 'Spaghetti Carbonara',
    category: 'Pizzas & Pastas',
    cuisine: 'Roman Italian',
    generalizedDescription:
      'Spaghetti tossed with crispy smoked bacon or chicken rashers in a silky egg yolk, pecorino, and black pepper sauce.',
    visualPrompt:
      'glossy sunlit golden Spaghetti Carbonara twirled high inside a white ceramic pasta bowl coated smoothly with silky pecorino egg-yolk cream, crisp smoked bacon lardons, and coarse cracked black pepper',
    aliases: ['spaghetti carbonara', 'classic carbonara', 'carbonara pasta'],
    estimatedNutrition: { calories: 670, protein: 27, carbs: 65, fat: 33, servingGrams: 320 },
  },
  {
    normalizedName: 'truffle mushroom pasta',
    displayName: 'Truffle Mushroom Pasta',
    category: 'Pizzas & Pastas',
    cuisine: 'Italian / Contemporary',
    generalizedDescription:
      'Handcrafted pasta ribbons tossed in a delicate black truffle emulsion with sauteed wild forest mushrooms and aged parmesan.',
    visualPrompt:
      'twirled ribbons of creamy Truffle Mushroom Pasta tagliatelle tossed in silky black truffle emulsion with sauteed golden wild forest mushrooms, shaved dark truffle slices, and aged parmesan in a warm stoneware pasta bowl',
    aliases: ['truffle mushroom pasta', 'wild mushroom truffle tagliatelle', 'pasta ai funghi', 'black truffle tagliatelle'],
    estimatedNutrition: { calories: 520, protein: 14, carbs: 68, fat: 22, servingGrams: 280 },
  },

  // =========================================================================
  // IX. Global Bowls, Salads, Sizzlers & Cafe Mains (241-265 + sizzler)
  // =========================================================================
  {
    normalizedName: 'classic caesar salad',
    displayName: 'Classic Caesar Salad',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Classic Bistro',
    generalizedDescription:
      'Crisp romaine lettuce tossed with creamy Caesar dressing, herb croutons, and shaved parmesan.',
    visualPrompt:
      'shallow ceramic salad bowl overflowing neatly with crisp green romaine lettuce leaves coated gently with velvety ivory Caesar dressing, golden toasted garlic herb croutons, and broad ribbons of shaved aged parmesan',
    aliases: ['classic caesar salad', 'caesar salad', 'veg caesar salad'],
    estimatedNutrition: { calories: 360, protein: 11, carbs: 20, fat: 27, servingGrams: 240 },
  },
  {
    normalizedName: 'thai green papaya salad som tum',
    displayName: 'Thai Green Papaya Salad (Som Tum)',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Thai Street Café',
    generalizedDescription:
      'Shredded raw papaya pounded with cherry tomatoes, green beans, peanuts, chili, and lime dressing.',
    visualPrompt:
      'bright crunchy pale-emerald julienned Thai Green Papaya Som Tum Salad tossed neatly with halved cherry tomatoes, crisp yardlong green beans, crushed roasted golden peanuts, red Thai chili, and fresh lime wedge on a stoneware plate',
    aliases: ['thai green papaya salad som tum', 'som tum salad', 'green papaya salad', 'thai papaya salad'],
    estimatedNutrition: { calories: 220, protein: 6, carbs: 29, fat: 10, servingGrams: 220 },
  },
  {
    normalizedName: 'antioxidant fruity goat cheese salad',
    displayName: 'Antioxidant Fruity Goat Cheese Salad',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Contemporary Wellness Café',
    generalizedDescription:
      'Mixed greens tossed with candied walnuts, berries, apple slices, and creamy goat cheese.',
    visualPrompt:
      'fresh baby arugula and mixed field greens topped artfully with snow-white tangy goat cheese medallions, crisp fanned red apple slices, fresh blueberries, strawberries, honey-glazed candied walnuts, and berry balsamic drizzle',
    aliases: ['antioxidant fruity goat cheese salad', 'goat cheese berry salad', 'fruity goat cheese salad'],
    estimatedNutrition: { calories: 380, protein: 11, carbs: 28, fat: 25, servingGrams: 240 },
  },
  {
    normalizedName: 'mediterranean greek salad',
    displayName: 'Mediterranean Greek Salad',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Greek / Mediterranean',
    generalizedDescription:
      'Cucumber, tomatoes, red onion, Kalamata olives, and feta cheese dressed in oregano vinaigrette.',
    visualPrompt:
      'chunky colorful Mediterranean Greek Salad in a ceramic bowl showing crisp diced cucumber, juicy ruby ripe tomatoes, purple red-onion rings, glossy Kalamata olives, topped with a clean oregano-dusted rectangular block of white Feta cheese',
    aliases: ['mediterranean greek salad', 'greek feta salad', 'classic greek salad'],
    estimatedNutrition: { calories: 290, protein: 9, carbs: 14, fat: 22, servingGrams: 250 },
  },
  {
    normalizedName: 'mediterranean avocado hummus bowl',
    displayName: 'Mediterranean Avocado Hummus Bowl',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Mediterranean Health Café',
    generalizedDescription:
      'Nourish bowl with quinoa, chickpea hummus, sliced avocado, roasted veggies, and falafel.',
    visualPrompt:
      'vibrant round stoneware Mediterranean Nourish Bowl filled neatly in crisp sections with fluffy tri-color quinoa, swirled classic chickpea hummus, fanned green avocado slices, golden charred veggies, chickpeas, and two crisp falafel patties',
    aliases: ['mediterranean avocado hummus bowl', 'avocado hummus bowl', 'quinoa falafel nourish bowl'],
    estimatedNutrition: { calories: 540, protein: 18, carbs: 58, fat: 26, servingGrams: 360 },
  },
  {
    normalizedName: 'burrito bowl',
    displayName: 'Mexican Burrito Bowl',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Mexican / Contemporary Café',
    generalizedDescription:
      'Cilantro-lime rice layered with black beans, grilled corn salsa, pico de gallo, sour cream, and guacamole.',
    visualPrompt:
      'colorful Mexican Burrito Bowl in a stoneware bowl neatly arranged with cilantro-lime rice, black beans, charred corn salsa, tomato pico de gallo, green guacamole, sour cream, and shredded cheese',
    aliases: ['burrito bowl', 'mexican burrito bowl', 'veg burrito bowl', 'chicken burrito bowl'],
    estimatedNutrition: { calories: 590, protein: 25, carbs: 68, fat: 22, servingGrams: 380 },
  },
  {
    normalizedName: 'enchiladas',
    displayName: 'Baked Vegetable Enchiladas',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Mexican',
    generalizedDescription:
      'Corn tortillas rolled with beans and veggies, smothered in red chili enchilada sauce and melted cheese.',
    visualPrompt:
      'three rolled Mexican Enchiladas baked in a stoneware dish covered with rich red chili sauce, bubbly melted cheddar-mozzarella cheese, fresh cilantro, and sour cream ribbons',
    aliases: ['enchiladas', 'baked vegetable enchiladas', 'veg enchiladas', 'mexican enchiladas'],
    estimatedNutrition: { calories: 560, protein: 24, carbs: 54, fat: 26, servingGrams: 310 },
  },
  {
    normalizedName: 'fish fajita platter',
    displayName: 'Fish Fajita Platter',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Tex-Mex Grill',
    generalizedDescription:
      'Sizzling strips of spiced grilled fish with bell peppers and onions, served with warm tortillas and salsa.',
    visualPrompt:
      'warm matte cast-iron skillet holding juicy charred lime-spiced white fish strips alongside colorful blistered red, yellow, and green bell pepper and onion strips with warm soft tortillas, salsa, and sour cream cups nearby',
    aliases: ['fish fajita platter', 'fish fajitas', 'grilled fish fajitas'],
    estimatedNutrition: { calories: 540, protein: 35, carbs: 46, fat: 24, servingGrams: 360 },
  },
  {
    normalizedName: 'khow suey',
    displayName: 'Burmese Veg/Chicken Khow Suey',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Burmese / Pan-Asian',
    generalizedDescription:
      'Fragrant coconut milk curry noodle soup served with a tray of condiments: fried garlic, burnt onions, peanuts, and lime.',
    visualPrompt:
      'rich golden turmeric-coconut curry Burmese Khow Suey noodle bowl surrounded cleanly by neat mini condiment bowls holding crisp fried garlic, caramelized burnt onions, crushed peanuts, scallions, and lime wedge',
    aliases: ['khow suey', 'burmese veg/chicken khow suey', 'burmese khow suey', 'veg khow suey', 'chicken khow suey'],
    estimatedNutrition: { calories: 610, protein: 22, carbs: 66, fat: 28, servingGrams: 420 },
  },
  {
    normalizedName: 'ramen',
    displayName: 'Spicy Miso Ramen Bowl',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Japanese',
    generalizedDescription:
      'Japanese wheat noodles in a savory miso broth topped with bok choy, corn, scallions, and soft-boiled egg or tofu.',
    visualPrompt:
      'deep dark-glazed ceramic ramen bowl brimming with wavy wheat noodles in savory golden-orange miso broth crowned cleanly with halved jammy soft-boiled egg, seared chashu or tofu, crisp nori seaweed, bok choy, sweet corn, and scallions',
    aliases: ['ramen', 'spicy miso ramen bowl', 'miso ramen', 'japanese ramen', 'ramen bowl'],
    estimatedNutrition: { calories: 540, protein: 24, carbs: 62, fat: 20, servingGrams: 450 },
  },
  {
    normalizedName: 'thai green curry with jasmine rice',
    displayName: 'Thai Green Curry with Jasmine Rice',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Thai',
    generalizedDescription:
      'Aromatic coconut curry infused with green chilies, galangal, and basil, served with steamed jasmine rice.',
    visualPrompt:
      'shallow stoneware bowl filled cleanly with velvety sage-emerald Thai Green Coconut Curry packed with baby eggplants, bamboo shoots, bell peppers, and sweet Thai basil leaves beside a neatly molded dome of fluffy steamed jasmine rice',
    aliases: ['thai green curry with jasmine rice', 'thai green curry', 'green thai curry rice'],
    estimatedNutrition: { calories: 580, protein: 16, carbs: 66, fat: 28, servingGrams: 410 },
  },
  {
    normalizedName: 'thai red curry with jasmine rice',
    displayName: 'Thai Red Curry with Jasmine Rice',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Thai',
    generalizedDescription:
      'Rich coconut milk curry made with dried red chilies, lemongrass, and vegetables or chicken, paired with rice.',
    visualPrompt:
      'vibrant coral-terracotta velvety Thai Red Coconut Curry simmering with colorful red bell peppers, snap peas, baby corn, and basil leaves inside a ceramic dish next to steamed white jasmine rice',
    aliases: ['thai red curry with jasmine rice', 'thai red curry', 'red thai curry rice'],
    estimatedNutrition: { calories: 590, protein: 17, carbs: 66, fat: 29, servingGrams: 410 },
  },
  {
    normalizedName: 'sichuan mapo tofu bowl',
    displayName: 'Sichuan Mapo Tofu Bowl',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Sichuan Chinese',
    generalizedDescription:
      'Silken tofu cubes braised in a fiery, numbing Sichuan chili-bean sauce, served over steamed rice.',
    visualPrompt:
      'deep ceramic rice bowl half-filled with steamed white jasmine rice and half-filled with silky snow-white tofu cubes swimming cleanly in glistening fiery red-mahogany Sichuan chili-oil bean sauce studded with green scallions',
    aliases: ['sichuan mapo tofu bowl', 'mapo tofu', 'spicy mapo tofu rice bowl'],
    estimatedNutrition: { calories: 520, protein: 21, carbs: 58, fat: 22, servingGrams: 380 },
  },
  {
    normalizedName: 'chilli paneer gravy with fried rice',
    displayName: 'Chilli Paneer Gravy with Fried Rice',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Indo-Chinese Café',
    generalizedDescription:
      'Indo-Chinese wok-tossed cottage cheese in spicy soy-chili gravy paired with vegetable fried rice.',
    visualPrompt:
      'divided ceramic bowl or combo platter showcasing glossy dark soy-chili-glazed golden Paneer cubes cooked with green capsicum and diced onions alongside wok-tossed colorful Vegetable Fried Rice garnished with spring onion greens',
    aliases: ['chilli paneer gravy with fried rice', 'chilli paneer fried rice', 'chili paneer combo'],
    estimatedNutrition: { calories: 670, protein: 24, carbs: 74, fat: 30, servingGrams: 420 },
  },
  {
    normalizedName: 'vegetable pan-fried noodles',
    displayName: 'Vegetable Pan-Fried Noodles',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Pan-Asian',
    generalizedDescription:
      'Crispy pan-seared noodles topped with stir-fried exotic vegetables in a savory soy-garlic glaze.',
    visualPrompt:
      'golden-brown crispy nest of pan-fried wheat noodles drenched partially in glossy dark soy-garlic glaze packed with crisp bok choy, broccoli florets, julienned carrots, mushrooms, and bell peppers inside a ceramic plate',
    aliases: ['vegetable pan-fried noodles', 'pan fried noodles', 'cantonese crispy noodles'],
    estimatedNutrition: { calories: 560, protein: 14, carbs: 76, fat: 22, servingGrams: 370 },
  },
  {
    normalizedName: 'sizzler',
    displayName: 'Classic Cafe Sizzler',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Continental / Café Fusion',
    generalizedDescription:
      'Classic cast-iron sizzler platter with grilled paneer steak, fries, steamed veggies, herb rice, and peppercorn gravy.',
    visualPrompt:
      'dramatic cast-iron Sizzler platter on a wooden board lined with crisp cabbage leaves, piled with roasted paneer steak, golden French fries, broccoli, and buttered herb rice coated in peppercorn gravy',
    aliases: ['sizzler', 'classic cafe sizzler', 'paneer sizzler', 'veg sizzler', 'sizzler platter'],
    estimatedNutrition: { calories: 740, protein: 28, carbs: 72, fat: 36, servingGrams: 460 },
  },
  {
    normalizedName: 'butter paneer sizzler',
    displayName: 'Butter Paneer Sizzler',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Indian-Continental Café',
    generalizedDescription:
      'Cast-iron sizzler plate loaded with grilled paneer steaks in makhani gravy, herbed rice, fries, and charred veggies.',
    visualPrompt:
      'smoking sizzling cast-iron sizzler platter on a wooden undertray lined with cabbage leaves piled neatly with thick golden grilled paneer steaks bathed in rich orange velvety makhani tomato-butter gravy alongside fries, herbed rice, and broccoli',
    aliases: ['butter paneer sizzler', 'makhani paneer sizzler', 'paneer makhani sizzler'],
    estimatedNutrition: { calories: 790, protein: 28, carbs: 74, fat: 42, servingGrams: 480 },
  },
  {
    normalizedName: 'grilled chicken steak sizzler',
    displayName: 'Grilled Chicken Steak Sizzler',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Continental Bistro',
    generalizedDescription:
      'Sizzling platter of herb-marinated chicken breast with peppercorn jus, mashed potatoes, and steamed vegetables.',
    visualPrompt:
      'classic sizzling black cast-iron oval skillet on timber tray showing char-grilled herb chicken breast steak glazed cleanly in glossy dark crushed-peppercorn jus beside creamy swirled mashed potatoes, crisp green beans, roasted carrots, and sautéed mushrooms',
    aliases: ['grilled chicken steak sizzler', 'chicken steak sizzler', 'chicken sizzler'],
    estimatedNutrition: { calories: 710, protein: 46, carbs: 48, fat: 34, servingGrams: 460 },
  },
  {
    normalizedName: 'cottage cheese shashlik sizzler',
    displayName: 'Cottage Cheese Shashlik Sizzler',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Continental Café Fusion',
    generalizedDescription:
      'Skewered paneer, tomatoes, and bell peppers served on a sizzling plate with parsley rice and tangy sauce.',
    visualPrompt:
      'sizzling cast-iron sizzler tray crowned neatly with two colorful skewers of charred cottage cheese paneer cubes, sweet bell peppers, cherry tomatoes, and red onions served over garlic parsley rice and French fries with smoky tangy glaze',
    aliases: ['cottage cheese shashlik sizzler', 'paneer shashlik sizzler', 'shashlik sizzler'],
    estimatedNutrition: { calories: 730, protein: 27, carbs: 68, fat: 38, servingGrams: 460 },
  },
  {
    normalizedName: 'stroganoff with herbed rice',
    displayName: 'Stroganoff with Herbed Rice',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Classic Continental Bistro',
    generalizedDescription:
      'Creamy Russian-style sauteed mushrooms (or chicken) in sour cream and paprika sauce served alongside buttered rice.',
    visualPrompt:
      'wide ceramic dinner bowl featuring velvety warm ivory-tan Stroganoff sauce packed cleanly with browned button mushrooms and caramelized onions garnished with parsley beside a clean dome of buttered green herb parsley rice',
    aliases: ['stroganoff with herbed rice', 'mushroom stroganoff', 'chicken stroganoff rice', 'stroganoff'],
    estimatedNutrition: { calories: 590, protein: 20, carbs: 60, fat: 30, servingGrams: 370 },
  },
  {
    normalizedName: 'herb-crusted grilled fish with lemon butter',
    displayName: 'Herb-Crusted Grilled Fish with Lemon Butter',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'European Bistro',
    generalizedDescription:
      'Pan-seared sole or basa fillet served with creamy mashed potatoes, sauteed greens, and lemon-caper butter.',
    visualPrompt:
      'golden pan-seared herb-flecked white fish fillet resting neatly over creamy whipped mashed potatoes, vibrant green sautéed baby spinach and asparagus spears, finished cleanly with glossy yellow lemon-caper butter sauce and charred lemon half',
    aliases: ['herb-crusted grilled fish with lemon butter', 'grilled fish lemon butter', 'lemon butter grilled sole'],
    estimatedNutrition: { calories: 530, protein: 36, carbs: 32, fat: 28, servingGrams: 340 },
  },
  {
    normalizedName: 'paneer tikka masala with garlic naan',
    displayName: 'Paneer Tikka Masala with Garlic Naan',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'North Indian Bistro',
    generalizedDescription:
      'Comfort cafe main of charred cottage cheese cubes in rich tomato-onion gravy.',
    visualPrompt:
      'matte copper-trimmed stoneware bowl of vibrant rich terracotta-orange Paneer Tikka Masala gravy dotted with cream swirl and charred cottage cheese tikka cubes beside folded charred garlic-and-cilantro brushed butter naan triangles',
    aliases: ['paneer tikka masala with garlic naan', 'paneer tikka masala', 'paneer masala naan'],
    estimatedNutrition: { calories: 740, protein: 26, carbs: 64, fat: 42, servingGrams: 400 },
  },
  {
    normalizedName: 'classic dal makhani bowl',
    displayName: 'Classic Dal Makhani Bowl',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'North Indian',
    generalizedDescription:
      'Slow-simmered black lentils cooked overnight with butter, cream, and tomato puree.',
    visualPrompt:
      'deep artisan ceramic bowl brimming cleanly with velvety slow-simmered deep mahogany-black Dal Makhani swirled artistically with white heavy cream, pat of golden butter, ginger juliennes, beside jeera cumin basmati rice or mini naan',
    aliases: ['classic dal makhani bowl', 'dal makhani bowl', 'dal makhani rice bowl', 'dal makhani'],
    estimatedNutrition: { calories: 580, protein: 20, carbs: 64, fat: 27, servingGrams: 380 },
  },
  {
    normalizedName: 'butter chicken',
    displayName: 'Old-Delhi Style Butter Chicken',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'North Indian',
    generalizedDescription:
      'Tandoori chicken tikka simmered in a velvety, buttery tomato-fenugreek gravy.',
    visualPrompt:
      'classic hammered stoneware bowl filled with velvety burnished orange-red Old-Delhi Style Butter Chicken gravy cradling tender charred chicken tikka pieces finished cleanly with ivory cream swirl, dried kasoori methi fenugreek leaves, and warm garlic naan edge',
    aliases: ['butter chicken', 'old-delhi style butter chicken', 'murgh makhani', 'chicken makhani', 'old delhi butter chicken'],
    estimatedNutrition: { calories: 590, protein: 32, carbs: 24, fat: 40, servingGrams: 340 },
  },
  {
    normalizedName: 'crispy veg cutlet platter',
    displayName: 'Crispy Veg Cutlet Platter',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Heritage Café',
    generalizedDescription:
      'Two crumb-fried mixed vegetable cutlets served with French fries, coleslaw, and mustard.',
    visualPrompt:
      'two crisp golden oval crumb-coated Mixed Vegetable Cutlets arranged neatly beside a tangle of crunchy golden French fries, creamy white cabbage coleslaw cup, buttered toasted bread slice, and warm Dijon mustard pot',
    aliases: ['crispy veg cutlet platter', 'veg cutlet platter', 'vegetable cutlet fries'],
    estimatedNutrition: { calories: 530, protein: 11, carbs: 62, fat: 26, servingGrams: 310 },
  },
  {
    normalizedName: 'cream of roasted tomato basil soup',
    displayName: 'Cream of Roasted Tomato & Basil Soup',
    category: 'Global Bowls, Salads, Sizzlers & Cafe Mains',
    cuisine: 'Classic European Café',
    generalizedDescription:
      'Velvety soup made from oven-roasted plum tomatoes and fresh basil, served with garlic croutons.',
    visualPrompt:
      'deep cream ceramic soup bowl filled with glowing rich terracotta-crimson velvety Tomato Basil Soup garnished cleanly with a delicate cream swirl, crisp golden garlic bread croutons, and bright green basil leaves',
    aliases: ['cream of roasted tomato basil soup', 'tomato basil soup', 'roasted tomato soup'],
    estimatedNutrition: { calories: 250, protein: 5, carbs: 29, fat: 13, servingGrams: 290 },
  },
];

