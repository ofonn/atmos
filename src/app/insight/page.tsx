'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Shirt, CalendarClock, MessageCircle, MapPin } from 'lucide-react'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useAiContent } from '@/hooks/useAiContent'
import { BottomNav } from '@/components/layout/BottomNav'
import { wmoEmoji } from '@/lib/weatherUtils'

export default function InsightPage() {
  const router = useRouter()
  const { location, current, locLoading } = useWeatherContext()
  const { content, loading: aiLoading } = useAiContent(null, null, null) // Hook will grab cache natively, but we can pass null since it's already initialized by Root/Home

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--bg)]">
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 backdrop-blur-xl w-full"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text)]" />
          </button>
          <span className="font-headline font-extrabold tracking-tight text-xl text-[var(--text)]">
            Daily Briefing
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1.5 text-[11px] font-label font-bold text-[var(--text-muted)] bg-[var(--surface-mid)] px-3 py-1.5 rounded-full">
            <MapPin className="w-3 h-3 text-[var(--primary)]" />
            <span className="truncate max-w-[100px]">{location.name}</span>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-5 pb-32 pt-4">
        {locLoading || aiLoading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-64 w-full rounded-3xl bg-[var(--surface-mid)] opacity-50" />
            <div className="flex gap-4">
              <div className="h-32 flex-1 rounded-2xl bg-[var(--surface-mid)] opacity-40" />
              <div className="h-32 flex-1 rounded-2xl bg-[var(--surface-mid)] opacity-30" />
            </div>
            <div className="h-20 w-full rounded-2xl bg-[var(--surface-mid)] opacity-20 mt-4" />
          </div>
        ) : !content ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Sparkles className="w-12 h-12 text-[var(--text-muted)] mb-4 opacity-50" />
            <p className="text-[var(--text-muted)] font-medium">Unable to load your briefing at this time. Please try again later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* Main AI Hero Insight */}
            <div 
              className="relative p-7 rounded-3xl overflow-hidden shadow-sm"
              style={{
                background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
                border: '1px solid var(--outline)'
              }}
            >
              <div className="absolute top-0 right-0 p-6 opacity-30 text-8xl pointer-events-none select-none blur-[2px]">
                {current ? wmoEmoji(current.conditionCode) : '✨'}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-md bg-[var(--primary)] text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="font-headline font-bold text-sm text-[var(--text)] tracking-wide uppercase">
                    Here&apos;s the plan
                  </h2>
                </div>
                <h3 className="font-headline text-2xl font-black mb-4 leading-[1.15] text-[var(--text)]">
                  {content.headline}
                </h3>
                <p className="font-body text-[var(--text-muted)] text-[15px] leading-relaxed max-w-[90%]">
                  {content.proactiveInsight}
                </p>
              </div>
            </div>

            {/* Smart Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Outfit Recommendation */}
              <div className="p-5 rounded-3xl" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--surface-mid)' }}>
                  <Shirt className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <h4 className="font-headline font-bold text-sm text-[var(--text)] mb-2">Outfit Check</h4>
                <p className="font-body text-xs text-[var(--text-muted)] leading-relaxed">
                  {content.outfit || 'Dress comfortably for the current conditions.'}
                </p>
              </div>

              {/* Activity Forecast */}
              <div className="p-5 rounded-3xl" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--surface-mid)' }}>
                  <CalendarClock className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <h4 className="font-headline font-bold text-sm text-[var(--text)] mb-2">Timing</h4>
                <p className="font-body text-xs text-[var(--text-muted)] leading-relaxed">
                  {content.activity || 'No specific timing constraints today.'}
                </p>
              </div>
            </div>

            {/* Ask Atmos CTA */}
            <div className="mt-4">
              <button
                onClick={() => router.push('/chat')}
                className="w-full relative overflow-hidden group p-5 rounded-3xl flex items-center justify-between border transition-transform active:scale-[0.98]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'rgba(199,191,255,0.2)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-start gap-1">
                  <h4 className="font-headline font-bold text-[var(--text)]">Have more questions?</h4>
                  <p className="text-xs text-[var(--text-muted)]">Ask the Atmos AI assistant</p>
                </div>

                <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(var(--glass-rgb),0.2)]" style={{ background: 'var(--bg)' }}>
                  <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
