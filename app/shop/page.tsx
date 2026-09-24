import type { Metadata } from "next"
import { Shop } from "@/components/sections/Shop"

export const metadata: Metadata = { title: "Shop" }

export default function Page() {
  return <Shop />
}
