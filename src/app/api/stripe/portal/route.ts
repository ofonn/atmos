import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { requireUser } from '@/lib/supabase/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Open the Stripe Customer Portal for the signed-in user.
 * Lets them cancel / change plan / update card / view invoices.
 */
export async function POST(req: NextRequest) {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp
  const user = userOrResp

  const supabase = createSupabaseServerClient()
  const { data: subRow } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!subRow?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get('origin') ||
    new URL(req.url).origin

  const session = await getStripe().billingPortal.sessions.create({
    customer: subRow.stripe_customer_id,
    return_url: `${origin}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
