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
GEMINI_API_KEY=        # Use gemini-2.5-flash (NOT 2.0-flash — it has 0 quota)
```

No weather API key needed — Open-Meteo is free and keyless.

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
| `/` | Home — hero weather, AI ask bar, quick nav |
| `/technical` | Bento grid of metrics (humidity, pressure, wind, visibility) + hourly timeline |
| `/overview` | Weekly outlook — featured tomorrow card + 16-day forecast |
| `/chat` | Full-screen AI chat with quick-prompt chips |
| `/settings` | Theme (light/dark/system), units, location management |
| `/locations` | Saved places with live weather cards |
| `/insight` | AI-generated daily briefing |

### Design System

Dark "Celestial Curator" theme. Key tokens in `tailwind.config.ts`:
- Background: `surface.DEFAULT` = `#10131c`, atmospheric glow via `bg-atmospheric-glow`
- Primary accent: `#c7bfff` (lavender), gradient `#806EF8 → #5896FD`
- Glass cards: `backdrop-blur` + `rgba` backgrounds — defined as `.glass-card` / `.glass-input` in `globals.css`
- Typography: Plus Jakarta Sans (`--font-jakarta`) for headlines/body, Inter (`--font-inter`) for labels
- **Avoid `@apply` with nested Tailwind color objects** (e.g., `@apply bg-surface-DEFAULT` fails) — use hardcoded hex values or `bg-[#10131c]` syntax in CSS files instead.
