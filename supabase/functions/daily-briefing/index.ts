// Supabase Edge Function — daily AI briefing dispatch
//
// Trigger via a Postgres cron in supabase/migrations/0010_cron.sql (TBD)
// or via the dashboard's "Schedule" tab on this function:
//   schedule: "0 * * * *"   // every hour, function filters users whose
//                              local 7am matches the current UTC hour
//
// Manual task for you:
//   1. supabase functions deploy daily-briefing
//   2. supabase secrets set GEMINI_API_KEY=… FCM_SERVICE_ACCOUNT_JSON=…
//   3. dashboard → Database → Cron → Add job pointing at this function
//
// What it does:
//   - Find rows in notification_preferences where daily_briefing=true
//     and daily_briefing_hour matches the current local hour (TODO:
//     resolve per-user timezone — for v1 we treat it as UTC)
//   - For each, fetch their primary saved_location
//   - Generate a one-sentence briefing via Gemini
//   - Dispatch via FCM (Android) and Web Push (browser)
//
// This file is a skeleton — fill in TODOs once the Stripe + push
// keys land in the secrets store.

// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Authenticate the cron caller. Supabase passes its anon key by
  // default; for cron we require the explicit service-role header.
  const cronKey = req.headers.get('x-cron-key')
  const expected = Deno.env.get('CRON_SECRET')
  if (!expected || cronKey !== expected) {
    return new Response('forbidden', { status: 403 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const nowUtcHour = new Date().getUTCHours()

  // Step 1 — find users to brief.
  const { data: targets, error } = await supabase
    .from('notification_preferences')
    .select('user_id, daily_briefing_hour')
    .eq('daily_briefing', true)
    .eq('daily_briefing_hour', nowUtcHour)

  if (error) {
    console.error('[briefing] fetch targets', error)
    return new Response('db error', { status: 500 })
  }

  console.log(`[briefing] ${targets?.length ?? 0} users to brief @ ${nowUtcHour}h UTC`)

  // TODO Step 2 — for each user:
  //   - fetch primary saved_location
  //   - fetch forecast
  //   - generate AI briefing (Gemini)
  //   - fetch their push_subscriptions (web + FCM)
  //   - dispatch
  //
  // Until that's implemented, just ack.

  return new Response(
    JSON.stringify({ dispatched: 0, candidates: targets?.length ?? 0 }),
    { headers: { 'content-type': 'application/json' } },
  )
})
