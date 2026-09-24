import type { Metadata } from "next"
import { Roadmap } from "@/components/sections/Roadmap"

export const metadata: Metadata = { title: "Roadmap" }

export default function Page() {
  return <Roadmap />
}
