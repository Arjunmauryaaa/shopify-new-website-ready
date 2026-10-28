"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useEffect, useState } from "react";
import { ProductCardView } from "@/components/product/product-card";
import type { ProductCard } from "@/lib/shopify/types";
import { useMarket } from "@/providers/market-provider";
import { useWishlist } from "@/providers/wishlist-provider";

export function WishlistView() {
  const { handles, ready } = useWishlist();
  const { slug } = useMarket();
  const [products, setProducts] = useState<ProductCard[] | null>(null);
  const [error, setError] = useState(false);
  const key = handles.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to fetch for an empty list
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    setError(false);
    fetch(`/api/products?handles=${encodeURIComponent(key)}`, { signal: controller.signal, headers: { "x-market": slug } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((data: { products: ProductCard[] }) => setProducts(data.products))
      .catch((e: Error) => e.name !== "AbortError" && setError(true));
    return () => controller.abort();
  }, [key, ready, slug]);

  if (error) return <p className="form-error" role="alert">We couldn’t load your wishlist. Please refresh to try again.</p>;
  if (!ready || products === null) return <p className="muted" aria-live="polite">Loading…</p>;

  // Show items in saved order; handles no longer in the catalogue are dropped from the view.
  const ordered = handles.map((h) => products.find((p) => p.handle === h)).filter((p): p is ProductCard => Boolean(p));

  if (ordered.length === 0) {
    return (
      <EmptyState title="You haven’t saved anything yet." actions={[{ href: "/shop", label: "Explore the collection", primary: true }]}>
        Tap the heart on any piece to keep it here.
      </EmptyState>
    );
  }
  return (
    <ul className="grid-products">
      {ordered.map((p) => (
        <li key={p.id}>
          <ProductCardView product={p} />
        </li>
      ))}
    </ul>
  );
}
