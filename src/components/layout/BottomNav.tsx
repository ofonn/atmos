'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, BarChart2, MessageCircle, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/technical', icon: BarChart2, label: 'Details' },
  { href: '/overview', icon: CalendarDays, label: 'Outlook' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav({ inline = false }: { inline?: boolean }) {
  const pathname = usePathname()

  return (
    <nav
      className={
        inline
          ? 'relative flex-shrink-0 flex justify-center py-1.5 w-full max-w-xl mx-auto'
          : 'fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 md:px-0 flex justify-center'
      }
      aria-label="Main navigation"
    >
      <div className="flex items-end justify-between md:justify-center gap-1 md:gap-4 px-3 py-2 rounded-full nav-glass w-full md:w-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] px-2 py-1 rounded-full transition-all duration-300 active:scale-90 ${
                active ? '' : 'hover:opacity-80'
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                  active
                    ? 'bg-hero-gradient shadow-[0_0_20px_rgba(128,110,248,0.35)]'
                    : ''
                }`}
              >
                <Icon
                  className="w-[18px] h-[18px] transition-colors"
                  style={{
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    opacity: active ? 1 : 0.6,
                  }}
                />
              </div>
              {/* Always show label — persistent labels on all tabs (#001) */}
              <span
                className={`font-label text-[11px] leading-none tracking-wide transition-colors ${
                  active ? 'font-semibold' : 'font-normal'
                }`}
                style={{
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  opacity: active ? 1 : 0.7,
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
