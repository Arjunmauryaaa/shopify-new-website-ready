import { json, marketCtx, rateLimit } from "@/lib/http";
import { getAllProducts, getCollection, getProductsByHandles, searchProducts } from "@/lib/shopify/catalog";
import { parseSelection, parseSort } from "@/lib/shopify/facets";
import { handleListSchema } from "@/lib/validation";

const HANDLE = /^[a-z0-9][a-z0-9-_]*$/i;
const CURSOR = /^[\w=+/.\-]{1,500}$/;

/**
 * GET /api/products
 *   ?handles=a,b            → products by handle (wishlist)
 *   ?collection=x&after=…   → next page of a collection (load more)
 *   ?scope=shop&after=…     → next page of /shop
 *   ?q=term&after=…         → next page of search results
 * Facet (`f`, `price_min`, `price_max`) and `sort` params mirror the page URLs.
 */
export async function GET(req: Request) {
  if (!rateLimit(req, "products", 120, 60_000)) return json({ error: "Too many requests." }, 429);
  const ctx = marketCtx(req);
  const url = new URL(req.url);
  const sp = url.searchParams;

  const handles = sp.get("handles");
  if (handles !== null) {
    const parsed = handleListSchema.safeParse(handles);
    if (!parsed.success) return json({ error: "Invalid handles." }, 400);
    return json({ products: await getProductsByHandles(ctx, parsed.data) });
  }

  const after = sp.get("after");
  if (after && !CURSOR.test(after)) return json({ error: "Invalid cursor." }, 400);

  const params: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) params[key] = key === "f" ? sp.getAll(key) : sp.get(key)!;
  const sort = parseSort(params.sort);
  const selection = parseSelection(params);

  const collection = sp.get("collection");
  if (collection) {
    if (!HANDLE.test(collection)) return json({ error: "Invalid collection." }, 400);
    const result = await getCollection(ctx, collection, { sort, after, selection });
    if (!result) return json({ error: "Not found." }, 404);
    return json({ products: result.products, pageInfo: result.pageInfo });
  }

  const q = sp.get("q");
  if (q) {
    const result = await searchProducts(ctx, q.slice(0, 100), { after });
    return json({ products: result.products, pageInfo: result.pageInfo });
  }

  if (sp.get("scope") === "shop") {
    const result = await getAllProducts(ctx, { sort, after, selection });
    return json({ products: result.products, pageInfo: result.pageInfo });
  }

  return json({ error: "Missing query." }, 400);
}
