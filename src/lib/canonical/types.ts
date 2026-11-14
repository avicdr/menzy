export type CanonicalGalleryCategory =
  | 'Cold Coffee'
  | 'Shakes'
  | 'Mojitos'
  | 'Pasta'
  | 'Wraps'
  | 'Momos'
  | 'Sandwiches'
  | 'Snacks'
  | 'Pizza'
  | 'Tea & Bun'
  | 'Maggi'
  | 'Burgers'
  | 'Hot & Iced Coffees'
  | 'Teas, Matcha & Hot Infusions'
  | 'Shakes, Smoothies, Juices & Mocktails'
  | 'All-Day Breakfast, Eggs & Toast'
  | 'Artisanal Breads, Croissants & Savory Bakes'
  | 'Sandwiches, Paninis, Burgers & Wraps'
  | 'Small Plates, Fries, Nachos & Starters'
  | 'Pizzas & Pastas'
  | 'Global Bowls, Salads, Sizzlers & Cafe Mains'
  | 'Cakes, Pastries, Cookies & Confectionery'
  | 'Awadhi, Mughlai & Lucknowi Kitchen Classics'
  | 'North Indian, Tandoor & Punjabi Bistro Classics'
  | 'Indian Street Food, Chaat & South Indian Cafe Fare'
  | 'Pan-Asian, Sushi, Bao & Dim Sum'
  | 'Continental, Mediterranean, Mexican & Pub Grub'
  | 'Patisserie, Global Desserts & Frozen Treats'
  | 'Artisanal Cocktails, Craft Brews, Sangrias & Specialty Drinks';

export const CANONICAL_CATEGORY_ORDER: CanonicalGalleryCategory[] = [
  'Cold Coffee',
  'Shakes',
  'Mojitos',
  'Pasta',
  'Wraps',
  'Momos',
  'Sandwiches',
  'Snacks',
  'Pizza',
  'Tea & Bun',
  'Maggi',
  'Burgers',
  'Hot & Iced Coffees',
  'Teas, Matcha & Hot Infusions',
  'Shakes, Smoothies, Juices & Mocktails',
  'All-Day Breakfast, Eggs & Toast',
  'Artisanal Breads, Croissants & Savory Bakes',
  'Sandwiches, Paninis, Burgers & Wraps',
  'Small Plates, Fries, Nachos & Starters',
  'Pizzas & Pastas',
  'Global Bowls, Salads, Sizzlers & Cafe Mains',
  'Cakes, Pastries, Cookies & Confectionery',
  'Awadhi, Mughlai & Lucknowi Kitchen Classics',
  'North Indian, Tandoor & Punjabi Bistro Classics',
  'Indian Street Food, Chaat & South Indian Cafe Fare',
  'Pan-Asian, Sushi, Bao & Dim Sum',
  'Continental, Mediterranean, Mexican & Pub Grub',
  'Patisserie, Global Desserts & Frozen Treats',
  'Artisanal Cocktails, Craft Brews, Sangrias & Specialty Drinks',
];

export interface CanonicalNutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams?: number;
}

export interface CanonicalCatalogItem {
  normalizedName: string;
  displayName: string;
  category: CanonicalGalleryCategory;
  cuisine: string;
  generalizedDescription: string;
  visualPrompt: string;
  aliases: string[];
  estimatedNutrition: CanonicalNutritionEstimate;
}
