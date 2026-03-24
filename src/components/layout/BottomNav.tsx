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

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40" aria-label="Main navigation">
      <div
        className="flex items-end gap-1 px-3 py-2 rounded-full nav-glass"
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-1 py-1 rounded-full transition-all duration-300 active:scale-90 ${
                active ? '' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  active
                    ? 'bg-hero-gradient shadow-[0_0_20px_rgba(128,110,248,0.35)]'
                    : ''
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    active ? 'text-white' : 'text-[#e0e2ee]'
                  }`}
                />
              </div>
              {active && (
                <span
                  className="font-label text-[9px] leading-none tracking-wide"
                  style={{ color: 'var(--primary)' }}
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
