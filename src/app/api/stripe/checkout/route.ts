import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRICE_IDS } from '@/lib/stripe'
import { requireUser } from '@/lib/supabase/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Create a Stripe Checkout Session for the signed-in user.
 *
 * Body: { plan: 'monthly' | 'yearly' }
 *
 * Reuses the customer ID stored on `subscriptions` if it exists, or
 * creates a new Stripe customer keyed by Supabase user id. On success
 * returns `{ url }` for the client to redirect to.
 */
export async function POST(req: NextRequest) {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp
  const user = userOrResp

  const { plan } = (await req.json()) as { plan?: 'monthly' | 'yearly' }
  const priceId = plan === 'yearly' ? PRICE_IDS.proYearly : PRICE_IDS.proMonthly
  if (!priceId) {
    return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
  }

  const stripe = getStripe()
  const supabase = createSupabaseServerClient()

  // Find or create the Stripe customer.
  const { data: subRow } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let customerId = subRow?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get('origin') ||
    new URL(req.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?upgraded=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
  return NextResponse.json({ url: session.url })
}
