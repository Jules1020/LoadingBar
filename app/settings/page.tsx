import type { Metadata } from "next"
import { Settings } from "@/components/sections/Settings"

export const metadata: Metadata = { title: "Settings", description: "Loading bar skins, themes, loading screens, music and your data.", robots: { index: false, follow: true } }

export default function Page() {
  return <Settings />
}
