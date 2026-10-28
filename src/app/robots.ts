import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/cart", "/*/account", "/*/search", "/*/wishlist"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
