/** Re-mounts on every navigation so the CSS entrance animation replays. Disabled for reduced motion. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
