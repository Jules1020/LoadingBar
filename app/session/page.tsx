import type { Metadata } from "next"
import { Session } from "@/components/sections/Session"

export const metadata: Metadata = { title: "Session", description: "Start a focus session: pick a length and watch the loading bar fill.", alternates: { canonical: "/session" } }

export default function Page() {
  return <Session />
}
