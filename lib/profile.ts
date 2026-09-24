import type { Rarity } from "./data"

// Profile cosmetics are shop-only: you buy them with the money your pets earn.
// Their looks live in globals.css (.pbg-*, .pframe-*, .pname-*).

export type ProfileKind = "background" | "frame" | "name"

export type ProfileItem = {
  id: string
  kind: ProfileKind
  name: string
  rarity: Rarity
  desc: string
  /** Free, owned by everyone. */
  free?: boolean
}

export const PROFILE_ITEMS: ProfileItem[] = [
  // Animated backgrounds
  { id: "pbg-plain", kind: "background", name: "Plain", rarity: "common", desc: "Your two profile colors.", free: true },
  { id: "pbg-dusk", kind: "background", name: "Dusk", rarity: "common", desc: "A slow gradient that drifts." },
  { id: "pbg-snow", kind: "background", name: "Snowfall", rarity: "uncommon", desc: "Soft flakes falling forever." },
  { id: "pbg-waves", kind: "background", name: "Tide", rarity: "uncommon", desc: "Layered waves rolling by." },
  { id: "pbg-stars", kind: "background", name: "Starfield", rarity: "rare", desc: "Twinkling stars at two depths." },
  { id: "pbg-grid", kind: "background", name: "Synthwave", rarity: "rare", desc: "A neon grid racing to the horizon." },
  { id: "pbg-aurora", kind: "background", name: "Aurora", rarity: "epic", desc: "Northern lights that breathe." },
  { id: "pbg-rain", kind: "background", name: "Code rain", rarity: "epic", desc: "Green streams of falling code." },
  { id: "pbg-fireflies", kind: "background", name: "Fireflies", rarity: "legendary", desc: "Warm lights wandering in the dark." },
  { id: "pbg-lava", kind: "background", name: "Lava lamp", rarity: "legendary", desc: "Molten blobs that melt into each other." },
  { id: "pbg-galaxy", kind: "background", name: "Galaxy", rarity: "mythic", desc: "A spiral galaxy turning slowly." },
  { id: "pbg-prism", kind: "background", name: "Prism storm", rarity: "secret", desc: "Every color at once, always moving." },

  // Avatar frames
  { id: "pframe-none", kind: "frame", name: "None", rarity: "common", desc: "Just your avatar.", free: true },
  { id: "pframe-ring", kind: "frame", name: "Ring", rarity: "common", desc: "A clean ring in your color." },
  { id: "pframe-pixel", kind: "frame", name: "8-bit", rarity: "uncommon", desc: "A chunky pixel border." },
  { id: "pframe-neon", kind: "frame", name: "Neon", rarity: "rare", desc: "A glowing ring that pulses." },
  { id: "pframe-loading", kind: "frame", name: "Loading…", rarity: "epic", desc: "A spinner that never finishes." },
  { id: "pframe-orbit", kind: "frame", name: "Orbit", rarity: "epic", desc: "Two moons circling your avatar." },
  { id: "pframe-gold", kind: "frame", name: "Laurel", rarity: "legendary", desc: "Gold with a sweeping shine." },
  { id: "pframe-flame", kind: "frame", name: "Inferno", rarity: "mythic", desc: "Your avatar, on fire." },
  { id: "pframe-prism", kind: "frame", name: "Prismatic", rarity: "secret", desc: "A rainbow ring that spins." },

  // Name styles
  { id: "pname-plain", kind: "name", name: "Plain", rarity: "common", desc: "Your name, as typed.", free: true },
  { id: "pname-accent", kind: "name", name: "Accent", rarity: "common", desc: "In your profile color." },
  { id: "pname-gradient", kind: "name", name: "Two-tone", rarity: "rare", desc: "A gradient of your two colors." },
  { id: "pname-glow", kind: "name", name: "Neon glow", rarity: "epic", desc: "Glows like a sign at night." },
  { id: "pname-gold", kind: "name", name: "Gold shimmer", rarity: "legendary", desc: "Polished gold with a moving shine." },
  { id: "pname-glitch", kind: "name", name: "Glitch", rarity: "mythic", desc: "Splits into red and cyan now and then." },
  { id: "pname-rainbow", kind: "name", name: "Rainbow", rarity: "secret", desc: "Every color, always moving." },
]

export const PROFILE_PRICE: Record<Rarity, number> = {
  common: 15_000,
  uncommon: 40_000,
  rare: 120_000,
  epic: 500_000,
  legendary: 6_000_000,
  mythic: 30_000_000,
  secret: 200_000_000,
}

export const profileItem = (id: string) => PROFILE_ITEMS.find((i) => i.id === id)

export type Profile = {
  /** Display name; empty means the email's first part. */
  name: string
  status: string
  bio: string
  /** "" = initial, "pet:<Name>" = one of your pets, or a small data:image URL. */
  avatar: string
  colors: [string, string]
  background: string
  frame: string
  nameStyle: string
  /** uids of up to 3 pets to show off. */
  showcase: string[]
}

export const DEFAULT_PROFILE: Profile = {
  name: "",
  status: "",
  bio: "",
  avatar: "",
  colors: ["#66c0f4", "#2d73ff"],
  background: "pbg-plain",
  frame: "pframe-none",
  nameStyle: "pname-plain",
  showcase: [],
}

export const PROFILE_LIMITS = { name: 24, status: 60, bio: 190, avatarBytes: 90_000, showcase: 3 }

/** Steam-style level: XP is focus minutes plus 30 per achievement. */
export function profileLevel(minutes: number, achievements: number) {
  const xp = Math.floor(minutes + achievements * 30)
  const level = Math.floor(Math.sqrt(xp / 12))
  const floor = level * level * 12
  const next = (level + 1) * (level + 1) * 12
  return { level, xp, progress: (xp - floor) / (next - floor), toNext: next - xp }
}

/** Level badge color, changing every 10 levels like Steam. */
export const LEVEL_COLORS = ["#9b9b9b", "#c02942", "#d95b43", "#fecc23", "#467a3c", "#4e8ddb", "#7652c9", "#c252c9", "#542437", "#997c52"]

const HEX = /^#[0-9a-f]{6}$/i
export function validProfile(raw: unknown): Profile {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<Profile>
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "")
  const item = (v: unknown, kind: ProfileKind, fallback: string) =>
    typeof v === "string" && PROFILE_ITEMS.some((i) => i.id === v && i.kind === kind) ? v : fallback
  const avatar =
    typeof d.avatar === "string" &&
    ((d.avatar.startsWith("pet:") && d.avatar.length < 60) || (d.avatar.startsWith("data:image/") && d.avatar.length <= PROFILE_LIMITS.avatarBytes))
      ? d.avatar
      : ""
  const colors: [string, string] =
    Array.isArray(d.colors) && HEX.test(String(d.colors[0])) && HEX.test(String(d.colors[1])) ? [d.colors[0], d.colors[1]] : DEFAULT_PROFILE.colors
  return {
    name: str(d.name, PROFILE_LIMITS.name),
    status: str(d.status, PROFILE_LIMITS.status),
    bio: str(d.bio, PROFILE_LIMITS.bio),
    avatar,
    colors,
    background: item(d.background, "background", DEFAULT_PROFILE.background),
    frame: item(d.frame, "frame", DEFAULT_PROFILE.frame),
    nameStyle: item(d.nameStyle, "name", DEFAULT_PROFILE.nameStyle),
    showcase: Array.isArray(d.showcase) ? d.showcase.filter((u) => typeof u === "string").slice(0, PROFILE_LIMITS.showcase) : [],
  }
}
