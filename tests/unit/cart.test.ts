import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/config/env";
import { addLines, CartError, createCart, removeLines, updateDiscountCodes, updateLines } from "@/lib/shopify/cart";

const ctx = { country: "US", language: "EN" };
const cart = { id: "gid://shopify/Cart/1", checkoutUrl: "https://shop.myshopify.com/cart/c/1", totalQuantity: 1, lines: { nodes: [] } };

function respond(payloadKey: string, payload: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { [payloadKey]: payload } })));
}

beforeEach(() => {
  process.env.SHOPIFY_STORE_DOMAIN = "shop.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = "tok";
  resetEnvCache();
});
afterEach(() => {
  delete process.env.SHOPIFY_STORE_DOMAIN;
  delete process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  resetEnvCache();
});

describe("cart mutations", () => {
  it("creates a cart with the real variant id and buyer country", async () => {
    const spy = respond("cartCreate", { cart, userErrors: [] });
    const result = await createCart(ctx, [{ merchandiseId: "gid://shopify/ProductVariant/9", quantity: 2 }]);
    expect(result.checkoutUrl).toBe(cart.checkoutUrl);
    const body = JSON.parse(spy.mock.calls[0][1]!.body as string);
    expect(body.variables.input).toEqual({
      lines: [{ merchandiseId: "gid://shopify/ProductVariant/9", quantity: 2 }],
      buyerIdentity: { countryCode: "US" },
    });
    expect(body.query).toContain("@inContext(country: $country, language: $language)");
    expect(body.variables).toMatchObject({ country: "US", language: "EN" });
  });

  it("adds, updates, removes lines and updates discount codes", async () => {
    respond("cartLinesAdd", { cart, userErrors: [] });
    await expect(addLines(ctx, cart.id, [{ merchandiseId: "m", quantity: 1 }])).resolves.toMatchObject({ id: cart.id });
    respond("cartLinesUpdate", { cart, userErrors: [] });
    await expect(updateLines(ctx, cart.id, [{ id: "l", quantity: 3 }])).resolves.toBeDefined();
    respond("cartLinesRemove", { cart, userErrors: [] });
    await expect(removeLines(ctx, cart.id, ["l"])).resolves.toBeDefined();
    const spy = respond("cartDiscountCodesUpdate", { cart, userErrors: [] });
    await updateDiscountCodes(ctx, cart.id, ["WELCOME"]);
    expect(JSON.parse(spy.mock.calls.at(-1)![1]!.body as string).variables.discountCodes).toEqual(["WELCOME"]);
  });

  it("surfaces Shopify userErrors instead of pretending success", async () => {
    respond("cartLinesAdd", { cart: null, userErrors: [{ field: ["lines"], message: "The product is sold out." }] });
    await expect(addLines(ctx, cart.id, [{ merchandiseId: "m", quantity: 1 }])).rejects.toMatchObject({
      name: "CartError",
      message: "The product is sold out.",
    });
    respond("cartLinesAdd", { cart: null, userErrors: [] });
    await expect(addLines(ctx, cart.id, [])).rejects.toBeInstanceOf(CartError);
  });
});
