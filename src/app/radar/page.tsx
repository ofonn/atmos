'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { BottomNav } from '@/components/layout/BottomNav'
import { ArrowLeft, Play, Pause, RefreshCw, Cloud, CloudRain, Satellite } from 'lucide-react'

interface RadarFrame {
  time: number
  path: string
}

type LayerType = 'radar' | 'satellite' | 'coverage'

const LAYER_OPTIONS: { id: LayerType; label: string; icon: typeof CloudRain }[] = [
  { id: 'radar', label: 'Rain', icon: CloudRain },
  { id: 'satellite', label: 'Cloud IR', icon: Cloud },
  { id: 'coverage', label: 'Coverage', icon: Satellite },
]

export default function RadarPage() {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const radarLayerRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)
  const weatherDataRef = useRef<any>(null)

  const { location } = useWeatherContext()
  const [frames, setFrames] = useState<RadarFrame[]>([])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerType>('radar')

  const fmtTime = (unix: number) => {
    const d = new Date(unix * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Fetch RainViewer data
  const fetchWeatherData = useCallback(async () => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
      const data = await res.json()
      weatherDataRef.current = data
      return data
    } catch (e) {
      console.error('RainViewer fetch failed', e)
      return null
    }
  }, [])

  // Get frames for the active layer type
  const getFramesForLayer = useCallback((data: any, layer: LayerType): RadarFrame[] => {
    if (!data) return []
    if (layer === 'radar') {
      return (data.radar?.past || []).slice(-12)
    }
    if (layer === 'satellite') {
      // Satellite infrared data
      return (data.satellite?.infrared || []).slice(-12)
    }
    if (layer === 'coverage') {
      // Radar coverage uses same radar frames but with coverage tile scheme
      return (data.radar?.past || []).slice(-12)
    }
    return []
  }, [])

  // Build tile URL for a given frame
  const getTileUrl = useCallback((frame: RadarFrame, layer: LayerType): string => {
    if (layer === 'radar') {
      // color=4 (universal blue scheme), smooth=1, snow=1
      return `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/4/1_1.png`
    }
    if (layer === 'satellite') {
      // Infrared satellite — color scheme 0 (original)
      return `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/0/0_0.png`
    }
    if (layer === 'coverage') {
      // Radar coverage layer
      return `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/1/1_1.png`
    }
    return ''
  }, [])

  // Initialise Leaflet map
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

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 18, subdomains: 'abcd' }
      ).addTo(map)

      L.control.attribution({ prefix: false, position: 'bottomleft' })
        .addAttribution('© <a href="https://www.openstreetmap.org">OSM</a> | <a href="https://rainviewer.com">RainViewer</a>')
        .addTo(map)

      L.circleMarker([location.lat, location.lon], {
        radius: 7,
        color: '#c7bfff',
        fillColor: '#806EF8',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map).bindPopup(`<b>${location.name}</b>`)

      L.control.zoom({ position: 'topright' }).addTo(map)

      setMapReady(true)

      // Fetch and show initial frames
      const data = await fetchWeatherData()
      if (data) {
        const initialFrames = getFramesForLayer(data, 'radar')
        setFrames(initialFrames)
        if (initialFrames.length > 0) {
          setCurrentFrame(initialFrames.length - 1)
          const latest = initialFrames[initialFrames.length - 1]
          const layer = L.tileLayer(
            getTileUrl(latest, 'radar'),
            { opacity: 0.7, zIndex: 10, maxNativeZoom: 9, maxZoom: 18 }
          )
          layer.addTo(map)
          radarLayerRef.current = layer
        }
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
  }, [location, fetchWeatherData, getFramesForLayer, getTileUrl])

  // Switch layer type
  useEffect(() => {
    if (!weatherDataRef.current || !mapInstanceRef.current) return
    const newFrames = getFramesForLayer(weatherDataRef.current, activeLayer)
    setFrames(newFrames)
    setIsPlaying(false)
    if (newFrames.length > 0) {
      setCurrentFrame(newFrames.length - 1)
    }
  }, [activeLayer, getFramesForLayer])

  // Switch radar frame when currentFrame changes
  useEffect(() => {
    if (!mapInstanceRef.current || frames.length === 0) return
    const frame = frames[currentFrame]
    if (!frame) return

    const showFrame = async () => {
      const L = (await import('leaflet')).default
      if (radarLayerRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current)
      }
      const layer = L.tileLayer(
        getTileUrl(frame, activeLayer),
        { opacity: 0.7, zIndex: 10, maxNativeZoom: 9, maxZoom: 18 }
      )
      layer.addTo(mapInstanceRef.current)
      radarLayerRef.current = layer
    }
    showFrame()
  }, [currentFrame, frames, activeLayer, getTileUrl])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return
    const advance = () => {
      setCurrentFrame(prev => (prev + 1) % frames.length)
      animFrameRef.current = window.setTimeout(advance, 700)
    }
    animFrameRef.current = window.setTimeout(advance, 700)
    return () => { if (animFrameRef.current) clearTimeout(animFrameRef.current) }
  }, [isPlaying, frames])

  const handlePlayPause = () => setIsPlaying(p => !p)

  const goToLatest = async () => {
    setIsPlaying(false)
    const data = await fetchWeatherData()
    if (data) {
      const newFrames = getFramesForLayer(data, activeLayer)
      setFrames(newFrames)
      setCurrentFrame(newFrames.length - 1)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="relative z-20 flex-shrink-0 flex items-center gap-3 px-4 py-3 backdrop-blur-xl"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
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
              {location.name} · RainViewer
            </p>
          )}
        </div>
        <button
          onClick={goToLatest}
          className="p-2 rounded-full transition-opacity active:opacity-60"
          style={{ background: 'var(--surface)' }}
          aria-label="Refresh data"
        >
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </button>
      </header>

      {/* Layer selector */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2"
        style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--outline)' }}
      >
        {LAYER_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveLayer(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-label font-semibold transition-all active:scale-95"
            style={{
              background: activeLayer === id
                ? 'linear-gradient(135deg, #806EF8, #5896FD)'
                : 'var(--surface-mid)',
              color: activeLayer === id ? '#fff' : 'var(--text-muted)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

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

        {!mapReady && location && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] z-20">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>Loading radar…</p>
            </div>
          </div>
        )}
      </div>

      {/* Radar controls */}
      {frames.length > 0 && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--nav-border)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handlePlayPause}
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-opacity active:opacity-60"
              style={{ background: 'linear-gradient(135deg, #806EF8, #5896FD)' }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white" />
                : <Play className="w-4 h-4 text-white ml-0.5" />}
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

          {/* Frame indicator dots */}
          <div className="flex items-center gap-1 justify-center">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIsPlaying(false); setCurrentFrame(i) }}
                className="rounded-full transition-all"
                style={{
                  width: i === currentFrame ? '16px' : '5px',
                  height: '5px',
                  background: i === currentFrame ? '#806EF8' : 'rgba(199,191,255,0.3)',
                }}
                aria-label={`Frame ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <BottomNav inline />
    </div>
  )
}
