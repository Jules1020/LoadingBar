import { PET_POOL } from "@/lib/data"
import type { Profile } from "@/lib/profile"
import { PetAvatar } from "./PetAvatar"

/** Round avatar (initial, pet or uploaded image) wearing the profile's frame. */
export function ProfileAvatar({
  profile,
  fallback,
  size,
  className = "",
}: {
  profile: Pick<Profile, "avatar" | "colors" | "frame">
  /** Letter shown when there's no avatar. */
  fallback: string
  size: number
  className?: string
}) {
  const [c1, c2] = profile.colors
  const pet = profile.avatar.startsWith("pet:") ? PET_POOL.find((p) => p.name === profile.avatar.slice(4)) : null
  const image = profile.avatar.startsWith("data:image/") ? profile.avatar : null
  return (
    <span
      className={`pframe ${profile.frame} relative inline-grid shrink-0 place-items-center rounded-full ${className}`}
      style={{ width: size, height: size, "--c1": c1, "--c2": c2 } as React.CSSProperties}
    >
      <span className="grid size-full place-items-center overflow-hidden rounded-full" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" draggable={false} className="size-full object-cover" />
        ) : pet ? (
          <PetAvatar avatar={pet.avatar} size={Math.round(size * 0.92)} className="translate-y-[6%]" />
        ) : (
          <span className="font-bold text-white uppercase drop-shadow" style={{ fontSize: size * 0.44 }}>
            {fallback.slice(0, 1) || "?"}
          </span>
        )}
      </span>
    </span>
  )
}
