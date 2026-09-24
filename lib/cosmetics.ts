import type { Rarity } from "./data"

export type CosmeticKind = "bar" | "theme" | "screen"
export type Source = { type: "default" } | { type: "wheel" } | { type: "streak"; weeks: number }

export type Cosmetic = {
  id: string
  kind: CosmeticKind
  name: string
  rarity: Rarity
  source: Source
  desc: string
}

const def: Source = { type: "default" }
const wheel: Source = { type: "wheel" }
const streak = (weeks: number): Source => ({ type: "streak", weeks })

export const COSMETICS: Cosmetic[] = [
  // Loading bar skins
  { id: "bar-classic", kind: "bar", name: "Classic", rarity: "common", source: def, desc: "Blue to green, the default." },
  { id: "bar-solid", kind: "bar", name: "Solid", rarity: "common", source: wheel, desc: "One flat color. No distractions." },
  { id: "bar-segmented", kind: "bar", name: "Segmented", rarity: "uncommon", source: wheel, desc: "Chunky blocks, old-installer style." },
  { id: "bar-striped", kind: "bar", name: "Barber", rarity: "rare", source: wheel, desc: "Moving diagonal stripes." },
  { id: "bar-pixel", kind: "bar", name: "8-bit", rarity: "rare", source: wheel, desc: "Fills in pixel steps." },
  { id: "bar-pulse", kind: "bar", name: "Heartbeat", rarity: "epic", source: wheel, desc: "Breathes while it loads." },
  { id: "bar-terminal", kind: "bar", name: "Terminal", rarity: "epic", source: wheel, desc: "Phosphor green blocks." },
  { id: "bar-gold", kind: "bar", name: "24K", rarity: "legendary", source: wheel, desc: "Gold with a moving shine." },
  { id: "bar-glitch", kind: "bar", name: "Glitch", rarity: "mythic", source: wheel, desc: "Chromatic and unstable." },
  { id: "bar-rainbow", kind: "bar", name: "Prism", rarity: "secret", source: wheel, desc: "Every color, always moving." },
  { id: "bar-ember", kind: "bar", name: "Ember", rarity: "rare", source: streak(2), desc: "Reward for a 2-week streak." },
  { id: "bar-supernova", kind: "bar", name: "Supernova", rarity: "mythic", source: streak(12), desc: "Reward for a 12-week streak." },

  // Themes
  { id: "theme-steam", kind: "theme", name: "Steam", rarity: "common", source: def, desc: "Navy and blue, the default." },
  { id: "theme-mono", kind: "theme", name: "Graphite", rarity: "common", source: wheel, desc: "Monochrome and calm." },
  { id: "theme-sunset", kind: "theme", name: "Sunset", rarity: "uncommon", source: wheel, desc: "Warm plum and orange." },
  { id: "theme-midnight", kind: "theme", name: "Midnight", rarity: "rare", source: wheel, desc: "Deep indigo and violet." },
  { id: "theme-ocean", kind: "theme", name: "Deep Sea", rarity: "rare", source: wheel, desc: "Teal on dark water." },
  { id: "theme-rose", kind: "theme", name: "Rosé", rarity: "epic", source: wheel, desc: "Soft pink on charcoal." },
  { id: "theme-terminal", kind: "theme", name: "Terminal", rarity: "epic", source: wheel, desc: "Green phosphor, monospace." },
  { id: "theme-blaze", kind: "theme", name: "Blaze", rarity: "legendary", source: streak(4), desc: "Reward for a 4-week streak." },
  { id: "theme-neon", kind: "theme", name: "Neon", rarity: "rare", source: wheel, desc: "Hot pink and cyan after dark." },
  { id: "theme-forest", kind: "theme", name: "Forest", rarity: "uncommon", source: wheel, desc: "Moss, pine and soft light." },
  { id: "theme-coffee", kind: "theme", name: "Coffee", rarity: "common", source: wheel, desc: "Warm roast and cream." },
  { id: "theme-aurora", kind: "theme", name: "Aurora", rarity: "mythic", source: streak(8), desc: "Reward for an 8-week streak." },
  // Layout themes: new fonts, and the tabs move.
  { id: "theme-dos", kind: "theme", name: "MS-DOS", rarity: "rare", source: wheel, desc: "Blue screen, pixel text, tabs as an F-key bar at the bottom." },
  { id: "theme-editorial", kind: "theme", name: "Editorial", rarity: "rare", source: wheel, desc: "Serif type like a magazine, tabs in a left sidebar." },
  { id: "theme-arcade", kind: "theme", name: "Arcade", rarity: "epic", source: wheel, desc: "Pixel headings, scanlines, tabs in a left sidebar." },
  { id: "theme-brutal", kind: "theme", name: "Brutalist", rarity: "epic", source: wheel, desc: "Light paper, heavy grotesk type, hard shadows, tabs on the right." },
  { id: "theme-outrun", kind: "theme", name: "Outrun", rarity: "legendary", source: wheel, desc: "Chrome display type, sunset grid, tabs in a bottom dock." },

  // Loading screens
  { id: "screen-classic", kind: "screen", name: "Classic", rarity: "common", source: def, desc: "Bar, percentage, spinning payout wheels." },
  { id: "screen-minimal", kind: "screen", name: "Minimal", rarity: "uncommon", source: wheel, desc: "Just a huge percentage and a thin line." },
  { id: "screen-terminal", kind: "screen", name: "Terminal", rarity: "epic", source: wheel, desc: "A boot log that writes itself." },
  { id: "screen-orbit", kind: "screen", name: "Orbit", rarity: "legendary", source: wheel, desc: "A ring that fills while pets orbit." },
  { id: "screen-cd", kind: "screen", name: "CD Player", rarity: "legendary", source: wheel, desc: "A giant spinning disc with your cover art and controls." },
  { id: "screen-matrix", kind: "screen", name: "Matrix", rarity: "epic", source: wheel, desc: "Falling code; the rain gets denser as it loads." },
  { id: "screen-boss", kind: "screen", name: "Boss fight", rarity: "mythic", source: streak(6), desc: "Drain Procrastination's HP. 6-week streak." },
  { id: "screen-download", kind: "screen", name: "Download", rarity: "rare", source: wheel, desc: "A store-style download page with a live bandwidth graph." },
  { id: "screen-cassette", kind: "screen", name: "Cassette", rarity: "epic", source: wheel, desc: "A mixtape: tape winds from one reel to the other as it loads." },
  { id: "screen-handheld", kind: "screen", name: "Handheld", rarity: "epic", source: wheel, desc: "A pocket console with a green LCD and your best pet." },
  { id: "screen-vinyl", kind: "screen", name: "Turntable", rarity: "legendary", source: wheel, desc: "A spinning record with your cover as the label; the tonearm tracks progress." },
  { id: "screen-warp", kind: "screen", name: "Warp drive", rarity: "mythic", source: streak(10), desc: "Stars stretch with the bandwidth. 10-week streak." },
]

/** Where each theme puts the tabs. Themes not listed keep the top bar. */
export type NavLayout = "top" | "left" | "right" | "bottom"
export const THEME_LAYOUT: Record<string, NavLayout> = {
  "theme-dos": "bottom",
  "theme-editorial": "left",
  "theme-arcade": "left",
  "theme-brutal": "right",
  "theme-outrun": "bottom",
}
export const navOf = (theme: string): NavLayout => THEME_LAYOUT[theme] ?? "top"

export const DEFAULT_EQUIPPED = { bar: "bar-classic", theme: "theme-steam", screen: "screen-classic" }
export type Equipped = typeof DEFAULT_EQUIPPED

export const byId = (id: string) => COSMETICS.find((c) => c.id === id)

export function isUnlocked(
  c: Cosmetic,
  s: { unlockAll: boolean; ownedCosmetics: string[]; bestStreak: number },
) {
  if (s.unlockAll || c.source.type === "default") return true
  if (c.source.type === "streak") return s.bestStreak >= c.source.weeks || s.ownedCosmetics.includes(c.id)
  return s.ownedCosmetics.includes(c.id)
}

export const sourceLabel = (src: Source) =>
  src.type === "default" ? "Default" : src.type === "wheel" ? "Wheel drop" : `${src.weeks}-week streak`

// Visual definition of each bar skin. `fill` is painted across the full track and
// revealed by clip-path, so gradients stay anchored while the bar grows.
export const BAR_STYLES: Record<string, { fill: string; anim?: string; size?: string; quantize?: number; color: string }> = {
  "bar-classic": {
    fill: "linear-gradient(90deg, var(--color-accent-2), var(--color-accent) 60%, var(--color-go-2))",
    color: "var(--color-accent)",
  },
  "bar-solid": { fill: "var(--color-accent)", color: "var(--color-accent)" },
  "bar-segmented": {
    fill: "repeating-linear-gradient(90deg, var(--color-go-2) 0 18px, transparent 18px 22px)",
    color: "var(--color-go-2)",
  },
  "bar-striped": {
    fill: "repeating-linear-gradient(-45deg, var(--color-accent) 0 12px, var(--color-accent-2) 12px 24px)",
    anim: "bar-stripes",
    color: "var(--color-accent)",
  },
  "bar-pixel": {
    fill: "repeating-linear-gradient(90deg, #a4d007 0 14px, rgb(0 0 0 / 0.35) 14px 16px)",
    quantize: 0.05,
    color: "#a4d007",
  },
  "bar-pulse": { fill: "linear-gradient(90deg, var(--color-accent-2), var(--color-accent))", anim: "bar-pulse", color: "var(--color-accent)" },
  "bar-terminal": { fill: "repeating-linear-gradient(90deg, #39ff14 0 8px, #0a2a05 8px 10px)", color: "#39ff14" },
  "bar-gold": {
    fill: "linear-gradient(90deg, #8a6a1c, #e4ae39 35%, #fff1c1 50%, #e4ae39 65%, #8a6a1c)",
    size: "200% 100%",
    anim: "bar-shine",
    color: "#e4ae39",
  },
  "bar-glitch": { fill: "linear-gradient(90deg, #ff2bd6, #2de2ff)", anim: "bar-glitch", color: "#ff2bd6" },
  "bar-rainbow": {
    fill: "linear-gradient(90deg,#ff5f6d,#ffc371,#47e891,#44a0ff,#b06cff,#ff5f6d)",
    size: "200% 100%",
    anim: "bar-shine",
    color: "#b06cff",
  },
  "bar-ember": { fill: "linear-gradient(90deg, #7c2d12, #f97316 60%, #fde047)", anim: "bar-pulse", color: "#f97316" },
  "bar-supernova": {
    fill: "linear-gradient(90deg, #3730a3, #60a5fa 60%, #e0f2fe)",
    size: "200% 100%",
    anim: "bar-shine",
    color: "#60a5fa",
  },
}

// Swatches for theme cards: [bg, panel, accent, play].
export const THEME_SWATCH: Record<string, [string, string, string, string]> = {
  "theme-steam": ["#0a1018", "#1a2636", "#66c0f4", "#75b022"],
  "theme-mono": ["#0c0c0d", "#1d1d20", "#d4d4d8", "#a1a1aa"],
  "theme-sunset": ["#160c16", "#2a1627", "#ff8a5b", "#f6c453"],
  "theme-midnight": ["#0b0a1c", "#1a1836", "#8b7bff", "#4fd1c5"],
  "theme-ocean": ["#041417", "#0d2a30", "#2dd4bf", "#38bdf8"],
  "theme-rose": ["#141013", "#261d23", "#f7a1c4", "#f5d0a9"],
  "theme-terminal": ["#000000", "#07140a", "#39ff14", "#39ff14"],
  "theme-blaze": ["#140806", "#2a120c", "#ff7a3d", "#fde047"],
  "theme-aurora": ["#051218", "#0d2430", "#7cf5c6", "#b388ff"],
  "theme-neon": ["#07040f", "#170d2a", "#ff2bd6", "#2de2ff"],
  "theme-forest": ["#07110b", "#12241a", "#7bd389", "#d4e157"],
  "theme-coffee": ["#120d0a", "#241a14", "#d4a373", "#e9c46a"],
  "theme-dos": ["#0000aa", "#0000aa", "#ffff55", "#00aaaa"],
  "theme-editorial": ["#14110f", "#1d1916", "#e2553a", "#efe6d8"],
  "theme-arcade": ["#0d0221", "#1a0b3d", "#fffc00", "#00ff9f"],
  "theme-brutal": ["#f4f1ea", "#ffffff", "#ff5a1f", "#111111"],
  "theme-outrun": ["#14031f", "#240a3a", "#ff2a6d", "#ffb86c"],
}

/** The font each theme uses, shown on its card. */
export const THEME_FONT: Record<string, string> = {
  "theme-terminal": "var(--font-geist-mono)",
  "theme-dos": "var(--font-vt323)",
  "theme-editorial": "var(--font-fraunces)",
  "theme-arcade": "var(--font-press)",
  "theme-brutal": "var(--font-grotesk)",
  "theme-outrun": "var(--font-orbitron)",
}

/**
 * Shop price for buying a wheel cosmetic outright. Streak rewards can't be bought.
 * The top tiers are meant to be long-term goals: a legendary is weeks of sessions.
 */
export const COSMETIC_PRICE: Record<Rarity, number> = {
  common: 10_000,
  uncommon: 25_000,
  rare: 80_000,
  epic: 350_000,
  legendary: 5_000_000,
  mythic: 25_000_000,
  secret: 150_000_000,
}
