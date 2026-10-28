/** Placeholder shapes shown while a route streams in. Purely visual; announced once as "Loading". */
export function GridSkeleton({ count = 8, title = true }: { count?: number; title?: boolean }) {
  return (
    <div className="page" aria-busy="true">
      <p className="visually-hidden" role="status">Loading…</p>
      {title && <div className="skel skel--title" />}
      <ul className="grid-products" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <div className="skel skel--card" />
            <div className="skel skel--line" />
            <div className="skel skel--line skel--short" />
          </li>
        ))}
      </ul>
    </div>
  );
}
