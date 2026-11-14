export interface RealisticFoodAssetManifestItem {
  file: string;
  normalizedName: string;
  displayName: string;
  category: string;
  cuisine: string;
}

// The UUID filenames are kept as source identifiers; the importer writes human-readable
// slugs into object storage and stores this dish metadata alongside every image.
export const REALISTIC_FOOD_ASSET_MANIFEST: RealisticFoodAssetManifestItem[] = [
  ['006898b6-f026-4d84-a100-138ecf3eae1f.webp', 'mint mojito', 'Mint Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['0197ffc7-2b3b-43df-84d4-6df06b185cbb.webp', 'bun makhan masala with masala tea', 'Bun Makhan (Masala) with Masala Tea', 'Tea & Bun', 'Irani Café / Indian Street Food'],
  ['0f6b9cb8-7b0f-4c8c-b556-70d915270425.webp', 'white sauce pasta', 'White Sauce Pasta', 'Pasta', 'Italian / Continental'],
  ['1bd80069-7a42-42da-b1b3-7b54e36ac04a.webp', 'oreo shake', 'Oreo Shake', 'Shakes', 'Dessert / Shakes'],
  ['21014662-d2fa-4db3-abe8-20aa911b9425.webp', 'mac-n-cheese pasta', 'Mac-n-cheese Pasta', 'Pasta', 'Italian / Continental'],
  ['21d2f1eb-d6e5-4247-bcbb-2ff244f8875f.webp', 'masala french fries', 'Masala French Fries', 'Snacks', 'Fast Food / Finger Food'],
  ['23586559-a378-4b27-8a0a-16aae9b549b2.webp', 'oreo shake', 'Oreo Shake', 'Shakes', 'Dessert / Shakes'],
  ['2693786d-633e-47e3-9eaf-d76e8fd0cca4.webp', 'grilled paneer cheese sandwich', 'Grilled Paneer Cheese Sandwich', 'Sandwiches', 'Café / Indian Snack'],
  ['28066514-8431-4ff9-b1f3-b24d66db968e.webp', 'double cheese pizza', 'Double Cheese Pizza', 'Pizza', 'Italian / Pizza'],
  ['39f7609c-5e57-408b-85b5-bfc3e3196694.webp', 'mint mojito', 'Mint Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['4284a7f5-048b-4e9a-b810-c9e75f480a70.webp', 'hazelnut cold coffee', 'Hazelnut Cold Coffee', 'Cold Coffee', 'Café / Beverages'],
  ['49f57521-3a62-4bce-af7a-b1eca1a5974f.webp', 'strawberry mojito', 'Strawberry Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['50540b11-bee4-42b0-9e08-d3aeb371e563.webp', 'loaded cheese nachos', 'Loaded Cheese Nachos', 'Snacks', 'Mexican / Café Snacks'],
  ['571c49d7-19a6-467d-90b4-15d972430483.webp', 'grilled paneer tortilla', 'Grilled Paneer Tortilla', 'Wraps', 'Fusion / Mexican'],
  ['5bcf321f-641e-4cee-87bd-bf57f3b5c125.webp', 'grilled paneer tortilla', 'Grilled Paneer Tortilla', 'Wraps', 'Fusion / Mexican'],
  ['64251b37-e343-4b34-aed9-f28a130cba5a.webp', 'mint mojito', 'Mint Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['64622b51-821f-4b0a-bcc3-041fda43a9db.webp', 'lemon mint cooler', 'Lemon Mint Cooler', 'Mojitos', 'Beverages / Mocktails'],
  ['6ab3498b-6fd6-4b3c-8653-a7d63cd08a48.webp', 'grilled paneer cheese sandwich', 'Grilled Paneer Cheese Sandwich', 'Sandwiches', 'Café / Indian Snack'],
  ['6f89f39f-1b33-4cf1-8605-b157dc318e54.webp', 'white sauce pasta', 'White Sauce Pasta', 'Pasta', 'Italian / Continental'],
  ['6fedcc10-580e-42c7-b9eb-6412038d068d.webp', 'hazelnut cold coffee', 'Hazelnut Cold Coffee', 'Cold Coffee', 'Café / Beverages'],
  ['73648f09-56bd-4b4c-bea6-2f8d43806f27.webp', 'cheese maggi', 'Cheese Maggi', 'Maggi', 'Indian Street Food / Café'],
  ['8e887f76-0fa6-46bc-88e6-534e02132c04.webp', 'paneer momos', 'Paneer Momos', 'Momos', 'Tibetan / Himalayan'],
  ['908df799-a463-4abb-a9b7-dfea2bcac778.webp', 'blueberry mojito', 'Blueberry Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['98017ae1-281c-483b-a479-7421d4ae0017.webp', 'white sauce pasta', 'White Sauce Pasta', 'Pasta', 'Italian / Continental'],
  ['9f8c0fbe-71c9-4af6-a552-03cda9daa78b.webp', 'oreo shake', 'Oreo Shake', 'Shakes', 'Dessert / Shakes'],
  ['a3e2ebbe-698e-41b4-8ad2-0693da142d01.webp', 'grilled paneer cheese sandwich', 'Grilled Paneer Cheese Sandwich', 'Sandwiches', 'Café / Indian Snack'],
  ['a41226cb-8839-4b20-8f0a-e096b683f698.webp', 'double cheese pizza', 'Double Cheese Pizza', 'Pizza', 'Italian / Pizza'],
  ['aa8ec1d4-9790-4c90-b03e-492a69a0dd35.webp', 'mexican cheese burger', 'Mexican Cheese Burger', 'Burgers', 'Mexican / Fast Food'],
  ['acb51b0e-1168-4c40-91e1-f53aae9e624b.webp', 'orange mojito', 'Orange Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['ae4f735e-59fd-49e1-888e-947d3b9ca17d.webp', 'cheese maggi', 'Cheese Maggi', 'Maggi', 'Indian Street Food / Café'],
  ['b2c330b9-f871-42cf-b129-5ea7a9e0f6c8.webp', 'strawberry shake', 'Strawberry Shake', 'Shakes', 'Dessert / Shakes'],
  ['bd9cba0b-3ccd-4e5a-9583-b613ee834fb2.webp', 'berry mojito', 'Berry Mojito', 'Mojitos', 'Beverages / Mocktails'],
  ['d3491d15-f405-4d1a-9b5d-020402159b7d.webp', 'hazelnut cold coffee', 'Hazelnut Cold Coffee', 'Cold Coffee', 'Café / Beverages'],
  ['e2c55c7f-0144-443e-a2a9-f8c5c0bd91ec.webp', 'mexican cheese burger', 'Mexican Cheese Burger', 'Burgers', 'Mexican / Fast Food'],
  ['ede78d82-1cf6-437b-a9b3-b06583cf577b.webp', 'masala french fries', 'Masala French Fries', 'Snacks', 'Fast Food / Finger Food'],
  ['f641e69b-8ee9-4f79-b9f3-aac8186adbd2.webp', 'mexican cheese burger', 'Mexican Cheese Burger', 'Burgers', 'Mexican / Fast Food'],
].map(([file, normalizedName, displayName, category, cuisine]) => ({
  file,
  normalizedName,
  displayName,
  category,
  cuisine,
}));
