"use client";

import Link from "@/components/ui/link";
import { Dialog } from "@/components/ui/dialog";
import { CloseIcon } from "@/components/ui/icons";
import { useCart } from "@/providers/cart-provider";
import { CartLineItem } from "./cart-lines";
import { CartUpsell, FreeShippingBar, GiftOptions } from "./cart-extras";
import { CartSummary } from "./cart-summary";
import { TrustBlock } from "@/components/product/trust-block";

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, error, clearError, status } = useCart();
  const lines = cart?.lines.nodes ?? [];

  return (
    <Dialog open={drawerOpen} onClose={closeDrawer} side="right" label="Shopping bag" className="cart-dialog">
      <div className="drawer">
        <div className="drawer__head">
          <h2 className="label">Bag{cart && cart.totalQuantity > 0 ? ` (${cart.totalQuantity})` : ""}</h2>
          <button type="button" className="icon-btn" aria-label="Close bag" onClick={closeDrawer}>
            <CloseIcon />
          </button>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error} <button type="button" className="text-btn" onClick={clearError}>Dismiss</button>
          </p>
        )}

        {lines.length === 0 ? (
          <div className="drawer__empty">
            <p>{status === "loading" ? "Loading your bag…" : "Your bag is empty."}</p>
            <Link href="/shop" className="text-link" onClick={closeDrawer}>Continue shopping</Link>
          </div>
        ) : (
          <>
            <div className="drawer__extras"><FreeShippingBar /></div>
            <ul className="cart-lines">
              {lines.map((line) => (
                <CartLineItem key={line.id} line={line} onNavigate={closeDrawer} />
              ))}
            </ul>
            <div className="drawer__foot">
              <CartUpsell />
              <GiftOptions />
              <CartSummary />
              <TrustBlock compact />
              <div className="drawer__links">
                <Link href="/cart" className="text-link" onClick={closeDrawer}>View bag</Link>
                <button type="button" className="text-btn" onClick={closeDrawer}>Continue shopping</button>
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
