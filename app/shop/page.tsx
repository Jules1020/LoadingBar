import type { Metadata } from "next"
import { Shop } from "@/components/sections/Shop"

export const metadata: Metadata = { title: "Shop", description: "Spend what your pets earned on streak freezes, boosts, upgrades and cosmetics.", alternates: { canonical: "/shop" } }

export default function Page() {
  return <Shop />
}
