"use client"

import { LazyMotion } from "motion/react"

// Animation features load after first paint instead of shipping with every page.
// `strict` makes a stray full `motion.*` component throw, so the savings can't silently regress.
const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}
