import { json, marketCtx, rateLimit } from "@/lib/http";
import { searchProducts } from "@/lib/shopify/catalog";
import { searchQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  if (!rateLimit(req, "search", 90, 60_000)) return json({ error: "Too many requests." }, 429);
  const q = searchQuerySchema.safeParse(new URL(req.url).searchParams.get("q") ?? "");
  if (!q.success) return json({ products: [], total: 0 });
  const { products, total } = await searchProducts(marketCtx(req), q.data, { first: 6 });
  return json({ products, total }, 200, { "Cache-Control": "private, max-age=30" });
}
