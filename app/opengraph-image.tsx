import { ImageResponse } from "next/og"
import { SITE_DESCRIPTION } from "@/lib/site"

// The link preview: the loading bar itself, drawn at build time (no image files in the repo).
export const alt = "<LoadingBar>: a focus timer disguised as a game loading screen"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          color: "#e9eef4",
          background: "radial-gradient(900px 500px at 10% 0%, rgba(102,192,244,0.22), transparent 60%), linear-gradient(180deg, #0e1621, #0a1018)",
        }}
      >
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: -3 }}>
          <span style={{ color: "#64778d" }}>&lt;</span>
          <span>Loading</span>
          <span style={{ color: "#66c0f4" }}>Bar</span>
          <span style={{ color: "#64778d" }}>&gt;</span>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: "#97a7b9", maxWidth: 900 }}>{SITE_DESCRIPTION}</div>
        <div style={{ display: "flex", marginTop: 64, height: 44, width: "100%", background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.14)" }}>
          <div style={{ display: "flex", width: "62%", height: "100%", background: "linear-gradient(90deg, #2d73ff, #66c0f4 60%, #a4d007)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 40, fontWeight: 700 }}>
          <span>62.4%</span>
          <span style={{ background: "linear-gradient(90deg, #75b022, #588a1b)", color: "#f2ffe0", padding: "4px 18px" }}>14.2 GB/S</span>
        </div>
      </div>
    ),
    size,
  )
}
