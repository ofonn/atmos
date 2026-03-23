'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Mic, ArrowUp, Sparkles, Trash2 } from 'lucide-react'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useChat } from '@/hooks/useChat'
import { useState } from 'react'
import { formatTime, displayTempShort } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'

const quickPrompts = [
  'Weekend forecast?',
  'UV Index today',
  'Air quality alert',
  'Best time to exercise?',
]

export default function ChatPage() {
  const router = useRouter()
  const { location } = useLocation()
  const { current, hourly, daily } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )
  const { tempUnit } = useSettings()
  const { messages, loading, sendMessage, clearChat } = useChat({ current, hourly, daily })
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim() && !loading) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
      {/* Nebula ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-[100px]"
          style={{ background: 'rgba(128,110,248,0.12)' }} />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[120px]"
          style={{ background: 'rgba(88,150,253,0.08)' }} />
      </div>

      {/* Header - not fixed, part of flow */}
      <header
        className="relative z-20 flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{
          background: 'var(--bg)',
          borderBottom: '0.5px solid var(--outline)',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl active:scale-95 transition-transform"
            style={{ color: 'var(--primary)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span
            className="text-lg font-bold font-headline tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #806EF8 0%, #5896FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Atmos AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-xl transition-colors active:scale-90"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>


        </div>
      </header>

      {/* Chat Thread - scrollable area takes all remaining space */}
      <main
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div
              className="px-4 py-1 rounded-full font-label text-[10px] uppercase tracking-[0.2em] mb-12"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {location ? ` • ${location.name}, ${location.country}` : ''}
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #806EF8 0%, #5896FD 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold font-headline mb-2" style={{ color: 'var(--text)' }}>Ask me anything</h2>
            <p className="text-sm font-body mb-8 max-w-xs" style={{ color: 'var(--text-muted)' }}>
              I can help you plan your day, decide what to wear, or warn you about upcoming weather changes.
            </p>
          </div>
        ) : (
          <div className="space-y-8 max-w-xl mx-auto">
            {/* Date chip */}
            <div className="flex justify-center">
              <span
                className="px-4 py-1 rounded-full font-label text-[10px] uppercase tracking-[0.2em]"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
              >
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {location ? ` • ${location.name}` : ''}
              </span>
            </div>

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-end gap-3 max-w-[88%] ${isUser ? 'flex-row-reverse' : ''}`}>
                    {!isUser && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-6"
                        style={{ background: 'linear-gradient(135deg, #c7bfff 0%, #acc7ff 100%)' }}
                      >
                        <Sparkles className="w-4 h-4 text-[#25008c]" />
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div
                        className="px-6 py-4 rounded-[2rem] text-[0.9rem] leading-relaxed tracking-tight"
                        style={isUser ? {
                          background: 'rgba(224,226,238,0.05)',
                          border: '1px solid rgba(224,226,238,0.1)',
                          borderRadius: '2rem 2rem 0.5rem 2rem',
                          color: 'var(--text)',
                        } : {
                          background: 'rgba(143,127,255,0.15)',
                          boxShadow: 'inset 0 0 20px rgba(199,191,255,0.08), 0 8px 32px rgba(0,0,0,0.2)',
                          borderTop: '1px solid rgba(199,191,255,0.15)',
                          borderRadius: '2rem 2rem 2rem 0.5rem',
                          color: 'var(--text)',
                        }}
                      >
                        <p>{msg.content}</p>
                      </div>

                      {/* Inline hourly timeline card for first AI message */}
                      {!isUser && idx === 1 && hourly && hourly.length > 0 && (
                        <div
                          className="rounded-[1.5rem] p-4"
                          style={{
                            background: 'rgba(11,14,22,0.4)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-headline font-semibold text-xs tracking-tight" style={{ color: 'var(--text)' }}>
                              Timeline Insight
                            </span>
                            <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                              Active
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {hourly.slice(0, 4).map((hour, hi) => {
                              const isAlert = hour.pop > 60
                              return (
                                <div
                                  key={hour.dt}
                                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl"
                                  style={isAlert
                                    ? { background: 'rgba(199,191,255,0.15)', boxShadow: '0 0 0 1px rgba(199,191,255,0.2)' }
                                    : { background: 'rgba(39,42,51,0.4)' }
                                  }
                                >
                                  <span className={`font-label text-[10px] ${isAlert ? 'font-bold' : ''}`}
                                    style={{ color: isAlert ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {hi === 0 ? 'Now' : formatTime(hour.dt)}
                                  </span>
                                  <WeatherIcon conditionCode={hour.conditionCode} iconCode={hour.icon} size={18} />
                                  <span className="font-headline text-xs font-bold" style={{ color: 'var(--text)' }}>{displayTempShort(hour.temp, tempUnit)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`mt-1.5 font-label text-[10px] ${isUser ? 'mr-2' : 'ml-11'}`}
                    style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
                    {time}
                  </span>
                </div>
              )
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c7bfff 0%, #acc7ff 100%)' }}
                >
                  <Sparkles className="w-4 h-4 text-[#25008c]" />
                </div>
                <div
                  className="px-5 py-4 rounded-[2rem] rounded-bl-lg"
                  style={{
                    background: 'rgba(143,127,255,0.15)',
                    border: '1px solid rgba(199,191,255,0.15)',
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#c7bfff] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#c7bfff] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#c7bfff] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Input area - fixed at bottom, no BottomNav overlap */}
      <div className="relative z-20 flex-shrink-0 px-4 pt-2 pb-4" style={{ background: 'var(--bg)' }}>
        {/* Quick prompts */}
        {messages.length === 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="whitespace-nowrap px-4 py-1.5 rounded-full font-label text-[11px] transition-colors flex-shrink-0 disabled:opacity-40"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-muted)',
                  border: '0.5px solid var(--outline)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="relative group">
          <div
            className="absolute -inset-1 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(128,110,248,0.2), rgba(88,150,253,0.2))' }}
          />
          <div
            className="relative flex items-center rounded-full p-2 pl-6 pr-2"
            style={{
              background: 'var(--surface)',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
              border: '0.5px solid var(--outline)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Atmos (e.g., Do I need a hoodie?)"
              className="bg-transparent border-none focus:ring-0 focus:outline-none flex-1 py-3 font-body text-[0.9rem]"
              style={{ color: 'var(--text)' }}
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-11 h-11 flex items-center justify-center rounded-full transition-colors active:scale-90"
                style={{ color: 'var(--text-muted)' }}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-11 h-11 flex items-center justify-center rounded-full text-white shadow-lg active:scale-90 transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #806EF8 0%, #5896FD 100%)' }}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
