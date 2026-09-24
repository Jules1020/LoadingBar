"use client"

import { useEffect, useRef } from "react"
import { RARITY } from "@/lib/data"
import { fmtShort } from "@/lib/format"
import { BASE_GBPS } from "@/lib/progress"
import { runtime, usePayouts, type Payout } from "@/lib/session"

const SLOTS = 12
const STEP = 360 / SLOTS
const C = 200 // viewBox size; the wheel's center sits on a corner of it
const R_RIM = 190
const R_LABEL = 132
const TICKS = 72
// Rounded so server and browser render identical coordinates.
const round = (n: number) => Math.round(n * 1000) / 1000

type Mode = "smooth" | "ratchet"

/**
 * A payout wheel hugging a screen corner — only a quarter shows.
 * smooth: turns continuously, speed tied to the live GB/s.
 * ratchet: clicks one notch per payout with a springy settle.
 * Labels always stay upright; the slot under the pointer is highlighted.
 */
export function SpinDial({
  corner,
  mode,
  parity,
  live = true,
  className = "",
}: {
  corner: "tr" | "bl"
  mode: Mode
  /** Takes every other payout so two dials split the feed. */
  parity: 0 | 1
  live?: boolean
  className?: string
}) {
  const tr = corner === "tr"
  const cx = tr ? C : 0
  const cy = tr ? 0 : C
  // Pointer points into the visible quarter.
  const pointer = tr ? 135 : -45
  // smooth turns clockwise (+), ratchet counter-clockwise (−).
  const dir = mode === "smooth" ? 1 : -1
  // Where a slot slips out of view and can be rewritten unseen.
  const entry = tr ? 60 : 30

  const ticksRef = useRef<SVGGElement>(null)
  const labelRefs = useRef<(SVGTextElement | null)[]>([])
  const angle = useRef(0)
  const target = useRef(0)
  const vel = useRef(0)
  const queue = useRef<Payout[]>([])
  const prevA = useRef<number[]>(Array(SLOTS).fill(0))
  const speed = useRef(1)

  const write = (i: number, p: Payout | undefined) => {
    const el = labelRefs.current[i]
    if (!el) return
    if (!p) {
      el.textContent = "·"
      el.setAttribute("fill", "currentColor")
      return
    }
    el.textContent = `+$${fmtShort(p.amount)}`
    el.setAttribute("fill", RARITY[p.rarity].hex)
  }

  usePayouts((p) => {
    if (p.id % 2 !== parity) return
    if (mode === "ratchet") {
      // The slot one notch "behind" the pointer is the one that lands under it.
      const a = angle.current
      let best = 0
      let bestD = 999
      for (let i = 0; i < SLOTS; i++) {
        const d = Math.abs((((a + i * STEP - (pointer - dir * STEP)) % 360) + 540) % 360 - 180)
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      write(best, p)
      target.current += dir * STEP
    } else {
      queue.current.push(p)
      if (queue.current.length > 6) queue.current.shift()
    }
  }, live)

  // Static previews get sample payouts so the wheel doesn't look empty.
  useEffect(() => {
    if (live) return
    const samples: Payout["rarity"][] = ["common", "rare", "epic", "common", "legendary", "rare"]
    for (let i = 0; i < SLOTS; i++) {
      const rarity = samples[i % samples.length]
      write(i, { id: i, name: "", rarity, amount: [6, 52, 180, 7, 1000, 45][i % 6] * (2 + (i % 3)) })
    }
  }, [live])

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      if (mode === "smooth") {
        const want = live ? Math.max(0.15, runtime.frame.gbps / BASE_GBPS) : 0.6
        speed.current += (want - speed.current) * Math.min(1, dt * 2.5)
        if (!reduce) angle.current += 16 * speed.current * dt
      } else {
        // Critically-damped-ish spring toward the next notch.
        const k = 140
        const c = 17
        const a = (target.current - angle.current) * k - vel.current * c
        vel.current += a * dt
        angle.current = reduce ? target.current : angle.current + vel.current * dt
      }

      ticksRef.current?.setAttribute("transform", `rotate(${angle.current} ${cx} ${cy})`)

      for (let i = 0; i < SLOTS; i++) {
        const a = angle.current + i * STEP
        const norm = ((a % 360) + 360) % 360
        if (mode === "smooth" && live) {
          const prev = prevA.current[i]
          if (prev < entry && norm >= entry && norm - prev < 90) write(i, queue.current.shift())
        }
        prevA.current[i] = norm
        const rad = (a * Math.PI) / 180
        const el = labelRefs.current[i]
        if (!el) continue
        el.setAttribute("x", (cx + R_LABEL * Math.cos(rad)).toFixed(2))
        el.setAttribute("y", (cy + R_LABEL * Math.sin(rad)).toFixed(2))
        const off = Math.abs((((norm - pointer) % 360) + 540) % 360 - 180)
        const focus = Math.max(0, 1 - off / (STEP * 0.9))
        el.setAttribute("opacity", (0.5 + focus * 0.5).toFixed(2))
        el.setAttribute("font-size", (13 + focus * 5).toFixed(1))
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [mode, live, cx, cy, pointer, entry])

  const at = (deg: number, r: number) =>
    `${round(cx + r * Math.cos((deg * Math.PI) / 180))} ${round(cy + r * Math.sin((deg * Math.PI) / 180))}`

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute aspect-square ${tr ? "top-0 right-0" : "bottom-0 left-0"} ${className}`}
    >
      <svg viewBox={`0 0 ${C} ${C}`} className="h-full w-full overflow-hidden text-faint" shapeRendering="geometricPrecision">
        <defs>
          <radialGradient id={`dial-${corner}`} cx={cx} cy={cy} r={R_RIM} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-panel-3)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--color-panel)" stopOpacity="0.75" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R_RIM} fill={`url(#dial-${corner})`} stroke="var(--color-line-2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle cx={cx} cy={cy} r={R_RIM - 26} fill="none" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle cx={cx} cy={cy} r={88} fill="none" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <g ref={ticksRef}>
          {Array.from({ length: TICKS }, (_, i) => {
            const a = (i * 360) / TICKS
            const major = i % (TICKS / SLOTS) === 0
            const r0 = major ? R_RIM - 18 : R_RIM - 10
            const rad = (a * Math.PI) / 180
            return (
              <line
                key={i}
                x1={round(cx + r0 * Math.cos(rad))}
                y1={round(cy + r0 * Math.sin(rad))}
                x2={round(cx + (R_RIM - 4) * Math.cos(rad))}
                y2={round(cy + (R_RIM - 4) * Math.sin(rad))}
                stroke={major ? "var(--color-accent)" : "var(--color-fg)"}
                strokeOpacity={major ? 0.7 : 0.18}
                strokeWidth={major ? 1.5 : 1}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </g>
        <path
          d={`M${at(pointer, R_RIM + 2)} L${at(pointer - 3.5, R_RIM - 22)} L${at(pointer + 3.5, R_RIM - 22)} Z`}
          fill="var(--color-accent)"
        />
        {Array.from({ length: SLOTS }, (_, i) => (
          <text
            key={i}
            ref={(el) => {
              labelRefs.current[i] = el
            }}
            textAnchor="middle"
            dominantBaseline="central"
            fontWeight="600"
            fontSize="13"
            style={{ fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-sans)" }}
            fill="currentColor"
          >
            ·
          </text>
        ))}
      </svg>
    </div>
  )
}
