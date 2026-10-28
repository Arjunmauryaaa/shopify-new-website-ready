import type { SortId } from "./types";

export type FacetSelection = {
  /** Selected facet value ids (repeated `f` URL param). */
  values: string[];
  priceMin?: string;
  priceMax?: string;
};

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "best-selling", label: "Best selling" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "title-asc", label: "Name: A–Z" },
];

export function parseSort(value: string | string[] | undefined): SortId {
  const v = Array.isArray(value) ? value[0] : value;
  return SORT_OPTIONS.some((o) => o.id === v) ? (v as SortId) : "featured";
}

const asArray = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const numeric = (v: string | string[] | undefined): string | undefined => {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d+(\.\d{1,2})?$/.test(s) ? s : undefined;
};

export function parseSelection(params: Record<string, string | string[] | undefined>): FacetSelection {
  return {
    values: asArray(params.f).filter((v) => v.length > 0 && v.length < 200).slice(0, 30),
    priceMin: numeric(params.price_min),
    priceMax: numeric(params.price_max),
  };
}

/** Maps selected facet value ids to Shopify `ProductFilter` inputs; unknown ids are dropped (never trusted). */
export function resolveFacetSelection(selection: FacetSelection, inputs: Map<string, unknown>): unknown[] {
  const out: unknown[] = [];
  for (const id of selection.values) {
    const input = inputs.get(id);
    if (input) out.push(input);
  }
  if (selection.priceMin || selection.priceMax) {
    const price: { min?: number; max?: number } = {};
    if (selection.priceMin) price.min = Number(selection.priceMin);
    if (selection.priceMax) price.max = Number(selection.priceMax);
    out.push({ price });
  }
  return out;
}
