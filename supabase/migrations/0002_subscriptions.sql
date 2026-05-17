-- 0002 — subscriptions: per-user tier (free/pro) + Stripe linkage.
-- Auto-created as 'free' on signup. Flipped to 'pro' by a future Stripe webhook.

create type public.subscription_tier as enum ('free', 'pro');
create type public.subscription_status as enum (
  'active', 'trialing', 'past_due', 'canceled', 'incomplete'
);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_stripe_customer_idx
  on public.subscriptions(stripe_customer_id);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription. No insert/update from clients —
-- writes happen via service role (Stripe webhook) only.
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_subscription();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
