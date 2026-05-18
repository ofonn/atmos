# Changelog

All notable changes will be recorded here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased] — `claude/supabase-auth` branch

### Latest additions (Sun 2026-05-17)
- Mobile password reset (`/reset` request + `/reset-update` set-new)
  with deep-link recovery routed via NavShell listener
- Mobile **Security** and **Permissions** about-screens linked from
  Settings → Privacy
- "What's new" one-time toast on web after deploy
- One-shot downgrade alert when subscription tier flips pro → free
- 24 vitest tests passing (subscriptions, weather utils, gemini
  personality prompts, tier resolver decision table)
- `/api/version` build/commit metadata
- `/.well-known/change-password` redirect for password managers
- CSP-report receiver + CSP report-only header in middleware
- 5 architecture decision records (`docs/adr/0001-0005`)

### Added
- **Per-user accounts** via Supabase Auth (email/password + Google OAuth)
- **Cross-device sync** for saved cities, chat history, and preferences
  — web ↔ Android, same email
- **Pro tier + Stripe Checkout** with Customer Portal, webhook handler,
  and idempotency table
- **AI rate limiting** per tier (`api_usage` + `increment_api_usage` RPC)
  wired into chat / headline / outfit / activity / trip
- **Onboarding flow** with opt-in for weather-adaptive video backgrounds
- **Trip planner** — destination + dates → AI packing list + watchouts
  (web `/trip` + mobile `/trip`)
- **AI personality** picker — emoji use + verbosity sent through to Gemini
- **Daily-open streak** (RPC + badge widget)
- **Severe-weather banner** — heuristic from Open-Meteo's 48h forecast;
  dismissable per-event for 12h
- **GDPR endpoints** — `/api/account/export`, `/api/account/delete`
- **Weather video backgrounds** — opt-in, network-aware quality
- **PWA install prompt** + service worker stale-while-revalidate
- **Voice input** on web chat (SpeechRecognition)
- **Mobile** Trip, Profile, Pricing-redirect, DangerZone, UsageBars,
  SevereWeatherBanner, OfflineBanner, OutfitCard, ShareWeather,
  WeatherVideoBackground, OnboardingSheet
- **Docs** — `docs/SETUP.md` Monday checklist with MCP-automatable
  tags, `docs/ANDROID_SCENARIOS.md` 50+ user flows
- **Repo governance** — SECURITY.md, CONTRIBUTING.md, dependabot,
  gitleaks, PR + issue templates, CI workflow (build + analyze + scan)
- **Hardened `.gitignore`** — `.env*`, all keystores, service accounts,
  Flutter local state
- **Security headers** in middleware (HSTS, X-Frame-Options, etc.)
- **OG metadata**, robots.txt, sitemap.xml, security.txt, humans.txt
- **404 + global error** branded pages

### Changed
- Settings: tier badge, Upgrade / Manage subscription buttons, usage
  bars, AI personality controls, video background controls, danger zone

### Pending — manual dashboard work

See `docs/MANUAL_TASKS.md` for the full Monday checklist. The
shortlist:

- Create Supabase project + apply migrations 0001–0012 + auth allow-list
- Create Stripe products + webhook + put price IDs / secrets on Vercel
- Create Google OAuth client + paste to Supabase
- Create Play Integrity service account (after Play Store publish)
- Generate Android upload keystore + first AAB
- (Optional) VAPID keys + Firebase project for push
- (Optional) Sentry projects (web + Flutter) for error tracking
- Replace `atmos.example.com` placeholders across the repo

### Pending — code (no dashboard needed)

- Mobile Home/Work tag UI (schema column already exists, migration 0012)
- Mobile quick-switch between Home / Work cities
- Mobile preview-only saved-location mode
- Mobile downgrade-pro-to-free banner
- Mobile WhatsNew sheet
- Mobile native `/status` screen
- Mobile pollen / sun-UV / comparison / precip / temp-trend cards
- Web downgrade alert → styled in-page banner
- Lazy-load Leaflet on `/radar`
- jsdom + first component test
- Mocked vitest tests for sync + playIntegrity
- Sentry on web + Flutter (gated by DSN env)
- Husky pre-commit + gitleaks
- Lighthouse CI

## 1.0.0 — Previous state

Initial Next.js + Flutter weather app with Open-Meteo + Gemini.
