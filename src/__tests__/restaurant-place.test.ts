import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { parseSelectedPlace } from '../types/place';
import { installSupabaseMock } from './helpers/supabase';
import * as storage from '../server/repositories/restaurant-repository';
import { POST } from '../app/api/restaurants/route';
import { PUT } from '../app/api/restaurants/[id]/route';

const place = { id: 'kakao-test-1', name: '테스트 식당', address: '서울 테스트로 1', lat: 37.51, lng: 127.02 };

test('selected restaurant validates coordinates and strips unrelated fields', () => {
  assert.deepEqual(parseSelectedPlace({ ...place, name: ` ${place.name} `, phone: '123' }), place);
  for (const invalid of [null, {}, { ...place, lat: 91 }, { ...place, lng: Infinity }, { ...place, lat: '37.51' }, { ...place, address: '' }]) {
    assert.throws(() => parseSelectedPlace(invalid));
  }
});

test('restaurant API persists selected place and clears stale coordinates on address edit', async (t) => {
  installSupabaseMock(t);
  const payload = { name: place.name, address: place.address, category: '한식', description: '음식점 > 한식', phone: '02-123-4567', place };
  const create = (body: unknown) => POST(new NextRequest('http://localhost/api/restaurants', { method: 'POST', body: JSON.stringify(body) }));
  assert.equal((await create({ ...payload, place: { ...place, lat: 999 } })).status, 400);
  assert.equal((await create({ ...payload, address: '다른 주소' })).status, 400);
  assert.deepEqual(await storage.getAllRestaurants(), []);
  const response = await create(payload);
  assert.equal(response.status, 201);
  const { data: restaurant } = await response.json();
  assert.deepEqual((await storage.getRestaurantById(restaurant.id))?.place, place);
  const update = (body: unknown) => PUT(new NextRequest(`http://localhost/api/restaurants/${restaurant.id}`, { method: 'PUT', body: JSON.stringify(body) }), { params: Promise.resolve({ id: restaurant.id }) });
  assert.equal((await update({ description: '추천 메뉴 추가' })).status, 200);
  assert.deepEqual((await storage.getRestaurantById(restaurant.id))?.place, place);
  assert.equal((await update({ address: '서울 다른로 2' })).status, 200);
  assert.equal((await storage.getRestaurantById(restaurant.id))?.place, undefined);
  const replacement = { ...place, id: 'kakao-test-2', address: '서울 다른로 2', lat: 37.6 };
  assert.equal((await update({ place: replacement })).status, 200);
  assert.deepEqual((await storage.getRestaurantById(restaurant.id))?.place, replacement);
});
