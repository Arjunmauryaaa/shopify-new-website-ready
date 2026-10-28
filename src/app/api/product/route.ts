import { json, marketCtx, rateLimit } from "@/lib/http";
import { getProduct, getRecommendations } from "@/lib/shopify/catalog";

const HANDLE = /^[a-z0-9][a-z0-9-_]*$/i;
const PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d+$/;

/** GET /api/product?handle=x (quick view) or ?recommendationsFor=<product gid> (cart upsells). */
export async function GET(req: Request) {
  if (!rateLimit(req, "product", 120, 60_000)) return json({ error: "Too many requests." }, 429);
  const sp = new URL(req.url).searchParams;
  const ctx = marketCtx(req);

  const handle = sp.get("handle");
  if (handle) {
    if (!HANDLE.test(handle)) return json({ error: "Invalid handle." }, 400);
    const product = await getProduct(ctx, handle);
    return product ? json({ product }, 200, { "Cache-Control": "private, max-age=60" }) : json({ error: "Not found." }, 404);
  }

  const forId = sp.get("recommendationsFor");
  if (forId) {
    if (!PRODUCT_GID.test(forId)) return json({ error: "Invalid product." }, 400);
    return json({ products: await getRecommendations(ctx, forId) }, 200, { "Cache-Control": "private, max-age=300" });
  }
  return json({ error: "Missing query." }, 400);
}
