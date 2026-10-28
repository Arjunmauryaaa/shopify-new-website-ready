"use client";

import { useState } from "react";
import Link from "@/components/ui/link";
import { Media } from "@/components/ui/media";
import type { CampaignImage, Hotspot } from "@/config/brand";
import { productPriceDisplay } from "@/lib/format";
import type { ProductCard } from "@/lib/shopify/types";
import { useMarket } from "@/providers/market-provider";

/** Tappable hotspots on an editorial image. Each opens a mini product card linking to the real product page. */
export function ShopTheLookView({ title, image, hotspots, products }: { title: string; image: CampaignImage; hotspots: Hotspot[]; products: ProductCard[] }) {
  const { locale } = useMarket();
  const [active, setActive] = useState<number | null>(null);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const spots = hotspots.filter((h) => byHandle.has(h.handle));
  if (spots.length === 0) return null;

  return (
    <section className="look" aria-labelledby="look-title" onKeyDown={(e) => e.key === "Escape" && setActive(null)}>
      <div className="look__stage">
        <Media src={image.src} alt={image.alt} position={image.position} ratio="4 / 5" sizes="(min-width: 900px) 50vw, 100vw" placeholderLabel="Shop the look image" />
        {spots.map((h, i) => {
          const p = byHandle.get(h.handle)!;
          const price = productPriceDisplay(p, locale).price;
          const open = active === i;
          return (
            <div key={h.handle} className="hotspot" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
              <button type="button" className="hotspot__dot" aria-expanded={open} aria-label={`${p.title}, ${price}`} onClick={() => setActive(open ? null : i)} />
              {open && (
                <div className="hotspot__card" role="dialog" aria-label={p.title}>
                  <Link href={`/products/${p.handle}`}>
                    <Media src={p.featuredImage?.url} alt="" ratio="1 / 1" sizes="96px" />
                    <span className="small">{p.title}</span>
                    <span className="small muted">{price}</span>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="look__text">
        <h2 id="look-title" className="display">{title}</h2>
        <ul className="look__list">
          {spots.map((h) => {
            const p = byHandle.get(h.handle)!;
            return (
              <li key={h.handle}>
                <Link href={`/products/${p.handle}`}>{p.title}</Link>
                <span className="muted">{productPriceDisplay(p, locale).price}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
