# Security policy

## Reporting a vulnerability

If you discover a security issue in Atmos, please report it privately:

- Email: **security@atmos.example.com** (or whichever inbox you wire up
  for the project — replace this line once you have one).
- Or file a private security advisory on GitHub: repo → Security →
  Report a vulnerability.

Please **do not** open a public issue or PR. We'll acknowledge within
72 hours and aim to ship a fix or mitigation within 14 days for
serious issues.

We don't run a paid bounty program, but we will credit you in the
release notes if you wish.

## Supported versions

We patch only the latest `main` branch.

| Version | Supported |
|---------|-----------|
| latest `main` | ✅ |
| prior tags | ❌ |

## Scope

In scope:
- The Next.js web app (`/src`, `/middleware.ts`).
- Supabase migrations and RPC functions (`/supabase/migrations`).
- The Flutter Android app (`/mobile`).
- The build / deploy configs (Vercel, GitHub Actions in `.github/`).

Out of scope:
- Reports limited to outdated dependencies without a working exploit.
- Self-XSS and clickjacking on pages without sensitive actions.
- Issues affecting unsupported browsers or rooted devices in lenient mode.
- Social engineering or physical attacks.

## Hardening already in place

- **Auth**: Supabase Auth via secure HttpOnly cookies, session refresh
  via `middleware.ts`. Service-role key kept server-only.
- **RLS**: every public table has Row Level Security enforced; users
  can only read/write their own rows. Verified via SQL in
  `docs/SETUP.md` §8.4.
- **API gating**: `/api/*` requires Play Integrity attestation for
  non-same-origin traffic (Android app), plus per-user atomic
  rate limiting via the `increment_api_usage` RPC.
- **Stripe**: webhook signature verified (`STRIPE_WEBHOOK_SECRET`),
  raw body. Idempotency via Stripe event IDs.
- **Account deletion**: `/api/account/delete` cascades through every
  table via `on delete cascade`.
- **Security headers** applied to every response in `middleware.ts`:
  `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Mobile**: APKs are gated by Play Integrity; `usesCleartextTraffic="false"`
  in `AndroidManifest.xml`; outbound traffic verified by
  `network_security_config.xml`.
- **Secrets in repo**: `.gitignore` blocks every `.env*` variant,
  keystore, service account JSON, and Flutter local state. Only
  `.env.example` is committed.
- **CI**: pre-commit `gitleaks` recommended (see `docs/SETUP.md` §8.5).

## Key rotation

The two keys that warrant a rotation policy:

- **`SUPABASE_SERVICE_ROLE_KEY`** — bypasses RLS. Rotate **every
  6 months** as routine, and **immediately** on:
  - any suspected leak (committed by accident, shared in chat, etc.)
  - any contributor with access leaving the project
  - any Vercel access token revocation event

  How: Supabase Dashboard → Project Settings → API → Reset
  service_role key → update on Vercel → trigger a redeploy. The
  Stripe webhook, `/api/account/delete`, and push-dispatch all
  pick up the new key on the next request.

- **`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`** — rotate
  annually or on team changes. Stripe Dashboard → Developers →
  API keys → Roll. The webhook secret must be re-pasted on
  Vercel **before** rolling, or one webhook batch could fail
  signature verification.

`GEMINI_API_KEY` and `GOOGLE_PLAY_INTEGRITY_SA_JSON` follow the
same pattern — annual or on incident.

## What we still need to do

See `docs/SETUP.md` §10 for the day-one checklist that requires
human action in the relevant dashboards (Supabase RLS sanity check,
secret scanning toggle, etc.).
