-- 0007 — streaks: daily-open streak tracking. The client calls
-- `bump_streak()` once per session; the RPC handles same-day no-op,
-- consecutive-day increment, and gap reset atomically.

create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_open date,
  total_opens integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "streaks_select_own"
  on public.streaks for select
  using (auth.uid() = user_id);

create trigger streaks_set_updated_at
  before update on public.streaks
  for each row execute function public.set_updated_at();

create or replace function public.bump_streak()
returns table (
  current_streak integer,
  longest_streak integer,
  total_opens integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_last date;
  v_curr integer;
  v_long integer;
  v_total integer;
begin
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  insert into public.streaks (user_id, current_streak, longest_streak, last_open, total_opens)
  values (v_user_id, 1, 1, v_today, 1)
  on conflict (user_id) do nothing;

  select last_open, public.streaks.current_streak, public.streaks.longest_streak, public.streaks.total_opens
    into v_last, v_curr, v_long, v_total
    from public.streaks
    where user_id = v_user_id;

  if v_last = v_today then
    -- already counted today
    return query select v_curr, v_long, v_total;
    return;
  end if;

  if v_last = v_today - interval '1 day' then
    v_curr := v_curr + 1;
  else
    v_curr := 1;
  end if;

  if v_curr > v_long then
    v_long := v_curr;
  end if;
  v_total := v_total + 1;

  update public.streaks
    set current_streak = v_curr,
        longest_streak = v_long,
        last_open = v_today,
        total_opens = v_total
    where user_id = v_user_id;

  return query select v_curr, v_long, v_total;
end;
$$;

revoke all on function public.bump_streak() from public;
grant execute on function public.bump_streak() to authenticated;
