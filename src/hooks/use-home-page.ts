'use client';

import { useMemo, useState } from 'react';
import { useRestaurantFilters } from '@/hooks/use-restaurant-filters';
import { useRestaurants } from '@/hooks/use-restaurants';
import { useTeamSettings } from '@/hooks/use-team-settings';
import { notifier } from '@/services/notifier';
import { CreateRestaurantInput, CreateReviewInput, Restaurant } from '@/types/restaurant';

export function useHomePage() {
  const data = useRestaurants();
  const { settings: teamSettings, loadError: settingsError } = useTeamSettings();
  const filters = useRestaurantFilters(data.restaurants);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [detailRestaurantId, setDetailRestaurantId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [isRandomOpen, setIsRandomOpen] = useState(false);

  const detailRestaurant = useMemo(
    () => data.restaurants.find((restaurant) => restaurant.id === detailRestaurantId) ?? null,
    [data.restaurants, detailRestaurantId],
  );
  const totalReviewsCount = useMemo(
    () => data.restaurants.reduce((sum, restaurant) => sum + restaurant.reviewCount, 0),
    [data.restaurants],
  );

  const closeRestaurantForm = () => {
    setIsCreateOpen(false);
    setEditingRestaurant(null);
  };

  async function submitRestaurant(input: CreateRestaurantInput) {
    if (editingRestaurant) {
      await data.update(editingRestaurant.id, input);
      notifier.success('식당 정보가 수정되었습니다.');
    } else {
      await data.create(input);
      notifier.success('새 식당이 성공적으로 등록되었습니다!');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await data.remove(deleteTarget.id);
      if (detailRestaurantId === deleteTarget.id) setDetailRestaurantId(null);
      setDeleteTarget(null);
      notifier.success('식당이 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      notifier.error('식당 삭제 중 오류가 발생했습니다.');
    }
  }

  async function addReview(restaurantId: string, input: CreateReviewInput) {
    await data.addReview(restaurantId, input);
    notifier.success('리뷰가 등록되었습니다!');
  }

  async function deleteReview(restaurantId: string, reviewId: string) {
    await data.removeReview(restaurantId, reviewId);
    notifier.success('리뷰가 삭제되었습니다.');
  }

  return {
    teamSettings,
    restaurants: data.restaurants,
    isLoading: data.isLoading,
    loadError: data.loadError || settingsError,
    totalReviewsCount,
    filters,
    randomPool: filters.filteredRestaurants.length > 0 ? filters.filteredRestaurants : data.restaurants,
    isRestaurantFormOpen: isCreateOpen || !!editingRestaurant,
    editingRestaurant,
    detailRestaurant,
    deleteTarget,
    isRandomOpen,
    openCreateForm: () => setIsCreateOpen(true),
    openEditForm: setEditingRestaurant,
    closeRestaurantForm,
    openDetail: (restaurant: Restaurant) => setDetailRestaurantId(restaurant.id),
    closeDetail: () => setDetailRestaurantId(null),
    editFromDetail: (restaurant: Restaurant) => {
      setDetailRestaurantId(null);
      setEditingRestaurant(restaurant);
    },
    requestDelete: setDeleteTarget,
    cancelDelete: () => setDeleteTarget(null),
    openRandom: () => setIsRandomOpen(true),
    closeRandom: () => setIsRandomOpen(false),
    submitRestaurant,
    confirmDelete,
    addReview,
    deleteReview,
  };
}
