import { randomUUID } from 'node:crypto';
import { Restaurant, CreateRestaurantInput, UpdateRestaurantInput, CreateReviewInput, Review } from '@/types/restaurant';
import { isValidRating } from '@/types/rating';
import { getSupabase } from '@/server/db/supabase';

interface ReviewRow {
  id: string; restaurant_id: string; author: string; rating: number; content: string; created_at: string;
}
interface RestaurantRow {
  id: string; name: string; category: Restaurant['category']; address: string;
  phone: string | null; description: string; image_url: string | null; price_range: string | null;
  opening_hours: string | null; place: Restaurant['place'] | null; created_at: string; updated_at: string;
}

function reviewFromRow(row: ReviewRow): Review {
  return { id: row.id, restaurantId: row.restaurant_id, author: row.author, rating: Number(row.rating), content: row.content, createdAt: row.created_at };
}

function restaurantFromRow(row: RestaurantRow, reviews: Review[]): Restaurant {
  return {
    id: row.id, name: row.name, category: row.category, address: row.address,
    phone: row.phone || undefined, description: row.description, imageUrl: row.image_url || undefined,
    priceRange: row.price_range || undefined, openingHours: row.opening_hours || undefined,
    place: row.place || undefined, createdAt: row.created_at, updatedAt: row.updated_at,
    reviews, reviewCount: reviews.length,
    averageRating: reviews.length ? Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length * 10) / 10 : 0,
  };
}

// Explicit ranges avoid silently losing rows at the Data API's default row limit.
async function readRestaurants(): Promise<RestaurantRow[]> {
  const rows: RestaurantRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await getSupabase().from('restaurants').select('*').order('id').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data as RestaurantRow[]));
    if (data.length < 500) return rows;
  }
}

async function readReviews(restaurantId?: string): Promise<Review[]> {
  const reviews: Review[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = getSupabase().from('reviews').select('*').order('created_at', { ascending: false }).order('id');
    if (restaurantId !== undefined) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query.range(offset, offset + 499);
    if (error) throw error;
    reviews.push(...(data as ReviewRow[]).map(reviewFromRow));
    if (data.length < 500) return reviews;
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  const [rows, reviews] = await Promise.all([readRestaurants(), readReviews()]);
  const grouped = new Map<string, Review[]>();
  for (const review of reviews) {
    const items = grouped.get(review.restaurantId) || [];
    items.push(review);
    grouped.set(review.restaurantId, items);
  }
  return rows.map((row) => restaurantFromRow(row, grouped.get(row.id) || []));
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const { data, error } = await getSupabase().from('restaurants').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return restaurantFromRow(data as RestaurantRow, await readReviews(id));
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  const { data, error } = await getSupabase().from('restaurants').insert({
    id: `rest-${randomUUID()}`, name: input.name.trim(), category: input.category, address: input.address.trim(),
    phone: input.phone?.trim() || null, description: input.description.trim(), image_url: input.imageUrl?.trim() || null,
    price_range: input.priceRange?.trim() || null, opening_hours: input.openingHours?.trim() || null, place: input.place || null,
  }).select('*').single();
  if (error) throw error;
  return restaurantFromRow(data as RestaurantRow, []);
}

export async function updateRestaurant(id: string, input: UpdateRestaurantInput): Promise<Restaurant | null> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.category !== undefined) patch.category = input.category;
  if (input.address !== undefined) {
    patch.address = input.address.trim();
    const existing = await getRestaurantById(id);
    if (!existing) return null;
    if (patch.address !== existing.address) patch.place = null;
  }
  if (input.place !== undefined) patch.place = input.place;
  if (input.phone !== undefined) patch.phone = input.phone.trim() || null;
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl.trim() || null;
  if (input.priceRange !== undefined) patch.price_range = input.priceRange.trim() || null;
  if (input.openingHours !== undefined) patch.opening_hours = input.openingHours.trim() || null;
  const { data, error } = await getSupabase().from('restaurants').update(patch).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  return data ? restaurantFromRow(data as RestaurantRow, await readReviews(id)) : null;
}

export async function deleteRestaurant(id: string): Promise<boolean> {
  const { data, error } = await getSupabase().from('restaurants').delete().eq('id', id).select('id');
  if (error) throw error;
  return data.length > 0;
}

export async function addReview(restaurantId: string, input: CreateReviewInput): Promise<Review | null> {
  if (!isValidRating(input.rating)) throw new Error('별점은 0.5~5점 사이에서 0.5점 단위로 선택해주세요.');
  const { data, error } = await getSupabase().from('reviews').insert({
    id: `rev-${randomUUID()}`, restaurant_id: restaurantId, author: input.author.trim() || '익명 미식가',
    rating: input.rating, content: input.content.trim(),
  }).select('*').single();
  if (error?.code === '23503') return null;
  if (error) throw error;
  return reviewFromRow(data as ReviewRow);
}

export async function deleteReview(restaurantId: string, reviewId: string): Promise<boolean> {
  const { data, error } = await getSupabase().from('reviews').delete().eq('id', reviewId).eq('restaurant_id', restaurantId).select('id');
  if (error) throw error;
  return data.length > 0;
}
