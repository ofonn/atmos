# Atmos — 50 user journey scenarios

Each scenario walks through what a user would do, what each step
triggers, and whether the supporting code exists. Legend:

- ✅ **Implemented** — code exists, build passes, exercised in this PR
- ⚠️ **Partial** — works in code but depends on something external you
  still need to configure (Supabase project, OAuth secret, etc.)
- ❌ **Missing** — needs a follow-up PR

> Audit method: code presence + build-time type checks. UI runtime
> verification still needs a browser run-through.

---

## A. Onboarding & auth

### 1. First-time visitor lands on the home page
1. Browser hits `/` → SSR renders the layout. ✅
2. `useLocation` reads `atmos_location` from localStorage. Empty. ✅
3. Falls back to `/api/ip-location` for instant approximate coords. ✅
4. Geolocation prompt fires in background; if granted, upgrades to GPS. ✅
5. `useWeather` SWR fires `/api/openmeteo` for that location. ✅
6. Home page renders hero + hourly. ✅

### 2. User signs up with email + password
1. User clicks the "Sign in or sign up" button in `/settings`. ✅
2. Routes to `/sign-up` (client component, no auth gate needed). ✅
3. Fills email + password, submits. ✅
4. `supabase.auth.signUp` is called via browser SDK. ✅
5. Confirmation email is sent — user clicks the link. ⚠️ depends on email template setup in Supabase Dashboard
6. Redirect hits `/auth/callback?code=...` → server exchanges code for session. ✅
7. Triggers run: `profiles`, `subscriptions(tier=free)`, `user_preferences`, `streaks` rows created. ✅
8. Cookie written → middleware refreshes session on next request. ✅

### 3. User signs in with Google
1. Clicks "Continue with Google" on `/sign-in`. ✅
2. `supabase.auth.signInWithOAuth({ provider: 'google' })` opens consent screen. ✅
3. Google → Supabase → `/auth/callback?code=...`. ✅
4. Server exchanges code, sets cookie, redirects to `next` param. ✅
5. Profile row auto-created from `raw_user_meta_data` (display_name, avatar). ✅
6. Requires Google OAuth Client to be configured in Supabase Dashboard. ⚠️

### 4. User signs out
1. `AccountSection` shows "Sign out" button when signed in. ✅
2. Click calls `supabase.auth.signOut()` from `AuthContext`. ✅
3. `router.refresh()` re-renders settings page; user state goes null. ✅
4. Server middleware drops the session cookie on next request. ✅

### 5. Forgot password
1. User clicks "Forgot password" on `/sign-in`. ❌ no link in the form
2. Would call `supabase.auth.resetPasswordForEmail`. ❌
3. Add a "Forgot?" link and a `/auth/reset` page in a follow-up. ❌

### 6. User edits their display name
1. Signed in, opens `/settings`. ✅
2. Sees the **Profile** card with name + avatar fields populated from `profiles`. ✅
3. Types new name, clicks Save → updates `profiles.display_name` via Supabase. ✅
4. Optimistic "Saved" check icon shows for 2 seconds. ✅

### 7. User uploads an avatar
1. User pastes a public image URL in the **Avatar URL** field. ✅
2. Saved to `profiles.avatar_url`. ✅
3. Native file upload via Supabase Storage. ❌ Storage bucket + upload flow not built yet.

### 8. Auth not configured locally (no Supabase env vars)
1. `AuthProvider` constructs with `disabled=true`. ✅
2. `AccountSection` returns null (hidden). ✅
3. `/sign-in` page shows "Auth not configured" message. ✅
4. Other features keep working from localStorage. ✅

---

## B. Location management

### 9. User searches for a city
1. Opens the search bar (header / `/locations` / `/settings`). ✅
2. Submits "Paris" → `/api/geocode?q=Paris`. ✅
3. Open-Meteo geocoding returns lat/lon + admin metadata. ✅
4. `useLocation.searchCity` writes to `atmos_location` + adds to saved list. ✅
5. SWR re-fetches weather for new coords. ✅

### 10. User saves a favorite location
1. From `/locations` page, taps "Add" or search adds automatically. ✅
2. Local state appended; `atmos_saved_locations` localStorage updated. ✅
3. If signed in, **CloudSync** poll (every 30s) pushes to `saved_locations` table. ✅
4. RLS enforces `auth.uid() = user_id` on insert. ✅

### 11. User opens app on a second device
1. Signs in on the new device. ✅
2. `AuthContext` emits user → `CloudSync.pullOnSignIn` fires. ✅
3. Pulls remote `saved_locations`, `chat_messages`, `user_preferences`. ✅
4. Writes into localStorage; dispatches `'storage'` event. ✅
5. `SettingsContext` re-reads and updates UI; `useLocation` sees new saved list on next mount. ✅

### 12. User removes a saved place
1. Tap delete on `/locations`. ✅
2. `useLocation.removeLocation` filters local array + saves localStorage. ✅
3. Next CloudSync push DELETEs all + re-inserts the new list. ✅

### 13. User syncs GPS location
1. Taps "Use current location" in `/settings`. ✅
2. Geolocation prompt → coords → reverse geocode via `/api/geocode`. ✅
3. localStorage + state updated; weather SWR refreshes. ✅

### 14. User taps a saved place to make it current
1. `/locations` page calls `setAsCurrentLocation`. ✅
2. `atmos_location` overwritten; SWR re-keys + refetches. ✅

---

## C. Weather features

### 15. User checks current temperature on home
1. Renders `current.temp` from `useWeatherContext`. ✅
2. Unit display via `displayTemp` with `tempUnit` from settings. ✅

### 16. User scrolls to hourly forecast
1. `HourlyForecast` reads `rawHourlyCards` (raw meteo) or `hourly`. ✅
2. Renders 24-hour strip. ✅

### 17. User wants an outfit recommendation
1. Home page mounts `OutfitCard` with current weather props. ✅
2. POSTs `/api/outfit` with temp/feels/condition/wind/humidity/pop. ✅
3. Server calls Gemini with rotation, parses JSON. ✅
4. Renders tldr + 4 chip items + tip. ✅
5. Re-fetches when rounded temp or condition code changes (memoized). ✅

### 18. User wants the best time to go for a run
1. Opens `/insight` page. ✅
2. `ActivityCard` POSTs `/api/activity` with 18-hour compact data. ✅
3. Returns 2-3 windows with activity / start / end / why. ✅
4. Falls back to message if no good windows (heavy rain all day). ✅

### 19. User plans a trip
1. Bottom nav → `/trip`. ✅
2. Enters "Tokyo", start 2026-06-01, end 2026-06-05. ✅
3. Submit → `/api/geocode` → `/api/openmeteo` → filters daily by date range. ✅
4. POSTs `/api/trip` with destination + daily forecast. ✅
5. AI returns `summary`, `packing[]`, `watchouts[]`. ✅
6. Renders summary card, watchouts (if any), numbered packing list. ✅
7. Dates outside 16-day forecast window return a clear error. ✅

### 20. User checks UV at peak
1. Opens `/technical`. ✅
2. `SunUVCard` shows sunrise, sunset, UV index, color-coded label + tip. ✅

### 21. User checks pollen
1. `PollenCard` renders only if any pollen value > 0. ✅
2. Bars per allergen colored by severity. ✅
3. Hidden when API returns null. ✅

### 22. User checks if rain is coming in the next 6 hours
1. `/technical` → `PrecipChart` renders 24 × 15-min slots. ✅
2. Heights scaled to local max so any rain is visible. ✅
3. "No precipitation expected." copy if all zero. ✅

### 23. User compares today vs yesterday
1. `ComparisonRow` calls `/api/historical?lat&lon`. ✅
2. Open-Meteo archive endpoint returns yesterday's high/low. ✅
3. UI shows ↑/↓ arrows colored red/blue with delta + reference. ✅

### 24. User checks the 14-day temperature trend
1. `/overview` → `TempTrendChart` SVG renders min + max lines from daily[]. ✅
2. Legend, axis labels via min/max value in corner. ✅

### 25. User shares the current weather
1. Home page → "Share" chip. ✅
2. Builds a formatted text snippet (city, temp, condition, hi/lo). ✅
3. Calls Web Share API; falls back to clipboard copy with "Copied!" toast. ✅

### 26. User sees a severe weather alert
1. Banner shows from `<SevereWeatherBanner title="..." />`. ✅
2. User clicks X → dismissal hashed by content + stored in localStorage. ✅
3. Stays dismissed for 12 hours, then re-appears (in case the alert is still active). ✅
4. Note: the banner is prop-driven; the upstream "fetch active alerts" hook is not yet wired up. ❌

### 27. User opens the radar
1. `/radar` exists in routes. ✅
2. `RadarPreview` uses leaflet + RainViewer overlay. ✅

### 28. User chats with the AI
1. `/chat` → enter message → `/api/chat` with weather context. ✅
2. Gemini reply rendered as `ChatMessage`. ✅
3. Persisted to `atmos_chat_messages` localStorage. ✅
4. If signed in, CloudSync mirrors to `chat_messages` table. ✅

### 29. User clears chat history
1. Calls `clearChat()` → wipes localStorage + state. ✅
2. Next CloudSync push deletes remote chat_messages (full replace). ✅

---

## D. Preferences & personalization

### 30. User switches Celsius → Fahrenheit
1. `/settings` → temperature segmented control. ✅
2. `updateSetting('tempUnit', 'F')` writes to localStorage + state. ✅
3. All temp displays re-render with new unit (re-read context). ✅
4. CloudSync pushes to `user_preferences.temp_unit`. ✅

### 31. User tunes AI emoji use
1. `/settings` → AI Personality → Emoji use → "None". ✅
2. Stored as `aiEmojiUse` in settings. ✅
3. Synced to `user_preferences.ai_emoji_use`. ✅
4. Wire into prompt builder so Gemini honors it. ❌ prompt builder not yet reading these new fields

### 32. User tunes AI verbosity
1. `/settings` → AI Personality → Verbosity → "Short". ✅
2. Similar to 31. Prompt-builder wiring still pending. ❌

### 33. User picks a headline tone (existing)
1. `/settings` → Headline Tone grid → "Sarcastic". ✅
2. `headlineTone` flows into existing `/api/headline` prompt. ✅
3. Synced to `user_preferences.headline_tone`. ✅

### 34. User changes theme
1. `/settings` → Theme → "Light". ✅
2. `next-themes` toggles `html.class`. ✅
3. Not synced to Supabase (browser-only preference). ⚠️ intentional

---

## E. Engagement / streaks / PWA

### 35. User opens the app daily
1. `StreakTracker` mounted at root. ✅
2. On signed-in mount, fires `bump_streak` RPC once per day per session. ✅
3. Server logic: same-day no-op, consecutive day +1, gap reset to 1. ✅
4. `/settings` → `StreakBadge` shows current / longest / total. ✅

### 36. User wants to install Atmos as a PWA
1. Browser fires `beforeinstallprompt`. ✅
2. `InstallPrompt` captures + renders install banner. ✅
3. Click "Install" → calls `evt.prompt()` → Chrome install dialog. ✅
4. Dismiss → stored in localStorage for 14 days. ✅
5. Requires a valid `manifest.json` (already in public/). ✅

### 37. User loses network
1. `SWRegister` registered `/sw.js` on first prod load. ✅
2. Service worker intercepts `GET /api/openmeteo` with stale-while-revalidate. ✅
3. Offline → cache returns last forecast; UI still renders. ✅
4. `OfflineBanner` (existing) shows online/offline state. ✅

### 38. User gets a push notification
1. Service worker already has push handler. ✅
2. Requires VAPID + subscription persistence on the server. ❌ not wired up
3. `useNotifications` hook exists but no backend push delivery. ❌

---

## F. Billing & limits (foundation only)

### 39. New user is on the Free tier
1. Signup trigger inserts subscription row with `tier='free'`, `status='active'`. ✅
2. `getUserTier(userId)` returns `'free'` until row changes. ✅

### 40. User hits the daily chat limit
1. Chat route would call `enforceUsage('chat', tier)`. ⚠️ helper exists, not yet wired into `/api/chat`
2. RPC `increment_api_usage` atomically increments. ✅
3. Returns 429 with `{ tier, limit }` when over. ✅
4. UI fallback: chat shows an error message; copy is generic. ⚠️ add a "Upgrade for more" CTA in follow-up

### 41. User upgrades to Pro
1. Pricing / checkout page. ❌ not built
2. Stripe checkout session + customer ID flow. ❌
3. Stripe webhook updates `subscriptions.tier='pro'`, `current_period_end`. ❌
4. `getUserTier` re-evaluates on next call. ✅ (will work once row flips)

### 42. Pro user's subscription expires
1. Webhook flips `status='past_due'` or `current_period_end < now()`. ❌ webhook not built
2. `getUserTier` returns `'free'` again. ✅

---

## G. Mobile (Flutter)

### 43. User installs the Android app
1. Build via `flutter build apk --dart-define SUPABASE_URL=... SUPABASE_ANON_KEY=...`. ✅
2. APK launches → `main.dart` initializes Supabase if env present. ✅
3. Falls back to anonymous mode without crashing if missing. ✅

### 44. User taps "Sign in" in the mobile app
1. Nav to `/sign-in`. ✅
2. Email + password form (`SignInScreen`). ✅
3. `supabase_flutter` SDK signs in; auth state stream updates. ✅
4. Returns to previous screen. ✅
5. Needs a Sign-In entry point in the Mobile settings screen. ❌ not yet wired

### 45. User signs in with Google on mobile
1. `signInWithOAuth(OAuthProvider.google, redirectTo: 'com.atmos.app://login-callback')`. ✅
2. AndroidManifest needs the deep-link intent filter. ❌ not added yet
3. Supabase project needs the deep-link in redirect allow-list. ⚠️ dashboard step

### 46. Mobile app gates /api access
1. All `/api/*` routes call `requirePlayIntegrity()` first. ✅
2. Mobile sends `x-play-integrity-token` header per request. ✅
3. Server validates; same-origin browser requests skip the check. ✅

---

## H. Edge cases

### 47. User in a region with no Open-Meteo data
1. `/api/openmeteo` returns the upstream error JSON. ✅
2. `useWeather` SWR fetcher returns the error object (not thrown). ✅
3. UI shows the loading / fallback states. ✅

### 48. User has location permission denied
1. Geolocation callback errors out. ✅
2. Falls back to IP location result. ✅
3. If both fail, shows the "Welcome — set a city" empty state. ✅

### 49. User switches devices while Gemini hits its rate limit
1. `/api/chat` rotates through `GEMINI_MODELS`. ✅
2. If all exhausted, returns error JSON. ✅
3. UI surfaces the error message in chat as an assistant message. ✅

### 50. User opens settings before signing in
1. `AccountSection` shows the "Sign in or sign up" CTA. ✅
2. `ProfileEditor` and `StreakBadge` render null when no user. ✅
3. Theme / units / headline tone still work from localStorage. ✅

---

## Known follow-ups (collected from the ⚠️/❌ above)

| Scenario | What's needed |
|---|---|
| 5 | `/auth/reset` page + reset-password email template |
| 7 | Supabase Storage bucket + avatar upload widget |
| 26 | Wire SevereWeatherBanner to a real alerts source (Open-Meteo warnings or NWS) |
| 31, 32 | Update `gemini.ts` `buildSystemPrompt` to read `aiEmojiUse`, `aiVerbosity` |
| 38 | VAPID keys + push subscription table + server-side push dispatch |
| 40 | Add `enforceUsage` calls to `/api/chat`, `/api/headline`, `/api/insight`, etc. + upgrade CTA |
| 41–42 | Stripe checkout, webhook handler, customer portal link |
| 44 | Add "Sign in" entry on mobile Settings screen |
| 45 | AndroidManifest intent-filter for `com.atmos.app://login-callback` |
