import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { ProductGrid } from "@/components/shop/product-grid";
import { searchProducts } from "@/lib/shopify/catalog";
import { pageMetadata } from "@/lib/seo";
import { searchQuerySchema } from "@/lib/validation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Search", path: "/search", noindex: true, locale });
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const { locale } = await params;
  const ctx = ctxOf(marketOrDefault(locale));
  const { q } = await searchParams;
  const parsed = searchQuerySchema.safeParse(Array.isArray(q) ? q[0] : q ?? "");
  const term = parsed.success ? parsed.data : "";
  const result = term ? await searchProducts(ctx, term) : null;

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Search</h1>
        <form action={`/${locale}/search`} role="search" className="inline-search">
          <label htmlFor="page-search" className="visually-hidden">Search products</label>
          <input id="page-search" name="q" defaultValue={term} placeholder="Search products" maxLength={100} autoComplete="off" />
          <button type="submit" className="btn btn--outline">Search</button>
        </form>
        {result && <p className="muted small" role="status">{result.total} {result.total === 1 ? "result" : "results"} for “{term}”</p>}
      </header>

      {!term && <p className="muted">Enter a term to search the collection.</p>}
      {result && result.products.length === 0 && (
        <div className="empty">
          <p>Nothing matched “{term}”. Check the spelling or try a broader term.</p>
          <Link href="/shop" className="btn btn--outline">Browse all products</Link>
        </div>
      )}
      {result && result.products.length > 0 && (
        <ProductGrid key={term} initial={result.products} pageInfo={result.pageInfo} query={`q=${encodeURIComponent(term)}`} />
      )}
    </div>
  );
}
