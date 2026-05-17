'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function DangerZone() {
  const { user, signOut, disabled } = useAuth()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (disabled || !user) return null

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Type DELETE to confirm.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
      await signOut()
      router.push('/')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <p
        className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
        style={{ color: '#ff7a85' }}
      >
        Danger zone
      </p>
      <div
        className="px-5 py-4 rounded-2xl"
        style={{ background: 'var(--surface)', border: '0.5px solid #ff7a85' }}
      >
        {!confirming ? (
          <div className="space-y-2">
            <a
              href="/api/account/export"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
            >
              <Download className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-medium">Export my data</span>
            </a>
            <button
              onClick={() => setConfirming(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95"
              style={{ background: 'var(--surface-mid)', color: '#ff7a85' }}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete my account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ff7a85' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  This permanently deletes your account.
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Saved cities, chat history, preferences, and subscription
                  are erased. You can sign up fresh with the same email.
                </p>
              </div>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full rounded-xl px-3 py-2 text-sm font-mono bg-transparent border-none outline-none"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)', border: '0.5px solid var(--outline)' }}
            />
            {error && <p className="text-xs" style={{ color: '#ff7a85' }}>{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setConfirming(false); setConfirmText(''); setError(null) }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || confirmText !== 'DELETE'}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: '#ff7a85', color: '#000' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete forever
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
