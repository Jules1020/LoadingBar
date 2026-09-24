// Future development shown on the Roadmap page. Edit freely: the page lays itself out from this list.

export type RoadmapStatus = "next" | "planned" | "exploring"
export type RoadmapArea = "focus" | "social" | "game" | "apps" | "platform"

export type RoadmapItem = { title: string; desc: string; area: RoadmapArea; status: RoadmapStatus }

export const ROADMAP_STATUS: Record<RoadmapStatus, { label: string; hint: string }> = {
  next: { label: "Next up", hint: "Needed before a real launch" },
  planned: { label: "Planned", hint: "Designed and wanted" },
  exploring: { label: "Exploring", hint: "Still an idea" },
}

export const ROADMAP_AREAS: { id: RoadmapArea; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "social", label: "Social" },
  { id: "game", label: "Game" },
  { id: "apps", label: "Apps & integrations" },
  { id: "platform", label: "Platform" },
]

export const FUTURE: RoadmapItem[] = [
  // Focus
  {
    area: "focus",
    status: "next",
    title: "Breaks between sessions",
    desc: "A short break after each bar and a long one every fourth, with its own calm screen. Pets rest too.",
  },
  {
    area: "focus",
    status: "next",
    title: "Resume after a refresh",
    desc: "A reload or crash mid-session forfeits it today. Sessions will pick up where they left off.",
  },
  {
    area: "focus",
    status: "planned",
    title: "Task lists",
    desc: "Attach a to-do list to a session, tick items off as the bar fills, and see focus time per task.",
  },

  // Social
  {
    area: "social",
    status: "planned",
    title: "Study rooms",
    desc: "Load one shared bar with friends. Everyone has to finish to earn the room bonus.",
  },
  {
    area: "social",
    status: "planned",
    title: "Friends & public profiles",
    desc: "Visit friends' profiles, compare streaks and gift each other a spin.",
  },
  {
    area: "social",
    status: "exploring",
    title: "Weekly leagues",
    desc: "Leagues ranked by focus minutes instead of money, so the podium rewards effort.",
  },

  // Game
  {
    area: "game",
    status: "planned",
    title: "Seasons",
    desc: "A season track that turns focus hours into exclusive cosmetics, refreshed every few months.",
  },
  {
    area: "game",
    status: "planned",
    title: "Daily quests",
    desc: "Small goals like “two sessions before noon” that pay out spins or streak freezes.",
  },
  {
    area: "game",
    status: "exploring",
    title: "Pet market",
    desc: "Trade duplicate pets with other players, paid with what your pets earn.",
  },

  // Apps & integrations
  {
    area: "apps",
    status: "planned",
    title: "Mobile app",
    desc: "A phone app that turns on focus mode during a session and notifies you when the bar hits 100%.",
  },
  {
    area: "apps",
    status: "exploring",
    title: "Site blocker",
    desc: "A browser extension that blocks distracting sites while a bar is loading.",
  },
  {
    area: "apps",
    status: "exploring",
    title: "Calendar sync",
    desc: "Put sessions on your calendar and start one straight from a calendar block.",
  },

  // Platform
  {
    area: "platform",
    status: "next",
    title: "Real database & email",
    desc: "Move accounts off JSON files to a hosted database, with email verification and password reset.",
  },
  {
    area: "platform",
    status: "planned",
    title: "Server-checked progress",
    desc: "Money and streaks are worked out in the browser today. The server will verify sessions so leaderboards can't be faked.",
  },
  {
    area: "platform",
    status: "exploring",
    title: "Translations",
    desc: "The site in more languages, starting with the most requested ones.",
  },
]
