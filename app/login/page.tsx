import type { Metadata } from "next"
import { Login } from "@/components/sections/Login"

export const metadata: Metadata = { title: "Sign in", description: "Sign in to sync your pets, streak and cosmetics across devices.", robots: { index: false, follow: true } }

export default function Page() {
  return <Login />
}
