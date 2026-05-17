# 2. Supabase as backend

Date: 2026-05-17
Status: Accepted

## Context

We needed auth + a Postgres database + storage + edge functions for:
- Per-user accounts (web + Android)
- Cloud sync of saved cities, chat, preferences
- Stripe subscription state
- Push subscription endpoints
- Future avatar uploads

Considered alternatives: Firebase Auth + Firestore, AWS Cognito + RDS,
self-hosted Postgres + custom auth.

## Decision

Use **Supabase** (managed Postgres + GoTrue + Storage + Edge Functions).

Why:
- Single SDK, identical schema, identical RLS rules on web and mobile.
  Same `auth.uid()` means cross-device sync just works.
- Postgres with real SQL and proper relations — Firestore's NoSQL
  shape would have forced denormalization across `saved_locations`,
  `chat_messages`, `subscriptions`, etc.
- Row Level Security replaces hand-written auth checks on every read.
  This is the single biggest reduction in security surface.
- Free tier comfortable enough for early traction; managed scaling
  later when we need it.
- Edge Functions in Deno on the same host as the DB, with the
  service-role key already in scope — convenient for the daily-
  briefing cron.

## Consequences

- **Easier:** any new table inherits the same auth model with one
  `enable row level security` + 4 policies.
- **Easier:** mobile devs don't need a server SDK — they hit the
  same Supabase REST/RT directly.
- **Harder:** vendor lock-in. Migrating off would mean replacing
  GoTrue cookie handling and rewriting RLS as middleware. Acceptable
  given runway.
- **Caveat:** the service-role key is a god key. It lives only on
  Vercel (server-side env), never in client code, and is used only
  by the Stripe webhook + account-delete + push dispatch.
