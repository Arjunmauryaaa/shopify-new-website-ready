import { describe, expect, it } from "vitest";
import { formatMoney, isOnSale, productPriceDisplay } from "@/lib/format";

const m = (amount: string, currencyCode = "INR") => ({ amount, currencyCode });

describe("formatMoney", () => {
  it("uses the currency returned by Shopify", () => {
    expect(formatMoney(m("4500.0"), "en-IN")).toBe("₹4,500");
    expect(formatMoney(m("49.5", "USD"), "en-US")).toBe("$49.50");
  });
  it("formats the same Shopify money per market locale", () => {
    expect(formatMoney(m("1234.5", "EUR"), "de-DE").replace(/\s/g, " ")).toBe("1.234,50 €");
    expect(formatMoney(m("1234.5", "EUR"), "en-IE")).toBe("€1,234.50");
    expect(formatMoney(m("2000", "AED"), "en-AE")).toContain("2,000");
  });
  it("returns an empty string for missing or invalid amounts", () => {
    expect(formatMoney(null, "en-IN")).toBe("");
    expect(formatMoney(m("abc"), "en-IN")).toBe("");
  });
});

describe("productPriceDisplay", () => {
  const base = {
    priceRange: { minVariantPrice: m("4500"), maxVariantPrice: m("4800") },
    compareAtPriceRange: { minVariantPrice: m("0"), maxVariantPrice: m("0") },
  };
  it("flags a range and omits compare-at when none is set", () => {
    const d = productPriceDisplay(base, "en-IN");
    expect(d.isRange).toBe(true);
    expect(d.compareAt).toBeNull();
  });
  it("shows compare-at only when it is higher than the price", () => {
    expect(productPriceDisplay({ ...base, compareAtPriceRange: { minVariantPrice: m("5200"), maxVariantPrice: m("5200") } }, "en-IN").compareAt).not.toBeNull();
    expect(productPriceDisplay({ ...base, compareAtPriceRange: { minVariantPrice: m("4000"), maxVariantPrice: m("4000") } }, "en-IN").compareAt).toBeNull();
  });
});

describe("isOnSale", () => {
  it("requires a strictly higher compare-at price", () => {
    expect(isOnSale(m("100"), m("100"))).toBe(false);
    expect(isOnSale(m("120"), m("100"))).toBe(true);
    expect(isOnSale(null, m("100"))).toBe(false);
  });
});
