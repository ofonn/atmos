-- 0004 — chat_messages: per-user chat history (replaces localStorage in useChat).
-- Flat table, no sessions — matches the current single-thread UX. Add a
-- `session_id` column later if/when multi-conversation is needed.

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_user_created_idx
  on public.chat_messages(user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "chat_messages_select_own"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "chat_messages_delete_own"
  on public.chat_messages for delete
  using (auth.uid() = user_id);
