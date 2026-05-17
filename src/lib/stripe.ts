import Stripe from 'stripe'

/**
 * Lazy-init Stripe client. Throws only when actually invoked without
 * `STRIPE_SECRET_KEY` set, so build-time imports stay safe.
 */
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  _stripe = new Stripe(key, {
    // Omit apiVersion to use the SDK default for the installed major.
    typescript: true,
  })
  return _stripe
}

export const PRICE_IDS = {
  proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? '',
  proYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? '',
}
