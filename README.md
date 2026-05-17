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

- **First-time setup (Monday checklist)** — `docs/SETUP.md`
- **What's built / what's missing** — `docs/SCENARIOS.md` (web) +
  `docs/ANDROID_SCENARIOS.md` (mobile, 50+ user flows audited)
- **Architecture + commands** — `CLAUDE.md`
- **Security policy** — `SECURITY.md`
- **Contributing** — `CONTRIBUTING.md`

## Quick commands

```bash
# Web
npm install
cp .env.example .env.local        # fill in keys per docs/SETUP.md §1
npm run dev                       # http://localhost:3000
npx next build                    # type-check + lint + bundle

# Mobile (Android)
cd mobile
flutter pub get
flutter run --dart-define=ATMOS_API_BASE=http://10.0.2.2:3000 \
            --dart-define=SUPABASE_URL=… \
            --dart-define=SUPABASE_ANON_KEY=…

# Supabase migrations
supabase link --project-ref <ref>
supabase db push
```

## High-level features

**Web + mobile (parity)**
- Current + hourly + 14-day weather
- AI headlines, outfit advice, activity windows, trip packing list
- Per-user saved cities, chat history, preferences (cloud-synced)
- Free / Pro tiers with daily AI rate limits

**Web-only (today)**
- Onboarding flow with weather-video-background opt-in
- Stripe Checkout + Customer Portal
- Password reset, profile editor, account deletion

**Mobile-only (today)**
- Play Integrity attestation gating /api/*
- Voice input in chat

See the SCENARIOS docs for exactly which user flows are implemented
vs. missing, with effort estimates per gap.

## License

Private, all rights reserved (replace once you decide on a license).
