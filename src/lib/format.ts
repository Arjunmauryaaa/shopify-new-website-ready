import type { Money, ProductCard } from "@/lib/shopify/types";

/** Formats a Shopify money object using its own currency code. Whole amounts drop the decimals. */
export function formatMoney(money: Money | null | undefined, locale: string): string {
  if (!money) return "";
  const amount = Number(money.amount);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type PriceDisplay = { price: string; compareAt: string | null; isRange: boolean };

/** Compare-at only appears when Shopify returns a genuinely higher price. */
export function productPriceDisplay(p: Pick<ProductCard, "priceRange" | "compareAtPriceRange">, locale: string): PriceDisplay {
  const min = p.priceRange.minVariantPrice;
  const max = p.priceRange.maxVariantPrice;
  const compare = p.compareAtPriceRange.minVariantPrice;
  const isRange = Number(min.amount) !== Number(max.amount);
  const hasCompare = Number(compare.amount) > Number(min.amount);
  return {
    price: formatMoney(min, locale),
    compareAt: hasCompare ? formatMoney(compare, locale) : null,
    isRange,
  };
}

export function isOnSale(compareAt: Money | null | undefined, price: Money): boolean {
  return Boolean(compareAt && Number(compareAt.amount) > Number(price.amount));
}
