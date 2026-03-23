'use client'

import { useState } from 'react'
import { MapPin, Bell, Search, Menu, X } from 'lucide-react'
import type { Location } from '@/types/weather'

interface HeaderProps {
  location: Location | null
  onSearch: (city: string) => void
  loading: boolean
}

export function Header({ location, onSearch, loading }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className="px-6 py-4 flex items-center justify-between w-full z-50">
      {/* Left: Location */}
      <div className="flex items-center gap-2">
        {location ? (
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 text-primary font-headline text-sm font-medium tracking-tight hover:opacity-80 transition-opacity"
          >
            <MapPin className="w-4 h-4" />
            <span>
              {location.name}
              {location.country ? `, ${location.country}` : ''}
            </span>
          </button>
        ) : loading ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/30 animate-pulse" />
            <div className="h-4 w-24 rounded bg-surface-container-high animate-pulse" />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 text-primary font-headline text-sm font-medium tracking-tight"
          >
            <MapPin className="w-4 h-4" />
            <span>Set location</span>
          </button>
        )}
      </div>

      {/* Right: Avatar / Search toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <div className="h-10 w-10 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center">
          <span className="text-on-surface-variant text-sm font-label">
            {location?.name?.[0]?.toUpperCase() || 'A'}
          </span>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 px-6 z-50">
          <form onSubmit={handleSearch}>
            <div className="glass-input rounded-2xl p-2 pl-5 flex items-center gap-3">
              <Search className="w-4 h-4 text-on-surface-variant/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city..."
                className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/50 font-body text-sm py-2"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-on-surface-variant/50 hover:text-on-surface transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
