'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, ArrowRight } from 'lucide-react'

interface RadarFrame { time: number; path: string }

function buildTileUrl(frame: RadarFrame): string {
  return `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/2/1_0.png`
}

interface Props {
  lat: number
  lon: number
  locationName: string
}

export function RadarPreview({ lat, lon, locationName }: Props) {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const timerRef = useRef<number | null>(null)

  const [frames, setFrames] = useState<RadarFrame[]>([])
  const [frameIdx, setFrameIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ready, setReady] = useState(false)

  const fmtTime = (unix: number) =>
    new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const showFrame = useCallback((idx: number) => {
    layersRef.current.forEach((l, i) => l.setOpacity(i === idx ? 0.72 : 0))
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const init = async () => {
      const L = (await import('leaflet')).default
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(mapRef.current!, {
        center: [lat, lon],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        // All interaction disabled — preview only
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map)

      L.circleMarker([lat, lon], {
        radius: 6, color: '#c7bfff', fillColor: '#806EF8', fillOpacity: 0.95, weight: 2,
      }).addTo(map)

      // Let the DOM settle before measuring the container so tiles render correctly
      setTimeout(() => map.invalidateSize(), 200)

      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        const data = await res.json()
        const rawFrames: RadarFrame[] = (data.radar?.past ?? []).slice(-8)

        const layers = rawFrames.map(f =>
          L.tileLayer(buildTileUrl(f), { opacity: 0, zIndex: 10, maxNativeZoom: 9, maxZoom: 18 })
        )
        layers.forEach(l => l.addTo(map))
        layersRef.current = layers

        const latest = rawFrames.length - 1
        if (layers[latest]) layers[latest].setOpacity(0.72)
        setFrames(rawFrames)
        setFrameIdx(latest)
        setReady(true)
      } catch (e) {
        console.error('RadarPreview: RainViewer fetch failed', e)
      }
    }

    init()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        layersRef.current = []
      }
    }
  }, [lat, lon])

  useEffect(() => { if (ready) showFrame(frameIdx) }, [frameIdx, ready, showFrame])

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return
    const tick = () => {
      setFrameIdx(prev => (prev + 1) % frames.length)
      timerRef.current = window.setTimeout(tick, 700)
    }
    timerRef.current = window.setTimeout(tick, 700)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isPlaying, frames.length])

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(v => !v)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)', minHeight: 176 }}
    >
      {/* Leaflet map — no pointer-events override; Leaflet needs the div intact */}
      <div ref={mapRef} style={{ width: '100%', height: 176 }} />

      {/*
        Transparent full-cover overlay for navigation.
        Sits above the map (z-10) so clicks navigate, but below the
        play button and bars (z-20) so those still work independently.
        Leaflet stops its own event propagation internally, so we need
        this overlay rather than relying on bubbling from the map div.
      */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={() => router.push('/radar')}
        aria-label="Open live radar"
        role="button"
      />

      {/* Top bar — title + open icon */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
      >
        <div>
          <p className="text-xs font-bold font-headline text-white">Live Radar</p>
          <p className="text-[10px] font-label opacity-70 text-white">{locationName} · RainViewer</p>
        </div>
        <ArrowRight className="w-4 h-4 text-white opacity-70" aria-hidden="true" />
      </div>

      {/* Centred play / pause button — z-20 so clicks reach it, not the nav overlay */}
      <button
        onClick={togglePlay}
        className="absolute z-20 flex items-center justify-center transition-all duration-200 active:scale-90"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isPlaying ? 34 : 50,
          height: isPlaying ? 34 : 50,
          borderRadius: '50%',
          background: isPlaying ? 'rgba(0,0,0,0.35)' : 'rgba(128,110,248,0.9)',
          border: '1.5px solid rgba(199,191,255,0.55)',
          backdropFilter: 'blur(6px)',
        }}
        aria-label={isPlaying ? 'Pause' : 'Play radar animation'}
      >
        {isPlaying
          ? <Pause className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          : <Play className="w-4 h-4 text-white" style={{ marginLeft: 2 }} aria-hidden="true" />
        }
      </button>

      {/* Bottom bar — timestamp + scrubber dots */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
      >
        <p className="text-[10px] font-label text-white opacity-70">
          {ready && frames[frameIdx] ? fmtTime(frames[frameIdx].time) : 'Loading…'}
        </p>

        {ready && frames.length > 0 && (
          <div className="flex items-center gap-1">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIsPlaying(false); setFrameIdx(i) }}
                className="rounded-full transition-all duration-150"
                style={{
                  width: i === frameIdx ? 14 : 5,
                  height: 5,
                  background: i === frameIdx ? '#c7bfff' : 'rgba(255,255,255,0.4)',
                }}
                aria-label={`Frame ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
