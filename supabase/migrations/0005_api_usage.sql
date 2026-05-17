-- 0005 — api_usage: per-user-per-endpoint-per-day counter for rate limiting.
-- Writes go through the `increment_api_usage` RPC (security definer) which
-- enforces the tier limit atomically. Clients can read their own row only.

create table public.api_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, endpoint, day)
);

create index api_usage_day_idx on public.api_usage(day);

alter table public.api_usage enable row level security;

create policy "api_usage_select_own"
  on public.api_usage for select
  using (auth.uid() = user_id);

-- Atomic check + increment. Returns the post-increment count, or -1 if the
-- caller is at or above the limit. Uses the WHERE-clause guard so we never
-- record a usage that exceeded the cap.
create or replace function public.increment_api_usage(
  p_endpoint text,
  p_limit integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_count integer;
begin
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  insert into public.api_usage (user_id, endpoint, day, count)
  values (v_user_id, p_endpoint, current_date, 0)
  on conflict (user_id, endpoint, day) do nothing;

  update public.api_usage
    set count = count + 1
    where user_id = v_user_id
      and endpoint = p_endpoint
      and day = current_date
      and count < p_limit
    returning count into v_new_count;

  if v_new_count is null then
    return -1;
  end if;
  return v_new_count;
end;
$$;

revoke all on function public.increment_api_usage(text, integer) from public;
grant execute on function public.increment_api_usage(text, integer) to authenticated;
