import "server-only";
import type { Ctx } from "@/config/markets";
import { shopifyFetch, withContext } from "./client";
import { CART_FRAGMENTS } from "./fragments";
import type { Cart } from "./types";

type UserError = { field: string[] | null; message: string };
type CartPayload = { cart: Cart | null; userErrors: UserError[] };

export class CartError extends Error {
  constructor(message: string, readonly userErrors: UserError[] = []) {
    super(message);
    this.name = "CartError";
  }
}

function unwrap(payload: CartPayload): Cart {
  if (payload.userErrors?.length) {
    throw new CartError(payload.userErrors.map((e) => e.message).join(" "), payload.userErrors);
  }
  if (!payload.cart) throw new CartError("The cart could not be updated.");
  return payload.cart;
}

const run = <T>(ctx: Ctx, query: string, variables: Record<string, unknown>) =>
  shopifyFetch<T>({ query: withContext(query), variables, revalidate: false, ctx });

export async function getCart(ctx: Ctx, cartId: string): Promise<Cart | null> {
  const data = await run<{ cart: Cart | null }>(
    ctx,
    /* GraphQL */ `
      query GetCart($cartId: ID!) {
        cart(id: $cartId) { ...CartFields }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId },
  );
  return data.cart;
}

export async function createCart(ctx: Ctx, lines: { merchandiseId: string; quantity: number }[]): Promise<Cart> {
  const data = await run<{ cartCreate: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { input: { lines, buyerIdentity: { countryCode: ctx.country } } },
  );
  return unwrap(data.cartCreate);
}

export async function addLines(ctx: Ctx, cartId: string, lines: { merchandiseId: string; quantity: number }[]): Promise<Cart> {
  const data = await run<{ cartLinesAdd: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId, lines },
  );
  return unwrap(data.cartLinesAdd);
}

export async function updateLines(ctx: Ctx, cartId: string, lines: { id: string; quantity: number }[]): Promise<Cart> {
  const data = await run<{ cartLinesUpdate: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId, lines },
  );
  return unwrap(data.cartLinesUpdate);
}

export async function removeLines(ctx: Ctx, cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await run<{ cartLinesRemove: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId, lineIds },
  );
  return unwrap(data.cartLinesRemove);
}

export async function updateDiscountCodes(ctx: Ctx, cartId: string, discountCodes: string[]): Promise<Cart> {
  const data = await run<{ cartDiscountCodesUpdate: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId, discountCodes },
  );
  return unwrap(data.cartDiscountCodesUpdate);
}

/** Keeps checkout pricing, currency and duties aligned with the market the buyer is browsing. */
export async function updateBuyerCountry(ctx: Ctx, cartId: string): Promise<Cart> {
  const data = await run<{ cartBuyerIdentityUpdate: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
        cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId, buyerIdentity: { countryCode: ctx.country } },
  );
  return unwrap(data.cartBuyerIdentityUpdate);
}

export async function updateNote(ctx: Ctx, cartId: string, note: string): Promise<Cart> {
  const data = await run<{ cartNoteUpdate: CartPayload }>(
    ctx,
    /* GraphQL */ `
      mutation CartNoteUpdate($cartId: ID!, $note: String) {
        cartNoteUpdate(cartId: $cartId, note: $note) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENTS}
    `,
    { cartId, note },
  );
  return unwrap(data.cartNoteUpdate);
}
