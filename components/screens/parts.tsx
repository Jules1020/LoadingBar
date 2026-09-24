"use client"

import { useEffect } from "react"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { motionTokens } from "@/lib/motion-tokens"
import { useFrame, type Frame } from "@/lib/session"

// Building blocks shared by every loading screen.

export type ScreenProps = {
  skin: string
  /** Rotating joke line under the bar, or null when turned off. */
  line: string | null
  /** Static frame for thumbnails; live screens follow the session runtime. */
  preview?: Frame
  /** What the user said they're working on. */
  task?: string
}

/** Runs `cb` on every live frame, or once with the static preview frame. */
export function useScreenFrame(preview: Frame | undefined, cb: (f: Frame) => void) {
  useFrame(cb, !preview)
  useEffect(() => {
    if (preview) cb(preview)
  })
}

export function Pct({ whole, dec, className = "", decClass = "" }: { whole: React.Ref<HTMLSpanElement>; dec: React.Ref<HTMLSpanElement>; className?: string; decClass?: string }) {
  return (
    <span className={`tabular-nums ${className}`}>
      <span ref={whole}>0</span>
      <span className={decClass}>
        <span ref={dec}>.0</span>%
      </span>
    </span>
  )
}

export function Line({ text, className = "" }: { text: string | null; className?: string }) {
  return (
    <div className={`h-8 ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {text && (
          <m.p
            key={text}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
            className="text-center text-muted"
          >
            {text}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Thumbnails sit inside clickable cards, so their controls render as decorative spans. */
export function Ctrl({ preview, onClick, label, className, children }: { preview: boolean; onClick: () => void; label: string; className: string; children: React.ReactNode }) {
  if (preview) return <span className={className}>{children}</span>
  return (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {children}
    </button>
  )
}

