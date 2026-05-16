import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * One-way + write-through cloud sync for the user's localStorage state.
 * Strategy: on sign-in we PULL from remote and overwrite local if the
 * remote has any data — that way a new device adopts the user's account.
 * On every push (called from a poll), we mirror local to remote.
 *
 * Race / conflict handling is intentionally simple: last-write-wins.
 */

const LS = {
  savedLocations: 'atmos_saved_locations',
  chatMessages: 'atmos_chat_messages',
  settings: 'atmos_settings',
} as const

type Json = unknown

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key: string, value: Json) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

interface LocalLocation {
  lat: number
  lon: number
  name: string
  country: string
  admin1?: string
}

interface LocalChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface LocalSettings {
  tempUnit?: 'C' | 'F'
  windUnit?: 'kmh' | 'mph'
  timeFormat?: '12h' | '24h'
  headlineTone?: string
  headlineTwoLine?: boolean
  headlineLocationFlavor?: boolean
  headlineTimeAware?: boolean
  aiEmojiUse?: 'none' | 'light' | 'heavy'
  aiVerbosity?: 'short' | 'medium' | 'long'
  language?: string
}

export async function pullOnSignIn(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // saved_locations
  const { data: locs } = await supabase
    .from('saved_locations')
    .select('name, country, admin1, lat, lon')
    .eq('user_id', userId)
  if (locs && locs.length > 0) {
    writeLS(
      LS.savedLocations,
      locs.map((l) => ({
        name: l.name,
        country: l.country ?? '',
        admin1: l.admin1 ?? undefined,
        lat: l.lat,
        lon: l.lon,
      })),
    )
  }

  // chat_messages
  const { data: msgs } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (msgs && msgs.length > 0) {
    writeLS(
      LS.chatMessages,
      msgs.map((m) => ({
        id: m.id,
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
      })),
    )
  }

  // user_preferences
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (prefs) {
    const next: LocalSettings = {
      tempUnit: prefs.temp_unit,
      windUnit: prefs.wind_unit,
      timeFormat: prefs.time_format,
      headlineTone: prefs.headline_tone,
      headlineTwoLine: prefs.headline_two_line,
      headlineLocationFlavor: prefs.headline_location_flavor,
      headlineTimeAware: prefs.headline_time_aware,
      aiEmojiUse: prefs.ai_emoji_use,
      aiVerbosity: prefs.ai_verbosity,
      language: prefs.language,
    }
    writeLS(LS.settings, next)
    // Dispatch a storage event so SettingsContext picks it up.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', { key: LS.settings }))
    }
  }
}

export async function pushAll(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const locs = readLS<LocalLocation[]>(LS.savedLocations, [])
  const msgs = readLS<LocalChatMessage[]>(LS.chatMessages, [])
  const settings = readLS<LocalSettings>(LS.settings, {})

  // saved_locations: replace all (simple, idempotent)
  await supabase.from('saved_locations').delete().eq('user_id', userId)
  if (locs.length > 0) {
    await supabase.from('saved_locations').insert(
      locs.map((l) => ({
        user_id: userId,
        name: l.name,
        country: l.country || null,
        admin1: l.admin1 || null,
        lat: l.lat,
        lon: l.lon,
      })),
    )
  }

  // chat_messages: replace all (keep at most 200)
  await supabase.from('chat_messages').delete().eq('user_id', userId)
  const trimmed = msgs.slice(-200)
  if (trimmed.length > 0) {
    await supabase.from('chat_messages').insert(
      trimmed.map((m) => ({
        user_id: userId,
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
        created_at: new Date(m.timestamp).toISOString(),
      })),
    )
  }

  // user_preferences: upsert
  await supabase.from('user_preferences').upsert(
    {
      user_id: userId,
      temp_unit: settings.tempUnit ?? 'C',
      wind_unit: settings.windUnit ?? 'kmh',
      time_format: settings.timeFormat ?? '24h',
      headline_tone: settings.headlineTone ?? 'casual',
      headline_two_line: settings.headlineTwoLine ?? false,
      headline_location_flavor: settings.headlineLocationFlavor ?? false,
      headline_time_aware: settings.headlineTimeAware ?? false,
      ai_emoji_use: settings.aiEmojiUse ?? 'light',
      ai_verbosity: settings.aiVerbosity ?? 'medium',
      language: settings.language ?? 'en',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
}
