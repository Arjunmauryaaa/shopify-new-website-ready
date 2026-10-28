import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing, listingQuery } from "@/components/shop/listing";
import { Media } from "@/components/ui/media";
import { getCollection } from "@/lib/shopify/catalog";
import { parseSelection, parseSort } from "@/lib/shopify/facets";
import { jsonLdString, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { handle, locale } = await params;
  const sp = await searchParams;
  const result = await getCollection(ctxOf(marketOrDefault(locale)), handle, { first: 1 });
  if (!result) return { title: "Collection not found" };
  const c = result.collection;
  const filtered = Object.keys(sp).length > 0;
  return pageMetadata({
    title: c.seo.title || c.title,
    description: c.seo.description || c.description,
    path: `/collections/${handle}`,
    image: c.image?.url,
    noindex: filtered,
    locale,
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle, locale } = await params;
  const ctx = ctxOf(marketOrDefault(locale));
  const sp = await searchParams;
  const selection = parseSelection(sp);
  const result = await getCollection(ctx, handle, { sort: parseSort(sp.sort), selection });
  if (!result) notFound();
  const { collection } = result;
  const hasFilters = selection.values.length > 0 || Boolean(selection.priceMin || selection.priceMax);

  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: collection.title, path: `/collections/${handle}` }], locale)),
        }}
      />
      <header className={`page-head ${collection.image ? "page-head--image" : ""}`}>
        <div>
          <h1 className="page-title">{collection.title}</h1>
          {collection.description && <p className="page-lede muted">{collection.description}</p>}
        </div>
        {collection.image && (
          <Media src={collection.image.url} alt={collection.image.altText ?? collection.title} ratio="21 / 9" sizes="100vw" priority />
        )}
      </header>
      <Listing
        products={result.products}
        pageInfo={result.pageInfo}
        facets={result.facets}
        apiQuery={listingQuery({ collection: handle }, sp)}
        hasFilters={hasFilters}
      />
    </div>
  );
}
