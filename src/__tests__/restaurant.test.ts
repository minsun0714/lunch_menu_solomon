import test from 'node:test';
import assert from 'node:assert/strict';
import { installSupabaseMock } from './helpers/supabase';
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addReview,
  deleteReview,
} from '../lib/storage';

test('Restaurant CRUD and Review operations', async (t) => {
  installSupabaseMock(t);
  await t.test('1. Empty database returns an empty list without file seeds', async () => {
    const list = await getAllRestaurants();
    assert.ok(Array.isArray(list));
    assert.equal(list.length, 0);
  });

  let createdId = '';

  await t.test('2. Create a new restaurant', async () => {
    const newRest = await createRestaurant({
      name: '테스트 순대국',
      category: '한식',
      address: '서울시 강남구 역삼로 99',
      phone: '02-123-4567',
      description: '얼큰하고 담백한 전통 순대국밥',
      priceRange: '1만원 이하',
    });

    assert.ok(newRest.id);
    assert.equal(newRest.name, '테스트 순대국');
    assert.equal(newRest.category, '한식');
    assert.equal(newRest.averageRating, 0);
    assert.equal(newRest.reviewCount, 0);
    assert.equal(newRest.reviews.length, 0);

    createdId = newRest.id;
  });

  await t.test('3. Get restaurant by ID', async () => {
    const found = await getRestaurantById(createdId);
    assert.ok(found);
    assert.equal(found?.id, createdId);
    assert.equal(found?.name, '테스트 순대국');
  });

  await t.test('4. Update restaurant', async () => {
    const updated = await updateRestaurant(createdId, {
      name: '특제 테스트 순대국',
      description: '수육도 함께 나오는 세트 메뉴 인기',
    });

    assert.ok(updated);
    assert.equal(updated?.name, '특제 테스트 순대국');
    assert.equal(updated?.description, '수육도 함께 나오는 세트 메뉴 인기');
  });

  let review1Id = '';
  let review2Id = '';

  await t.test('5. Add reviews without login and verify average rating calculation', async () => {
    // Add 5-star review
    const r1 = await addReview(createdId, {
      author: '미식가 홍길동',
      rating: 5,
      content: '국물이 깊고 깍두기가 정말 맛있어요!',
    });
    assert.ok(r1);
    assert.equal(r1?.author, '미식가 홍길동');
    assert.equal(r1?.rating, 5);
    review1Id = r1?.id || '';

    // Verify restaurant stats updated
    let rest = await getRestaurantById(createdId);
    assert.equal(rest?.reviewCount, 1);
    assert.equal(rest?.averageRating, 5);

    // Add 3-star review
    const r2 = await addReview(createdId, {
      author: '점심러',
      rating: 3.5,
      content: '보통이에요. 밥이 조금 질었어요.',
    });
    assert.ok(r2);
    assert.equal(r2.rating, 3.5);
    review2Id = r2?.id || '';

    // Verify average rating: (5 + 3.5) / 2 = 4.25, displayed to one decimal.
    rest = await getRestaurantById(createdId);
    assert.equal(rest?.reviewCount, 2);
    assert.equal(rest?.averageRating, 4.3);
    assert.equal(rest?.reviews.length, 2);
  });

  await t.test('6. Delete review and verify average rating update', async () => {
    const success = await deleteReview(createdId, review2Id);
    assert.equal(success, true);

    const rest = await getRestaurantById(createdId);
    assert.equal(rest?.reviewCount, 1);
    assert.equal(rest?.averageRating, 5);
    assert.equal(rest?.reviews[0].id, review1Id);
  });

  await t.test('7. Delete restaurant', async () => {
    const success = await deleteRestaurant(createdId);
    assert.equal(success, true);

    const found = await getRestaurantById(createdId);
    assert.equal(found, null);
  });
});
