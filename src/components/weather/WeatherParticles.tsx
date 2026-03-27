'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  speedX: number
  speedY: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

type WeatherEffect = 'rain' | 'snow' | 'stars' | 'none'

interface WeatherParticlesProps {
  effect: WeatherEffect
  intensity?: number // 0-1
}

function getEffect(wmoCode: number, isDay: boolean): WeatherEffect {
  if (wmoCode >= 95) return 'rain'
  if ((wmoCode >= 71 && wmoCode <= 77) || (wmoCode >= 85 && wmoCode <= 86)) return 'snow'
  if ((wmoCode >= 51 && wmoCode <= 82)) return 'rain'
  if ((wmoCode === 0 || wmoCode === 1) && !isDay) return 'stars'
  return 'none'
}

export { getEffect }

export function WeatherParticles({ effect, intensity = 0.7 }: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    if (effect === 'none') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const count = Math.floor(effect === 'stars' ? 60 : effect === 'rain' ? 80 : 50) * intensity
    const particles: Particle[] = []

    const makeParticle = (): Particle => {
      const w = canvas.width
      const h = canvas.height
      if (effect === 'rain') {
        return {
          x: Math.random() * w,
          y: Math.random() * h - h,
          speedX: -1 + Math.random() * 0.5,
          speedY: 8 + Math.random() * 6,
          size: 0.5 + Math.random() * 1,
          opacity: 0.2 + Math.random() * 0.4,
          life: 1,
          maxLife: 1,
        }
      } else if (effect === 'snow') {
        return {
          x: Math.random() * w,
          y: Math.random() * h - h,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: 0.5 + Math.random() * 1.5,
          size: 1.5 + Math.random() * 3,
          opacity: 0.3 + Math.random() * 0.5,
          life: 1,
          maxLife: 1,
        }
      } else {
        // Stars — stationary twinkling
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          speedX: 0,
          speedY: 0,
          size: 0.5 + Math.random() * 1.5,
          opacity: 0,
          life: Math.random(),
          maxLife: 0.5 + Math.random() * 2,
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const p = makeParticle()
      if (effect !== 'stars') p.y = Math.random() * canvas.height // spread initial positions
      particles.push(p)
    }
    particlesRef.current = particles

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const w = canvas.width
      const h = canvas.height

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (effect === 'rain') {
          p.x += p.speedX
          p.y += p.speedY
          if (p.y > h) {
            Object.assign(p, makeParticle())
            p.y = -10
          }
          ctx.strokeStyle = `rgba(180,200,255,${p.opacity})`
          ctx.lineWidth = p.size
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 0.6)
          ctx.stroke()
        } else if (effect === 'snow') {
          p.x += p.speedX + Math.sin(p.y * 0.01) * 0.3
          p.y += p.speedY
          if (p.y > h) {
            Object.assign(p, makeParticle())
            p.y = -10
          }
          ctx.fillStyle = `rgba(220,235,255,${p.opacity})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Stars — twinkle
          p.life += 0.01
          if (p.life > p.maxLife) p.life = 0
          const t = p.life / p.maxLife
          p.opacity = Math.sin(t * Math.PI) * 0.7
          ctx.fillStyle = `rgba(255,255,220,${p.opacity})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [effect, intensity])

  if (effect === 'none') return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )
}
