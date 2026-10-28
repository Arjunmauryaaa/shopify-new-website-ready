import Link from "@/components/ui/link";
import { brand, type CampaignImage, type EditorialPanel } from "@/config/brand";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { ProductCardView } from "@/components/product/product-card";
import { Media, ShopifyMedia } from "@/components/ui/media";
import { Reveal } from "@/components/ui/reveal";
import type { Article, Collection, ProductCard } from "@/lib/shopify/types";

export function Hero() {
  const { main, secondary, columns } = brand.home.hero;
  return (
    <section className="hero" aria-label="Campaign" data-caption={brand.home.captionTone} style={{ "--hero-cols": columns } as React.CSSProperties}>
      <Link href={main.href} className="hero__main">
        <Media
          src={main.image.src}
          alt={main.image.alt}
          position={main.image.position}
          sizes="(min-width: 900px) 66vw, 100vw"
          priority
          fill
          placeholderLabel="Campaign image — main (set in src/config/brand.ts)"
          className="hero__img"
        />
        <div className="hero__caption">
          <p className="label">{main.eyebrow}</p>
          <p className="hero__caption-text">{main.caption}</p>
          <span className="text-link">{main.linkLabel}</span>
        </div>
      </Link>
      <Link href={secondary.href} className="hero__secondary" aria-label={secondary.caption}>
        <Media
          src={secondary.image.src}
          alt={secondary.image.alt}
          position={secondary.image.position}
          sizes="(min-width: 900px) 33vw, 100vw"
          priority
          fill
          placeholderLabel="Campaign image — secondary"
          className="hero__img"
        />
        <p className="hero__caption hero__caption--small small">{secondary.caption}</p>
      </Link>
    </section>
  );
}

function Panel({ panel, index }: { panel: EditorialPanel; index: number }) {
  return (
    <Reveal className={`panel panel--${index % 2 === 0 ? "a" : "b"}`}>
      <Link href={panel.href} className="panel__link">
        <Media
          src={panel.image.src}
          alt={panel.image.alt}
          position={panel.image.position}
          ratio={panel.ratio}
          sizes="(min-width: 900px) 45vw, 100vw"
          placeholderLabel={`Editorial image — ${panel.caption}`}
        />
        <div className="panel__caption">
          <span className="label">{panel.eyebrow}</span>
          <span>{panel.caption}</span>
        </div>
      </Link>
    </Reveal>
  );
}

export function EditorialPanels() {
  return (
    <section className="panels" aria-label="Editorial">
      {brand.home.panels.map((p, i) => (
        <Panel key={p.href + p.caption} panel={p} index={i} />
      ))}
    </section>
  );
}

export function NewArrivals({ products }: { products: ProductCard[] }) {
  if (products.length === 0) return null;
  return (
    <section className="section" aria-labelledby="new-arrivals-title">
      <div className="section__head">
        <h2 id="new-arrivals-title" className="label">{brand.home.newArrivals.title}</h2>
        <Link href={`/collections/${brand.home.newArrivals.collection}`} className="text-link">View all</Link>
      </div>
      <ul className="grid-products">
        {products.map((p) => (
          <li key={p.id}>
            <Reveal>
              <ProductCardView product={p} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CampaignStory() {
  const s = brand.home.story;
  return (
    <section className="story" aria-label="Campaign story">
      <Media
        src={s.image.src}
        alt={s.image.alt}
        position={s.image.position}
        ratio="21 / 9"
        sizes="100vw"
        className="story__img"
        placeholderLabel="Campaign image — story (wide)"
      />
      <Reveal className="story__text">
        <p className="label">{s.eyebrow}</p>
        <h2 className="display">{s.headline}</h2>
        <p className="muted">{s.body}</p>
        <Link href={s.href} className="text-link">{s.linkLabel}</Link>
      </Reveal>
    </section>
  );
}

export function FeaturedCollection({ collection, products }: { collection: Collection; products: ProductCard[] }) {
  const f = brand.home.featured;
  const image = f.image.src ? { url: f.image.src, altText: f.image.alt, width: null, height: null } : collection.image;
  return (
    <section className="featured" aria-labelledby="featured-title">
      <Link href={`/collections/${collection.handle}`} className="featured__image">
        <ShopifyMedia image={image} ratio="3 / 4" sizes="(min-width: 900px) 40vw, 100vw" alt={f.image.alt} placeholderLabel="Collection image" />
      </Link>
      <div className="featured__body">
        <p className="label">{f.eyebrow}</p>
        <h2 id="featured-title" className="display">{collection.title || f.title}</h2>
        {(collection.description || f.body) && <p className="muted">{collection.description || f.body}</p>}
        <ul className="featured__list">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCardView product={p} ratio="1 / 1" sizes="(min-width: 900px) 20vw, 50vw" />
            </li>
          ))}
        </ul>
        <Link href={`/collections/${collection.handle}`} className="text-link">Shop the collection</Link>
      </div>
    </section>
  );
}

export function Statement() {
  return (
    <section className="statement" aria-label="Brand statement">
      <Reveal>
        <p className="statement__text">{brand.home.statement}</p>
      </Reveal>
    </section>
  );
}

export function JournalPreview({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="section" aria-labelledby="journal-title">
      <div className="section__head">
        <h2 id="journal-title" className="label">{brand.home.journal.title}</h2>
        <Link href="/journal" className="text-link">All stories</Link>
      </div>
      <ul className="journal-grid">
        {articles.map((a) => (
          <li key={a.id}>
            <ArticleCard article={a} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArticleCard({ article, ratio = "4 / 5" }: { article: Article; ratio?: string }) {
  const date = new Intl.DateTimeFormat(brand.locale, { dateStyle: "long" }).format(new Date(article.publishedAt));
  return (
    <Link href={`/journal/${article.handle}`} className="article-card">
      <ShopifyMedia image={article.image} ratio={ratio} sizes="(min-width: 900px) 33vw, 100vw" alt={article.image?.altText ?? article.title} placeholderLabel="Article image" />
      <p className="label">{article.tags[0] ?? "Journal"} · <time dateTime={article.publishedAt}>{date}</time></p>
      <h3 className="article-card__title">{article.title}</h3>
    </Link>
  );
}

export function NewsletterSection() {
  return (
    <section className="newsletter-section" aria-label="Newsletter">
      <div className="newsletter-section__inner">
        <h2 className="display">Stay in touch</h2>
        <NewsletterForm id="home-newsletter" />
      </div>
    </section>
  );
}

export type { CampaignImage };
