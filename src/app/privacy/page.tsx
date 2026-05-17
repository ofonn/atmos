import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Privacy — Atmos',
}

export default function PrivacyPage() {
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
          Privacy
        </h1>
      </header>

      <main className="relative z-10 flex-1 px-6 pt-6 pb-32 w-full max-w-2xl mx-auto space-y-5">
        <Section title="What we collect">
          <p>Just enough to show you weather and remember your preferences.</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><b>Location</b> — only if you grant permission; used to fetch
              forecasts. We don&apos;t share it with anyone.</li>
            <li><b>Email + name</b> — only if you create an account.</li>
            <li><b>Saved cities, chat history, settings</b> — stored on your
              device, mirrored to your Supabase account if signed in.</li>
            <li><b>Subscription status</b> — Stripe tells us when you upgrade
              or cancel. We never see card numbers.</li>
          </ul>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>No advertising trackers.</li>
            <li>No analytics that record individual users.</li>
            <li>No selling, sharing, or licensing your data.</li>
            <li>No location history kept on our servers.</li>
          </ul>
        </Section>

        <Section title="Third parties">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><b>Open-Meteo</b> — public weather API. We send your
              coordinates with each forecast request.</li>
            <li><b>Nominatim / OpenStreetMap</b> — reverse geocoding (city
              name from lat/lon).</li>
            <li><b>Google Gemini</b> — generates AI text. Conversations
              are sent to Google for processing under their terms.</li>
            <li><b>Supabase</b> — stores your account + sync data.
              Hosted in their EU/US regions.</li>
            <li><b>Stripe</b> — processes your subscription payment.
              They handle card details, we don&apos;t.</li>
            <li><b>Vercel</b> — hosts the website. They log standard
              HTTP request metadata.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>
            You can view, export, or delete everything we store about you:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>View — Settings → Account.</li>
            <li>Export — ask via the email below; we&apos;ll send a JSON.</li>
            <li>Delete — Settings → Danger zone → Delete my account.
              This is immediate and irreversible.</li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email <b>privacy@atmos.example.com</b> (replace
            with your real address before launch).
          </p>
        </Section>

        <p className="text-[11px] pt-6" style={{ color: 'var(--text-muted)' }}>
          Last updated: 2026-05-16. We&apos;ll bump this date when we materially change anything.
        </p>
      </main>
      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-sm font-label uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </h2>
      <div
        className="rounded-2xl px-5 py-4 space-y-3 text-sm leading-relaxed"
        style={{ background: 'var(--surface)', color: 'var(--text)' }}
      >
        {children}
      </div>
    </section>
  )
}
