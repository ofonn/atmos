'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { BottomNav } from '@/components/layout/BottomNav'
import { ArrowLeft, Play, Pause, RefreshCw, Layers } from 'lucide-react'

interface RadarFrame {
  time: number
  path: string
}

export default function RadarPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const radarLayerRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)

  const { location } = useWeatherContext()
  const [frames, setFrames] = useState<RadarFrame[]>([])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapType, setMapType] = useState<'dark' | 'satellite'>('dark')

  // Format unix timestamp to readable time
  const fmtTime = (unix: number) => {
    const d = new Date(unix * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Initialise Leaflet map
  useEffect(() => {
    if (!mapRef.current || !location || mapInstanceRef.current) return

    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [location.lat, location.lon],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      })
      mapInstanceRef.current = map

      // Base tile layer
      const darkTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 18, subdomains: 'abcd' }
      )
      const lightTiles = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 18 }
      )
      darkTiles.addTo(map)

      // Attribution (small)
      L.control.attribution({ prefix: false, position: 'bottomleft' })
        .addAttribution('© <a href="https://www.openstreetmap.org">OSM</a> | Radar: <a href="https://rainviewer.com">RainViewer</a>')
        .addTo(map)

      // Location marker — styled dot
      L.circleMarker([location.lat, location.lon], {
        radius: 7,
        color: '#c7bfff',
        fillColor: '#806EF8',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map).bindPopup(`<b>${location.name}</b>`)

      // Zoom controls repositioned
      L.control.zoom({ position: 'topright' }).addTo(map)

      setMapReady(true)

      // Fetch radar frames from RainViewer
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        const data = await res.json()
        const past: RadarFrame[] = (data.radar?.past || []).slice(-10) // last 10 frames
        setFrames(past)
        setCurrentFrame(past.length - 1) // start at latest

        // Show latest frame immediately
        if (past.length > 0) {
          const latest = past[past.length - 1]
          const layer = L.tileLayer(
            `https://tilecache.rainviewer.com${latest.path}/512/{z}/{x}/{y}/4/1_1.png`,
            { opacity: 0.75, zIndex: 10 }
          )
          layer.addTo(map)
          radarLayerRef.current = layer
        }
      } catch (e) {
        console.error('RainViewer fetch failed', e)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        radarLayerRef.current = null
      }
      if (animFrameRef.current) clearTimeout(animFrameRef.current)
    }
  }, [location])

  // Switch radar frame when currentFrame changes
  useEffect(() => {
    if (!mapInstanceRef.current || frames.length === 0) return
    const L_module = (window as any).L
    const frame = frames[currentFrame]
    if (!frame) return

    const showFrame = async () => {
      const L = (await import('leaflet')).default
      if (radarLayerRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current)
      }
      const layer = L.tileLayer(
        `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/4/1_1.png`,
        { opacity: 0.75, zIndex: 10 }
      )
      layer.addTo(mapInstanceRef.current)
      radarLayerRef.current = layer
    }
    showFrame()
  }, [currentFrame, frames])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return
    const advance = () => {
      setCurrentFrame(prev => (prev + 1) % frames.length)
      animFrameRef.current = window.setTimeout(advance, 600)
    }
    animFrameRef.current = window.setTimeout(advance, 600)
    return () => { if (animFrameRef.current) clearTimeout(animFrameRef.current) }
  }, [isPlaying, frames])

  const handlePlayPause = () => setIsPlaying(p => !p)

  const goToLatest = () => {
    setIsPlaying(false)
    setCurrentFrame(frames.length - 1)
  }

  return (
    <div className="relative flex flex-col h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="relative z-20 flex-shrink-0 flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full transition-opacity active:opacity-60"
          style={{ background: 'var(--surface)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text)' }} />
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            Live Radar
          </h1>
          {location && (
            <p className="text-[11px] font-label" style={{ color: 'var(--text-muted)' }}>
              {location.name} · Powered by RainViewer
            </p>
          )}
        </div>
        <button
          onClick={goToLatest}
          className="p-2 rounded-full transition-opacity active:opacity-60"
          style={{ background: 'var(--surface)' }}
          aria-label="Jump to latest frame"
        >
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </button>
      </header>

      {/* Map container */}
      <div className="relative flex-1 min-h-0">
        {!location && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>
              Enable location to see the radar
            </p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Radar controls overlay */}
        {frames.length > 0 && (
          <div
            className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl px-4 py-3"
            style={{ background: 'rgba(16,19,28,0.85)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(199,191,255,0.15)' }}
          >
            {/* Time scrubber */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={handlePlayPause}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity active:opacity-60"
                style={{ background: 'linear-gradient(135deg, #806EF8, #5896FD)' }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying
                  ? <Pause className="w-3.5 h-3.5 text-white" />
                  : <Play className="w-3.5 h-3.5 text-white" />}
              </button>
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={currentFrame}
                onChange={e => { setIsPlaying(false); setCurrentFrame(Number(e.target.value)) }}
                className="flex-1 h-1 rounded-full appearance-none"
                style={{ accentColor: '#806EF8' }}
              />
              <span className="flex-shrink-0 text-[11px] font-label font-bold w-14 text-right" style={{ color: 'var(--primary)' }}>
                {frames[currentFrame] ? fmtTime(frames[currentFrame].time) : '--:--'}
              </span>
            </div>

            {/* Frame dots */}
            <div className="flex items-center gap-1 justify-center">
              {frames.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIsPlaying(false); setCurrentFrame(i) }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === currentFrame ? '16px' : '6px',
                    height: '6px',
                    background: i === currentFrame ? '#806EF8' : 'rgba(199,191,255,0.3)',
                  }}
                  aria-label={`Frame ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {!mapReady && location && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] z-20">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>Loading radar…</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav inline />
    </div>
  )
}
