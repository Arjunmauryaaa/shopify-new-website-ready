import { describe, expect, it } from "vitest";
import { cartActionSchema, contactSchema, handleListSchema, newsletterSchema } from "@/lib/validation";

describe("cartActionSchema", () => {
  const gid = "gid://shopify/ProductVariant/123";
  it("accepts valid actions", () => {
    expect(cartActionSchema.safeParse({ action: "add", variantId: gid, quantity: 2 }).success).toBe(true);
    expect(cartActionSchema.safeParse({ action: "update", lineId: "x", quantity: 0 }).success).toBe(true);
    expect(cartActionSchema.safeParse({ action: "discount", code: "" }).success).toBe(true);
  });
  it("rejects malformed ids, quantities and unknown actions", () => {
    expect(cartActionSchema.safeParse({ action: "add", variantId: "123", quantity: 1 }).success).toBe(false);
    expect(cartActionSchema.safeParse({ action: "add", variantId: gid, quantity: 0 }).success).toBe(false);
    expect(cartActionSchema.safeParse({ action: "add", variantId: gid, quantity: 500 }).success).toBe(false);
    expect(cartActionSchema.safeParse({ action: "price", amount: 1 }).success).toBe(false);
  });
  it("never carries a client-supplied price", () => {
    const parsed = cartActionSchema.parse({ action: "add", variantId: gid, quantity: 1, price: "0.01" });
    expect(parsed).not.toHaveProperty("price");
  });
});

describe("forms", () => {
  it("validates newsletter email and honeypot", () => {
    expect(newsletterSchema.safeParse({ email: " A@B.co " }).data?.email).toBe("a@b.co");
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co", website: "bot" }).success).toBe(false);
  });
  it("validates contact fields with messages", () => {
    const r = contactSchema.safeParse({ name: "", email: "x", message: "short" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["name", "email", "message"]);
  });
  it("validates handle lists", () => {
    expect(handleListSchema.parse("a, b-c ,d_e")).toEqual(["a", "b-c", "d_e"]);
    expect(handleListSchema.safeParse("ok,../etc").success).toBe(false);
  });
});
