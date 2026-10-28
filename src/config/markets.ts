/**
 * Selling markets. MUST mirror Shopify admin → Settings → Markets (countries) and → Languages.
 * Prices, currency, availability, duties and translated product/blog/page content come from Shopify for the
 * market's `country` + `language`; a country/language Shopify doesn't serve falls back to the store default.
 * `slug` is the URL prefix: /<slug>/products/...
 *
 * UI chrome (buttons, labels) is English until a dictionary is added for the language — only add
 * non-English `language` markets once that is done and the content is translated in Shopify.
 */
export type Market = {
  slug: string;
  /** ISO 3166-1 alpha-2, Shopify CountryCode */
  country: string;
  /** Shopify LanguageCode (upper-case) */
  language: string;
  /** BCP-47 locale for number/date formatting and hreflang */
  locale: string;
  label: string;
  /** Display only — actual currency is whatever Shopify Markets returns. */
  currency: string;
  dir?: "ltr" | "rtl";
};

export const MARKETS: readonly Market[] = [
  { slug: "en-in", country: "IN", language: "EN", locale: "en-IN", label: "India", currency: "INR" },
  { slug: "en-us", country: "US", language: "EN", locale: "en-US", label: "United States", currency: "USD" },
  { slug: "en-gb", country: "GB", language: "EN", locale: "en-GB", label: "United Kingdom", currency: "GBP" },
  { slug: "en-ae", country: "AE", language: "EN", locale: "en-AE", label: "United Arab Emirates", currency: "AED" },
  { slug: "en-au", country: "AU", language: "EN", locale: "en-AU", label: "Australia", currency: "AUD" },
  { slug: "en-ca", country: "CA", language: "EN", locale: "en-CA", label: "Canada", currency: "CAD" },
  { slug: "en-sg", country: "SG", language: "EN", locale: "en-SG", label: "Singapore", currency: "SGD" },
  { slug: "en-de", country: "DE", language: "EN", locale: "en-DE", label: "Germany", currency: "EUR" },
];

const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_MARKET;
export const DEFAULT_MARKET: Market = MARKETS.find((m) => m.slug === fromEnv) ?? MARKETS[0];

export const MARKET_COOKIE = "market";

export const findMarket = (slug: string | undefined | null): Market | undefined => MARKETS.find((m) => m.slug === slug);
export const marketOrDefault = (slug: string | undefined | null): Market => findMarket(slug) ?? DEFAULT_MARKET;

/** Context sent to Shopify as `@inContext(country, language)`. */
export type Ctx = { country: string; language: string };
export const ctxOf = (m: Market): Ctx => ({ country: m.country, language: m.language });

export function marketForCountry(country: string | null | undefined): Market | undefined {
  if (!country) return undefined;
  const cc = country.toUpperCase();
  return MARKETS.find((m) => m.country === cc);
}

/** Picks the first market whose region matches the visitor's Accept-Language region tags. */
export function marketFromAcceptLanguage(header: string | null | undefined): Market | undefined {
  if (!header) return undefined;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim();
    const region = tag.split("-")[1];
    const hit = region && marketForCountry(region);
    if (hit) return hit;
  }
  return undefined;
}

export type DetectInput = { cookie?: string | null; geoCountry?: string | null; acceptLanguage?: string | null };

/** Order: explicit choice (cookie) → IP country → browser language region → default. */
export function detectMarket({ cookie, geoCountry, acceptLanguage }: DetectInput): Market {
  return findMarket(cookie) ?? marketForCountry(geoCountry) ?? marketFromAcceptLanguage(acceptLanguage) ?? DEFAULT_MARKET;
}

/** "/en-us/shop" → { market: en-us, rest: "/shop" } ; no prefix → market undefined. */
export function splitPath(pathname: string): { market?: Market; rest: string } {
  const [, first = "", ...tail] = pathname.split("/");
  const market = findMarket(first);
  if (!market) return { rest: pathname || "/" };
  return { market, rest: `/${tail.join("/")}` };
}

export function localizePath(slug: string, path: string): string {
  if (/^(https?:|mailto:|tel:|#|\?)/.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/" ? `/${slug}` : `/${slug}${p}`;
}
