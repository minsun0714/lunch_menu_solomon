import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL and service role key are required.');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function readOptional(file, fallback) {
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), 'data', file), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

try {
  const restaurants = await readOptional('restaurants.json', []);
  const settings = await readOptional('team-settings.json', null);
  if (!Array.isArray(restaurants)) throw new Error('Invalid restaurant data');
  const ids = new Set();
  const reviewIds = new Set();
  for (const restaurant of restaurants) {
    if (!restaurant.id || ids.has(restaurant.id)) throw new Error('Missing or duplicate restaurant ID');
    ids.add(restaurant.id);
    for (const review of restaurant.reviews || []) {
      if (!review.id || reviewIds.has(review.id) || review.restaurantId !== restaurant.id) throw new Error('Invalid review relationship or duplicate ID');
      if (typeof review.rating !== 'number' || review.rating < 0.5 || review.rating > 5 || !Number.isInteger(review.rating * 2)) throw new Error('Invalid review rating');
      reviewIds.add(review.id);
    }
  }
  console.log(JSON.stringify({ source: { restaurants: ids.size, reviews: reviewIds.size, settings: settings ? 1 : 0 } }));
  if (!process.argv.includes('--apply')) {
    console.log('Dry run only. Add --apply to import in one transaction. Existing remote IDs are not overwritten.');
  } else {
    const { data, error } = await client.rpc('import_lunch_data', { p_restaurants: restaurants, p_settings: settings });
    if (error) throw new Error(`Import failed (${error.code}). Ensure the SQL migration has run; no partial data is committed.`);
    console.log(JSON.stringify({ inserted: data }));
    for (const [table, expectedIds] of [['restaurants', ids], ['reviews', reviewIds]]) {
      const actualIds = new Set();
      for (let offset = 0; ; offset += 500) {
        const { data: rows, error: readError } = await client.from(table).select('id').order('id').range(offset, offset + 499);
        if (readError) throw new Error(`Verification failed for ${table} (${readError.code})`);
        rows.forEach((row) => actualIds.add(row.id));
        if (rows.length < 500) break;
      }
      if ([...expectedIds].some((id) => !actualIds.has(id))) throw new Error(`Missing migrated IDs in ${table}`);
    }
    if (settings) {
      const { data: row, error: readError } = await client.from('team_settings').select('id').eq('id', true).single();
      if (readError || !row) throw new Error('Team settings verification failed');
    }
    console.log('Verified: all source restaurant/review IDs and team settings exist in Supabase. Local files are unchanged.');
  }
} catch (error) {
  // Never dump Supabase clients, request headers, or environment values.
  console.error(error instanceof Error ? error.message : 'Migration failed');
  process.exitCode = 1;
}
