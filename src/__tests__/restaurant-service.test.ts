import test from 'node:test';
import assert from 'node:assert/strict';
import { installSupabaseMock } from './helpers/supabase';
import { ApiError } from '../server/errors';
import { handleRoute, ok } from '../server/http';
import * as service from '../server/services/restaurant-service';

const input = { name: '테스트 식당', category: '한식', address: '서울시 강남구 1', phone: '', description: '맛있는 집', priceRange: '1만원 이하' };

test('restaurant service validates input and filters the list', async (t) => {
  installSupabaseMock(t);
  await assert.rejects(service.createRestaurant({ ...input, name: '' }), (error) => error instanceof ApiError && error.status === 400);
  const created = await service.createRestaurant(input);
  await service.createRestaurant({ ...input, name: '국밥집', category: '분식' });
  assert.equal((await service.listRestaurants({ category: '한식' })).length, 1);
  assert.equal((await service.listRestaurants({ query: '국밥' }))[0].name, '국밥집');
  assert.equal((await service.getRestaurant(created.id)).name, '테스트 식당');
  await assert.rejects(service.getRestaurant('missing'), (error) => error instanceof ApiError && error.status === 404);
});

test('restaurant service manages reviews and reports missing records', async (t) => {
  installSupabaseMock(t);
  const restaurant = await service.createRestaurant(input);
  await assert.rejects(service.addReview(restaurant.id, { author: '', rating: 5, content: '' }), (error) => error instanceof ApiError && error.status === 400);
  const review = await service.addReview(restaurant.id, { author: '홍길동', rating: 5, content: '좋아요' });
  assert.equal((await service.getRestaurant(restaurant.id)).reviewCount, 1);
  await service.deleteReview(restaurant.id, review.id);
  await assert.rejects(service.deleteReview(restaurant.id, review.id), (error) => error instanceof ApiError && error.status === 404);
  await service.deleteRestaurant(restaurant.id);
  await assert.rejects(service.deleteRestaurant(restaurant.id), (error) => error instanceof ApiError && error.status === 404);
});

test('handleRoute maps ApiError and unexpected failures to JSON responses', async () => {
  const known = await handleRoute({ error: '실패' }, async () => { throw new ApiError(404, '없음'); });
  assert.equal(known.status, 404);
  assert.deepEqual(await known.json(), { success: false, error: '없음' });
  const unknown = await handleRoute({ status: 500, error: '실패' }, async () => { throw new Error('boom'); });
  assert.equal(unknown.status, 500);
  assert.deepEqual(await unknown.json(), { success: false, error: '실패' });
  assert.deepEqual(await (await handleRoute({ error: '실패' }, async () => ok({ a: 1 }))).json(), { success: true, data: { a: 1 } });
});
