import { cookies } from "next/headers";
import { isShopifyConfigured } from "@/config/env";
import { json, marketCtx, rateLimit, sameOrigin } from "@/lib/http";
import { addLines, CartError, createCart, getCart, removeLines, updateBuyerCountry, updateDiscountCodes, updateLines, updateNote } from "@/lib/shopify/cart";
import { ShopifyError } from "@/lib/shopify/client";
import { cartActionSchema } from "@/lib/validation";

const COOKIE = "cart_id";
const TEN_DAYS = 60 * 60 * 24 * 10;
const CART_GID = /^gid:\/\/shopify\/Cart\/[\w-]+(\?key=[\w-]+)?$/;

async function readCartId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  return value && CART_GID.test(value) ? value : null;
}

async function writeCartId(id: string | null) {
  const store = await cookies();
  if (!id) return store.delete(COOKIE);
  store.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TEN_DAYS });
}

const notConfigured = () => json({ error: "The store is not connected to Shopify yet." }, 503);

export async function GET(req: Request) {
  if (!isShopifyConfigured()) return json({ cart: null });
  const id = await readCartId();
  if (!id) return json({ cart: null });
  try {
    const cart = await getCart(marketCtx(req), id);
    if (!cart) await writeCartId(null);
    return json({ cart });
  } catch (e) {
    console.error("[cart] get failed:", (e as Error).message);
    return json({ error: "Your cart could not be loaded." }, 502);
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  if (!rateLimit(req, "cart", 120, 60_000)) return json({ error: "Too many requests. Please wait a moment." }, 429);
  if (!isShopifyConfigured()) return notConfigured();

  const parsed = cartActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request." }, 400);
  const input = parsed.data;

  try {
    const cartId = await readCartId();
    const ctx = marketCtx(req);

    if (input.action === "add") {
      const lines = [{ merchandiseId: input.variantId, quantity: input.quantity }];
      let cart;
      if (cartId) {
        try {
          cart = await addLines(ctx, cartId, lines);
        } catch (e) {
          // An expired/unknown cart is replaced; genuine user errors (e.g. out of stock) are surfaced.
          if (e instanceof CartError && e.userErrors.some((u) => /not exist|not found|invalid/i.test(u.message)) && !(await getCart(ctx, cartId))) {
            cart = await createCart(ctx, lines);
          } else throw e;
        }
      } else {
        cart = await createCart(ctx, lines);
      }
      await writeCartId(cart.id);
      return json({ cart });
    }

    if (input.action === "buyNow") {
      // Express checkout: a separate one-line cart, so the shopper's existing bag is left untouched.
      const cart = await createCart(ctx, [{ merchandiseId: input.variantId, quantity: input.quantity }]);
      return json({ cart });
    }

    if (!cartId) return json({ error: "Your cart is empty." }, 404);

    const cart =
      input.action === "update"
        ? input.quantity === 0
          ? await removeLines(ctx, cartId, [input.lineId])
          : await updateLines(ctx, cartId, [{ id: input.lineId, quantity: input.quantity }])
        : input.action === "remove"
          ? await removeLines(ctx, cartId, [input.lineId])
          : input.action === "market"
            ? await updateBuyerCountry(ctx, cartId)
            : input.action === "note"
              ? await updateNote(ctx, cartId, input.note)
              : await updateDiscountCodes(ctx, cartId, input.code ? [input.code] : []);
    return json({ cart });
  } catch (e) {
    if (e instanceof CartError) return json({ error: e.message }, 422);
    if (e instanceof ShopifyError) console.error(`[cart] shopify ${e.kind}: ${e.message}`);
    else console.error("[cart] unexpected:", (e as Error).message);
    return json({ error: "We couldn't update your cart. Please try again." }, 502);
  }
}
