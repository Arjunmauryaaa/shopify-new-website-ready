"use client";

import Link from "@/components/ui/link";
import { useMarket } from "@/providers/market-provider";
import { Media } from "@/components/ui/media";
import { productPriceDisplay } from "@/lib/format";
import { colorSummary } from "@/lib/variants";
import type { ProductCard as ProductCardData } from "@/lib/shopify/types";
import { QuickView } from "./quick-view";
import { WishlistButton } from "./wishlist-button";

type Props = {
  product: ProductCardData;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
};

export function ProductCardView({ product, ratio = "4 / 5", sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw", priority }: Props) {
  const { locale } = useMarket();
  const price = productPriceDisplay(product, locale);
  const colours = colorSummary(product);
  const [first, second] = [product.featuredImage ?? product.images.nodes[0], product.images.nodes[1]];
  // Only reveal an alternate when a genuinely different second image exists.
  const alt = second && second.url !== first?.url ? second : null;
  const href = `/products/${product.handle}`;

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link href={href} className="pcard__link" data-testid="product-card" tabIndex={-1} aria-hidden="true">
          <Media src={first?.url} alt={first?.altText || product.title} ratio={ratio} sizes={sizes} priority={priority} className="pcard__img" />
          {alt && <Media src={alt.url} alt="" ratio={ratio} sizes={sizes} className="pcard__img pcard__img--alt" />}
          {!product.availableForSale && <span className="pcard__flag">Sold out</span>}
        </Link>
        <WishlistButton handle={product.handle} title={product.title} />
        {product.availableForSale && <QuickView handle={product.handle} title={product.title} />}
      </div>
      <Link href={href} className="pcard__link pcard__meta">
        <p className="pcard__title">{product.title}</p>
        <p className="pcard__price">
          {price.isRange && <span className="muted">From </span>}
          {price.compareAt && <s className="muted">{price.compareAt}</s>} <span>{price.price}</span>
        </p>
        {colours && <p className="pcard__colours">{colours}</p>}
      </Link>
    </article>
  );
}
