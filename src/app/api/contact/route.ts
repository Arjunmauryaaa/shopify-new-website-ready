import { getEnv } from "@/config/env";
import { brand } from "@/config/brand";
import { json, rateLimit, sameOrigin } from "@/lib/http";
import { contactSchema, fieldErrors } from "@/lib/validation";

/** Sends the message through Resend; success is reported only when Resend accepts it. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  if (!rateLimit(req, "contact", 5, 10 * 60_000)) return json({ error: "Too many messages. Please try again later." }, 429);

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) }, 400);

  const { RESEND_API_KEY: key, CONTACT_TO_EMAIL: to, CONTACT_FROM_EMAIL: from } = getEnv();
  if (!key || !to || !from) return json({ error: "The contact form isn't available yet." }, 503);

  const { name, email, message } = parsed.data;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[${brand.name}] Message from ${name.replace(/[\r\n]+/g, " ")}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });
    if (res.ok) return json({ ok: true });
    console.error(`[contact] provider responded ${res.status}`);
    return json({ error: "Your message could not be sent. Please try again." }, 502);
  } catch (e) {
    console.error("[contact] request failed:", (e as Error).message);
    return json({ error: "We couldn't reach the mail service. Please try again." }, 502);
  }
}
