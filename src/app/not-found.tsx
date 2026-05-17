import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Not found — Atmos',
}

export default function NotFound() {
  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />
      <div className="relative z-10 max-w-sm">
        <p
          className="text-[11px] font-label uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          404
        </p>
        <h1
          className="text-3xl font-bold font-headline tracking-tight mb-3"
          style={{ color: 'var(--primary)' }}
        >
          That page drifted off.
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          The link might be wrong, or the page moved. Head home to keep
          checking the weather.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold"
          style={{ background: 'var(--primary)', color: 'var(--bg)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
