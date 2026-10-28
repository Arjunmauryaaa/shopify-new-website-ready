"use client";

import Link from "@/components/ui/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/providers/cart-provider";
import { CartLineItem } from "./cart-lines";
import { CartUpsell, FreeShippingBar, GiftOptions } from "./cart-extras";
import { CartSummary } from "./cart-summary";
import { TrustBlock } from "@/components/product/trust-block";

export function CartView() {
  const { cart, status, error, clearError } = useCart();
  const lines = cart?.lines.nodes ?? [];

  if (status === "loading" && !cart) return <p className="muted" aria-live="polite">Loading your bag…</p>;

  if (status === "error" && !cart) {
    return (
      <div role="alert">
        <p className="form-error">{error}</p>
        <button type="button" className="btn btn--outline" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="Your bag is empty." actions={[{ href: "/shop", label: "Continue shopping", primary: true }, { href: "/wishlist", label: "View saved items" }]}>
        Pieces you add will wait here for you.
      </EmptyState>
    );
  }

  return (
    <div className="cart-page">
      <div>
        {error && (
          <p className="form-error" role="alert">
            {error} <button type="button" className="text-btn" onClick={clearError}>Dismiss</button>
          </p>
        )}
        <FreeShippingBar />
        <ul className="cart-lines">
          {lines.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>
        <CartUpsell />
      </div>
      <aside className="cart-page__summary" aria-label="Order summary">
        <h2 className="label">Summary</h2>
        <GiftOptions />
        <CartSummary withDiscount />
        <TrustBlock />
        <Link href="/shop" className="text-link">Continue shopping</Link>
      </aside>
    </div>
  );
}
