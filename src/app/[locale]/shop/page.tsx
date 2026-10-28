import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import { Listing, listingQuery } from "@/components/shop/listing";
import { getAllProducts } from "@/lib/shopify/catalog";
import { parseSelection, parseSort } from "@/lib/shopify/facets";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Shop", description: "Shop the full collection.", path: "/shop", locale });
}

export default async function ShopPage({ params: routeParams, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = ctxOf(marketOrDefault((await routeParams).locale));
  const params = await searchParams;
  const selection = parseSelection(params);
  const result = await getAllProducts(ctx, { sort: parseSort(params.sort), selection });
  const hasFilters = selection.values.length > 0 || Boolean(selection.priceMin || selection.priceMax);

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Shop</h1>
      </header>
      <Listing
        products={result.products}
        pageInfo={result.pageInfo}
        facets={result.facets}
        apiQuery={listingQuery({ scope: "shop" }, params)}
        hasFilters={hasFilters}
      />
    </div>
  );
}
