"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import Link from "@/components/ui/link";
import { CloseIcon } from "@/components/ui/icons";
import { Media } from "@/components/ui/media";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";
import { findVariant, initialSelection, optionValueState, resolveSelection, type Selection } from "@/lib/variants";
import { useCart } from "@/providers/cart-provider";
import { useMarket } from "@/providers/market-provider";

/** Pick options and add to bag without leaving the listing. Loads the full product on demand. */
export function QuickView({ handle, title }: { handle: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="quick-btn" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Quick add ${title}`}>
        Quick add
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} side="right" label={`Quick add ${title}`} className="quick-dialog">
        <QuickPanel handle={handle} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function QuickPanel({ handle, onClose }: { handle: string; onClose: () => void }) {
  const { slug, locale } = useMarket();
  const { addItem, pending } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/product?handle=${encodeURIComponent(handle)}`, { signal: controller.signal, headers: { "x-market": slug } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then(({ product }: { product: Product }) => {
        setProduct(product);
        setSelection(initialSelection(product));
      })
      .catch((e: Error) => e.name !== "AbortError" && setError("We couldn't load this product. Please try again."));
    return () => controller.abort();
  }, [handle, slug]);

  const variant = useMemo(() => (product ? findVariant(product.variants.nodes, selection) : undefined), [product, selection]);
  const hasOptions = product ? !(product.options.length === 1 && product.options[0].values.length === 1) : false;

  async function add() {
    if (!product || !variant?.availableForSale) return;
    if (await addItem(variant.id, 1)) {
      track({ name: "add_to_cart", items: [{ id: product.id, name: product.title, price: Number(variant.price.amount), currency: variant.price.currencyCode, variant: variant.title }] });
      onClose();
    } else setError("We couldn't add this to your bag. Please try again.");
  }

  return (
    <div className="drawer">
      <div className="drawer__head">
        <h2 className="label">Quick add</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="drawer__scroll">
        {!product && !error && <p className="muted" aria-live="polite">Loading…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {product && (
          <div className="stack">
            <Media src={(variant?.image ?? product.featuredImage)?.url} alt={product.title} ratio="4 / 5" sizes="400px" />
            <div>
              <h3 className="pdp__title">{product.title}</h3>
              <p>{formatMoney(variant?.price ?? product.priceRange.minVariantPrice, locale)}</p>
            </div>
            {hasOptions && product.options.map((option) => (
              <fieldset key={option.name} className="options">
                <legend className="label">{option.name}: <span className="options__current">{selection[option.name]}</span></legend>
                <div className="options__values" role="radiogroup" aria-label={option.name}>
                  {option.values.map((value) => {
                    const state = optionValueState(product.variants.nodes, selection, option.name, value);
                    return (
                      <button key={value} type="button" role="radio" aria-checked={selection[option.name] === value} disabled={state === "unavailable"} className={`opt ${state === "sold-out" ? "is-soldout" : ""}`} onClick={() => setSelection((s) => resolveSelection(product.variants.nodes, s, option.name, value))}>
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <button type="button" className="btn btn--solid btn--block" disabled={!variant?.availableForSale || pending === "add"} onClick={add}>
              {pending === "add" ? "Adding…" : variant?.availableForSale ? "Add to bag" : "Sold out"}
            </button>
            <Link href={`/products/${product.handle}`} className="text-link" onClick={onClose}>View full details</Link>
          </div>
        )}
      </div>
    </div>
  );
}
