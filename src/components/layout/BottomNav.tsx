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
          ? 'relative flex-shrink-0 flex justify-center py-1'
          : 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50'
      }
      aria-label="Main navigation"
    >
      <div className="flex items-end gap-0.5 px-2.5 py-2 rounded-full nav-glass">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all duration-300 active:scale-90 ${
                active ? '' : 'hover:opacity-80'
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                  active
                    ? 'bg-hero-gradient shadow-[0_0_16px_rgba(128,110,248,0.4)]'
                    : ''
                }`}
              >
                <Icon
                  className="w-[18px] h-[18px] transition-colors"
                  style={{
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    opacity: active ? 1 : 0.5,
                  }}
                />
              </div>
              <span
                className={`font-label text-[9px] leading-none tracking-wide transition-colors ${
                  active ? 'font-semibold' : 'font-normal'
                }`}
                style={{
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  opacity: active ? 1 : 0.5,
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
