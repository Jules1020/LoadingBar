"use client"

import { useState } from "react"
import { Megaphone, ShieldCheck, Sparkles } from "lucide-react"
import { ODDS, PET_POOL, RARITY, type WheelKind } from "@/lib/data"
import { setAnnouncement } from "@/lib/inbox"
import { dayKey } from "@/lib/dates"
import { fmtMoney } from "@/lib/format"
import {
  SESSION_SPEEDS,
  fillPads,
  grantAllPets,
  maxAllPets,
  logSessionOn,
  ownEverything,
  releaseAllPets,
  simulateGoodWeeks,
  spawnPet,
  store,
  useStoreShallow,
} from "@/lib/store"
import { toast } from "@/lib/toast"
import { sfx } from "@/lib/audio"
import { Button } from "../../Button"
import { SPEED_LABEL } from "../Session"
import { Accounts } from "./Accounts"
import { Field, Toggle } from "./fields"

const INCOME_BOOSTS = [1, 10, 100, 1000]

export function AdminSettings() {
  const s = useStoreShallow((st) => ({
    unlockAll: st.unlockAll,
    freeShopping: st.freeShopping,
    infiniteSpins: st.infiniteSpins,
    incomeBoost: st.incomeBoost,
    rig: st.rig,
    sessionSpeed: st.sessionSpeed,
    balance: st.balance,
  }))
  const [date, setDate] = useState(() => dayKey(new Date()))
  const [minutes, setMinutes] = useState(25)
  const [balance, setBalance] = useState("")
  const [petName, setPetName] = useState(PET_POOL[PET_POOL.length - 1].name)
  const [petLevel, setPetLevel] = useState(10)
  const [announce, setAnnounce] = useState("")
  const give = (patch: Parameters<typeof store.set>[0], msg: string) => {
    store.set(patch)
    sfx.coin()
    toast({ title: msg, tone: "gold" })
  }
  const broadcast = async (text: string) => {
    const res = await fetch("/api/admin/announce", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) })
    if (!res.ok) return toast({ title: "Couldn't update the announcement", tone: "err" })
    setAnnouncement(text ? { text, at: Date.now() } : null)
    toast({ title: text ? "Announcement sent to every player" : "Announcement cleared", tone: "gold" })
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <p className="flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
        <ShieldCheck aria-hidden className="size-4 shrink-0" /> Only visible to the admin account. Everyone else plays by the normal rules.
      </p>

      <Field title="God mode" hint="Switches that bend the rules for this account only.">
        <div className="grid gap-3">
          <Toggle label="Unlock every cosmetic and profile item" on={s.unlockAll} onChange={(v) => store.set({ unlockAll: v })} />
          <Toggle label="Free shopping (the shop charges nothing)" on={s.freeShopping} onChange={(v) => store.set({ freeShopping: v })} />
          <Toggle label="Infinite wheel spins" on={s.infiniteSpins} onChange={(v) => store.set({ infiniteSpins: v })} />
        </div>
      </Field>

      <Field title="Income multiplier" hint="Stacks on top of the flame multiplier, for every pet.">
        <Segmented
          label="Income multiplier"
          value={s.incomeBoost}
          options={INCOME_BOOSTS.map((v) => ({ v, label: `×${v.toLocaleString("en-US")}` }))}
          onChange={(v) => store.set({ incomeBoost: v })}
        />
      </Field>

      <Field title="Rig the wheel" hint="Every spin lands on this until you set it back to random.">
        <select
          value={s.rig ?? ""}
          onChange={(e) => store.set({ rig: (e.target.value || null) as WheelKind | null })}
          aria-label="Rigged wheel result"
          className="h-10 rounded-md border border-line-2 bg-black/25 px-3 text-sm text-fg [color-scheme:dark]"
        >
          <option value="">Random (fair odds)</option>
          {(Object.keys(ODDS) as WheelKind[]).map((k) => (
            <option key={k} value={k}>
              Always {RARITY[k].label}
            </option>
          ))}
        </select>
      </Field>

      <Field title="Session speed" hint="Pets still earn for the full session length. You also get a Finish now button on the loading screen.">
        <Segmented
          label="Session speed"
          value={s.sessionSpeed}
          options={SESSION_SPEEDS.map((v) => ({ v, label: SPEED_LABEL[v] }))}
          onChange={(v) => store.set({ sessionSpeed: v })}
        />
      </Field>

      <Field title="Money & resources">
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={() => give((st) => ({ balance: st.balance + 1_000_000 }), "+$1,000,000")}>+$1M</Button>
          <Button onClick={() => give((st) => ({ balance: st.balance + 1_000_000_000 }), "+$1,000,000,000")}>+$1B</Button>
          <Button onClick={() => give((st) => ({ spinsEarned: st.spinsEarned + 50 }), "+50 wheel spins")}>+50 spins</Button>
          <Button onClick={() => give((st) => ({ freezeTokens: st.freezeTokens + 10 }), "+10 freezes")}>+10 freezes</Button>
          <Button onClick={() => give({ boostNext: true }, "Next session pays double")}>2× next session</Button>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const v = Number(balance.replace(/[^0-9.]/g, ""))
              if (!balance.trim() || !Number.isFinite(v)) return
              give({ balance: Math.max(0, Math.floor(v)) }, `Wallet set to ${fmtMoney(v)}`)
              setBalance("")
            }}
          >
            <label className="text-xs text-muted">
              Set wallet to
              <input
                inputMode="numeric"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder={fmtMoney(s.balance)}
                className="mt-1 block h-10 w-40 rounded-md border border-line-2 bg-black/25 px-2 text-sm text-fg"
              />
            </label>
            <Button type="submit">Set</Button>
          </form>
        </div>
      </Field>

      <Field title="Pets">
        <div className="flex flex-wrap items-end gap-2">
          <Button
            onClick={() => {
              const n = grantAllPets()
              sfx.chime("legendary")
              toast({ title: n ? `Added ${n} pets` : "You already own every pet", tone: "gold" })
            }}
          >
            Give me every pet
          </Button>
          <Button
            onClick={() => {
              maxAllPets()
              sfx.levelUp()
              toast({ title: "All pets at max level", tone: "gold" })
            }}
          >
            Max all pet levels
          </Button>
          <Button onClick={() => toast({ title: `Filled every pad with ${fmtMoney(fillPads(24))}`, body: "Collect it on the Pets page.", tone: "gold" })}>
            Fill pads (24 h of earnings)
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm("Release every pet except the three starters?")) return
              releaseAllPets()
              toast({ title: "Back to the starter pets", tone: "info" })
            }}
          >
            Release all pets
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            Spawn pet
            <select
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              className="mt-1 block h-10 rounded-md border border-line-2 bg-black/25 px-2 text-sm text-fg [color-scheme:dark]"
            >
              {PET_POOL.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} · {RARITY[p.rarity].label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Level
            <input
              type="number"
              min={1}
              max={10}
              value={petLevel}
              onChange={(e) => setPetLevel(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="mt-1 block h-10 w-20 rounded-md border border-line-2 bg-black/25 px-2 text-sm text-fg"
            />
          </label>
          <Button
            onClick={() => {
              if (!spawnPet(petName, petLevel)) return
              sfx.chime("legendary")
              toast({ title: `Spawned ${petName} (Lv ${petLevel})`, tone: "gold" })
            }}
          >
            Spawn
          </Button>
        </div>
      </Field>

      <Field title="Cosmetics" hint="Unlock-all is a switch; this makes you actually own everything, so it stays after you turn the switch off.">
        <Button
          onClick={() => {
            ownEverything()
            sfx.levelUp()
            toast({ title: "You own every cosmetic and profile item", tone: "gold" })
          }}
        >
          <Sparkles aria-hidden className="size-4" /> Own everything
        </Button>
      </Field>

      <Field title="Announcement" hint="A banner at the top of the app for every player, signed in or not.">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (announce.trim()) void broadcast(announce.trim())
          }}
        >
          <input
            value={announce}
            maxLength={200}
            onChange={(e) => setAnnounce(e.target.value)}
            placeholder="e.g. Double-pay weekend starts now!"
            aria-label="Announcement text"
            className="h-10 min-w-0 flex-1 rounded-md border border-line-2 bg-black/25 px-3 text-sm text-fg placeholder:text-faint"
          />
          <Button type="submit" variant="primary">
            <Megaphone aria-hidden className="size-4" /> Broadcast
          </Button>
          <Button type="button" onClick={() => void broadcast("")}>
            Clear
          </Button>
        </form>
      </Field>

      <Accounts />

      <Field title="Calendar" hint="Streaks come from real dates. These tools write fake history for testing.">
        <div className="flex flex-wrap items-end gap-2">
          <Button
            onClick={() => {
              simulateGoodWeeks(4)
              sfx.levelUp()
              toast({ title: "Added 4 good weeks before the current streak", tone: "gold" })
            }}
          >
            +4 good weeks
          </Button>
          <Button
            onClick={() => {
              simulateGoodWeeks(12)
              sfx.levelUp()
              toast({ title: "Added 12 good weeks", tone: "gold" })
            }}
          >
            +12 good weeks
          </Button>
          <label className="text-xs text-muted">
            Date
            <input
              type="date"
              value={date}
              max={dayKey(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block h-10 rounded-md border border-line-2 bg-black/25 px-2 text-sm text-fg [color-scheme:dark]"
            />
          </label>
          <label className="text-xs text-muted">
            Minutes
            <input
              type="number"
              min={1}
              max={180}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
              className="mt-1 block h-10 w-20 rounded-md border border-line-2 bg-black/25 px-2 text-sm text-fg"
            />
          </label>
          <Button
            onClick={() => {
              if (!date) return
              logSessionOn(date, minutes)
              toast({ title: `Logged a ${minutes} min session on ${date}`, tone: "gold" })
            }}
          >
            Log session
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm("Clear all session history? Streaks will reset.")) return
              store.set({ history: {}, frozenDays: [], sessions: [] })
              toast({ title: "History cleared", tone: "info" })
            }}
          >
            Clear history
          </Button>
        </div>
      </Field>
    </div>
  )
}

function Segmented<T extends number>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`h-10 cursor-pointer rounded-md border px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
            value === o.v ? "border-accent/60 bg-accent/15 text-fg" : "border-line bg-white/[0.03] text-muted hover:border-line-2 hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
