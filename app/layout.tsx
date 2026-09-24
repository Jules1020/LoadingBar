import type { Metadata, Viewport } from "next"
import { Fraunces, Geist, Geist_Mono, Orbitron, Press_Start_2P, Space_Grotesk, VT323 } from "next/font/google"
import { StatusBar } from "@/components/StatusBar"
import { Engine } from "@/components/Engine"
import { FxLayer } from "@/components/FxLayer"
import { MiniPlayer } from "@/components/MiniPlayer"
import { Toaster } from "@/components/Toaster"
import { ShortcutsHelp } from "@/components/ShortcutsHelp"
import { Announcement } from "@/components/Announcement"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
// Theme fonts: only downloaded when a theme uses them.
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323", display: "swap", preload: false })
const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press", display: "swap", preload: false })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", preload: false, style: ["normal", "italic"] })
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap", preload: false })
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", display: "swap", preload: false })
const fontVars = [geist, geistMono, vt323, press, fraunces, grotesk, orbitron].map((f) => f.variable).join(" ")

export const metadata: Metadata = {
  title: { default: "<LoadingBar> · your focus session is loading", template: "%s · <LoadingBar>" },
  description:
    "A focus timer disguised as a game loading screen. Fill the bar, spin the wheel, let your pets earn, keep your streak alive.",
}

export const viewport: Viewport = {
  themeColor: "#0a1018",
}

// Applies the saved theme (and where it puts the tabs) before first paint so nothing flashes.
const themeBoot = `try{var d=document.documentElement,t=localStorage.getItem("lb-theme"),n=localStorage.getItem("lb-nav");if(t)d.dataset.theme=t.replace("theme-","");if(n)d.dataset.nav=n}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-16 focus:left-3 focus:z-[80] focus:rounded-md focus:bg-accent focus:px-3 focus:py-1.5 focus:text-bg"
        >
          Skip to content
        </a>
        {/* Fixed-height app shell: views are laid out to fit the window. The content area only
            scrolls as a fallback when a window is too small to fit a view. */}
        {/* The tab bar sits on top by default; layout themes move it (side:, side-r:, dock: variants). */}
        <div className="app-bg flex h-dvh flex-col side:flex-row side-r:flex-row-reverse dock:flex-col-reverse">
          <StatusBar />
          <Engine />
          <main id="main" className="scroll-thin relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <Announcement />
            <div className="min-h-0 flex-1">{children}</div>
          </main>
        </div>
        <MiniPlayer />
        <Toaster />
        <ShortcutsHelp />
        <FxLayer />
      </body>
    </html>
  )
}
