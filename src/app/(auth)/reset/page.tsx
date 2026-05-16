'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, Check } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function ResetForm() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [mode, setMode] = useState<'request' | 'update'>(() => {
    if (typeof window === 'undefined') return 'request'
    // If the URL has a `code` (PKCE) or hash with `type=recovery`, we're in the
    // post-click update mode. supabase-js handles the session via the URL
    // fragment automatically on load.
    const hash = window.location.hash
    return hash.includes('type=recovery') ? 'update' : 'request'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (!supabase) {
    return (
      <div className="text-center">
        <h1
          className="text-2xl font-bold font-headline tracking-tight"
          style={{ color: 'var(--primary)' }}
        >
          Auth not configured
        </h1>
      </div>
    )
  }

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  if (mode === 'update') {
    return (
      <div>
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold font-headline tracking-tight"
            style={{ color: 'var(--primary)' }}
          >
            Set a new password
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a new password for your account.
          </p>
        </div>
        <form onSubmit={updatePassword} className="space-y-3">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
          >
            <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6)"
              autoComplete="new-password"
              className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
              style={{ color: 'var(--text)' }}
            />
          </div>
          {error && <p className="text-xs px-1" style={{ color: '#ff7a85' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--bg)' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save password
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-bold font-headline tracking-tight"
          style={{ color: 'var(--primary)' }}
        >
          Reset password
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          We&apos;ll email you a link to set a new password.
        </p>
      </div>

      {sent ? (
        <div
          className="rounded-2xl px-4 py-6 text-center"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
        >
          <Check className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            Check <span className="font-bold">{email}</span> for the reset link.
          </p>
        </div>
      ) : (
        <form onSubmit={requestReset} className="space-y-3">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
          >
            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
              style={{ color: 'var(--text)' }}
            />
          </div>
          {error && <p className="text-xs px-1" style={{ color: '#ff7a85' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--bg)' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send reset link
          </button>
        </form>
      )}

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        <Link href="/sign-in" className="font-bold" style={{ color: 'var(--primary)' }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  )
}
