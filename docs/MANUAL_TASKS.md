# Atmos — Monday manual tasks checklist

Single-page printable checklist for everything that needs a human in a
dashboard. Work top-to-bottom; later sections depend on earlier ones.

Legend: ⏱ = est. time · 🔑 = unlocks · ✅ = verify it worked

---

## 1. Supabase (foundation — do first)

### 1.1 Create the project ⏱ 5 min
- [ ] https://supabase.com/dashboard → **New project**
- [ ] Pick the closest region to your users
- [ ] Save the database password to your password manager
- 🔑 Auth + database + storage for the whole app
- ✅ Project status shows "Active" in dashboard

### 1.2 Copy API keys ⏱ 3 min
Project Settings → API. Copy three values:
- [ ] **Project URL** → Vercel env `NEXT_PUBLIC_SUPABASE_URL`
- [ ] **anon public key** → Vercel env `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **service_role key** → Vercel env `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ Service-role key bypasses RLS. **Server-only**. Never prefix with `NEXT_PUBLIC_`.
- 🔑 Auth on web + mobile, RLS gating, Stripe webhook writes
- ✅ `npm run dev` → `/sign-up` form loads without "Auth not configured"

### 1.3 Apply database migrations ⏱ 2 min
```bash
npm i -g supabase            # one-time
supabase login
supabase link --project-ref <your-ref>
supabase db push
```
- 🔑 12 tables + RPCs (profiles, subscriptions, saved_locations,
  chat_messages, api_usage, user_preferences, streaks,
  push_subscriptions, notification_preferences, stripe_events,
  feedback, saved_locations.tag column, observability views)
- ✅ Supabase Dashboard → Table Editor → all tables visible

### 1.4 Configure Auth URL allow-list ⏱ 5 min
Authentication → URL Configuration:
- [ ] Site URL: `https://<your-prod-domain>`
- [ ] Redirect URLs (add **all** of these):
  - `https://<your-prod-domain>/auth/callback`
  - `https://*.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `com.atmos.app://login-callback`
- 🔑 Email confirmation + Google OAuth + Android deep link recovery
- ✅ Sign up with email → confirm link opens back into your site

### 1.5 Configure Google OAuth (optional but recommended) ⏱ 15 min
1. Google Cloud Console → APIs & Services → OAuth consent screen → fill in
2. Credentials → Create OAuth client ID (Web)
   - Authorized origins: `https://your-domain.com`, `http://localhost:3000`
   - Authorized redirect URI: `https://<supabase-ref>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → paste Client ID + Secret
- 🔑 "Continue with Google" buttons on web + mobile
- ✅ Sign-in page → Continue with Google → redirects back signed in

### 1.6 (Later) Storage bucket for avatars ⏱ 3 min
- [ ] Storage → Create bucket `avatars`, public
- [ ] RLS policy: INSERT allowed where `bucket_id='avatars'` AND `auth.uid()::text = (storage.foldername(name))[1]`
- 🔑 Profile avatar upload (currently URL-paste only)
- ✅ Profile screen upload button (TODO in code) works end-to-end

---

## 2. Google Cloud — Play Integrity (mobile API gating) ⏱ 20 min

Skip until you ship to Play Store; required only for hardened mobile builds.

### 2.1 Link Google Cloud project to Play
- [ ] Google Play Console → your app → Setup → App integrity → Play Integrity API
- [ ] Link a Google Cloud project
- [ ] Copy the **project number** → `GOOGLE_CLOUD_PROJECT_NUMBER` in `flutter build --dart-define`

### 2.2 Enable Play Integrity API
- [ ] Google Cloud Console → APIs & Services → Library → search "Play Integrity API" → Enable

### 2.3 Service account
- [ ] IAM & Admin → Service Accounts → Create
- [ ] Name: `atmos-play-integrity`; Role: **Play Integrity Service User**
- [ ] Keys → Add key → JSON → download
- [ ] Open the JSON, copy the entire contents
- [ ] Vercel env: `GOOGLE_PLAY_INTEGRITY_SA_JSON` = paste
- [ ] Vercel env: `ANDROID_PACKAGE_NAME=com.atmos.app`
- [ ] Vercel env: `PLAY_INTEGRITY_STRICTNESS=lenient` (flip to `strict` after Play launch)
- 🔑 Server validates that `/api/*` calls from the APK are genuine
- ✅ APK installed via Play internal testing track → AI headline appears (debug APKs are 401 in strict mode, fine in lenient)

---

## 3. Stripe (billing) ⏱ 15 min

### 3.1 Products
- [ ] Stripe Dashboard → Products → + Add
  - **Atmos Pro Monthly** — recurring $4.99/mo (or your price)
  - **Atmos Pro Yearly** — recurring $39.99/yr
- [ ] Copy each Price ID:
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` (Vercel)
  - `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` (Vercel)

### 3.2 API keys
- [ ] Developers → API keys → copy **Secret key** (test mode for now)
- [ ] Vercel env: `STRIPE_SECRET_KEY`

### 3.3 Webhook
- [ ] Developers → Webhooks → Add endpoint
- [ ] URL: `https://your-domain.com/api/stripe/webhook`
- [ ] Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Signing secret → Vercel env: `STRIPE_WEBHOOK_SECRET`
- 🔑 Pro tier flips automatically on subscribe / cancel
- ✅ `stripe trigger checkout.session.completed` from CLI → user's `subscriptions.tier` becomes `pro` in Supabase

### 3.4 Local test
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Use the printed secret as STRIPE_WEBHOOK_SECRET in .env.local
stripe trigger checkout.session.completed
```

---

## 4. Vercel (web hosting) ⏱ 10 min

### 4.1 Connect
- [ ] Add New → Project → Import `ofonn/atmos`
- [ ] Framework: Next.js (auto-detected)
- [ ] Root directory: `/`

### 4.2 Environment variables
Add for **Production**, **Preview**, **Development**:

| Key | From |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `NEXT_PUBLIC_SUPABASE_URL` | §1.2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | §1.2 |
| `SUPABASE_SERVICE_ROLE_KEY` | §1.2 |
| `GOOGLE_PLAY_INTEGRITY_SA_JSON` | §2.3 |
| `ANDROID_PACKAGE_NAME` | `com.atmos.app` |
| `PLAY_INTEGRITY_STRICTNESS` | `lenient` |
| `STRIPE_SECRET_KEY` | §3.2 |
| `STRIPE_WEBHOOK_SECRET` | §3.3 |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | §3.1 |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` | §3.1 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | §6.1 |
| `VAPID_PRIVATE_KEY` | §6.1 |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `NEXT_PUBLIC_SITE_URL` | your prod URL |
| `NEXT_PUBLIC_SENTRY_DSN` | §7 (optional) |
| `SENTRY_AUTH_TOKEN` | §7 (optional, build-time only) |

### 4.3 Custom domain (optional)
- [ ] Settings → Domains → Add
- [ ] DNS at your registrar (A / CNAME)
- [ ] After live: bump `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, Google OAuth origins, Stripe webhook URL

---

## 5. Android build & Play Console ⏱ 30 min (first time)

### 5.1 Keystore (one-time)
```bash
keytool -genkey -v -keystore mobile/android/app/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```
- [ ] Create `mobile/android/key.properties`:
  ```
  storePassword=…
  keyPassword=…
  keyAlias=upload
  storeFile=upload-keystore.jks
  ```
- ⚠️ Both files are in `.gitignore` — never commit them.

### 5.2 First release build
```bash
cd mobile
flutter build appbundle \
  --dart-define=ATMOS_API_BASE=https://your-prod-domain.com \
  --dart-define=GOOGLE_CLOUD_PROJECT_NUMBER=<from §2.1> \
  --dart-define=SUPABASE_URL=https://<ref>.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<anon> \
  --dart-define=SENTRY_DSN=<optional, §7>
```
The signed AAB lands in `build/app/outputs/bundle/release/`.

### 5.3 Play Console upload
- [ ] Play Console → your app → Testing → Internal testing → Create release
- [ ] Upload the AAB; add testers (your email)
- [ ] Roll out + install via the opt-in link

### 5.4 CI release signing
GitHub repo → Settings → Secrets → Actions, add:
- [ ] `ANDROID_KEYSTORE_BASE64` (`base64 -w 0 upload-keystore.jks`)
- [ ] `ANDROID_KEYSTORE_PASSWORD`
- [ ] `ANDROID_KEY_ALIAS`
- [ ] `ANDROID_KEY_PASSWORD`

---

## 6. Push notifications (later, optional) ⏱ 15 min

### 6.1 VAPID keys (web push)
```bash
npx web-push generate-vapid-keys
```
- [ ] Public half → Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- [ ] Private half → Vercel `VAPID_PRIVATE_KEY`
- [ ] Vercel `VAPID_SUBJECT=mailto:you@example.com`

### 6.2 Firebase (FCM for Android)
- [ ] Firebase Console → Add Android app, package `com.atmos.app`
- [ ] Download `google-services.json` → `mobile/android/app/` (gitignored)
- [ ] Add `firebase_messaging` to `mobile/pubspec.yaml` (TODO in code)
- [ ] Firebase service account (same key as §2.3 + `roles/firebasemessaging.user`) for server-side dispatch

---

## 7. Sentry observability (optional) ⏱ 10 min

### 7.1 Web project
- [ ] sentry.io → New project → Platform: Next.js → name `atmos-web`
- [ ] Copy DSN → Vercel `NEXT_PUBLIC_SENTRY_DSN`
- [ ] (Optional) Generate auth token for source-map upload → Vercel `SENTRY_AUTH_TOKEN` (build-time only)

### 7.2 Mobile project
- [ ] sentry.io → New project → Platform: Flutter → name `atmos-android`
- [ ] Copy DSN → pass via `flutter build --dart-define=SENTRY_DSN=…`
- 🔑 Server + client unhandled errors land in Sentry
- ✅ Trigger a test error from `/status` page → appears in Sentry within 1 min

---

## 8. GitHub repo hygiene ⏱ 5 min

- [ ] Settings → Branches → Add rule for `main`:
  - Require PRs, require status checks, require linear history
- [ ] Settings → Security → enable Secret scanning + Push protection
- [ ] (Already configured) `.github/dependabot.yml` for weekly updates

---

## 9. Replace placeholders ⏱ 5 min

Search & replace across the repo (these are intentionally placeholders):

| Placeholder | What to replace with |
|---|---|
| `privacy@atmos.example.com` | Your real privacy contact email |
| `security@atmos.example.com` | Your real security disclosure inbox |
| `feedback@atmos.example.com` | Your real feedback inbox, or remove (FeedbackModal stores to Supabase already) |
| `atmos.example.com` | Your real production domain |
| `https://github.com/ofonn/atmos` | Your real repo URL if forked |

Files that mention them:
- `public/.well-known/security.txt`
- `public/humans.txt`
- `SECURITY.md`
- `README.md`
- `docs/SETUP.md`
- `src/app/privacy/page.tsx`
- `src/app/settings/page.tsx` (mailto links)
- `mobile/lib/screens/settings/settings_screen.dart`
- `supabase/functions/daily-briefing/index.ts`

---

## 10. End-to-end verification ⏱ 10 min

After 1–4 are done, walk this path:

1. **Sign up on web** at `https://your-domain/sign-up`
2. **Save a city** at `/locations`
3. **Wait 30 seconds** (cloud-sync poll)
4. **Build + install Android** with the same Supabase env vars
5. **Sign in on Android** with the same email
6. **Open `/locations` on Android** — saved city appears
7. **Send a chat message on mobile**
8. **Wait 30 seconds**
9. **Refresh `/chat` on web** — message appears

If any step fails, see `docs/SETUP.md` §10½ troubleshooting list.

---

## Done. What you've unlocked

- Real auth on web + Android (email + Google)
- Cross-device sync of cities, chat, prefs
- Stripe Pro upgrade flow with webhook-driven tier flips
- Mobile APK gated by Play Integrity
- Daily cap enforcement per tier
- Severe-weather banner, AI cards, trip planner, etc. — all functional

Then ping me to land the remaining code-only tasks in `docs/adr/`
and the task list in this plan's parent (`A1`–`A7`).
