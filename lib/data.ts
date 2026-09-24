export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "secret"
export type WheelKind = Rarity | "freeze" | "cosmetic"

export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "secret"]

/** Vector pet description, drawn by <PetAvatar>. */
export type Avatar = {
  body: "round" | "blob" | "tall" | "square" | "bean" | "ghost"
  color: string
  belly?: string
  eyes: "dot" | "happy" | "sleepy" | "big" | "visor" | "cyclops" | "star"
  top?: "cat" | "bunny" | "horns" | "antenna" | "leaf" | "crown" | "halo" | "flame" | "spikes"
  extra?: "wings" | "tail" | "glasses" | "cape"
  pattern?: "spots" | "stripes"
}

export type PetDef = {
  name: string
  rarity: Rarity
  rate: number
  avatar: Avatar
}

// Steam-market-style rarity ladder. `gradient` marks the animated top tier.
export const RARITY: Record<WheelKind, { label: string; hex: string; gradient?: string }> = {
  common: { label: "Common", hex: "#b0c3d9" },
  uncommon: { label: "Uncommon", hex: "#6cc04a" },
  rare: { label: "Rare", hex: "#4b8bff" },
  epic: { label: "Epic", hex: "#a970ff" },
  legendary: { label: "Legendary", hex: "#e4ae39" },
  mythic: { label: "Mythic", hex: "#ff4d6d" },
  secret: {
    label: "Secret",
    hex: "#ff7ae0",
    gradient: "linear-gradient(90deg,#ff5f6d,#ffc371,#47e891,#44a0ff,#b06cff,#ff5f6d)",
  },
  freeze: { label: "Streak Freeze", hex: "#5ec8e5" },
  cosmetic: { label: "Cosmetic", hex: "#3ddbd9" },
}

export const PET_POOL: PetDef[] = [
  // common
  { name: "Byte Mite", rarity: "common", rate: 4, avatar: { body: "bean", color: "#8fb3c9", eyes: "dot", top: "antenna" } },
  { name: "Cursor Cat", rarity: "common", rate: 6, avatar: { body: "round", color: "#c9d3de", belly: "#eef2f6", eyes: "happy", top: "cat" } },
  { name: "Lint Bunny", rarity: "common", rate: 7, avatar: { body: "round", color: "#e6dfd6", eyes: "sleepy", top: "bunny" } },
  // uncommon
  { name: "Pixel Slime", rarity: "uncommon", rate: 14, avatar: { body: "blob", color: "#6cc04a", eyes: "big", pattern: "spots" } },
  { name: "Null Pigeon", rarity: "uncommon", rate: 12, avatar: { body: "round", color: "#9aa7b5", belly: "#d7dde4", eyes: "dot", extra: "wings" } },
  { name: "Patch Frog", rarity: "uncommon", rate: 16, avatar: { body: "bean", color: "#58b368", belly: "#b8e6a8", eyes: "big", top: "leaf" } },
  // rare
  { name: "Stack Owl", rarity: "rare", rate: 45, avatar: { body: "tall", color: "#8a6b4f", belly: "#d9c3a5", eyes: "big", top: "horns" } },
  { name: "Proxy Fox", rarity: "rare", rate: 52, avatar: { body: "round", color: "#e8833a", belly: "#fbe3cf", eyes: "happy", top: "cat", extra: "tail" } },
  { name: "Ping Penguin", rarity: "rare", rate: 60, avatar: { body: "tall", color: "#2b3a4a", belly: "#e9eef4", eyes: "dot", extra: "wings" } },
  // epic
  { name: "Daemon Wolf", rarity: "epic", rate: 180, avatar: { body: "tall", color: "#6d6f86", belly: "#b9bbcc", eyes: "visor", top: "cat" } },
  { name: "Overclock Koi", rarity: "epic", rate: 220, avatar: { body: "bean", color: "#ff8c5a", belly: "#ffe0cf", eyes: "big", extra: "tail", pattern: "stripes" } },
  { name: "Glitch Moth", rarity: "epic", rate: 240, avatar: { body: "round", color: "#a970ff", eyes: "big", top: "antenna", extra: "wings" } },
  // legendary
  { name: "Kernel Dragon", rarity: "legendary", rate: 1000, avatar: { body: "tall", color: "#e4ae39", belly: "#fff1c1", eyes: "happy", top: "horns", extra: "wings" } },
  { name: "Golden Floppy", rarity: "legendary", rate: 1200, avatar: { body: "square", color: "#e4c05a", eyes: "visor", top: "crown" } },
  { name: "Root Phoenix", rarity: "legendary", rate: 900, avatar: { body: "round", color: "#ff7a3d", belly: "#ffd8a8", eyes: "happy", top: "flame", extra: "wings" } },
  // mythic
  { name: "Void Kraken", rarity: "mythic", rate: 4000, avatar: { body: "blob", color: "#6b2df0", eyes: "cyclops", extra: "tail", pattern: "spots" } },
  { name: "Quantum Cat", rarity: "mythic", rate: 5000, avatar: { body: "round", color: "#ff4d6d", belly: "#ffd1db", eyes: "star", top: "cat", extra: "glasses" } },
  { name: "Firewall Titan", rarity: "mythic", rate: 4500, avatar: { body: "square", color: "#c0392b", eyes: "visor", top: "spikes", extra: "cape" } },
  // added in the shop update
  { name: "Pixel Pup", rarity: "common", rate: 5, avatar: { body: "round", color: "#d9b38c", belly: "#f3e3cf", eyes: "happy", extra: "tail" } },
  { name: "Socket Snail", rarity: "common", rate: 6, avatar: { body: "bean", color: "#c7a4d8", eyes: "dot", top: "antenna" } },
  { name: "Ram Ram", rarity: "uncommon", rate: 15, avatar: { body: "round", color: "#9ec5e8", belly: "#e3f0fb", eyes: "big", top: "horns" } },
  { name: "Cookie Crab", rarity: "uncommon", rate: 13, avatar: { body: "bean", color: "#e59866", eyes: "dot", top: "spikes", pattern: "spots" } },
  { name: "Router Raccoon", rarity: "rare", rate: 55, avatar: { body: "round", color: "#7f8c8d", belly: "#d5dbdb", eyes: "dot", top: "cat", extra: "glasses" } },
  { name: "Latency Llama", rarity: "rare", rate: 48, avatar: { body: "tall", color: "#e8dcc8", eyes: "sleepy", top: "bunny" } },
  { name: "Cloud Kitsune", rarity: "epic", rate: 210, avatar: { body: "round", color: "#9fd6ff", belly: "#eaf6ff", eyes: "happy", top: "cat", extra: "tail" } },
  { name: "Aurora Stag", rarity: "legendary", rate: 1100, avatar: { body: "tall", color: "#7cf5c6", belly: "#dcfff1", eyes: "happy", top: "horns" } },
  { name: "Blackhole Bunny", rarity: "mythic", rate: 4800, avatar: { body: "round", color: "#2a1a55", belly: "#4b3a8a", eyes: "star", top: "bunny", pattern: "spots" } },
  // secret
  { name: "sudo", rarity: "secret", rate: 25000, avatar: { body: "ghost", color: "#f4f7ff", eyes: "star", top: "halo" } },
  { name: "Error 404", rarity: "secret", rate: 20000, avatar: { body: "ghost", color: "#94a3b8", eyes: "sleepy", extra: "glasses" } },
  { name: "The Compiler", rarity: "secret", rate: 30000, avatar: { body: "square", color: "#1f2937", eyes: "cyclops", top: "crown", extra: "cape" } },
]

export const STARTER_PETS: PetDef[] = [PET_POOL[0], PET_POOL[1], PET_POOL[6]]

// Wheel layout, clockwise from 12 o'clock. Visual only — odds come from ODDS.
export const WHEEL: WheelKind[] = [
  "legendary", "common", "uncommon", "rare", "common", "cosmetic", "uncommon", "epic",
  "common", "freeze", "uncommon", "rare", "mythic", "common", "cosmetic", "secret",
]

export const ODDS: Record<WheelKind, number> = {
  common: 0.3,
  uncommon: 0.2,
  rare: 0.14,
  epic: 0.08,
  legendary: 0.04,
  mythic: 0.015,
  secret: 0.005,
  freeze: 0.07,
  cosmetic: 0.15,
}

export const FLAME_TIERS = [
  { name: "Ember", weeks: 0, mult: 1.0 },
  { name: "Spark", weeks: 1, mult: 1.1 },
  { name: "Kindle", weeks: 2, mult: 1.25 },
  { name: "Blaze", weeks: 4, mult: 1.5 },
  { name: "Inferno", weeks: 8, mult: 2.0 },
  { name: "Supernova", weeks: 12, mult: 3.0 },
]

export function flameTier(weeks: number) {
  let tier = 0
  FLAME_TIERS.forEach((t, i) => {
    if (weeks >= t.weeks) tier = i
  })
  return tier
}

export const DURATION_PRESETS = [25, 35, 45] as const
export const MIN_DURATION = 1
export const MAX_DURATION = 180

export const LOADING_LINES = [
  "Deleting your excuses…",
  "Summoning motivation.exe…",
  "Compiling willpower…",
  "Defragmenting your to-do list…",
  "Muting 14 group chats…",
  "Downloading more RAM for your brain…",
  "Reticulating deadlines…",
  "Bribing the procrastination daemon…",
  "Hiding your phone (virtually)…",
  "Loading focus textures (HD)…",
  "Negotiating with the snooze button…",
  "Feeding the pets. They grind, you grind…",
]

export const ROUTES = [
  { href: "/", label: "Home" },
  { href: "/session", label: "Session" },
  { href: "/wheel", label: "Wheel" },
  { href: "/pets", label: "Pets" },
  { href: "/shop", label: "Shop" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
  { href: "/join", label: "Early access" },
] as const
