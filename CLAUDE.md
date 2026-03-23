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
OPENWEATHER_API_KEY=   # Free tier: current weather + 5-day/3-hour forecast
GEMINI_API_KEY=        # Use gemini-2.5-flash (NOT 2.0-flash — it has 0 quota)
```

Both keys are validated at the route handler level — missing/placeholder keys return a 500 with a clear error.

## Architecture

### Data Flow

```
Browser → useLocation (geolocation / city search)
        → useWeather (SWR, 5-min refresh)
             → /api/weather  → OpenWeatherMap /weather
             → /api/forecast → OpenWeatherMap /forecast (3-hour, 5-day)
        → useChat (localStorage persistence)
             → /api/chat → Gemini gemini-2.5-flash
```

All API keys live server-side only — the four API routes in `src/app/api/` act as proxies.

### Key Decisions

- **OpenWeatherMap free tier**: Returns Kelvin temperatures — always convert via `kelvinToCelsius` / `mpsToKmh` from `src/lib/utils.ts`. The free forecast endpoint gives 3-hour intervals; daily data is derived by grouping in `useWeather.ts` (not from a separate API call).
- **Gemini chat context**: `src/lib/gemini.ts` builds a system prompt injecting current conditions, hourly, and daily data. The `/api/chat` route bootstraps chat history with a fake user/model exchange to set the system role (Gemini doesn't have a native `system` role in `startChat`).
- **Location hydration**: `useLocation` starts with `null` to match SSR, then immediately populates from `localStorage`, then refreshes via geolocation in the background. This prevents hydration mismatches.
- **`useWeather` guard**: Always check `weatherData?.main` (not just `weatherData`) before parsing — the SWR fetcher returns error objects as resolved JSON, not thrown errors.

### Routes

| Route | Purpose |
|---|---|
| `/` | Home — hero weather, AI ask bar, quick nav |
| `/technical` | Bento grid of metrics (humidity, pressure, wind, visibility) + hourly timeline |
| `/overview` | Weekly outlook — featured tomorrow card + 7-day grid |
| `/chat` | Full-screen AI chat with quick-prompt chips |

### Design System

Dark "Celestial Curator" theme. Key tokens in `tailwind.config.ts`:
- Background: `surface.DEFAULT` = `#10131c`, atmospheric glow via `bg-atmospheric-glow`
- Primary accent: `#c7bfff` (lavender), gradient `#806EF8 → #5896FD`
- Glass cards: `backdrop-blur` + `rgba` backgrounds — defined as `.glass-card` / `.glass-input` in `globals.css`
- Typography: Plus Jakarta Sans (`--font-jakarta`) for headlines/body, Inter (`--font-inter`) for labels
- **Avoid `@apply` with nested Tailwind color objects** (e.g., `@apply bg-surface-DEFAULT` fails) — use hardcoded hex values or `bg-[#10131c]` syntax in CSS files instead.
