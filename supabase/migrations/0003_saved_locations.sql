-- 0003 — saved_locations: per-user saved cities (replaces localStorage).

create table public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country text,
  admin1 text,
  lat double precision not null,
  lon double precision not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index saved_locations_user_idx on public.saved_locations(user_id);

-- At most one primary per user.
create unique index saved_locations_one_primary_per_user
  on public.saved_locations(user_id) where is_primary = true;

alter table public.saved_locations enable row level security;

create policy "saved_locations_select_own"
  on public.saved_locations for select
  using (auth.uid() = user_id);

create policy "saved_locations_insert_own"
  on public.saved_locations for insert
  with check (auth.uid() = user_id);

create policy "saved_locations_update_own"
  on public.saved_locations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_locations_delete_own"
  on public.saved_locations for delete
  using (auth.uid() = user_id);
