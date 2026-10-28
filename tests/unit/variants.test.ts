import { describe, expect, it } from "vitest";
import { colorSummary, findVariant, galleryImages, initialSelection, optionValueState, resolveSelection } from "@/lib/variants";
import type { Variant } from "@/lib/shopify/types";

const money = { amount: "10", currencyCode: "INR" };
const v = (id: string, size: string, color: string, availableForSale = true, image: Variant["image"] = null): Variant => ({
  id: `gid://shopify/ProductVariant/${id}`,
  title: `${size} / ${color}`,
  availableForSale,
  selectedOptions: [{ name: "Size", value: size }, { name: "Color", value: color }],
  price: money,
  compareAtPrice: null,
  image,
});
const variants = [v("1", "S", "Ivory"), v("2", "M", "Ivory"), v("3", "S", "Black", false), v("4", "M", "Black")];

describe("variant selection", () => {
  it("finds the exact variant for a selection", () => {
    expect(findVariant(variants, { Size: "M", Color: "Black" })?.id).toMatch(/\/4$/);
    expect(findVariant(variants, { Size: "L", Color: "Black" })).toBeUndefined();
  });

  it("starts from the URL variant, else the first available one", () => {
    expect(initialSelection({ variants: { nodes: variants } }, "2")).toEqual({ Size: "M", Color: "Ivory" });
    expect(initialSelection({ variants: { nodes: variants } }, "999")).toEqual({ Size: "S", Color: "Ivory" });
    const soldOutFirst = [v("1", "S", "Ivory", false), v("2", "M", "Ivory")];
    expect(initialSelection({ variants: { nodes: soldOutFirst } })).toEqual({ Size: "M", Color: "Ivory" });
  });

  it("reports unavailable vs sold-out option values", () => {
    expect(optionValueState(variants, { Size: "S", Color: "Ivory" }, "Color", "Black")).toBe("sold-out");
    expect(optionValueState(variants, { Size: "S", Color: "Ivory" }, "Size", "M")).toBe("available");
    expect(optionValueState(variants, { Size: "S", Color: "Ivory" }, "Size", "XL")).toBe("unavailable");
  });

  it("falls back to a real variant when the exact combination does not exist", () => {
    const sparse = [v("1", "S", "Ivory"), v("4", "M", "Black")];
    expect(resolveSelection(sparse, { Size: "S", Color: "Ivory" }, "Color", "Black")).toEqual({ Size: "M", Color: "Black" });
  });
});

describe("gallery & colour summary", () => {
  const img = (n: string) => ({ url: `https://cdn/${n}.jpg`, altText: null, width: 1, height: 1 });
  it("puts the variant image first", () => {
    const out = galleryImages({ images: { nodes: [img("a"), img("b"), img("c")] } }, v("1", "S", "I", true, img("c")));
    expect(out.map((i) => i.url.slice(-5))).toEqual(["c.jpg", "a.jpg", "b.jpg"]);
  });
  it("summarises colours from real option data only", () => {
    expect(colorSummary({ options: [{ name: "Colour", values: ["A", "B", "C"] }] })).toBe("3 colours");
    expect(colorSummary({ options: [{ name: "Size", values: ["S"] }] })).toBeNull();
  });
});
