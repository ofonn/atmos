# Atmos - Project Overview & Context

Atmos is a high-fidelity, AI-powered weather application built with **Next.js 14 (App Router)**, **TypeScript**, and **Framer Motion**. It provides real-time weather data, 16-day forecasts, air quality metrics, and personalized AI-generated weather insights.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom "Celestial Curator" theme)
- **Animations:** Framer Motion
- **Data Fetching:** SWR (Stale-While-Revalidate)
- **Weather Data:** Open-Meteo API (Free, keyless)
- **AI Engine:** Google Gemini (gemini-1.5-flash)
- **Icons:** Meteocons (Custom `MeteoIcon` component) & Lucide-React

## 🏗️ Architecture & Data Flow

### Core Logic
- **`src/lib/weatherService.ts`**: The single source of truth for transforming raw Open-Meteo API data into the app's internal TypeScript models.
- **`src/hooks/useWeather.ts`**: Handles SWR fetching from `/api/openmeteo` and triggers transformations.
- **`src/hooks/useLocation.ts`**: Manages geolocation, city search (geocoding), and `localStorage` persistence for the current location.
- **`src/contexts/WeatherContext.tsx`**: Provides global weather and location state to the entire component tree.

### AI Integration
- **`src/api/chat/route.ts`**: Proxies requests to Google Gemini, injecting current weather context into the system prompt.
- **`src/hooks/useAiContent.ts`**: Custom hook for fetching and caching AI-generated weather headlines and advice.

### Design System
- **Theme:** Primarily dark "Celestial Curator" with glassmorphism effects (`.glass-card`, `.glass-input`).
- **Colors:** Deep blues (`#10131c`), lavender accents (`#c7bfff`), and atmospheric gradients.
- **Typography:** **Plus Jakarta Sans** for headlines/body and **Inter** for labels.
- **Responsive:** Mobile-first design optimized for "app-like" feel on devices.

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production (includes linting and type-checks)
npm run build

# Run linting only
npm run lint

# Start production server
npm run start
```

## 📝 Conventions & Standards

- **Functional Components:** Use React functional components with TypeScript interfaces for props.
- **Custom Hooks:** Business logic (fetching, state orchestration) should live in `src/hooks`.
- **Type Safety:** Maintain strict TypeScript definitions in `src/types/weather.ts`. UI components should *never* consume raw API response shapes.
- **Styling:** Prefer Tailwind utility classes. Use the `.glass-card` class for consistent container styling. Avoid `@apply` with nested Tailwind color objects in CSS files.
- **Performance:** Utilize SWR's caching and revalidation to minimize unnecessary API calls.

## 📍 Key Routes

- `/`: Home — Hero weather, dynamic AI headline, and quick navigation.
- `/technical`: Detailed metrics (pressure, humidity, UV, etc.) in a bento grid.
- `/overview`: Long-range 16-day forecast and tomorrow's outlook.
- `/chat`: Interactive AI assistant for weather-related queries.
- `/locations`: Management for saved cities with live weather cards.
- `/settings`: Configuration for units, themes, and notification preferences.
