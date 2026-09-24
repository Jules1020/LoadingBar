import type { Metadata } from "next"
import { Progress, type ProgressTab } from "@/components/sections/Progress"

export const metadata: Metadata = { title: "Progress", description: "Your weekly streak, focus stats, achievements and the leaderboards.", alternates: { canonical: "/progress" } }

// Kept here: values exported from a client module can't be read on the server.
const TABS: ProgressTab[] = ["streak", "stats", "podium"]

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const initial = TABS.includes(tab as ProgressTab) ? (tab as ProgressTab) : "streak"
  return <Progress key={initial} initial={initial} />
}
