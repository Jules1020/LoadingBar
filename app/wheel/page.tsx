import type { Metadata } from "next"
import { GachaWheel } from "@/components/sections/GachaWheel"

export const metadata: Metadata = { title: "Wheel", description: "Finish a session to spin the wheel for pets, streak freezes and cosmetics.", alternates: { canonical: "/wheel" } }

export default function Page() {
  return <GachaWheel />
}
