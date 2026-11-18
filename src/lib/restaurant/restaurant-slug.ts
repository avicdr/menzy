export const MAX_RESTAURANT_SLUG_LENGTH = 80;

export function normalizeRestaurantSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_RESTAURANT_SLUG_LENGTH)
    .replace(/-+$/g, '');
}

