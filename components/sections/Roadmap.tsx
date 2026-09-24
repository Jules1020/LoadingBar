"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import { Gamepad2, Layers, Music2, Palette, Server, Smartphone, Sparkles, Timer, Users, type LucideIcon } from "lucide-react"
import { LOADING_LINES, RARITY } from "@/lib/data"
import { FUTURE, ROADMAP_AREAS, ROADMAP_STATUS, type RoadmapArea, type RoadmapStatus } from "@/lib/roadmap"
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
  { title: "Skin workshop", desc: "Design your own bar skins and themes, and share them. Twelve skins ship today.", icon: Palette, Preview: SkinsPreview },
  { title: "Spotify sync", desc: "The player already takes your own files and cover art. Next: your Spotify account.", icon: Music2, Preview: VinylPreview },
  { title: "Pet evolutions", desc: "Pets already upgrade to level 10. Next they evolve into new forms, up to a Mythic+ tier.", icon: Sparkles, Preview: TiersPreview },
]

const AREA_ICON: Record<RoadmapArea, LucideIcon> = { focus: Timer, social: Users, game: Gamepad2, apps: Smartphone, platform: Server }
const STATUS_STYLE: Record<RoadmapStatus, string> = {
  next: "border-accent/50 bg-accent/15 text-accent",
  planned: "border-go/40 bg-go/10 text-go-2",
  exploring: "border-line-2 text-muted",
}

function StatusBadge({ status }: { status: RoadmapStatus }) {
  return (
    <span title={ROADMAP_STATUS[status].hint} className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${STATUS_STYLE[status]}`}>
      {ROADMAP_STATUS[status].label}
    </span>
  )
}

export function Roadmap() {
  return (
    <PageFrame eyebrow="Roadmap" title="What's next" subtitle="Features on the way, and where the app goes after that.">
      <div className="flex flex-col gap-4 lg:h-full">
        <section aria-labelledby="soon-title" className="shrink-0">
          <h2 id="soon-title" className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            Coming soon
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ITEMS.map(({ title, desc, icon: Icon, Preview }) => (
              <li key={title} className="panel flex flex-col p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent/15 text-accent">
                    <Icon aria-hidden className="size-[18px]" />
                  </span>
                  <p className="font-semibold tracking-tight">{title}</p>
                </div>
                <p className="mt-2 text-sm text-muted">{desc}</p>
                <div className="mt-auto pt-4">
                  <Preview />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="future-title" className="panel flex flex-col lg:min-h-0 lg:flex-1">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 id="future-title" className="display font-semibold">
              Future development
            </h2>
            <ul aria-label="Status legend" className="flex flex-wrap gap-3 text-xs text-muted">
              {(Object.keys(ROADMAP_STATUS) as RoadmapStatus[]).map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <StatusBadge status={s} /> {ROADMAP_STATUS[s].hint}
                </li>
              ))}
            </ul>
          </div>
          <div className="scroll-thin grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ROADMAP_AREAS.map(({ id, label }) => {
              const Icon = AREA_ICON[id]
              return (
                <section key={id} aria-labelledby={`area-${id}`}>
                  <h3 id={`area-${id}`} className="flex items-center gap-2 text-sm font-semibold">
                    <Icon aria-hidden className="size-4 text-accent" /> {label}
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {FUTURE.filter((f) => f.area === id).map((f) => (
                      <li key={f.title} className="rounded-md border border-line bg-white/[0.02] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{f.title}</p>
                          <StatusBadge status={f.status} />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </section>
      </div>
    </PageFrame>
  )
}
