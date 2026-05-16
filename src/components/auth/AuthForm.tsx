'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, Lock } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (!supabase) {
    return (
      <div className="text-center">
        <h1
          className="text-2xl font-bold font-headline tracking-tight"
          style={{ color: 'var(--primary)' }}
        >
          Auth not configured
        </h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign in.
        </p>
      </div>
    )
  }

  const redirectTo = params.get('next') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          },
        })
        if (signUpError) throw signUpError
        setInfo('Check your inbox to confirm your email.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setOauthLoading(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(err?.message ?? 'OAuth failed')
      setOauthLoading(false)
    }
  }

  const isSignUp = mode === 'sign-up'

  return (
    <div>
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-bold font-headline tracking-tight"
          style={{ color: 'var(--primary)' }}
        >
          {isSignUp ? 'Create account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          {isSignUp
            ? 'Sign up to sync your places across devices.'
            : 'Sign in to access your Atmos account.'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={oauthLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-colors active:scale-95 disabled:opacity-50"
        style={{ background: 'var(--surface)', color: 'var(--text)', border: '0.5px solid var(--outline)' }}
      >
        {oauthLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
            />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--outline)' }} />
        <span className="text-[11px] font-label uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--outline)' }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
        >
          <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
            style={{ color: 'var(--text)' }}
          />
        </div>

        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
        >
          <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? 'Choose a password (min 6)' : 'Your password'}
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
            style={{ color: 'var(--text)' }}
          />
        </div>

        {error && (
          <p className="text-xs px-1" style={{ color: '#ff7a85' }}>
            {error}
          </p>
        )}
        {info && (
          <p className="text-xs px-1" style={{ color: 'var(--primary)' }}>
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--bg)' }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold" style={{ color: 'var(--primary)' }}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-bold" style={{ color: 'var(--primary)' }}>
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
