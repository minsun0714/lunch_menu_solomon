import fs from 'fs/promises';
import path from 'path';
import {
  Restaurant,
  CreateRestaurantInput,
  UpdateRestaurantInput,
  CreateReviewInput,
  Review,
} from '../types/restaurant';
import { INITIAL_RESTAURANTS } from '../data/initialRestaurants';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'restaurants.json');

async function ensureDataFile(): Promise<Restaurant[]> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data) as Restaurant[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // File doesn't exist or is invalid
  }

  // Fallback to initial seed data
  const initial = JSON.parse(JSON.stringify(INITIAL_RESTAURANTS)) as Restaurant[];
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial restaurants to disk:', err);
  }
  return initial;
}

async function saveDataFile(restaurants: Restaurant[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(restaurants, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save restaurants data:', err);
  }
}

function calculateRatingStats(reviews: Review[]): { averageRating: number; reviewCount: number } {
  if (!reviews || reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }
  const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;
  return { averageRating: avg, reviewCount: reviews.length };
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  return await ensureDataFile();
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const restaurants = await ensureDataFile();
  const found = restaurants.find((r) => r.id === id);
  return found || null;
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  const restaurants = await ensureDataFile();
  const now = new Date().toISOString();
  const newId = `rest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newRestaurant: Restaurant = {
    id: newId,
    name: input.name.trim(),
    category: input.category,
    address: input.address.trim(),
    phone: input.phone?.trim() || undefined,
    description: input.description.trim(),
    imageUrl: input.imageUrl?.trim() || undefined,
    priceRange: input.priceRange?.trim() || undefined,
    openingHours: input.openingHours?.trim() || undefined,
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newRestaurant, ...restaurants];
  await saveDataFile(updated);
  return newRestaurant;
}

export async function updateRestaurant(
  id: string,
  input: UpdateRestaurantInput
): Promise<Restaurant | null> {
  const restaurants = await ensureDataFile();
  const index = restaurants.findIndex((r) => r.id === id);
  if (index === -1) {
    return null;
  }

  const existing = restaurants[index];
  const now = new Date().toISOString();

  const updatedRestaurant: Restaurant = {
    ...existing,
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.address !== undefined && { address: input.address.trim() }),
    ...(input.phone !== undefined && { phone: input.phone.trim() || undefined }),
    ...(input.description !== undefined && { description: input.description.trim() }),
    ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl.trim() || undefined }),
    ...(input.priceRange !== undefined && { priceRange: input.priceRange.trim() || undefined }),
    ...(input.openingHours !== undefined && { openingHours: input.openingHours.trim() || undefined }),
    updatedAt: now,
  };

  restaurants[index] = updatedRestaurant;
  await saveDataFile(restaurants);
  return updatedRestaurant;
}

export async function deleteRestaurant(id: string): Promise<boolean> {
  const restaurants = await ensureDataFile();
  const filtered = restaurants.filter((r) => r.id !== id);
  if (filtered.length === restaurants.length) {
    return false;
  }
  await saveDataFile(filtered);
  return true;
}

export async function addReview(
  restaurantId: string,
  input: CreateReviewInput
): Promise<Review | null> {
  const restaurants = await ensureDataFile();
  const index = restaurants.findIndex((r) => r.id === restaurantId);
  if (index === -1) {
    return null;
  }

  const existing = restaurants[index];
  const now = new Date().toISOString();
  const newReviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const rating = Math.max(1, Math.min(5, Math.round(input.rating || 5)));

  const newReview: Review = {
    id: newReviewId,
    restaurantId,
    author: input.author.trim() || '익명 미식가',
    rating,
    content: input.content.trim(),
    createdAt: now,
  };

  const updatedReviews = [newReview, ...existing.reviews];
  const { averageRating, reviewCount } = calculateRatingStats(updatedReviews);

  const updatedRestaurant: Restaurant = {
    ...existing,
    reviews: updatedReviews,
    averageRating,
    reviewCount,
    updatedAt: now,
  };

  restaurants[index] = updatedRestaurant;
  await saveDataFile(restaurants);
  return newReview;
}

export async function deleteReview(restaurantId: string, reviewId: string): Promise<boolean> {
  const restaurants = await ensureDataFile();
  const index = restaurants.findIndex((r) => r.id === restaurantId);
  if (index === -1) {
    return false;
  }

  const existing = restaurants[index];
  const updatedReviews = existing.reviews.filter((rev) => rev.id !== reviewId);
  if (updatedReviews.length === existing.reviews.length) {
    return false;
  }

  const { averageRating, reviewCount } = calculateRatingStats(updatedReviews);

  const updatedRestaurant: Restaurant = {
    ...existing,
    reviews: updatedReviews,
    averageRating,
    reviewCount,
    updatedAt: new Date().toISOString(),
  };

  restaurants[index] = updatedRestaurant;
  await saveDataFile(restaurants);
  return true;
}
