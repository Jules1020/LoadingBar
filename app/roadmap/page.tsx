import type { Metadata } from "next"
import { Roadmap } from "@/components/sections/Roadmap"

export const metadata: Metadata = { title: "Roadmap", description: "What is coming next to <LoadingBar>.", alternates: { canonical: "/roadmap" } }

export default function Page() {
  return <Roadmap />
}
