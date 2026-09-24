/** Re-mounts on every navigation, so each view fades in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in h-full">{children}</div>
}
