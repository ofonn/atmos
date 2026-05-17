'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

/**
 * One-time "what's new in this release" toast. The version string is
 * baked at build time; when it changes, every user sees the toast
 * once. Stored in localStorage so dismissal is per-device — fine for
 * release-notes UX.
 */
const VERSION = '2026.05.17'   // Bump on every meaningful release
const STORAGE_KEY = `atmos_whatsnew_seen_${VERSION}`

const HIGHLIGHTS: { emoji: string; line: string }[] = [
  { emoji: '🎬', line: 'Optional weather-adaptive video backgrounds' },
  { emoji: '🧳', line: 'Trip planner with AI packing list' },
  { emoji: '👕', line: 'AI outfit advice on the home screen' },
  { emoji: '☁️', line: 'Cross-device sync (web ↔ Android, same account)' },
  { emoji: '✨', line: 'AI personality picker — emoji + verbosity' },
]

export function WhatsNew() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Defer slightly so we don't fight the onboarding sheet.
        const t = setTimeout(() => setShow(true), 1500)
        return () => clearTimeout(t)
      }
    } catch {}
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 24 }}
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl shadow-xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--bg)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                What&apos;s new in Atmos
              </p>
              <ul className="mt-1 space-y-0.5">
                {HIGHLIGHTS.map((h, i) => (
                  <li
                    key={i}
                    className="text-[11px] leading-snug"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h.emoji} {h.line}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={dismiss} aria-label="Dismiss" className="p-1 flex-shrink-0">
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
