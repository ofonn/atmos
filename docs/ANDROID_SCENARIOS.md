# Atmos Android — 50+ user scenarios (test & dev checklist)

Each entry is a real user flow on the **Android app** (Flutter, `mobile/`).
Use this as the source-of-truth for QA, regression testing, product
planning, and to track what's actually shipped vs. still needs work.

**Status legend**
- ✅ **Implemented** — code path exists, expected to work end-to-end once
  prerequisites are configured (Supabase project, Play Integrity, etc.)
- 🟡 **Partial** — UI / data layer exists but missing one piece (a button,
  a backend route, a deep link, etc.)
- ❌ **Not implemented** — no code yet; needs a build

**Effort legend**
- 🧑‍💻 **Manual task for you** — something only a human can do in a dashboard
- 🤖 **Can be automated through MCP later** — when relevant MCP connects, an agent can do it
- 🔧 **Code work** — I (Claude) can build it in a follow-up

---

## A. Onboarding & first launch

### A1 — First-time install opens the app
- **User goal:** see the weather without any setup friction.
- **Steps:**
  1. User installs Atmos APK / AAB from Play Store / sideload.
  2. Taps the launcher icon.
  3. `main.dart` initializes Flutter + Riverpod, calls `Supabase.initialize()` (if env vars present).
  4. Splash screen / launch theme renders briefly.
  5. App routes to `/` (HomeScreen).
  6. `locationProvider` checks `shared_preferences` for a cached location.
  7. If no cache, kicks off geolocation + reverse-geocode.
- **Expected behavior:** weather hero card visible within ~3 seconds on a warm-cached install, ~6 seconds cold.
- **Status:** ✅ Implemented
- **Bugs / missing:** None known. Cold-start time depends on network.
- **Next steps:** Add a real splash image (currently uses default LaunchTheme).

### A2 — User denies location permission on first prompt
- **User goal:** still see something useful instead of an empty screen.
- **Steps:**
  1. Cold launch.
  2. `Geolocator.requestPermission()` triggers system dialog.
  3. User taps "Don't allow".
  4. `locationProvider` catches the denial.
  5. App falls back to manual city entry / saved location.
- **Expected behavior:** an empty-state card with a "Search a city" CTA appears; no infinite spinner.
- **Status:** 🟡 Partial — denial path exists in `location_provider.dart` line 186 but no UI affordance to recover (no visible "Search a city" CTA in HomeScreen when location is null).
- **Bugs / missing:** Empty state on HomeScreen needs a tap-to-search button. Currently shows a generic loading state.
- **Next steps:** 🔧 Add an empty-state widget to `HomeScreen` that wires through to `LocationsScreen` search.

### A3 — User on airplane mode launches the app
- **User goal:** see last-known forecast, not an error.
- **Steps:**
  1. Cold launch in airplane mode.
  2. `weatherProvider` SWR-style fetch fires.
  3. dio request times out (connect timeout 12s).
  4. `weatherProvider` falls back to cached `shared_preferences` value.
- **Expected behavior:** last cached forecast displays with an "Offline" banner.
- **Status:** 🟡 Partial — cache exists in `storage.dart`, banner missing on mobile (only on web).
- **Bugs / missing:** No `OfflineBanner` widget on mobile. Connectivity awareness not wired in.
- **Next steps:** 🔧 Add `connectivity_plus` dependency + an offline banner shown when last fetch was an error.

### A4 — User first-time accepts location permission
- **User goal:** get accurate weather for where they are.
- **Steps:**
  1. Cold launch.
  2. System permission dialog shown.
  3. User taps "While using the app".
  4. `Geolocator.getCurrentPosition` returns coords (within ~3s on warm GPS).
  5. Reverse geocode via `/api/geocode?lat&lon`.
  6. `weatherProvider` keys on (lat, lon) and fetches.
- **Expected behavior:** hero card shows correct city within ~5 seconds.
- **Status:** ✅ Implemented
- **Bugs / missing:** None known.
- **Next steps:** Consider caching the last 3 reverse-geocoded names to avoid round trips.

### A5 — Returning user reopens app the next day
- **User goal:** instantly see updated weather.
- **Steps:**
  1. User taps the launcher.
  2. App resumes — `weatherProvider` already has stale cache.
  3. Render stale data immediately.
  4. Background re-fetch in parallel.
  5. UI swaps to fresh data when arrived.
- **Expected behavior:** zero-perceived-latency open; cached UI then fresh data.
- **Status:** ✅ Implemented (stale-while-revalidate pattern in `weatherProvider`).
- **Next steps:** Add a subtle "Updated 2 min ago" timestamp on HomeScreen.

---

## B. Auth & account

### B1 — User wants to sign up with email/password
- **User goal:** create an account to sync data across devices.
- **Steps:**
  1. User opens Settings (bottom nav → Settings).
  2. Scrolls to Account section (NOT YET PRESENT — see below).
  3. Taps "Sign in or sign up".
  4. Navigates to `/sign-in`.
  5. Toggles to "Need an account? Sign up".
  6. Enters email + password (min 6 chars).
  7. Taps "Create account".
  8. Supabase sends a confirmation email.
- **Expected behavior:** success banner "Check your inbox to confirm."
- **Status:** 🟡 Partial — `/sign-in` screen exists (`screens/auth/sign_in_screen.dart`) but no entry point from `SettingsScreen`. User can't reach it through normal navigation.
- **Bugs / missing:** Account section absent from `settings_screen.dart`.
- **Next steps:** 🔧 Add an Account card at the top of `SettingsScreen` that watches `currentUserProvider` and shows either "Sign in" or the user email + Sign out.

### B2 — User confirms email and is auto-redirected back into the app
- **User goal:** finish account creation without confusion.
- **Steps:**
  1. User receives confirmation email.
  2. Taps the confirm link → opens Chrome.
  3. Chrome navigates to `<supabase>/auth/v1/verify?...`.
  4. Supabase confirms and redirects to `com.atmos.app://login-callback?...`.
  5. Android intent filter matches → app reopens.
  6. Auth state stream emits → user is now signed in.
- **Expected behavior:** seamless return to the app, logged in.
- **Status:** ❌ Not implemented — `com.atmos.app://login-callback` intent filter is NOT in `AndroidManifest.xml`. Without it, the deep link won't open the app.
- **Bugs / missing:** Missing `<intent-filter>` for `BROWSABLE + VIEW + scheme="com.atmos.app"`.
- **Next steps:** 🔧 Add the intent filter (see "fix" patch below — already added on this branch).

### B3 — User wants to sign in with Google
- **User goal:** skip the password.
- **Steps:**
  1. Settings → Account → Sign in.
  2. SignInScreen → tap "Continue with Google".
  3. `signInWithOAuth(OAuthProvider.google)` opens Chrome Custom Tab.
  4. User picks their Google account.
  5. Consent screen → Continue.
  6. Redirect back to `com.atmos.app://login-callback`.
  7. App resumes signed-in.
- **Expected behavior:** ~10 seconds end-to-end; user lands back on Settings with their email shown.
- **Status:** 🟡 Partial — Code path exists; deep link not configured (B2); Supabase Google provider also requires manual setup in dashboard.
- **Bugs / missing:** intent filter + Supabase Google OAuth client.
- **Next steps:** 🧑‍💻 **Manual task for you** — Google OAuth client (`docs/SETUP.md` §1.5). 🔧 Add the intent filter (done on this branch).

### B4 — User wants to sign out
- **User goal:** stop syncing on a shared device.
- **Steps:**
  1. Settings → Account → "Sign out".
  2. Confirm dialog (optional).
  3. `supabase.auth.signOut()` runs.
  4. Auth state stream emits null user.
  5. UI swaps back to "Sign in or sign up" CTA.
- **Expected behavior:** local cache stays (last forecast still visible); cloud sync stops.
- **Status:** 🟡 Partial — `supabase_flutter` supports it but the Settings UI doesn't expose it yet (B1).
- **Bugs / missing:** Sign-out button missing.
- **Next steps:** 🔧 Add to AccountSection on mobile.

### B5 — User forgot their password
- **User goal:** reset and sign back in.
- **Steps:**
  1. SignInScreen → tap "Forgot password?".
  2. Enter email → tap "Send reset link".
  3. Supabase sends a reset email.
  4. Click link → app opens via deep link.
  5. Prompt for new password.
  6. Submit → signed in with new password.
- **Expected behavior:** lands in the app authenticated.
- **Status:** ❌ Not implemented — no "Forgot?" link in `SignInScreen`. No `/auth/reset` screen on mobile.
- **Bugs / missing:** UI + recovery handler + deep-link routing.
- **Next steps:** 🔧 Add a "Forgot?" link and a Reset screen that handles `PasswordRecovery` auth events.

### B6 — User has an account on web, opens the Android app
- **User goal:** see their saved cities and chat history without re-adding.
- **Steps:**
  1. User signs in on Android.
  2. Auth state stream fires.
  3. On `AuthChangeEvent.signedIn`, app pulls remote `saved_locations`, `chat_messages`, `user_preferences`.
  4. Writes into `shared_preferences`.
  5. `locationProvider`, `chatProvider`, `settingsProvider` re-read.
- **Expected behavior:** within ~1s the locations list and prefs match web.
- **Status:** ❌ Not implemented — cloud sync only exists on web (`src/components/sync/CloudSync.tsx`). Mobile has no equivalent.
- **Bugs / missing:** Need a Riverpod listener that watches `authStateProvider` and calls a sync method.
- **Next steps:** 🔧 Build `mobile/lib/state/cloud_sync.dart` mirroring the web logic.

### B7 — User edits their display name on mobile
- **User goal:** personalize the account.
- **Steps:**
  1. Settings → Account → tap the user row.
  2. Profile screen opens with current name + avatar.
  3. Edit display name → tap Save.
  4. Update `profiles.display_name` via Supabase.
  5. Success toast.
- **Expected behavior:** name persists across app restarts.
- **Status:** ❌ Not implemented on mobile — only web `ProfileEditor`.
- **Next steps:** 🔧 Add `screens/auth/profile_screen.dart`.

### B8 — User wants to delete their account
- **User goal:** remove all their data (GDPR-style request).
- **Steps:**
  1. Settings → Account → "Delete account".
  2. Confirmation dialog with strict copy.
  3. POST to `/api/account/delete`.
  4. Server uses service-role key to call `auth.admin.deleteUser()`.
  5. Cascade deletes all rows (FK on delete cascade is set on every table).
  6. App signs out and returns to a "Goodbye" screen.
- **Expected behavior:** zero residual data; user can sign up fresh with same email.
- **Status:** ❌ Not implemented — no delete UI, no `/api/account/delete` endpoint.
- **Next steps:** 🔧 Build the endpoint + button. Required for Play Store policy compliance for any app with sign-in.

---

## C. Navigation & nav shell

### C1 — User taps Details in bottom nav from Home
- **User goal:** see detailed metrics.
- **Steps:**
  1. User on `/`.
  2. Taps Details icon in `AtmosBottomNav`.
  3. `context.go('/technical')`.
  4. ShellRoute keeps the bottom nav; child swaps.
  5. TechnicalScreen renders.
- **Expected behavior:** smooth, sub-200ms transition.
- **Status:** ✅ Implemented.
- **Bugs / missing:** none.

### C2 — User wants to go to the Trip planner
- **User goal:** plan an upcoming trip from inside the app.
- **Steps:**
  1. Bottom nav → "Trip".
  2. TripScreen renders with destination + date inputs.
- **Expected behavior:** trip planner accessible in ≤2 taps.
- **Status:** ❌ Not implemented on mobile — only on web `/trip`. No bottom nav item, no screen.
- **Next steps:** 🔧 Add `mobile/lib/screens/trip/trip_screen.dart` and a "Trip" nav item.

### C3 — User uses the system Back gesture from Insight
- **User goal:** return to where they came from.
- **Steps:**
  1. User on `/insight` (entered via a card on home).
  2. Performs back swipe.
  3. `GoRouter.canPop` → `pop()`.
  4. Returns to `/`.
- **Expected behavior:** back navigation works on every screen including system gesture.
- **Status:** ✅ Implemented via `go_router`.
- **Bugs / missing:** None known.

### C4 — User taps the AI floating action button
- **User goal:** quickly open the AI assistant.
- **Steps:**
  1. AI FAB visible above bottom nav (HomeScreen).
  2. Tap → navigate to `/chat`.
  3. ChatScreen focuses input.
- **Expected behavior:** keyboard up, ready to type, in <1 second.
- **Status:** ✅ Implemented (`AiFab` widget).

---

## D. Home / weather display

### D1 — User glances at current temperature
- **User goal:** know "what is it like right now".
- **Steps:**
  1. Open app → HomeScreen.
  2. Hero card shows temp + condition + AI headline.
- **Expected behavior:** temp visible without scroll.
- **Status:** ✅ Implemented.

### D2 — User scrolls hourly forecast
- **User goal:** see how the next 12 hours look.
- **Steps:**
  1. HomeScreen → swipe horizontally on hourly strip.
  2. `HourlyForecast` widget renders 24 cards.
- **Expected behavior:** smooth 60fps scroll, condition emoji + temp on each.
- **Status:** ✅ Implemented.

### D3 — User wants an AI outfit recommendation
- **User goal:** know what to wear.
- **Steps:**
  1. HomeScreen scroll down → OutfitCard.
  2. POSTs `/api/outfit` with current weather.
  3. Renders TL;DR + 4 chips + tip.
- **Expected behavior:** loads in ~3 seconds; updates when conditions change materially.
- **Status:** ❌ Not implemented on mobile — only web. No OutfitCard widget yet on mobile.
- **Next steps:** 🔧 Port `OutfitCard.tsx` → `outfit_card.dart`.

### D4 — User shares the current weather to a friend
- **User goal:** send a quick weather brief via WhatsApp / Messages.
- **Steps:**
  1. HomeScreen → tap "Share" chip.
  2. Build text snippet (city, temp, condition, hi/lo).
  3. Call `share_plus` plugin → system share sheet.
  4. User picks WhatsApp / Messages / etc.
- **Expected behavior:** native share sheet with formatted text.
- **Status:** ❌ Not implemented — `share_plus` dep not added.
- **Next steps:** 🔧 Add dep + Share button on HomeScreen.

### D5 — User pulls down to refresh on HomeScreen
- **User goal:** force a fresh forecast.
- **Steps:**
  1. HomeScreen → pull down.
  2. `RefreshIndicator` triggers.
  3. `weatherProvider.refresh()` fires.
  4. New data renders.
- **Expected behavior:** spinner shows, completes in ~2s.
- **Status:** 🟡 Partial — needs verification that RefreshIndicator wraps the home scroll view. Let me audit `home_screen.dart`.
- **Next steps:** 🔧 Confirm + add `RefreshIndicator` if missing.

### D6 — User sees a severe weather alert banner
- **User goal:** be warned about an upcoming storm.
- **Steps:**
  1. HomeScreen render → check Open-Meteo's `warnings` array.
  2. If any active → red banner at top with title + description.
  3. User taps X → dismissed for 12h.
- **Expected behavior:** dismissable, comes back after 12h if alert still active.
- **Status:** ❌ Not implemented on mobile.
- **Next steps:** 🔧 Mirror web `SevereWeatherBanner` to mobile.

---

## E. Locations & search

### E1 — User searches for a city
- **User goal:** see weather for somewhere they don't live.
- **Steps:**
  1. Bottom nav → Settings → "Search a city" (or LocationsScreen).
  2. Tap text field → enter "Paris".
  3. Hit submit → `/api/geocode?q=Paris`.
  4. Server returns lat/lon + admin1 + country.
  5. Set as current location.
- **Expected behavior:** weather updates within ~3s.
- **Status:** ✅ Implemented in LocationsScreen.

### E2 — User saves a favorite location
- **User goal:** keep "London" pinned.
- **Steps:**
  1. LocationsScreen → search "London".
  2. Tap the result's heart / save icon.
  3. Added to `atmos_saved_locations` in `shared_preferences`.
  4. Appears in saved list.
- **Expected behavior:** persists across app restarts; syncs to Supabase if signed in.
- **Status:** 🟡 Partial — local save works; cloud sync missing (see B6).

### E3 — User views weather of a saved city without changing primary
- **User goal:** peek at a city quickly.
- **Steps:**
  1. LocationsScreen → tap a saved city card.
  2. Detail view shows current temp + 3-day outlook.
  3. Tap Back → primary location unchanged.
- **Expected behavior:** non-destructive preview.
- **Status:** 🟡 Partial — needs audit. Currently tapping may switch the primary location.
- **Next steps:** 🔧 Add a preview-only mode separate from "Set as current".

### E4 — User deletes a saved location
- **User goal:** clean up the list.
- **Steps:**
  1. LocationsScreen → swipe a row left.
  2. Delete button reveals.
  3. Tap → removed from list + storage.
- **Expected behavior:** instant delete; undo snackbar.
- **Status:** 🟡 Partial — delete works; no undo affordance.
- **Next steps:** 🔧 Add an undo snackbar with 5s timeout.

### E5 — User wants the app to remember "Home" and "Work"
- **User goal:** quick-switch between two contexts.
- **Steps:**
  1. LocationsScreen → tap a saved location → "Set as Home".
  2. Tap another → "Set as Work".
  3. HomeScreen shows a top toggle to flip between them.
- **Expected behavior:** one-tap switch on HomeScreen.
- **Status:** ❌ Not implemented — schema supports `is_primary` flag; UI doesn't expose tags.
- **Next steps:** 🔧 Add `is_primary` / `tag` field to saved_location row + UI toggle.

---

## F. AI features

### F1 — User asks the AI "Will I need an umbrella tomorrow?"
- **User goal:** conversational weather query.
- **Steps:**
  1. Tap AI FAB or bottom nav → Chat.
  2. ChatScreen with cached messages from `shared_preferences`.
  3. Type question → submit.
  4. POST `/api/chat` with weather context + history.
  5. Gemini reply streams in.
  6. Persist to local + Supabase.
- **Expected behavior:** reply in 2-5s; chat history syncs across devices.
- **Status:** ✅ Implemented locally; 🟡 Partial for cross-device sync (B6).

### F2 — User uses voice input in chat
- **User goal:** speak instead of type.
- **Steps:**
  1. ChatScreen → tap mic icon.
  2. System prompts for `RECORD_AUDIO` permission.
  3. `speech_to_text` plugin listens.
  4. Transcribed text fills input.
  5. User confirms → submit.
- **Expected behavior:** speech-to-text works reliably; permission denial gracefully ignored.
- **Status:** ✅ Implemented (`speech_to_text: ^7.0.0` in pubspec).
- **Bugs / missing:** verify the mic button is wired in `ChatInput` widget.

### F3 — User taps a quick prompt
- **User goal:** common questions one tap away.
- **Steps:**
  1. ChatScreen → swipe up suggestions tray.
  2. Tap "Best time to run today?".
  3. Auto-fills + sends.
- **Expected behavior:** speedy and obvious; no manual typing for top-3 questions.
- **Status:** 🟡 Partial — quick prompts exist on web; verify mobile equivalent in `chat_screen.dart`.
- **Next steps:** 🔧 Mirror `QuickPrompts.tsx` to mobile if missing.

### F4 — User wants the AI to use no emojis
- **User goal:** personalize AI personality.
- **Steps:**
  1. Settings → AI Personality → Emoji use → "None".
  2. Setting persists locally + syncs to Supabase.
  3. Future `/api/chat` calls pass `aiEmojiUse=none` in the prompt context.
  4. Replies stop including emojis.
- **Expected behavior:** change takes effect on the next message.
- **Status:** ❌ Not implemented on mobile — only web settings UI. Mobile settings don't yet have these toggles.
- **Next steps:** 🔧 Add AiEmojiUse + AiVerbosity to mobile `SettingsNotifier` + UI rows.

### F5 — User plans a trip in the app
- **User goal:** packing list for next weekend.
- **Steps:**
  1. Bottom nav → Trip.
  2. Enter destination + start/end dates.
  3. Submit → `/api/trip`.
  4. Renders summary + packing list + watchouts.
- **Expected behavior:** 3-10s response with actionable list.
- **Status:** ❌ Not implemented on mobile (see C2).

---

## G. Settings & preferences

### G1 — User switches °C to °F
- **User goal:** units they understand.
- **Steps:**
  1. Settings → Units → Temperature → "°F".
  2. `SettingsNotifier.setTempUnit('F')` writes to `shared_preferences`.
  3. All temperature widgets re-read via Riverpod.
- **Expected behavior:** instant change everywhere.
- **Status:** ✅ Implemented.

### G2 — User switches to 12h clock
- **User goal:** AM/PM display.
- **Steps:** Same shape as G1 but for time format.
- **Status:** ✅ Implemented.

### G3 — User picks a headline tone
- **User goal:** make the AI sound funny / sarcastic / informative.
- **Steps:** Settings → Headline → tap tone chip → persists.
- **Status:** ✅ Implemented; tone passed to `/api/headline`.

### G4 — User changes app theme
- **User goal:** dark mode on at night.
- **Steps:** Settings → Theme → Light/Dark/System → re-renders.
- **Status:** ✅ Implemented.

### G5 — User wants to reset all settings
- **User goal:** start fresh.
- **Steps:**
  1. Settings → bottom → "Reset to defaults".
  2. Confirm dialog.
  3. `shared_preferences.clear()` + Supabase upsert defaults.
- **Expected behavior:** all toggles back to defaults; cloud row reset.
- **Status:** ❌ Not implemented.
- **Next steps:** 🔧 Add a reset button.

---

## H. Notifications & push

### H1 — User opts in to weather alerts
- **User goal:** get notified for severe weather.
- **Steps:**
  1. Settings → Notifications → Weather alerts → on.
  2. App requests `POST_NOTIFICATIONS` permission (Android 13+).
  3. App requests an FCM token.
  4. Token persisted server-side (`push_subscriptions` table).
- **Expected behavior:** future severe alerts arrive as push notifications.
- **Status:** ❌ Not implemented — no notifications section in mobile Settings; no FCM dep; no push_subscriptions table.
- **Next steps:** 🧑‍💻 **Manual task for you** — Firebase project + `google-services.json` (`docs/SETUP.md` §5.3). 🔧 Add `firebase_messaging` + plumbing.

### H2 — User receives a daily forecast briefing at 7am
- **User goal:** start the day with a glance.
- **Steps:**
  1. User opts in (H1).
  2. Server cron (Supabase Edge Function) runs daily at user's local 7am.
  3. AI generates a 1-sentence briefing.
  4. FCM push delivered.
  5. User taps → app opens at `/insight`.
- **Expected behavior:** punctual, personalized, opens directly to detail.
- **Status:** ❌ Not implemented — needs cron + dispatch + deep-link routing.
- **Next steps:** 🔧 Supabase Edge Function + FCM HTTP v1 dispatch.

### H3 — User taps a push notification while in another app
- **User goal:** seamless open to relevant content.
- **Steps:**
  1. Push arrives with `data.url=/insight`.
  2. User taps notification.
  3. Android opens the app.
  4. `firebase_messaging.onMessageOpenedApp` reads data → router pushes `/insight`.
- **Expected behavior:** lands on the right screen, not just the home screen.
- **Status:** ❌ Not implemented.

---

## I. Offline / errors

### I1 — User opens app while offline
- **User goal:** see last forecast.
- **Steps:**
  1. Cold launch, no network.
  2. `weatherProvider` returns cached value.
  3. Banner: "You're offline — last updated 12 minutes ago."
- **Expected behavior:** cached data visible; banner clear.
- **Status:** 🟡 Partial — cache works; banner missing (A3).

### I2 — User submits chat message offline
- **User goal:** know it failed; retry later.
- **Steps:**
  1. ChatScreen → type → submit while offline.
  2. dio throws connection error.
  3. UI shows red error bubble: "Couldn't reach Atmos. Retry?"
- **Expected behavior:** clear error + retry button.
- **Status:** 🟡 Partial — error caught; retry affordance missing.
- **Next steps:** 🔧 Add a retry button on failed messages.

### I3 — API returns 429 (rate limited)
- **User goal:** understand the limit + upgrade path.
- **Steps:**
  1. Free user hits daily chat cap.
  2. `/api/chat` returns 429 with `{ tier, limit }`.
  3. Chat shows: "You've hit your daily free limit (30 messages). Upgrade for more."
  4. "Upgrade" → opens `/pricing` in Custom Tab.
- **Expected behavior:** non-blocking, points to upgrade.
- **Status:** 🟡 Partial — server returns 429; mobile UI doesn't distinguish 429 from generic errors.
- **Next steps:** 🔧 Special-case 429 in chat error handler.

### I4 — Gemini API is down
- **User goal:** know it's not the user's fault.
- **Steps:**
  1. `/api/chat` returns 500 after model rotation exhausted.
  2. ChatScreen shows: "The AI is napping — try again in a moment."
- **Expected behavior:** transient, retryable.
- **Status:** 🟡 Partial — generic error path works; copy is too technical.
- **Next steps:** 🔧 Friendlier error copy.

---

## J. Permissions & privacy

### J1 — User checks what data Atmos sends
- **User goal:** verify trust.
- **Steps:**
  1. Settings → About → Privacy.
  2. Read privacy policy page.
- **Expected behavior:** in-app rendered policy with bullet list.
- **Status:** ❌ Not implemented — no Privacy page or link.
- **Next steps:** 🧑‍💻 **Manual task for you** — write a privacy policy. 🔧 Add `screens/about/privacy_screen.dart` and host the text in-app.

### J2 — User wants to revoke microphone permission
- **User goal:** stop voice access.
- **Steps:**
  1. Settings → Privacy → Microphone → off.
  2. App calls `permission_handler.openAppSettings()`.
  3. System settings open at Atmos permissions.
- **Expected behavior:** clear path; no permanent denial.
- **Status:** 🟡 Partial — permission_handler is installed; no UI affordance.
- **Next steps:** 🔧 Add a Privacy section to mobile Settings.

### J3 — User reads about Play Integrity attestation
- **User goal:** understand why the app can't run on a rooted device.
- **Steps:**
  1. Settings → About → Security.
  2. Short paragraph: "Atmos verifies that this app is genuine via Google Play Integrity."
- **Expected behavior:** transparent.
- **Status:** ❌ Not implemented.

---

## K. Data syncing

### K1 — User adds a saved location on web, opens Android
- **User goal:** see the same list.
- **Steps:** see B6.
- **Status:** ❌ Not implemented on mobile.

### K2 — User chats on Android, opens web
- **User goal:** continue the conversation.
- **Steps:** Similar shape — pull `chat_messages` for the user.
- **Status:** ❌ Not implemented on mobile (web has CloudSync).
- **Next steps:** 🔧 Mobile cloud sync provider (matches B6).

### K3 — User changes a setting on web, expects mobile to follow
- **User goal:** consistent prefs across devices.
- **Steps:** Same as K1 but for `user_preferences`.
- **Status:** ❌ Not implemented on mobile.

---

## L. Payments / subscription

### L1 — User wants to upgrade to Pro
- **User goal:** unlock higher daily limits.
- **Steps:**
  1. Settings → Account → "Upgrade to Pro" button.
  2. Opens `/pricing` in a Chrome Custom Tab.
  3. User clicks Monthly or Yearly.
  4. Stripe Checkout (in browser).
  5. On success, redirects back to `com.atmos.app://upgraded`.
  6. App pulls latest subscription → tier flips to `pro`.
- **Expected behavior:** ~30 seconds end-to-end; tier visible in Account immediately.
- **Status:** ❌ Not implemented on mobile — no Upgrade button, no `com.atmos.app://upgraded` deep link.
- **Next steps:** 🧑‍💻 **Manual task for you** — Stripe products + webhook (`docs/SETUP.md` §3). 🔧 Add Upgrade button + deep link.

### L2 — User wants to manage their subscription
- **User goal:** view next billing date / cancel.
- **Steps:**
  1. Settings → Account → "Manage subscription".
  2. App requests `/api/stripe/portal` → returns a Customer Portal URL.
  3. Opens in Custom Tab.
- **Expected behavior:** Stripe portal opens, user can cancel.
- **Status:** ❌ Not implemented — no portal endpoint, no button.
- **Next steps:** 🔧 Add `/api/stripe/portal` route + Manage button.

### L3 — Subscription expires; user becomes free again
- **User goal:** know what changed.
- **Steps:**
  1. Stripe webhook fires `customer.subscription.deleted`.
  2. Server flips `subscriptions.tier='free'`.
  3. Next time user opens app, tier shows "Free".
  4. Daily limits revert.
- **Expected behavior:** transparent downgrade.
- **Status:** ✅ Implemented server-side (webhook + tier resolver). UI side doesn't show explicit notice.
- **Next steps:** 🔧 Add a one-time "Your Pro plan ended" banner when tier flips.

---

## M. Security / Play Integrity

### M1 — User installs APK from outside Play Store
- **User goal:** none — this is an attacker scenario.
- **Steps:**
  1. APK extracted, sideloaded to a different device.
  2. App launches.
  3. First `/api/*` call → Play Integrity token attached.
  4. Server decodes — verdict shows `UNRECOGNIZED_VERSION` for app, possibly device too.
  5. With `PLAY_INTEGRITY_STRICTNESS=strict`, server returns 401.
- **Expected behavior:** API access blocked.
- **Status:** ✅ Implemented (`src/lib/playIntegrity.ts`). User-facing UX: app shows "Unauthorized" — should be friendlier.
- **Next steps:** 🔧 Detect the 401 reason and show "This copy of Atmos isn't recognized — install from the Play Store."

### M2 — User runs on a rooted device
- **User goal:** still use the app or get a clear explanation.
- **Steps:**
  1. Cold launch → first API call.
  2. Device verdict missing `MEETS_DEVICE_INTEGRITY`.
  3. Strict mode rejects.
- **Expected behavior:** clear error in lenient mode; reject in strict.
- **Status:** ✅ Implemented; default mode is `lenient`. Switch to `strict` after Play Store launch.

---

## Aggregated to-do list

✅ = shipped on the `claude/supabase-auth` branch
🟡 = partially built (still needs UX polish)
❌ = not yet started

| # | What | Status |
|---|---|---|
| A2 | Empty-state CTA when geolocation denied | ✅ home `_welcome` has 'Use my location' + 'Search a city' |
| A3 / I1 | Mobile offline banner + `connectivity_plus` dep | ✅ `widgets/offline_banner.dart`, mounted in `_NavShell` |
| B1 | AccountSection on mobile Settings | ✅ `widgets/account_section.dart` with tier badge + buttons |
| B2 | AndroidManifest deep-link intent filter | ✅ `com.atmos.app://` scheme registered |
| B3 | Supabase Google OAuth client | 🧑‍💻 Manual task for you (`docs/SETUP.md` §1.5) |
| B4 | Sign-out button on mobile | ✅ in AccountSection |
| B5 | Password reset flow on mobile | ✅ `/reset` + `/reset-update`, recovery deep-link routed via NavShell listener |
| B6 / K1-3 | Mobile cloud sync provider | ✅ `state/cloud_sync.dart`, auto-mounted in `_NavShell` |
| B7 | Mobile profile editor screen | ✅ `/profile` route |
| B8 | Account deletion (UI + endpoint) | ✅ `/api/account/delete` + web + mobile `DangerZone` |
| C2 / F5 | Mobile Trip planner screen | ✅ `/trip` route + Trip nav item |
| D3 | Mobile OutfitCard | ✅ inserted under hourly strip on `HomeScreen` |
| D4 | Mobile Share weather (share_plus) | ✅ chip on `HomeScreen` |
| D5 | RefreshIndicator on HomeScreen | ✅ pull-to-refresh re-runs weather + air |
| D6 | Mobile SevereWeatherBanner | ✅ rendered between header and content |
| E3 | Preview-only mode for saved locations | ❌ |
| E4 | Undo snackbar after delete | ✅ on `/locations` |
| E5 | Home/Work tags + quick-switch | 🟡 migration 0012 added `tag` column; UI not built yet |
| F3 | Verify QuickPrompts on mobile | ✅ `chat_screen.dart` renders `quickPrompts` chips |
| F4 | Mobile AI Personality settings | ✅ Settings → AI personality (emoji use + verbosity) |
| G5 | Reset to defaults | ✅ Settings → Privacy → Reset settings |
| H1 | Push notifications (FCM + Firebase) | 🟡 — `push_subscriptions` table + `/api/push/subscribe` shipped; FCM project setup is 🧑‍💻 Manual task for you (§5.3) |
| H2 | Daily briefing cron + dispatch | 🟡 — Edge Function skeleton at `supabase/functions/daily-briefing/` |
| H3 | Notification tap routing | ❌ — needs `firebase_messaging` integration after H1 |
| I2 | Retry button on failed chat | ✅ web + mobile |
| I3 | Special 429 handling in mobile chat | ✅ friendlier copy + special-case |
| I4 | Friendly error copy | ✅ `api/error_interceptor.dart` maps 401/429/5xx/timeouts |
| J1 | Privacy policy + in-app page | ✅ web `/privacy`; mobile link opens it via `url_launcher` |
| J2 | Privacy / permissions screen | ✅ `/permissions` shows live granted/denied for location, mic, notifications + 'Open Android settings' |
| J3 | About → Security explainer | ✅ `/security` — 5 explainer cards + how to report a security issue |
| L1 | Upgrade flow + deep link on mobile | ✅ AccountSection "Upgrade to Pro" opens `${ATMOS_API_BASE}/pricing` in external browser |
| L2 | Stripe Customer Portal route + button | ✅ `/api/stripe/portal` + Manage subscription button |
| L3 | Downgrade notice | ❌ |
| M1 | Friendly Play Integrity rejection | ✅ FriendlyErrorInterceptor maps 401 'integrity'/'package' → 'install from Play Store' |

### Wiring still TODO (small, fast follow-ups)

- Mobile preview-only saved-location mode (E3)
- Mobile Home/Work tag UI to use the new `saved_locations.tag` column (E5)
- Mobile push delivery (after Firebase project; H1/H2/H3)
- Mobile downgrade notice when subscription expires (L3)
- Avatar upload via Supabase Storage (blocked on bucket)
- Real privacy-contact email (replace `atmos.example.com` placeholders)
