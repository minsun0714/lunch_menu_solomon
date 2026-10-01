import assert from 'node:assert/strict';
import { TestContext } from 'node:test';

type Row = Record<string, unknown>;

// Uses the real Supabase SDK with an isolated PostgREST transport. No live database or files.
export function installSupabaseMock(t: TestContext) {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = 'https://unit-test.supabase.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-key';
  const tables: Record<string, Row[]> = { restaurants: [], reviews: [], team_settings: [] };
  const requests: { table: string; method: string; body: unknown }[] = [];
  let failNext = false;
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    assert.equal(url.origin, 'https://unit-test.supabase.invalid', 'Tests must not contact a real project');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('apikey'), 'unit-test-service-key');
    const method = init?.method || 'GET';
    const table = url.pathname.split('/').at(-1)!;
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ table, method, body });
    const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (failNext) { failNext = false; return reply({ code: 'XX000', message: 'Simulated database failure' }, 500); }
    assert.ok(tables[table], `Unexpected table ${table}`);
    const matches = (row: Row) => [...url.searchParams].every(([key, value]) => !value.startsWith('eq.') || String(row[key]) === value.slice(3));
    let result: Row[];
    if (method === 'GET') {
      result = tables[table].filter(matches);
      const ordering = (url.searchParams.get('order') || '').split(',').filter(Boolean);
      result.sort((a, b) => {
        for (const order of ordering) {
          const [column, direction] = order.split('.');
          const comparison = String(a[column]).localeCompare(String(b[column]));
          if (comparison) return direction === 'desc' ? -comparison : comparison;
        }
        return 0;
      });
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || result.length);
      result = result.slice(offset, offset + limit);
    } else if (method === 'POST') {
      if (table === 'reviews' && !tables.restaurants.some((row) => row.id === body.restaurant_id)) return reply({ code: '23503', message: 'Missing restaurant' }, 409);
      const existing = tables[table].find((row) => row.id === body.id);
      if (existing && headers.get('prefer')?.includes('resolution=merge-duplicates')) {
        Object.assign(existing, body);
        result = [existing];
      } else {
        const now = new Date().toISOString();
        const row = { created_at: now, updated_at: now, ...body };
        tables[table].push(row);
        result = [row];
      }
    } else if (method === 'PATCH') {
      result = tables[table].filter(matches);
      result.forEach((row) => Object.assign(row, body, { updated_at: new Date().toISOString() }));
    } else if (method === 'DELETE') {
      result = tables[table].filter(matches);
      tables[table] = tables[table].filter((row) => !matches(row));
      if (table === 'restaurants') tables.reviews = tables.reviews.filter((row) => !result.some((restaurant) => restaurant.id === row.restaurant_id));
    } else throw new Error(`Unexpected method ${method}`);
    if (headers.get('accept')?.includes('application/vnd.pgrst.object+json')) {
      return result.length === 1 ? reply(result[0]) : reply({ code: 'PGRST116', message: 'Expected one row' }, 406);
    }
    return reply(result);
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });
  return { tables, requests, failNext: () => { failNext = true; } };
}
