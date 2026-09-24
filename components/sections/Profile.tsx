"use client"

import { useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { Award, Check, Coins, Flame, ImagePlus, Lock, PawPrint, Sparkles, Timer, Trash2, Type as TypeIcon, UserRound, Wand2 } from "lucide-react"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { PET_POOL, RARITY } from "@/lib/data"
import { fmtMoney } from "@/lib/format"
import { motionTokens } from "@/lib/motion-tokens"
import {
  LEVEL_COLORS,
  PROFILE_ITEMS,
  PROFILE_LIMITS,
  PROFILE_PRICE,
  profileLevel,
  type Profile as ProfileT,
  type ProfileItem,
  type ProfileKind,
} from "@/lib/profile"
import {
  buyProfileItem,
  effectiveProfile,
  equipProfileItem,
  ownsProfileItem,
  petRate,
  setProfile,
  store,
  streakOf,
  useStore,
  useStoreShallow,
  type OwnedPet,
} from "@/lib/store"
import { sfx } from "@/lib/audio"
import { fx } from "@/lib/fx"
import { toast } from "@/lib/toast"
import { useOffscreenPause } from "@/lib/hooks"
import { Chip, PageFrame } from "../PageFrame"
import { PetAvatar } from "../PetAvatar"
import { ProfileAvatar } from "../ProfileAvatar"

const TABS = [
  { id: "edit", label: "Edit", icon: UserRound },
  { id: "background", label: "Backgrounds", icon: Sparkles },
  { id: "frame", label: "Frames", icon: Wand2 },
  { id: "name", label: "Name styles", icon: TypeIcon },
  { id: "showcase", label: "Showcase", icon: PawPrint },
] as const
type Tab = (typeof TABS)[number]["id"]

export function Profile() {
  const balance = useStore((s) => s.balance)
  const [tab, setTab] = useState<Tab>("edit")
  return (
    <PageFrame
      eyebrow="Profile"
      title="Your profile"
      subtitle="Make it yours. Animated backgrounds, avatar frames and name styles are bought with what your pets earn."
      actions={<Chip icon={Coins}>{fmtMoney(balance)}</Chip>}
    >
      <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="scroll-thin min-h-0 overflow-y-auto">
          <ProfileCard />
        </div>
        <div className="panel flex min-h-[420px] flex-col overflow-hidden lg:min-h-0">
          <nav aria-label="Profile sections" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-line p-1.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent ${
                  tab === id ? "bg-accent/15 text-fg" : "text-muted hover:bg-white/[0.05] hover:text-fg"
                }`}
              >
                <Icon aria-hidden className={`size-4 ${tab === id ? "text-accent" : ""}`} />
                {label}
              </button>
            ))}
          </nav>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
              >
                {tab === "edit" && <EditTab />}
                {(tab === "background" || tab === "frame" || tab === "name") && <ItemShop kind={tab} />}
                {tab === "showcase" && <ShowcaseTab />}
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

// ---------- the card everyone sees ----------
function ProfileCard() {
  const p = useStore(effectiveProfile)
  const streak = useStore(streakOf)
  const s = useStoreShallow((st) => ({ user: st.user, history: st.history, achievements: st.achievements, pets: st.pets, sessionRunning: st.sessionRunning }))
  const name = p.name || s.user?.email.split("@")[0] || "Guest"
  const minutes = Object.values(s.history).reduce((n, d) => n + d.minutes, 0)
  const sessions = Object.values(s.history).reduce((n, d) => n + d.sessions, 0)
  const lv = profileLevel(minutes, s.achievements.length)
  const dex = new Set(s.pets.map((x) => x.name)).size
  const showcase = p.showcase.map((uid) => s.pets.find((x) => x.uid === uid)).filter((x): x is OwnedPet => !!x)
  const shown = showcase.length ? showcase : [...s.pets].sort((a, b) => petRate(b) - petRate(a)).slice(0, 3)
  const badges = ACHIEVEMENTS.filter((a) => s.achievements.includes(a.id))
  const vars = { "--c1": p.colors[0], "--c2": p.colors[1] } as React.CSSProperties

  return (
    <article className={`${p.background} panel min-h-full overflow-hidden`} style={vars} aria-label={`${name}'s profile`}>
      <div className="relative flex min-h-full flex-col bg-gradient-to-b from-black/10 via-black/35 to-black/75 p-5 text-white md:p-6">
        <div className="flex items-start gap-5">
          <ProfileAvatar profile={p} fallback={name} size={112} />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-3">
              <h2 className={`display min-w-0 truncate text-3xl font-bold tracking-tight ${p.nameStyle}`}>{name}</h2>
              <LevelBadge level={lv.level} />
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
              <span className={`size-2 rounded-full ${s.sessionRunning ? "bg-[#ff9f43]" : "bg-[#57f287]"}`} />
              {p.status || (s.user ? "Online" : "Playing as a guest")}
            </p>
            <div className="mt-3 max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full" style={{ width: `${Math.round(lv.progress * 100)}%`, background: `linear-gradient(90deg, ${p.colors[0]}, ${p.colors[1]})` }} />
              </div>
              <p className="mt-1 text-xs text-white/60">
                Level {lv.level} · {lv.toNext.toLocaleString("en-US")} XP to level {lv.level + 1}
              </p>
            </div>
          </div>
        </div>

        {p.bio && <p className="mt-5 max-w-prose text-[15px] leading-relaxed whitespace-pre-line text-white/90">{p.bio}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile icon={Flame} label="Streak" value={`${streak.current} wk`} hint={`best ${streak.best}`} />
          <StatTile icon={Timer} label="Focused" value={`${Math.round(minutes / 6) / 10} h`} hint={`${sessions} sessions`} />
          <StatTile icon={PawPrint} label="Pets" value={`${dex}`} hint={`of ${PET_POOL.length} found`} />
          <StatTile icon={Award} label="Badges" value={`${badges.length}`} hint={`of ${ACHIEVEMENTS.length}`} />
        </div>

        <section className="mt-5">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">{showcase.length ? "Pet showcase" : "Top pets"}</h3>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {shown.map((pet) => (
              <li key={pet.uid} className="flex flex-col items-center rounded-lg bg-black/30 px-2 pt-2 pb-3 backdrop-blur-sm">
                <PetAvatar avatar={pet.avatar} size={84} />
                <p className="mt-1 max-w-full truncate text-sm font-semibold">{pet.name}</p>
                <p className="text-[11px] font-bold tracking-wide uppercase" style={{ color: RARITY[pet.rarity].hex }}>
                  {RARITY[pet.rarity].label} · Lv {pet.level}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">Badges</h3>
          {badges.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <li
                  key={b.id}
                  title={`${b.name}: ${b.desc}`}
                  className="flex items-center gap-1.5 rounded-md bg-black/35 px-2 py-1 text-xs font-medium backdrop-blur-sm"
                >
                  <Award aria-hidden className="size-3.5 text-[#e4ae39]" /> {b.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/60">Finish sessions to earn your first badge.</p>
          )}
        </section>
      </div>
    </article>
  )
}

function LevelBadge({ level }: { level: number }) {
  const color = LEVEL_COLORS[Math.floor(level / 10) % LEVEL_COLORS.length]
  return (
    <span
      title={`Level ${level}`}
      className="grid size-9 shrink-0 place-items-center rounded-full border-2 bg-black/40 text-sm font-bold tabular-nums"
      style={{ borderColor: color, boxShadow: `0 0 12px -2px ${color}` }}
    >
      {level}
    </span>
  )
}

function StatTile({ icon: Icon, label, value, hint }: { icon: typeof Flame; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-3 py-2 backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-white/70 uppercase">
        <Icon aria-hidden className="size-3.5" /> {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-white/55">{hint}</p>
    </div>
  )
}

// ---------- edit: name, status, bio, avatar, colors ----------
const COLOR_PRESETS: [string, string][] = [
  ["#66c0f4", "#2d73ff"],
  ["#ff8a5b", "#ff4f7b"],
  ["#7cf5c6", "#b388ff"],
  ["#f7a1c4", "#8b7bff"],
  ["#fde047", "#f97316"],
  ["#39ff14", "#0e7a3a"],
  ["#e4ae39", "#7a4d0b"],
  ["#e9eef4", "#64778d"],
]

/** Square-crops and shrinks an image so it fits in the save. GIFs lose their animation. */
async function shrinkImage(file: File, size = 160): Promise<string | null> {
  if (!file.type.startsWith("image/") || file.size > 20_000_000) return null
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const c = document.createElement("canvas")
    c.width = c.height = size
    const ctx = c.getContext("2d")
    if (!ctx) return null
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size)
    const data = c.toDataURL("image/jpeg", 0.86)
    return data.length <= PROFILE_LIMITS.avatarBytes ? data : c.toDataURL("image/jpeg", 0.6)
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

function EditTab() {
  const p = useStore((s) => s.profile)
  const user = useStore((s) => s.user)
  const pets = useStore((s) => s.pets)
  const fileRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const species = [...new Map(pets.map((x) => [x.name, x])).values()].sort((a, b) => petRate(b) - petRate(a))

  const upload = async (file: File | undefined) => {
    if (!file) return
    const data = await shrinkImage(file)
    if (!data) return toast({ title: "Use a JPG, PNG, WebP or GIF image", tone: "err" })
    setProfile({ avatar: data })
    toast({ title: "Avatar updated", tone: "ok" })
  }

  const input = "h-10 w-full rounded-md border border-line-2 bg-black/25 px-3 text-sm text-fg outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/30"
  return (
    <div className="grid gap-5">
      <Labeled label="Display name" count={`${p.name.length}/${PROFILE_LIMITS.name}`}>
        <input value={p.name} maxLength={PROFILE_LIMITS.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder={user?.email.split("@")[0] ?? "Guest"} className={input} />
      </Labeled>
      <Labeled label="Status" count={`${p.status.length}/${PROFILE_LIMITS.status}`}>
        <input value={p.status} maxLength={PROFILE_LIMITS.status} onChange={(e) => setProfile({ status: e.target.value })} placeholder="e.g. Studying for finals · do not disturb" className={input} />
      </Labeled>
      <Labeled label="About me" count={`${p.bio.length}/${PROFILE_LIMITS.bio}`}>
        <textarea
          value={p.bio}
          maxLength={PROFILE_LIMITS.bio}
          rows={3}
          onChange={(e) => setProfile({ bio: e.target.value })}
          placeholder="A line or two about you."
          className={`${input} h-auto resize-none py-2`}
        />
      </Labeled>

      <div>
        <p className="text-xs font-medium text-muted">Avatar</p>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            void upload(Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/")))
          }}
          className={`mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-2 transition-colors ${over ? "border-accent bg-accent/10" : "border-line-2"}`}
        >
          <AvatarChoice on={!p.avatar} onClick={() => setProfile({ avatar: "" })} label="Initial">
            <ProfileAvatar profile={{ ...p, avatar: "", frame: "pframe-none" }} fallback={p.name || user?.email || "G"} size={44} />
          </AvatarChoice>
          {p.avatar.startsWith("data:") && (
            <AvatarChoice on label="Your image">
              <ProfileAvatar profile={{ ...p, frame: "pframe-none" }} fallback="" size={44} />
            </AvatarChoice>
          )}
          {species.map((pet) => (
            <AvatarChoice key={pet.name} on={p.avatar === `pet:${pet.name}`} onClick={() => setProfile({ avatar: `pet:${pet.name}` })} label={pet.name}>
              <ProfileAvatar profile={{ ...p, avatar: `pet:${pet.name}`, frame: "pframe-none" }} fallback="" size={44} />
            </AvatarChoice>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-[52px] cursor-pointer items-center gap-2 rounded-md border border-line-2 px-3 text-sm font-medium text-muted transition-colors hover:border-accent/60 hover:text-fg"
          >
            <ImagePlus aria-hidden className="size-4" /> Upload or drop an image
          </button>
          {p.avatar.startsWith("data:") && (
            <button type="button" onClick={() => setProfile({ avatar: "" })} aria-label="Remove uploaded avatar" className="grid size-9 cursor-pointer place-items-center rounded-md text-muted hover:bg-danger/15 hover:text-danger">
              <Trash2 className="size-4" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void upload(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted">Profile colors</p>
        <p className="mt-0.5 text-xs text-faint">Used by your background, frame, name style and level bar.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((c) => {
            const on = c[0] === p.colors[0] && c[1] === p.colors[1]
            return (
              <button
                key={c.join()}
                type="button"
                onClick={() => setProfile({ colors: c })}
                aria-label={`Colors ${c.join(" and ")}`}
                aria-pressed={on}
                className={`size-9 cursor-pointer rounded-full transition-transform hover:scale-110 ${on ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""}`}
                style={{ background: `linear-gradient(135deg, ${c[0]} 50%, ${c[1]} 50%)` }}
              />
            )
          })}
          <span className="mx-1 h-6 w-px bg-line-2" />
          {([0, 1] as const).map((i) => (
            <label key={i} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input
                type="color"
                value={p.colors[i]}
                onChange={(e) => setProfile({ colors: (i === 0 ? [e.target.value, p.colors[1]] : [p.colors[0], e.target.value]) as ProfileT["colors"] })}
                className="size-9 cursor-pointer rounded-md border border-line-2 bg-transparent"
              />
              {i === 0 ? "Primary" : "Secondary"}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Labeled({ label, count, children }: { label: string; count: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-xs font-medium text-muted">
        {label}
        <span className="text-faint tabular-nums">{count}</span>
      </span>
      {children}
    </label>
  )
}

function AvatarChoice({ on, onClick, label, children }: { on: boolean; onClick?: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={`Avatar: ${label}`}
      aria-pressed={on}
      className={`grid size-[52px] cursor-pointer place-items-center rounded-md border transition-colors ${on ? "border-accent bg-accent/15" : "border-transparent hover:bg-white/[0.06]"}`}
    >
      {children}
    </button>
  )
}

// ---------- shop grids for backgrounds, frames and name styles ----------
function ItemShop({ kind }: { kind: ProfileKind }) {
  const p = useStore(effectiveProfile)
  const s = useStoreShallow((st) => ({ balance: st.balance, ownedProfile: st.ownedProfile, user: st.user, unlockAll: st.unlockAll }))
  const items = PROFILE_ITEMS.filter((i) => i.kind === kind)
  const field = kind === "background" ? p.background : kind === "frame" ? p.frame : p.nameStyle
  const owned = items.filter((i) => ownsProfileItem(s, i.id)).length

  const pick = (item: ProfileItem) => {
    if (ownsProfileItem(s, item.id)) {
      equipProfileItem(item.id)
      sfx.blip()
      return
    }
    const price = PROFILE_PRICE[item.rarity]
    if (!window.confirm(`Buy ${item.name} for ${fmtMoney(price)}?`)) return
    if (buyProfileItem(item.id)) {
      sfx.coin()
      fx.emit({ kind: "burst", palette: "phosphor", power: 40 })
      toast({ title: `Bought ${item.name}`, body: "It's on your profile now.", tone: "ok" })
    } else {
      sfx.error()
      toast({ title: "Not enough money", body: `You need ${fmtMoney(price - store.get().balance)} more.`, tone: "err" })
    }
  }

  return (
    <>
      <p className="mb-3 text-xs text-muted">
        {owned} / {items.length} owned · tap one you own to wear it
      </p>
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {items.map((item) => {
          const have = ownsProfileItem(s, item.id)
          const on = field === item.id
          const price = PROFILE_PRICE[item.rarity]
          const r = RARITY[item.rarity]
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                aria-pressed={on}
                className={`flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  on ? "border-accent/70 bg-accent/[0.08]" : "border-line bg-white/[0.02] hover:border-line-2"
                }`}
              >
                <ItemPreview item={item} profile={p} />
                <div className="p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <span className={`text-[10px] font-bold tracking-wide uppercase ${item.rarity === "secret" ? "text-secret" : ""}`} style={item.rarity === "secret" ? undefined : { color: r.hex }}>
                      {r.label}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{item.desc}</p>
                  <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${on ? "text-accent" : have ? "text-go-2" : s.balance >= price ? "text-fg" : "text-faint"}`}>
                    {on ? (
                      <>
                        <Check aria-hidden className="size-3.5" /> Wearing
                      </>
                    ) : have ? (
                      "Owned · wear"
                    ) : (
                      <>
                        {s.balance < price && <Lock aria-hidden className="size-3" />}
                        {fmtMoney(price)}
                      </>
                    )}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function ItemPreview({ item, profile }: { item: ProfileItem; profile: ProfileT }) {
  const ref = useOffscreenPause<HTMLDivElement>()
  const vars = { "--c1": profile.colors[0], "--c2": profile.colors[1] } as React.CSSProperties
  if (item.kind === "background") return <div ref={ref} className={`${item.id} h-20`} style={vars} />
  if (item.kind === "frame") {
    return (
      <div ref={ref} className="grid h-20 place-items-center bg-black/25">
        <ProfileAvatar profile={{ ...profile, frame: item.id }} fallback={profile.name || "A"} size={48} />
      </div>
    )
  }
  return (
    <div ref={ref} className="grid h-20 place-items-center bg-black/25 px-2" style={vars}>
      <span className={`display max-w-full truncate text-xl font-bold ${item.id}`}>{profile.name || "Your name"}</span>
    </div>
  )
}

// ---------- showcase ----------
function ShowcaseTab() {
  const pets = useStore((s) => s.pets)
  const showcase = useStore((s) => s.profile.showcase)
  const sorted = [...pets].sort((a, b) => petRate(b) - petRate(a))
  const toggle = (uid: string) => {
    if (showcase.includes(uid)) setProfile({ showcase: showcase.filter((u) => u !== uid) })
    else if (showcase.length < PROFILE_LIMITS.showcase) setProfile({ showcase: [...showcase, uid] })
    else toast({ title: `Pick up to ${PROFILE_LIMITS.showcase} pets`, body: "Remove one first.", tone: "info" })
  }
  return (
    <>
      <p className="mb-3 text-xs text-muted">
        Choose up to {PROFILE_LIMITS.showcase} pets to show on your profile ({showcase.length} picked). With none picked, your top earners show.
      </p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {sorted.map((pet) => {
          const n = showcase.indexOf(pet.uid)
          return (
            <li key={pet.uid}>
              <button
                type="button"
                onClick={() => toggle(pet.uid)}
                aria-pressed={n >= 0}
                className={`relative flex w-full cursor-pointer flex-col items-center rounded-lg border px-1 pt-1.5 pb-2 transition-colors ${
                  n >= 0 ? "border-accent/70 bg-accent/[0.08]" : "border-line bg-white/[0.02] hover:border-line-2"
                }`}
              >
                {n >= 0 && <span className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-bg">{n + 1}</span>}
                <PetAvatar avatar={pet.avatar} size={64} />
                <span className="max-w-full truncate text-xs font-semibold">{pet.name}</span>
                <span className="text-[10px] font-bold uppercase" style={{ color: RARITY[pet.rarity].hex }}>
                  Lv {pet.level}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
