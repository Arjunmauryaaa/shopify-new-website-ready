import { describe, expect, it } from "vitest";
import { freeShippingProgress, lowStockCount, numericId, parseThresholds, recommendSize, summarizeReviews, type SizeGuide } from "@/lib/commerce";
import { productVideos } from "@/lib/shopify/types";

const money = (amount: string, currencyCode = "INR") => ({ amount, currencyCode });

describe("free shipping progress", () => {
  const thresholds = parseThresholds('{"INR":5000,"USD":75,"bad":1,"EUR":"x"}');
  it("parses only valid currency thresholds and survives garbage", () => {
    expect(thresholds).toEqual({ INR: 5000, USD: 75 });
    expect(parseThresholds("not json")).toEqual({});
    expect(parseThresholds(undefined)).toEqual({});
  });
  it("reports remaining spend and unlock state from the real subtotal", () => {
    expect(freeShippingProgress(money("3800"), thresholds)).toMatchObject({ unlocked: false, remaining: { amount: "1200" }, ratio: 0.76 });
    expect(freeShippingProgress(money("5000"), thresholds)).toMatchObject({ unlocked: true, ratio: 1 });
    expect(freeShippingProgress(money("9000"), thresholds)?.remaining.amount).toBe("0");
  });
  it("is hidden when no threshold exists for the cart currency", () => {
    expect(freeShippingProgress(money("100", "GBP"), thresholds)).toBeNull();
  });
});

describe("size recommendation", () => {
  const guide: SizeGuide = {
    unit: "cm",
    measurements: ["Chest", "Waist"],
    rows: [
      { size: "S", ranges: { Chest: [86, 91], Waist: [70, 75] } },
      { size: "M", ranges: { Chest: [92, 98], Waist: [76, 82] } },
      { size: "L", ranges: { Chest: [99, 106], Waist: [83, 90] } },
    ],
  };
  it("matches the size whose ranges contain every measurement", () => {
    expect(recommendSize(guide, { Chest: 95 })).toEqual({ size: "M", exact: true });
    expect(recommendSize(guide, { Chest: 95, Waist: 80 })).toEqual({ size: "M", exact: true });
  });
  it("rounds up when measurements fall between sizes or disagree", () => {
    expect(recommendSize(guide, { Chest: 91.5 })).toEqual({ size: "M", exact: false });
    expect(recommendSize(guide, { Chest: 88, Waist: 80 })).toEqual({ size: "M", exact: false });
  });
  it("declines when out of range or empty", () => {
    expect(recommendSize(guide, { Chest: 140 })).toBeNull();
    expect(recommendSize(guide, {})).toBeNull();
    expect(recommendSize(guide, { Chest: NaN })).toBeNull();
  });
});

describe("low stock", () => {
  it("only reports real quantities at or under the threshold", () => {
    expect(lowStockCount(3, 5)).toBe(3);
    expect(lowStockCount(5, 5)).toBe(5);
    expect(lowStockCount(6, 5)).toBeNull();
    expect(lowStockCount(0, 5)).toBeNull();
    expect(lowStockCount(undefined, 5)).toBeNull();
    expect(lowStockCount(null, 5)).toBeNull();
  });
});

describe("reviews summary", () => {
  const r = (rating: number, id = String(rating)) => ({ id, rating, title: "", body: "", author: "A", createdAt: "2026-01-01", verified: false });
  it("averages real ratings and drops invalid ones", () => {
    expect(summarizeReviews([r(5, "a"), r(4, "b"), r(4, "c"), r(0, "d"), r(9, "e")])).toMatchObject({ count: 3, average: 4.3 });
  });
  it("returns null when there are no valid reviews (nothing is invented)", () => {
    expect(summarizeReviews([])).toBeNull();
    expect(summarizeReviews([r(0)])).toBeNull();
  });
});

describe("helpers", () => {
  it("extracts numeric ids from gids", () => {
    expect(numericId("gid://shopify/Product/123")).toBe("123");
    expect(numericId("gid://shopify/Cart/abc?key=1")).toBeNull();
  });
  it("maps product media to playable videos only", () => {
    const videos = productVideos({
      media: {
        nodes: [
          { mediaContentType: "IMAGE", alt: null },
          { mediaContentType: "VIDEO", alt: "v", sources: [{ url: "https://cdn/v.mp4", mimeType: "video/mp4" }], previewImage: null },
          { mediaContentType: "EXTERNAL_VIDEO", alt: null, embedUrl: "https://youtube.com/embed/x", previewImage: null },
          { mediaContentType: "VIDEO", alt: null, sources: [] },
        ],
      },
    });
    expect(videos.map((v) => v.kind)).toEqual(["file", "embed"]);
  });
});
