'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, Check, Loader2 } from 'lucide-react'

type Category = 'bug' | 'feature' | 'ai' | 'other'

const CATS: { value: Category; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'ai', label: 'AI quality' },
  { value: 'other', label: 'Other' },
]

interface Props {
  open: boolean
  defaultCategory?: Category
  onClose: () => void
}

export function FeedbackModal({ open, defaultCategory = 'other', onClose }: Props) {
  const [category, setCategory] = useState<Category>(defaultCategory)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim(), source: 'web' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSent(true)
      setMessage('')
      setTimeout(() => {
        setSent(false)
        onClose()
      }, 1400)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 py-8"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl p-6 relative"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-on-surface/5 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>

            <h2
              className="text-xl font-bold font-headline tracking-tight mb-1"
              style={{ color: 'var(--text)' }}
            >
              Tell us what&apos;s on your mind
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              We read everything. Bugs, features, AI quirks — all welcome.
            </p>

            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {CATS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="px-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: category === c.value ? 'var(--primary)' : 'var(--surface-mid)',
                      color: category === c.value ? 'var(--bg)' : 'var(--text-muted)',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened, or what would you like?"
                rows={5}
                maxLength={4000}
                className="w-full rounded-2xl p-3 text-sm font-body resize-none outline-none"
                style={{
                  background: 'var(--surface-mid)',
                  color: 'var(--text)',
                  border: '0.5px solid var(--outline)',
                }}
              />
              {error && (
                <p className="text-xs px-1" style={{ color: '#ff7a85' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--primary)', color: 'var(--bg)' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : sent ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? 'Sending…' : sent ? 'Sent — thank you' : 'Send'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
