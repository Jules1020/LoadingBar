import type { Metadata } from "next"
import { Pets } from "@/components/sections/Pets"

export const metadata: Metadata = { title: "Pets", description: "Your pets earn money only while a focus session is loading. Collect their pads and upgrade them.", alternates: { canonical: "/pets" } }

export default function Page() {
  return <Pets />
}
