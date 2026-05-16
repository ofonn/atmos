# Atmos — Android app (Flutter)

Pixel-faithful Android port of the Atmos web app at `../src/`. Both versions
share the same Next.js backend (`/api/*`) but ship independently.

## Prerequisites

- Flutter 3.22+ (Dart 3.3+)
- Android Studio with the Android SDK (API 34) and an emulator or USB device

```bash
flutter doctor
```

## Configuration

The app calls the Next.js routes hosted by the website. Two build-time vars
control the handshake:

| Var | Purpose |
|---|---|
| `ATMOS_API_BASE` | e.g. `https://atmos.yourdomain.com` — base URL for `/api/*` |
| `ATMOS_CLIENT_KEY` | Shared secret. Must match `ATMOS_MOBILE_KEY` on the server. |

Set the same secret on the website side in `.env.local` (or your Vercel
project settings):

```
ATMOS_MOBILE_KEY=<a long random string>
```

The website middleware (`src/middleware.ts`) compares the mobile header
`X-Atmos-Client` against `ATMOS_MOBILE_KEY` and rejects mismatches with 401.
Browser sessions on the deployed site are detected via `sec-fetch-site:
same-origin` so the web app continues to work without a header.

> The shared secret in the APK is extractable from a reverse-engineered
> build. For public distribution add Play Integrity / Firebase App Check on
> top.

## Run

```bash
cd mobile
flutter pub get
flutter run \
  --dart-define=ATMOS_API_BASE=https://atmos.yourdomain.com \
  --dart-define=ATMOS_CLIENT_KEY=<shared secret>
```

## Build APK

```bash
flutter build apk --release \
  --split-per-abi \
  --dart-define=ATMOS_API_BASE=https://atmos.yourdomain.com \
  --dart-define=ATMOS_CLIENT_KEY=<shared secret>
```

Outputs land in `build/app/outputs/flutter-apk/`.

## Architecture

```
lib/
├── main.dart                    runApp(ProviderScope(AtmosApp()))
├── app.dart                     MaterialApp.router + GoRouter + theme
├── theme/                       Atmos colours, typography, glass, atmospheric glow
├── api/                         Dio + endpoint clients + plain Dart models
├── state/                       Riverpod providers (location / weather / chat / AI / settings)
├── screens/                     One per route: home, technical, overview,
│                                chat, settings, locations, insight, radar
├── widgets/                     BottomNav, MeteoIcon, AnimatedNumber,
│                                HourlyForecast, GradientText, WeatherParticles,
│                                AiFab, ResponsiveHeadline
└── utils/                       WMO code utilities, formatters
```

## Storage key parity with the web

`shared_preferences` uses the same key names as the web `localStorage` so the
two apps reason about the same data conceptually:

- `atmos_location`
- `atmos_saved_locations`
- `atmos_chat_messages`
- `atmos_ai_content`  (1-hour TTL)
- `atmos_settings`
