import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { ArticleCard } from "@/components/home/sections";
import { getArticles } from "@/lib/shopify/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Journal", description: `Stories from ${brand.name}.`, path: "/journal", locale });
}
export const revalidate = 600;

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const ctx = ctxOf(marketOrDefault((await params).locale));
  const { articles } = await getArticles(ctx, brand.home.journal.blog, { first: 24 });
  const [lead, ...rest] = articles;
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Journal</h1>
      </header>
      {articles.length === 0 ? (
        <p className="muted">No stories published yet.</p>
      ) : (
        <>
          <div className="journal-lead"><ArticleCard article={lead} ratio="16 / 9" /></div>
          <ul className="journal-grid">
            {rest.map((a, i) => (
              <li key={a.id} className={i % 3 === 1 ? "journal-grid__offset" : undefined}>
                <ArticleCard article={a} ratio={i % 2 === 0 ? "4 / 5" : "1 / 1"} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
