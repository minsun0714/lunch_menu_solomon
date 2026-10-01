import { Restaurant } from '@/types/restaurant';

export type RestaurantSort = 'latest' | 'rating' | 'reviews' | 'name';

export interface RestaurantListOptions {
  query?: string;
  category?: string;
  sort?: string;
}

// Shared by the API and the browser so both list views filter and order restaurants identically.
export function filterAndSortRestaurants(restaurants: Restaurant[], { query = '', category = '', sort = 'latest' }: RestaurantListOptions): Restaurant[] {
  const q = query.toLowerCase();
  const result = restaurants.filter((restaurant) => {
    if (category && category !== '전체' && restaurant.category !== category) return false;
    return !q
      || restaurant.name.toLowerCase().includes(q)
      || restaurant.description.toLowerCase().includes(q)
      || restaurant.address.toLowerCase().includes(q);
  });
  if (sort === 'rating') return result.sort((a, b) => b.averageRating - a.averageRating);
  if (sort === 'reviews') return result.sort((a, b) => b.reviewCount - a.reviewCount);
  if (sort === 'name') return result.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
