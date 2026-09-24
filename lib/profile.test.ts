import { describe, expect, it } from "vitest"
import { DEFAULT_PROFILE, PROFILE_ITEMS, PROFILE_LIMITS, PROFILE_PRICE, profileLevel, validProfile } from "./profile"
import { COSMETIC_PRICE } from "./cosmetics"
import { RARITIES } from "./data"

describe("validProfile", () => {
  it("falls back to defaults for junk", () => {
    expect(validProfile(null)).toEqual(DEFAULT_PROFILE)
    expect(validProfile("nope")).toEqual(DEFAULT_PROFILE)
  })

  it("trims text to the limits and rejects bad colors and unknown items", () => {
    const p = validProfile({
      name: "x".repeat(100),
      bio: "y".repeat(500),
      colors: ["red", "#00ff00"],
      background: "pbg-does-not-exist",
      frame: "pbg-aurora", // right id, wrong kind
      nameStyle: "pname-glow",
      showcase: ["a", "b", "c", "d", 5],
    })
    expect(p.name).toHaveLength(PROFILE_LIMITS.name)
    expect(p.bio).toHaveLength(PROFILE_LIMITS.bio)
    expect(p.colors).toEqual(DEFAULT_PROFILE.colors)
    expect(p.background).toBe(DEFAULT_PROFILE.background)
    expect(p.frame).toBe(DEFAULT_PROFILE.frame)
    expect(p.nameStyle).toBe("pname-glow")
    expect(p.showcase).toEqual(["a", "b", "c"])
  })

  it("only accepts pet avatars and small data:image avatars", () => {
    expect(validProfile({ avatar: "pet:Cursor Cat" }).avatar).toBe("pet:Cursor Cat")
    expect(validProfile({ avatar: "https://evil.example/x.png" }).avatar).toBe("")
    expect(validProfile({ avatar: "javascript:alert(1)" }).avatar).toBe("")
    expect(validProfile({ avatar: `data:image/png;base64,${"A".repeat(PROFILE_LIMITS.avatarBytes)}` }).avatar).toBe("")
  })
})

describe("profileLevel", () => {
  it("never goes down as XP grows, and progress stays within the level", () => {
    let prev = 0
    for (let minutes = 0; minutes < 20_000; minutes += 37) {
      const lv = profileLevel(minutes, 5)
      expect(lv.level).toBeGreaterThanOrEqual(prev)
      expect(lv.progress).toBeGreaterThanOrEqual(0)
      expect(lv.progress).toBeLessThan(1)
      prev = lv.level
    }
  })
})

describe("prices", () => {
  it("rise with rarity and keep the top tiers a long-term goal", () => {
    for (const table of [COSMETIC_PRICE, PROFILE_PRICE]) {
      const prices = RARITIES.map((r) => table[r])
      expect([...prices].sort((a, b) => a - b)).toEqual(prices)
      expect(table.legendary).toBeGreaterThanOrEqual(5_000_000)
    }
  })

  it("has unique profile item ids and one free default per kind", () => {
    expect(new Set(PROFILE_ITEMS.map((i) => i.id)).size).toBe(PROFILE_ITEMS.length)
    for (const kind of ["background", "frame", "name"] as const) {
      expect(PROFILE_ITEMS.filter((i) => i.kind === kind && i.free)).toHaveLength(1)
    }
  })
})
