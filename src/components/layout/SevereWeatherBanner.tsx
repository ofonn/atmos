'use client'

import { AlertTriangle } from 'lucide-react'

// Note: To be wired up to actual alert API later. For now, prop-driven.
export function SevereWeatherBanner({ title, description }: { title?: string, description?: string }) {
  if (!title) return null

  return (
    <div 
      className="w-full px-4 py-3 pb-4 mb-2 relative overflow-hidden flex items-start gap-3"
      style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)',
      }}
      role="alert"
    >
      <div 
        className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 blur-2xl rounded-full" 
        style={{ pointerEvents: 'none' }}
      />
      <div className="mt-0.5 rounded-full p-1 bg-white/20 flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline font-bold text-sm text-white mb-0.5">
          {title}
        </h3>
        {description && (
          <p className="font-body text-xs text-white/90 leading-snug pr-4">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
