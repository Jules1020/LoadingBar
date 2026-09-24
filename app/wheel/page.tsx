import type { Metadata } from "next"
import { GachaWheel } from "@/components/sections/GachaWheel"

export const metadata: Metadata = { title: "Wheel" }

export default function Page() {
  return <GachaWheel />
}
