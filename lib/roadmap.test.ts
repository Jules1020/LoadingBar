import { describe, expect, it } from "vitest"
import { FUTURE, ROADMAP_AREAS, ROADMAP_STATUS } from "./roadmap"

describe("roadmap", () => {
  it("only uses known areas and statuses, with unique titles", () => {
    const areas = new Set(ROADMAP_AREAS.map((a) => a.id))
    for (const item of FUTURE) {
      expect(areas.has(item.area), item.title).toBe(true)
      expect(ROADMAP_STATUS[item.status], item.title).toBeDefined()
      expect(item.desc.length, item.title).toBeLessThanOrEqual(140)
    }
    expect(new Set(FUTURE.map((i) => i.title)).size).toBe(FUTURE.length)
  })

  it("has something in every area", () => {
    for (const area of ROADMAP_AREAS) expect(FUTURE.some((i) => i.area === area.id), area.label).toBe(true)
  })
})
