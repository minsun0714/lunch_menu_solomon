import { ApiError } from '@/server/errors';
import * as repository from '@/server/repositories/restaurant-repository';
import { filterAndSortRestaurants, RestaurantListOptions } from '@/lib/restaurant-list';
import { Restaurant, Review } from '@/types/restaurant';
import {
  PLACE_ADDRESS_MISMATCH,
  parseCreateRestaurantInput,
  parseCreateReviewInput,
  parseUpdateRestaurantInput,
} from './restaurant-validation';

export async function listRestaurants(options: RestaurantListOptions): Promise<Restaurant[]> {
  return filterAndSortRestaurants(await repository.getAllRestaurants(), options);
}

export async function getRestaurant(id: string): Promise<Restaurant> {
  const restaurant = await repository.getRestaurantById(id);
  if (!restaurant) throw new ApiError(404, '식당을 찾을 수 없습니다.');
  return restaurant;
}

export async function createRestaurant(body: unknown): Promise<Restaurant> {
  return repository.createRestaurant(parseCreateRestaurantInput(body));
}

export async function updateRestaurant(id: string, body: unknown): Promise<Restaurant> {
  const { input, place } = parseUpdateRestaurantInput(body);
  if (place) {
    const address = input.address ?? (await repository.getRestaurantById(id))?.address;
    if (address !== place.address) throw new ApiError(400, PLACE_ADDRESS_MISMATCH);
    input.place = place;
  }
  const updated = await repository.updateRestaurant(id, input);
  if (!updated) throw new ApiError(404, '식당을 찾을 수 없습니다.');
  return updated;
}

export async function deleteRestaurant(id: string): Promise<void> {
  if (!(await repository.deleteRestaurant(id))) throw new ApiError(404, '삭제할 식당을 찾을 수 없습니다.');
}

export async function addReview(restaurantId: string, body: unknown): Promise<Review> {
  const review = await repository.addReview(restaurantId, parseCreateReviewInput(body));
  if (!review) throw new ApiError(404, '해당 식당을 찾을 수 없습니다.');
  return review;
}

export async function deleteReview(restaurantId: string, reviewId: string): Promise<void> {
  if (!(await repository.deleteReview(restaurantId, reviewId))) {
    throw new ApiError(404, '삭제할 리뷰 또는 식당을 찾을 수 없습니다.');
  }
}
