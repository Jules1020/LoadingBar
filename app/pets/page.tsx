import type { Metadata } from "next"
import { Pets } from "@/components/sections/Pets"

export const metadata: Metadata = { title: "Pets" }

export default function Page() {
  return <Pets />
}
