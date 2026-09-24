"use client"

import { useRef, useSyncExternalStore } from "react"
import { FLAME_TIERS, PET_POOL, STARTER_PETS, flameTier, type PetDef, type WheelKind } from "./data"
import { COSMETICS, COSMETIC_PRICE, DEFAULT_EQUIPPED, isUnlocked, type CosmeticKind, type Equipped } from "./cosmetics"
import { computeStreak, type DayLog } from "./streak"
import { addDays, dayKey, fromKey, startOfWeek } from "./dates"
import { DEFAULT_PROFILE, PROFILE_ITEMS, PROFILE_PRICE, type Profile, type ProfileKind } from "./profile"

// Tiny external store shared by every page, so a pet pulled on the wheel
// shows up in /pets and the flame multiplier feeds the $/s rate.

/** stash: cash waiting on the pet's pad. earned: lifetime total. level: upgrades bought in the shop (1–10). */
export type OwnedPet = PetDef & { uid: string; stash: number; earned: number; level: number }
export type SessionSpeed = 1 | 10 | 60 | 600 | 3600
export const SESSION_SPEEDS: SessionSpeed[] = [1, 10, 60, 600, 3600]
export type SessionEntry = { at: number; minutes: number; earned: number; task: string }
export type User = { email: string; admin: boolean }

export type State = {
  /** True once saved progress has been loaded on the client. */
  ready: boolean
  /** Today's local date key; ticks over at midnight so streaks stay honest. */
  today: string
  user: User | null
  balance: number
  pets: OwnedPet[]
  freezeTokens: number
  targetDays: number
  dailyGoal: number
  /** Session length in minutes. */
  duration: number
  spinsEarned: number
  soundOn: boolean
  pendingStart: boolean
  pendingSpin: boolean
  lastPullUid: string | null
  /** A session is on screen: app chrome hides and pets are earning. */
  sessionRunning: boolean
  ownedCosmetics: string[]
  equipped: Equipped
  /** Admin-only prototype switch: every cosmetic usable without earning it. */
  unlockAll: boolean
  /** Admin-only. 1 = real time; 10/60 compress sessions for testing. */
  sessionSpeed: SessionSpeed
  showLoadingLines: boolean
  musicVisible: boolean
  /** Finished sessions per local day. */
  history: Record<string, DayLog>
  /** Days covered by a streak freeze. */
  frozenDays: string[]
  /** Most recent finished sessions (newest last). */
  sessions: SessionEntry[]
  pulls: Partial<Record<WheelKind, number>>
  achievements: string[]
  lifetimeEarned: number
  /** Bought in the shop: the next finished session pays double. */
  boostNext: boolean
  /** Total money spent in the shop (for stats). */
  spent: number
  profile: Profile
  /** Profile items bought in the shop. */
  ownedProfile: string[]
  // ----- admin-only switches (ignored for everyone else) -----
  /** Shop purchases cost nothing. */
  freeShopping: boolean
  /** Spinning doesn't use up spins. */
  infiniteSpins: boolean
  /** Every spin lands on this result. */
  rig: WheelKind | null
  /** Extra income multiplier on top of the flame. */
  incomeBoost: number
}

export const initialState: State = {
  ready: false,
  today: "",
  user: null,
  balance: 0,
  pets: STARTER_PETS.map((p, i) => ({ ...p, uid: `starter-${i}`, stash: 0, earned: 0, level: 1 })),
  freezeTokens: 1,
  targetDays: 4,
  dailyGoal: 3,
  duration: 25,
  spinsEarned: 0,
  soundOn: true,
  pendingStart: false,
  pendingSpin: false,
  lastPullUid: null,
  sessionRunning: false,
  ownedCosmetics: [],
  equipped: DEFAULT_EQUIPPED,
  unlockAll: false,
  sessionSpeed: 1,
  showLoadingLines: true,
  musicVisible: true,
  history: {},
  frozenDays: [],
  sessions: [],
  pulls: {},
  achievements: [],
  lifetimeEarned: 0,
  boostNext: false,
  spent: 0,
  profile: DEFAULT_PROFILE,
  ownedProfile: [],
  freeShopping: false,
  infiniteSpins: false,
  rig: null,
  incomeBoost: 1,
}

let state = initialState
const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<State> | ((s: State) => Partial<State>)) {
    const next = typeof patch === "function" ? patch(state) : patch
    state = { ...state, ...next }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(initialState),
  )
}

const shallowEqual = (a: object, b: object) => {
  const ka = Object.keys(a)
  return ka.length === Object.keys(b).length && ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

/**
 * Like useStore, for selectors that build an object from several fields:
 * re-renders only when one of those fields changes.
 */
export function useStoreShallow<T extends object>(selector: (s: State) => T): T {
  const client = useRef<T | null>(null)
  const server = useRef<T | null>(null)
  const cached = (ref: { current: T | null }, next: T) => (ref.current && shallowEqual(ref.current, next) ? ref.current : (ref.current = next))
  return useSyncExternalStore(
    store.subscribe,
    () => cached(client, selector(state)),
    () => cached(server, selector(initialState)),
  )
}

// ---------- derived ----------
export const isAdmin = (s: Pick<State, "user">) => !!s.user?.admin
export const streakOf = (s: State) => computeStreak(s.history, s.frozenDays, s.targetDays, s.today)
export const MAX_PET_LEVEL = 10
/** A pet's $/s before the flame multiplier: +20% per level above 1. */
export const petRate = (p: Pick<OwnedPet, "rate" | "level">) => p.rate * (1 + 0.2 * ((p.level ?? 1) - 1))
export const upgradeCost = (p: OwnedPet) => Math.round(petRate(p) * 600 * p.level)
export const baseRate = (s: State) => s.pets.reduce((sum, p) => sum + petRate(p), 0)
export const multiplier = (s: State) => FLAME_TIERS[flameTier(streakOf(s).current)].mult * (isAdmin(s) ? s.incomeBoost : 1)
export const totalRate = (s: State) => baseRate(s) * multiplier(s)
export const waitingOnPads = (s: State) => s.pets.reduce((sum, p) => sum + p.stash, 0)
export const sessionsToday = (s: State) => s.history[s.today]?.sessions ?? 0
export const effectiveSpeed = (s: State): SessionSpeed => (isAdmin(s) ? s.sessionSpeed : 1)
type UnlockCtx = { unlockAll: boolean; ownedCosmetics: string[]; bestStreak: number }
let ctxCache: UnlockCtx | null = null
/** Cached, so it's safe to pass straight to useStore. */
export function unlockCtx(s: State): UnlockCtx {
  const next = { unlockAll: isAdmin(s) && s.unlockAll, ownedCosmetics: s.ownedCosmetics, bestStreak: streakOf(s).best }
  if (ctxCache && shallowEqual(ctxCache, next)) return ctxCache
  return (ctxCache = next)
}

let eqCache: { eq: Equipped; key: string; value: Equipped } | null = null
/** Equipped items, falling back to defaults for anything no longer unlocked (e.g. after an admin signs out). */
export function effectiveEquipped(s: State): Equipped {
  const ctx = unlockCtx(s)
  const pick = (kind: CosmeticKind) => {
    const c = COSMETICS.find((x) => x.id === s.equipped[kind])
    return c && isUnlocked(c, ctx) ? c.id : DEFAULT_EQUIPPED[kind]
  }
  const value = { bar: pick("bar"), theme: pick("theme"), screen: pick("screen") }
  const key = `${value.bar}|${value.theme}|${value.screen}`
  if (eqCache && eqCache.key === key) return eqCache.value
  eqCache = { eq: s.equipped, key, value }
  return value
}

// ---------- actions ----------
let uid = 0
export function addPet(def: PetDef) {
  const owned: OwnedPet = { ...def, uid: `p-${Date.now().toString(36)}-${++uid}`, stash: 0, earned: 0, level: 1 }
  store.set((s) => ({ pets: [...s.pets, owned], lastPullUid: owned.uid }))
  return owned
}

/** Credits a finished session: pets' exact earnings land on their pads and the day is logged. Returns the total. */
export function creditSession(minutes: number, task: string) {
  const s = store.get()
  const mult = multiplier(s) * (s.boostNext ? 2 : 1)
  const seconds = minutes * 60
  let total = 0
  const pets = s.pets.map((p) => {
    const amount = petRate(p) * mult * seconds
    total += amount
    return { ...p, stash: p.stash + amount, earned: p.earned + amount }
  })
  const now = new Date()
  const key = dayKey(now)
  const day = s.history[key] ?? { sessions: 0, minutes: 0, earned: 0 }
  store.set({
    pets,
    today: key,
    history: { ...s.history, [key]: { sessions: day.sessions + 1, minutes: day.minutes + minutes, earned: day.earned + total } },
    sessions: [...s.sessions.slice(-199), { at: now.getTime(), minutes, earned: total, task }],
    lifetimeEarned: s.lifetimeEarned + total,
    spinsEarned: s.spinsEarned + 1,
    boostNext: false,
  })
  return total
}

/** Moves one pet's pad (or every pad, when uid is omitted) into the wallet. Returns the amount. */
export function collect(uid?: string) {
  const s = store.get()
  let amount = 0
  const pets = s.pets.map((p) => {
    if (uid && p.uid !== uid) return p
    amount += p.stash
    return { ...p, stash: 0 }
  })
  store.set({ pets, balance: s.balance + amount })
  return amount
}

/** Adds a cosmetic to the inventory. Returns false if it was already owned. */
export function grantCosmetic(id: string) {
  if (store.get().ownedCosmetics.includes(id)) return false
  store.set((s) => ({ ownedCosmetics: [...s.ownedCosmetics, id] }))
  return true
}

export function equip(kind: CosmeticKind, id: string) {
  store.set((s) => ({ equipped: { ...s.equipped, [kind]: id } }))
}

export function recordPull(kind: WheelKind) {
  store.set((s) => ({ pulls: { ...s.pulls, [kind]: (s.pulls[kind] ?? 0) + 1 } }))
}

/** Spends a freeze on a missed day of the current week. */
export function freezeDay(key: string) {
  const s = store.get()
  if (s.freezeTokens <= 0 || s.frozenDays.includes(key)) return false
  store.set({ freezeTokens: s.freezeTokens - 1, frozenDays: [...s.frozenDays, key] })
  return true
}

/** Back to a fresh start without reloading (so fullscreen survives). Settings and account are kept. */
export function resetProgress() {
  const s = store.get()
  store.set({
    ...initialState,
    ready: true,
    today: s.today,
    user: s.user,
    soundOn: s.soundOn,
    unlockAll: s.unlockAll,
    sessionSpeed: s.sessionSpeed,
    showLoadingLines: s.showLoadingLines,
    musicVisible: s.musicVisible,
    dailyGoal: s.dailyGoal,
    targetDays: s.targetDays,
    duration: s.duration,
    profile: { ...s.profile, background: DEFAULT_PROFILE.background, frame: DEFAULT_PROFILE.frame, nameStyle: DEFAULT_PROFILE.nameStyle, showcase: [] },
    freeShopping: s.freeShopping,
    infiniteSpins: s.infiniteSpins,
    rig: s.rig,
    incomeBoost: s.incomeBoost,
  })
}

// ---------- admin-only prototype helpers ----------

/** Logs a finished session on any date (admin testing). Doesn't pay pets or grant a spin. */
export function logSessionOn(key: string, minutes: number) {
  store.set((s) => {
    const day = s.history[key] ?? { sessions: 0, minutes: 0, earned: 0 }
    return { history: { ...s.history, [key]: { sessions: day.sessions + 1, minutes: day.minutes + minutes, earned: day.earned } } }
  })
}

/** Back-fills `n` good weeks right before the current streak, so the streak grows by n. */
export function simulateGoodWeeks(n: number) {
  const s = store.get()
  const target = s.targetDays
  const history = { ...s.history }
  const active = (k: string) => (history[k]?.sessions ?? 0) > 0 || s.frozenDays.includes(k)
  let week = addDays(startOfWeek(fromKey(s.today || dayKey(new Date()))), -7)
  let filled = 0
  for (let guard = 0; filled < n && guard < 520; guard++, week = addDays(week, -7)) {
    const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(week, i)))
    let have = days.filter(active).length
    if (have >= target) continue
    for (const k of days) {
      if (have >= target) break
      if (active(k)) continue
      history[k] = { sessions: 1, minutes: 25, earned: 0 }
      have++
    }
    filled++
  }
  store.set({ history })
}

// ---------- shop: where the money goes ----------
export const FREEZE_PRICE = 25_000
export const boostPrice = (s: State) => Math.max(10_000, Math.round(totalRate(s) * s.duration * 60 * 0.4))

/** Deducts money if affordable. Returns false (and changes nothing) otherwise. */
function spend(amount: number) {
  const s = store.get()
  if (isAdmin(s) && s.freeShopping) return true
  if (amount <= 0 || s.balance < amount) return false
  store.set({ balance: s.balance - amount, spent: s.spent + amount })
  return true
}

export function buyFreeze() {
  if (!spend(FREEZE_PRICE)) return false
  store.set((s) => ({ freezeTokens: s.freezeTokens + 1 }))
  return true
}

export function buyBoost() {
  const s = store.get()
  if (s.boostNext || !spend(boostPrice(s))) return false
  store.set({ boostNext: true })
  return true
}

export function buyCosmetic(id: string) {
  const c = COSMETICS.find((x) => x.id === id)
  if (!c || c.source.type !== "wheel" || store.get().ownedCosmetics.includes(id)) return false
  if (!spend(COSMETIC_PRICE[c.rarity])) return false
  grantCosmetic(id)
  return true
}

export function upgradePet(uid: string) {
  const p = store.get().pets.find((x) => x.uid === uid)
  if (!p || p.level >= MAX_PET_LEVEL || !spend(upgradeCost(p))) return false
  store.set((s) => ({ pets: s.pets.map((x) => (x.uid === uid ? { ...x, level: x.level + 1 } : x)) }))
  return true
}

/** Admin: adds one of every pet you don't own yet. Returns how many were added. */
export function grantAllPets() {
  const have = new Set(store.get().pets.map((p) => p.name))
  const missing = PET_POOL.filter((p) => !have.has(p.name))
  missing.forEach((p) => addPet(p))
  return missing.length
}

/** Admin: every owned pet to max level. */
export function maxAllPets() {
  store.set((s) => ({ pets: s.pets.map((p) => ({ ...p, level: MAX_PET_LEVEL })) }))
}

// ---------- profile ----------
export const ownsProfileItem = (s: Pick<State, "ownedProfile" | "user" | "unlockAll">, id: string) =>
  !!PROFILE_ITEMS.find((i) => i.id === id)?.free || s.ownedProfile.includes(id) || (isAdmin(s) && s.unlockAll)

export function setProfile(patch: Partial<Profile>) {
  store.set((s) => ({ profile: { ...s.profile, ...patch } }))
}

const PROFILE_FIELD: Record<ProfileKind, "background" | "frame" | "nameStyle"> = { background: "background", frame: "frame", name: "nameStyle" }

export function equipProfileItem(id: string) {
  const item = PROFILE_ITEMS.find((i) => i.id === id)
  if (!item || !ownsProfileItem(store.get(), id)) return false
  setProfile({ [PROFILE_FIELD[item.kind]]: id })
  return true
}

/** Buys a profile item and puts it on. */
export function buyProfileItem(id: string) {
  const item = PROFILE_ITEMS.find((i) => i.id === id)
  if (!item || item.free || store.get().ownedProfile.includes(id)) return false
  if (!spend(PROFILE_PRICE[item.rarity])) return false
  store.set((s) => ({ ownedProfile: [...s.ownedProfile, id] }))
  equipProfileItem(id)
  return true
}

let profileCache: { source: Profile; key: string; value: Profile } | null = null
/**
 * The profile as others see it: equipped items fall back when not owned (e.g. after an admin signs out).
 * Cached, so it's safe to pass straight to useStore.
 */
export function effectiveProfile(s: State): Profile {
  const p = s.profile
  const own = (id: string, fallback: string) => (ownsProfileItem(s, id) ? id : fallback)
  const background = own(p.background, "pbg-plain")
  const frame = own(p.frame, "pframe-none")
  const nameStyle = own(p.nameStyle, "pname-plain")
  if (background === p.background && frame === p.frame && nameStyle === p.nameStyle) return p
  const key = `${background}|${frame}|${nameStyle}`
  if (profileCache && profileCache.source === p && profileCache.key === key) return profileCache.value
  const value = { ...p, background, frame, nameStyle }
  profileCache = { source: p, key, value }
  return value
}

// ---------- more admin tools ----------

/** Admin: owns every wheel cosmetic and profile item for real (survives turning unlock-all off). */
export function ownEverything() {
  store.set({
    ownedCosmetics: COSMETICS.filter((c) => c.source.type !== "default").map((c) => c.id),
    ownedProfile: PROFILE_ITEMS.filter((i) => !i.free).map((i) => i.id),
  })
}

/** Admin: one specific pet at a given level. */
export function spawnPet(name: string, level = 1) {
  const def = PET_POOL.find((p) => p.name === name)
  if (!def) return null
  const pet = addPet(def)
  const lv = Math.max(1, Math.min(MAX_PET_LEVEL, Math.round(level)))
  store.set((s) => ({ pets: s.pets.map((p) => (p.uid === pet.uid ? { ...p, level: lv } : p)) }))
  return pet
}

/** Admin: every pad gets `hours` of earnings, as if you'd focused that long. */
export function fillPads(hours: number) {
  const s = store.get()
  const mult = multiplier(s)
  let total = 0
  const pets = s.pets.map((p) => {
    const amount = petRate(p) * mult * hours * 3600
    total += amount
    return { ...p, stash: p.stash + amount, earned: p.earned + amount }
  })
  store.set({ pets, lifetimeEarned: s.lifetimeEarned + total })
  return total
}

/** Admin: removes every pet except the starters. */
export function releaseAllPets() {
  store.set({ pets: initialState.pets })
}
