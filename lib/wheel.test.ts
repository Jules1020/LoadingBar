import { describe, expect, it } from "vitest"
import { COSMETICS } from "./cosmetics"
import { ODDS, WHEEL, type WheelKind } from "./data"
import { SEG, landing, rollCosmetic, rollKind, segAt } from "./wheel"

/** Deterministic stand-in for Math.random. */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

describe("odds", () => {
  it("add up to 100% and every result exists on the wheel", () => {
    const total = Object.values(ODDS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
    for (const kind of Object.keys(ODDS) as WheelKind[]) expect(WHEEL).toContain(kind)
  })

  it("rollKind matches the published odds over many spins", () => {
    const rand = seeded(42)
    const counts: Partial<Record<WheelKind, number>> = {}
    const n = 200_000
    for (let i = 0; i < n; i++) {
      const k = rollKind(rand)
      counts[k] = (counts[k] ?? 0) + 1
    }
    for (const [kind, p] of Object.entries(ODDS) as [WheelKind, number][]) {
      expect((counts[kind] ?? 0) / n).toBeCloseTo(p, 2)
    }
  })
})

describe("landing", () => {
  it("always stops the pointer inside a segment of the rolled kind", () => {
    const rand = seeded(7)
    let rot = 0
    for (let i = 0; i < 500; i++) {
      const kind = rollKind(rand)
      const { index, delta } = landing(kind, rot, rand)
      expect(delta).toBeGreaterThanOrEqual(0)
      expect(delta).toBeLessThan(360)
      rot = rot + 5 * 360 + delta
      expect(segAt(rot)).toBe(index)
      expect(WHEEL[segAt(rot)]).toBe(kind)
    }
  })

  it("segAt maps each segment's centre back to its index", () => {
    WHEEL.forEach((_, i) => expect(segAt(-(i * SEG + SEG / 2))).toBe(i))
  })
})

describe("rollCosmetic", () => {
  it("only drops wheel cosmetics you don't own, and nothing once you own them all", () => {
    const wheelIds = COSMETICS.filter((c) => c.source.type === "wheel").map((c) => c.id)
    const owned = wheelIds.slice(0, -1)
    const rand = seeded(3)
    for (let i = 0; i < 50; i++) expect(rollCosmetic(owned, rand)?.id).toBe(wheelIds.at(-1))
    expect(rollCosmetic(wheelIds)).toBeNull()
  })
})
