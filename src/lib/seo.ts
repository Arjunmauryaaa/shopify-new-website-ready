import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { DEFAULT_MARKET, MARKETS, localizePath } from "@/config/markets";
import type { Product } from "@/lib/shopify/types";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** hreflang alternates for every market, plus x-default. `path` is market-less ("/shop"). */
export function alternatesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(MARKETS.map((m) => [m.locale, absoluteUrl(localizePath(m.slug, path))]));
  languages["x-default"] = absoluteUrl(localizePath(DEFAULT_MARKET.slug, path));
  return languages;
}

export function pageMetadata(opts: {
  title: string;
  description?: string;
  /** market-less path, e.g. "/shop" */
  path: string;
  /** market slug, e.g. "en-us" */
  locale: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const description = opts.description?.trim().slice(0, 300) || brand.description;
  return {
    title: opts.title,
    description,
    alternates: { canonical: localizePath(opts.locale, opts.path), languages: alternatesFor(opts.path) },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url: localizePath(opts.locale, opts.path),
      images: opts.image ? [{ url: opts.image }] : undefined,
    },
    twitter: { card: opts.image ? "summary_large_image" : "summary", title: opts.title, description },
  };
}

const AVAILABILITY = { in: "https://schema.org/InStock", out: "https://schema.org/OutOfStock" };

/** Structured data built only from real Shopify fields — no ratings, reviews or stock counts. */
export function productJsonLd(product: Product, locale: string, reviews?: { count: number; average: number } | null) {
  const variants = product.variants.nodes;
  const prices = variants.map((v) => Number(v.price.amount));
  const currency = product.priceRange.minVariantPrice.currencyCode;
  const url = absoluteUrl(localizePath(locale, `/products/${product.handle}`));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.images.nodes.map((i) => i.url),
    brand: product.vendor ? { "@type": "Brand", name: product.vendor } : undefined,
    url,
    ...(reviews && reviews.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count } } : {}),
    offers:
      variants.length > 1
        ? {
            "@type": "AggregateOffer",
            priceCurrency: currency,
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: variants.length,
            availability: product.availableForSale ? AVAILABILITY.in : AVAILABILITY.out,
            url,
          }
        : {
            "@type": "Offer",
            priceCurrency: currency,
            price: variants[0]?.price.amount ?? product.priceRange.minVariantPrice.amount,
            availability: product.availableForSale ? AVAILABILITY.in : AVAILABILITY.out,
            url,
          },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(localizePath(locale, it.path)) })),
  };
}

export function websiteJsonLd(locale: string) {
  return [
    { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: siteUrl() },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brand.name,
      url: absoluteUrl(localizePath(locale, "/")),
      potentialAction: { "@type": "SearchAction", target: `${absoluteUrl(localizePath(locale, "/search"))}?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ];
}

/** Serialises JSON-LD safely for inline <script> (escapes `<`). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
