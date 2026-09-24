import { permanentRedirect } from "next/navigation"

// Merged into /progress; permanent so search engines move the old URL over.
export default function Page() {
  permanentRedirect("/progress?tab=stats")
}
