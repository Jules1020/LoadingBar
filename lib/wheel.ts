import { COSMETICS, type Cosmetic } from "./cosmetics"
import { ODDS, WHEEL, type Rarity, type WheelKind } from "./data"

// The wheel's math, kept free of React so it can be tested. `rand` defaults to Math.random.

/** Degrees per segment. */
export const SEG = 360 / WHEEL.length

/** Cosmetic drops favour common items the same way pets do. */
export const COS_WEIGHT: Record<Rarity, number> = { common: 40, uncommon: 25, rare: 15, epic: 10, legendary: 6, mythic: 3, secret: 1 }

/** Index of the segment under the pointer (12 o'clock) at a given wheel rotation. */
export const segAt = (rot: number) => Math.floor(((((-rot % 360) + 360) % 360) / SEG) % WHEEL.length)

/** Picks a result using the published odds. */
export function rollKind(rand = Math.random): WheelKind {
  let r = rand()
  for (const [kind, p] of Object.entries(ODDS) as [WheelKind, number][]) {
    if ((r -= p) <= 0) return kind
  }
  return "common"
}

/** A wheel-drop cosmetic you don't own yet, weighted by rarity; null once you own them all. */
export function rollCosmetic(owned: string[], rand = Math.random): Cosmetic | null {
  const pool = COSMETICS.filter((c) => c.source.type === "wheel" && !owned.includes(c.id))
  if (!pool.length) return null
  let r = rand() * pool.reduce((s, c) => s + COS_WEIGHT[c.rarity], 0)
  for (const c of pool) if ((r -= COS_WEIGHT[c.rarity]) <= 0) return c
  return pool[0]
}

/**
 * Where to stop for `kind`: picks one of its segments and returns the extra rotation
 * (0–360°, add whole turns on top) that lands the pointer inside it, slightly off-centre.
 */
export function landing(kind: WheelKind, start: number, rand = Math.random) {
  const candidates = WHEEL.flatMap((k, i) => (k === kind ? [i] : []))
  const index = candidates[Math.floor(rand() * candidates.length)]
  const jitter = (rand() - 0.5) * SEG * 0.6
  const want = -(index * SEG + SEG / 2) + jitter
  return { index, delta: (((want - start) % 360) + 360) % 360 }
}
