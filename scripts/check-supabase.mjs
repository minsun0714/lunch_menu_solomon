import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL and service role key are required.');
try {
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  console.log(JSON.stringify({ status: response.status, tables: Object.entries(body.definitions || {}).map(([name, table]) => ({ name, columns: Object.keys(table.properties || {}) })), code: body.code }));
  if (!response.ok) process.exitCode = 1;
} catch {
  console.error('Supabase connection failed. Check network access and environment configuration.');
  process.exitCode = 1;
}
