'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface HealthData {
  ok: boolean
  service: string
  time: string
  region: string
  commit: string
}

interface SyncData {
  ok: boolean
  signedIn: boolean
  user?: { email: string }
  counts?: Record<string, number | string>
  supabase?: boolean
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [sync, setSync] = useState<SyncData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/health').then((r) => r.json()),
      fetch('/api/health/sync').then((r) => r.json()),
    ])
      .then(([h, s]) => {
        setHealth(h as HealthData)
        setSync(s as SyncData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header
        className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-2xl saturate-150 flex items-center gap-3"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <Link href="/settings" aria-label="Back">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text)' }} />
        </Link>
        <h1 className="text-xl font-bold font-headline tracking-tight" style={{ color: 'var(--primary)' }}>
          Status
        </h1>
      </header>

      <main className="relative z-10 flex-1 px-6 pt-6 pb-32 w-full max-w-xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            <Section title="API">
              {health ? (
                <>
                  <Row ok={health.ok} label="Reachable" value={health.ok ? 'Yes' : 'No'} />
                  <Row label="Region" value={health.region} />
                  <Row label="Commit" value={health.commit} mono />
                  <Row label="Server time" value={new Date(health.time).toLocaleString()} />
                </>
              ) : (
                <p className="text-xs" style={{ color: '#ff7a85' }}>API unreachable</p>
              )}
            </Section>

            <Section title="Cross-device sync">
              {sync ? (
                <>
                  <Row
                    ok={sync.signedIn}
                    label="Signed in"
                    value={sync.signedIn ? sync.user?.email ?? 'yes' : 'no'}
                  />
                  {sync.signedIn && sync.counts ? (
                    <>
                      <p
                        className="text-[11px] mt-2 mb-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Row counts visible to you (same numbers should appear on
                        every device signed into this account):
                      </p>
                      {Object.entries(sync.counts).map(([t, c]) => (
                        <Row key={t} label={t} value={String(c)} mono />
                      ))}
                    </>
                  ) : (
                    <Row
                      label="Supabase"
                      value={sync.supabase ? 'configured' : 'NOT configured'}
                    />
                  )}
                </>
              ) : (
                <p className="text-xs" style={{ color: '#ff7a85' }}>Sync diagnostic unreachable</p>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p
        className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
      <div className="rounded-2xl px-5 py-4 space-y-1" style={{ background: 'var(--surface)' }}>
        {children}
      </div>
    </section>
  )
}

function Row({
  ok,
  label,
  value,
  mono,
}: {
  ok?: boolean
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
        {ok === true && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />}
        {ok === false && <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />}
        {label}
      </span>
      <span
        className={`text-xs ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--text-muted)' }}
      >
        {value}
      </span>
    </div>
  )
}
