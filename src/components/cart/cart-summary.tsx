"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/analytics";
import { useCart } from "@/providers/cart-provider";
import { useMarket } from "@/providers/market-provider";

/** Totals come straight from Shopify's cart cost; nothing is computed client-side. */
export function CartSummary({ withDiscount = false }: { withDiscount?: boolean }) {
  const { cart, applyDiscount, pending } = useCart();
  const { locale } = useMarket();
  const [code, setCode] = useState("");
  if (!cart) return null;
  const blocked = cart.lines.nodes.some((l) => !l.merchandise.availableForSale) || pending !== null;
  const applied = cart.discountCodes.filter((d) => d.applicable);
  const rejected = cart.discountCodes.filter((d) => !d.applicable);

  return (
    <div className="cart-summary">
      {withDiscount && (
        <form
          className="discount"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await applyDiscount(code.trim())) setCode("");
          }}
        >
          <label htmlFor="discount-code" className="label">Discount code</label>
          <div className="discount__row">
            <input id="discount-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" maxLength={60} />
            <button type="submit" className="btn btn--outline" disabled={!code.trim() || pending === "discount"}>Apply</button>
          </div>
          {applied.map((d) => (
            <p key={d.code} className="small">
              {d.code} applied · <button type="button" className="text-btn" onClick={() => applyDiscount("")}>Remove</button>
            </p>
          ))}
          {rejected.map((d) => (
            <p key={d.code} className="form-error small">“{d.code}” can’t be applied to this cart.</p>
          ))}
        </form>
      )}
      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(cart.cost.subtotalAmount, locale)}</dd>
        </div>
        {withDiscount && cart.cost.totalTaxAmount && Number(cart.cost.totalTaxAmount.amount) > 0 && (
          <div>
            <dt>Estimated tax</dt>
            <dd>{formatMoney(cart.cost.totalTaxAmount, locale)}</dd>
          </div>
        )}
      </dl>
      <p className="muted small">Shipping, taxes and discounts are finalised at checkout.</p>
      <a
        className="btn btn--solid btn--block"
        href={blocked ? undefined : cart.checkoutUrl}
        aria-disabled={blocked}
        data-testid="checkout-link"
        onClick={() =>
          track({
            name: "begin_checkout",
            value: Number(cart.cost.subtotalAmount.amount),
            currency: cart.cost.subtotalAmount.currencyCode,
            items: cart.lines.nodes.map((l) => ({ id: l.merchandise.id, name: l.merchandise.product.title, price: Number(l.cost.amountPerQuantity.amount), currency: l.cost.amountPerQuantity.currencyCode, quantity: l.quantity })),
          })
        }
      >
        Checkout
      </a>
    </div>
  );
}
