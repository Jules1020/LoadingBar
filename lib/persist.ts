"use client"

import { ODDS, PET_POOL, type WheelKind } from "./data"
import { COSMETICS, DEFAULT_EQUIPPED, navOf, type Equipped } from "./cosmetics"
import { PROFILE_ITEMS, validProfile, type Profile } from "./profile"
import { isDayKey } from "./dates"
import { SESSION_SPEEDS, effectiveEquipped, store, type OwnedPet, type SessionEntry, type SessionSpeed, type State } from "./store"
import type { DayLog } from "./streak"

// Saves live in this browser (localStorage) and, when signed in, in the account's
// cloud save. Both use the same JSON produced by serialize().

const KEY = "loadingbar-save-v3"
const LEGACY_KEYS = ["loadingbar-demo-v2", "loadingbar-demo-v1"]
/** Read by the inline boot script in layout.tsx so the theme applies before first paint. */
export const THEME_KEY = "lb-theme"
/** Where the theme puts the tabs; also read by the boot script. */
export const NAV_KEY = "lb-nav"
const INCOME_BOOSTS = [1, 10, 100, 1000]

type SavedPet = { name: string; uid: string; stash?: number; earned?: number; level?: number }
export type Saved = {
  version: 3
  savedAt: number
  balance: number
  pets: SavedPet[]
  freezeTokens: number
  targetDays: number
  dailyGoal: number
  duration: number
  spinsEarned: number
  soundOn: boolean
  ownedCosmetics: string[]
  equipped: Equipped
  unlockAll: boolean
  sessionSpeed: number
  showLoadingLines: boolean
  musicVisible: boolean
  history: Record<string, DayLog>
  frozenDays: string[]
  sessions: SessionEntry[]
  pulls: Partial<Record<WheelKind, number>>
  achievements: string[]
  lifetimeEarned: number
  boostNext: boolean
  spent: number
  profile?: Profile
  ownedProfile?: string[]
  freeShopping?: boolean
  infiniteSpins?: boolean
  rig?: WheelKind | null
  incomeBoost?: number
}

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback)
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const cosmeticId = (v: unknown, kind: keyof Equipped) =>
  typeof v === "string" && COSMETICS.some((c) => c.id === v && c.kind === kind) ? v : DEFAULT_EQUIPPED[kind]

export function serialize(s: State): Saved {
  return {
    version: 3,
    savedAt: Date.now(),
    balance: s.balance,
    pets: s.pets.map((p) => ({ name: p.name, uid: p.uid, stash: p.stash, earned: p.earned, level: p.level })),
    freezeTokens: s.freezeTokens,
    targetDays: s.targetDays,
    dailyGoal: s.dailyGoal,
    duration: s.duration,
    spinsEarned: s.spinsEarned,
    soundOn: s.soundOn,
    ownedCosmetics: s.ownedCosmetics,
    equipped: s.equipped,
    unlockAll: s.unlockAll,
    sessionSpeed: s.sessionSpeed,
    showLoadingLines: s.showLoadingLines,
    musicVisible: s.musicVisible,
    history: s.history,
    frozenDays: s.frozenDays,
    sessions: s.sessions,
    pulls: s.pulls,
    achievements: s.achievements,
    lifetimeEarned: s.lifetimeEarned,
    boostNext: s.boostNext,
    spent: s.spent,
    profile: s.profile,
    ownedProfile: s.ownedProfile,
    freeShopping: s.freeShopping,
    infiniteSpins: s.infiniteSpins,
    rig: s.rig,
    incomeBoost: s.incomeBoost,
  }
}

/** Validates any save shape (v1–v3, local, cloud or imported) and loads it into the store. */
export function applySave(raw: unknown) {
  if (!raw || typeof raw !== "object") return false
  const d = raw as Partial<Saved> & Record<string, unknown>
  const s = store.get()

  const pets: OwnedPet[] = Array.isArray(d.pets)
    ? d.pets.flatMap((p) => {
        const def = PET_POOL.find((x) => x.name === p?.name)
        return def && typeof p.uid === "string"
          ? [{ ...def, uid: p.uid, stash: Math.max(0, num(p.stash, 0)), earned: Math.max(0, num(p.earned, 0)), level: clamp(Math.round(num(p.level, 1)), 1, 10) }]
          : []
      })
    : []

  const history: Record<string, DayLog> = {}
  if (d.history && typeof d.history === "object") {
    for (const [k, v] of Object.entries(d.history as Record<string, Partial<DayLog>>)) {
      if (isDayKey(k) && v && typeof v === "object") {
        history[k] = { sessions: Math.max(0, num(v.sessions, 0)), minutes: Math.max(0, num(v.minutes, 0)), earned: Math.max(0, num(v.earned, 0)) }
      }
    }
  }
  const sessions: SessionEntry[] = Array.isArray(d.sessions)
    ? d.sessions
        .filter((e) => e && typeof e.at === "number")
        .slice(-200)
        .map((e) => ({ at: e.at, minutes: num(e.minutes, 0), earned: num(e.earned, 0), task: typeof e.task === "string" ? e.task.slice(0, 80) : "" }))
    : []
  const pulls: Partial<Record<WheelKind, number>> = {}
  if (d.pulls && typeof d.pulls === "object") {
    for (const [k, v] of Object.entries(d.pulls)) if (typeof v === "number") pulls[k as WheelKind] = Math.max(0, v)
  }
  const eq = (d.equipped ?? {}) as Partial<Equipped>
  const speed = num(d.sessionSpeed, 1)

  store.set({
    balance: Math.max(0, num(d.balance, s.balance)),
    pets: pets.length ? pets : s.pets,
    freezeTokens: Math.max(0, num(d.freezeTokens, s.freezeTokens)),
    targetDays: clamp(Math.round(num(d.targetDays, s.targetDays)), 1, 7),
    dailyGoal: clamp(Math.round(num(d.dailyGoal, s.dailyGoal)), 1, 12),
    duration: clamp(Math.round(num(d.duration, s.duration)), 1, 180),
    spinsEarned: Math.max(0, num(d.spinsEarned, s.spinsEarned)),
    soundOn: bool(d.soundOn, s.soundOn),
    ownedCosmetics: Array.isArray(d.ownedCosmetics) ? d.ownedCosmetics.filter((id) => COSMETICS.some((c) => c.id === id)) : [],
    equipped: { bar: cosmeticId(eq.bar, "bar"), theme: cosmeticId(eq.theme, "theme"), screen: cosmeticId(eq.screen, "screen") },
    unlockAll: bool(d.unlockAll, false),
    sessionSpeed: (SESSION_SPEEDS.includes(speed as SessionSpeed) ? speed : 1) as SessionSpeed,
    showLoadingLines: bool(d.showLoadingLines, s.showLoadingLines),
    musicVisible: bool(d.musicVisible, s.musicVisible),
    history,
    frozenDays: Array.isArray(d.frozenDays) ? d.frozenDays.filter((k) => typeof k === "string" && isDayKey(k)) : [],
    sessions,
    pulls,
    achievements: Array.isArray(d.achievements) ? d.achievements.filter((a) => typeof a === "string") : [],
    lifetimeEarned: Math.max(0, num(d.lifetimeEarned, 0)),
    boostNext: bool(d.boostNext, false),
    spent: Math.max(0, num(d.spent, 0)),
    profile: validProfile(d.profile),
    ownedProfile: Array.isArray(d.ownedProfile) ? d.ownedProfile.filter((id) => PROFILE_ITEMS.some((i) => i.id === id)) : [],
    freeShopping: bool(d.freeShopping, false),
    infiniteSpins: bool(d.infiniteSpins, false),
    rig: typeof d.rig === "string" && d.rig in ODDS ? d.rig : null,
    incomeBoost: INCOME_BOOSTS.includes(num(d.incomeBoost, 1)) ? num(d.incomeBoost, 1) : 1,
  })
  return true
}

export function loadLocal() {
  for (const key of [KEY, ...LEGACY_KEYS]) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return applySave(JSON.parse(raw))
    } catch {
      // unreadable or blocked: try the next key
    }
  }
  return false
}

export function saveLocal(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(serialize(s)))
    const theme = effectiveEquipped(s).theme
    localStorage.setItem(THEME_KEY, theme)
    localStorage.setItem(NAV_KEY, navOf(theme))
  } catch {
    // Storage unavailable: progress just won't survive a reload.
  }
}
