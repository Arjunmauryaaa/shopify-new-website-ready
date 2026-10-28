import { describe, expect, it } from "vitest";
import { buildShopQuery } from "@/lib/shopify/catalog";
import { parseSelection, parseSort, resolveFacetSelection } from "@/lib/shopify/facets";

describe("sort & selection parsing", () => {
  it("only accepts known sort ids", () => {
    expect(parseSort("price-asc")).toBe("price-asc");
    expect(parseSort("hacked")).toBe("featured");
    expect(parseSort(undefined)).toBe("featured");
  });
  it("sanitises numeric price params", () => {
    const sel = parseSelection({ f: ["a", "b"], price_min: "100", price_max: "abc" });
    expect(sel).toEqual({ values: ["a", "b"], priceMin: "100", priceMax: undefined });
  });
});

describe("resolveFacetSelection", () => {
  it("maps ids to Shopify inputs and drops unknown ids", () => {
    const inputs = new Map<string, unknown>([["filter.v.availability.1", { available: true }]]);
    const out = resolveFacetSelection({ values: ["filter.v.availability.1", "forged"], priceMin: "10", priceMax: "20" }, inputs);
    expect(out).toEqual([{ available: true }, { price: { min: 10, max: 20 } }]);
  });
});

describe("buildShopQuery", () => {
  it("builds escaped Shopify search syntax", () => {
    const q = buildShopQuery({ values: ["type:Tops", 'type:Knit"wear', "availability:in"], priceMin: "100" });
    expect(q).toContain('product_type:"Tops"');
    expect(q).toContain('product_type:"Knit\\"wear"');
    expect(q).toContain("available_for_sale:true");
    expect(q).toContain("variants.price:>=100");
  });
  it("is empty without filters", () => {
    expect(buildShopQuery({ values: [] })).toBe("");
  });
});
