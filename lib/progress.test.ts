import { describe, expect, it } from "vitest"
import { makeCurve } from "./progress"

describe("makeCurve", () => {
  it("always starts at 0% and lands on exactly 100% when time is up", () => {
    for (const minutes of [1, 25, 45, 180]) {
      const c = makeCurve(minutes)
      expect(c.at(0)).toBe(0)
      expect(c.at(1)).toBe(1)
      expect(c.at(-1)).toBe(0)
      expect(c.at(2)).toBe(1)
    }
  })

  it("never goes backwards, even through stalls and bursts", () => {
    for (let run = 0; run < 25; run++) {
      const c = makeCurve(25)
      let prev = 0
      for (let i = 1; i <= 1000; i++) {
        const p = c.at(i / 1000)
        expect(p).toBeGreaterThanOrEqual(prev)
        prev = p
      }
    }
  })

  it("has an average speed of 1, so GB/s centres on the base rate", () => {
    const c = makeCurve(25)
    let sum = 0
    const n = 2000
    for (let i = 0; i < n; i++) sum += c.speed((i + 0.5) / n)
    expect(sum / n).toBeCloseTo(1, 1)
  })
})
