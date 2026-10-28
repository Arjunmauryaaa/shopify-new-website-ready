"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "@/components/ui/link";
import { Media } from "@/components/ui/media";
import { brand } from "@/config/brand";
import { freeShippingProgress, parseThresholds } from "@/lib/commerce";
import { formatMoney, productPriceDisplay } from "@/lib/format";
import type { ProductCard } from "@/lib/shopify/types";
import { track } from "@/lib/analytics";
import { useCart } from "@/providers/cart-provider";
import { useMarket } from "@/providers/market-provider";

const thresholds = parseThresholds(brand.commerce.freeShippingEnv);

/** Progress toward free shipping. Hidden unless a threshold is configured for the cart's currency. */
export function FreeShippingBar() {
  const { cart } = useCart();
  const { locale } = useMarket();
  if (!cart || cart.lines.nodes.length === 0) return null;
  const progress = freeShippingProgress(cart.cost.subtotalAmount, thresholds);
  if (!progress) return null;
  return (
    <div className="shipbar" data-testid="free-shipping-bar">
      <p className="small">
        {progress.unlocked
          ? "You've unlocked free shipping."
          : `You're ${formatMoney(progress.remaining, locale)} away from free shipping.`}
      </p>
      <div className="shipbar__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.ratio * 100)} aria-label="Progress to free shipping">
        <span style={{ width: `${progress.ratio * 100}%` }} />
      </div>
    </div>
  );
}

/** "Frequently bought with": Shopify's own recommendations for the first item in the bag. */
export function CartUpsell() {
  const { cart, addItem, pending } = useCart();
  const { slug, locale } = useMarket();
  const [items, setItems] = useState<ProductCard[]>([]);
  const firstProductGid = useRef<string | null>(null);

  const first = cart?.lines.nodes[0]?.merchandise.product.handle;
  const inBag = useMemo(() => new Set(cart?.lines.nodes.map((l) => l.merchandise.product.handle) ?? []), [cart]);

  useEffect(() => {
    if (!first) return;
    const controller = new AbortController();
    (async () => {
      try {
        const p = await fetch(`/api/product?handle=${encodeURIComponent(first)}`, { signal: controller.signal, headers: { "x-market": slug } });
        if (!p.ok) return;
        const gid: string = (await p.json()).product.id;
        if (firstProductGid.current === gid) return;
        firstProductGid.current = gid;
        const r = await fetch(`/api/product?recommendationsFor=${encodeURIComponent(gid)}`, { signal: controller.signal, headers: { "x-market": slug } });
        if (r.ok) setItems((await r.json()).products);
      } catch {
        /* upsell is optional */
      }
    })();
    return () => controller.abort();
  }, [first, slug]);

  const shown = items.filter((p) => !inBag.has(p.handle) && p.availableForSale).slice(0, 2);
  if (shown.length === 0) return null;

  return (
    <section className="upsell" aria-label="Complete your order">
      <h3 className="label">Complete the look</h3>
      <ul>
        {shown.map((p) => {
          const single = p.variants.nodes.length === 1 && p.options.every((o) => o.values.length === 1);
          const variant = p.variants.nodes[0];
          return (
            <li key={p.id}>
              <Link href={`/products/${p.handle}`} className="upsell__img" tabIndex={-1} aria-hidden="true">
                <Media src={p.featuredImage?.url} alt="" ratio="4 / 5" sizes="64px" />
              </Link>
              <div>
                <Link href={`/products/${p.handle}`} className="small">{p.title}</Link>
                <p className="small muted">{productPriceDisplay(p, locale).price}</p>
              </div>
              {single && variant?.availableForSale ? (
                <button
                  type="button"
                  className="btn btn--outline upsell__btn"
                  disabled={pending === "add"}
                  onClick={async () => {
                    if (await addItem(variant.id, 1)) {
                      track({ name: "add_to_cart", items: [{ id: p.id, name: p.title, price: Number(p.priceRange.minVariantPrice.amount), currency: p.priceRange.minVariantPrice.currencyCode }] });
                    }
                  }}
                >
                  Add
                </button>
              ) : (
                <Link href={`/products/${p.handle}`} className="text-link">View</Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Gift note (saved on the Shopify cart) and optional gift-wrap line item. */
export function GiftOptions() {
  const { cart, setNote, addItem, removeItem, pending } = useCart();
  const [note, setLocalNote] = useState("");
  const [saved, setSaved] = useState(false);
  const wrapId = brand.commerce.giftWrapVariantId;
  const wrapLine = wrapId ? cart?.lines.nodes.find((l) => l.merchandise.id === wrapId) : undefined;
  const cartNote = cart?.note ?? "";
  const [wrapOn, setWrapOn] = useOptimistic(Boolean(wrapLine));
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the field with the note stored on the Shopify cart
    setLocalNote(cartNote);
  }, [cartNote]);

  if (!cart) return null;
  return (
    <details className="gift" open={Boolean(cartNote) || undefined}>
      <summary className="label">Gift options</summary>
      {wrapId && (
        <label className="check">
          <input
            type="checkbox"
            checked={wrapOn}
            disabled={pending !== null}
            onChange={() =>
              startTransition(async () => {
                setWrapOn(!wrapOn);
                if (wrapLine) await removeItem(wrapLine.id);
                else await addItem(wrapId, 1, { openDrawer: false });
              })
            }
          />
          <span>Add gift wrap</span>
        </label>
      )}
      <div className="field">
        <label htmlFor="gift-note">Gift message</label>
        <textarea
          id="gift-note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => {
            setLocalNote(e.target.value);
            setSaved(false);
          }}
        />
        <button
          type="button"
          className="btn btn--outline"
          disabled={pending === "note" || note.trim() === cartNote}
          onClick={async () => setSaved(await setNote(note.trim()))}
        >
          {pending === "note" ? "Saving…" : "Save message"}
        </button>
        <p className="small" role="status">{saved ? "Message saved — it will appear on your order." : ""}</p>
      </div>
    </details>
  );
}
