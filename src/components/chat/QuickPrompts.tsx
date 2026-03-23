'use client'

interface QuickPromptsProps {
  onSelect: (prompt: string) => void
  compact?: boolean
}

const prompts = [
  { label: '👕 What should I wear?', value: 'What should I wear today based on the weather?' },
  { label: '☂️ Bring an umbrella?', value: 'Should I bring an umbrella today?' },
  { label: '🏃 Safe to run outside?', value: 'Is it safe to go running outside right now?' },
  { label: '🕐 Times to watch?', value: 'What times should I be watching for weather changes today?' },
]

export function QuickPrompts({ onSelect, compact }: QuickPromptsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'justify-start' : 'justify-center'}`}>
      {prompts.map((p) => (
        <button
          key={p.value}
          onClick={() => onSelect(p.value)}
          className={`bg-surface-container-high border border-outline-variant/10 rounded-full hover:border-primary/40 hover:bg-surface-container-highest transition text-on-surface text-sm ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
