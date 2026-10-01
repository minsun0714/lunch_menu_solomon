import { CreateRestaurantInput, CreateReviewInput, Restaurant } from '@/types/restaurant';
import { apiRequest } from './api-client';

export function fetchRestaurants(): Promise<Restaurant[]> {
  return apiRequest<Restaurant[]>('/api/restaurants', { fallbackError: '식당 목록을 불러오지 못했습니다.' });
}

export function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  return apiRequest<Restaurant>('/api/restaurants', { method: 'POST', body: input, fallbackError: '식당 등록 실패' });
}

export function updateRestaurant(id: string, input: CreateRestaurantInput): Promise<Restaurant> {
  return apiRequest<Restaurant>(`/api/restaurants/${id}`, { method: 'PUT', body: input, fallbackError: '식당 정보 수정 실패' });
}

export function deleteRestaurant(id: string): Promise<void> {
  return apiRequest(`/api/restaurants/${id}`, { method: 'DELETE', fallbackError: '식당 삭제 실패' });
}

export function addReview(restaurantId: string, input: CreateReviewInput) {
  return apiRequest(`/api/restaurants/${restaurantId}/reviews`, { method: 'POST', body: input, fallbackError: '리뷰 등록 실패' });
}

export function deleteReview(restaurantId: string, reviewId: string): Promise<void> {
  return apiRequest(`/api/restaurants/${restaurantId}/reviews/${reviewId}`, { method: 'DELETE', fallbackError: '리뷰 삭제 실패' });
}
