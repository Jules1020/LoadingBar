// Public site facts shared by metadata, the sitemap and the share image.

/** Set NEXT_PUBLIC_SITE_URL in production so links and share images are absolute. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
export const SITE_NAME = "<LoadingBar>"
export const SITE_DESCRIPTION =
  "A focus timer disguised as a game loading screen. Fill the bar, spin the wheel, let your pets earn, keep your streak alive."

/** Pages worth indexing, for the sitemap. Account-specific pages are left out. */
export const PUBLIC_ROUTES = ["/", "/session", "/wheel", "/pets", "/shop", "/progress", "/profile", "/join", "/roadmap"]
