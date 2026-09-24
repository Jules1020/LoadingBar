import type { Metadata } from "next"
import { Waitlist } from "@/components/sections/Waitlist"

export const metadata: Metadata = { title: "Early access" }

export default function Page() {
  return <Waitlist />
}
