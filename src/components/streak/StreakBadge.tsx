'use client'

import { useEffect, useState } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface StreakData {
  current_streak: number
  longest_streak: number
  total_opens: number
}

export function StreakBadge() {
  const { supabase, user } = useAuth()
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from('streaks')
      .select('current_streak, longest_streak, total_opens')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setData(data as StreakData)
      })
  }, [supabase, user])

  if (!user || !data) return null

  return (
    <div>
      <p
        className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Streak
      </p>
      <div
        className="grid grid-cols-3 gap-2 px-5 py-4 rounded-2xl"
        style={{ background: 'var(--surface)' }}
      >
        <Stat icon={Flame} label="Current" value={data.current_streak} />
        <Stat icon={Trophy} label="Longest" value={data.longest_streak} />
        <Stat label="Total" value={data.total_opens} />
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {Icon && <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
        <span className="text-xl font-bold font-headline" style={{ color: 'var(--text)' }}>
          {value}
        </span>
      </div>
      <p className="text-[10px] font-label uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  )
}
