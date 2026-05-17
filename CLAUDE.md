# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev        # Start dev server at http://localhost:3000

# Build & check
npx next build     # Production build (also type-checks and lints)

# Lint only
npm run lint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
```
GEMINI_API_KEY=                       # Use gemini-2.5-flash (NOT 2.0-flash — it has 0 quota)
NEXT_PUBLIC_SUPABASE_URL=             # https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Supabase anon (publishable) key
```

No weather API key needed — Open-Meteo is free and keyless.

For Google OAuth: in the Supabase dashboard → Authentication → Providers → Google, enable it and paste the Google Cloud `Client ID` / `Client Secret`. In Google Cloud, the authorized redirect URI is `<supabase-url>/auth/v1/callback`. Supabase then redirects back to `/auth/callback` on this app.

## Architecture

### Data Flow

```
Browser → useLocation (geolocation / city search via Open-Meteo geocoding + Nominatim reverse)
        → useWeather (SWR, 5-min refresh)
             → /api/openmeteo → Open-Meteo (current, hourly, daily, minutely_15)
        → useChat (localStorage persistence)
             → /api/chat → Gemini gemini-2.5-flash
```

Weather data is transformed via `src/lib/weatherService.ts` from Open-Meteo's raw format into the app's internal types.

### Key Decisions

- **Open-Meteo**: Returns Celsius temperatures and km/h wind speeds natively. Uses WMO weather codes (0-99). The API provides hourly data for 7 days and daily data for 16 days in a single call. No API key required.
- **Gemini chat context**: `src/lib/gemini.ts` builds a system prompt injecting current conditions, hourly, and daily data. The `/api/chat` route bootstraps chat history with a fake user/model exchange to set the system role (Gemini doesn't have a native `system` role in `startChat`).
- **Location hydration**: `useLocation` starts with `null` to match SSR, then immediately populates from `localStorage`, then refreshes via geolocation in the background. This prevents hydration mismatches.
- **`useWeather` guard**: The SWR fetcher returns error objects as resolved JSON, not thrown errors — always check data exists before parsing.

### Routes

| Route | Purpose |
|---|---|
| `/` | Home — hero weather, AI ask bar, outfit card, share button |
| `/technical` | Bento grid: metrics, sun/UV, pollen, precip chart, yesterday comparison |
| `/overview` | Weekly outlook + 14-day temperature trend chart |
| `/chat` | Full-screen AI chat with quick-prompt chips |
| `/settings` | Account, profile, prefs, AI personality, video bg, danger zone |
| `/locations` | Saved places with live weather cards |
| `/insight` | AI-generated daily briefing + best activity windows |
| `/trip` | Trip planner (destination + dates → AI packing list + watchouts) |
| `/pricing` | Free vs Pro tier + Stripe Checkout |
| `/sign-in`, `/sign-up`, `/reset` | Auth (route group, no nav shell) |
| `/privacy` | Privacy policy |
| `/api/openmeteo` | Weather passthrough |
| `/api/chat`, `/headline`, `/outfit`, `/activity`, `/trip` | AI endpoints (Play Integrity + tier rate limited) |
| `/api/warnings` | Severe-weather heuristic on Open-Meteo 48h forecast |
| `/api/historical` | Yesterday's daily summary (Open-Meteo archive) |
| `/api/airpollution` | AQI + pollen |
| `/api/geocode`, `/ip-location` | Location lookups |
| `/api/me` | Signed-in user + tier + today's usage |
| `/api/account/delete`, `/export` | GDPR endpoints |
| `/api/push/subscribe` | Register web push / FCM token |
| `/api/stripe/{checkout,portal,webhook}` | Billing |
| `/auth/{callback,sign-out}` | Supabase session handling |
| `/api/health` | Liveness probe |

### Server-side helpers

- `src/lib/supabase/{client,server,middleware,auth,usage,sync}.ts` — Supabase glue
- `src/lib/playIntegrity.ts` — gates `/api/*` for non-same-origin requests
- `src/lib/subscriptions.ts` — `Tier`, `TIER_LIMITS`, `limitFor`
- `src/lib/stripe.ts` — lazy Stripe client + price IDs

### Mobile

`mobile/` is a Flutter Android app sharing the same `/api/*`. State
uses Riverpod. Auth + cloud sync work via `supabase_flutter` once env
vars are passed at build time (`--dart-define SUPABASE_URL=…`).

Key mobile components:
- `state/auth_provider.dart`, `state/cloud_sync.dart`
- `widgets/{account_section, danger_zone, severe_weather_banner, outfit_card, share_button, offline_banner, onboarding_sheet, weather_video_background}`
- `screens/{auth,trip,…}/`

### Background docs

- `docs/SETUP.md` — Monday checklist
- `docs/ANDROID_SCENARIOS.md` — 50+ user-flow tests with status

### Design System

Dark "Celestial Curator" theme. Key tokens in `tailwind.config.ts`:
- Background: `surface.DEFAULT` = `#10131c`, atmospheric glow via `bg-atmospheric-glow`
- Primary accent: `#c7bfff` (lavender), gradient `#806EF8 → #5896FD`
- Glass cards: `backdrop-blur` + `rgba` backgrounds — defined as `.glass-card` / `.glass-input` in `globals.css`
- Typography: Plus Jakarta Sans (`--font-jakarta`) for headlines/body, Inter (`--font-inter`) for labels
- **Avoid `@apply` with nested Tailwind color objects** (e.g., `@apply bg-surface-DEFAULT` fails) — use hardcoded hex values or `bg-[#10131c]` syntax in CSS files instead.
