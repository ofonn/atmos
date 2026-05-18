# Contributing to Atmos

## Getting started

```bash
git clone <repo> atmos
cd atmos
cp .env.example .env.local   # fill in keys — see docs/SETUP.md
npm install
npm run dev
```

The mobile app lives in `mobile/`:
```bash
cd mobile
flutter pub get
flutter run --dart-define=ATMOS_API_BASE=http://10.0.2.2:3000 \
            --dart-define=SUPABASE_URL=... \
            --dart-define=SUPABASE_ANON_KEY=...
```

## Project layout

```
src/
  app/                  Next.js App Router pages + API routes
    api/                Server endpoints (chat, openmeteo, stripe, push…)
    (auth)/             /sign-in /sign-up /reset (route group, no nav)
    pricing/            Pricing page
  components/           React components
  contexts/             SettingsContext, AuthContext, WeatherContext
  hooks/                useChat, useLocation, useWeather, …
  lib/
    supabase/           client / server / auth / usage / sync helpers
    gemini.ts           Gemini REST + prompt builder
    playIntegrity.ts    API gate for the mobile app
    stripe.ts           Lazy Stripe client + price IDs
    subscriptions.ts    Tier limits config
  types/
supabase/
  migrations/           SQL — run via `supabase db push`
  README.md             DB schema overview
  config.toml           Supabase CLI project config
mobile/                 Flutter Android app
public/                 Static assets, manifest.json, sw.js
public/videos/          Optional weather-condition video loops
docs/
  SETUP.md              Step-by-step day-one setup
  ANDROID_SCENARIOS.md  50+ user-flow tests
  SCENARIOS.md          Web scenarios audit
middleware.ts           Supabase session refresh + security headers
```

## Conventions

- TypeScript everywhere on the web side; Dart on mobile.
- Prefer **functional components**, hooks, server components where
  data is read-only.
- Add new server-only env vars without the `NEXT_PUBLIC_` prefix.
- New API routes go under `src/app/api/<name>/route.ts` and should:
  1. Check Play Integrity (`requirePlayIntegrity(req)`).
  2. For routes that consume AI quota: also call `getServerUser()` →
     `getUserTier()` → `enforceUsage(...)`.
- New DB tables get a numbered migration in `supabase/migrations/`.
  Always: `enable row level security`, then policies for select/insert/
  update/delete scoped to `auth.uid()`.
- Don't commit `.env*` (other than `.env.example`). The `.gitignore`
  blocks it, but pay attention.
- Run `npx next build` before pushing — it type-checks + lints.

## Workflow

```bash
# branch
git checkout -b claude/<short-feature-name>

# work
npm run dev
npx next build          # before pushing

# commit (heredoc keeps formatting)
git commit -m "$(cat <<'EOF'
feat: short title

- bullet describing the why
- bullet describing what changed
EOF
)"

git push -u origin <branch>
```

Open a PR; CI must pass before merge. `main` is protected.

## Testing the mobile app

```bash
cd mobile
flutter test            # unit
flutter run             # debug on connected device / emulator
```

A debug APK is built on every push to a feature branch by the GitHub
Actions workflow in `.github/workflows/`. Production builds need the
keystore secrets configured (see `docs/SETUP.md` §6.5).

## Pre-commit hook

`npm install` registers a husky pre-commit hook at `.husky/pre-commit`
that runs `gitleaks protect --staged` if `gitleaks` is on your PATH.
Install once with `brew install gitleaks` (or your platform's
package manager). If not installed, the hook prints a hint and lets
the commit through — CI re-runs gitleaks via the workflow anyway.

## Security

See `SECURITY.md`. Don't open public issues for vulnerabilities.

## Style nits

- Prettier defaults apply; lint with `npm run lint`.
- Imports order: external, then `@/` aliases, then relative.
- Tailwind classes: layout → spacing → typography → color → effects.
- Don't wrap one-line conditions in `{}`.
- Don't add comments that just restate what the code does.

## Adding a new AI feature endpoint

1. Add it to `src/lib/subscriptions.ts`:
   - extend `ApiEndpoint` union
   - add a `<feature>PerDay` field to `TierLimits` with free + pro
     values
   - add to `ENDPOINT_LIMIT_KEY`
2. Create `src/app/api/<feature>/route.ts` and call:
   ```ts
   const unauthorized = await requirePlayIntegrity(req)
   if (unauthorized) return unauthorized

   const user = await getServerUser()
   if (user) {
     const tier = await getUserTier(user.id)
     const limited = await enforceUsage('<feature>', tier)
     if (limited) return limited
   }
   ```
3. Use `geminiGenerateWithRotation(prompt, apiKey)` for AI calls so
   you get free model rotation.

## Adding a new mobile screen

1. Create `mobile/lib/screens/<feature>/<feature>_screen.dart`.
2. Wrap state with Riverpod (`ConsumerWidget` / `ConsumerStatefulWidget`).
3. Register a `GoRoute` in `app.dart`.
4. If it appears in the bottom nav, update `widgets/bottom_nav.dart`.
5. Use the design tokens from `theme/colors.dart`, never hardcode hex.
