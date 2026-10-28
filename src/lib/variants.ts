import type { Product, ProductCard, ShopifyImage, Variant } from "@/lib/shopify/types";

export type Selection = Record<string, string>;

export const isColorOption = (name: string) => /colou?r/i.test(name);

export function findVariant(variants: Variant[], selection: Selection): Variant | undefined {
  return variants.find((v) => v.selectedOptions.every((o) => selection[o.name] === o.value));
}

/** URL `variant` param takes priority (numeric id or full gid), otherwise the first available variant. */
export function initialSelection(product: Pick<Product, "variants">, variantParam?: string | null): Selection {
  const variants = product.variants.nodes;
  const fromParam = variantParam
    ? variants.find((v) => v.id === variantParam || v.id.endsWith(`/${variantParam}`))
    : undefined;
  const chosen = fromParam ?? variants.find((v) => v.availableForSale) ?? variants[0];
  return Object.fromEntries((chosen?.selectedOptions ?? []).map((o) => [o.name, o.value]));
}

export type OptionState = "available" | "sold-out" | "unavailable";

/**
 * State of an option value given the current choices for the other options:
 *  - unavailable: no such variant combination exists (cannot be chosen)
 *  - sold-out: the combination exists but cannot be purchased
 */
export function optionValueState(
  variants: Variant[],
  selection: Selection,
  optionName: string,
  value: string,
): OptionState {
  const candidate = { ...selection, [optionName]: value };
  const matching = variants.filter((v) =>
    v.selectedOptions.every((o) => (o.name === optionName ? o.value === value : candidate[o.name] === undefined || candidate[o.name] === o.value)),
  );
  if (matching.length === 0) return "unavailable";
  return matching.some((v) => v.availableForSale) ? "available" : "sold-out";
}

/** Chooses the best variant when a single option changes and the exact combination doesn't exist. */
export function resolveSelection(variants: Variant[], current: Selection, optionName: string, value: string): Selection {
  const next = { ...current, [optionName]: value };
  if (findVariant(variants, next)) return next;
  const fallback = variants.find((v) => v.selectedOptions.some((o) => o.name === optionName && o.value === value) && v.availableForSale)
    ?? variants.find((v) => v.selectedOptions.some((o) => o.name === optionName && o.value === value));
  return fallback ? Object.fromEntries(fallback.selectedOptions.map((o) => [o.name, o.value])) : current;
}

/** Gallery order: selected variant image first (when it exists in the media list), then the rest. */
export function galleryImages(product: Pick<Product, "images">, variant?: Variant): ShopifyImage[] {
  const all = product.images.nodes;
  const vi = variant?.image;
  if (!vi) return all;
  const idx = all.findIndex((i) => i.url === vi.url);
  if (idx === -1) return [vi, ...all];
  return [all[idx], ...all.slice(0, idx), ...all.slice(idx + 1)];
}

export function colorSummary(product: Pick<ProductCard, "options">): string | null {
  const color = product.options.find((o) => isColorOption(o.name));
  if (!color || color.values.length === 0) return null;
  return color.values.length === 1 ? color.values[0] : `${color.values.length} colours`;
}

/** Colour dots for listings. Only values the store has given a swatch colour in Shopify are shown; nothing is guessed from names. */
export function colorSwatches(product: Pick<ProductCard, "options">): { name: string; color: string }[] {
  const option = product.options.find((o) => isColorOption(o.name));
  return (option?.optionValues ?? []).flatMap((v) => (v.swatch?.color && /^#[0-9a-f]{3,8}$/i.test(v.swatch.color) ? [{ name: v.name, color: v.swatch.color }] : []));
}
