"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { BAR_STYLES } from "@/lib/cosmetics"
import { RARITY, type Avatar } from "@/lib/data"
import { fmtShort } from "@/lib/format"
import { motionTokens } from "@/lib/motion-tokens"
import { fmtPct, useFrame, usePayouts, type Frame, type Payout } from "@/lib/session"
import { useStore } from "@/lib/store"
import { music, useMusic } from "@/lib/music"
import { SpinningCD } from "../MiniPlayer"
import { SkinBar } from "../SkinBar"
import { SpinDial } from "../SpinDial"
import { PetAvatar } from "../PetAvatar"
import { Ctrl, Line, Pct, useScreenFrame, type ScreenProps } from "./parts"
import { Cassette, Download, Handheld, Vinyl, Warp } from "./extra"

export type { ScreenProps }

// ---------- Classic: the mockup layout ----------
function Classic({ skin, line, preview, task }: ScreenProps) {
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const caret = useRef<HTMLDivElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)

  useScreenFrame(preview, (f) => {
    const p = fmtPct(f.p)
    if (whole.current) whole.current.textContent = p.whole
    if (dec.current) dec.current.textContent = p.dec
    if (caret.current) caret.current.style.transform = `translateX(${f.p * 100}%)`
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
    if (earned.current) earned.current.textContent = fmtShort(f.earned)
  })

  return (
    <div className="cq-size relative h-full w-full overflow-hidden">
      <div className="absolute top-[7%] left-[4%] z-10">
        <p className="text-[9cqh] leading-none font-semibold tracking-tight">
          <span className="text-faint">&lt;</span>Loading<span className="text-accent">Bar</span>
          <span className="text-faint">&gt;</span>
        </p>
        <p className="mt-[1.6cqh] text-[2.6cqh] text-muted">
          Pets earned <span className="font-semibold text-go-2 tabular-nums">$<span ref={earned}>0</span></span> this session
        </p>
        {task && <p className="mt-[1cqh] max-w-[40cqw] truncate text-[2.4cqh] text-faint">Working on: {task}</p>}
      </div>

      <SpinDial corner="tr" mode="smooth" parity={0} live={!preview} className="h-[46cqh]" />
      <SpinDial corner="bl" mode="ratchet" parity={1} live={!preview} className="h-[40cqh]" />

      <div className="absolute inset-x-[16%] top-[43%]">
        <SkinBar skin={skin} preview={preview?.p} className="h-[8cqh]" />
        <div className="relative h-[20cqh]">
          <div ref={caret} className="absolute inset-y-0 left-0 w-full" style={{ transform: "translateX(0%)" }}>
            <div className="absolute top-[1.5cqh] left-0 flex -translate-x-1/2 flex-col items-center">
              <svg viewBox="0 0 12 8" className="w-[2.2cqh] fill-fg" aria-hidden>
                <path d="M6 0L12 8H0Z" />
              </svg>
              <Pct whole={whole} dec={dec} className="mt-[0.6cqh] text-[11cqh] leading-none font-semibold tracking-tight" decClass="text-[5cqh] text-muted" />
            </div>
          </div>
        </div>
        <Line text={line} className="text-[2.6cqh]" />
      </div>

      <div className="absolute right-0 bottom-0 bg-gradient-to-br from-[var(--play-a)] to-[var(--play-b)] px-[3cqh] py-[2cqh] text-[7cqh] leading-none font-bold tracking-tight text-[var(--play-fg)] tabular-nums">
        <span ref={gb}>0.0</span>
        <span className="ml-[1cqh] text-[4cqh]">GB/S</span>
      </div>
    </div>
  )
}

// ---------- Minimal ----------
function Minimal({ skin, line, preview, task }: ScreenProps) {
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  useScreenFrame(preview, (f) => {
    const p = fmtPct(f.p)
    if (whole.current) whole.current.textContent = p.whole
    if (dec.current) dec.current.textContent = p.dec
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
  })
  return (
    <div className="cq-size flex h-full w-full flex-col items-center justify-center">
      {task && <p className="mb-[3cqh] text-[2.6cqh] text-muted">{task}</p>}
      <Pct whole={whole} dec={dec} className="text-[30cqh] leading-none font-extralight tracking-tighter" decClass="text-[8cqh] text-muted" />
      <SkinBar skin={skin} preview={preview?.p} className="mt-[5cqh] h-[0.9cqh] w-[56%] border-0" />
      <p className="mt-[3cqh] text-[2.4cqh] tracking-[0.3em] text-faint uppercase tabular-nums">
        <span ref={gb}>0.0</span> GB/s
      </p>
      <Line text={line} className="mt-[3cqh] text-[2.4cqh]" />
    </div>
  )
}

// ---------- Terminal ----------
const VERBS = ["Mounted", "Verified", "Decompressed", "Linked", "Cached", "Patched", "Indexed", "Defragged"]
const FILES = ["focus.pak", "willpower.dll", "deadline.idx", "snacks.cfg", "motivation.so", "pets.db", "streak.lock", "brain.ram"]
const logLine = (n: number) =>
  `${VERBS[n % VERBS.length]} ${FILES[(n * 7) % FILES.length]} chunk 0x${(n * 2654435761 % 65536).toString(16).padStart(4, "0")} (${128 + ((n * 37) % 900)} MB)`

function Terminal({ line, preview, task }: ScreenProps) {
  const [log, setLog] = useState<{ id: number; text: string; pay?: Payout }[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({ id: i, text: logLine(i) })),
  )
  const chunk = useRef(-1)
  const seq = useRef(100)
  const bar = useRef<HTMLSpanElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)

  useScreenFrame(preview, (f) => {
    const cells = 40
    const filled = Math.round(f.p * cells)
    if (bar.current) bar.current.textContent = `${"#".repeat(filled)}${".".repeat(cells - filled)}`
    if (pct.current) pct.current.textContent = `${(Math.floor(f.p * 1000) / 10).toFixed(1)}%`
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
    const c = Math.floor(f.p * 300)
    if (!preview && c !== chunk.current) {
      chunk.current = c
      setLog((l) => [...l.slice(-15), { id: ++seq.current, text: logLine(c) }])
    }
  })
  usePayouts((p) => setLog((l) => [...l.slice(-15), { id: ++seq.current, text: "", pay: p }]), !preview)

  return (
    <div className="cq-size flex h-full w-full flex-col bg-black px-[5%] py-[6cqh] font-mono text-[2.3cqh] text-[#39ff14]">
      <p className="text-[#7dff5c]">LOADINGBAR BIOS v0.3 · session.exe</p>
      <p className="text-[#1fbf0a]">{task ? `> task: ${task}` : line ?? "Loading…"}</p>
      <div className="mt-[3cqh] flex min-h-0 flex-1 flex-col justify-end overflow-hidden leading-[1.55]">
        {log.map((l) =>
          l.pay ? (
            <p key={l.id}>
              <span className="text-[#7dff5c]">[ PAY ]</span> {l.pay.name}{" "}
              <span style={{ color: RARITY[l.pay.rarity].hex }}>+${fmtShort(l.pay.amount)}</span>
            </p>
          ) : (
            <p key={l.id} className="text-[#1fbf0a]">
              [ <span className="text-[#39ff14]">OK</span> ] {l.text}
            </p>
          ),
        )}
      </div>
      <p className="mt-[3cqh] text-[3.2cqh] whitespace-pre">
        [<span ref={bar} />] <span ref={pct}>0.0%</span>  <span ref={gb}>0.0</span> GB/s
        <span className="caret-blink">_</span>
      </p>
    </div>
  )
}

// ---------- Orbit ----------
function Orbit({ skin, line, preview }: ScreenProps) {
  const pets = useStore((s) => s.pets)
  const ring = useRef<SVGCircleElement>(null)
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)
  const orbit = useRef<HTMLDivElement>(null)
  const spin = useRef(0)
  const last = useRef(0)
  const color = (BAR_STYLES[skin] ?? BAR_STYLES["bar-classic"]).color

  useScreenFrame(preview, (f) => {
    ring.current?.setAttribute("stroke-dashoffset", String(100 - f.p * 100))
    const p = fmtPct(f.p)
    if (whole.current) whole.current.textContent = p.whole
    if (dec.current) dec.current.textContent = p.dec
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
    if (earned.current) earned.current.textContent = fmtShort(f.earned)
    const now = performance.now()
    const dt = last.current ? Math.min(0.05, (now - last.current) / 1000) : 0
    last.current = now
    spin.current += dt * (4 + f.gbps * 0.9)
    if (orbit.current) orbit.current.style.transform = `rotate(${spin.current}deg)`
  })

  const shown = pets.slice(0, 8)
  return (
    <div className="cq-size relative flex h-full w-full items-center justify-center">
      <div className="relative aspect-square h-[74cqh]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-line-2)" strokeWidth="3" />
          <circle ref={ring} cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="3" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
        </svg>
        <div ref={orbit} className="absolute inset-0">
          {shown.map((p, i) => {
            const a = (i / shown.length) * Math.PI * 2
            return (
              <div
                key={p.uid}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${50 + 49 * Math.cos(a)}%`, top: `${50 + 49 * Math.sin(a)}%` }}
              >
                <PetAvatar avatar={p.avatar} size={64} />
              </div>
            )
          })}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Pct whole={whole} dec={dec} className="text-[14cqh] leading-none font-semibold tracking-tight" decClass="text-[5cqh] text-muted" />
          <p className="mt-[1.5cqh] text-[2.6cqh] text-muted tabular-nums">
            <span ref={gb}>0.0</span> GB/s · <span className="text-go-2">$<span ref={earned}>0</span></span>
          </p>
          <Line text={line} className="mt-[2cqh] max-w-[36cqh] text-[2.2cqh]" />
        </div>
      </div>
    </div>
  )
}

// ---------- Boss fight ----------
const BOSS: Avatar = { body: "blob", color: "#5b2a86", eyes: "cyclops", top: "horns", extra: "cape", pattern: "spots" }

function Boss({ skin, line, preview }: ScreenProps) {
  const hp = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const [hits, setHits] = useState<Payout[]>([])
  useScreenFrame(preview, (f) => {
    if (hp.current) hp.current.textContent = `${(100 - Math.floor(f.p * 1000) / 10).toFixed(1)}%`
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
  })
  usePayouts((p) => setHits((h) => [...h.slice(-5), p]), !preview)

  return (
    <div className="cq-size relative flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(60%_50%_at_50%_45%,rgb(120_40_160/0.25),transparent)]">
      <p className="text-[2.4cqh] tracking-[0.4em] text-muted uppercase">Boss · Lv. 99</p>
      <p className="mt-[1cqh] text-[6cqh] leading-none font-bold tracking-tight">Procrastination</p>
      <div className="relative mt-[3cqh]">
        <div className="bob">
          <PetAvatar avatar={BOSS} size={300} />
        </div>
        <AnimatePresence>
          {hits.map((h) => (
            <motion.span
              key={h.id}
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -110, scale: 1.1 }}
              transition={{ duration: 1.4, ease: motionTokens.easing.smooth }}
              onAnimationComplete={() => setHits((l) => l.filter((x) => x.id !== h.id))}
              className="absolute top-1/3 text-[4cqh] font-bold"
              style={{ left: `${30 + ((h.id * 17) % 40)}%`, color: RARITY[h.rarity].hex }}
            >
              -{fmtShort(h.amount)}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-[3cqh] w-[56%]">
        <div className="mb-[1cqh] flex justify-between text-[2.4cqh] tabular-nums">
          <span className="font-semibold">HP <span ref={hp}>100.0%</span></span>
          <span className="text-muted">
            DPS <span ref={gb}>0.0</span> GB/s
          </span>
        </div>
        <SkinBar skin={skin} preview={preview?.p} invert className="h-[5cqh]" />
      </div>
      <Line text={line} className="mt-[2.5cqh] text-[2.4cqh]" />
    </div>
  )
}

// ---------- CD Player: the mini player, blown up ----------
function CdPlayer({ skin, line, preview, task }: ScreenProps) {
  const { tracks, index, playing, covers } = useMusic()
  const track = tracks[index] ?? tracks[0]
  const ring = useRef<SVGCircleElement>(null)
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const earned = useRef<HTMLSpanElement>(null)
  const color = (BAR_STYLES[skin] ?? BAR_STYLES["bar-classic"]).color

  useScreenFrame(preview, (f) => {
    ring.current?.setAttribute("stroke-dashoffset", String(100 - f.p * 100))
    const p = fmtPct(f.p)
    if (whole.current) whole.current.textContent = p.whole
    if (dec.current) dec.current.textContent = p.dec
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
    if (earned.current) earned.current.textContent = fmtShort(f.earned)
  })

  const ctrl = "grid size-[7cqh] cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
  const cover = covers[track.id]
  const [over, setOver] = useState(false)
  // Live screen only: drop an image anywhere to make it this track's cover.
  const drop = preview
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
          if (img) void music.setCover(track.id, img)
        },
      }
  return (
    <div {...drop} className="cq-size relative flex h-full w-full items-center justify-center gap-[7cqw] overflow-hidden px-[6cqw]">
      {cover && (
        <div
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl transition-opacity duration-700"
          style={{ backgroundImage: `url(${cover})` }}
        />
      )}
      {cover && <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/20" />}
      {over && (
        <div className="pointer-events-none absolute inset-4 z-10 grid place-items-center rounded-lg border-2 border-dashed border-accent bg-bg/60 text-[3cqh] font-semibold">
          Drop to set the cover
        </div>
      )}
      <div className="relative z-[1] aspect-square h-[76cqh] shrink-0">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="48.5" fill="none" stroke="var(--color-line-2)" strokeWidth="1.2" />
          <circle ref={ring} cx="50" cy="50" r="48.5" fill="none" stroke={color} strokeWidth="1.8" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
        </svg>
        <div className="absolute inset-[5%]">
          <SpinningCD hue={track.hue} playing={playing || !preview} image={cover} size="100%" topSpeed={70} />
        </div>
      </div>
      <div className="relative z-[1] min-w-0 max-w-[40cqw]">
        <p className="text-[2.2cqh] font-semibold tracking-[0.3em] text-accent uppercase">Now loading</p>
        <p className="mt-[1cqh] truncate text-[5.5cqh] leading-tight font-semibold tracking-tight">{track.title}</p>
        <p className="truncate text-[2.8cqh] text-muted">{track.artist}</p>
        <div className="mt-[3cqh] flex items-center gap-[1.5cqh]">
          <Ctrl preview={!!preview} onClick={music.prev} label="Previous track" className={ctrl}>
            <SkipBack className="size-[3cqh]" />
          </Ctrl>
          <Ctrl preview={!!preview} onClick={music.toggle} label={playing ? "Pause" : "Play"} className="btn-play grid size-[9cqh] cursor-pointer place-items-center rounded-full">
            {playing ? <Pause className="size-[3.6cqh] fill-current" /> : <Play className="ml-[0.4cqh] size-[3.6cqh] fill-current" />}
          </Ctrl>
          <Ctrl preview={!!preview} onClick={music.next} label="Next track" className={ctrl}>
            <SkipForward className="size-[3cqh]" />
          </Ctrl>
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

// ---------- Matrix: code rain that thickens as it loads ----------
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789$%#@&LOADINGBAR"

function Matrix({ line, preview, task }: ScreenProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const whole = useRef<HTMLSpanElement>(null)
  const dec = useRef<HTMLSpanElement>(null)
  const gb = useRef<HTMLSpanElement>(null)
  const frame = useRef<Frame>(preview ?? { p: 0, gbps: 0, earned: 0 })

  useScreenFrame(preview, (f) => {
    frame.current = f
    const p = fmtPct(f.p)
    if (whole.current) whole.current.textContent = p.whole
    if (dec.current) dec.current.textContent = p.dec
    if (gb.current) gb.current.textContent = f.gbps.toFixed(1)
  })

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    const size = 16
    let cols: number[] = []
    const resize = () => {
      c.width = c.clientWidth
      c.height = c.clientHeight
      cols = Array.from({ length: Math.ceil(c.width / size) }, () => Math.random() * -50)
    }
    resize()
    const draw = () => {
      const { p, gbps } = frame.current
      ctx.fillStyle = "rgba(0, 0, 0, 0.09)"
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.font = `${size}px monospace`
      const density = 0.35 + p * 0.65
      for (let i = 0; i < cols.length; i++) {
        if (Math.random() > density && cols[i] < 0) continue
        const y = cols[i] * size
        ctx.fillStyle = Math.random() < 0.08 ? "#d8ffd0" : "#39ff14"
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * size, y)
        cols[i] += 0.5 + gbps / 25
        if (y > c.height && Math.random() > 0.975) cols[i] = 0
      }
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (preview || reduce) {
      for (let i = 0; i < 90; i++) draw()
      return
    }
    let raf = 0
    let last = 0
    const loop = (now: number) => {
      if (now - last > 45) {
        draw()
        last = now
      }
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
    <div className="cq-size relative h-full w-full overflow-hidden bg-black font-mono">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="absolute inset-0 grid place-items-center">
        <div className="border border-[#39ff14]/40 bg-black/80 px-[6cqh] py-[4cqh] text-center text-[#39ff14] shadow-[0_0_40px_rgb(57_255_20/0.25)]">
          <p className="text-[2.2cqh] tracking-[0.4em] text-[#1fbf0a]">WAKE UP, FOCUS…</p>
          <Pct whole={whole} dec={dec} className="mt-[1.5cqh] block text-[14cqh] leading-none" decClass="text-[5cqh] text-[#1fbf0a]" />
          <p className="mt-[1.5cqh] text-[2.4cqh] text-[#1fbf0a] tabular-nums">
            <span ref={gb}>0.0</span> GB/s
          </p>
          {(task || line) && <p className="mt-[1cqh] max-w-[50cqw] truncate text-[2.2cqh] text-[#7dff5c]">{task ? `> ${task}` : line}</p>}
        </div>
      </div>
    </div>
  )
}

export const SCREENS: Record<string, (p: ScreenProps) => React.ReactNode> = {
  "screen-classic": Classic,
  "screen-minimal": Minimal,
  "screen-terminal": Terminal,
  "screen-orbit": Orbit,
  "screen-boss": Boss,
  "screen-cd": CdPlayer,
  "screen-matrix": Matrix,
  "screen-download": Download,
  "screen-cassette": Cassette,
  "screen-handheld": Handheld,
  "screen-vinyl": Vinyl,
  "screen-warp": Warp,
}

export function LoadingScreen({ id, ...props }: ScreenProps & { id: string }) {
  const Screen = SCREENS[id] ?? Classic
  return <Screen {...props} />
}
