'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'atmos_pwa_install_dismissed_at'
const SUPPRESS_DAYS = 14

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || '0')
    if (dismissedAt && Date.now() - dismissedAt < SUPPRESS_DAYS * 86_400_000) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!visible || !evt) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  const install = async () => {
    try {
      await evt.prompt()
      await evt.userChoice
    } catch {}
    setVisible(false)
  }

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--primary)', color: 'var(--bg)' }}
      >
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          Install Atmos
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Add to your home screen for the full app experience.
        </p>
      </div>
      <button
        onClick={install}
        className="px-3 py-2 rounded-xl text-xs font-bold"
        style={{ background: 'var(--primary)', color: 'var(--bg)' }}
      >
        Install
      </button>
      <button onClick={dismiss} className="p-1" aria-label="Dismiss">
        <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  )
}
