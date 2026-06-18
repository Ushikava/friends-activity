import { useEffect, useRef } from 'react'
import './ParticleBurst.css'

interface Particle {
  el: HTMLSpanElement
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  rotV: number
}

interface Props {
  emojis: string[]
  count?: number
  onDone: () => void
}

const GRAVITY = 0.42
const FADE_AFTER_MS = 1400
const TOTAL_MS = 2400

export default function ParticleBurst({ emojis, count = 30, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const t0 = performance.now()

    const particles: Particle[] = Array.from({ length: count }, () => {
      const el = document.createElement('span')
      el.className = 'pburst__item'
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      el.style.fontSize = `${18 + Math.floor(Math.random() * 18)}px`
      container.appendChild(el)

      return {
        el,
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 22,       // sideways: -11 to +11 px/frame
        vy: -(10 + Math.random() * 14),        // always upward: -10 to -24 px/frame
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 18,
      }
    })

    let raf: number

    function tick(now: number) {
      const elapsed = now - t0

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += GRAVITY
        p.rot += p.rotV

        const opacity =
          elapsed < FADE_AFTER_MS
            ? 1
            : Math.max(0, 1 - (elapsed - FADE_AFTER_MS) / (TOTAL_MS - FADE_AFTER_MS))

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${p.rot}deg)`
        p.el.style.opacity = opacity.toFixed(2)
      }

      if (elapsed < TOTAL_MS) {
        raf = requestAnimationFrame(tick)
      } else {
        onDone()
      }
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      for (const p of particles) p.el.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="pburst" aria-hidden="true" />
}
