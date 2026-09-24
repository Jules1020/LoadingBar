"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronsUp, Coins, Rocket, Snowflake, UserRound } from "lucide-react"
import { COSMETICS, COSMETIC_PRICE, THEME_SWATCH, type Cosmetic, type CosmeticKind } from "@/lib/cosmetics"
import { LOADING_LINES, RARITY } from "@/lib/data"
import { fmtMoney, fmtShort } from "@/lib/format"
import {
  FREEZE_PRICE,
  MAX_PET_LEVEL,
  boostPrice,
  buyBoost,
  buyCosmetic,
  buyFreeze,
  equip,
  upgradeCost,
  useStore,
} from "@/lib/store"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { toast } from "@/lib/toast"
import { Button } from "../Button"
import { Chip, PageFrame } from "../PageFrame"
import { SkinBar } from "../SkinBar"
import { ScaledPreview } from "../ScaledPreview"
import { Tabs, tabPanel } from "../Tabs"
import { LoadingScreen } from "../screens"

const KINDS: { id: CosmeticKind; label: string }[] = [
  { id: "bar", label: "Bar skins" },
  { id: "theme", label: "Themes" },
  { id: "screen", label: "Loading screens" },
]

export function Shop() {
  const balance = useStore((s) => s.balance)
  const freezes = useStore((s) => s.freezeTokens)
  const boost = useStore((s) => s.boostNext)
  const bPrice = useStore(boostPrice)
  const pets = useStore((s) => s.pets)
  const [kind, setKind] = useState<CosmeticKind>("bar")

  const upgradable = pets.filter((p) => p.level < MAX_PET_LEVEL)
  const cheapest = upgradable.length ? Math.min(...upgradable.map(upgradeCost)) : 0

  const bought = (title: string) => {
    sfx.coin()
    fx.emit({ kind: "burst", palette: "phosphor", power: 40 })
    toast({ title, tone: "ok" })
  }
  const broke = () => {
    sfx.error()
    toast({ title: "Not enough money", body: "Finish sessions and collect from your pets' pads.", tone: "err" })
  }

  return (
    <PageFrame
      eyebrow="Shop"
      title="Spend what your pets earned"
      subtitle="Power-ups for your next sessions, pet upgrades, and cosmetics you haven't pulled yet. Spins still only come from finishing a session."
      actions={<Chip icon={Coins}>{fmtMoney(balance)}</Chip>}
    >
      <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="flex flex-col gap-3 lg:min-h-0">
          <p className="text-xs font-medium text-muted">Power-ups</p>
          <Offer
            icon={<Snowflake className="size-5 text-freeze" />}
            title="Streak freeze"
            body={`Covers one missed day. You have ${freezes}.`}
            price={FREEZE_PRICE}
            affordable={balance >= FREEZE_PRICE}
            onBuy={() => (buyFreeze() ? bought("Bought a streak freeze") : broke())}
          />
          <Offer
            icon={<Rocket className="size-5 text-accent" />}
            title="2× next session"
            body={boost ? "Active: your next finished session pays double." : "Your next finished session pays double. Priced from your current earning rate."}
            price={bPrice}
            affordable={balance >= bPrice}
            done={boost}
            onBuy={() => (buyBoost() ? bought("Boost active for your next session") : broke())}
          />
          <div className="panel flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/[0.05]">
              <ChevronsUp className="size-5 text-go-2" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Pet upgrades</p>
              <p className="text-sm text-muted">
                +20% base $/s per level, up to level {MAX_PET_LEVEL}.
                {cheapest > 0 && ` Cheapest: $${fmtShort(cheapest)}.`}
              </p>
            </div>
            <Link href="/pets" className="text-sm font-semibold text-accent hover:underline">
              Upgrade →
            </Link>
          </div>
          <div className="panel flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/[0.05]">
              <UserRound className="size-5 text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Profile items</p>
              <p className="text-sm text-muted">Animated backgrounds, avatar frames and name styles.</p>
            </div>
            <Link href="/profile" className="text-sm font-semibold text-accent hover:underline">
              Browse →
            </Link>
          </div>
        </div>

        <div className="panel flex flex-col p-4 lg:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">Cosmetics</p>
            <Tabs id="shop" label="Cosmetic type" value={kind} onChange={setKind} options={KINDS} />
          </div>
          <div {...tabPanel("shop", kind)} className="flex min-h-0 flex-1 flex-col">
            <CosmeticShelf kind={kind} onBought={bought} onBroke={broke} />
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

function Offer({
  icon,
  title,
  body,
  price,
  affordable,
  done = false,
  onBuy,
}: {
  icon: React.ReactNode
  title: string
  body: string
  price: number
  affordable: boolean
  done?: boolean
  onBuy: () => void
}) {
  return (
    <div className="panel flex items-center gap-4 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/[0.05]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">{body}</p>
      </div>
      <Button variant={done ? "secondary" : "play"} disabled={done || !affordable} onClick={onBuy}>
        {done ? (
          <>
            <Check aria-hidden className="size-4" /> Active
          </>
        ) : (
          `$${fmtShort(price)}`
        )}
      </Button>
    </div>
  )
}

function CosmeticShelf({ kind, onBought, onBroke }: { kind: CosmeticKind; onBought: (t: string) => void; onBroke: () => void }) {
  const owned = useStore((s) => s.ownedCosmetics)
  const balance = useStore((s) => s.balance)
  const items = COSMETICS.filter((c) => c.kind === kind && c.source.type === "wheel")
  return (
    <ul className="scroll-thin mt-3 grid min-h-0 flex-1 auto-rows-max gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((c) => {
        const have = owned.includes(c.id)
        const price = COSMETIC_PRICE[c.rarity]
        return (
          <li key={c.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-white/[0.02]">
            <Preview c={c} />
            <div className="flex flex-1 items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p
                  className={`text-[11px] font-bold tracking-wide uppercase ${c.rarity === "secret" ? "text-secret" : ""}`}
                  style={c.rarity === "secret" ? undefined : { color: RARITY[c.rarity].hex }}
                >
                  {RARITY[c.rarity].label}
                </p>
              </div>
              {have ? (
                <Button size="sm" onClick={() => equip(c.kind, c.id)}>
                  <Check aria-hidden className="size-3.5" /> Equip
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="play"
                  disabled={balance < price}
                  onClick={() => (buyCosmetic(c.id) ? onBought(`Bought ${c.name}`) : onBroke())}
                >
                  ${fmtShort(price)}
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Preview({ c }: { c: Cosmetic }) {
  if (c.kind === "bar") {
    return (
      <div className="flex h-16 items-center bg-black/25 px-4">
        <SkinBar skin={c.id} preview={0.64} className="h-5 w-full" />
      </div>
    )
  }
  if (c.kind === "theme") {
    const [bg, panel, accent, play] = THEME_SWATCH[c.id]
    return (
      <div className="flex h-16 gap-2 p-2.5" style={{ background: bg }}>
        <div className="flex-1 rounded-sm p-2" style={{ background: panel }}>
          <div className="h-1.5 w-2/3 rounded-sm" style={{ background: accent }} />
          <div className="mt-2 h-3.5 w-10 rounded-sm" style={{ background: play }} />
        </div>
        <div className="w-1/3 rounded-sm" style={{ background: panel }} />
      </div>
    )
  }
  return (
    <ScaledPreview className="app-bg relative aspect-video w-full">
      <div className="app-bg h-full w-full">
        <LoadingScreen id={c.id} skin="bar-classic" line={LOADING_LINES[2]} preview={{ p: 0.46, gbps: 13.6, earned: 4280 }} />
      </div>
    </ScaledPreview>
  )
}
