"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { BAR_STYLES } from "@/lib/cosmetics"
import { fmtShort } from "@/lib/format"
import { BASE_GBPS } from "@/lib/progress"
import { fmtPct, type Frame } from "@/lib/session"
import { petRate, useStore } from "@/lib/store"
import { music, useMusic } from "@/lib/music"
import { PetAvatar } from "../PetAvatar"
import { SkinBar } from "../SkinBar"
import { Ctrl, Line, Pct, useScreenFrame, type ScreenProps } from "./parts"

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Sets the whole/decimal refs of a <Pct>. */
function setPct(f: Frame, whole: React.RefObject<HTMLSpanElement | null>, dec: React.RefObject<HTMLSpanElement | null>) {
  const p = fmtPct(f.p)
  if (whole.current) whole.current.textContent = p.whole
  if (dec.current) dec.current.textContent = p.dec
}
const setText = (el: HTMLElement | null, text: string) => {
  if (el && el.textContent !== text) el.textContent = text
}

/** Live screens only: drop an image anywhere to make it the current track's cover. */
function useCoverDrop(preview: boolean, trackId: string) {
  const [over, setOver] = useState(false)
  const handlers = preview
    ? {}
    : {
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault()
          setOver(true)
        },
        onDragLeave: () => setOver(false),
        onDrop: (e: React.DragEvent) => {
          e.preventDefault()
          setOver(false)
          const img = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"))
          if (img) void music.setCover(trackId, img)
        },
      }
  const overlay = over ? (
    <div className="pointer-events-none absolute inset-4 z-20 grid place-items-center rounded-lg border-2 border-dashed border-accent bg-bg/60 text-[3cqh] font-semibold">
      Drop to set the cover
    </div>
  ) : null
  return { handlers, overlay }
}

function MusicControls({ preview, size = 7 }: { preview: boolean; size?: number }) {
  const { playing } = useMusic()
  const ctrl = "grid cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
  return (
    <div className="flex items-center gap-[1.5cqh]">
      <Ctrl preview={preview} onClick={music.prev} label="Previous track" className={ctrl} >
        <SkipBack style={{ width: `${size * 0.43}cqh`, height: `${size * 0.43}cqh` }} />
      </Ctrl>
      <Ctrl preview={preview} onClick={music.toggle} label={playing ? "Pause" : "Play"} className="btn-play grid cursor-pointer place-items-center rounded-full">
        <span className="grid place-items-center" style={{ width: `${size * 1.3}cqh`, height: `${size * 1.3}cqh` }}>
          {playing ? <Pause className="fill-current" style={{ width: `${size * 0.5}cqh`, height: `${size * 0.5}cqh` }} /> : <Play className="ml-[0.4cqh] fill-current" style={{ width: `${size * 0.5}cqh`, height: `${size * 0.5}cqh` }} />}
        </span>
      </Ctrl>
      <Ctrl preview={preview} onClick={music.next} label="Next track" className={ctrl}>
        <SkipForward style={{ width: `${size * 0.43}cqh`, height: `${size * 0.43}cqh` }} />
      </Ctrl>
    </div>
  )
}

/** rAF loop for decorative motion; runs once for thumbnails or with reduced motion. */
function useLoop(preview: boolean, step: (dt: number) => void) {
  const ref = useRef(step)
  ref.current = step
  useEffect(() => {
    if (preview || reduceMotion()) {
      ref.current(0)
      return
    }
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ref.current(dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [preview])
}

// ---------- Download: a store-style download page with a bandwidth graph ----------
const SAMPLES = 90
const fmtBytes = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(1)} GB`)

export function Download({ skin, line, preview, task }: ScreenProps) {
  const duration = useStore((s) => s.duration)
  const rate = useStore((s) => s.pets.reduce((n, p) => n + petRate(p), 0))
  const area = useRef<SVGPathElement>(null)
  const stroke = useRef<SVGPathElement>(null)
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const cur = useRef<HTMLSpanElement>(null)
  const peak = useRef<HTMLSpanElement>(null)
  const done = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)
  const hist = useRef<number[]>([])
  const lastSample = useRef(0)
  const peakV = useRef(0)
  const color = (BAR_STYLES[skin] ?? BAR_STYLES["bar-classic"]).color
  const total = duration * 60 * BASE_GBPS

  const draw = () => {
    const h = hist.current
    if (!h.length) return
    const max = Math.max(BASE_GBPS * 2.4, ...h)
    const pts = h.map((v, i) => `${((SAMPLES - h.length + i) / (SAMPLES - 1)) * 200},${60 - (v / max) * 54}`)
    const d = `M${pts.join(" L")}`
    stroke.current?.setAttribute("d", d)
    area.current?.setAttribute("d", `${d} L200,60 L${((SAMPLES - h.length) / (SAMPLES - 1)) * 200},60 Z`)
  }

  useScreenFrame(preview, (f) => {
    setPct(f, whole, dec)
    setText(cur.current, f.gbps.toFixed(1))
    setText(earned.current, fmtShort(f.earned))
    setText(done.current, `${fmtBytes(f.p * total)} of ${fmtBytes(total)}`)
    if (preview) {
      // A believable made-up history for the thumbnail.
      hist.current = Array.from({ length: SAMPLES }, (_, i) => BASE_GBPS * (1 + 0.45 * Math.sin(i / 6) + 0.25 * Math.sin(i / 2.3)))
      peakV.current = Math.max(...hist.current)
    } else {
      const now = performance.now()
      if (now - lastSample.current > 250) {
        lastSample.current = now
        hist.current = [...hist.current.slice(-(SAMPLES - 1)), f.gbps]
        peakV.current = Math.max(peakV.current, f.gbps)
      }
    }
    setText(peak.current, peakV.current.toFixed(1))
    draw()
  })

  return (
    <div className="cq-size flex h-full w-full flex-col gap-[3cqh] px-[5cqw] py-[6cqh]">
      <div className="flex items-end justify-between gap-[3cqw]">
        <div className="min-w-0">
          <p className="text-[2.2cqh] font-semibold tracking-[0.25em] text-accent uppercase">Downloading</p>
          <p className="display mt-[0.6cqh] truncate text-[6cqh] leading-tight font-semibold tracking-tight">{task || "Focus session"}</p>
          <p className="text-[2.4cqh] text-muted">
            {duration} min · <span ref={done}>0 GB</span>
          </p>
        </div>
        <Pct whole={whole} dec={dec} className="shrink-0 text-[13cqh] leading-none font-semibold tracking-tight" decClass="text-[5cqh] text-muted" />
      </div>

      <div className="panel relative min-h-0 flex-1 overflow-hidden">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {[15, 30, 45].map((y) => (
            <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="var(--color-line)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
          ))}
          <defs>
            <linearGradient id="dl-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.45" />
              <stop offset="1" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path ref={area} fill="url(#dl-fill)" />
          <path ref={stroke} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        <div className="absolute top-[2cqh] left-[2cqh] flex gap-[4cqh] text-[2cqh] tracking-[0.15em] text-muted uppercase">
          <p>
            Current <span className="block text-[4.4cqh] font-semibold tracking-normal text-fg tabular-nums normal-case">
              <span ref={cur}>0.0</span> GB/s
            </span>
          </p>
          <p>
            Peak <span className="block text-[4.4cqh] font-semibold tracking-normal text-fg tabular-nums normal-case">
              <span ref={peak}>0.0</span> GB/s
            </span>
          </p>
          <p>
            Pets earned <span className="block text-[4.4cqh] font-semibold tracking-normal text-go-2 tabular-nums normal-case">
              $<span ref={earned}>0</span>
            </span>
          </p>
        </div>
      </div>

      <SkinBar skin={skin} preview={preview?.p} className="h-[3.2cqh] shrink-0" />
      <div className="flex shrink-0 items-center justify-between text-[2.4cqh] text-muted">
        <span>Up next: <span className="text-fg">wheel spin</span> · pets at ${fmtShort(rate)}/s</span>
        <Line text={line} className="text-[2.4cqh]" />
      </div>
    </div>
  )
}

// ---------- Cassette: tape winds from one reel to the other ----------
const R_MIN = 9.5
const R_MAX = 21

export function Cassette({ skin, line, preview, task }: ScreenProps) {
  const { tracks, index } = useMusic()
  const track = tracks[index] ?? tracks[0]
  const duration = useStore((s) => s.duration)
  const leftPack = useRef<SVGCircleElement>(null)
  const rightPack = useRef<SVGCircleElement>(null)
  const leftHub = useRef<SVGGElement>(null)
  const rightHub = useRef<SVGGElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)
  const state = useRef({ p: preview?.p ?? 0, gbps: preview?.gbps ?? 0, a: 0, b: 0 })
  const accent = (BAR_STYLES[skin] ?? BAR_STYLES["bar-classic"]).color

  useScreenFrame(preview, (f) => {
    state.current.p = f.p
    state.current.gbps = f.gbps
    setText(counter.current, String(Math.floor(f.p * 999)).padStart(3, "0"))
    setText(gb.current, f.gbps.toFixed(1))
    setText(earned.current, fmtShort(f.earned))
  })

  useLoop(!!preview, (dt) => {
    const st = state.current
    // Tape moves at a constant linear speed, so the emptier reel spins faster.
    const rl = R_MIN + (R_MAX - R_MIN) * (1 - st.p)
    const rr = R_MIN + (R_MAX - R_MIN) * st.p
    const v = 60 + st.gbps * 6
    st.a = (st.a + (v / rl) * dt * 57) % 360
    st.b = (st.b + (v / rr) * dt * 57) % 360
    leftPack.current?.setAttribute("r", rl.toFixed(2))
    rightPack.current?.setAttribute("r", rr.toFixed(2))
    leftHub.current?.setAttribute("transform", `rotate(${st.a.toFixed(1)} 118 92)`)
    rightHub.current?.setAttribute("transform", `rotate(${st.b.toFixed(1)} 202 92)`)
  })

  const hub = (ref: React.RefObject<SVGGElement | null>, cx: number) => (
    <g ref={ref}>
      <circle cx={cx} cy={92} r={8} fill="#f4f1ea" />
      <circle cx={cx} cy={92} r={3.2} fill="#15161a" />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={cx - 1} y={92 - 7.5} width={2} height={3} fill="#15161a" transform={`rotate(${i * 60} ${cx} 92)`} />
      ))}
    </g>
  )

  return (
    <div className="cq-size flex h-full w-full flex-col items-center justify-center gap-[3cqh]">
      <svg viewBox="0 0 320 200" className="h-[62cqh] drop-shadow-[0_2cqh_4cqh_rgb(0_0_0/0.6)]" aria-hidden>
        <defs>
          <clipPath id="cs-window">
            <rect x="86" y="70" width="148" height="44" rx="8" />
          </clipPath>
          <linearGradient id="cs-shell" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a3d46" />
            <stop offset="1" stopColor="#22242a" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="316" height="196" rx="14" fill="url(#cs-shell)" stroke="#50535d" />
        {[14, 306].map((x) => [14, 186].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill="#15161a" stroke="#5c5f69" />))}
        {/* label */}
        <rect x="18" y="14" width="284" height="116" rx="6" fill="#f1e9d8" />
        <rect x="18" y="28" width="284" height="8" fill={accent} />
        <rect x="18" y="38" width="284" height="3" fill="var(--color-go)" />
        <text x="30" y="60" fontSize="15" fontWeight="700" fill="#2a2320" style={{ fontFamily: "var(--font-display)" }}>
          {(task || `${track.title} mix`).slice(0, 32)}
        </text>
        <text x="30" y="124" fontSize="9" fill="#6b5f55" letterSpacing="1">
          SIDE A
        </text>
        <text x="290" y="124" fontSize="9" textAnchor="end" fill="#6b5f55" letterSpacing="1">
          {duration} MIN
        </text>
        {/* window with the tape packs */}
        <rect x="86" y="70" width="148" height="44" rx="8" fill="#101114" />
        <g clipPath="url(#cs-window)">
          <circle ref={leftPack} cx="118" cy="92" r={R_MAX} fill="#5b3a24" stroke="#7a5236" strokeWidth="0.6" />
          <circle ref={rightPack} cx="202" cy="92" r={R_MIN} fill="#5b3a24" stroke="#7a5236" strokeWidth="0.6" />
        </g>
        {hub(leftHub, 118)}
        {hub(rightHub, 202)}
        <rect x="86" y="70" width="148" height="44" rx="8" fill="none" stroke="#6b6e78" />
        {/* bottom head area */}
        <path d="M70 198 L86 150 H234 L250 198 Z" fill="#2c2e35" stroke="#50535d" />
        {[118, 146, 174, 202].map((x) => (
          <circle key={x} cx={x} cy="176" r="4" fill="#101114" />
        ))}
      </svg>

      <div className="flex items-center gap-[4cqw]">
        <div className="rounded-md border border-line-2 bg-black/40 px-[2cqh] py-[1cqh] font-mono text-[6cqh] leading-none tracking-[0.2em] text-fg tabular-nums">
          <span ref={counter}>000</span>
        </div>
        <MusicControls preview={!!preview} size={6} />
        <p className="text-[2.6cqh] text-muted tabular-nums">
          <span ref={gb}>0.0</span> GB/s · pets <span className="text-go-2">$<span ref={earned}>0</span></span>
        </p>
      </div>
      <Line text={line} className="text-[2.4cqh]" />
    </div>
  )
}

// ---------- Handheld: a pocket console with a green LCD ----------
const LCD = ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"]

export function Handheld({ line, preview, task }: ScreenProps) {
  const pets = useStore((s) => s.pets)
  const best = pets.reduce((a, b) => (petRate(b) > petRate(a) ? b : a), pets[0])
  const blocks = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const money = useRef<HTMLSpanElement>(null)
  const led = useRef<HTMLSpanElement>(null)

  useScreenFrame(preview, (f) => {
    const n = Math.floor(f.p * 12)
    blocks.current?.querySelectorAll("i").forEach((el, i) => ((el as HTMLElement).style.opacity = i < n ? "1" : "0.18"))
    setText(pct.current, `${Math.floor(f.p * 100)}%`)
    setText(money.current, `$${fmtShort(f.earned)}`)
    if (led.current) led.current.style.opacity = String(0.45 + Math.min(1, f.gbps / (BASE_GBPS * 2)) * 0.55)
  })

  const pixel = { fontFamily: "var(--font-vt323), ui-monospace, monospace" }
  return (
    <div className="cq-size flex h-full w-full flex-col items-center justify-center gap-[2cqh]">
      <div className="relative flex h-[84cqh] aspect-[0.6] flex-col rounded-[3cqh] rounded-br-[12cqh] bg-gradient-to-b from-[#d6d1c8] to-[#bdb7ad] p-[3.5cqh] shadow-[0_3cqh_6cqh_rgb(0_0_0/0.55),inset_0_-0.6cqh_0_rgb(0_0_0/0.15)]">
        {/* screen bezel */}
        <div className="rounded-[1.5cqh] rounded-br-[5cqh] bg-[#5b5f6b] px-[3cqh] pt-[2.2cqh] pb-[3cqh]">
          <div className="mb-[1.2cqh] flex items-center gap-[1cqh] text-[1.5cqh] tracking-[0.2em] text-[#b8bccb]">
            <span ref={led} className="size-[1.4cqh] rounded-full bg-[#ff3355] shadow-[0_0_1cqh_#ff3355]" /> BATTERY
          </div>
          <div className="flex aspect-[1.1] flex-col items-center justify-between overflow-hidden p-[2cqh]" style={{ background: LCD[3], color: LCD[0], ...pixel }}>
            <p className="w-full truncate text-center text-[3.4cqh] leading-none">{task ? task.toUpperCase() : "NOW LOADING"}</p>
            <div className="bob" style={{ filter: "grayscale(1) sepia(1) hue-rotate(40deg) saturate(2.6) brightness(0.62) contrast(1.6)" }}>
              {best && <PetAvatar avatar={best.avatar} size={120} className="size-[22cqh]" />}
            </div>
            <div className="w-full">
              <div ref={blocks} className="flex gap-[0.5cqh] border-[0.4cqh] p-[0.5cqh]" style={{ borderColor: LCD[0] }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <i key={i} className="h-[2.6cqh] flex-1" style={{ background: LCD[0], opacity: 0.18 }} />
                ))}
              </div>
              <p className="mt-[0.8cqh] flex justify-between text-[3cqh] leading-none">
                <span ref={pct}>0%</span>
                <span ref={money} style={{ color: LCD[1] }}>
                  $0
                </span>
              </p>
            </div>
          </div>
        </div>
        <p className="mt-[1.6cqh] text-[3cqh] font-bold text-[#2b2f7a] italic" style={pixel}>
          LoadBoy <span className="text-[2cqh] tracking-[0.3em] not-italic">FOCUS</span>
        </p>
        {/* controls */}
        <div className="mt-auto flex items-center justify-between pb-[3cqh]">
          <div className="relative size-[11cqh]" aria-hidden>
            <span className="absolute inset-x-[35%] inset-y-0 rounded-[0.6cqh] bg-[#2a2c33]" />
            <span className="absolute inset-y-[35%] inset-x-0 rounded-[0.6cqh] bg-[#2a2c33]" />
          </div>
          <div className="flex -rotate-[25deg] gap-[2cqh]" aria-hidden>
            {["B", "A"].map((k) => (
              <span key={k} className="grid size-[6.4cqh] place-items-center rounded-full bg-[#8b1e3f] text-[2cqh] font-bold text-[#f3c5d2] shadow-[inset_0_-0.5cqh_0_rgb(0_0_0/0.3)]">
                {k}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-[3cqh]" aria-hidden>
          {["SELECT", "START"].map((k) => (
            <span key={k} className="flex flex-col items-center gap-[0.6cqh] text-[1.3cqh] tracking-[0.15em] text-[#2b2f7a]">
              <span className="h-[1.4cqh] w-[5cqh] -rotate-[25deg] rounded-full bg-[#7d7a86]" />
              {k}
            </span>
          ))}
        </div>
      </div>
      {line && <p className="text-center text-[2.2cqh] text-muted">{line}</p>}
    </div>
  )
}

// ---------- Turntable: a record spins, the tonearm tracks progress ----------
// Geometry in the plinth's 125×100 viewBox.
const PLATTER = { x: 46, y: 50, r: 40 }
const PIVOT = { x: 108, y: 14 }
const ARM = 64
/** Arm angle (deg) at which the needle sits `r` from the record's center. */
function armAngle(r: number) {
  let best = 90
  let err = Infinity
  for (let a = 90; a <= 160; a += 0.1) {
    const nx = PIVOT.x + ARM * Math.cos((a * Math.PI) / 180)
    const ny = PIVOT.y + ARM * Math.sin((a * Math.PI) / 180)
    const e = Math.abs(Math.hypot(nx - PLATTER.x, ny - PLATTER.y) - r)
    if (e < err) {
      err = e
      best = a
    }
  }
  return best
}
const ARM_OUT = armAngle(PLATTER.r * 0.93)
const ARM_IN = armAngle(PLATTER.r * 0.42)

export function Vinyl({ skin, line, preview, task }: ScreenProps) {
  const { tracks, index, covers } = useMusic()
  const track = tracks[index] ?? tracks[0]
  const cover = covers[track.id]
  const disc = useRef<HTMLDivElement>(null)
  const arm = useRef<SVGGElement>(null)
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)
  const st = useRef({ angle: 0, arm: preview ? ARM_OUT + (ARM_IN - ARM_OUT) * preview.p : 70, target: ARM_OUT })
  const drop = useCoverDrop(!!preview, track.id)
  const color = (BAR_STYLES[skin] ?? BAR_STYLES["bar-classic"]).color

  useScreenFrame(preview, (f) => {
    setPct(f, whole, dec)
    setText(gb.current, f.gbps.toFixed(1))
    setText(earned.current, fmtShort(f.earned))
    st.current.target = ARM_OUT + (ARM_IN - ARM_OUT) * f.p
  })

  useLoop(!!preview, (dt) => {
    const s = st.current
    s.angle = (s.angle + 200 * dt) % 360 // 33⅓ rpm
    // The arm swings in from its rest at the start, then follows the groove.
    s.arm = dt ? s.arm + (s.target - s.arm) * Math.min(1, dt * 2) : s.target
    if (disc.current) disc.current.style.transform = `rotate(${s.angle}deg)`
    arm.current?.setAttribute("transform", `rotate(${s.arm.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`)
  })

  return (
    <div {...drop.handlers} className="cq-size relative flex h-full w-full items-center justify-center gap-[6cqw] overflow-hidden px-[5cqw]">
      {cover && <div aria-hidden className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-2xl" style={{ backgroundImage: `url(${cover})` }} />}
      {drop.overlay}
      {/* plinth */}
      <div className="relative z-[1] aspect-[1.25] h-[min(74cqh,44cqw)] shrink-0 rounded-[2.5cqh] bg-gradient-to-br from-[#2b2622] to-[#161312] shadow-[0_3cqh_6cqh_rgb(0_0_0/0.6),inset_0_0.3cqh_0_rgb(255_255_255/0.06)]">
        <div
          className="absolute rounded-full bg-[#0b0b0c] shadow-[0_0_0_0.6cqh_#2c2c30]"
          style={{ left: `${((PLATTER.x - PLATTER.r) / 125) * 100}%`, top: `${PLATTER.y - PLATTER.r}%`, width: `${((PLATTER.r * 2) / 125) * 100}%`, height: `${PLATTER.r * 2}%` }}
        >
          <div ref={disc} className="absolute inset-[2%] rounded-full" style={{ background: "repeating-radial-gradient(circle, #111 0 1.2px, #1c1c1e 1.2px 2.4px)" }}>
            <div className="absolute inset-[33%] overflow-hidden rounded-full" style={{ background: cover ? undefined : track.hue }}>
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" draggable={false} className="size-full object-cover" />
              )}
              <span className="absolute inset-[44%] rounded-full bg-[#0b0b0c]" />
            </div>
          </div>
          {/* The sheen stays put while the record turns under it. */}
          <div className="pointer-events-none absolute inset-[2%] rounded-full bg-[conic-gradient(from_20deg,transparent_0_10%,rgb(255_255_255/0.09)_14%,transparent_20%_58%,rgb(255_255_255/0.07)_63%,transparent_70%)]" />
        </div>
        <svg viewBox="0 0 125 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <circle cx={PIVOT.x} cy={PIVOT.y} r="6" fill="#3a3a40" stroke="#5a5a62" strokeWidth="0.8" />
          <g ref={arm} transform={`rotate(${st.current.arm} ${PIVOT.x} ${PIVOT.y})`}>
            <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x + ARM - 5} y2={PIVOT.y} stroke="#c9ccd4" strokeWidth="1.6" strokeLinecap="round" />
            <rect x={PIVOT.x + ARM - 6} y={PIVOT.y - 2.2} width="8" height="4.4" rx="1" fill="#e6e8ee" />
            <rect x={PIVOT.x - 9} y={PIVOT.y - 2.6} width="6" height="5.2" rx="1.2" fill="#6d6f78" />
          </g>
          <circle cx={PIVOT.x} cy={PIVOT.y} r="2.4" fill="#9a9ca6" />
          <text x="118" y="94" fontSize="3.2" textAnchor="end" fill="#8d857d" letterSpacing="0.6">
            33⅓ RPM
          </text>
          <circle cx="112" cy="84" r="2.4" fill={color} style={{ filter: `drop-shadow(0 0 1.5px ${color})` }} />
        </svg>
      </div>

      <div className="relative z-[1] min-w-0 max-w-[36cqw]">
        <p className="text-[2.2cqh] font-semibold tracking-[0.3em] text-accent uppercase">Side A · now playing</p>
        <p className="display mt-[1cqh] truncate text-[5.5cqh] leading-tight font-semibold tracking-tight">{track.title}</p>
        <p className="truncate text-[2.8cqh] text-muted">{track.artist}</p>
        <div className="mt-[3cqh]">
          <MusicControls preview={!!preview} />
        </div>
        <Pct whole={whole} dec={dec} className="mt-[4cqh] block text-[12cqh] leading-none font-semibold tracking-tight" decClass="text-[5cqh] text-muted" />
        <p className="mt-[1.5cqh] text-[2.6cqh] text-muted tabular-nums">
          <span ref={gb}>0.0</span> GB/s · pets <span className="text-go-2">$<span ref={earned}>0</span></span>
        </p>
        {task && <p className="mt-[1cqh] truncate text-[2.4cqh] text-faint">Working on: {task}</p>}
        <Line text={line} className="mt-[2cqh] text-left text-[2.4cqh]" />
      </div>
    </div>
  )
}

// ---------- Warp drive: stars stretch with the bandwidth ----------
type Star = { x: number; y: number; z: number; pz: number }

export function Warp({ skin, line, preview, task }: ScreenProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const warp = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)
  const frame = useRef<Frame>(preview ?? { p: 0, gbps: 0, earned: 0 })

  useScreenFrame(preview, (f) => {
    frame.current = f
    setPct(f, whole, dec)
    setText(gb.current, f.gbps.toFixed(1))
    setText(warp.current, (1 + f.p * 8).toFixed(1))
    setText(earned.current, fmtShort(f.earned))
  })

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#66c0f4"
    const stars: Star[] = Array.from({ length: 420 }, () => {
      const z = Math.random()
      return { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z, pz: z }
    })
    const resize = () => {
      c.width = c.clientWidth * devicePixelRatio
      c.height = c.clientHeight * devicePixelRatio
    }
    resize()
    const draw = (dt: number) => {
      const { p, gbps } = frame.current
      const w = c.width
      const h = c.height
      const speed = (0.08 + (gbps / BASE_GBPS) * 0.12) * (1 + p * 2.5)
      ctx.fillStyle = "rgba(4, 6, 12, 0.35)"
      ctx.fillRect(0, 0, w, h)
      for (const s of stars) {
        s.pz = s.z
        s.z -= speed * (dt || 0.016)
        if (s.z <= 0.02) {
          s.x = Math.random() * 2 - 1
          s.y = Math.random() * 2 - 1
          s.z = 1
          s.pz = 1
        }
        const k = 0.5 / s.z
        const pk = 0.5 / s.pz
        const x = w / 2 + s.x * k * w * 0.5
        const y = h / 2 + s.y * k * h * 0.5
        const px = w / 2 + s.x * pk * w * 0.5
        const py = h / 2 + s.y * pk * h * 0.5
        ctx.strokeStyle = s.z < 0.3 ? accent : "rgba(230, 238, 255, 0.85)"
        ctx.lineWidth = Math.max(0.5, (1 - s.z) * 2.6 * devicePixelRatio)
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
    if (preview || reduceMotion()) {
      for (let i = 0; i < 40; i++) draw(0.03)
      return
    }
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      draw(Math.min(0.05, (now - last) / 1000))
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [preview])

  return (
    <div className="cq-size relative h-full w-full overflow-hidden bg-[#04060c]">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <p className="text-[2.4cqh] tracking-[0.5em] text-white/60 uppercase">
          Warp <span ref={warp}>1.0</span>
        </p>
        <Pct whole={whole} dec={dec} className="display mt-[1cqh] text-[22cqh] leading-none font-semibold tracking-tight drop-shadow-[0_0_4cqh_rgb(0_0_0/0.8)]" decClass="text-[7cqh] text-white/60" />
        <p className="mt-[1.5cqh] text-[2.6cqh] text-white/70 tabular-nums">
          <span ref={gb}>0.0</span> GB/s · pets <span className="text-go-2">$<span ref={earned}>0</span></span>
        </p>
        {task && <p className="mt-[1cqh] max-w-[60cqw] truncate text-[2.4cqh] text-white/50">Destination: {task}</p>}
        <Line text={line} className="mt-[2cqh] text-[2.4cqh]" />
      </div>
      <div className="absolute inset-x-[20%] bottom-[8cqh]">
        <SkinBar skin={skin} preview={preview?.p} className="h-[1.2cqh] border-0" />
      </div>
    </div>
  )
}
