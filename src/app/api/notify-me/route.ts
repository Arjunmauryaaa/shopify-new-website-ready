import { getEnv } from "@/config/env";
import { json, rateLimit, sameOrigin } from "@/lib/http";
import { numericId } from "@/lib/commerce";
import { fieldErrors, notifySchema } from "@/lib/validation";

/**
 * Back-in-stock subscription via Klaviyo. Requires Klaviyo's Shopify catalog sync (so the variant exists in
 * Klaviyo) and the back-in-stock flow enabled there. Success is reported only on Klaviyo's 202.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  if (!rateLimit(req, "notify", 6, 60_000)) return json({ error: "Too many attempts. Please try again shortly." }, 429);

  const parsed = notifySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Please check your email address.", fields: fieldErrors(parsed.error) }, 400);

  const key = getEnv().KLAVIYO_PRIVATE_API_KEY;
  if (!key) return json({ error: "Stock alerts aren't available yet." }, 503);
  const variant = numericId(parsed.data.variantId);
  if (!variant) return json({ error: "Invalid variant." }, 400);

  try {
    const res = await fetch("https://a.klaviyo.com/api/back-in-stock-subscriptions", {
      method: "POST",
      headers: { Authorization: `Klaviyo-API-Key ${key}`, revision: "2024-10-15", "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        data: {
          type: "back-in-stock-subscription",
          attributes: { profile: { data: { type: "profile", attributes: { email: parsed.data.email } } }, channels: ["EMAIL"] },
          relationships: { variant: { data: { type: "catalog-variant", id: `$shopify:::$default:::${variant}` } } },
        },
      }),
    });
    if (res.status === 202) return json({ ok: true });
    console.error(`[notify-me] provider responded ${res.status}`);
    return json({ error: "We couldn't save your alert. Please try again." }, 502);
  } catch (e) {
    console.error("[notify-me] request failed:", (e as Error).message);
    return json({ error: "We couldn't reach the alert service. Please try again." }, 502);
  }
}
