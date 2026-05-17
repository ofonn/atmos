-- 0010 — observability: convenience views for quick health checks via
-- the SQL editor. Service-role only; no client policies.

create or replace view public.v_daily_api_usage as
select
  day,
  endpoint,
  count(*) filter (where count > 0) as users_active,
  sum(count) as total_calls,
  avg(count)::numeric(10, 2) as avg_calls_per_user,
  max(count) as max_calls_per_user
from public.api_usage
group by day, endpoint
order by day desc, endpoint;

create or replace view public.v_tier_breakdown as
select
  tier,
  status,
  count(*) as users
from public.subscriptions
group by tier, status
order by tier, status;

create or replace view public.v_recent_signups as
select
  u.id,
  u.email,
  u.created_at as signed_up_at,
  s.tier,
  s.status
from auth.users u
left join public.subscriptions s on s.user_id = u.id
order by u.created_at desc
limit 100;

-- Lock these down: only service-role can read them.
revoke all on public.v_daily_api_usage from public, anon, authenticated;
revoke all on public.v_tier_breakdown from public, anon, authenticated;
revoke all on public.v_recent_signups from public, anon, authenticated;
