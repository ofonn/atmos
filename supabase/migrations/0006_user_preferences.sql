-- 0006 — user_preferences: server-side mirror of localStorage settings.
-- The client syncs from this on sign-in and writes through on changes.

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  temp_unit text not null default 'C' check (temp_unit in ('C', 'F')),
  wind_unit text not null default 'kmh' check (wind_unit in ('kmh', 'mph')),
  time_format text not null default '24h' check (time_format in ('12h', '24h')),
  headline_tone text not null default 'casual',
  headline_two_line boolean not null default false,
  headline_location_flavor boolean not null default false,
  headline_time_aware boolean not null default false,
  ai_emoji_use text not null default 'light' check (ai_emoji_use in ('none', 'light', 'heavy')),
  ai_verbosity text not null default 'medium' check (ai_verbosity in ('short', 'medium', 'long')),
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Auto-create defaults row on signup.
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_preferences on auth.users;
create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row execute function public.handle_new_user_preferences();
