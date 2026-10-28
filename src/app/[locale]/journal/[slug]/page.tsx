import { ctxOf, localizePath, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { ArticleCard } from "@/components/home/sections";
import { ShopifyMedia } from "@/components/ui/media";
import { getArticle, getArticles } from "@/lib/shopify/catalog";
import { absoluteUrl, jsonLdString, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };
export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const ctx = ctxOf(marketOrDefault(locale));
  const article = await getArticle(ctx, brand.home.journal.blog, slug);
  if (!article) return { title: "Story not found" };
  return pageMetadata({
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.excerpt || undefined,
    path: `/journal/${slug}`,
    image: article.image?.url,
    locale,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug, locale } = await params;
  const ctx = ctxOf(marketOrDefault(locale));
  const article = await getArticle(ctx, brand.home.journal.blog, slug);
  if (!article) notFound();
  const { articles } = await getArticles(ctx, brand.home.journal.blog, { first: 4 });
  const related = articles.filter((a) => a.id !== article.id).slice(0, 3);
  const date = new Intl.DateTimeFormat(brand.locale, { dateStyle: "long" }).format(new Date(article.publishedAt));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.publishedAt,
    image: article.image?.url,
    mainEntityOfPage: absoluteUrl(localizePath(locale, `/journal/${slug}`)),
    publisher: { "@type": "Organization", name: brand.name },
  };

  return (
    <article className="page article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <header className="article__head">
        <p className="label"><Link href="/journal">Journal</Link> · <time dateTime={article.publishedAt}>{date}</time></p>
        <h1 className="page-title">{article.title}</h1>
        {article.excerpt && <p className="page-lede muted">{article.excerpt}</p>}
      </header>
      {article.image && <ShopifyMedia image={article.image} ratio="16 / 9" sizes="100vw" priority className="article__hero" />}
      <div className="prose article__body" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      {related.length > 0 && (
        <section className="section" aria-labelledby="more-title">
          <div className="section__head"><h2 id="more-title" className="label">More stories</h2></div>
          <ul className="journal-grid">
            {related.map((a) => (
              <li key={a.id}><ArticleCard article={a} /></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
