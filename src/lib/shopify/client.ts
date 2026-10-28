import "server-only";
import { getEnv, isShopifyConfigured } from "@/config/env";
import type { Ctx } from "@/config/markets";

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly kind: "not-configured" | "http" | "graphql" | "network",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

type FetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
  /** Seconds. `false` disables caching (used for carts). */
  revalidate?: number | false;
  tags?: string[];
  /** Buyer market (country + language). Defaults to the configured default country / EN. */
  ctx?: Ctx;
};

export function shopifyEndpoint(): string {
  const env = getEnv();
  const domain = (env.SHOPIFY_STORE_DOMAIN ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const origin = env.SHOPIFY_API_ORIGIN?.replace(/\/$/, "") ?? `https://${domain}`;
  return `${origin}/api/${env.SHOPIFY_API_VERSION}/graphql.json`;
}

/**
 * Executes a Storefront API GraphQL operation. Server-only: the token never reaches the browser.
 * Every operation is wrapped in `@inContext(country: $country)` by `withContext` so prices follow the buyer market.
 */
export async function shopifyFetch<T>({ query, variables, revalidate = 300, tags, ctx }: FetchOptions): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new ShopifyError("Shopify is not configured (SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN).", "not-configured");
  }
  const env = getEnv();
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (env.SHOPIFY_STOREFRONT_TOKEN_TYPE === "private") {
    headers["Shopify-Storefront-Private-Token"] = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
  }

  let res: Response;
  try {
    res = await fetch(shopifyEndpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: { country: ctx?.country ?? env.SHOPIFY_DEFAULT_COUNTRY, language: ctx?.language ?? "EN", ...variables } }),
      ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate, tags } }),
    });
  } catch (e) {
    throw new ShopifyError(`Could not reach Shopify: ${(e as Error).message}`, "network");
  }

  if (!res.ok) throw new ShopifyError(`Shopify responded with HTTP ${res.status}`, "http", res.status);

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new ShopifyError(json.errors.map((e) => e.message).join("; "), "graphql");
  }
  if (!json.data) throw new ShopifyError("Shopify returned an empty response.", "graphql");
  return json.data;
}

/** Adds the `$country`/`$language` variables and `@inContext` directive to a single operation string. */
export function withContext(operation: string): string {
  return operation.replace(
    /(query|mutation)\s+(\w+)\s*(\(([^)]*)\))?\s*\{/,
    (_m, kind: string, name: string, _p: string | undefined, vars: string | undefined) =>
      `${kind} ${name}(${vars ? `${vars}, ` : ""}$country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {`,
  );
}
