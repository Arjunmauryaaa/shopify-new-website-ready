import { getEnv } from "@/config/env";
import { json, rateLimit, sameOrigin } from "@/lib/http";
import { fieldErrors, newsletterSchema } from "@/lib/validation";

/**
 * Subscribes via Klaviyo's bulk-subscribe endpoint. Success is reported only when Klaviyo
 * accepts the job (HTTP 202); any other outcome is surfaced as an error.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  if (!rateLimit(req, "newsletter", 5, 60_000)) return json({ error: "Too many attempts. Please try again shortly." }, 429);

  const parsed = newsletterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Please check your email address.", fields: fieldErrors(parsed.error) }, 400);

  const env = getEnv();
  const key = env.KLAVIYO_PRIVATE_API_KEY;
  const listId = parsed.data.list === "atelier" ? env.KLAVIYO_ATELIER_LIST_ID : env.KLAVIYO_LIST_ID;
  if (!key || !listId) return json({ error: "Newsletter sign-up isn't available yet." }, 503);

  try {
    const res = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${key}`,
        revision: "2024-10-15",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email: parsed.data.email,
                    subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } },
                  },
                },
              ],
            },
          },
          relationships: { list: { data: { type: "list", id: listId } } },
        },
      }),
    });
    if (res.status === 202) return json({ ok: true });
    console.error(`[newsletter] provider responded ${res.status}`);
    return json({ error: "We couldn't complete your subscription. Please try again." }, 502);
  } catch (e) {
    console.error("[newsletter] request failed:", (e as Error).message);
    return json({ error: "We couldn't reach the mailing service. Please try again." }, 502);
  }
}
