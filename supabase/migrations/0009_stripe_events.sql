-- 0009 — stripe_events: idempotency table so the webhook handler can
-- safely retry without double-processing. We insert the event id on
-- first arrival; if the insert violates the PK we skip handling.

create table public.stripe_events (
  id text primary key,                 -- Stripe event id (evt_…)
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create index stripe_events_received_idx on public.stripe_events(received_at);

-- No RLS — only service role writes here. Locked down by default.
alter table public.stripe_events enable row level security;
-- No SELECT policy for the public role.
