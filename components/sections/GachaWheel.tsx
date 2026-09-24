"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, useInView, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Lock, Play, Snowflake, SwatchBook, Ticket } from "lucide-react"
import { ODDS, PET_POOL, RARITY, WHEEL, type Avatar, type WheelKind } from "@/lib/data"
import { THEME_SWATCH, type Cosmetic } from "@/lib/cosmetics"
import { SEG, landing, rollCosmetic, rollKind, segAt } from "@/lib/wheel"
import { fmtMoney, fmtShort } from "@/lib/format"
import { demoTimings, motionTokens, springs } from "@/lib/motion-tokens"
import { addPet, effectiveEquipped, equip, grantCosmetic, isAdmin, multiplier, recordPull, store, useStore } from "@/lib/store"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { Button } from "../Button"
import { Chip, PageFrame } from "../PageFrame"
import { PetAvatar } from "../PetAvatar"
import { SkinBar } from "../SkinBar"

const R = 170
const LABEL: Record<WheelKind, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY",
  mythic: "MYTHIC",
  secret: "SECRET",
  freeze: "FREEZE",
  cosmetic: "SKIN",
}
const DUPE_CASH = 5_000

type Pull = {
  n: number
  kind: WheelKind
  /** Rarity that drives color and celebration. */
  tier: WheelKind
  name: string
  avatar?: Avatar
  rate?: number
  cosmetic?: Cosmetic
  dupeCash?: number
}

// Rounded so server and browser produce identical SVG paths (float trig can differ in the last digit).
const round = (n: number) => Math.round(n * 1000) / 1000
const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return [round(Math.cos(a) * r), round(Math.sin(a) * r)]
}
const smoothstep = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

const BIG: WheelKind[] = ["epic", "legendary", "mythic", "secret"]
let pullSeq = 0

export function GachaWheel() {
  const reduce = useReducedMotion()
  const router = useRouter()
  const pendingSpin = useStore((s) => s.pendingSpin)
  // Admin "infinite spins": the wheel never runs out.
  const infinite = useStore((s) => isAdmin(s) && s.infiniteSpins)
  const savedSpins = useStore((s) => s.spinsEarned)
  const spinsEarned = infinite ? Math.max(1, savedSpins) : savedSpins
  const duration = useStore((s) => s.duration)
  const ready = useStore((s) => s.ready)
  const equipped = useStore(effectiveEquipped)

  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Pull | null>(null)
  const [history, setHistory] = useState<Pull[]>([])
  const [glow, setGlow] = useState<{ hex: string; key: number } | null>(null)
  const [copied, setCopied] = useState(false)
  // Until saved progress loads we don't know the spin count; show locked rather than flash "Spin".
  const locked = !spinning && (!ready || spinsEarned <= 0)

  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const camRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<SVGGElement>(null)
  const pointerRef = useRef<SVGGElement>(null)
  const lightsRef = useRef<SVGGElement>(null)
  const rotRef = useRef(0)
  const rafRef = useRef(0)
  const spinningRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const inView = useInView(stageRef, { amount: 0.3 })

  const toggleLights = () => {
    const g = lightsRef.current
    if (!g) return
    g.style.removeProperty("--light")
    g.dataset.p = g.dataset.p === "0" ? "1" : "0"
  }

  const flap = () => {
    const p = pointerRef.current
    if (!p) return
    p.style.transform = "rotate(-16deg)"
    window.setTimeout(() => {
      p.style.transform = ""
    }, 70)
  }

  const land = useCallback((kind: WheelKind) => {
    spinningRef.current = false
    setSpinning(false)

    const n = ++pullSeq
    recordPull(kind)
    let pull: Pull
    if (kind === "freeze") {
      store.set((s) => ({ freezeTokens: s.freezeTokens + 1 }))
      pull = { n, kind, tier: "freeze", name: "Streak Freeze" }
    } else if (kind === "cosmetic") {
      const c = rollCosmetic(store.get().ownedCosmetics)
      if (c) {
        grantCosmetic(c.id)
        pull = { n, kind, tier: c.rarity, name: c.name, cosmetic: c }
      } else {
        store.set((s) => ({ balance: s.balance + DUPE_CASH }))
        pull = { n, kind, tier: "cosmetic", name: "Collection complete", dupeCash: DUPE_CASH }
      }
    } else {
      const pool = PET_POOL.filter((p) => p.rarity === kind)
      const pet = addPet(pool[Math.floor(Math.random() * pool.length)])
      pull = { n, kind, tier: kind, name: pet.name, avatar: pet.avatar, rate: pet.rate }
    }
    setResult(pull)
    setHistory((h) => [pull, ...h].slice(0, 6))
    const hex = RARITY[pull.tier].hex
    setGlow({ hex, key: n })

    const lights = lightsRef.current
    if (lights) {
      lights.style.setProperty("--light", hex)
      lights.dataset.p = "all"
    }

    sfx.chime(pull.tier)
    const t = pull.tier
    if (t === "secret") {
      fx.emit({ kind: "flash", color: "#ffffff", strength: 0.9, ms: 1800 })
      fx.emit({ kind: "burst", palette: "secret", power: 260 })
      timersRef.current.push(window.setTimeout(() => fx.emit({ kind: "burst", palette: "legendary", power: 160 }), 400))
      timersRef.current.push(window.setTimeout(() => fx.emit({ kind: "burst", palette: "epic", power: 160 }), 800))
    } else if (t === "mythic") {
      fx.emit({ kind: "flash", color: hex, strength: 0.8, ms: 1500 })
      fx.emit({ kind: "burst", palette: t, power: 240 })
      timersRef.current.push(window.setTimeout(() => fx.emit({ kind: "burst", palette: t, power: 140 }), 450))
    } else if (t === "legendary") {
      fx.emit({ kind: "flash", color: hex, strength: 0.7, ms: 1300 })
      fx.emit({ kind: "burst", palette: t, power: 200 })
    } else if (t === "epic") {
      fx.emit({ kind: "flash", color: hex, strength: 0.4, ms: 800 })
      fx.emit({ kind: "burst", palette: t, power: 110 })
    } else if (t !== "common") {
      fx.emit({ kind: "flash", color: hex, strength: 0.16, ms: 500 })
    }

    // Ease the camera back out after the moment lands.
    timersRef.current.push(
      window.setTimeout(() => {
        const cam = camRef.current
        if (!cam) return
        cam.style.transition = "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)"
        cam.style.transform = ""
        timersRef.current.push(
          window.setTimeout(() => {
            cam.style.transition = ""
          }, 920),
        )
      }, BIG.includes(t) ? 1600 : 500),
    )
  }, [])

  const spin = useCallback(() => {
    // Spins are earned by finishing a loading bar, never free.
    const s0 = store.get()
    const free = isAdmin(s0) && s0.infiniteSpins
    if (spinningRef.current || (!free && s0.spinsEarned <= 0)) return
    spinningRef.current = true
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
    if (camRef.current) camRef.current.style.transition = ""
    setSpinning(true)
    setResult(null)
    setCopied(false)
    setGlow(null)
    if (!free) store.set((s) => ({ spinsEarned: s.spinsEarned - 1 }))

    // Admin can rig the wheel to land on one result every time.
    const kind = (isAdmin(s0) && s0.rig) || rollKind()
    const start = rotRef.current
    const { delta } = landing(kind, start)
    const big = BIG.includes(kind)
    const turns = reduce ? 1 : big ? 7 : 5
    const end = start + turns * 360 + delta
    const D = reduce ? demoTimings.wheelReducedMs : big ? demoTimings.wheelBigSpinMs : demoTimings.wheelSpinMs
    // Big pulls crawl longer at the end (slow-mo), with a heavier tilt.
    const ease = (t: number) => 1 - Math.pow(1 - t, big ? 5 : 4)

    let last = segAt(start)
    const t0 = performance.now()
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / D)
      const rot = start + (end - start) * ease(t)
      rotRef.current = rot
      wheelRef.current?.setAttribute("transform", `rotate(${rot})`)

      const seg = segAt(rot)
      if (seg !== last) {
        last = seg
        sfx.tick()
        flap()
        toggleLights()
      }

      const cam = camRef.current
      if (cam && !reduce) {
        const push = smoothstep(0.45, 1, t)
        const tilt = big ? push : push * 0.35
        cam.style.transform = `perspective(1200px) rotateX(${14 * tilt}deg) rotateY(${-6 * tilt}deg) scale(${1 + (big ? 0.11 : 0.06) * push})`
      }

      if (t < 1) rafRef.current = requestAnimationFrame(frame)
      else land(kind)
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [reduce, land])

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      timersRef.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  // Arrived here from a completed session → spin automatically.
  useEffect(() => {
    if (!pendingSpin || !inView) return
    const t = window.setTimeout(() => {
      store.set({ pendingSpin: false })
      spin()
    }, 600)
    return () => window.clearTimeout(t)
  }, [pendingSpin, inView, spin])

  // Wheel fills its panel: the smaller of width/height, measured (cq units fail when the
  // panel's height only comes from min-height).
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize(Math.floor(Math.min(r.width, r.height) * 0.92))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Idle marquee lights.
  useEffect(() => {
    if (spinning || !inView || reduce) return
    const id = window.setInterval(toggleLights, 600)
    return () => window.clearInterval(id)
  }, [spinning, inView, reduce])

  // Subtle parallax tilt while idle so it never reads flat.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (spinningRef.current || reduce || e.pointerType !== "mouse") return
    const cam = camRef.current
    if (!cam) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width - 0.5
    const dy = (e.clientY - r.top) / r.height - 0.5
    cam.style.transition = "transform 300ms ease-out"
    cam.style.transform = `perspective(1200px) rotateX(${-dy * 9}deg) rotateY(${dx * 9}deg)`
  }
  const onPointerLeave = () => {
    if (spinningRef.current || !camRef.current) return
    camRef.current.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)"
    camRef.current.style.transform = ""
  }

  const brag = async () => {
    if (!result) return
    const label = RARITY[result.tier].label
    const what = result.cosmetic ? `the ${label} "${result.name}" ${result.cosmetic.kind}` : result.rate ? `a ${label} ${result.name} (+$${result.rate}/s)` : result.name
    try {
      await navigator.clipboard.writeText(`Just pulled ${what} after a ${duration} min focus session on LoadingBar 🔥`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <PageFrame
      eyebrow="Wheel"
      title="Spin the wheel"
      subtitle="Every finished loading bar earns one spin. Pull pets, bar skins, themes, loading screens, or a streak freeze."
      actions={<Chip icon={Ticket}>{spinsEarned} spins</Chip>}
    >
      <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div ref={panelRef} className="panel relative min-h-[340px] overflow-hidden">
          <div
            ref={stageRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: size, height: size }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            <div ref={camRef} className="relative h-full w-full will-change-transform">
              {glow && (
                <div
                  key={glow.key}
                  aria-hidden
                  className="wheel-glow absolute inset-[6%] rounded-full"
                  style={{ ["--g" as string]: `${glow.hex}99` }}
                />
              )}
              <svg viewBox="-200 -200 400 400" className="relative h-full w-full" role="img" aria-label="Prize wheel" shapeRendering="geometricPrecision">
                <defs>
                  <radialGradient id="wheel-shade" r="50%">
                    <stop offset="55%" stopColor="#000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
                  </radialGradient>
                  <linearGradient id="wheel-rainbow" x1="0" y1="0" x2="1" y2="1">
                    {["#ff5f6d", "#ffc371", "#47e891", "#44a0ff", "#b06cff"].map((c, i) => (
                      <stop key={c} offset={i / 4} stopColor={c} />
                    ))}
                  </linearGradient>
                </defs>
                <circle r={196} fill="var(--color-panel)" stroke="var(--color-line-2)" />
                <g ref={lightsRef} className="wheel-lights" data-p="0">
                  {Array.from({ length: 32 }, (_, i) => {
                    const [x, y] = polar(i * (360 / 32) - 90, 184)
                    return <circle key={i} cx={x} cy={y} r={2.8} />
                  })}
                </g>
                <g ref={wheelRef}>
                  {WHEEL.map((kind, i) => {
                    const a0 = i * SEG - 90
                    const [x0, y0] = polar(a0, R)
                    const [x1, y1] = polar(a0 + SEG, R)
                    const [rx0, ry0] = polar(a0 + 0.6, R - 3)
                    const [rx1, ry1] = polar(a0 + SEG - 0.6, R - 3)
                    const hex = RARITY[kind].hex
                    const paint = kind === "secret" ? "url(#wheel-rainbow)" : hex
                    return (
                      <g key={i}>
                        <path d={`M0 0 L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={i % 2 ? "var(--color-panel-2)" : "var(--color-panel-3)"} />
                        <path d={`M0 0 L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} fill={paint} fillOpacity={kind === "common" ? 0.05 : 0.15} />
                        <path d={`M${rx0} ${ry0} A${R - 3} ${R - 3} 0 0 1 ${rx1} ${ry1}`} fill="none" stroke={paint} strokeWidth={6} />
                        <path d={`M0 0 L${x0} ${y0}`} stroke="rgb(0 0 0 / 0.3)" strokeWidth={1} />
                        <g transform={`rotate(${a0 + SEG / 2})`}>
                          <text
                            x={108}
                            y={0}
                            dominantBaseline="central"
                            textAnchor="middle"
                            fill={kind === "secret" ? "url(#wheel-rainbow)" : hex}
                            fontSize={LABEL[kind].length > 7 ? 10.5 : 12.5}
                            fontWeight={700}
                            letterSpacing={0.5}
                            style={{ fontFamily: "var(--font-sans)" }}
                          >
                            {LABEL[kind]}
                          </text>
                        </g>
                      </g>
                    )
                  })}
                  <circle r={R} fill="url(#wheel-shade)" />
                </g>
                <circle r={50} fill="var(--color-panel)" stroke="var(--color-line-2)" strokeWidth={2} />
                <g ref={pointerRef} className="wheel-pointer">
                  <path d="M-13 -200 L13 -200 L0 -166 Z" fill="var(--color-fg)" stroke="var(--color-bg)" strokeWidth={2} strokeLinejoin="round" />
                </g>
              </svg>
              <button
                type="button"
                onClick={spin}
                disabled={spinning || locked}
                aria-label={locked ? "Wheel locked: finish a loading bar to earn a spin" : "Spin the wheel"}
                className={`absolute top-1/2 left-1/2 grid size-[23%] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-sm font-bold tracking-wide transition-[filter] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed md:text-base ${
                  locked || spinning ? "bg-panel-3 text-muted" : "btn-play"
                }`}
              >
                {spinning ? (
                  <span className="text-xs text-muted">…</span>
                ) : locked ? (
                  <span className="flex flex-col items-center gap-0.5 text-[11px] md:text-xs">
                    <Lock aria-hidden className="size-5" />
                    LOCKED
                  </span>
                ) : (
                  "SPIN"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:min-h-0">
          <div className="panel relative min-h-[210px] flex-1 overflow-hidden p-5" aria-live="polite">
            {result && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{ background: `radial-gradient(90% 70% at 85% 20%, ${RARITY[result.tier].hex}26, transparent 60%)` }}
              />
            )}
            <AnimatePresence mode="wait">
              {spinning && (
                <m.div
                  key="spinning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: motionTokens.duration.normal }}
                  className="flex h-full flex-col justify-center"
                >
                  <p className="text-xs font-medium text-muted">Rolling</p>
                  <p className="shimmer-text mt-1 text-3xl font-semibold">Good luck…</p>
                </m.div>
              )}
              {!spinning && result && (
                <m.div
                  key={result.n}
                  initial={{ opacity: 0, y: 10, scale: reduce ? 1 : 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={springs.gentle}
                  className="relative flex h-full flex-col"
                >
                  <p
                    className={`text-xs font-bold tracking-[0.18em] uppercase ${result.tier === "secret" ? "text-secret" : ""}`}
                    style={result.tier === "secret" ? undefined : { color: RARITY[result.tier].hex }}
                  >
                    {BIG.includes(result.tier) ? `${RARITY[result.tier].label} pull!` : RARITY[result.tier].label}
                    {result.cosmetic && ` · ${result.cosmetic.kind === "bar" ? "bar skin" : result.cosmetic.kind === "screen" ? "loading screen" : "theme"}`}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <span
                      aria-hidden
                      className="grid size-24 shrink-0 place-items-center rounded-lg"
                      style={{ background: `${RARITY[result.tier].hex}1c`, boxShadow: `inset 0 0 0 1px ${RARITY[result.tier].hex}55` }}
                    >
                      <PullIcon pull={result} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-3xl font-semibold tracking-tight">{result.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {result.kind === "freeze" && "Covers one missed day. Saved to your streak."}
                        {result.rate !== undefined &&
                          `Earns $${fmtShort(result.rate * multiplier(store.get()))}/s with your flame, during sessions.`}
                        {result.cosmetic && result.cosmetic.desc}
                        {result.dupeCash && `You own every wheel cosmetic. Converted to ${fmtMoney(result.dupeCash)}.`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {spinsEarned > 0 ? (
                      <Button variant="play" onClick={spin}>
                        Spin again ({spinsEarned})
                      </Button>
                    ) : (
                      <Button variant="play" onClick={() => router.push("/session")}>
                        <Play aria-hidden className="size-4 fill-current" /> Run another session
                      </Button>
                    )}
                    {result.cosmetic &&
                      (equipped[result.cosmetic.kind] === result.cosmetic.id ? (
                        <Button disabled>Equipped</Button>
                      ) : (
                        <Button onClick={() => result.cosmetic && equip(result.cosmetic.kind, result.cosmetic.id)}>Equip</Button>
                      ))}
                    {result.rate !== undefined && <Button onClick={() => router.push("/pets")}>View pets</Button>}
                    {result.kind === "freeze" && <Button onClick={() => router.push("/progress?tab=streak")}>View streak</Button>}
                    <Button variant="ghost" onClick={brag}>
                      <Copy aria-hidden className="size-4" /> {copied ? "Copied" : "Copy brag"}
                    </Button>
                  </div>
                </m.div>
              )}
              {!spinning && !result && (
                <m.div key="idle" initial={false} className="flex h-full flex-col">
                  {locked ? (
                    <>
                      <p className="flex items-center gap-2 text-xs font-medium text-muted">
                        <Lock aria-hidden className="size-3.5" /> Locked
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">No spins yet</p>
                      <p className="mt-1 text-sm text-muted">Finish a loading bar to earn one. No shortcuts.</p>
                      <div className="mt-auto pt-5">
                        <Link
                          href="/session"
                          className="btn-play inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <Play aria-hidden className="size-4 fill-current" /> Start a session
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-muted">Ready</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {spinsEarned} spin{spinsEarned > 1 ? "s" : ""} earned
                      </p>
                      <p className="mt-1 text-sm text-muted">You worked for it. Go on.</p>
                      <div className="mt-auto pt-5">
                        <Button variant="play" onClick={spin}>
                          Spin
                        </Button>
                      </div>
                    </>
                  )}
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid shrink-0 gap-4 sm:grid-cols-2">
            <div className="panel p-4">
              <p className="mb-2.5 text-xs font-medium text-muted">Drop rates</p>
              <ul className="space-y-1.5 text-[13px]">
                {(Object.keys(ODDS) as WheelKind[]).map((k) => (
                  <li key={k} className="grid grid-cols-[5.5rem_1fr_2.8rem] items-center gap-2">
                    <span className={`truncate font-medium ${k === "secret" ? "text-secret" : ""}`} style={k === "secret" ? undefined : { color: RARITY[k].hex }}>
                      {k === "freeze" ? "Freeze" : k === "cosmetic" ? "Skin" : RARITY[k].label}
                    </span>
                    <span aria-hidden className="h-1.5 overflow-hidden bg-white/[0.06]">
                      <span
                        className="block h-full"
                        style={{ width: `${Math.max(2, (ODDS[k] / 0.3) * 100)}%`, background: RARITY[k].gradient ?? RARITY[k].hex }}
                      />
                    </span>
                    <span className="text-right text-muted tabular-nums">{+(ODDS[k] * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel p-4">
              <p className="mb-2.5 text-xs font-medium text-muted">Recent pulls</p>
              {history.length === 0 ? (
                <p className="text-sm text-faint">Nothing yet</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {history.slice(0, 6).map((h) => (
                    <li key={h.n} className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center">
                        <PullIcon pull={h} small />
                      </span>
                      <span className={`truncate ${h.tier === "secret" ? "text-secret" : ""}`} style={h.tier === "secret" ? undefined : { color: RARITY[h.tier].hex }}>
                        {h.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

function PullIcon({ pull, small = false }: { pull: Pull; small?: boolean }) {
  if (pull.avatar) return <PetAvatar avatar={pull.avatar} size={small ? 24 : 84} />
  if (pull.kind === "freeze") return <Snowflake className={small ? "size-4 text-freeze" : "size-10 text-freeze"} />
  const c = pull.cosmetic
  if (c && !small) {
    if (c.kind === "bar") return <SkinBar skin={c.id} preview={0.7} className="h-4 w-16" />
    if (c.kind === "theme") {
      const [bg, panel, accent, play] = THEME_SWATCH[c.id]
      return (
        <span className="grid size-16 grid-cols-2 gap-1 p-1.5" style={{ background: bg }}>
          <span style={{ background: panel }} />
          <span style={{ background: accent }} />
          <span style={{ background: play }} />
          <span style={{ background: panel }} />
        </span>
      )
    }
  }
  return <SwatchBook className={small ? "size-4 text-[#3ddbd9]" : "size-10 text-[#3ddbd9]"} />
}
