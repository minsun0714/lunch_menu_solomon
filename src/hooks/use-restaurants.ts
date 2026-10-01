'use client';

import { useCallback, useEffect, useState } from 'react';
import * as restaurantApi from '@/services/restaurant-api';
import { CreateRestaurantInput, CreateReviewInput, Restaurant } from '@/types/restaurant';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Refreshes after a mutation; the list simply stays as-is when the refresh fails.
  const refresh = useCallback(async () => {
    try {
      setRestaurants(await restaurantApi.fetchRestaurants());
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await restaurantApi.fetchRestaurants();
        if (!ignore) setRestaurants(data);
      } catch (error) {
        console.error('Failed to load restaurants:', error);
        if (!ignore) setLoadError('식당 목록을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void load();
    return () => { ignore = true; };
  }, []);

  const create = useCallback(async (input: CreateRestaurantInput) => {
    await restaurantApi.createRestaurant(input);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, input: CreateRestaurantInput) => {
    await restaurantApi.updateRestaurant(id, input);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await restaurantApi.deleteRestaurant(id);
    await refresh();
  }, [refresh]);

  const addReview = useCallback(async (restaurantId: string, input: CreateReviewInput) => {
    await restaurantApi.addReview(restaurantId, input);
    await refresh();
  }, [refresh]);

  const removeReview = useCallback(async (restaurantId: string, reviewId: string) => {
    await restaurantApi.deleteReview(restaurantId, reviewId);
    await refresh();
  }, [refresh]);

  return { restaurants, isLoading, loadError, create, update, remove, addReview, removeReview };
}
