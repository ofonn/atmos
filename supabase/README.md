# Supabase Infrastructure

Database schema, RLS policies, RPC functions, and setup steps for Atmos
per-user accounts and subscription-tier rate limiting.

---

## Manual steps (you do these yourself)

### 1. Create the Supabase project
1. Sign up at https://supabase.com and create a new project.
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **`service_role` key** → `SUPABASE_SERVICE_ROLE_KEY` (server-only,
     needed later for Stripe webhook to write to `subscriptions`).
3. Add the public ones to `.env.local` and to your Vercel project. Keep
   the service-role key out of any client bundle — server-only.

### 2. Configure Auth in the Supabase dashboard
- **Authentication → URL Configuration**
  - Site URL: `https://<your-prod-domain>`
  - Additional Redirect URLs (allow-list):
    - `https://<your-prod-domain>/auth/callback`
    - `http://localhost:3000/auth/callback`
- **Authentication → Providers → Email**: on by default. Turn off
  "Confirm email" during development if you want.
- **Authentication → Providers → Google** (optional):
  1. Google Cloud Console → APIs & Services → OAuth consent screen → fill it in.
  2. Create OAuth 2.0 Client ID (Web application). Authorized redirect URI:
     `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
  3. Paste the Client ID + Client Secret into Supabase.

### 3. Apply the database migrations

**Option A — Supabase CLI (recommended).**
```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — SQL Editor.** Open Supabase Dashboard → SQL Editor and run
each file under `supabase/migrations/` in numeric order
(`0001_` first, `0005_` last).

### 4. Verify
Visit `/sign-up`, create an account, then in the Supabase Dashboard:
- **Authentication → Users**: your row appears.
- **Table Editor → profiles**: trigger auto-created a row.
- **Table Editor → subscriptions**: trigger auto-created a `free` row.

---

## What the migrations create

| Table | Purpose |
|---|---|
| `profiles` | Display name, email, avatar — auto-created on signup. |
| `subscriptions` | Per-user tier (`free` \| `pro`) + Stripe IDs. Auto-`free` on signup. |
| `saved_locations` | Per-user saved cities (replaces `localStorage`). |
| `chat_messages` | Per-user chat history (replaces `localStorage`). |
| `api_usage` | Per-day per-endpoint counter for rate limiting. |

RLS is on for every table. Users can only see/modify their own rows.
`subscriptions` is read-only from the client — only the service role
(Stripe webhook) writes there.

### RPC: `increment_api_usage(p_endpoint, p_limit)`
Atomic check + increment. Used by `enforceUsage()` in
`src/lib/supabase/usage.ts`. Returns the new count, or `-1` if the user
is at the daily cap.

---

## Server helpers (already wired in code)

| Helper | Where | What |
|---|---|---|
| `getServerUser()` | `src/lib/supabase/auth.ts` | Read current user in Server Components & route handlers. |
| `requireUser()` | `src/lib/supabase/auth.ts` | Returns user OR a 401 `NextResponse` you return immediately. |
| `getUserTier(userId)` | `src/lib/supabase/auth.ts` | `'free'` \| `'pro'` (checks `current_period_end`). |
| `enforceUsage(endpoint, tier)` | `src/lib/supabase/usage.ts` | Atomic per-day check + increment, returns 429 if over. |

Tier limits live in `src/lib/subscriptions.ts` — edit there to retune.

---

## Wiring a route to require auth + enforce limits

Example for `/api/chat`:

```ts
import { requireUser, getUserTier } from '@/lib/supabase/auth'
import { enforceUsage } from '@/lib/supabase/usage'

export async function POST(req: NextRequest) {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp

  const tier = await getUserTier(userOrResp.id)
  const limited = await enforceUsage('chat', tier)
  if (limited) return limited

  // ... existing chat logic
}
```

This is intentionally NOT wired into the existing API routes yet — adding
gating is a separate step once you've verified the auth flow end-to-end.

---

## Not yet implemented (future work)

- **Stripe**: webhook handler to flip `subscriptions.tier`, customer
  portal link, checkout session creation.
- **Data migration**: move `useSavedPlaces` & `useChat` from
  `localStorage` to Supabase tables.
- **Mobile auth**: Flutter Supabase SDK integration in the Android app.
- **Email templates**: customize the confirmation / magic-link emails
  in Supabase → Authentication → Email Templates.
