import type { Metadata } from "next"
import { Session } from "@/components/sections/Session"

export const metadata: Metadata = { title: "Session" }

export default function Page() {
  return <Session />
}
