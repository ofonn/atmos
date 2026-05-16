-- 0008 — push_subscriptions: stores per-user web-push endpoints + FCM
-- tokens so the server can dispatch weather alerts and daily briefings.
-- A user can have multiple rows (one per device / browser).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('web', 'android', 'ios')),

  -- Web Push (browser)
  web_endpoint text,
  web_p256dh text,
  web_auth text,

  -- FCM (Android / iOS)
  fcm_token text,

  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index push_subscriptions_web_endpoint_uniq
  on public.push_subscriptions(web_endpoint)
  where web_endpoint is not null;

create unique index push_subscriptions_fcm_token_uniq
  on public.push_subscriptions(fcm_token)
  where fcm_token is not null;

create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Per-user notification preferences (which types they opted in to).
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  severe_alerts boolean not null default true,
  daily_briefing boolean not null default false,
  daily_briefing_hour smallint not null default 7 check (daily_briefing_hour between 0 and 23),
  rain_starting boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Auto-create defaults row on signup.
create or replace function public.handle_new_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_notif_prefs on auth.users;
create trigger on_auth_user_created_notif_prefs
  after insert on auth.users
  for each row execute function public.handle_new_notification_preferences();
