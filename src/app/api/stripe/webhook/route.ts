import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'

/**
 * Stripe webhook handler — flips `subscriptions.tier` between free/pro
 * based on subscription events. Uses the service-role key so RLS
 * doesn't apply (clients can't write to subscriptions).
 *
 * Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   URL: https://your-domain.com/api/stripe/webhook
 *   Events: checkout.session.completed,
 *           customer.subscription.created,
 *           customer.subscription.updated,
 *           customer.subscription.deleted,
 *           invoice.payment_failed
 *   Save → reveal signing secret → set STRIPE_WEBHOOK_SECRET on Vercel.
 */
export const runtime = 'nodejs'
// We need raw body for signature verification.
export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')
  }
  return createServerClient(url, serviceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const admin = getAdminClient()
  const userId =
    (sub.metadata?.supabase_user_id as string | undefined) ||
    (typeof sub.customer === 'object' && sub.customer
      ? ((sub.customer as Stripe.Customer).metadata?.supabase_user_id as string | undefined)
      : undefined)

  let resolvedUserId = userId
  if (!resolvedUserId) {
    // Fall back: look up by stripe_customer_id.
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
    if (customerId) {
      const { data } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      resolvedUserId = data?.user_id
    }
  }
  if (!resolvedUserId) {
    console.warn('[stripe.webhook] cannot resolve user_id for subscription', sub.id)
    return
  }

  const tier: 'pro' | 'free' =
    sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free'

  // Map Stripe statuses to our enum (we don't have 'unpaid' / 'paused').
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    paused: 'past_due',
    unpaid: 'past_due',
  }

  // Newer Stripe API versions moved `current_period_end` onto items;
  // fall back gracefully so old + new shapes both work.
  const periodEnd =
    (sub as any).current_period_end ??
    (sub.items?.data?.[0] as any)?.current_period_end ??
    null

  await admin
    .from('subscriptions')
    .update({
      tier,
      status: (statusMap[sub.status] as any) ?? 'active',
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq('user_id', resolvedUserId)
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (e: any) {
    console.error('[stripe.webhook] signature verify failed', e.message)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  // Idempotency: refuse to re-process the same event. The unique PK
  // means the second insert errors (23505) and we exit early.
  try {
    const admin = getAdminClient()
    const { error: insErr } = await admin
      .from('stripe_events')
      .insert({ id: event.id, type: event.type })
    if (insErr) {
      // Duplicate event = already processed — ack and exit.
      if ((insErr as any).code === '23505') {
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.warn('[stripe.webhook] idempotency insert', insErr)
    }
  } catch (e) {
    console.warn('[stripe.webhook] idempotency table missing — skipping', e)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId, {
            expand: ['customer'],
          })
          await upsertSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscription(sub)
        break
      }
      case 'invoice.payment_failed': {
        // No state change here — let `customer.subscription.updated` follow
        // up with `past_due`. Just log for visibility.
        console.warn('[stripe.webhook] payment failed', event.id)
        break
      }
      default:
        // Ignore other event types.
        break
    }
    // Mark processed.
    try {
      const admin = getAdminClient()
      await admin
        .from('stripe_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', event.id)
    } catch {}
  } catch (e: any) {
    console.error('[stripe.webhook] handler error', e)
    try {
      const admin = getAdminClient()
      await admin.from('stripe_events').update({ error: e.message }).eq('id', event.id)
    } catch {}
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
