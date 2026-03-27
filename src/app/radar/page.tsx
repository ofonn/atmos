'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { BottomNav } from '@/components/layout/BottomNav'
import { ArrowLeft, Play, Pause, RefreshCw } from 'lucide-react'

interface RadarFrame { time: number; path: string }

type LayerType = 'rain' | 'snow' | 'type' | 'infrared' | 'forecast'

interface LayerConfig {
  id: LayerType
  label: string
  emoji: string
  colorScheme: number  // RainViewer color scheme 0-8
  snow: 0 | 1          // 0=off, 1=highlight snow
  smooth: 0 | 1        // 0=raw, 1=smoothed
  src: 'radar' | 'satellite' | 'nowcast'
  opacity: number
}

const LAYER_CONFIGS: LayerConfig[] = [
  { id: 'rain',     label: 'Rain',     emoji: '🌧️', colorScheme: 2, snow: 0, smooth: 1, src: 'radar',     opacity: 0.72 },
  { id: 'snow',     label: 'Snow',     emoji: '❄️', colorScheme: 2, snow: 1, smooth: 1, src: 'radar',     opacity: 0.72 },
  { id: 'type',     label: 'Type',     emoji: '🌈', colorScheme: 5, snow: 1, smooth: 1, src: 'radar',     opacity: 0.72 },
  { id: 'infrared', label: 'Cloud IR', emoji: '🛰️', colorScheme: 0, snow: 0, smooth: 0, src: 'satellite', opacity: 0.65 },
  { id: 'forecast', label: 'Forecast', emoji: '📡', colorScheme: 2, snow: 0, smooth: 1, src: 'nowcast',   opacity: 0.72 },
]

function buildTileUrl(frame: RadarFrame, cfg: LayerConfig): string {
  return `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/${cfg.colorScheme}/${cfg.smooth}_${cfg.snow}.png`
}

function getFramesForLayer(data: any, layer: LayerType): RadarFrame[] {
  if (!data) return []
  if (layer === 'infrared') return (data.satellite?.infrared ?? []).slice(-12)
  if (layer === 'forecast') return (data.radar?.nowcast ?? []).slice(0, 6)
  return (data.radar?.past ?? []).slice(-12)
}

export default function RadarPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const preloadedRef = useRef<any[]>([])   // one tile layer per frame, preloaded
  const animTimerRef = useRef<number | null>(null)

  const { location } = useWeatherContext()
  const [frames, setFrames] = useState<RadarFrame[]>([])
  const [frameIdx, setFrameIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerType>('rain')
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fmtTime = (unix: number) =>
    new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // ── Preload all frames as tile layers ─────────────────────────────────────
  const preloadLayers = useCallback(async (newFrames: RadarFrame[], layerType: LayerType) => {
    if (!mapInstanceRef.current || newFrames.length === 0) return
    const L = (await import('leaflet')).default
    const cfg = LAYER_CONFIGS.find(c => c.id === layerType)!

    // Remove old preloaded layers
    preloadedRef.current.forEach(l => {
      try { mapInstanceRef.current?.removeLayer(l) } catch {}
    })
    preloadedRef.current = []

    // Create one TileLayer per frame, all invisible
    const layers = newFrames.map(frame =>
      L.tileLayer(buildTileUrl(frame, cfg), {
        opacity: 0,
        zIndex: 10,
        maxNativeZoom: 9,
        maxZoom: 18,
      })
    )

    // Add all to map (invisible — ready to show instantly)
    layers.forEach(l => l.addTo(mapInstanceRef.current!))
    preloadedRef.current = layers

    // Show the last (latest) frame
    const latestIdx = newFrames.length - 1
    if (layers[latestIdx]) layers[latestIdx].setOpacity(cfg.opacity)
    setFrameIdx(latestIdx)
    setFrames(newFrames)
  }, [])

  // ── Show a specific frame by index (just opacity toggle — instant) ────────
  const showFrame = useCallback((idx: number) => {
    const cfg = LAYER_CONFIGS.find(c => c.id === activeLayer)!
    preloadedRef.current.forEach((l, i) => {
      l.setOpacity(i === idx ? cfg.opacity : 0)
    })
  }, [activeLayer])

  // ── Init Leaflet map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !location || mapInstanceRef.current) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = async () => {
      const L = (await import('leaflet')).default
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(mapRef.current!, {
        center: [location.lat, location.lon],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      })
      mapInstanceRef.current = map

      // Dark basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map)

      L.control.attribution({ prefix: false, position: 'bottomleft' })
        .addAttribution('© OSM | <a href="https://rainviewer.com" target="_blank">RainViewer</a>')
        .addTo(map)

      // Location dot
      L.circleMarker([location.lat, location.lon], {
        radius: 8, color: '#c7bfff', fillColor: '#806EF8', fillOpacity: 0.95, weight: 2,
      }).addTo(map).bindPopup(`<b>${location.name}</b>`)

      L.control.zoom({ position: 'topright' }).addTo(map)

      setMapReady(true)
      setLoading(true)

      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        const data = await res.json()
        setApiData(data)
        await preloadLayers(getFramesForLayer(data, 'rain'), 'rain')
      } catch (e) {
        console.error('RainViewer fetch failed', e)
      } finally {
        setLoading(false)
      }
    }

    initMap()

    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        preloadedRef.current = []
      }
    }
  }, [location, preloadLayers])

  // ── Layer switch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiData || !mapInstanceRef.current) return
    setIsPlaying(false)
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setLoading(true)
    preloadLayers(getFramesForLayer(apiData, activeLayer), activeLayer)
      .finally(() => setLoading(false))
  }, [activeLayer, apiData, preloadLayers])

  // ── Update visible frame when frameIdx changes ────────────────────────────
  useEffect(() => {
    showFrame(frameIdx)
  }, [frameIdx, showFrame])

  // ── Playback loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return
    const tick = () => {
      setFrameIdx(prev => (prev + 1) % frames.length)
      animTimerRef.current = window.setTimeout(tick, 700)
    }
    animTimerRef.current = window.setTimeout(tick, 700)
    return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current) }
  }, [isPlaying, frames.length])

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsPlaying(false)
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    setLoading(true)
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
      const data = await res.json()
      setApiData(data)
      await preloadLayers(getFramesForLayer(data, activeLayer), activeLayer)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 backdrop-blur-xl z-20"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full active:opacity-60"
          style={{ background: 'var(--surface)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text)' }} />
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            Live Radar
          </h1>
          {location && (
            <p className="text-[11px] font-label" style={{ color: 'var(--text-muted)' }}>
              {location.name} · RainViewer
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-full active:opacity-60"
          style={{ background: 'var(--surface)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--primary)' }} />
        </button>
      </header>

      {/* Layer type selector */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide"
        style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--outline)' }}
      >
        {LAYER_CONFIGS.map(cfg => (
          <button
            key={cfg.id}
            onClick={() => setActiveLayer(cfg.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-label font-semibold transition-all active:scale-95"
            style={{
              background: activeLayer === cfg.id
                ? 'linear-gradient(135deg, #806EF8, #5896FD)'
                : 'var(--surface-mid)',
              color: activeLayer === cfg.id ? '#fff' : 'var(--text-muted)',
            }}
          >
            <span>{cfg.emoji}</span>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0">
        {!location && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enable location to see radar</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading overlay */}
        {(!mapReady || loading) && location && (
          <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'var(--bg)' }}>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {mapReady ? 'Loading layer…' : 'Initialising map…'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Playback controls */}
      {frames.length > 0 && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--nav-border)' }}
        >
          {/* Play bar */}
          <div className="flex items-center gap-3 mb-2.5">
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'linear-gradient(135deg, #806EF8, #5896FD)' }}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white" />
                : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={frameIdx}
              onChange={e => { setIsPlaying(false); setFrameIdx(Number(e.target.value)) }}
              className="flex-1 h-1 rounded-full appearance-none"
              style={{ accentColor: '#806EF8' }}
            />

            <span
              className="flex-shrink-0 text-[11px] font-label font-bold tabular-nums w-14 text-right"
              style={{ color: 'var(--primary)' }}
            >
              {frames[frameIdx] ? fmtTime(frames[frameIdx].time) : '--:--'}
            </span>
          </div>

          {/* Frame dots */}
          <div className="flex items-center justify-center gap-1">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIsPlaying(false); setFrameIdx(i) }}
                style={{
                  width: i === frameIdx ? '14px' : '5px',
                  height: '5px',
                  borderRadius: '3px',
                  background: i === frameIdx ? '#806EF8' : 'rgba(199,191,255,0.3)',
                  transition: 'width 0.2s',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <BottomNav inline />
    </div>
  )
}
