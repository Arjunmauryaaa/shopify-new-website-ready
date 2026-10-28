"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Cart } from "@/lib/shopify/types";
import type { CartAction } from "@/lib/validation";
import { useMarket } from "./market-provider";

type Status = "idle" | "loading" | "error";

type CartContextValue = {
  cart: Cart | null;
  status: Status;
  /** Id of the line (or "add"/"discount") currently being mutated. */
  pending: string | null;
  error: string | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: string, quantity: number, options?: { openDrawer?: boolean }) => Promise<boolean>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<boolean>;
  setNote: (note: string) => Promise<boolean>;
  /** Express checkout: resolves with Shopify's checkout URL for a separate one-item cart, or null on failure. */
  buyNow: (variantId: string, quantity: number) => Promise<string | null>;
  clearError: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const market = useMarket();
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cart", { signal: controller.signal, headers: { "x-market": market.slug } })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Your cart could not be loaded.");
        setCart(body.cart);
        setStatus("idle");
        // The cart follows the market being browsed so checkout shows the right currency, taxes and duties.
        if (body.cart && body.cart.buyerIdentity?.countryCode !== market.country) {
          const sync = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-market": market.slug },
            body: JSON.stringify({ action: "market" }),
          });
          if (sync.ok) setCart((await sync.json()).cart);
        }
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setError(e.message);
        setStatus("error");
      });
    return () => controller.abort();
  }, [market.slug, market.country]);

  /** Mutations are serialised so rapid clicks can never race and overwrite one another. */
  const mutate = useCallback((action: CartAction, key: string): Promise<boolean> => {
    const task = queue.current.then(async () => {
      setPending(key);
      setError(null);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-market": market.slug },
          body: JSON.stringify(action),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "We couldn't update your cart.");
        setCart(body.cart);
        setStatus("idle");
        return true;
      } catch (e) {
        setError(e instanceof TypeError ? "Network problem — please check your connection and try again." : (e as Error).message);
        return false;
      } finally {
        setPending((p) => (p === key ? null : p));
      }
    });
    queue.current = task;
    return task;
  }, [market.slug]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      status,
      pending,
      error,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem: async (variantId, quantity, options) => {
        const ok = await mutate({ action: "add", variantId, quantity }, "add");
        if (ok && options?.openDrawer !== false) setDrawerOpen(true);
        return ok;
      },
      updateItem: async (lineId, quantity) => void (await mutate({ action: "update", lineId, quantity }, lineId)),
      removeItem: async (lineId) => void (await mutate({ action: "remove", lineId }, lineId)),
      applyDiscount: (code) => mutate({ action: "discount", code }, "discount"),
      setNote: (note) => mutate({ action: "note", note }, "note"),
      buyNow: async (variantId, quantity) => {
        setError(null);
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-market": market.slug },
            body: JSON.stringify({ action: "buyNow", variantId, quantity }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.cart?.checkoutUrl) throw new Error(body.error ?? "We couldn't start checkout.");
          return body.cart.checkoutUrl as string;
        } catch (e) {
          setError(e instanceof TypeError ? "Network problem — please try again." : (e as Error).message);
          return null;
        }
      },
      clearError: () => setError(null),
    }),
    [cart, status, pending, error, drawerOpen, mutate, market.slug],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
