'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CloudRain, MapPin, ArrowRight, Check } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'

type Step = 'welcome' | 'video' | 'permission' | 'done'

/**
 * First-launch onboarding sheet. Mounts on every page but only shows
 * when `onboardingComplete` is false in settings. Drives 3 steps:
 *   1. Welcome
 *   2. Opt-in for weather-based video background
 *   3. Location permission nudge (Web Geolocation prompt is asked from
 *      `useLocation` separately — here we just explain why)
 */
export function OnboardingFlow() {
  const { onboardingComplete, updateSetting } = useSettings()
  const [step, setStep] = useState<Step>('welcome')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || onboardingComplete) return null

  const finish = () => {
    updateSetting('onboardingComplete', true)
    setStep('done')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="w-full sm:max-w-md mx-auto rounded-t-3xl sm:rounded-3xl p-8 relative"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
        >
          <div className="w-12 h-1.5 rounded-full mx-auto mb-6 sm:hidden" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />

          {step === 'welcome' && <Welcome onNext={() => setStep('video')} />}
          {step === 'video' && (
            <VideoOptIn
              onChoose={(choice) => {
                updateSetting('videoBackground', choice)
                setStep('permission')
              }}
            />
          )}
          {step === 'permission' && <Permission onDone={finish} />}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div
        className="w-16 h-16 mx-auto rounded-2xl mb-5 flex items-center justify-center"
        style={{ background: 'var(--primary)' }}
      >
        <Sparkles className="w-8 h-8" style={{ color: 'var(--bg)' }} />
      </div>
      <h2
        className="text-3xl font-bold font-headline tracking-tight mb-2"
        style={{ color: 'var(--text)' }}
      >
        Welcome to Atmos
      </h2>
      <p className="text-sm leading-relaxed mb-8 px-2" style={{ color: 'var(--text-muted)' }}>
        Your AI weather companion. Let&apos;s set up a couple of quick things
        so it feels like yours.
      </p>
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
        style={{ background: 'var(--primary)', color: 'var(--bg)' }}
      >
        Get started <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function VideoOptIn({ onChoose }: { onChoose: (c: 'on' | 'off') => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-mid)' }}
        >
          <CloudRain className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h2
            className="text-xl font-bold font-headline tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Animated weather background?
          </h2>
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
        The home page can play a short video loop that matches the current
        weather — rain on leaves when it&apos;s raining, drifting clouds at
        sunset, snow falling, etc. It looks great but uses more battery
        and data.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => onChoose('on')}
          className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl transition-all active:scale-95"
          style={{ background: 'var(--primary)', color: 'var(--bg)' }}
        >
          <Check className="w-5 h-5" />
          <span className="text-sm font-bold">Yes, enable</span>
        </button>
        <button
          onClick={() => onChoose('off')}
          className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl transition-all active:scale-95"
          style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
        >
          <span className="text-sm font-bold">No, default</span>
        </button>
      </div>
      <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
        You can change this any time in Settings.
      </p>
    </div>
  )
}

function Permission({ onDone }: { onDone: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface-mid)' }}
        >
          <MapPin className="w-6 h-6" style={{ color: 'var(--primary)' }} />
        </div>
        <h2
          className="text-xl font-bold font-headline tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Allow location?
        </h2>
      </div>
      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
        Atmos uses your location only to show the forecast for where you
        are right now. We never share it. You can deny and search for a
        city by name instead.
      </p>
      <button
        onClick={onDone}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
        style={{ background: 'var(--primary)', color: 'var(--bg)' }}
      >
        Got it
      </button>
      <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>
        Your browser will prompt for the actual permission next.
      </p>
    </div>
  )
}
