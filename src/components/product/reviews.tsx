import type { ReviewSummary } from "@/lib/commerce";

const Stars = ({ value }: { value: number }) => (
  <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
    {"★".repeat(Math.round(value))}
    <span className="stars__off">{"★".repeat(5 - Math.round(value))}</span>
  </span>
);

export function RatingBadge({ summary }: { summary: ReviewSummary | null }) {
  if (!summary) return null;
  return (
    <a href="#reviews" className="rating-badge small">
      <Stars value={summary.average} /> <span>{summary.average.toFixed(1)}</span> <span className="muted">({summary.count})</span>
    </a>
  );
}

/** Real customer reviews (Judge.me). Not rendered when the provider isn't configured or has none. */
export function Reviews({ summary, locale }: { summary: ReviewSummary | null; locale: string }) {
  if (!summary) return null;
  return (
    <section id="reviews" className="section reviews" aria-labelledby="reviews-title">
      <div className="section__head">
        <h2 id="reviews-title" className="label">Customer reviews</h2>
        <p className="small"><Stars value={summary.average} /> {summary.average.toFixed(1)} · {summary.count} {summary.count === 1 ? "review" : "reviews"}</p>
      </div>
      <ul className="reviews__list">
        {summary.reviews.slice(0, 10).map((r) => (
          <li key={r.id}>
            <Stars value={r.rating} />
            {r.title && <h3>{r.title}</h3>}
            {r.body && <p>{r.body}</p>}
            <p className="small muted">
              {r.author}{r.verified ? " · Verified buyer" : ""} · <time dateTime={r.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.createdAt))}</time>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
