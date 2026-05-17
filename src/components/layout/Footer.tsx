import Link from 'next/link'

/**
 * Slim footer for marketing-ish pages (/pricing, /privacy, /sign-in).
 * Intentionally NOT used in the main app shell — that has the
 * AtmosBottomNav and we don't want to push the hero down.
 */
export function Footer() {
  return (
    <footer
      className="w-full px-6 py-6 mt-12 text-[11px] flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
      style={{ color: 'var(--text-muted)', borderTop: '0.5px solid var(--outline)' }}
    >
      <Link href="/" className="hover:opacity-80 transition-opacity">
        Atmos
      </Link>
      <Link href="/pricing" className="hover:opacity-80 transition-opacity">
        Pricing
      </Link>
      <Link href="/privacy" className="hover:opacity-80 transition-opacity">
        Privacy
      </Link>
      <a
        href="https://github.com/ofonn/atmos"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        GitHub
      </a>
      <span>· Powered by Open-Meteo + Gemini</span>
    </footer>
  )
}
