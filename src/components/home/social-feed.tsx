import { brand } from "@/config/brand";
import { Media } from "@/components/ui/media";

/** Hand-picked posts (real URLs). Hidden when none are configured. */
export function SocialFeed() {
  const { title, handle, posts } = brand.socialFeed;
  if (posts.length === 0) return null;
  return (
    <section className="section" aria-labelledby="social-title">
      <div className="section__head">
        <h2 id="social-title" className="label">{title}{handle ? ` · @${handle}` : ""}</h2>
      </div>
      <ul className="social-grid">
        {posts.slice(0, 6).map((p) => (
          <li key={p.href}>
            <a href={p.href} target="_blank" rel="noopener noreferrer">
              <Media src={p.image} alt={p.alt} ratio="1 / 1" sizes="(min-width: 900px) 16vw, 33vw" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
