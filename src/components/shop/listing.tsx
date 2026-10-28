import Link from "@/components/ui/link";
import { FilterBar } from "./filters";
import { ProductGrid } from "./product-grid";
import type { FacetGroup, PageInfo, ProductCard } from "@/lib/shopify/types";

type Props = {
  products: ProductCard[];
  pageInfo: PageInfo;
  facets: FacetGroup[];
  /** Query string for /api/products load-more (e.g. "collection=x&sort=price-asc"). */
  apiQuery: string;
  hasFilters: boolean;
};

export function Listing({ products, pageInfo, facets, apiQuery, hasFilters }: Props) {
  return (
    <>
      <FilterBar groups={facets} total={pageInfo.hasNextPage ? undefined : products.length} />
      {products.length === 0 ? (
        <div className="empty">
          <p>{hasFilters ? "No products match these filters." : "There are no products here yet."}</p>
          {hasFilters ? <Link className="btn btn--outline" href="?">Clear all filters</Link> : <Link className="btn btn--outline" href="/">Back to home</Link>}
        </div>
      ) : (
        <ProductGrid key={apiQuery} initial={products} pageInfo={pageInfo} query={apiQuery} />
      )}
    </>
  );
}

/** Rebuilds the facet/sort query string shared between the page and /api/products. */
export function listingQuery(base: Record<string, string>, params: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams(base);
  for (const key of ["sort", "price_min", "price_max"]) {
    const v = params[key];
    if (typeof v === "string" && v) q.set(key, v);
  }
  const f = params.f;
  for (const v of f === undefined ? [] : Array.isArray(f) ? f : [f]) q.append("f", v);
  return q.toString();
}
