"use client";

import Link from "@/components/ui/link";
import { ShopifyMedia } from "@/components/ui/media";
import { formatMoney, isOnSale } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";
import { useMarket } from "@/providers/market-provider";
import type { CartLine } from "@/lib/shopify/types";

export function QuantityStepper({ line }: { line: CartLine }) {
  const { updateItem, pending } = useCart();
  const busy = pending === line.id;
  return (
    <div className="stepper" role="group" aria-label={`Quantity for ${line.merchandise.product.title}`}>
      <button type="button" aria-label="Decrease quantity" disabled={busy} onClick={() => updateItem(line.id, line.quantity - 1)}>−</button>
      <output aria-live="polite">{line.quantity}</output>
      <button type="button" aria-label="Increase quantity" disabled={busy} onClick={() => updateItem(line.id, line.quantity + 1)}>+</button>
    </div>
  );
}

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { removeItem, pending } = useCart();
  const { locale } = useMarket();
  const m = line.merchandise;
  const variantLabel = m.selectedOptions.filter((o) => !(o.name === "Title" && o.value === "Default Title")).map((o) => o.value).join(" / ");
  const sale = isOnSale(line.cost.compareAtAmountPerQuantity, line.cost.amountPerQuantity);

  return (
    <li className="cart-line" data-pending={pending === line.id || undefined}>
      <Link href={`/products/${m.product.handle}`} onClick={onNavigate} className="cart-line__image" tabIndex={-1} aria-hidden="true">
        <ShopifyMedia image={m.image} ratio="4 / 5" sizes="120px" alt="" />
      </Link>
      <div className="cart-line__info">
        <Link href={`/products/${m.product.handle}`} onClick={onNavigate} className="cart-line__title">
          {m.product.title}
        </Link>
        {variantLabel && <p className="muted small">{variantLabel}</p>}
        {!m.availableForSale && <p className="form-error small">No longer available</p>}
        <div className="cart-line__controls">
          <QuantityStepper line={line} />
          <button type="button" className="text-btn" disabled={pending === line.id} onClick={() => removeItem(line.id)}>
            Remove
          </button>
        </div>
      </div>
      <p className="cart-line__price">
        {sale && <s className="muted">{formatMoney({ ...line.cost.compareAtAmountPerQuantity!, amount: String(Number(line.cost.compareAtAmountPerQuantity!.amount) * line.quantity) }, locale)}</s>}
        <span>{formatMoney(line.cost.totalAmount, locale)}</span>
      </p>
    </li>
  );
}
