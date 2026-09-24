"use client"

import { memo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import { ChevronsUp, Coins, Flame, HandCoins, Hourglass, Timer } from "lucide-react"
import { FLAME_TIERS, PET_POOL, RARITIES, RARITY, flameTier } from "@/lib/data"
import { fmtMoney, fmtShort } from "@/lib/format"
import { motionTokens } from "@/lib/motion-tokens"
import { MAX_PET_LEVEL, baseRate, collect, multiplier, petRate, streakOf, totalRate, upgradeCost, upgradePet, useStore, waitingOnPads, type OwnedPet } from "@/lib/store"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { Button } from "../Button"
import { PageFrame } from "../PageFrame"
import { PetAvatar } from "../PetAvatar"
import { Tabs, tabPanel } from "../Tabs"

type Pop = { id: number; amount: number }
let popSeq = 0

export function Pets() {
  const pets = useStore((s) => s.pets)
  const lastPull = useStore((s) => s.lastPullUid)
  const balance = useStore((s) => s.balance)
  const base = useStore(baseRate)
  const mult = useStore(multiplier)
  const rate = useStore(totalRate)
  const weeks = useStore((s) => streakOf(s).current)
  const [view, setView] = useState<"base" | "book">("base")
  const waiting = useStore(waitingOnPads)
  const duration = useStore((s) => s.duration)

  const collectAll = () => {
    const amount = collect()
    if (amount < 1) return
    sfx.coin()
    fx.emit({ kind: "burst", palette: "phosphor", power: Math.min(160, 30 + Math.log10(amount) * 20) })
  }

  return (
    <PageFrame
      eyebrow="Base"
      title="Your pets"
      subtitle="Pets only earn while a session is running. When you finish, each pet's earnings land on its pad. Collect them here."
      actions={
        <>
          <Tabs
            id="pets"
            label="View"
            value={view}
            onChange={setView}
            options={[
              { id: "base", label: "Base" },
              { id: "book", label: "Collection" },
            ]}
          />
          <Button variant="play" onClick={collectAll} disabled={waiting < 1}>
            <HandCoins aria-hidden className="size-4" /> Collect all · ${fmtShort(waiting)}
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col gap-4">
        <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<Coins className="size-3.5 text-gold" />} label="Wallet" value={fmtMoney(balance)} />
          <Stat icon={<Hourglass className="size-3.5 text-accent" />} label="Waiting on pads" value={`$${fmtShort(waiting)}`} accent />
          <Stat
            icon={<Flame className="size-3.5 text-[#f97316]" />}
            label="Earning rate"
            value={`$${fmtShort(rate)}/s`}
            hint={
              <>
                ${fmtShort(base)}/s ×{" "}
                <Link href="/progress?tab=streak" className="underline-offset-2 hover:underline">
                  {FLAME_TIERS[flameTier(weeks)].name} x{mult.toFixed(2)}
                </Link>
              </>
            }
          />
          <Stat
            icon={<Timer className="size-3.5 text-accent" />}
            label={`Next ${duration} min session`}
            value={fmtMoney(rate * duration * 60)}
            hint={<Link href="/session" className="text-accent hover:underline">Start one →</Link>}
          />
        </div>

        <div {...tabPanel("pets", view)} className="flex min-h-0 flex-1 flex-col">
          {view === "book" ? (
            <Collection />
          ) : (
          <ul aria-label="Your pets" className="scroll-thin grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto pr-1 pb-1 md:grid-cols-3 xl:grid-cols-5">
            {pets.map((p, i) => (
              <PetPlot key={p.uid} pet={p} index={i} mult={mult} fresh={p.uid === lastPull} />
            ))}
            <li className="flex min-h-[270px] flex-col items-center justify-center rounded-lg border border-dashed border-line-2 p-4 text-center">
              <p className="text-sm font-medium text-muted">Empty pad</p>
              <p className="mt-1 text-xs text-faint">Finish a session, then spin to fill it.</p>
              <Link href="/wheel" className="mt-3 text-sm font-semibold text-accent hover:underline">
                Go to wheel →
              </Link>
            </li>
          </ul>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

function Stat({ icon, label, value, hint, accent = false }: { icon: React.ReactNode; label: string; value: string; hint?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="panel px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon} {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${accent ? "text-go-2" : ""}`}>{value}</p>
      {hint && <p className="text-xs text-faint tabular-nums">{hint}</p>}
    </div>
  )
}

const PetPlot = memo(function PetPlot({ pet, index, mult, fresh }: { pet: OwnedPet; index: number; mult: number; fresh: boolean }) {
  const balance = useStore((s) => s.balance)
  const cost = upgradeCost(pet)
  const maxed = pet.level >= MAX_PET_LEVEL
  const reduce = useReducedMotion()
  const [pops, setPops] = useState<Pop[]>([])
  const r = RARITY[pet.rarity]
  const high = pet.rarity === "legendary" || pet.rarity === "mythic" || pet.rarity === "secret"

  const onCollect = () => {
    const amount = collect(pet.uid)
    if (amount < 1) return
    sfx.coin()
    setPops((list) => [...list.slice(-3), { id: ++popSeq, amount }])
  }

  return (
    <m.li
      initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay: reduce ? 0 : Math.min(index, 10) * 0.03 }}
      className="relative flex flex-col items-center overflow-hidden rounded-lg border p-3"
      style={{
        borderColor: fresh ? "var(--color-accent)" : high ? `${r.hex}66` : "var(--color-line)",
        background: `radial-gradient(120% 70% at 50% 0%, ${r.hex}22, transparent 62%), linear-gradient(180deg, var(--color-panel-2), var(--color-panel))`,
        boxShadow: high ? `0 0 34px -8px ${r.hex}77` : undefined,
      }}
    >
      {fresh && <span className="absolute top-2.5 left-2.5 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-bold text-bg">NEW</span>}
      <span className="absolute top-2.5 right-2.5 rounded-sm bg-black/30 px-1.5 py-0.5 text-[10px] font-bold text-muted tabular-nums">
        LV {pet.level}
      </span>

      {/* Overhead labels, Steal-a-Brainrot style */}
      <p className="mt-1 max-w-full truncate text-center text-[15px] font-semibold">{pet.name}</p>
      <p
        className={`mt-1 rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase ${pet.rarity === "secret" ? "text-secret" : ""}`}
        style={{ color: pet.rarity === "secret" ? undefined : r.hex, background: `${r.hex}1f` }}
      >
        {r.label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-go-2 tabular-nums">${fmtShort(petRate(pet) * mult)}/s</p>

      {/* Body on its pedestal */}
      <div className="relative mt-1 flex h-28 w-full items-end justify-center">
        <div className="bob relative z-10" style={{ animationDelay: `${(index % 5) * -0.55}s` }}>
          <PetAvatar avatar={pet.avatar} size={112} />
        </div>
        <AnimatePresence>
          {pops.map((p) => (
            <m.span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute top-0 z-20 text-xl font-bold text-go-2 drop-shadow-[0_2px_8px_rgb(0_0_0/0.6)]"
              initial={{ opacity: 0, y: 0, scale: motionTokens.scale.subtle }}
              animate={{ opacity: [0, 1, 1, 0], y: reduce ? 0 : -56, scale: 1.1 }}
              transition={{ duration: motionTokens.duration.crawl * 1.3, ease: motionTokens.easing.smooth }}
              onAnimationComplete={() => setPops((list) => list.filter((x) => x.id !== p.id))}
            >
              +${fmtShort(p.amount)}
            </m.span>
          ))}
        </AnimatePresence>
      </div>
      <div aria-hidden className="-mt-2 h-2.5 w-[70%] rounded-[50%]" style={{ background: `${r.hex}55`, boxShadow: `0 0 18px ${r.hex}55` }} />

      {/* Cash pad: what this pet actually earned in finished sessions */}
      <button
        type="button"
        onClick={onCollect}
        disabled={pet.stash < 1}
        aria-label={`Collect $${Math.floor(pet.stash)} from ${pet.name}`}
        className="group mt-3 flex w-full cursor-pointer items-center justify-between rounded-md border border-line bg-black/25 px-3 py-2 transition-colors duration-200 hover:border-go/60 hover:bg-go/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-black/25"
      >
        <span className="text-xs font-medium text-muted group-hover:text-fg">Collect</span>
        <span className="text-lg font-semibold tabular-nums">${fmtShort(pet.stash)}</span>
      </button>
      <div className="mt-1.5 flex w-full items-center justify-between gap-2">
        <span className="text-[11px] text-faint tabular-nums">Lifetime ${fmtShort(pet.earned)}</span>
        <button
          type="button"
          disabled={maxed || balance < cost}
          onClick={() => {
            if (upgradePet(pet.uid)) sfx.levelUp()
          }}
          title={maxed ? "Max level" : `Level ${pet.level + 1}: +20% base $/s`}
          className="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-line px-2 text-[11px] font-semibold text-muted transition-colors duration-200 hover:border-accent/60 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsUp aria-hidden className="size-3.5" />
          {maxed ? "Max" : `$${fmtShort(cost)}`}
        </button>
      </div>
    </m.li>
  )
})

/** Every pet in the game: discovered ones in full color, the rest as silhouettes. */
function Collection() {
  const pets = useStore((s) => s.pets)
  const owned = new Map<string, number>()
  pets.forEach((p) => owned.set(p.name, (owned.get(p.name) ?? 0) + 1))
  const found = PET_POOL.filter((p) => owned.has(p.name)).length
  return (
    <div className="panel scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
      <p className="mb-3 text-xs text-muted">
        {found} / {PET_POOL.length} discovered
      </p>
      <div className="space-y-4">
        {RARITIES.map((r) => {
          const list = PET_POOL.filter((p) => p.rarity === r)
          return (
            <section key={r}>
              <p
                className={`mb-2 text-[11px] font-bold tracking-[0.14em] uppercase ${r === "secret" ? "text-secret" : ""}`}
                style={r === "secret" ? undefined : { color: RARITY[r].hex }}
              >
                {RARITY[r].label}
              </p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-8">
                {list.map((p) => {
                  const n = owned.get(p.name) ?? 0
                  return (
                    <li key={p.name} className="flex flex-col items-center rounded-md border border-line bg-white/[0.02] p-2 text-center">
                      <div style={n ? undefined : { filter: "brightness(0)", opacity: 0.35 }}>
                        <PetAvatar avatar={p.avatar} size={64} />
                      </div>
                      <p className="mt-1 w-full truncate text-xs font-semibold">{n ? p.name : "???"}</p>
                      <p className="text-[11px] text-faint tabular-nums">{n ? `×${n} · $${fmtShort(p.rate)}/s` : "Not found"}</p>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
