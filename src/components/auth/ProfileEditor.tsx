'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function ProfileEditor() {
  const { supabase, user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? '')
          setAvatarUrl(data.avatar_url ?? '')
        }
      })
  }, [supabase, user])

  if (!user || !supabase) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={save} className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)' }}>
      <p className="text-[11px] font-label uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Profile
      </p>

      <label className="block">
        <span className="text-[11px] font-label" style={{ color: 'var(--text-muted)' }}>
          Display name
        </span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full bg-transparent border-none outline-none text-sm font-body rounded-xl px-3 py-2"
          style={{
            background: 'var(--surface-mid)',
            color: 'var(--text)',
            border: '0.5px solid var(--outline)',
          }}
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-label" style={{ color: 'var(--text-muted)' }}>
          Avatar URL
        </span>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full bg-transparent border-none outline-none text-sm font-body rounded-xl px-3 py-2"
          style={{
            background: 'var(--surface-mid)',
            color: 'var(--text)',
            border: '0.5px solid var(--outline)',
          }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors active:scale-95 disabled:opacity-50"
        style={{ background: 'var(--primary)', color: 'var(--bg)' }}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {saved && <Check className="w-4 h-4" />}
        {loading ? 'Saving…' : saved ? 'Saved' : 'Save'}
      </button>
    </form>
  )
}
