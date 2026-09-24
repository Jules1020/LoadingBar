import { DEFAULT_EQUIPPED } from "./cosmetics"
import { PET_POOL } from "./data"
import type { State } from "./store"
import type { StreakInfo } from "./streak"

export type Achievement = {
  id: string
  name: string
  desc: string
  check: (s: State, streak: StreakInfo) => boolean
}

const totalSessions = (s: State) => Object.values(s.history).reduce((n, d) => n + d.sessions, 0)
const totalMinutes = (s: State) => Object.values(s.history).reduce((n, d) => n + d.minutes, 0)
const hourOf = (at: number) => new Date(at).getHours()

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-session", name: "Boot sequence", desc: "Finish your first session.", check: (s) => totalSessions(s) >= 1 },
  { id: "ten-sessions", name: "Loading veteran", desc: "Finish 10 sessions.", check: (s) => totalSessions(s) >= 10 },
  { id: "fifty-sessions", name: "Installer of the year", desc: "Finish 50 sessions.", check: (s) => totalSessions(s) >= 50 },
  { id: "hour", name: "Hour of power", desc: "Focus for 60 minutes in total.", check: (s) => totalMinutes(s) >= 60 },
  { id: "ten-hours", name: "Deep work", desc: "Focus for 10 hours in total.", check: (s) => totalMinutes(s) >= 600 },
  { id: "marathon", name: "Marathon", desc: "Finish a single session of 60+ minutes.", check: (s) => s.sessions.some((e) => e.minutes >= 60) },
  { id: "night-owl", name: "Night owl", desc: "Finish a session between midnight and 5 AM.", check: (s) => s.sessions.some((e) => hourOf(e.at) < 5) },
  { id: "early-bird", name: "Early bird", desc: "Finish a session between 5 and 8 AM.", check: (s) => s.sessions.some((e) => hourOf(e.at) >= 5 && hourOf(e.at) < 8) },
  { id: "daily-goal", name: "Goal getter", desc: "Hit your daily session goal.", check: (s) => Object.values(s.history).some((d) => d.sessions >= s.dailyGoal) },
  { id: "first-pull", name: "Feeling lucky", desc: "Spin the wheel.", check: (s) => Object.values(s.pulls).some((n) => (n ?? 0) > 0) },
  { id: "legendary", name: "Golden hour", desc: "Pull a Legendary pet.", check: (s) => (s.pulls.legendary ?? 0) > 0 },
  { id: "mythic", name: "Myth confirmed", desc: "Pull a Mythic pet.", check: (s) => (s.pulls.mythic ?? 0) > 0 },
  { id: "secret", name: "sudo make me a pet", desc: "Pull a Secret pet.", check: (s) => (s.pulls.secret ?? 0) > 0 },
  { id: "zoo", name: "Zookeeper", desc: "Own 10 pets.", check: (s) => s.pets.length >= 10 },
  { id: "dex", name: "Gotta load 'em all", desc: `Discover all ${PET_POOL.length} pets.`, check: (s) => new Set(s.pets.map((p) => p.name)).size >= PET_POOL.length },
  { id: "big-spender", name: "Big spender", desc: "Spend $1,000,000 in the shop.", check: (s) => s.spent >= 1_000_000 },
  { id: "max-level", name: "Fully upgraded", desc: "Get a pet to level 10.", check: (s) => s.pets.some((p) => p.level >= 10) },
  { id: "millionaire", name: "Millionaire", desc: "Hold $1,000,000 in your wallet.", check: (s) => s.balance >= 1_000_000 },
  { id: "streak-2", name: "On fire", desc: "Reach a 2-week streak.", check: (_s, st) => st.best >= 2 },
  { id: "streak-8", name: "Unstoppable", desc: "Reach an 8-week streak.", check: (_s, st) => st.best >= 8 },
  {
    id: "fashion",
    name: "Dressed up",
    desc: "Equip a skin, theme or screen that isn't the default.",
    check: (s) => s.equipped.bar !== DEFAULT_EQUIPPED.bar || s.equipped.theme !== DEFAULT_EQUIPPED.theme || s.equipped.screen !== DEFAULT_EQUIPPED.screen,
  },
]

export const stats = { totalSessions, totalMinutes }
