"use client"

import { useEffect, useRef } from "react"
import { RARITY } from "@/lib/data"
import { fx } from "@/lib/fx"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  w: number
  h: number
  rot: number
  vr: number
  round: boolean
}

/** Screen-wide celebration layer: confetti canvas + full-screen color flash. */
export function FxLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let parts: Particle[] = []
    let raf = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener("resize", resize)

    const loop = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      parts = parts.filter((p) => p.life < p.max)
      for (const p of parts) {
        p.life += 1
        p.vy += 0.16
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max)
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.round) {
          ctx.beginPath()
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Scale Y by cos(rot) so ribbons look like they tumble.
          ctx.fillRect(-p.w / 2, (-p.h / 2) * Math.cos(p.rot * 2), p.w, p.h * Math.cos(p.rot * 2))
        }
        ctx.restore()
      }
      ctx.globalAlpha = 1
      raf = parts.length ? requestAnimationFrame(loop) : 0
    }

    const burst = (palette: keyof typeof RARITY | "phosphor", power: number) => {
      const colors =
        palette === "phosphor"
          ? ["#a4d007", "#75b022", "#66c0f4", "#ffffff"]
          : [RARITY[palette].hex, RARITY[palette].hex, "#ffffff", "#66c0f4"]
      const W = window.innerWidth
      const H = window.innerHeight
      for (let i = 0; i < power; i++) {
        const shower = i % 3 === 0
        const left = i % 2 === 0
        parts.push({
          x: shower ? Math.random() * W : left ? -10 : W + 10,
          y: shower ? -20 : H * 0.85,
          vx: shower ? (Math.random() - 0.5) * 2 : (left ? 1 : -1) * (4 + Math.random() * 9),
          vy: shower ? Math.random() * 2 : -(9 + Math.random() * 10),
          life: 0,
          max: 100 + Math.random() * 80,
          color: colors[i % colors.length],
          w: 6 + Math.random() * 6,
          h: 10 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.25,
          round: i % 5 === 0,
        })
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const flash = (color: string, strength: number, ms: number) => {
      const el = flashRef.current
      if (!el) return
      el.style.background = `radial-gradient(circle at 50% 45%, ${color}, transparent 70%)`
      el.animate([{ opacity: strength }, { opacity: 0 }], {
        duration: ms,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      })
    }

    const off = fx.on((e) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (e.kind === "burst") {
        if (!reduce) burst(e.palette, e.power)
      } else {
        flash(e.color, reduce ? Math.min(e.strength, 0.2) : e.strength, reduce ? 200 : e.ms)
      }
    })

    return () => {
      off()
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <>
      <div ref={flashRef} aria-hidden className="pointer-events-none fixed inset-0 z-[70] opacity-0" />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />
    </>
  )
}
