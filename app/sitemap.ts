import type { MetadataRoute } from "next"
import { PUBLIC_ROUTES, SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.6,
  }))
}
