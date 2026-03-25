'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ArrowUp, Sparkles, Trash2, MoreHorizontal } from 'lucide-react'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useChat } from '@/hooks/useChat'
import { formatTime, displayTempShort } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'

// Render markdown: **bold**, *italic*, bullet lists
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []

  lines.forEach((line, li) => {
    const trimmed = line.trim()
    if (!trimmed) {
      result.push(<br key={`br-${li}`} />)
      return
    }

    const isBullet = /^[\*\-]\s+/.test(trimmed)
    const content = isBullet ? trimmed.replace(/^[\*\-]\s+/, '') : trimmed

    const parts: React.ReactNode[] = []
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
    let last = 0
    let match
    while ((match = regex.exec(content)) !== null) {
      if (match.index > last) parts.push(content.slice(last, match.index))
      if (match[1] !== undefined) parts.push(<strong key={match.index}>{match[1]}</strong>)
      else if (match[2] !== undefined) parts.push(<em key={match.index}>{match[2]}</em>)
      last = match.index + match[0].length
    }
    if (last < content.length) parts.push(content.slice(last))

    if (isBullet) {
      result.push(
        <div key={li} className="flex gap-2 mt-1">
          <span style={{ opacity: 0.5, flexShrink: 0 }}>•</span>
          <span>{parts}</span>
        </div>
      )
    } else {
      result.push(<p key={li} className={li > 0 ? 'mt-2' : ''}>{parts}</p>)
    }
  })

  return result
}

const quickPrompts = [
  'Will it rain tomorrow?',
  'Dress for a run?',
  'Weekend outlook?',
]

export default function ChatPage() {
  const router = useRouter()
  const { location, current, hourly, daily } = useWeatherContext()
  const { tempUnit } = useSettings()
  const { messages, loading, sendMessage, clearChat } = useChat({ current, hourly, daily })
  const [input, setInput] = useState('')
  const [typingText, setTypingText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)
  const pendingMsgRef = useRef<string | null>(null)

  const [showMenu, setShowMenu] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [revealedData, setRevealedData] = useState<Record<string, boolean>>({})

  const toggleData = (id: string) => setRevealedData(p => ({ ...p, [id]: !p[id] }))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    try {
      const pending = localStorage.getItem('atmos_chat_pending')
      if (pending) {
        localStorage.removeItem('atmos_chat_pending')
        pendingMsgRef.current = pending
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (autoSentRef.current || !pendingMsgRef.current || !current) return
    autoSentRef.current = true
    const pending = pendingMsgRef.current
    pendingMsgRef.current = null

    let i = 0
    setTypingText('')
    const interval = setInterval(() => {
      i++
      setTypingText(pending.slice(0, i))
      if (i >= pending.length) {
        clearInterval(interval)
        setTimeout(() => {
          setTypingText('')
          sendMessage(pending)
        }, 400)
      }
    }, 18)
  }, [current, sendMessage])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (input.trim() && !loading) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <div className="relative flex flex-col h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-[100px]"
          style={{ background: 'rgba(128,110,248,0.12)' }}
        />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[120px]"
          style={{ background: 'rgba(88,150,253,0.08)' }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 flex-shrink-0 backdrop-blur-md w-full max-w-xl mx-auto"
        style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--outline)'
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-xl active:scale-95 transition-transform"
            style={{ color: 'var(--primary)' }}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <span
            className="text-lg font-bold font-headline tracking-tight"
            style={{
              background: 'linear-gradient(90deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Atmos AI
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => { setShowMenu(!showMenu); setConfirmClear(false) }}
            aria-label="More options"
            className="p-2 rounded-xl transition-colors active:scale-90"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-12 rounded-xl p-2 w-48 shadow-2xl backdrop-blur-xl border z-50 text-[13px] font-body"
                style={{ background: 'var(--surface)', borderColor: 'var(--outline)' }}
              >
                {!confirmClear ? (
                  <>
                    <button onClick={() => setShowMenu(false)} className="w-full text-left px-3 py-2 rounded-lg hover:opacity-80 transition-colors" style={{ color: 'var(--text)' }}>Export Chat</button>
                    <button onClick={() => setShowMenu(false)} className="w-full text-left px-3 py-2 rounded-lg hover:opacity-80 transition-colors" style={{ color: 'var(--text)' }}>Share Answer</button>
                    <div className="h-px my-1" style={{ background: 'var(--outline)' }} />
                    <button 
                      onClick={() => setConfirmClear(true)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear History
                    </button>
                  </>
                ) : (
                  <div className="p-1">
                    <p className="px-2 pb-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>Are you sure?</p>
                    <div className="flex gap-1">
                      <button onClick={() => setConfirmClear(false)} className="flex-1 py-1.5 rounded-lg transition-colors" style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}>Cancel</button>
                      <button onClick={() => { clearChat(); setShowMenu(false); setConfirmClear(false) }} className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Chat Thread */}
      <main ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-4 w-full max-w-xl mx-auto">
        {messages.length === 0 ? (
          /* Empty state — centered with quick prompts inline */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-6">
            <div
              className="px-4 py-1 rounded-full font-label text-[10px] uppercase tracking-[0.2em]"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {location ? ` • ${location.name}, ${location.country}` : ''}
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-headline mb-2" style={{ color: 'var(--text)' }}>Weather answers and planning help</h2>
              <p className="text-sm font-body max-w-xs" style={{ color: 'var(--text-muted)' }}>
                I can help you plan your day, decide what to wear, or warn you about upcoming weather changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={loading || !!typingText}
                  className="px-4 py-1.5 rounded-full font-label text-xs transition-colors disabled:opacity-40"
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
          </div>
        ) : (
          <div className="space-y-8 max-w-xl mx-auto">
            {/* Date chip */}
            <div className="flex justify-center">
              <span
                className="px-4 py-1 rounded-full font-label text-[11px] uppercase tracking-[0.2em]"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
              >
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {location ? ` • ${location.name}` : ''}
              </span>
            </div>

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              // Use stored timestamp — not current time
              const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-end gap-3 max-w-[88%] ${isUser ? 'flex-row-reverse' : ''}`}>
                    {!isUser && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-6"
                        style={{ background: 'linear-gradient(135deg, #c7bfff 0%, #acc7ff 100%)' }}
                        aria-hidden="true"
                      >
                        <Sparkles className="w-4 h-4 text-[#25008c]" />
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div
                        className="px-6 py-4 text-[0.9rem] leading-relaxed tracking-tight"
                        style={isUser ? {
                          background: 'transparent',
                          border: '1px solid var(--outline)',
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
                        {isUser
                          ? <p>{msg.content}</p>
                          : <div className="text-[0.9rem] leading-relaxed">{renderMarkdown(msg.content)}</div>}
                      </div>

                      {/* Contextual inline card — animated in via Show Data */}
                      {!isUser && (
                        <div className="mt-3 border-t pt-2" style={{ borderColor: 'var(--outline)' }}>
                          <button
                            onClick={() => toggleData(msg.id)}
                            className="flex items-center text-[10px] uppercase font-bold tracking-widest hover:opacity-80 transition-opacity"
                            style={{ color: 'var(--primary)' }}
                          >
                            {revealedData[msg.id] ? 'Hide Data' : 'Show Data \u2192'}
                          </button>
                          {revealedData[msg.id] && (
                            <div className="mt-3">
                              <ContextualCard
                                userMsg={messages[idx - 1]?.content ?? ''}
                                current={current}
                                hourly={hourly}
                                daily={daily}
                                tempUnit={tempUnit}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isUser && (
                    <time
                      className="mt-1.5 font-label text-[10px] uppercase ml-11 tracking-wider"
                      dateTime={new Date(msg.timestamp).toISOString()}
                      style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                    >
                      Based on hourly forecast • Updated {time}
                    </time>
                  )}
                </div>
              )
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c7bfff 0%, #acc7ff 100%)' }}
                  aria-hidden="true"
                >
                  <Sparkles className="w-4 h-4 text-[#25008c]" />
                </div>
                <div
                  className="px-5 py-4 rounded-[2rem] rounded-bl-lg"
                  style={{
                    background: 'rgba(143,127,255,0.15)',
                    border: '1px solid rgba(199,191,255,0.15)',
                  }}
                  aria-label="Atmos is typing"
                  role="status"
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

      {/* Input area */}
      <div
        className="relative z-10 flex-shrink-0 px-4 pt-2 pb-4 w-full max-w-xl mx-auto"
        style={{ background: 'var(--bg)' }}
      >
        {/* Quick prompts — only in empty state (handled above), show inline chips otherwise */}
        {messages.length > 0 && (
          <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading || !!typingText}
                className="px-4 py-2 rounded-full font-label text-[11px] flex-shrink-0 transition-colors disabled:opacity-40 min-h-[36px] flex items-center"
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
              value={typingText || input}
              onChange={(e) => { if (!typingText) setInput(e.target.value) }}
              placeholder="Ask about the forecast..."
              aria-label="Message to Atmos AI"
              className="bg-transparent border-none focus:ring-0 focus:outline-none flex-1 py-3 font-body text-[0.9rem]"
              style={{ color: typingText ? 'var(--primary)' : 'var(--text)' }}
              disabled={loading || !!typingText}
              readOnly={!!typingText}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="w-11 h-11 flex items-center justify-center rounded-full text-white shadow-lg active:scale-90 transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)' }}
            >
              <ArrowUp className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Contextual card — animated in after AI response ─────────────────────────

function ContextualCard({
  userMsg,
  current,
  hourly,
  daily,
  tempUnit,
}: {
  userMsg: string;
  current: any;
  hourly: any;
  daily: any;
  tempUnit: 'C' | 'F';
}) {
  const q = userMsg.toLowerCase()

  const isWeekQuery = /week|weekend|days|plan|forecast|monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(q)
  const isRainQuery = /rain|umbrella|wet|storm|drizzle|precipit/.test(q)
  const isWearQuery = /wear|dress|outfit|clothes|jacket|hoodie|coat|shirt|shorts/.test(q)
  const isMetricsQuery = /humid|uv|pressure|wind|visibility|air quality/.test(q)
  const isHourlyQuery = /hour|today|now|later|afternoon|morning|evening|tonight/.test(q)

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '0.5px solid var(--outline)',
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut', delay: 0.1 } },
  }

  let card: React.ReactNode = null

  if (isWeekQuery && daily && daily.length > 0) {
    card = (
      <div className="rounded-[1.5rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-headline font-semibold text-xs" style={{ color: 'var(--text)' }}>Weekly Snapshot</span>
          <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'var(--primary)' }}>7 Days</span>
        </div>
        <div className="flex flex-col gap-2">
          {daily.slice(0, 5).map((day: any, di: number) => {
            const label = di === 0 ? 'Today' : di === 1 ? 'Tomorrow' : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })
            const hasRain = day.pop > 40
            return (
              <div key={day.dt} className="flex items-center gap-3 px-1">
                <span className="text-xs font-label w-14 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <WeatherIcon conditionCode={day.conditionCode} iconCode={day.icon} size={16} />
                <span className="flex-1 text-xs font-body capitalize truncate" style={{ color: 'var(--text-muted)' }}>{day.description}</span>
                {hasRain && <span className="text-xs font-label" style={{ color: '#60a5fa' }}>{day.pop}%</span>}
                <span className="text-xs font-bold font-headline w-10 text-right" style={{ color: 'var(--text)' }}>
                  {displayTempShort(day.tempMax, tempUnit)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  } else if (isWearQuery && current) {
    card = (
      <div className="rounded-[1.5rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-headline font-semibold text-xs" style={{ color: 'var(--text)' }}>Right Now</span>
          <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Conditions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Feels Like', value: displayTempShort(current.feelsLike, tempUnit) },
            { label: 'Humidity', value: `${current.humidity}%` },
            { label: 'Wind', value: `${Math.round(current.windSpeed)} km/h` },
            { label: 'Rain chance', value: `${hourly?.[0]?.pop ?? 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2.5" style={{ background: 'var(--surface-mid)' }}>
              <p className="text-[0.65rem] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    )
  } else if (isMetricsQuery && current) {
    card = (
      <div className="rounded-[1.5rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-headline font-semibold text-xs" style={{ color: 'var(--text)' }}>Atmospheric Data</span>
          <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Live</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Humidity', value: `${current.humidity}%` },
            { label: 'Pressure', value: `${current.pressure} hPa` },
            { label: 'Wind', value: `${Math.round(current.windSpeed)} km/h` },
            { label: 'Visibility', value: `${Math.round((current.visibility ?? 0) / 1000)} km` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-2.5" style={{ background: 'var(--surface-mid)' }}>
              <p className="text-[0.65rem] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    )
  } else if (isRainQuery && hourly && hourly.length > 0) {
    card = (
      <div className="rounded-[1.5rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-headline font-semibold text-xs" style={{ color: 'var(--text)' }}>Rain Outlook</span>
          <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: '#60a5fa' }}>Next 8h</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {hourly.slice(0, 4).map((hour: any, hi: number) => (
            <div
              key={hour.dt}
              className="flex flex-col items-center gap-1 p-2 rounded-xl"
              style={{ background: hour.pop > 50 ? 'rgba(96,165,250,0.15)' : 'var(--surface-mid)' }}
            >
              <span className="font-label text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {hi === 0 ? 'Now' : formatTime(hour.dt)}
              </span>
              <WeatherIcon conditionCode={hour.conditionCode} iconCode={hour.icon} size={18} />
              <span className="text-xs font-bold" style={{ color: hour.pop > 50 ? '#60a5fa' : 'var(--text-muted)' }}>
                {hour.pop}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  } else if (isHourlyQuery && hourly && hourly.length > 0) {
    card = (
      <div className="rounded-[1.5rem] p-4" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-headline font-semibold text-xs" style={{ color: 'var(--text)' }}>Hourly Forecast</span>
          <span className="font-label text-[10px] uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Today</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {hourly.slice(0, 4).map((hour: any, hi: number) => (
            <div
              key={hour.dt}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl"
              style={{ background: 'rgba(39,42,51,0.4)' }}
            >
              <span className="font-label text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {hi === 0 ? 'Now' : formatTime(hour.dt)}
              </span>
              <WeatherIcon conditionCode={hour.conditionCode} iconCode={hour.icon} size={18} />
              <span className="font-headline text-xs font-bold" style={{ color: 'var(--text)' }}>
                {displayTempShort(hour.temp, tempUnit)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!card) return null

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      {card}
    </motion.div>
  )
}
