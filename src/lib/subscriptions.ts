export type Tier = 'free' | 'pro'

export type ApiEndpoint = 'chat' | 'headline' | 'insight' | 'outfit' | 'activity' | 'trip'

export interface TierLimits {
  chatMessagesPerDay: number
  headlinesPerDay: number
  insightsPerDay: number
  outfitsPerDay: number
  activitiesPerDay: number
  tripsPerDay: number
  savedLocations: number
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    chatMessagesPerDay: 30,
    headlinesPerDay: 10,
    insightsPerDay: 3,
    outfitsPerDay: 5,
    activitiesPerDay: 5,
    tripsPerDay: 2,
    savedLocations: 5,
  },
  pro: {
    chatMessagesPerDay: 500,
    headlinesPerDay: 200,
    insightsPerDay: 50,
    outfitsPerDay: 100,
    activitiesPerDay: 100,
    tripsPerDay: 30,
    savedLocations: Number.POSITIVE_INFINITY,
  },
}

const ENDPOINT_LIMIT_KEY: Record<ApiEndpoint, keyof TierLimits> = {
  chat: 'chatMessagesPerDay',
  headline: 'headlinesPerDay',
  insight: 'insightsPerDay',
  outfit: 'outfitsPerDay',
  activity: 'activitiesPerDay',
  trip: 'tripsPerDay',
}

export function limitFor(endpoint: ApiEndpoint, tier: Tier): number {
  return TIER_LIMITS[tier][ENDPOINT_LIMIT_KEY[endpoint]]
}

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
}
