import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/config/env";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (cookieJar.has(k) ? { value: cookieJar.get(k) } : undefined),
    set: (k: string, v: string) => void cookieJar.set(k, v),
    delete: (k: string) => void cookieJar.delete(k),
  }),
}));

import { POST as cartPost } from "@/app/api/cart/route";
import { POST as newsletterPost } from "@/app/api/newsletter/route";
import { POST as contactPost } from "@/app/api/contact/route";

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
    body: JSON.stringify(body),
  });

const setEnv = (vars: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetEnvCache();
};

beforeEach(() => cookieJar.clear());
afterEach(() => {
  setEnv({
    SHOPIFY_STORE_DOMAIN: undefined,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: undefined,
    KLAVIYO_PRIVATE_API_KEY: undefined,
    KLAVIYO_LIST_ID: undefined,
    KLAVIYO_ATELIER_LIST_ID: undefined,
    RESEND_API_KEY: undefined,
    CONTACT_TO_EMAIL: undefined,
    CONTACT_FROM_EMAIL: undefined,
  });
});

describe("POST /api/cart", () => {
  const variantId = "gid://shopify/ProductVariant/1";

  it("rejects cross-origin requests", async () => {
    const res = await cartPost(post("/api/cart", { action: "add", variantId, quantity: 1 }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("returns 503 until Shopify is configured", async () => {
    const res = await cartPost(post("/api/cart", { action: "add", variantId, quantity: 1 }));
    expect(res.status).toBe(503);
  });

  describe("with Shopify configured", () => {
    beforeEach(() => setEnv({ SHOPIFY_STORE_DOMAIN: "s.myshopify.com", SHOPIFY_STOREFRONT_ACCESS_TOKEN: "t" }));
    const cart = { id: "gid://shopify/Cart/abc?key=k1", checkoutUrl: "https://s.myshopify.com/cart/c/abc", totalQuantity: 1, lines: { nodes: [] } };

    it("validates input before touching Shopify", async () => {
      const spy = vi.spyOn(globalThis, "fetch");
      const res = await cartPost(post("/api/cart", { action: "add", variantId: "bad", quantity: 1 }));
      expect(res.status).toBe(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it("creates a cart, stores only its id in the cookie and returns Shopify's checkout URL", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { cartCreate: { cart, userErrors: [] } } })));
      const res = await cartPost(post("/api/cart", { action: "add", variantId, quantity: 1 }));
      expect(res.status).toBe(200);
      expect((await res.json()).cart.checkoutUrl).toBe(cart.checkoutUrl);
      expect(cookieJar.get("cart_id")).toBe(cart.id);
    });

    it("maps Shopify userErrors (e.g. sold out) to a 422 with the message", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ data: { cartCreate: { cart: null, userErrors: [{ field: null, message: "Sold out" }] } } })),
      );
      const res = await cartPost(post("/api/cart", { action: "add", variantId, quantity: 1 }));
      expect(res.status).toBe(422);
      expect((await res.json()).error).toBe("Sold out");
      expect(cookieJar.has("cart_id")).toBe(false);
    });

    it("creates the cart for the market named by x-market and ignores unknown markets", async () => {
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { cartCreate: { cart, userErrors: [] } } })));
      await cartPost(post("/api/cart", { action: "add", variantId, quantity: 1 }, { "x-market": "en-gb" }));
      expect(JSON.parse(spy.mock.calls.at(-1)![1]!.body as string).variables.input.buyerIdentity).toEqual({ countryCode: "GB" });
      cookieJar.clear();
      await cartPost(post("/api/cart", { action: "add", variantId, quantity: 1 }, { "x-market": "xx-zz" }));
      expect(JSON.parse(spy.mock.calls.at(-1)![1]!.body as string).variables.input.buyerIdentity).toEqual({ countryCode: "IN" });
    });

    it("re-points an existing cart at the new market", async () => {
      cookieJar.set("cart_id", cart.id);
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { cartBuyerIdentityUpdate: { cart, userErrors: [] } } })));
      const res = await cartPost(post("/api/cart", { action: "market" }, { "x-market": "en-us" }));
      expect(res.status).toBe(200);
      expect(JSON.parse(spy.mock.calls.at(-1)![1]!.body as string).variables.buyerIdentity).toEqual({ countryCode: "US" });
    });

    it("ignores a tampered cart cookie", async () => {
      cookieJar.set("cart_id", "../../etc/passwd");
      const res = await cartPost(post("/api/cart", { action: "update", lineId: "l", quantity: 2 }));
      expect(res.status).toBe(404);
    });
  });
});

describe("POST /api/newsletter", () => {
  it("is unavailable (not falsely successful) when no provider is configured", async () => {
    const res = await newsletterPost(post("/api/newsletter", { email: "a@b.co" }));
    expect(res.status).toBe(503);
  });

  it("validates the email", async () => {
    const res = await newsletterPost(post("/api/newsletter", { email: "nope" }));
    expect(res.status).toBe(400);
  });

  describe("with Klaviyo configured", () => {
    beforeEach(() => setEnv({ KLAVIYO_PRIVATE_API_KEY: "pk", KLAVIYO_LIST_ID: "L1" }));

    it("reports success only when the provider accepts the job (202)", async () => {
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
      const res = await newsletterPost(post("/api/newsletter", { email: "a@b.co" }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect((spy.mock.calls[0][1]!.headers as Record<string, string>).Authorization).toBe("Klaviyo-API-Key pk");
    });

    it("surfaces provider failure instead of success", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 400 }));
      const res = await newsletterPost(post("/api/newsletter", { email: "a@b.co" }));
      expect(res.status).toBe(502);
      expect((await res.json()).ok).toBeUndefined();
    });

    it("handles network failure", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
      const res = await newsletterPost(post("/api/newsletter", { email: "a@b.co" }));
      expect(res.status).toBe(502);
    });
  });
});

describe("POST /api/contact", () => {
  it("returns field errors for invalid input", async () => {
    const res = await contactPost(post("/api/contact", { name: "", email: "x", message: "hi" }));
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fields)).toEqual(["name", "email", "message"]);
  });

  it("is unavailable when email delivery is not configured", async () => {
    const res = await contactPost(post("/api/contact", { name: "A", email: "a@b.co", message: "Hello there, friend" }));
    expect(res.status).toBe(503);
  });

  it("sends via Resend and strips header-injection newlines from the subject", async () => {
    setEnv({ RESEND_API_KEY: "rk", CONTACT_TO_EMAIL: "owner@example.com", CONTACT_FROM_EMAIL: "Shop <shop@example.com>" });
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const res = await contactPost(post("/api/contact", { name: "Eve\r\nBcc: x@y.z", email: "a@b.co", message: "Hello there, friend" }));
    expect(res.status).toBe(200);
    const sent = JSON.parse(spy.mock.calls[0][1]!.body as string);
    expect(sent.subject).not.toMatch(/[\r\n]/);
    expect(sent.to).toEqual(["owner@example.com"]);
  });
});

import { POST as notifyPost } from "@/app/api/notify-me/route";

describe("POST /api/cart — express checkout and gift note", () => {
  const variantId = "gid://shopify/ProductVariant/1";
  const cart = { id: "gid://shopify/Cart/abc?key=k1", checkoutUrl: "https://s.myshopify.com/cart/c/abc", totalQuantity: 1, lines: { nodes: [] } };
  beforeEach(() => setEnv({ SHOPIFY_STORE_DOMAIN: "s.myshopify.com", SHOPIFY_STOREFRONT_ACCESS_TOKEN: "t" }));

  it("buyNow returns a separate cart's checkout URL and leaves the shopper's cart cookie alone", async () => {
    cookieJar.set("cart_id", "gid://shopify/Cart/existing?key=zz");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { cartCreate: { cart, userErrors: [] } } })));
    const res = await cartPost(post("/api/cart", { action: "buyNow", variantId, quantity: 2 }));
    expect(res.status).toBe(200);
    expect((await res.json()).cart.checkoutUrl).toBe(cart.checkoutUrl);
    expect(cookieJar.get("cart_id")).toBe("gid://shopify/Cart/existing?key=zz");
  });

  it("buyNow surfaces sold-out errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { cartCreate: { cart: null, userErrors: [{ field: null, message: "Sold out" }] } } })));
    const res = await cartPost(post("/api/cart", { action: "buyNow", variantId, quantity: 1 }));
    expect(res.status).toBe(422);
  });

  it("saves a gift note on the Shopify cart and caps its length", async () => {
    cookieJar.set("cart_id", cart.id);
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { cartNoteUpdate: { cart: { ...cart, note: "Happy birthday" }, userErrors: [] } } })));
    const ok = await cartPost(post("/api/cart", { action: "note", note: "Happy birthday" }));
    expect(ok.status).toBe(200);
    expect(JSON.parse(spy.mock.calls.at(-1)![1]!.body as string).variables.note).toBe("Happy birthday");
    const tooLong = await cartPost(post("/api/cart", { action: "note", note: "x".repeat(501) }));
    expect(tooLong.status).toBe(400);
  });
});

describe("POST /api/notify-me (back in stock)", () => {
  const body = { email: "a@b.co", variantId: "gid://shopify/ProductVariant/42" };

  it("is unavailable until Klaviyo is configured", async () => {
    expect((await notifyPost(post("/api/notify-me", body))).status).toBe(503);
  });

  it("validates input", async () => {
    expect((await notifyPost(post("/api/notify-me", { ...body, email: "x" }))).status).toBe(400);
    expect((await notifyPost(post("/api/notify-me", { ...body, variantId: "42" }))).status).toBe(400);
  });

  describe("with Klaviyo configured", () => {
    beforeEach(() => setEnv({ KLAVIYO_PRIVATE_API_KEY: "pk" }));
    it("subscribes the variant using Klaviyo's Shopify catalog id and reports success only on 202", async () => {
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
      const res = await notifyPost(post("/api/notify-me", body));
      expect(await res.json()).toEqual({ ok: true });
      const sent = JSON.parse(spy.mock.calls[0][1]!.body as string);
      expect(sent.data.relationships.variant.data.id).toBe("$shopify:::$default:::42");
    });
    it("does not claim success when Klaviyo rejects", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 400 }));
      const res = await notifyPost(post("/api/notify-me", body));
      expect(res.status).toBe(502);
    });
  });
});

describe("POST /api/newsletter — Atelier list", () => {
  it("uses the Atelier list id and is unavailable without one", async () => {
    setEnv({ KLAVIYO_PRIVATE_API_KEY: "pk", KLAVIYO_LIST_ID: "MAIN" });
    expect((await newsletterPost(post("/api/newsletter", { email: "a@b.co", list: "atelier" }))).status).toBe(503);
    setEnv({ KLAVIYO_ATELIER_LIST_ID: "VIP" });
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
    expect((await newsletterPost(post("/api/newsletter", { email: "a@b.co", list: "atelier" }))).status).toBe(200);
    expect(JSON.parse(spy.mock.calls[0][1]!.body as string).data.relationships.list.data.id).toBe("VIP");
    setEnv({ KLAVIYO_ATELIER_LIST_ID: undefined });
  });
});
