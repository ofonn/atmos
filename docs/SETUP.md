# Atmos — complete setup guide

This is the single document to follow end-to-end to bring Atmos
(web + Android + Supabase + Stripe + Play Integrity + push) into a
production-ready state.

Every step is tagged with one of:

- 🧑‍💻 **Manual task for you** — must be done by a human in a dashboard
- 🤖 **Can be automated through MCP later** — when the relevant MCP is
  connected, Claude (or another agent) can complete it for you
- 🔁 **Local / scripted** — runnable from your machine or CI

> Tip: tackle the sections in order. Each section says what it unlocks
> so you can stop at any point and the app still works.

---

## 0. Prerequisites

| Tool | Why | Install |
|---|---|---|
| Node.js ≥ 18 | Next.js runtime | https://nodejs.org/ |
| npm or pnpm | Package manager | bundled with Node |
| Flutter ≥ 3.22 | Build the Android app | https://docs.flutter.dev/get-started/install |
| Android Studio | SDK + emulator | https://developer.android.com/studio |
| Supabase CLI | Apply DB migrations | `npm i -g supabase` |
| GitHub account | Source control + CI | https://github.com |
| Vercel account | Hosting the Next.js app | https://vercel.com |
| Stripe account | Billing | https://stripe.com (test mode is free) |
| Google Cloud project | OAuth + Play Integrity + Maps (later) | https://console.cloud.google.com |

🧑‍💻 **Manual task for you:** create the accounts above. The rest of
this doc references them.

---

## 1. Supabase project

**Unlocks:** sign-up/sign-in, per-user data, subscriptions, streaks,
preferences sync.

### 1.1 Create the project
🧑‍💻 **Manual task for you.**
1. Go to https://supabase.com/dashboard → **New project**.
2. Pick a region close to your users.
3. Save the database password somewhere safe (1Password, a vault).
4. Wait ~2 minutes for provisioning.

### 1.2 Copy the API keys into env vars
🧑‍💻 **Manual task for you.**
1. Dashboard → **Project Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Paste into `.env.local` (for local dev) AND into **Vercel → Project
   Settings → Environment Variables** (for prod).

> ⚠️ The service-role key bypasses RLS. NEVER expose it client-side,
> never commit it, never prefix with `NEXT_PUBLIC_`.

### 1.3 Apply the database migrations
🤖 **Can be automated through MCP later** (Supabase MCP).
🔁 **Local / scripted** (run yourself today):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each file under `supabase/migrations/` into the Supabase SQL
Editor in order (0001 → 0007). After it finishes you should have these
tables: `profiles`, `subscriptions`, `saved_locations`, `chat_messages`,
`api_usage`, `user_preferences`, `streaks` — plus two RPCs:
`increment_api_usage`, `bump_streak`.

### 1.4 Configure Auth
🧑‍💻 **Manual task for you.**

**Authentication → URL Configuration**
- **Site URL**: `https://your-prod-domain.com` (or your Vercel preview URL)
- **Redirect URLs** (allow-list, add ALL of these):
  - `https://your-prod-domain.com/auth/callback`
  - `https://*.vercel.app/auth/callback` (for preview branches)
  - `http://localhost:3000/auth/callback`
  - `com.atmos.app://login-callback` (for the Android app)

**Authentication → Providers → Email**
- Confirm email — leave ON for prod; can turn off during dev for speed.
- Magic link — optional, off by default.

**Authentication → Email Templates** (Optional polish)
- Customize confirm/reset/magic-link templates to use Atmos branding.

### 1.5 Configure Google OAuth
🧑‍💻 **Manual task for you** (the Google Cloud + Supabase dashboards).

1. Google Cloud Console → **APIs & Services → OAuth consent screen**
   - User type: External (for personal Google accounts) or Internal
   - App name: Atmos
   - Support email + developer email: your address
   - Authorized domains: your prod domain
   - Scopes: `email`, `profile`, `openid`
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://your-prod-domain.com`, `http://localhost:3000`
   - Authorized redirect URIs: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**.
4. Supabase Dashboard → **Authentication → Providers → Google** → toggle on,
   paste Client ID + Client Secret → Save.

### 1.6 (Optional) Set up Supabase Storage for avatars
🧑‍💻 **Manual task for you** (later).

When you want native avatar uploads instead of paste-a-URL:
1. Supabase Dashboard → **Storage → Create bucket** named `avatars`.
2. Make it Public.
3. Add an RLS policy (Storage → Policies → New):
   - Allow `INSERT` where `bucket_id = 'avatars'` and `auth.uid()::text = (storage.foldername(name))[1]`.
4. Then I'll wire `ProfileEditor` to upload via `supabase.storage.from('avatars').upload(...)`.

### 1.7 Verify
🔁 **Local / scripted.**
```bash
npm run dev
```
Visit http://localhost:3000/sign-up, create an account. Then in
Supabase Dashboard:
- **Authentication → Users**: your row appears.
- **Table Editor → profiles**: trigger auto-created a row.
- **Table Editor → subscriptions**: auto-created `free` row.
- **Table Editor → user_preferences** & **streaks**: defaults inserted.

---

## 2. Google Cloud — Play Integrity (mobile API gating)

**Unlocks:** the Android app can call `/api/*` (which is gated by
Play Integrity attestation).

### 2.1 Link Google Cloud project to Play
🧑‍💻 **Manual task for you.**
1. Google Play Console → your app → **Setup → App integrity → Play Integrity API**.
2. **Link a Google Cloud project**. If you don't have one, create one
   in https://console.cloud.google.com first.
3. Note the **project number** (numeric, not the project ID). You'll
   need it as `GOOGLE_CLOUD_PROJECT_NUMBER` in mobile build args.

### 2.2 Enable the Play Integrity API
🧑‍💻 **Manual task for you.**
1. Google Cloud Console → **APIs & Services → Library**.
2. Search "Play Integrity API" → Enable.

### 2.3 Create a service account for the server
🧑‍💻 **Manual task for you.**
1. **IAM & Admin → Service Accounts → Create service account**.
2. Name: `atmos-play-integrity`.
3. Grant role: **Play Integrity API → Play Integrity Service User**
   (`roles/playintegrity.user`).
4. **Keys → Add key → JSON**. Download the file.
5. Open the JSON, copy the entire contents.
6. Paste into Vercel as `GOOGLE_PLAY_INTEGRITY_SA_JSON`
   (one-line JSON; Vercel handles multi-line for env vars OK).
7. Set `ANDROID_PACKAGE_NAME=com.atmos.app` (must match your APK).
8. Leave `PLAY_INTEGRITY_STRICTNESS=lenient` until you're on Play Store,
   then flip to `strict`.

### 2.4 Verify
🧑‍💻 **Manual task for you.** Once the APK is signed and uploaded:
- Internal testing track → install on a real device → open Atmos.
- Server logs should show successful integrity verdicts.
- Sideloaded debug APK won't verify — that's expected.

---

## 3. Stripe (billing)

**Unlocks:** Free vs Pro tier. Webhook flips
`subscriptions.tier='pro'` when a user pays.

### 3.1 Create products
🧑‍💻 **Manual task for you** (today, in test mode).
🤖 **Can be automated through MCP later** (Stripe MCP).

1. Stripe Dashboard → **Products → + Add product**:
   - **Atmos Pro Monthly** — recurring, $4.99/month (or your price)
   - **Atmos Pro Yearly** — recurring, $39.99/year
2. Copy each **Price ID** (looks like `price_...`).
3. Set on Vercel:
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...`
   - `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...`

### 3.2 Get API keys
🧑‍💻 **Manual task for you.**
1. **Developers → API keys**.
2. Copy **Secret key** (sk_test_… for now).
3. Set `STRIPE_SECRET_KEY` on Vercel.

### 3.3 Set up the webhook
🧑‍💻 **Manual task for you.**
🤖 **Can be automated through MCP later** (Stripe MCP).
1. **Developers → Webhooks → + Add endpoint**.
2. URL: `https://your-prod-domain.com/api/stripe/webhook`.
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Reveal **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`.

### 3.4 Test locally with the Stripe CLI
🔁 **Local / scripted.**
```bash
brew install stripe/stripe-cli/stripe   # or download from stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Use the printed webhook secret as STRIPE_WEBHOOK_SECRET in .env.local.
stripe trigger checkout.session.completed
```

### 3.5 Verify
🔁 **Local / scripted.**
- Visit `/pricing` → click Upgrade → Stripe Checkout.
- Use test card `4242 4242 4242 4242`, any future expiry, any CVC.
- Back on the app, `/settings` should show "Pro" tier.

---

## 4. Vercel (web hosting + envs)

**Unlocks:** the web app on a real URL.

### 4.1 Connect GitHub
🧑‍💻 **Manual task for you.**
1. Vercel Dashboard → **Add New → Project**.
2. Import the `ofonn/atmos` repo.
3. Framework preset: **Next.js**.
4. Root directory: `/` (the repo root).
5. Build command: leave default (`next build`).
6. Output directory: leave default.

### 4.2 Set environment variables
🧑‍💻 **Manual task for you** (paste each value from sections 1–3 above).
🤖 **Can be automated through MCP later** (Vercel MCP).

In Vercel → **Project Settings → Environment Variables**, add for the
**Production**, **Preview**, and **Development** environments:

| Key | Where to find it |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API |
| `GOOGLE_PLAY_INTEGRITY_SA_JSON` | Service account JSON (1.5) |
| `ANDROID_PACKAGE_NAME` | `com.atmos.app` |
| `PLAY_INTEGRITY_STRICTNESS` | `lenient` (later `strict`) |
| `STRIPE_SECRET_KEY` | Stripe → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks endpoint |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | Stripe → Products |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` | Stripe → Products |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | same command above |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `NEXT_PUBLIC_SITE_URL` | your production URL |

### 4.3 Custom domain (optional but recommended)
🧑‍💻 **Manual task for you.**
1. Vercel → **Settings → Domains → Add**.
2. Add your domain, then update DNS at your registrar (A or CNAME).
3. After it's live, update:
   - `NEXT_PUBLIC_SITE_URL` env var
   - Supabase **Site URL** + redirect allow-list (section 1.4)
   - Google OAuth authorized origins (section 1.5)
   - Stripe webhook URL (section 3.3)

---

## 5. Push notifications (optional, can defer)

**Unlocks:** server-pushed weather alerts to PWA + Android.

### 5.1 Generate VAPID keys
🔁 **Local / scripted.**
```bash
npx web-push generate-vapid-keys
```
Set both halves on Vercel (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

### 5.2 Add a subscriptions table
🤖 **Can be automated through MCP later** (Supabase MCP) — for now this
migration isn't written. Note in docs/SCENARIOS.md scenario #38.

### 5.3 For Android push, use FCM
🧑‍💻 **Manual task for you** (when you're ready).
1. Firebase Console → Add Android app, package `com.atmos.app`.
2. Download `google-services.json` → drop in `mobile/android/app/`.
   (Already in `.gitignore` — never commit this.)
3. Add `firebase_messaging` to `mobile/pubspec.yaml`.
4. Server-side: use FCM HTTP v1 with the same service account from 2.3
   (just add `roles/firebasemessaging.user`).

---

## 6. Mobile (Android) build

**Unlocks:** a working APK / AAB.

### 6.1 First-time setup
🔁 **Local / scripted.**
```bash
cd mobile
flutter pub get
```

### 6.2 Local debug run
🔁 **Local / scripted.**
```bash
# Plug in a device or start an emulator, then:
flutter run --dart-define=ATMOS_API_BASE=http://10.0.2.2:3000 \
            --dart-define=GOOGLE_CLOUD_PROJECT_NUMBER=0 \
            --dart-define=SUPABASE_URL=https://<ref>.supabase.co \
            --dart-define=SUPABASE_ANON_KEY=<anon>
```
(10.0.2.2 is the host machine from inside an emulator.)

### 6.3 Release build
🧑‍💻 **Manual task for you** (generate the keystore, then automate).
1. Generate an upload keystore (one-time):
   ```bash
   keytool -genkey -v -keystore mobile/android/app/upload-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Create `mobile/android/key.properties` (NOT committed):
   ```
   storePassword=...
   keyPassword=...
   keyAlias=upload
   storeFile=upload-keystore.jks
   ```
3. Update `mobile/android/app/build.gradle` to read it (already wired
   in the Flutter template).

Then:
```bash
cd mobile
flutter build appbundle \
  --dart-define=ATMOS_API_BASE=https://your-prod-domain.com \
  --dart-define=GOOGLE_CLOUD_PROJECT_NUMBER=<number-from-2.1> \
  --dart-define=SUPABASE_URL=https://<ref>.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<anon>
```

The signed AAB lands in `build/app/outputs/bundle/release/`.

### 6.4 Upload to Play Console
🧑‍💻 **Manual task for you.**
1. Play Console → your app → **Testing → Internal testing → Create release**.
2. Upload the AAB.
3. Add testers (your email at minimum).
4. Roll out to internal testing.
5. Install via the opt-in link.

### 6.5 CI for APKs
🔁 **Local / scripted** — already exists in `.github/workflows/`.
Push to a feature branch → GitHub Actions builds a debug APK
artefact. Production builds need the keystore as a CI secret —
🧑‍💻 **Manual task for you:** add `ANDROID_KEYSTORE_BASE64` and
`ANDROID_KEYSTORE_PASSWORD` as GitHub repo secrets.

---

## 7. GitHub repo hygiene

### 7.1 Secrets (for CI)
🧑‍💻 **Manual task for you.** GitHub → Settings → Secrets and variables → Actions.

Add:
- `GEMINI_API_KEY` (so CI build does not break on type-checks)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANDROID_KEYSTORE_BASE64` (`base64 -w 0 upload-keystore.jks`)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### 7.2 Branch protection
🧑‍💻 **Manual task for you.**
- Settings → Branches → Add rule for `main`.
- Require PRs, require status checks (CI), require linear history.

### 7.3 Dependabot
🤖 **Can be automated through MCP later** (GitHub MCP) — or add
`.github/dependabot.yml` manually:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: pub
    directory: /mobile
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

### 7.4 Secret scanning
🧑‍💻 **Manual task for you.** GitHub → Settings → Security → enable
"Secret scanning" and "Push protection" (free for public repos).

---

## 8. Security hardening (already in-repo or noted)

### 8.1 .gitignore — done
`.gitignore` now blocks every `.env*` variant, all keystores, service
accounts, Flutter local state, etc. Only `.env.example` is committed.

### 8.2 Security headers
🤖 Already added in `middleware.ts` (this branch). Adds:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`

### 8.3 Rate limiting
Per-user daily limits live in `api_usage` + RPC `increment_api_usage`.
Wired into `/api/chat`, `/api/headline`, `/api/insight`, `/api/outfit`,
`/api/activity`, `/api/trip` (this branch). For anonymous users we
fall back to the existing Play Integrity check, so unattested traffic
still gets blocked at the edge.

### 8.4 RLS sanity check
🧑‍💻 **Manual task for you (one-time).** In Supabase SQL Editor:
```sql
select tablename, rowsecurity from pg_tables where schemaname='public';
```
Every table should show `rowsecurity = true`. If any are false, run:
```sql
alter table public.<tablename> enable row level security;
```

### 8.5 Pre-commit secret scan
🔁 **Local / scripted.** Optional but recommended:
```bash
brew install gitleaks            # or: go install github.com/gitleaks/gitleaks/v8@latest
gitleaks protect --staged
```

---

## 9. Environment variable reference

| Var | Public? | Where used | Where set |
|---|---|---|---|
| `GEMINI_API_KEY` | secret | `/api/chat` etc. | Vercel + .env.local |
| `NEXT_PUBLIC_SUPABASE_URL` | public | client + server | Vercel + .env.local + Flutter --dart-define |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | client + server | Vercel + .env.local + Flutter --dart-define |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Stripe webhook | Vercel |
| `GOOGLE_PLAY_INTEGRITY_SA_JSON` | secret | `/api/*` middleware | Vercel |
| `ANDROID_PACKAGE_NAME` | semi-public | server | Vercel + .env.local |
| `PLAY_INTEGRITY_STRICTNESS` | semi-public | server | Vercel |
| `STRIPE_SECRET_KEY` | secret | checkout + webhook | Vercel |
| `STRIPE_WEBHOOK_SECRET` | secret | webhook signature | Vercel |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | public | pricing page | Vercel |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` | public | pricing page | Vercel |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | public | service worker | Vercel |
| `VAPID_PRIVATE_KEY` | secret | push send | Vercel |
| `VAPID_SUBJECT` | public | push send | Vercel |
| `NEXT_PUBLIC_SITE_URL` | public | OG tags + redirects | Vercel |
| `ATMOS_API_BASE` (mobile) | public | dio base URL | Flutter --dart-define |
| `GOOGLE_CLOUD_PROJECT_NUMBER` (mobile) | public | Play Integrity SDK | Flutter --dart-define |
| `SUPABASE_URL` (mobile) | public | Supabase init | Flutter --dart-define |
| `SUPABASE_ANON_KEY` (mobile) | public | Supabase init | Flutter --dart-define |

---

## 10. Day-one checklist (work through in order)

Tick these off Monday:

- [ ] **1.1–1.3** Supabase project created, keys in Vercel, migrations applied
- [ ] **1.4** Auth URL allow-list configured for prod + localhost + `com.atmos.app://`
- [ ] **1.5** Google OAuth client created and pasted into Supabase
- [ ] **2.1–2.3** Play Integrity service account + JSON in Vercel
- [ ] **3.1–3.3** Stripe products + webhook (in test mode)
- [ ] **4.1–4.2** Vercel connected, all env vars set
- [ ] **6.1–6.2** Mobile app builds locally with `--dart-define`
- [ ] **6.4** Internal-testing AAB uploaded
- [ ] **7.1–7.4** GitHub secrets, branch protection, secret scanning on
- [ ] **8.4** RLS sanity check passes

Optional, this week:
- [ ] **4.3** Custom domain
- [ ] **5.1** VAPID keys generated
- [ ] **6.3** Production keystore + signed AAB
- [ ] **8.5** Pre-commit secret scan

---

## 11. What's still pending in code (from `docs/SCENARIOS.md`)

These are mine to build, not yours. I'll knock them out as you connect
MCPs and unblock me:

| Pending feature | Status |
|---|---|
| `/auth/reset` password reset flow | ✅ done on this branch |
| `/pricing` page + Stripe Checkout | ✅ done on this branch |
| Stripe webhook handler | ✅ done on this branch |
| AI personality wired into prompts | ✅ done on this branch |
| `enforceUsage` on existing AI routes | ✅ done on this branch |
| Severe-weather banner → Open-Meteo warnings | ✅ done on this branch |
| Mobile "Sign in" entry in Settings screen | ✅ done on this branch |
| Mobile AndroidManifest deep-link intent filter | ✅ done on this branch |
| Avatar upload via Supabase Storage | ⏳ blocked on bucket creation (1.6) |
| Push subscription table + FCM dispatch | ⏳ blocked on VAPID keys (5.1) |
| Apple Sign-In | ⏳ defer to iOS work |

When you've done section 1, ping me — I can verify the wiring end-to-end
and tighten anything that surfaces.
