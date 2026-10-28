import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { brand } from "@/config/brand";
import { Media } from "@/components/ui/media";
import { getPage } from "@/lib/shopify/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "About", description: `About ${brand.name}.`, path: "/about", locale });
}
export const revalidate = 600;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const ctx = ctxOf(marketOrDefault((await params).locale));
  const page = await getPage(ctx, "about");
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">About</h1>
      </header>
      <div className="about">
        <Media ratio="4 / 5" sizes="(min-width: 900px) 45vw, 100vw" alt="About" placeholderLabel="About image (set in src/config/brand.ts)" className="about__image" />
        <div className="about__body">
          <p className="statement__text">{brand.home.statement}</p>
          {page ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: page.body }} />
          ) : (
            <p className="muted small">The brand story hasn’t been published yet. Add a Shopify page with the handle “about”.</p>
          )}
          <Link href="/shop" className="text-link">Shop the collection</Link>
        </div>
      </div>
    </div>
  );
}
