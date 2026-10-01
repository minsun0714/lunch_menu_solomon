import test from 'node:test';
import assert from 'node:assert/strict';
import { findOfficeLocation, geocodeAddress, kakaoSearchUrl, KakaoMaps, OfficePlace } from '../lib/kakao-maps';

test('geocoding shares requests, converts x/y correctly, and retries failed addresses', async () => {
  let requests = 0;
  let response = { x: '127.0276', y: '37.4979' };
  let status = 'OK';
  const maps = { services: { Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT' }, Geocoder: class {
    addressSearch(_address: string, callback: (results: { x: string; y: string }[], status: string) => void) {
      requests++;
      queueMicrotask(() => callback([response], status));
    }
  } } } as unknown as KakaoMaps;
  const [first, second] = await Promise.all([geocodeAddress(maps, '주소 A'), geocodeAddress(maps, ' 주소 A ')]);
  assert.deepEqual(first, { lat: 37.4979, lng: 127.0276 });
  assert.deepEqual(second, first);
  assert.equal(requests, 1);
  assert.equal(await geocodeAddress(maps, '  '), null);
  assert.equal(requests, 1);
  status = 'ZERO_RESULT';
  assert.equal(await geocodeAddress(maps, '주소 B'), null);
  status = 'OK';
  assert.deepEqual(await geocodeAddress(maps, '주소 B'), first);
  response = { x: 'not-a-coordinate', y: '37' };
  assert.equal(await geocodeAddress(maps, '주소 C'), null);
  response = { x: '', y: '' };
  assert.equal(await geocodeAddress(maps, '주소 D'), null);
});

test('Kakao search URLs encode user-provided names and addresses', () => {
  const url = new URL(kakaoSearchUrl('밥집 & 면집 #1', '서울 중구'));
  assert.equal(url.origin, 'https://map.kakao.com');
  assert.equal(url.hash, '');
  assert.equal(decodeURIComponent(url.pathname), '/link/search/서울 중구 밥집 & 면집 #1');
});

test('office lookup accepts addresses and unique place names without guessing ambiguous branches', async () => {
  let searches = 0;
  const place: OfficePlace = {
    id: 'office-a', place_name: '유정식당', address_name: '서울 테스트동 1',
    road_address_name: '서울 테스트로 1', x: '127.0276', y: '37.4979',
  };
  let results = [place];
  let hasNextPage = false;
  let searchStatus = 'OK';
  const maps = { services: {
    Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT' },
    Geocoder: class {
      addressSearch(query: string, callback: (result: { x: string; y: string }[], status: string) => void) {
        queueMicrotask(() => callback(query === 'office-address-fixture' ? [place] : [], query === 'office-address-fixture' ? 'OK' : 'ZERO_RESULT'));
      }
    },
    Places: class {
      keywordSearch(_query: string, callback: (result: OfficePlace[], status: string, pagination: { hasNextPage: boolean }) => void) {
        searches++;
        queueMicrotask(() => callback(results, searchStatus, { hasNextPage }));
      }
    },
  } } as unknown as KakaoMaps;

  assert.deepEqual(await findOfficeLocation(maps, ''), { coordinates: null, candidates: [] });
  assert.deepEqual(await findOfficeLocation(maps, 'office-address-fixture'), { coordinates: { lat: 37.4979, lng: 127.0276 }, candidates: [] });
  assert.equal(searches, 0);
  assert.deepEqual(await findOfficeLocation(maps, 'unique-office-fixture'), { coordinates: { lat: 37.4979, lng: 127.0276 }, candidates: [] });
  results = [place, { ...place, id: 'office-b', road_address_name: '부산 테스트로 2', x: '129.1' }];
  const ambiguous = await findOfficeLocation(maps, 'multiple-office-fixture');
  assert.equal(ambiguous.coordinates, null);
  assert.equal(ambiguous.candidates.length, 2);
  results = [place];
  hasNextPage = true;
  assert.equal((await findOfficeLocation(maps, 'paginated-office-fixture')).coordinates, null);
  hasNextPage = false;
  results = [{ ...place, x: 'not-a-coordinate' }];
  assert.deepEqual(await findOfficeLocation(maps, 'invalid-office-fixture'), { coordinates: null, candidates: [] });
  searchStatus = 'ERROR';
  assert.deepEqual(await findOfficeLocation(maps, 'failed-office-fixture'), { coordinates: null, candidates: [] });
});

