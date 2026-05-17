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

The app authenticates with the Next.js routes via **Google Play
Integrity**. There is no shared secret in the APK — the only build-time
values are the API base URL and the Cloud project number (a public ID).

| Build-time var | Type | Purpose |
|---|---|---|
| `ATMOS_API_BASE` | URL | e.g. `https://atmos.yourdomain.com`. |
| `GOOGLE_CLOUD_PROJECT_NUMBER` | numeric | Google Cloud project number for the project linked to your Play Console app. Not secret. |

| Server-side env var (Vercel) | Purpose |
|---|---|
| `GOOGLE_PLAY_INTEGRITY_SA_JSON` | Service-account JSON with role `roles/playintegrity.user`. Used by the gate to call Google's verification endpoint. |
| `ANDROID_PACKAGE_NAME` | `com.atmos.weather` — must match the APK. |
| `PLAY_INTEGRITY_STRICTNESS` | (optional) `strict` rejects sideloaded / unrecognized installs (use after publishing to Play Store). Default `lenient` allows Internal Testing track during dev. |

Every `/api/*` request from the APK carries an `X-Play-Integrity-Token`
header. The server (`src/lib/playIntegrity.ts`) calls Google's
`decodeIntegrityToken` endpoint, validates the verdict (app recognised,
device integrity passed, package name matches, token recent), and lets
the request through only if it passes.

Same-origin browser sessions on the deployed site pass through without
a token (detected via `sec-fetch-site: same-origin`) so the web app
continues to work unchanged.

## Play Integrity setup (one-time)

> You need a Google Play developer account ($25, one-time, ~24-48 h
> verification). Without one, integrity tokens for your app return
> `UNRECOGNIZED_VERSION` and the gate rejects them in strict mode.

1. **Create / pick a Google Cloud project.** Note the project NUMBER (a
   numeric ID, not the project ID string). This is your
   `GOOGLE_CLOUD_PROJECT_NUMBER`.
2. **Enable the Play Integrity API** on that project:
   https://console.cloud.google.com/apis/library/playintegrity.googleapis.com
3. **Create a service account** in the same project:
   - Role: `Service Account User` + `Play Integrity API User`
     (`roles/playintegrity.user`).
   - Create a JSON key, download it.
   - Paste the entire JSON content as the value of
     `GOOGLE_PLAY_INTEGRITY_SA_JSON` on Vercel.
4. **Create the app in Play Console** (`com.atmos.weather`). Upload a
   signed AAB to the Internal Testing track at least once.
5. **Link Play Console → Cloud project**: in Play Console → App content
   → Play Integrity API, link to the same Cloud project as above.
6. **Set Vercel env vars**:
   - `GOOGLE_PLAY_INTEGRITY_SA_JSON` = service-account JSON
   - `ANDROID_PACKAGE_NAME` = `com.atmos.weather`
   - `PLAY_INTEGRITY_STRICTNESS` = `lenient` while testing, `strict` post-launch
7. Redeploy on Vercel so the new env vars take effect.

## Run (locally)

```bash
cd mobile
flutter pub get
flutter run \
  --dart-define=ATMOS_API_BASE=https://atmos.yourdomain.com \
  --dart-define=GOOGLE_CLOUD_PROJECT_NUMBER=1234567890
```

A locally-built debug APK installed via `flutter run` will return
`UNRECOGNIZED_VERSION` because it's not Play-distributed. Keep
`PLAY_INTEGRITY_STRICTNESS=lenient` on the server during dev so requests
still pass.

## Build APK (locally)

```bash
flutter build apk --release \
  --split-per-abi \
  --dart-define=ATMOS_API_BASE=https://atmos.yourdomain.com \
  --dart-define=GOOGLE_CLOUD_PROJECT_NUMBER=1234567890
```

Outputs land in `build/app/outputs/flutter-apk/`.

## GitHub Actions builds

`.github/workflows/android-apk.yml` builds the APKs in CI on every push to
`main` / `claude/**`, on manual dispatch, and on `v*` tags. Tag pushes also
publish a GitHub Release with the APKs attached. APKs are uploaded as run
artifacts (90-day retention) — open the run from the **Actions** tab and
download `atmos-apks-<sha>.zip` from the run page.

### Required GitHub Actions secrets

Repo Settings → Secrets and variables → **Actions** → New repository secret:

| Name | Value |
|---|---|
| `ATMOS_API_BASE` | Deployed site URL, e.g. `https://atmos.yourdomain.com` (no trailing slash, no `/api`). |
| `GOOGLE_CLOUD_PROJECT_NUMBER` | Numeric Cloud project number linked to your Play Console app. Not secret per se — using a secret slot for management convenience. |

The workflow bakes these into the APK via `--dart-define`. The build fails
fast if either is missing.

### Releases

Tag a commit to publish:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow attaches all four APKs (`arm64-v8a`, `armeabi-v7a`, `x86_64`,
and the universal build) to a GitHub Release named after the tag.

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
