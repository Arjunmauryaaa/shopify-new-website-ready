import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, jsonLdString, pageMetadata, productJsonLd } from "@/lib/seo";
import type { Product } from "@/lib/shopify/types";

const money = (a: string) => ({ amount: a, currencyCode: "INR" });
const image = { url: "https://cdn.shopify.com/a.jpg", altText: null, width: 1, height: 1 };
const product = {
  handle: "linen-shirt",
  title: "Linen Shirt",
  vendor: "Mock",
  description: "A shirt.",
  availableForSale: true,
  priceRange: { minVariantPrice: money("4500"), maxVariantPrice: money("4800") },
  images: { nodes: [image] },
  variants: {
    nodes: [
      { id: "1", price: money("4500") },
      { id: "2", price: money("4800") },
    ],
  },
} as unknown as Product;

describe("SEO helpers", () => {
  it("builds canonical, Open Graph and noindex metadata", () => {
    const m = pageMetadata({ title: "Shop", path: "/shop", locale: "en-us", image: "https://x/y.jpg", noindex: true });
    expect(m.alternates?.canonical).toBe("/en-us/shop");
    const langs = m.alternates?.languages as Record<string, string>;
    expect(langs["en-US"]).toMatch(/\/en-us\/shop$/);
    expect(langs["en-IN"]).toMatch(/\/en-in\/shop$/);
    expect(langs["x-default"]).toMatch(/\/shop$/);
    expect(m.openGraph?.images).toEqual([{ url: "https://x/y.jpg" }]);
    expect(m.robots).toEqual({ index: false, follow: false });
  });

  it("derives product structured data only from real fields", () => {
    const ld = productJsonLd(product, "en-us") as Record<string, unknown>;
    expect(ld["@type"]).toBe("Product");
    expect((ld.offers as Record<string, unknown>)["@type"]).toBe("AggregateOffer");
    expect(ld.offers as object).toMatchObject({ priceCurrency: "INR", lowPrice: 4500, highPrice: 4800, availability: "https://schema.org/InStock" });
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("review");
  });

  it("adds aggregateRating only when real review data is supplied", () => {
    const ld = productJsonLd(product, "en-us", { count: 12, average: 4.6 }) as Record<string, unknown>;
    expect(ld.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.6, reviewCount: 12 });
    expect(productJsonLd(product, "en-us", { count: 0, average: 0 })).not.toHaveProperty("aggregateRating");
  });

  it("marks sold-out products as OutOfStock", () => {
    const ld = productJsonLd({ ...product, availableForSale: false }, "en-us") as Record<string, unknown>;
    expect((ld.offers as Record<string, unknown>).availability).toBe("https://schema.org/OutOfStock");
  });

  it("escapes < in inline JSON-LD", () => {
    expect(jsonLdString({ n: "</script><script>alert(1)" })).not.toContain("</script>");
  });

  it("localises product URLs in structured data", () => {
    expect((productJsonLd(product, "en-gb") as Record<string, unknown>).url).toMatch(/\/en-gb\/products\/linen-shirt$/);
  });

  it("numbers breadcrumb positions", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }], "en-us") as Record<string, unknown>;
    expect((ld.itemListElement as { position: number }[]).map((i) => i.position)).toEqual([1, 2]);
  });
});
