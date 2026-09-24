import type { Metadata } from "next"
import { Profile } from "@/components/sections/Profile"

export const metadata: Metadata = { title: "Profile", description: "Customize your profile with animated backgrounds, avatar frames and name styles.", alternates: { canonical: "/profile" } }

export default function Page() {
  return <Profile />
}
