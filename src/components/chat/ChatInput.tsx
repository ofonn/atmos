'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

// Minimal SpeechRecognition typings — not part of standard lib.d.ts.
type SR = any

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recRef = useRef<SR | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as unknown as {
      SpeechRecognition?: SR
      webkitSpeechRecognition?: SR
    }
    const ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    setSupported(Boolean(ctor))
  }, [])

  const startMic = () => {
    const w = window as unknown as {
      SpeechRecognition?: SR
      webkitSpeechRecognition?: SR
    }
    const ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!ctor) return
    const rec: SR = new ctor()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      let txt = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript
      }
      setInput((prev) => (prev ? prev + ' ' : '') + txt)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    try { rec.start() } catch { setListening(false) }
  }

  const stopMic = () => {
    try { recRef.current?.stop() } catch {}
    setListening(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-outline-variant/20 bg-surface-container"
    >
      <div className="flex items-center gap-2 bg-surface-container-high rounded-2xl px-4 py-2.5">
        {supported && (
          <button
            type="button"
            onClick={listening ? stopMic : startMic}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              listening ? 'bg-red-500/20 animate-pulse' : 'hover:bg-on-surface/5'
            }`}
            disabled={disabled}
          >
            {listening ? (
              <MicOff className="w-4 h-4" style={{ color: '#ef4444' }} />
            ) : (
              <Mic className="w-4 h-4 text-on-surface-variant" />
            )}
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? 'Listening…' : 'Ask about the weather...'}
          className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40 font-body"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center disabled:opacity-30 transition"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </form>
  )
}
