"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import {
  Check,
  Coins,
  Database,
  Megaphone,
  Ticket,
  Download,
  ImagePlus,
  Users,
  Flame,
  Gauge,
  Lock,
  Music2,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Rows3,
  ShieldCheck,
  Sparkles,
  SwatchBook,
  Trash2,
  Upload,
} from "lucide-react"
import { COSMETICS, THEME_FONT, THEME_SWATCH, isUnlocked, navOf, sourceLabel, type Cosmetic, type CosmeticKind } from "@/lib/cosmetics"
import { LOADING_LINES, ODDS, PET_POOL, RARITY, type WheelKind } from "@/lib/data"
import { setAnnouncement } from "@/lib/inbox"
import { dayKey } from "@/lib/dates"
import { fmtMoney } from "@/lib/format"
import { motionTokens, springs } from "@/lib/motion-tokens"
import { music, useMusic } from "@/lib/music"
import { applySave, serialize } from "@/lib/persist"
import {
  SESSION_SPEEDS,
  effectiveEquipped,
  equip,
  fillPads,
  grantAllPets,
  isAdmin,
  maxAllPets,
  logSessionOn,
  ownEverything,
  releaseAllPets,
  resetProgress,
  simulateGoodWeeks,
  spawnPet,
  store,
  unlockCtx,
  useStore,
} from "@/lib/store"
import { toast } from "@/lib/toast"
import { sfx } from "@/lib/audio"
import { Button } from "../Button"
import { PageFrame } from "../PageFrame"
import { SkinBar } from "../SkinBar"
import { DurationPicker } from "../DurationPicker"
import { ScaledPreview } from "../ScaledPreview"
import { LoadingScreen } from "../screens"
import { SpinningCD } from "../MiniPlayer"
import { SPEED_LABEL } from "./Session"

const TABS = [
  { id: "bar", label: "Loading bar", icon: Rows3 },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "screen", label: "Loading screen", icon: SwatchBook },
  { id: "session", label: "Session", icon: Gauge },
  { id: "audio", label: "Audio & music", icon: Music2 },
  { id: "data", label: "Data", icon: Database },
  { id: "admin", label: "Admin", icon: ShieldCheck, admin: true },
] as const
type Tab = (typeof TABS)[number]["id"]

export function Settings() {
  const [tab, setTab] = useState<Tab>("bar")
  const admin = useStore(isAdmin)
  const tabs = TABS.filter((t) => !("admin" in t) || admin)
  const current = tab === "admin" && !admin ? "bar" : tab

  return (
    <PageFrame
      eyebrow="Settings"
      title="Customize"
      subtitle="Skins, themes and loading screens drop from the wheel; some unlock with streaks. Pick what you've earned."
      actions={
        admin ? (
          <span className="flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-xs font-semibold text-gold">
            <ShieldCheck aria-hidden className="size-3.5" /> Admin
          </span>
        ) : undefined
      }
    >
      <div className="grid h-full gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={current === id ? "page" : undefined}
              className={`flex h-10 shrink-0 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
                current === id ? "bg-accent/15 text-fg" : "text-muted hover:bg-white/[0.05] hover:text-fg"
              } ${id === "admin" ? "text-gold" : ""}`}
            >
              <Icon aria-hidden className={`size-4 ${current === id ? "text-accent" : ""}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="panel scroll-thin min-h-0 overflow-y-auto p-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
            >
              {(current === "bar" || current === "theme" || current === "screen") && <CosmeticGrid kind={current} />}
              {current === "session" && <SessionSettings />}
              {current === "audio" && <AudioSettings />}
              {current === "data" && <DataSettings />}
              {current === "admin" && admin && <AdminSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageFrame>
  )
}

// ---------- cosmetics ----------
function CosmeticGrid({ kind }: { kind: CosmeticKind }) {
  const s = useStore((st) => st)
  const ctx = unlockCtx(s)
  const active = effectiveEquipped(s)[kind]
  const items = COSMETICS.filter((c) => c.kind === kind)
  const owned = items.filter((c) => isUnlocked(c, ctx)).length
  return (
    <>
      <p className="mb-3 text-xs text-muted">
        {owned} / {items.length} unlocked{ctx.unlockAll && " · admin unlock-all is on"}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => (
          <CosmeticCard key={c.id} c={c} unlocked={isUnlocked(c, ctx)} equipped={active === c.id} bestStreak={ctx.bestStreak} />
        ))}
      </ul>
    </>
  )
}

function CosmeticCard({ c, unlocked, equipped, bestStreak }: { c: Cosmetic; unlocked: boolean; equipped: boolean; bestStreak: number }) {
  const r = RARITY[c.rarity]
  const lockHint = c.source.type === "streak" ? `Reach a ${c.source.weeks}-week streak (best: ${bestStreak})` : "Win it on the wheel"
  return (
    <li>
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => {
          equip(c.kind, c.id)
          sfx.blip()
        }}
        aria-pressed={equipped}
        className={`group flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${
          equipped ? "border-accent/70 bg-accent/[0.08]" : "border-line bg-white/[0.02] hover:border-line-2"
        }`}
      >
        <div className={`relative ${unlocked ? "" : "opacity-40 grayscale"}`}>
          <Preview c={c} />
          {equipped && (
            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-bg">
              <Check aria-hidden className="size-3" /> EQUIPPED
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="mt-0.5 text-xs text-muted">{c.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={`text-[11px] font-bold tracking-wide uppercase ${c.rarity === "secret" ? "text-secret" : ""}`}
              style={c.rarity === "secret" ? undefined : { color: r.hex }}
            >
              {r.label}
            </p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-faint">
              {c.source.type === "streak" && <Flame aria-hidden className="size-3" />}
              {c.source.type === "wheel" && <Sparkles aria-hidden className="size-3" />}
              {sourceLabel(c.source)}
            </p>
          </div>
        </div>
        {!unlocked && (
          <p className="flex items-center gap-1.5 border-t border-line px-3 py-2 text-xs text-muted">
            <Lock aria-hidden className="size-3.5" /> {lockHint}
          </p>
        )}
      </button>
    </li>
  )
}

function Preview({ c }: { c: Cosmetic }) {
  if (c.kind === "bar") {
    return (
      <div className="flex h-20 items-center bg-black/25 px-4">
        <SkinBar skin={c.id} preview={0.64} className="h-6 w-full" />
      </div>
    )
  }
  if (c.kind === "theme") {
    const [bg, panel, accent, play] = THEME_SWATCH[c.id]
    // A tiny mock of the layout: where the tabs go, and the theme's font.
    const nav = navOf(c.id)
    const dir = { top: "flex-col", bottom: "flex-col-reverse", left: "flex-row", right: "flex-row-reverse" }[nav]
    return (
      <div className={`flex h-20 gap-1.5 p-2 ${dir}`} style={{ background: bg }}>
        <div className={`shrink-0 rounded-[2px] opacity-70 ${nav === "left" || nav === "right" ? "w-3" : "h-1.5"}`} style={{ background: accent }} />
        <div className="flex min-h-0 min-w-0 flex-1 gap-1.5">
          <div className="min-w-0 flex-1 rounded-[2px] px-2 py-1.5" style={{ background: panel }}>
            <p className="truncate text-[15px] leading-none font-semibold" style={{ color: accent, fontFamily: THEME_FONT[c.id] ?? "var(--font-geist)" }}>
              Aa Loading
            </p>
            <div className="mt-2 h-3.5 w-12 rounded-[2px]" style={{ background: play }} />
          </div>
          <div className="w-1/4 rounded-[2px]" style={{ background: panel }} />
        </div>
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

// ---------- session ----------
function SessionSettings() {
  const lines = useStore((s) => s.showLoadingLines)
  const goal = useStore((s) => s.dailyGoal)
  return (
    <div className="grid max-w-3xl gap-6">
      <Field title="Default length">
        <div className="max-w-md">
          <DurationPicker compact />
        </div>
      </Field>
      <Field title="Daily goal" hint="How many sessions you aim for each day. Shown on the home screen.">
        <Stepper value={goal} min={1} max={12} onChange={(v) => store.set({ dailyGoal: v })} suffix="sessions / day" />
      </Field>
      <Field title="Loading screen">
        <Toggle label="Show joke loading lines" on={lines} onChange={(v) => store.set({ showLoadingLines: v })} />
      </Field>
    </div>
  )
}

// ---------- audio & music ----------
function AudioSettings() {
  const sound = useStore((s) => s.soundOn)
  const visible = useStore((s) => s.musicVisible)
  const { tracks, index, playing, covers } = useMusic()
  const [dropRow, setDropRow] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const add = async (files: FileList | File[]) => {
    const img = Array.from(files).find((f) => f.type.startsWith("image/"))
    if (img) {
      const t = tracks[index]
      toast((await music.setCover(t.id, img)) ? { title: `Cover set for "${t.title}"`, body: "Drop onto a specific track to choose which one.", tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
      if (!Array.from(files).some((f) => f.type.startsWith("audio/"))) return
    }
    const n = await music.addFiles(files, false)
    toast(n ? { title: `Added ${n} track${n > 1 ? "s" : ""}`, body: "Saved in this browser's storage.", tone: "ok" } : { title: "No audio files found", body: "Drop mp3, m4a, wav, ogg or flac files (max 80 MB each).", tone: "err" })
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Field title="Sound effects" hint="Wheel ticks, chimes and UI sounds.">
        <Toggle label="Sound effects" on={sound} onChange={(v) => store.set({ soundOn: v })} />
      </Field>
      <Field title="Music player" hint="Shown bottom-center, including during sessions. P plays/pauses from anywhere.">
        <Toggle label="Show the mini player" on={visible} onChange={(v) => store.set({ musicVisible: v })} />
      </Field>
      <Field title="Your music" hint="Drop several audio files at once, or drop an image onto a track for its cover art. Everything is stored in this browser.">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void add(e.dataTransfer.files)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
            over ? "border-accent bg-accent/10" : "border-line-2 hover:border-accent/60"
          }`}
        >
          <Upload aria-hidden className={`size-6 ${over ? "text-accent" : "text-muted"}`} />
          <p className="mt-2 font-semibold">{over ? "Drop to add" : "Drop audio files or a cover image here"}</p>
          <p className="text-xs text-muted">or click to choose several files</p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void add(e.target.files)
              e.target.value = ""
            }}
          />
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {tracks.map((t, i) => {
            const current = i === index
            return (
              <li
                key={t.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropRow(t.id)
                }}
                onDragLeave={() => setDropRow((r) => (r === t.id ? null : r))}
                onDrop={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDropRow(null)
                  const img = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"))
                  if (!img) return toast({ title: "Drop an image to use as cover art", tone: "err" })
                  toast((await music.setCover(t.id, img)) ? { title: `Cover set for "${t.title}"`, tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
                }}
                className={`flex items-center gap-3 px-3 py-2 transition-colors duration-150 ${
                  dropRow === t.id ? "bg-accent/15 outline-2 -outline-offset-2 outline-accent outline-dashed" : current ? "bg-accent/[0.06]" : ""
                }`}
              >
                <SpinningCD hue={t.hue} playing={current && playing} size={28} image={covers[t.id]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-faint">
                    {t.kind === "gen" ? "Built-in station" : "Your file"}
                    {dropRow === t.id ? " · drop to set cover" : covers[t.id] ? " · has cover" : " · drop an image here for cover art"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => (current ? music.toggle() : music.playIndex(i))}
                  aria-label={current && playing ? `Pause ${t.title}` : `Play ${t.title}`}
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-white/[0.07] hover:text-fg"
                >
                  {current && playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <label
                  title="Cover art"
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-white/[0.07] hover:text-fg"
                >
                  <ImagePlus className="size-4" aria-label={`Cover art for ${t.title}`} />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ""
                      if (f) toast((await music.setCover(t.id, f)) ? { title: "Cover added", tone: "ok" } : { title: "Use an image under 10 MB", tone: "err" })
                    }}
                  />
                </label>
                {t.kind === "file" && (
                  <button
                    type="button"
                    onClick={() => void music.remove(t.id)}
                    aria-label={`Remove ${t.title}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-md text-muted hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-faint">Spotify needs its own developer app and login, so it's on the roadmap.</p>
      </Field>
    </div>
  )
}

// ---------- data ----------
function DataSettings() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const importRef = useRef<HTMLInputElement>(null)

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(serialize(store.get()), null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `loadingbar-save-${dayKey(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSave = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      if (!window.confirm("Replace your current progress with this save?")) return
      if (applySave(data)) toast({ title: "Save imported", tone: "ok" })
      else toast({ title: "That file isn't a LoadingBar save", tone: "err" })
    } catch {
      toast({ title: "Couldn't read that file", tone: "err" })
    }
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Field title="Account" hint={user ? "Your progress syncs to your account automatically." : "Playing as a guest: progress is saved in this browser only."}>
        {user ? (
          <p className="text-sm">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
        ) : (
          <Link href="/login" className="btn-primary inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold">
            Sign in or create an account
          </Link>
        )}
      </Field>
      <Field title="Backup" hint="Download your progress as a file, or restore it from one.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportSave}>
            <Download aria-hidden className="size-4" /> Export save
          </Button>
          <Button onClick={() => importRef.current?.click()}>
            <Upload aria-hidden className="size-4" /> Import save
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importSave(f)
              e.target.value = ""
            }}
          />
        </div>
      </Field>
      <Field title="Reset" hint="Wipes pets, money, spins, history and unlocks. Settings are kept.">
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm("Reset your progress? This can't be undone.")) return
            resetProgress()
            toast({ title: "Progress reset", tone: "info" })
            router.push("/")
          }}
        >
          <RotateCcw aria-hidden className="size-4" /> Reset progress
        </Button>
      </Field>
    </div>
  )
}

// ---------- admin ----------
const INCOME_BOOSTS = [1, 10, 100, 1000]

function AdminSettings() {
  const s = useStore((st) => st)
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

type AccountRow = { email: string; createdAt: number; savedAt: number | null; balance: number; pets: number; minutes: number }

/** Admin: every registered account with a summary of its cloud save, and tools to gift or reset. */
function Accounts() {
  const [rows, setRows] = useState<AccountRow[] | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { users?: AccountRow[] }) => alive && setRows(d.users ?? []))
      .catch(() => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [tick])

  const remove = async (email: string) => {
    if (!window.confirm(`Delete ${email} and their cloud save? This can't be undone.`)) return
    const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, { method: "DELETE" })
    toast(res.ok ? { title: `Deleted ${email}`, tone: "info" } : { title: "Couldn't delete that account", tone: "err" })
    setTick((t) => t + 1)
  }

  const gift = async (email: string, type: "money" | "spins" | "reset") => {
    let amount = 0
    if (type === "reset") {
      if (!window.confirm(`Reset all of ${email}'s progress? It happens the next time they open the app.`)) return
    } else {
      const raw = window.prompt(type === "money" ? `How much money for ${email}?` : `How many spins for ${email}?`, type === "money" ? "1000000" : "5")
      amount = Number((raw ?? "").replace(/[^0-9]/g, ""))
      if (!amount) return
    }
    const res = await fetch("/api/admin/gift", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, type, amount }) })
    toast(
      res.ok
        ? {
            title: type === "reset" ? `Reset queued for ${email}` : `Sent ${type === "money" ? fmtMoney(amount) : `${amount} spins`} to ${email}`,
            body: "Delivered the next time they're online.",
            tone: "gold",
          }
        : { title: "Couldn't send that", tone: "err" },
    )
  }

  const act = "grid size-7 cursor-pointer place-items-center rounded-md text-muted"
  return (
    <Field title="Accounts" hint="Everyone who signed up. Gifts and resets are delivered the next time that player is online. The admin account lives in .env.local and isn't listed.">
      {rows === null ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-faint">
          <Users aria-hidden className="size-4" /> No accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Last sync</th>
                <th className="px-3 py-2 text-right font-medium">Wallet</th>
                <th className="px-3 py-2 text-right font-medium">Pets</th>
                <th className="px-3 py-2 text-right font-medium">Focus</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.email}>
                  <td className="max-w-[14rem] truncate px-3 py-2 font-medium">{r.email}</td>
                  <td className="px-3 py-2 text-muted">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="px-3 py-2 text-muted">{r.savedAt ? new Date(r.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.balance)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.pets}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Math.round(r.minutes / 6) / 10}h</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-0.5">
                      <button type="button" onClick={() => void gift(r.email, "money")} aria-label={`Send money to ${r.email}`} title="Send money" className={`${act} hover:bg-gold/15 hover:text-gold`}>
                        <Coins className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => void gift(r.email, "spins")} aria-label={`Send spins to ${r.email}`} title="Send spins" className={`${act} hover:bg-accent/15 hover:text-accent`}>
                        <Ticket className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => void gift(r.email, "reset")} aria-label={`Reset ${r.email}'s progress`} title="Reset progress" className={`${act} hover:bg-danger/15 hover:text-danger`}>
                        <RotateCcw className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => void remove(r.email)} aria-label={`Delete ${r.email}`} title="Delete account" className={`${act} hover:bg-danger/15 hover:text-danger`}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Field>
  )
}

// ---------- bits ----------
function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 mb-3 text-sm text-muted">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex cursor-pointer items-center gap-3 rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-accent" : "bg-white/15"}`}>
        <motion.span layout transition={springs.snappy} className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${on ? "right-0.5" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  )
}

function Stepper({ value, min, max, onChange, suffix }: { value: number; min: number; max: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-md border border-line-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease" className="h-10 w-10 cursor-pointer text-lg hover:bg-white/[0.07]">
          −
        </button>
        <span className="w-10 text-center font-semibold tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase" className="h-10 w-10 cursor-pointer text-lg hover:bg-white/[0.07]">
          +
        </button>
      </div>
      <span className="text-sm text-muted">{suffix}</span>
    </div>
  )
}
