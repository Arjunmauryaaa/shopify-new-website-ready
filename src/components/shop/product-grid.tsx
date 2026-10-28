"use client";

import { useState } from "react";
import { ProductCardView } from "@/components/product/product-card";
import { useMarket } from "@/providers/market-provider";
import type { PageInfo, ProductCard } from "@/lib/shopify/types";

type Props = {
  initial: ProductCard[];
  pageInfo: PageInfo;
  /** Query string identifying the listing for /api/products, without the cursor. */
  query: string;
};

/** First page is server-rendered; further pages are fetched by Shopify cursor so the full catalogue never loads at once. */
export function ProductGrid({ initial, pageInfo, query }: Props) {
  const { slug } = useMarket();
  const [products, setProducts] = useState(initial);
  const [page, setPage] = useState(pageInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!page.endCursor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?${query}&after=${encodeURIComponent(page.endCursor)}`, { headers: { "x-market": slug } });
      if (!res.ok) throw new Error();
      const data: { products: ProductCard[]; pageInfo: PageInfo } = await res.json();
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.products.filter((p) => !seen.has(p.id))];
      });
      setPage(data.pageInfo);
    } catch {
      setError("We couldn't load more products. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ul className="grid-products">
        {products.map((p, i) => (
          <li key={p.id}>
            <ProductCardView product={p} priority={i < 4} />
          </li>
        ))}
      </ul>
      <div className="load-more">
        {error && <p className="form-error" role="alert">{error}</p>}
        {page.hasNextPage && (
          <button type="button" className="btn btn--outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </>
  );
}
