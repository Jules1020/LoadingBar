import type { Metadata } from "next"
import { Waitlist } from "@/components/sections/Waitlist"

export const metadata: Metadata = { title: "Early access", description: "Get early access to the <LoadingBar> app: a focus timer that plays like a game.", alternates: { canonical: "/join" } }

export default function Page() {
  return <Waitlist />
}
