"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { Layers, Music2, Palette, Sparkles, type LucideIcon } from "lucide-react"
import { LOADING_LINES, RARITY } from "@/lib/data"
import { PageFrame } from "../PageFrame"

/** Slow clock for the previews; stops when off-screen or reduced-motion. */
function useTick(ms: number) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reduce = useReducedMotion()
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    const id = window.setInterval(() => setT((x) => x + 1), ms)
    return () => window.clearInterval(id)
  }, [inView, reduce, ms])
  return { ref, t }
}

function StagesPreview() {
  const { ref, t } = useTick(120)
  const cycle = t % 60
  const stage = Math.min(3, Math.floor(cycle / 14))
  const within = Math.min(1, (cycle - stage * 14) / 12)
  return (
    <div ref={ref}>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className="h-2.5 overflow-hidden bg-white/[0.07]">
            <div
              className="h-full bg-gradient-to-r from-accent-2 to-accent"
              style={{ width: `${s < stage ? 100 : s === stage ? within * 100 : 0}%` }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 truncate text-xs text-muted">
        Stage {stage + 1}/4 · {LOADING_LINES[(Math.floor(t / 60) * 4 + stage) % LOADING_LINES.length]}
      </p>
    </div>
  )
}

const SKINS = [
  { name: "Steam blue", fill: "linear-gradient(90deg,#2d73ff,#66c0f4)" },
  { name: "Candy stripe", fill: "repeating-linear-gradient(45deg,#f472b6 0 8px,#fb7185 8px 16px)" },
  { name: "Segmented", fill: "repeating-linear-gradient(90deg,#a4d007 0 10px,transparent 10px 13px)" },
  { name: "Sunset", fill: "linear-gradient(90deg,#f97316,#fde047)" },
  { name: "Retro terminal", fill: "repeating-linear-gradient(90deg,#39ff14 0 6px,#0a2a05 6px 8px)" },
]

function SkinsPreview() {
  const { ref, t } = useTick(90)
  const skin = SKINS[Math.floor(t / 22) % SKINS.length]
  const p = (t % 22) / 21
  return (
    <div ref={ref}>
      <div className="h-3 overflow-hidden bg-white/[0.07]">
        <div className="h-full transition-[width] duration-100" style={{ width: `${p * 100}%`, background: skin.fill }} />
      </div>
      <p className="mt-2 text-xs text-muted">Skin: {skin.name}</p>
    </div>
  )
}

function VinylPreview() {
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" aria-hidden className="size-16 shrink-0 animate-spin-slow">
        <circle cx="50" cy="50" r="48" fill="#0b0f14" />
        {[40, 34, 28].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" />
        ))}
        <circle cx="50" cy="50" r="18" fill="url(#vinyl-art)" />
        <circle cx="50" cy="50" r="3" fill="#0b0f14" />
        <defs>
          <linearGradient id="vinyl-art" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1ed760" />
            <stop offset="100%" stopColor="#2d73ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="min-w-0 text-xs">
        <p className="text-muted">Now playing</p>
        <p className="truncate font-semibold text-fg">lofi beats to load to</p>
        <p className="text-faint">Album art on the disc</p>
      </div>
    </div>
  )
}

function TiersPreview() {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
      {(["rare", "epic", "legendary", "mythic"] as const).map((k) => (
        <span key={k} className="rounded-sm px-2 py-0.5" style={{ color: RARITY[k].hex, background: `${RARITY[k].hex}1f` }}>
          {RARITY[k].label}
        </span>
      ))}
      <span className="shimmer-text rounded-sm border border-line-2 px-2 py-0.5">Mythic+?</span>
    </div>
  )
}

const ITEMS: { title: string; desc: string; icon: LucideIcon; Preview: () => React.ReactNode }[] = [
  {
    title: "Staged loading",
    desc: "The bar splits into stages, each with its own random loading line.",
    icon: Layers,
    Preview: StagesPreview,
  },
  { title: "Skin workshop", desc: "Design your own bar skins and share them. Twelve built-in skins ship today.", icon: Palette, Preview: SkinsPreview },
  { title: "Spotify sync", desc: "The mini player works today with built-in stations and your own files. Next: your Spotify account.", icon: Music2, Preview: VinylPreview },
  { title: "Pet evolutions", desc: "Pets level up the longer they grind, up to a new Mythic+ tier.", icon: Sparkles, Preview: TiersPreview },
]

export function Roadmap() {
  return (
    <PageFrame
      eyebrow="Roadmap"
      title="Coming soon"
      subtitle="What's next once the core loop is proven."
    >
      <ul className="grid h-full auto-rows-fr gap-4 sm:grid-cols-2">
        {ITEMS.map(({ title, desc, icon: Icon, Preview }) => (
          <li key={title} className="panel flex min-h-[180px] flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-accent/15 text-accent">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="rounded-md border border-line-2 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted">
                Coming soon
              </span>
            </div>
            <p className="mt-4 text-lg font-semibold tracking-tight">{title}</p>
            <p className="mt-1 text-sm text-muted">{desc}</p>
            <div className="mt-auto pt-5">
              <Preview />
            </div>
          </li>
        ))}
      </ul>
    </PageFrame>
  )
}
