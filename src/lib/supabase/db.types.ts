/**
 * Hand-rolled types mirroring `supabase/migrations/`. Replace with output
 * of `supabase gen types typescript --linked` once the project is linked.
 */

export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

export interface ProfileRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionRow {
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface SavedLocationRow {
  id: string
  user_id: string
  name: string
  country: string | null
  admin1: string | null
  lat: number
  lon: number
  is_primary: boolean
  created_at: string
}

export interface ChatMessageRow {
  id: string
  user_id: string
  role: 'user' | 'model'
  content: string
  created_at: string
}

export interface ApiUsageRow {
  user_id: string
  endpoint: string
  day: string
  count: number
}

export interface UserPreferencesRow {
  user_id: string
  temp_unit: 'C' | 'F'
  wind_unit: 'kmh' | 'mph'
  time_format: '12h' | '24h'
  headline_tone: string
  headline_two_line: boolean
  headline_location_flavor: boolean
  headline_time_aware: boolean
  ai_emoji_use: 'none' | 'light' | 'heavy'
  ai_verbosity: 'short' | 'medium' | 'long'
  language: string
  updated_at: string
}

export interface StreakRow {
  user_id: string
  current_streak: number
  longest_streak: number
  last_open: string
  total_opens: number
  updated_at: string
}
