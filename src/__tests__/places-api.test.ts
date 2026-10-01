import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/places/route';

test('keyword search API', async (t) => {
  const originalKey = process.env.KAKAO_REST_API_KEY;
  t.after(() => {
    if (originalKey === undefined) delete process.env.KAKAO_REST_API_KEY;
    else process.env.KAKAO_REST_API_KEY = originalKey;
  });
  process.env.KAKAO_REST_API_KEY = 'test-rest-key';

  await t.test('calls the keyword endpoint with server authorization and preserves distinct places', async (t) => {
    t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      assert.equal(url.origin + url.pathname, 'https://dapi.kakao.com/v2/local/search/keyword.json');
      assert.equal(url.searchParams.get('query'), '유정식당 & 카페');
      assert.equal(url.searchParams.get('sort'), 'accuracy');
      assert.equal(url.searchParams.get('page'), '2');
      assert.equal(url.searchParams.get('size'), '15');
      assert.equal(init?.method, 'GET');
      assert.equal(new Headers(init?.headers).get('Authorization'), 'KakaoAK test-rest-key');
      assert.equal(init?.cache, 'no-store');
      return Response.json({ meta: { is_end: false }, documents: [
        { id: '1', place_name: '유정식당', road_address_name: '서울 테스트로 1', address_name: '서울 테스트동 1', x: '127.1', y: '37.5' },
        { id: '2', place_name: '같은 건물 카페', road_address_name: '', address_name: '서울 테스트로 1', x: '127.2', y: '37.6' },
        { id: 'invalid', place_name: 'invalid', address_name: 'test', x: '', y: '' },
      ] });
    });
    const response = await GET(new NextRequest(`http://localhost/api/places?query=${encodeURIComponent(' 유정식당 & 카페 ')}&page=2`));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.places.length, 2);
    assert.equal(body.data.places[0].lat, 37.5);
    assert.equal(body.data.places[0].lng, 127.1);
    assert.equal(body.data.places[1].address, '서울 테스트로 1');
    assert.equal(body.data.hasMore, true);
    assert.equal(body.data.page, 2);
    assert.equal(JSON.stringify(body).includes('test-rest-key'), false);
  });

  await t.test('rejects invalid queries before calling Kakao and reports missing configuration', async (t) => {
    const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not call Kakao'); });
    for (const query of ['query=', 'query=test&page=0', 'query=test&page=46', 'query=test&page=1.5', 'query=test&page=bad']) {
      assert.equal((await GET(new NextRequest(`http://localhost/api/places?${query}`))).status, 400);
    }
    delete process.env.KAKAO_REST_API_KEY;
    assert.equal((await GET(new NextRequest('http://localhost/api/places?query=test'))).status, 503);
    process.env.KAKAO_REST_API_KEY = 'test-rest-key';
    assert.equal(mock.mock.callCount(), 0);
  });

  await t.test('preserves empty and final pages', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ meta: { is_end: true }, documents: [] }));
    const response = await GET(new NextRequest('http://localhost/api/places?query=no-match'));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { places: [], page: 1, hasMore: false });
  });

  await t.test('reports upstream authentication and rate limit failures without leaking upstream bodies', async (t) => {
    let status = 401;
    t.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'test-rest-key' }, { status }));
    const request = new NextRequest('http://localhost/api/places?query=test');
    const response = await GET(request);
    assert.equal(response.status, 502);
    assert.equal((await response.text()).includes('test-rest-key'), false);
    status = 429;
    assert.equal((await GET(request)).status, 429);
  });
});
