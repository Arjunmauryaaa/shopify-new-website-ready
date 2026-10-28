import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { getEnv } from "@/config/env";
import { json, rateLimit } from "@/lib/http";

const TAGS = new Set(["catalog", "collections", "content"]);

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** POST /api/revalidate?tag=catalog with header `x-revalidate-secret`. Lets Shopify Flow/webhooks refresh cached data. */
export async function POST(req: Request) {
  if (!rateLimit(req, "revalidate", 30, 60_000)) return json({ error: "Too many requests." }, 429);
  const secret = getEnv().REVALIDATE_SECRET;
  const given = req.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !safeEqual(given, secret)) return json({ error: "Unauthorized" }, 401);
  const tag = new URL(req.url).searchParams.get("tag") ?? "catalog";
  if (!TAGS.has(tag)) return json({ error: "Unknown tag." }, 400);
  revalidateTag(tag, "max");
  return json({ revalidated: tag });
}
