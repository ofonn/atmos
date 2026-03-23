'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, BarChart2, MessageCircle, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/technical', icon: BarChart2, label: 'Details' },
  { href: '/overview', icon: CalendarDays, label: 'Overview' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-full"
        style={{
          background: 'rgba(24, 27, 36, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          border: '0.5px solid rgba(255,255,255,0.05)',
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-90 ${
                active
                  ? 'bg-hero-gradient shadow-[0_0_20px_rgba(128,110,248,0.35)]'
                  : 'text-[#e0e2ee]/40 hover:text-[#c7bfff]'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
