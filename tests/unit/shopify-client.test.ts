import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/config/env";
import { ShopifyError, shopifyEndpoint, shopifyFetch, withContext } from "@/lib/shopify/client";

const setEnv = (vars: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetEnvCache();
};

beforeEach(() =>
  setEnv({
    SHOPIFY_STORE_DOMAIN: "shop.myshopify.com",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: "tok",
    SHOPIFY_STOREFRONT_TOKEN_TYPE: undefined,
    SHOPIFY_API_ORIGIN: undefined,
    SHOPIFY_API_VERSION: undefined,
  }),
);
afterEach(() => setEnv({ SHOPIFY_STORE_DOMAIN: undefined, SHOPIFY_STOREFRONT_ACCESS_TOKEN: undefined, SHOPIFY_API_ORIGIN: undefined }));

describe("withContext", () => {
  it("adds the country variable and @inContext directive", () => {
    expect(withContext("query A($h: String!) { x }")).toBe("query A($h: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) { x }");
    expect(withContext("query B { x }")).toBe("query B($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) { x }");
  });
});

describe("shopifyFetch", () => {
  it("targets the configured API version and sends the public token header", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { ok: true } })));
    await shopifyFetch({ query: "query A { x }" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://shop.myshopify.com/api/2026-07/graphql.json");
    expect((init!.headers as Record<string, string>)["X-Shopify-Storefront-Access-Token"]).toBe("tok");
  });

  it("uses the private token header when configured", async () => {
    setEnv({ SHOPIFY_STOREFRONT_TOKEN_TYPE: "private" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: {} })));
    await shopifyFetch({ query: "query A { x }" });
    expect((fetchMock.mock.calls[0][1]!.headers as Record<string, string>)["Shopify-Storefront-Private-Token"]).toBe("tok");
  });

  it("sends the buyer market as country + language variables", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: {} })));
    await shopifyFetch({ query: "query A { x }", ctx: { country: "DE", language: "EN" } });
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).variables).toMatchObject({ country: "DE", language: "EN" });
  });

  it("honours an origin override (tests / proxies)", () => {
    setEnv({ SHOPIFY_API_ORIGIN: "http://localhost:4010/" });
    expect(shopifyEndpoint()).toBe("http://localhost:4010/api/2026-07/graphql.json");
  });

  it("raises typed errors for GraphQL errors, HTTP failures and missing config", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ errors: [{ message: "bad" }] })));
    await expect(shopifyFetch({ query: "q" })).rejects.toMatchObject({ kind: "graphql", message: "bad" });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("no", { status: 503 }));
    await expect(shopifyFetch({ query: "q" })).rejects.toMatchObject({ kind: "http", status: 503 });
    setEnv({ SHOPIFY_STOREFRONT_ACCESS_TOKEN: undefined });
    await expect(shopifyFetch({ query: "q" })).rejects.toBeInstanceOf(ShopifyError);
  });

  it("does not cache cart operations", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: {} })));
    await shopifyFetch({ query: "q", revalidate: false });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });
});
