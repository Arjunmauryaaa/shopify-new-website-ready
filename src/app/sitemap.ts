import type { MetadataRoute } from "next";
import { MARKETS, localizePath } from "@/config/markets";
import { getSitemapHandles } from "@/lib/shopify/catalog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const FIXED = ["/", "/shop", "/about", "/journal", "/contact", "/pages/shipping", "/pages/returns", "/pages/faq", "/pages/privacy-policy", "/pages/terms-of-service"];

/** One entry per market URL, each carrying hreflang alternates for every other market. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, collections } = await getSitemapHandles();
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap =>
    MARKETS.map((m) => ({
      url: absoluteUrl(localizePath(m.slug, path)),
      lastModified,
      alternates: { languages: Object.fromEntries(MARKETS.map((o) => [o.locale, absoluteUrl(localizePath(o.slug, path))])) },
    }));
  return [
    ...FIXED.flatMap((p) => entry(p)),
    ...collections.flatMap((c) => entry(`/collections/${c.handle}`, c.updatedAt)),
    ...products.flatMap((p) => entry(`/products/${p.handle}`, p.updatedAt)),
  ];
}
