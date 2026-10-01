begin;

create table public.restaurants (
  id text primary key,
  name text not null check (length(btrim(name)) > 0),
  category text not null check (category in ('한식','일식','중식','양식','분식','아시안','카페/디저트','기타')),
  address text not null check (length(btrim(address)) > 0),
  phone text,
  description text not null,
  image_url text,
  price_range text,
  opening_hours text,
  place jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id text primary key,
  restaurant_id text not null references public.restaurants(id) on delete cascade,
  author text not null check (length(btrim(author)) > 0),
  rating numeric not null check (rating >= 0.5 and rating <= 5 and rating * 2 = trunc(rating * 2)),
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz not null default now()
);
create index reviews_restaurant_created_idx on public.reviews(restaurant_id, created_at desc);

create table public.team_settings (
  id boolean primary key default true check (id),
  team_name text not null check (length(btrim(team_name)) between 1 and 40),
  office_address text not null default '' check (length(office_address) <= 200),
  office_place jsonb,
  updated_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;
alter table public.reviews enable row level security;
alter table public.team_settings enable row level security;
revoke all on public.restaurants, public.reviews, public.team_settings from anon, authenticated;
grant select, insert, update, delete on public.restaurants, public.reviews, public.team_settings to service_role;

create function public.lunch_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger restaurants_touch_updated_at before update on public.restaurants
for each row execute function public.lunch_touch_updated_at();
create trigger team_settings_touch_updated_at before update on public.team_settings
for each row execute function public.lunch_touch_updated_at();
revoke all on function public.lunch_touch_updated_at() from public;

-- One transaction imports existing IDs and timestamps. Re-running never overwrites remote edits.
create function public.import_lunch_data(p_restaurants jsonb, p_settings jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  restaurant_count integer;
  review_count integer;
  settings_count integer;
begin
  insert into public.restaurants (id, name, category, address, phone, description, image_url, price_range, opening_hours, place, created_at, updated_at)
  select r->>'id', r->>'name', r->>'category', r->>'address', nullif(r->>'phone',''),
    r->>'description', nullif(r->>'imageUrl',''), nullif(r->>'priceRange',''), nullif(r->>'openingHours',''),
    nullif(r->'place', 'null'::jsonb), (r->>'createdAt')::timestamptz, (r->>'updatedAt')::timestamptz
  from jsonb_array_elements(p_restaurants) r
  on conflict (id) do nothing;
  get diagnostics restaurant_count = row_count;

  insert into public.reviews (id, restaurant_id, author, rating, content, created_at)
  select v->>'id', r->>'id', v->>'author', (v->>'rating')::numeric, v->>'content', (v->>'createdAt')::timestamptz
  from jsonb_array_elements(p_restaurants) r,
    lateral jsonb_array_elements(coalesce(r->'reviews','[]'::jsonb)) v
  on conflict (id) do nothing;
  get diagnostics review_count = row_count;

  if p_settings is not null and p_settings <> 'null'::jsonb then
    insert into public.team_settings (id, team_name, office_address, office_place)
    values (true, p_settings->>'teamName', p_settings->>'officeAddress', nullif(p_settings->'officePlace','null'::jsonb))
    on conflict (id) do nothing;
  end if;
  get diagnostics settings_count = row_count;
  return jsonb_build_object('restaurants', restaurant_count, 'reviews', review_count, 'settings', settings_count);
end;
$$;
revoke all on function public.import_lunch_data(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.import_lunch_data(jsonb,jsonb) to service_role;

notify pgrst, 'reload schema';
commit;
