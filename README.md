# Atmos

AI weather companion — Next.js web app + Flutter Android app, sharing
a Supabase backend, Gemini for AI, and Open-Meteo for weather.

```
Next.js   →   Supabase   →   Postgres + Auth + RLS
   ↑              ↑
   |              └── Stripe webhook + push subs
   |
Flutter Android   →   /api/*  (Play Integrity gated)
```

## Start here

- **Monday checklist (manual dashboard steps)** — `docs/MANUAL_TASKS.md`
- **Full setup guide** — `docs/SETUP.md`
- **Architecture decisions** — `docs/adr/`
- **What's built / what's missing** — `docs/SCENARIOS.md` (web) +
  `docs/ANDROID_SCENARIOS.md` (mobile, 50+ user flows audited)
- **Architecture + commands** — `CLAUDE.md`
- **Changelog** — `CHANGELOG.md`
- **Security policy** — `SECURITY.md`
- **Contributing** — `CONTRIBUTING.md`

## Quick commands

```bash
# Web
npm install
cp .env.example .env.local        # fill in keys per docs/SETUP.md §1
npm run dev                       # http://localhost:3000
npm test                          # vitest — 34 tests passing
npm run check                     # install + lint + test + build

# Mobile (Android)
cd mobile
flutter pub get
flutter run --dart-define=ATMOS_API_BASE=http://10.0.2.2:3000 \
            --dart-define=SUPABASE_URL=… \
            --dart-define=SUPABASE_ANON_KEY=…

# Supabase migrations
npm run migrate                   # supabase db push
```

## High-level features

**Web + mobile (parity)**
- Current + hourly + 14-day weather, severe-weather banner
- AI headlines, outfit advice, activity windows, trip packing list
- Per-user saved cities, chat history, preferences (cloud-synced —
  same email = same data on every device)
- Free / Pro tiers with daily AI rate limits
- Account + sign-in / sign-up / password reset / profile / delete
- AI personality picker (emoji use, verbosity)
- Onboarding with optional weather-adaptive video backgrounds
- Daily-open streak

**Web-only (today)**
- Stripe Checkout + Customer Portal
- Voice input on chat (`SpeechRecognition`)
- `/pricing`, `/status`, `/privacy`, `/reset` pages
- WhatsNew + downgrade toasts
- PWA install prompt + offline-cache service worker
- JSON-LD structured data, OG metadata, robots.txt, sitemap.xml
- `/api/health`, `/api/health/sync`, `/api/version` diagnostics
- `/api/account/export` GDPR data dump
- `/.well-known/{security.txt,change-password}`

**Mobile-only (today)**
- Play Integrity attestation gating /api/*
- Native About → Security + Permissions screens

**Coverage** — 34 vitest tests across subscriptions / weather utils /
gemini personality / tier resolver / unit conversions. CI runs build +
lint + analyze + test + gitleaks on every push.

See the SCENARIOS docs for exactly which user flows are implemented
vs. missing, with effort estimates per gap. See `docs/MANUAL_TASKS.md`
for the human dashboard work.

## License

Private, all rights reserved (replace once you decide on a license).
