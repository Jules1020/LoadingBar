"use client"

import { type HTMLMotionProps } from "motion/react"
import * as m from "motion/react-m"
import { motionTokens, springs } from "@/lib/motion-tokens"

type Variant = "play" | "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const VARIANTS: Record<Variant, string> = {
  play: "btn-play shadow-lg shadow-black/30",
  primary: "btn-primary shadow-lg shadow-black/30",
  secondary: "border border-line bg-white/[0.06] text-fg hover:bg-white/[0.1]",
  ghost: "text-muted hover:bg-white/[0.06] hover:text-fg",
  danger: "border border-danger/30 bg-danger/15 text-danger hover:bg-danger/25",
}

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-md px-6 text-base",
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: Omit<HTMLMotionProps<"button">, "children"> & { variant?: Variant; size?: Size; children?: React.ReactNode }) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: motionTokens.scale.press }}
      transition={springs.instant}
      className={`inline-flex cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </m.button>
  )
}
