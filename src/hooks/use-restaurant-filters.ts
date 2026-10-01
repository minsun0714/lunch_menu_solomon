'use client';

import { useMemo, useState } from 'react';
import { filterAndSortRestaurants, RestaurantSort } from '@/lib/restaurant-list';
import { Restaurant, RestaurantCategory, RESTAURANT_CATEGORIES } from '@/types/restaurant';

export type CategoryFilter = '전체' | RestaurantCategory;

export const CATEGORY_FILTERS: CategoryFilter[] = ['전체', ...RESTAURANT_CATEGORIES];

export const SORT_OPTIONS: { value: RestaurantSort; label: string }[] = [
  { value: 'rating', label: '별점 높은 순 ★' },
  { value: 'reviews', label: '리뷰 많은 순 💬' },
  { value: 'latest', label: '최신 등록 순 🕒' },
  { value: 'name', label: '식당 이름 순 가' },
];

export function useRestaurantFilters(restaurants: Restaurant[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('전체');
  const [sortBy, setSortBy] = useState<RestaurantSort>('rating');

  const filteredRestaurants = useMemo(
    () => filterAndSortRestaurants(restaurants, { query: searchQuery.trim(), category: selectedCategory, sort: sortBy }),
    [restaurants, selectedCategory, searchQuery, sortBy],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryFilter, number>([['전체', restaurants.length]]);
    for (const restaurant of restaurants) counts.set(restaurant.category, (counts.get(restaurant.category) ?? 0) + 1);
    return counts;
  }, [restaurants]);

  return {
    searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, sortBy, setSortBy,
    filteredRestaurants, categoryCounts,
  };
}
