import "server-only";
import { getEnv } from "@/config/env";
import { numericId, summarizeReviews, type Review, type ReviewSummary } from "@/lib/commerce";

type JudgeMeReview = {
  id: number;
  title?: string | null;
  body?: string | null;
  rating: number;
  created_at: string;
  verified?: string | null;
  hidden?: boolean;
  published?: boolean;
  reviewer?: { name?: string | null } | null;
};

/**
 * Real customer reviews from Judge.me (https://judge.me/api). Returns null when not configured or on failure —
 * the page then simply shows no reviews. Nothing is ever fabricated; structured-data ratings derive from this data.
 */
export async function getReviews(productGid: string): Promise<ReviewSummary | null> {
  const { JUDGEME_API_TOKEN: token, JUDGEME_SHOP_DOMAIN: shop } = getEnv();
  const id = numericId(productGid);
  if (!token || !shop || !id) return null;
  try {
    const url = new URL("https://judge.me/api/v1/reviews");
    url.search = new URLSearchParams({ api_token: token, shop_domain: shop, product_id: id, per_page: "50", page: "1" }).toString();
    const res = await fetch(url, { next: { revalidate: 3600, tags: ["reviews"] } });
    if (!res.ok) {
      console.error(`[reviews] provider responded ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { reviews?: JudgeMeReview[] };
    const reviews: Review[] = (data.reviews ?? [])
      .filter((r) => r.published !== false && !r.hidden)
      .map((r) => ({
        id: String(r.id),
        rating: Number(r.rating),
        title: r.title ?? "",
        body: r.body ?? "",
        author: r.reviewer?.name?.trim() || "Customer",
        createdAt: r.created_at,
        verified: Boolean(r.verified && r.verified !== "nothing"),
      }));
    return summarizeReviews(reviews);
  } catch (e) {
    console.error("[reviews] request failed:", (e as Error).message);
    return null;
  }
}
