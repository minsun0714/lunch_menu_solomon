import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest } from '../services/api-client';

function stubFetch(t: test.TestContext, response: Response, calls: { url: string; init?: RequestInit }[] = []) {
  t.mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return response;
  });
  return calls;
}

test('apiRequest unwraps data and serializes JSON bodies', async (t) => {
  const calls = stubFetch(t, Response.json({ success: true, data: { id: '1' } }));
  const data = await apiRequest<{ id: string }>('/api/x', { method: 'POST', body: { a: 1 }, fallbackError: 'fail' });
  assert.deepEqual(data, { id: '1' });
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal(calls[0].init?.body, JSON.stringify({ a: 1 }));
});

test('apiRequest throws the server message or the fallback', async (t) => {
  stubFetch(t, Response.json({ success: false, error: '서버 오류' }, { status: 400 }));
  await assert.rejects(apiRequest('/api/x', { fallbackError: 'fail' }), /서버 오류/);
  t.mock.restoreAll();
  stubFetch(t, new Response('not json', { status: 500 }));
  await assert.rejects(apiRequest('/api/x', { fallbackError: 'fallback' }), /fallback/);
});
