import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pullOnSignIn, pushAll } from './sync'

// ------------------------------------------------------------------
// Stub localStorage so the helpers can read/write without a real DOM.
// ------------------------------------------------------------------
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(k: string) { return this.store.get(k) ?? null }
  key(i: number) { return Array.from(this.store.keys())[i] ?? null }
  removeItem(k: string) { this.store.delete(k) }
  setItem(k: string, v: string) { this.store.set(k, v) }
}

beforeEach(() => {
  // Bind a fresh in-memory store on globalThis for each test.
  ;(globalThis as any).window = { dispatchEvent: vi.fn() }
  ;(globalThis as any).localStorage = new MemoryStorage()
  ;(globalThis as any).StorageEvent = class StorageEvent {
    constructor(public type: string, public init: any) {}
  }
})

// ------------------------------------------------------------------
// Mock Supabase client — recorder pattern. Each .from(table) returns a
// builder that captures the call chain into `calls` so the tests can
// assert "did we delete then insert?" without re-implementing SQL.
// ------------------------------------------------------------------
function makeClient(opts: {
  locations?: any[]
  chats?: any[]
  prefs?: any | null
} = {}) {
  const calls: { op: string; table: string; payload?: unknown }[] = []

  // Selector builder. Every chain method returns `this`, AND the
  // builder is thenable so awaiting it at any point resolves with
  // the seeded data for this table.
  function selectChain(table: string) {
    const data =
      table === 'saved_locations' ? opts.locations ?? []
      : table === 'chat_messages' ? opts.chats ?? []
      : null
    const b: any = {
      eq() { return b },
      order() { return b },
      limit() { return b },
      maybeSingle: () => Promise.resolve({ data: opts.prefs ?? null }),
      then(resolve: (v: { data: any }) => void) {
        resolve({ data })
      },
    }
    return b
  }

  return {
    calls,
    from(table: string) {
      return {
        select: (_cols?: string) => {
          calls.push({ op: 'select', table })
          return selectChain(table)
        },
        insert: (payload: unknown) => {
          calls.push({ op: 'insert', table, payload })
          return Promise.resolve({ data: null, error: null })
        },
        delete: () => {
          calls.push({ op: 'delete', table })
          return { eq: () => Promise.resolve({ data: null, error: null }) }
        },
        upsert: (payload: unknown) => {
          calls.push({ op: 'upsert', table, payload })
          return Promise.resolve({ data: null, error: null })
        },
      }
    },
  } as any
}

// ------------------------------------------------------------------

describe('sync — pullOnSignIn', () => {
  it('writes saved_locations to localStorage when remote has rows', async () => {
    const client = makeClient({
      locations: [{ name: 'Paris', country: 'FR', admin1: null, lat: 48.8, lon: 2.3 }],
    })
    await pullOnSignIn(client, 'user-1')
    const raw = localStorage.getItem('atmos_saved_locations')
    expect(raw).toBeTruthy()
    const arr = JSON.parse(raw!)
    expect(arr[0].name).toBe('Paris')
    expect(arr[0].lat).toBe(48.8)
  })

  it('writes chat history when remote has messages', async () => {
    const client = makeClient({
      chats: [
        { id: 'm1', role: 'user', content: 'hello', created_at: '2026-01-01T00:00:00Z' },
        { id: 'm2', role: 'model', content: 'hi', created_at: '2026-01-01T00:00:05Z' },
      ],
    })
    await pullOnSignIn(client, 'user-1')
    const raw = localStorage.getItem('atmos_chat_messages')
    expect(raw).toBeTruthy()
    const arr = JSON.parse(raw!)
    expect(arr[0].role).toBe('user')
    // 'model' is translated to 'assistant' for the local shape.
    expect(arr[1].role).toBe('assistant')
  })

  it('writes preferences when remote has a row', async () => {
    const client = makeClient({
      prefs: {
        temp_unit: 'F',
        wind_unit: 'mph',
        time_format: '12h',
        headline_tone: 'sarcastic',
        headline_two_line: true,
        headline_location_flavor: false,
        headline_time_aware: false,
        ai_emoji_use: 'none',
        ai_verbosity: 'short',
        language: 'en',
      },
    })
    await pullOnSignIn(client, 'user-1')
    const raw = localStorage.getItem('atmos_settings')
    const obj = JSON.parse(raw!)
    expect(obj.tempUnit).toBe('F')
    expect(obj.aiEmojiUse).toBe('none')
  })

  it('skips writing when remote is empty', async () => {
    const client = makeClient({})
    await pullOnSignIn(client, 'user-1')
    expect(localStorage.getItem('atmos_saved_locations')).toBeNull()
    expect(localStorage.getItem('atmos_chat_messages')).toBeNull()
    expect(localStorage.getItem('atmos_settings')).toBeNull()
  })
})

describe('sync — pushAll', () => {
  it('deletes-then-inserts each table for last-write-wins', async () => {
    localStorage.setItem(
      'atmos_saved_locations',
      JSON.stringify([{ name: 'Tokyo', country: 'JP', lat: 35.7, lon: 139.7 }]),
    )
    localStorage.setItem(
      'atmos_chat_messages',
      JSON.stringify([
        { id: 'a', role: 'user', content: 'hi', timestamp: 1700000000000 },
      ]),
    )
    localStorage.setItem('atmos_settings', JSON.stringify({ tempUnit: 'F' }))
    const client = makeClient()
    await pushAll(client, 'user-1')
    const seq = client.calls.map((c: any) => `${c.op}:${c.table}`)
    // Saved locations: delete then insert (since local non-empty).
    expect(seq).toContain('delete:saved_locations')
    expect(seq).toContain('insert:saved_locations')
    // Chat: delete then insert.
    expect(seq).toContain('delete:chat_messages')
    expect(seq).toContain('insert:chat_messages')
    // Prefs: upsert.
    expect(seq).toContain('upsert:user_preferences')
    // Order: delete must precede the matching insert for both.
    const delLoc = seq.indexOf('delete:saved_locations')
    const insLoc = seq.indexOf('insert:saved_locations')
    expect(delLoc).toBeLessThan(insLoc)
    const delChat = seq.indexOf('delete:chat_messages')
    const insChat = seq.indexOf('insert:chat_messages')
    expect(delChat).toBeLessThan(insChat)
  })

  it('skips insert when local table is empty', async () => {
    const client = makeClient()
    await pushAll(client, 'user-1')
    const seq = client.calls.map((c: any) => `${c.op}:${c.table}`)
    expect(seq).toContain('delete:saved_locations')
    expect(seq).not.toContain('insert:saved_locations')
    expect(seq).toContain('delete:chat_messages')
    expect(seq).not.toContain('insert:chat_messages')
  })

  it('caps chat at 200 most-recent messages', async () => {
    const big = Array.from({ length: 250 }, (_, i) => ({
      id: `${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg ${i}`,
      timestamp: 1700000000000 + i * 1000,
    }))
    localStorage.setItem('atmos_chat_messages', JSON.stringify(big))
    const client = makeClient()
    await pushAll(client, 'user-1')
    const ins = client.calls.find((c: any) => c.op === 'insert' && c.table === 'chat_messages')
    expect(ins).toBeTruthy()
    expect((ins!.payload as unknown[]).length).toBe(200)
  })
})
