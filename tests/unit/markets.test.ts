import { describe, expect, it } from "vitest";
import { DEFAULT_MARKET, detectMarket, findMarket, localizePath, MARKETS, marketForCountry, marketFromAcceptLanguage, splitPath } from "@/config/markets";

describe("markets config", () => {
  it("has unique slugs and countries that match their slug suffix", () => {
    expect(new Set(MARKETS.map((m) => m.slug)).size).toBe(MARKETS.length);
    for (const m of MARKETS) expect(m.slug.endsWith(m.country.toLowerCase())).toBe(true);
  });
});

describe("detectMarket", () => {
  it("prefers the saved choice, then IP country, then browser language, then the default", () => {
    expect(detectMarket({ cookie: "en-gb", geoCountry: "US" }).slug).toBe("en-gb");
    expect(detectMarket({ cookie: "bogus", geoCountry: "us" }).slug).toBe("en-us");
    expect(detectMarket({ acceptLanguage: "fr-CA,fr;q=0.9,en;q=0.8" }).slug).toBe("en-ca");
    expect(detectMarket({ geoCountry: "BR", acceptLanguage: "pt-BR" })).toBe(DEFAULT_MARKET);
    expect(detectMarket({})).toBe(DEFAULT_MARKET);
  });
  it("matches countries and language regions case-insensitively", () => {
    expect(marketForCountry("sg")?.slug).toBe("en-sg");
    expect(marketForCountry(null)).toBeUndefined();
    expect(marketFromAcceptLanguage("en;q=0.8, en-AU")?.slug).toBe("en-au");
  });
});

describe("paths", () => {
  it("prefixes internal paths only", () => {
    expect(localizePath("en-us", "/shop")).toBe("/en-us/shop");
    expect(localizePath("en-us", "/")).toBe("/en-us");
    expect(localizePath("en-us", "https://x.com/a")).toBe("https://x.com/a");
    expect(localizePath("en-us", "?f=1")).toBe("?f=1");
    expect(localizePath("en-us", "mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("splits a prefixed path back into market and rest", () => {
    expect(splitPath("/en-gb/products/x")).toMatchObject({ rest: "/products/x", market: { slug: "en-gb" } });
    expect(splitPath("/en-gb").rest).toBe("/");
    expect(splitPath("/products/x")).toEqual({ rest: "/products/x" });
    expect(findMarket("nope")).toBeUndefined();
  });
});
