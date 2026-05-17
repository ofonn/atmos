-- 0011 — feedback: lightweight inbox for in-app feedback. Users can
-- submit; only the service role can read (you'll triage in the SQL
-- editor). When an anonymous user submits, user_id is null.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('web', 'android', 'ios')),
  category text not null check (category in ('bug', 'feature', 'ai', 'other')),
  message text not null,
  context jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback(created_at desc);

alter table public.feedback enable row level security;

-- Anyone signed in can insert their own. Anonymous inserts are
-- intentionally NOT allowed via RLS — those go through the server
-- route with the service-role key.
create policy "feedback_insert_own"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- No SELECT policy — service-role only via SQL editor.
