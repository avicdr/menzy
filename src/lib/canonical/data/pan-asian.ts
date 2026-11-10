import type { CanonicalCatalogItem } from '../types';

export const PAN_ASIAN_CATALOG: CanonicalCatalogItem[] = [
  // =========================================================================
  // XIV. Pan-Asian, Sushi, Bao & Dim Sum (436-495)
  // =========================================================================
  {
    normalizedName: 'steamed edamame with sea salt',
    displayName: 'Steamed Edamame with Sea Salt',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Young green soybeans steamed in their pods and tossed with flaky Maldon sea salt.',
    visualPrompt:
      'vibrant bright emerald-green steamed whole Edamame pods mounded neatly inside a minimalist matte dark stoneware bowl frosted gently with crisp translucent white flaky sea salt crystals',
    aliases: ['steamed edamame with sea salt', 'salted edamame', 'steamed edamame'],
    estimatedNutrition: { calories: 160, protein: 14, carbs: 13, fat: 6, servingGrams: 160 },
  },
  {
    normalizedName: 'spicy garlic edamame',
    displayName: 'Spicy Garlic Edamame',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese / Contemporary Asian',
    generalizedDescription:
      'Steamed soybean pods wok-tossed in fiery chili oil, browned minced garlic, and soy sauce.',
    visualPrompt:
      'glossy green Edamame soybean pods wok-tossed cleanly in gleaming crimson roasted chili garlic sauce covered visibly with golden crisp fried minced garlic flakes and sesame seeds in a dark ceramic dish',
    aliases: ['spicy garlic edamame', 'chili garlic edamame', 'truffle spicy edamame'],
    estimatedNutrition: { calories: 210, protein: 14, carbs: 14, fat: 11, servingGrams: 170 },
  },
  {
    normalizedName: 'classic miso soup',
    displayName: 'Classic Miso Soup',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Traditional Japanese dashi broth whisked with fermented soybean paste, cubed silken tofu, wakame seaweed, and scallions.',
    visualPrompt:
      'authentic lacquered black-and-vermilion Japanese soup bowl filled with cloudy amber-gold miso broth containing pristine snow-white cubed silken tofu, dark emerald wakame seaweed ribbons, and floating scallion rings',
    aliases: ['classic miso soup', 'miso soup', 'tofu wakame miso broth'],
    estimatedNutrition: { calories: 85, protein: 6, carbs: 9, fat: 3, servingGrams: 240 },
  },
  {
    normalizedName: 'thai tom yum soup',
    displayName: 'Thai Tom Yum Soup',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Thai',
    generalizedDescription:
      'Hot and sour clear Thai broth infused with lemongrass, galangal, kaffir lime leaves, bird\'s eye chili, and mushrooms or prawns.',
    visualPrompt:
      'steaming ceramic bowl of glowing translucent coral-amber Thai Tom Yum broth showing whole tiger prawns, straw mushrooms, chopped lemongrass stalks, glossy kaffir lime leaf, and bright green cilantro garnish',
    aliases: ['thai tom yum soup', 'tom yum soup', 'tom yum goong'],
    estimatedNutrition: { calories: 160, protein: 14, carbs: 12, fat: 6, servingGrams: 300 },
  },
  {
    normalizedName: 'tom kha gai thai coconut soup',
    displayName: 'Tom Kha Gai (Thai Coconut Soup)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Thai',
    generalizedDescription:
      'Aromatic soup made with coconut milk, galangal, lemongrass, mushrooms, and tender chicken strips.',
    visualPrompt:
      'deep ceramic bowl of creamy ivory velvety coconut milk Tom Kha Gai soup garnished dynamically with vibrant bright red chili oil droplets, mushrooms, tender sliced white chicken, galangal slices, and cilantro leaves',
    aliases: ['tom kha gai thai coconut soup', 'tom kha gai', 'thai coconut chicken soup'],
    estimatedNutrition: { calories: 280, protein: 18, carbs: 11, fat: 19, servingGrams: 300 },
  },
  {
    normalizedName: 'indo-chinese manchow soup',
    displayName: 'Indo-Chinese Manchow Soup',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese Café',
    generalizedDescription:
      'Dark, thick soy-garlic soup loaded with finely chopped vegetables or chicken and topped with crispy fried noodles.',
    visualPrompt:
      'glossy deep soy-mahogany Manchow Soup inside a stoneware bowl packed cleanly with finely brunoised colorful vegetables topped dramatically with a golden crunchy nest heap of crisp deep-fried crispy noodles and chopped scallions',
    aliases: ['indo-chinese manchow soup', 'veg manchow soup', 'chicken manchow soup', 'manchow soup'],
    estimatedNutrition: { calories: 210, protein: 7, carbs: 29, fat: 7, servingGrams: 290 },
  },
  {
    normalizedName: 'hot sour soup',
    displayName: 'Hot & Sour Soup',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese / Sichuan',
    generalizedDescription:
      'Spicy and tangy thickened Asian broth filled with shredded bamboo shoots, wood-ear mushrooms, tofu, and vinegar.',
    visualPrompt:
      'glossy ruby-amber Sichuan Hot & Sour Soup inside a white ceramic soup bowl filled cleanly with delicate strips of silky tofu, shredded wood-ear mushrooms, bamboo shoots, julienned carrots, and chopped spring onion greens',
    aliases: ['hot sour soup', 'hot and sour soup', 'spicy sour chinese soup'],
    estimatedNutrition: { calories: 160, protein: 8, carbs: 20, fat: 5, servingGrams: 290 },
  },
  {
    normalizedName: 'sweet corn veg chicken soup',
    displayName: 'Sweet Corn Veg/Chicken Soup',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese Café',
    generalizedDescription:
      'Comforting creamy soup made from creamed sweet corn kernels, diced carrots, and egg drop or cornstarch ribbons.',
    visualPrompt:
      'pale golden velvety Chinese Sweet Corn Soup brimming cleanly with plump sunny yellow sweet corn kernels, tender tiny carrot cubes, silky wispy cream swirl, green scallion rings, and subtle cracked white pepper in a ceramic bowl',
    aliases: ['sweet corn veg chicken soup', 'sweet corn soup', 'veg sweet corn soup', 'chicken sweet corn soup'],
    estimatedNutrition: { calories: 175, protein: 7, carbs: 28, fat: 4, servingGrams: 290 },
  },
  {
    normalizedName: 'vietnamese pho noodle soup',
    displayName: 'Vietnamese Pho Noodle Soup',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Vietnamese',
    generalizedDescription:
      'Clear, aromatic star-anise and cinnamon beef or chicken broth served with flat rice noodles, herbs, bean sprouts, and lime.',
    visualPrompt:
      'large authentic ceramic bowl of steaming Vietnamese Pho filled with silky translucent flat white rice noodles in crystal-clear golden star-anise broth topped with sliced herbs, Thai basil, crunchy white bean sprouts, red chili slices, and lime wedge',
    aliases: ['vietnamese pho noodle soup', 'pho soup', 'chicken pho bowl', 'beef pho noodle soup'],
    estimatedNutrition: { calories: 420, protein: 26, carbs: 56, fat: 9, servingGrams: 460 },
  },
  {
    normalizedName: 'tibetan thukpa',
    displayName: 'Tibetan Thukpa',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Tibetan / Himalayan',
    generalizedDescription:
      'Hearty Himalayan noodle soup loaded with julienned vegetables, ginger, garlic, green chilies, and wheat noodles.',
    visualPrompt:
      'rustic Himalayan stoneware noodle bowl filled warmly with hearty turmeric-spiced broth brimming cleanly with long hand-pulled wheat noodles, crunchy julienned cabbage, carrots, bok choy, green chili, cilantro, and lime wedge',
    aliases: ['tibetan thukpa', 'thukpa noodle soup', 'himalayan veg thukpa'],
    estimatedNutrition: { calories: 380, protein: 13, carbs: 62, fat: 8, servingGrams: 430 },
  },
  {
    normalizedName: 'laksa lemak noodle bowl',
    displayName: 'Laksa Lemak Noodle Bowl',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Malaysian / Peranakan',
    generalizedDescription:
      'Peranakan spicy coconut curry noodle soup topped with tofu puffs, bean sprouts, prawns or chicken, and sambal.',
    visualPrompt:
      'rich burnt tangerine-coral creamy coconut curry Laksa Lemak inside a deep ceramic bowl holding round noodles, golden crispy fried spongy tofu puffs, curled pink prawns, halved soft egg, bean sprouts, lime, and red sambal chili dollop',
    aliases: ['laksa lemak noodle bowl', 'curry laksa bowl', 'singapore laksa soup'],
    estimatedNutrition: { calories: 590, protein: 25, carbs: 58, fat: 29, servingGrams: 440 },
  },
  {
    normalizedName: 'tonkotsu ramen',
    displayName: 'Tonkotsu Ramen',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Rich, milky pork-bone or chicken-paitan broth served with ramen noodles, chashu slices, ajitama egg, and bamboo shoots.',
    visualPrompt:
      'authentic dark speckled ceramic bowl of rich creamy ivory-beige Tonkotsu Ramen cradling curly wheat noodles topped cleanly with braised seared chashu medallions, halved glossy marinated ajitama egg, crisp wood-ear mushrooms, bamboo menma, and scallions',
    aliases: ['tonkotsu ramen', 'pork tonkotsu ramen', 'chicken paitan tonkotsu'],
    estimatedNutrition: { calories: 640, protein: 32, carbs: 60, fat: 30, servingGrams: 470 },
  },
  {
    normalizedName: 'shoyu ramen',
    displayName: 'Shoyu Ramen',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Clear, savory soy-sauce-based broth served with curly wheat noodles, nori sheets, narutomaki, and scallions.',
    visualPrompt:
      'deep Japanese ceramic bowl of clear rich amber Shoyu soy broth holding wavy noodles garnished cleanly with crisp dark nori sheets, classic pink-swirl white narutomaki fish cake medallion, soft marinated egg, bamboo shoots, and scallions',
    aliases: ['shoyu ramen', 'soy sauce ramen', 'tokyo shoyu ramen'],
    estimatedNutrition: { calories: 510, protein: 24, carbs: 64, fat: 16, servingGrams: 450 },
  },
  {
    normalizedName: 'crispy vegetable spring rolls',
    displayName: 'Crispy Vegetable Spring Rolls',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Pan-Asian Café',
    generalizedDescription:
      'Golden deep-fried pastry rolls stuffed with glass noodles, shredded cabbage, carrots, and shiitake mushrooms.',
    visualPrompt:
      'four blistered golden-brown crisp cylindrical Crispy Vegetable Spring Rolls sliced neatly on the bias showcasing glass noodles, bright carrots, green cabbage, and shiitake mushrooms resting beside sweet chili garlic sauce',
    aliases: ['crispy vegetable spring rolls', 'veg spring rolls', 'crispy chinese spring roll'],
    estimatedNutrition: { calories: 330, protein: 6, carbs: 42, fat: 15, servingGrams: 185 },
  },
  {
    normalizedName: 'vietnamese fresh summer rolls',
    displayName: 'Vietnamese Fresh Summer Rolls',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Vietnamese',
    generalizedDescription:
      'Translucent rice-paper rolls packed with fresh mint, lettuce, vermicelli, cucumber, and prawns or tofu, with peanut dip.',
    visualPrompt:
      'four glistening crystal translucent rice-paper Vietnamese Fresh Summer Rolls halved cleanly to display vibrant green lettuce, mint herbs, crisp orange carrot ribbons, cucumber, and pink poached shrimp alongside rich crushed-peanut hoisin dip',
    aliases: ['vietnamese fresh summer rolls', 'rice paper rolls', 'fresh spring rolls goi cuon'],
    estimatedNutrition: { calories: 250, protein: 14, carbs: 32, fat: 7, servingGrams: 210 },
  },
  {
    normalizedName: 'crispy lotus stem in honey chilli',
    displayName: 'Crispy Lotus Stem in Honey Chilli',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese / Asian',
    generalizedDescription:
      'Thinly sliced lotus root coated in cornstarch, fried crisp, and tossed in a sweet-spicy honey, chili, and sesame glaze.',
    visualPrompt:
      'crisp lacy circular-hole sliced Honey Chilli Lotus Stem coins glazed vibrantly in glowing sticky red-amber chili-honey glaze sprinkled generously with toasted white sesame seeds and sliced bright spring onion greens in a ceramic dish',
    aliases: ['crispy lotus stem in honey chilli', 'honey chilli lotus stem', 'crispy konjee lotus root'],
    estimatedNutrition: { calories: 340, protein: 4, carbs: 52, fat: 13, servingGrams: 200 },
  },
  {
    normalizedName: 'crispy corn salt pepper',
    displayName: 'Crispy Corn Salt & Pepper',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese Bistro',
    generalizedDescription:
      'Plump sweet corn kernels dusted in starch, fried crunchy, and wok-tossed with chopped garlic, spring onions, and cracked pepper.',
    visualPrompt:
      'mound of sparkling crunchy golden batter-dusted puffed sweet corn kernels wok-tossed crisply with diced red and green bell peppers, minced crisp garlic, cracked black pepper, and fresh spring onion confetti inside a dark bowl',
    aliases: ['crispy corn salt pepper', 'crispy corn', 'salt and pepper corn', 'crispy american corn'],
    estimatedNutrition: { calories: 330, protein: 6, carbs: 46, fat: 14, servingGrams: 190 },
  },
  {
    normalizedName: 'veg manchurian dry gravy',
    displayName: 'Veg Manchurian (Dry/Gravy)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese',
    generalizedDescription:
      'Deep-fried mixed vegetable dumplings tossed in a pungent soy, ginger, garlic, and green chili sauce.',
    visualPrompt:
      'six glossy deeply browned tender round vegetable Manchurian balls coated richly inside thick glistening dark soy-garlic-ginger glaze speckled with diced capsicum, spring onion greens, and chili slivers in a stoneware bowl',
    aliases: ['veg manchurian dry gravy', 'veg manchurian', 'vegetable manchurian dry', 'gobi veg manchurian'],
    estimatedNutrition: { calories: 380, protein: 8, carbs: 48, fat: 17, servingGrams: 250 },
  },
  {
    normalizedName: 'chilli chicken kolkata indo-chinese style',
    displayName: 'Chilli Chicken (Kolkata/Indo-Chinese Style)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Kolkata Indo-Chinese',
    generalizedDescription:
      'Batter-fried boneless chicken chunks wok-tossed with green chilies, onions, capsicum, and dark soy sauce.',
    visualPrompt:
      'wok-glazed glossy caramel-dark crisp battered boneless Chilli Chicken pieces tossed cleanly with chunky diamond green bell pepper squares, crisp white-purple onion petals, bright green slit chilies, and green spring onions',
    aliases: ['chilli chicken kolkata indo-chinese style', 'chilli chicken', 'kolkata chilli chicken', 'chili chicken dry'],
    estimatedNutrition: { calories: 470, protein: 31, carbs: 32, fat: 24, servingGrams: 260 },
  },
  {
    normalizedName: 'drums of heaven sichuan lollipop',
    displayName: 'Drums of Heaven (Sichuan Lollipop)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese / Sichuan',
    generalizedDescription:
      'Frenched chicken wingettes batter-fried and glazed in a sweet, tangy, and fiery red Sichuan garlic sauce.',
    visualPrompt:
      'six neat upright Frenched crisp chicken lollipop wingettes coated luxuriously in glowing sticky bright red fiery Sichuan chili garlic glaze sprinkled with toasted sesame seeds and scallions on a ceramic dish',
    aliases: ['drums of heaven sichuan lollipop', 'drums of heaven', 'chicken lollipop sichuan'],
    estimatedNutrition: { calories: 520, protein: 30, carbs: 34, fat: 29, servingGrams: 260 },
  },
  {
    normalizedName: 'dragon chicken',
    displayName: 'Dragon Chicken',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese Bistro',
    generalizedDescription:
      'Crispy strips of chicken tossed with roasted cashew nuts, dried red chilies, bell peppers, and spicy red dragon sauce.',
    visualPrompt:
      'oblong stoneware plate holding crispy thin golden chicken ribbons lacquered in bright fiery vermilion chili-garlic sauce studded heavily with toasted golden roasted cashew halves, dried red chili pods, bell pepper strips, and scallions',
    aliases: ['dragon chicken', 'spicy cashew dragon chicken'],
    estimatedNutrition: { calories: 510, protein: 31, carbs: 32, fat: 28, servingGrams: 250 },
  },
  {
    normalizedName: 'crispy honey sesame chicken',
    displayName: 'Crispy Honey Sesame Chicken',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Pan-Asian Café',
    generalizedDescription:
      'Crunchy fried chicken strips coated in a glossy caramel-honey and tomato-chili glaze, sprinkled with toasted white sesame.',
    visualPrompt:
      'crunchy golden-amber bite-sized fried chicken pieces gleaming in sticky luminous warm honey-chili caramel glaze blanketed abundantly with toasted white and black sesame seeds and fine scallion curls',
    aliases: ['crispy honey sesame chicken', 'honey sesame chicken', 'sesame honey chicken'],
    estimatedNutrition: { calories: 500, protein: 28, carbs: 42, fat: 24, servingGrams: 240 },
  },
  {
    normalizedName: 'prawn tempura',
    displayName: 'Prawn Tempura',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Stretched tiger prawns dipped in ice-cold airy tempura batter and deep-fried crisp, served with tentsuyu dipping sauce and grated daikon.',
    visualPrompt:
      'four long straight crisp pale-golden lacy batter-crusted tail-on Tiger Prawn Tempura arranged artfully on bamboo paper beside a porcelain dish of amber tentsuyu dipping broth and snowy mound of grated white daikon radish',
    aliases: ['prawn tempura', 'shrimp tempura', 'ebi tempura'],
    estimatedNutrition: { calories: 380, protein: 22, carbs: 32, fat: 18, servingGrams: 200 },
  },
  {
    normalizedName: 'assorted vegetable tempura',
    displayName: 'Assorted Vegetable Tempura',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Sweet potato, zucchini, broccoli, and shiitake mushrooms fried in light, lacy Japanese tempura batter.',
    visualPrompt:
      'crisp airy pale-gold lacy batter-coated Japanese Vegetable Tempura assortment featuring orange sweet potato rounds, green broccoli florets, zucchini planks, and shiitake mushroom caps beside amber tentsuyu dipping bowl',
    aliases: ['assorted vegetable tempura', 'veg tempura', 'japanese vegetable tempura'],
    estimatedNutrition: { calories: 340, protein: 7, carbs: 44, fat: 15, servingGrams: 220 },
  },
  {
    normalizedName: 'dynamite rock shrimp',
    displayName: 'Dynamite Rock Shrimp',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Contemporary Japanese-Peruvian',
    generalizedDescription:
      'Crispy batter-fried bite-sized shrimp tossed in a creamy, spicy sriracha-mayo sauce and served in a martini glass.',
    visualPrompt:
      'chilled stemmed wide crystal martini cocktail dish lined with crisp shredded cabbage overflowing cleanly with glossy tempura popcorn rock shrimp bathed in bright coral creamy spicy sriracha-mayo topped with black sesame and chives',
    aliases: ['dynamite rock shrimp', 'rock shrimp tempura', 'bang bang dynamite shrimp'],
    estimatedNutrition: { calories: 470, protein: 21, carbs: 30, fat: 30, servingGrams: 210 },
  },
  {
    normalizedName: 'chicken yakitori skewers',
    displayName: 'Chicken Yakitori Skewers',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese Robata',
    generalizedDescription:
      'Japanese charcoal-grilled chicken thigh and scallion skewers glazed repeatedly with sweet-savory tare sauce.',
    visualPrompt:
      'three neat flat bamboo skewers threaded alternately with blistered mahogany-glazed juicy grilled chicken thigh chunks and charred green-and-white scallion sections lacquered cleanly with sweet soy tare and sesame on dark slate',
    aliases: ['chicken yakitori skewers', 'chicken yakitori', 'negima yakitori skewers'],
    estimatedNutrition: { calories: 350, protein: 30, carbs: 14, fat: 19, servingGrams: 210 },
  },
  {
    normalizedName: 'indonesian chicken satay',
    displayName: 'Indonesian Chicken Satay',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indonesian / Southeast Asian',
    generalizedDescription:
      'Turmeric-and-lemongrass marinated chicken skewers grilled and served with a thick, chunky roasted peanut sauce.',
    visualPrompt:
      'four char-grilled bright golden turmeric-spiced Indonesian Chicken Satay skewers arranged crisply on a banana-leaf plate beside a small bowl of thick creamy chunky roasted peanut satay sauce garnished with crushed peanuts and lime wedge',
    aliases: ['indonesian chicken satay', 'chicken satay peanut sauce', 'sate ayam'],
    estimatedNutrition: { calories: 430, protein: 31, carbs: 18, fat: 26, servingGrams: 230 },
  },
  {
    normalizedName: 'gua bao crispy paneer tofu',
    displayName: 'Gua Bao – Crispy Paneer / Tofu',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Taiwanese / Modern Asian Café',
    generalizedDescription:
      'Fluffy steamed lotus-leaf buns stuffed with Korean gochujang-glazed crispy paneer, pickled cucumber, and scallions.',
    visualPrompt:
      'two pillowy snow-white open-folded steamed clamshell Gua Bao buns stuffed neatly with glossy crimson gochujang-glazed crispy golden paneer slabs, crisp green pickled cucumber ribbons, roasted sesame, and fresh scallions',
    aliases: ['gua bao crispy paneer tofu', 'paneer gua bao', 'tofu gua bao', 'paneer bao', 'crispy tofu bao bun', 'veg gua bao'],
    estimatedNutrition: { calories: 450, protein: 16, carbs: 50, fat: 20, servingGrams: 220 },
  },
  {
    normalizedName: 'gua bao teriyaki glazed chicken',
    displayName: 'Gua Bao – Teriyaki Glazed Chicken',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Taiwanese / Modern Asian Café',
    generalizedDescription:
      'Soft open steamed bao buns filled with crispy fried chicken, teriyaki glaze, spicy mayo, and shredded cabbage.',
    visualPrompt:
      'two fluffy snow-white clamshell steamed Gua Bao buns overflowing cleanly with crunchy dark-teriyaki glazed fried chicken cutlets, spicy pale-orange chili mayo drizzle, crisp shredded red cabbage, and toasted sesame seeds',
    aliases: ['gua bao teriyaki glazed chicken', 'chicken gua bao', 'chicken bao', 'teriyaki crispy chicken bao bun'],
    estimatedNutrition: { calories: 490, protein: 24, carbs: 52, fat: 21, servingGrams: 230 },
  },
  {
    normalizedName: 'char siu pork chicken bao',
    displayName: 'Char Siu Pork / Chicken Bao',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Cantonese Dim Sum',
    generalizedDescription:
      'Closed, fluffy steamed white buns filled with sweet-and-savory Cantonese barbecue meat.',
    visualPrompt:
      'three plump cracked-top snow-white closed steamed Cha Siu Bao buns sitting inside a lined bamboo steamer with one opened softly revealing glossy sticky deep burgundy sweet barbecue meat filling inside',
    aliases: ['char siu pork chicken bao', 'char siu bao', 'steamed bbq bun'],
    estimatedNutrition: { calories: 410, protein: 18, carbs: 56, fat: 12, servingGrams: 210 },
  },
  {
    normalizedName: 'har gow prawn crystal dumpling',
    displayName: 'Har Gow (Prawn Crystal Dumpling)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Cantonese Dim Sum',
    generalizedDescription:
      'Traditional Cantonese translucent pleated dumplings filled with whole juicy shrimp and bamboo shoots.',
    visualPrompt:
      'four delicate crescent-shaped intricately 10-pleated translucent glossy white Har Gow shrimp dumplings revealing coral-pink whole prawn filling glowing faintly inside a warm bamboo dimsum steamer lined with cabbage leaf',
    aliases: ['har gow prawn crystal dumpling', 'har gow', 'prawn har gow dimsum'],
    estimatedNutrition: { calories: 220, protein: 16, carbs: 26, fat: 5, servingGrams: 160 },
  },
  {
    normalizedName: 'chicken chive sui mai',
    displayName: 'Chicken & Chive Sui Mai',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Cantonese Dim Sum',
    generalizedDescription:
      'Open-topped yellow wonton wrapper dumplings filled with minced chicken, shiitake mushrooms, and aromatic chives.',
    visualPrompt:
      'four bright sunny yellow fluted open-basket Sui Mai dumplings sitting neatly inside a wooden steamer crowned atop cleanly with juicy minced chicken-chive filling, tiny bright orange fish roe or carrot jewel dot, and green chive sprig',
    aliases: ['chicken chive sui mai', 'sui mai', 'chicken siu mai', 'shumai dumplings'],
    estimatedNutrition: { calories: 270, protein: 18, carbs: 28, fat: 9, servingGrams: 170 },
  },
  {
    normalizedName: 'edamame truffle moneybags',
    displayName: 'Edamame & Truffle Moneybags',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Contemporary Asian',
    generalizedDescription:
      'Delicate dumpling wrappers tied like pouches around a creamy puree of green edamame beans and white truffle oil.',
    visualPrompt:
      'four charming delicate translucent white pouch-shaped steamed dumplings pinched gracefully at the neck with bright green chive ribbons revealing smooth vibrant emerald edamame truffle mousse inside a bamboo steamer',
    aliases: ['edamame truffle moneybags', 'edamame money bags', 'truffle edamame dimsum'],
    estimatedNutrition: { calories: 240, protein: 11, carbs: 28, fat: 9, servingGrams: 165 },
  },
  {
    normalizedName: 'chilli oil wontons',
    displayName: 'Chilli Oil Wontons',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Sichuan',
    generalizedDescription:
      'Delicate boiled chicken or vegetable wontons swimming in a pool of aromatic Sichuan chili oil, black vinegar, and sesame.',
    visualPrompt:
      'five silky translucent boiled square-tail wontons bathing inside a shallow white ceramic dish gleaming with vibrant fiery red Sichuan chili crisp oil, toasted sesame seeds, crushed garlic, dark vinegar, and crisp scallions',
    aliases: ['chilli oil wontons', 'sichuan chili wontons', 'hong you chao shou'],
    estimatedNutrition: { calories: 360, protein: 15, carbs: 36, fat: 17, servingGrams: 220 },
  },
  {
    normalizedName: 'pan-fried pork chicken potstickers',
    displayName: 'Pan-Fried Pork / Chicken Potstickers',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Chinese / Japanese Gyoza',
    generalizedDescription:
      'Dumplings steamed and seared in a skillet until the bottoms form a crisp, golden lacy skirt.',
    visualPrompt:
      'six crescent-pleated dumplings inverted cleanly on a long dark slate dish revealing a breathtaking fragile paper-thin deeply golden-brown crispy lacy starch skirt connecting the seared bottoms beside dark soy-vinegar dipping saucer',
    aliases: ['pan-fried pork chicken potstickers', 'potstickers', 'crispy skirt potsticker dumplings'],
    estimatedNutrition: { calories: 340, protein: 16, carbs: 38, fat: 13, servingGrams: 200 },
  },
  {
    normalizedName: 'california uramaki sushi roll',
    displayName: 'California Uramaki Sushi Roll',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese / Contemporary Sushi',
    generalizedDescription:
      'Inside-out sushi roll with crabstick, avocado, and cucumber, coated in orange tobiko (flying fish roe) or sesame.',
    visualPrompt:
      'eight neat slices of rice-on-the-outside California Uramaki sushi roll coated brilliantly with sparkling bright orange tobiko roe and sesame showing crisp core of sweet crabstick, creamy green avocado, and cool cucumber beside pickled ginger and wasabi',
    aliases: ['california uramaki sushi roll', 'california sushi roll', 'crab avocado uramaki'],
    estimatedNutrition: { calories: 340, protein: 12, carbs: 46, fat: 11, servingGrams: 220 },
  },
  {
    normalizedName: 'crispy asparagus tempura roll',
    displayName: 'Crispy Asparagus Tempura Roll',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Contemporary Vegetarian Sushi',
    generalizedDescription:
      'Vegetarian sushi roll filled with crunchy tempura-fried asparagus spears and cream cheese, drizzled with spicy mayo.',
    visualPrompt:
      'eight clean uramaki sushi pieces wrapped in white sushi rice and roasted sesame showcasing crunchy tempura-battered emerald green asparagus tips, creamy white Philadelphia cheese core, spicy coral mayo zigzag drizzle, and tempura crunch flakes',
    aliases: ['crispy asparagus tempura roll', 'asparagus tempura sushi', 'veg tempura roll'],
    estimatedNutrition: { calories: 370, protein: 8, carbs: 50, fat: 15, servingGrams: 220 },
  },
  {
    normalizedName: 'spicy salmon roll',
    displayName: 'Spicy Salmon Roll',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese Sushi',
    generalizedDescription:
      'Nori and sushi rice rolled around fresh Norwegian salmon tossed in sriracha mayo, topped with tempura crunch.',
    visualPrompt:
      'eight pristine Spicy Salmon Uramaki sushi medallions brimming with diced glistening salmon tossed in coral sriracha mayo and avocado, dusted heavily on top with crispy golden tanuki tempura crunch flakes beside wasabi leaf and soy dish',
    aliases: ['spicy salmon roll', 'spicy salmon uramaki', 'crunchy spicy salmon sushi'],
    estimatedNutrition: { calories: 410, protein: 19, carbs: 42, fat: 18, servingGrams: 220 },
  },
  {
    normalizedName: 'ebi prawn tempura dragon roll',
    displayName: 'Ebi Prawn Tempura Dragon Roll',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Contemporary Sushi Bar',
    generalizedDescription:
      'Sushi roll stuffed with crispy prawn tempura and cucumber, draped on top with thinly sliced avocado and unagi sauce.',
    visualPrompt:
      'dramatic Dragon Sushi Roll lined seamlessly on an oblong matte black plate shingled gracefully on top with vibrant emerald overlapping avocado scales, glossy dark unagi glaze ribbons, crisp tempura prawn tail protruding at one end, and orange tobiko',
    aliases: ['ebi prawn tempura dragon roll', 'dragon sushi roll', 'prawn tempura avocado roll'],
    estimatedNutrition: { calories: 460, protein: 16, carbs: 52, fat: 21, servingGrams: 245 },
  },
  {
    normalizedName: 'avocado cream cheese maki',
    displayName: 'Avocado & Cream Cheese Maki',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese Sushi',
    generalizedDescription:
      'Simple, creamy vegetarian sushi roll filled with ripe Hass avocado and Philadelphia cream cheese.',
    visualPrompt:
      'six sleek crisp nori-wrapped white sushi rice Avocado & Cream Cheese Maki pieces showcasing rich bright emerald Hass avocado crescent pressed beside smooth ivory Philadelphia cream cheese in a clean minimalist wooden sushi board',
    aliases: ['avocado cream cheese maki', 'philly avocado maki', 'cream cheese avocado sushi'],
    estimatedNutrition: { calories: 310, protein: 8, carbs: 38, fat: 14, servingGrams: 180 },
  },
  {
    normalizedName: 'salmon nigiri',
    displayName: 'Salmon Nigiri',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Traditional Japanese',
    generalizedDescription:
      'Hand-pressed ovals of vinegared sushi rice topped with a slice of raw, buttery Atlantic salmon and a dab of wasabi.',
    visualPrompt:
      'four sculpted hand-formed ovals of pearl-white sushi rice draped gracefully with silky bright coral-orange marbled sashimi-grade fresh Atlantic salmon fillets brushed cleanly with light soy glaze beside fresh pickled ginger and wasabi peak',
    aliases: ['salmon nigiri', 'sake nigiri', 'fresh salmon sushi nigiri'],
    estimatedNutrition: { calories: 280, protein: 18, carbs: 32, fat: 8, servingGrams: 160 },
  },
  {
    normalizedName: 'hawaiian salmon tofu poke bowl',
    displayName: 'Hawaiian Salmon / Tofu Poke Bowl',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Hawaiian-Japanese Contemporary',
    generalizedDescription:
      'Sushi rice base topped with marinated raw salmon or tofu, edamame, avocado, seaweed salad, mango, and ponzu dressing.',
    visualPrompt:
      'colorful deep ceramic Poke Bowl neatly arranged in bright distinct quadrants over seasoned sushi rice: soy-sesame cubes of fresh glistening coral salmon, emerald shelled edamame beans, fanned green avocado, wakame seaweed salad, sunny golden mango dices, radish coins, and black sesame',
    aliases: ['hawaiian salmon tofu poke bowl', 'poke bowl', 'salmon poke bowl', 'tofu poke bowl'],
    estimatedNutrition: { calories: 560, protein: 30, carbs: 64, fat: 19, servingGrams: 390 },
  },
  {
    normalizedName: 'pad thai noodles',
    displayName: 'Pad Thai Noodles',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Thai',
    generalizedDescription:
      'Stir-fried flat rice noodles tossed with tamarind pulp, palm sugar, tofu, bean sprouts, scrambled egg, and crushed peanuts.',
    visualPrompt:
      'steaming glossy amber-tamarind flat rice Pad Thai noodles in a shallow ceramic plate folded cleanly with golden tofu cubes, curly prawns, crisp white bean sprouts, garlic chives, crowned side-by-side with roasted crushed peanuts, chili flakes, and fresh lime wedge',
    aliases: ['pad thai noodles', 'pad thai', 'thai tamarind rice noodles'],
    estimatedNutrition: { calories: 580, protein: 22, carbs: 74, fat: 21, servingGrams: 350 },
  },
  {
    normalizedName: 'veg hakka noodles',
    displayName: 'Veg Hakka Noodles',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese Café',
    generalizedDescription:
      'Wok-tossed boiled wheat noodles stir-fried on high flame with julienned cabbage, carrots, capsicum, and light soy sauce.',
    visualPrompt:
      'fluffy smoky wok-tossed golden-beige Hakka wheat noodles mounded nicely in a white bowl tangled cleanly with crunchy bright green capsicum strips, julienned orange carrots, shredded cabbage, and emerald scallion curls',
    aliases: ['veg hakka noodles', 'hakka noodles', 'vegetable chow mein'],
    estimatedNutrition: { calories: 470, protein: 11, carbs: 72, fat: 15, servingGrams: 330 },
  },
  {
    normalizedName: 'chilli garlic noodles',
    displayName: 'Chilli Garlic Noodles',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese / Sichuan',
    generalizedDescription:
      'Spicy street-style wok noodles infused with burnt garlic, crushed red chilies, and spring onion greens.',
    visualPrompt:
      'vibrant glossy red-orange spicy Chilli Garlic Noodles studded generously throughout with golden fried crisp minced garlic flakes, crushed chili flakes, sliced bell peppers, purple cabbage ribbons, and fresh spring onion greens',
    aliases: ['chilli garlic noodles', 'burnt garlic chili noodles', 'spicy garlic chow mein'],
    estimatedNutrition: { calories: 510, protein: 11, carbs: 73, fat: 18, servingGrams: 340 },
  },
  {
    normalizedName: 'singapore curry rice noodles',
    displayName: 'Singapore Curry Rice Noodles',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Singaporean / Cantonese',
    generalizedDescription:
      'Thin rice vermicelli stir-fried with madras curry powder, bell peppers, sprouts, and shrimp or chicken.',
    visualPrompt:
      'bright sunny saffron-yellow delicate thin rice vermicelli noodles Singapore Mei Fun stir-fried neatly with tender shrimp, julienned red and green bell peppers, crisp bean sprouts, scrambled egg shreds, and scallions',
    aliases: ['singapore curry rice noodles', 'singapore noodles', 'curry vermicelli noodles'],
    estimatedNutrition: { calories: 530, protein: 22, carbs: 68, fat: 18, servingGrams: 340 },
  },
  {
    normalizedName: 'dan dan noodles',
    displayName: 'Dan Dan Noodles',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Sichuan Chinese',
    generalizedDescription:
      'Sichuan wheat noodles topped with spicy chili oil, preserved vegetables, peanut-sesame paste, and minced meat or mushrooms.',
    visualPrompt:
      'ceramic noodle bowl showing springy pale wheat Dan Dan noodles resting over creamy toasted peanut-sesame chili oil puddle crowned dynamically with dark savory braised minced mushrooms or meat, crisp preserved greens, bok choy, crushed peanuts, and scallions',
    aliases: ['dan dan noodles', 'sichuan dan dan mian', 'spicy sesame peanut noodles'],
    estimatedNutrition: { calories: 590, protein: 21, carbs: 64, fat: 28, servingGrams: 350 },
  },
  {
    normalizedName: 'japanese yakisoba',
    displayName: 'Japanese Yakisoba',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Japanese',
    generalizedDescription:
      'Stir-fried buckwheat-style noodles tossed with cabbage, carrots, and a tangy Worcestershire-based yakisoba sauce.',
    visualPrompt:
      'glossy dark mahogany Japanese Yakisoba stir-fried chewy noodles tossed with crisp green cabbage squares, carrot shreds, pork or chicken strips, topped cleanly with snowy bonito or pickled pink beni shoga ginger strands and aonori green seaweed flakes',
    aliases: ['japanese yakisoba', 'yakisoba noodles', 'stir fried yakisoba'],
    estimatedNutrition: { calories: 520, protein: 19, carbs: 68, fat: 18, servingGrams: 330 },
  },
  {
    normalizedName: 'korean japchae glass noodles',
    displayName: 'Korean Japchae (Glass Noodles)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Korean',
    generalizedDescription:
      'Sweet potato starch noodles stir-fried in sesame oil with spinach, carrots, mushrooms, and sweet soy sauce.',
    visualPrompt:
      'glistening translucent amber-brown sweet potato dangmyeon glass noodles Korean Japchae tossed beautifully with emerald spinach ribbons, shredded orange carrots, dark sliced shiitake mushrooms, thin yellow egg omelet strips, and white toasted sesame seeds',
    aliases: ['korean japchae glass noodles', 'japchae', 'korean glass noodles'],
    estimatedNutrition: { calories: 430, protein: 11, carbs: 66, fat: 14, servingGrams: 310 },
  },
  {
    normalizedName: 'classic veg chicken fried rice',
    displayName: 'Classic Veg / Chicken Fried Rice',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese / Pan-Asian',
    generalizedDescription:
      'Wok-tossed long-grain rice with finely diced carrots, French beans, scallions, and smoky wok-hei aroma.',
    visualPrompt:
      'mound of glossy separated wok-hei fragrant long-grain white-and-light-soy Fried Rice studded uniformly with bright orange carrot dices, crisp green French beans, sweet golden corn, green peas, and sliced emerald scallion rings in a ceramic bowl',
    aliases: ['classic veg chicken fried rice', 'classic fried rice', 'veg fried rice', 'chicken fried rice'],
    estimatedNutrition: { calories: 480, protein: 16, carbs: 68, fat: 15, servingGrams: 330 },
  },
  {
    normalizedName: 'schezwan triple fried rice',
    displayName: 'Schezwan Triple Fried Rice',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Mumbai Indo-Chinese Street Bistro',
    generalizedDescription:
      'Indo-Chinese meal combining fried rice, crispy noodles, and spicy red Manchurian-Schezwan gravy on one plate.',
    visualPrompt:
      'abundant vibrant red spicy Schezwan Fried Rice mounded beside a golden crisp fried noodle nest and rich deep crimson Manchurian vegetable gravy topped with a sunny-side-up omelet garnish and chopped scallions',
    aliases: ['schezwan triple fried rice', 'triple schezwan rice', 'triple fried rice'],
    estimatedNutrition: { calories: 740, protein: 18, carbs: 98, fat: 30, servingGrams: 460 },
  },
  {
    normalizedName: 'burnt garlic fried rice',
    displayName: 'Burnt Garlic Fried Rice',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indo-Chinese / Asian Café',
    generalizedDescription:
      'Fragrant jasmine rice stir-fried with golden-brown crispy garlic chips and butter.',
    visualPrompt:
      'fluffy steaming glistening jasmine Burnt Garlic Fried Rice inside a matte ceramic bowl lavishly topped right across the peak with crisp deep golden-amber fried garlic chips, butter sheen, and delicate green scallion threads',
    aliases: ['burnt garlic fried rice', 'crispy garlic fried rice', 'roasted garlic wok rice'],
    estimatedNutrition: { calories: 460, protein: 10, carbs: 66, fat: 16, servingGrams: 310 },
  },
  {
    normalizedName: 'nasi goreng indonesian fried rice',
    displayName: 'Nasi Goreng (Indonesian Fried Rice)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Indonesian',
    generalizedDescription:
      'Spiced sweet-soy (kecap manis) and shrimp-paste fried rice served with a sunny-side-up fried egg, satay skewers, and prawn crackers.',
    visualPrompt:
      'deep mahogany kecap manis caramelized Indonesian Nasi Goreng rice mound crowned neatly with a bright marigold sunny-side-up fried egg beside two grilled chicken satay skewers, pale crispy kerupuk prawn crackers, cucumber slices, and red chili rings',
    aliases: ['nasi goreng indonesian fried rice', 'nasi goreng', 'indonesian fried rice satay'],
    estimatedNutrition: { calories: 670, protein: 27, carbs: 74, fat: 29, servingGrams: 400 },
  },
  {
    normalizedName: 'korean bibimbap stone bowl',
    displayName: 'Korean Bibimbap Stone Bowl',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Korean',
    generalizedDescription:
      'Warm rice bowl topped with sautéed seasoned vegetables, gochujang chili paste, kimchi, and a fried egg.',
    visualPrompt:
      'heavy sizzling dark Korean dolsot stone pot holding steamed white rice radially crowned in crisp colorful wedges of bright green spinach, orange carrots, white bean sprouts, brown mushrooms, purple cabbage, kimchi, spicy red gochujang sauce swirl, and centered glossy egg',
    aliases: ['korean bibimbap stone bowl', 'bibimbap', 'dolsot bibimbap rice bowl'],
    estimatedNutrition: { calories: 590, protein: 22, carbs: 78, fat: 20, servingGrams: 420 },
  },
  {
    normalizedName: 'thai basil chicken pad kra pao',
    displayName: 'Thai Basil Chicken (Pad Kra Pao)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Thai Street Classic',
    generalizedDescription:
      'Finely minced chicken wok-fried with holy basil, garlic, bird\'s eye chilies, and oyster sauce, served with jasmine rice and a fried egg.',
    visualPrompt:
      'clean plate holding glossy caramelized minced chicken tossed with wilted dark green holy basil leaves, red Thai chili slices, and yardlong beans beside molded snow-white steamed jasmine rice crowned with a crisp lacy-edged sunny-side-up fried egg',
    aliases: ['thai basil chicken pad kra pao', 'pad kra pao', 'thai hot basil chicken rice'],
    estimatedNutrition: { calories: 580, protein: 34, carbs: 58, fat: 23, servingGrams: 360 },
  },
  {
    normalizedName: 'kung pao chicken paneer',
    displayName: 'Kung Pao Chicken / Paneer',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Sichuan Chinese',
    generalizedDescription:
      'Wok-tossed cubes of chicken or paneer with dried red chilies, Sichuan peppercorns, bell peppers, and roasted peanuts in a sweet-sour-spicy glaze.',
    visualPrompt:
      'glossy caramel-crimson glazed diced chicken or paneer cubes tossed vibrantly with shiny dark roasted dried red chilies, crisp emerald diced green bell peppers, toasted crunchy whole peanuts, scallions, and sesame inside a shallow ceramic bowl',
    aliases: ['kung pao chicken paneer', 'kung pao chicken', 'kung pao paneer', 'kong pao chicken'],
    estimatedNutrition: { calories: 510, protein: 28, carbs: 28, fat: 32, servingGrams: 290 },
  },
  {
    normalizedName: 'general tsos chicken',
    displayName: 'General Tso’s Chicken',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Chinese-American Bistro',
    generalizedDescription:
      'Crispy battered chicken chunks tossed in a sweet, tangy, and slightly spicy dark ginger-garlic sauce with steamed broccoli.',
    visualPrompt:
      'crunchy golden battered chicken morsels coated luxuriously in rich dark glistening sweet-spicy ginger-garlic glaze surrounded neatly on a ceramic plate by vibrant emerald blanched broccoli florets, whole dried red chilies, and white sesame seeds',
    aliases: ['general tsos chicken', 'general tso chicken', 'sweet spicy crispy ginger chicken'],
    estimatedNutrition: { calories: 560, protein: 29, carbs: 46, fat: 28, servingGrams: 300 },
  },
  {
    normalizedName: 'exotic vegetables in black bean sauce',
    displayName: 'Exotic Vegetables in Black Bean Sauce',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Cantonese Vegetarian',
    generalizedDescription:
      'Broccoli, baby corn, bok choy, and zucchini stir-fried in a savory fermented black soybean and garlic sauce.',
    visualPrompt:
      'glossy dark savory umami fermented black-bean garlic glaze enveloping vibrant colorful crisp stir-fried green broccoli crowns, golden sliced baby corn, emerald baby bok choy, red bell peppers, mushrooms, and water chestnuts in a bowl',
    aliases: ['exotic vegetables in black bean sauce', 'stir fry veg black bean sauce', 'mixed veggies black bean'],
    estimatedNutrition: { calories: 290, protein: 9, carbs: 29, fat: 15, servingGrams: 300 },
  },
  {
    normalizedName: 'massaman curry',
    displayName: 'Massaman Curry',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Southern Thai',
    generalizedDescription:
      'Mild, rich Southern Thai coconut curry infused with cardamom, cinnamon, star anise, potatoes, and roasted peanuts.',
    visualPrompt:
      'warm velvety deep burnt-ochre coconut Thai Massaman Curry cradling tender braised baby potatoes, sweet caramelized onion wedges, crunchy golden roasted peanuts, subtle cinnamon bark stick, and star anise beside steamed jasmine rice',
    aliases: ['massaman curry', 'thai massaman peanut curry', 'coconut massaman curry'],
    estimatedNutrition: { calories: 570, protein: 18, carbs: 46, fat: 36, servingGrams: 360 },
  },
  {
    normalizedName: 'korean fried chicken yangnyeom',
    displayName: 'Korean Fried Chicken (Yangnyeom)',
    category: 'Pan-Asian, Sushi, Bao & Dim Sum',
    cuisine: 'Korean Bistro',
    generalizedDescription:
      'Double-fried extra-crispy chicken pieces coated in a sticky, sweet, and spicy red gochujang-garlic glaze.',
    visualPrompt:
      'stack of glossy crunchy double-fried Yangnyeom Korean Fried Chicken wing-and-drumstick pieces gleaming thickly with vibrant deep ruby gochujang-honey garlic glaze coated cleanly with toasted white sesame seeds and crushed peanuts beside white pickled radish cubes',
    aliases: ['korean fried chicken yangnyeom', 'korean fried chicken', 'yangnyeom chicken', 'gochujang fried chicken'],
    estimatedNutrition: { calories: 610, protein: 32, carbs: 38, fat: 36, servingGrams: 290 },
  },
];

