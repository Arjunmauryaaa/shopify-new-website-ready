import { z } from "zod";

const serverSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z.string().min(1).optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1).optional(),
  SHOPIFY_STOREFRONT_TOKEN_TYPE: z.enum(["public", "private"]).default("public"),
  /** Override of https://<store domain>. Only for tests or a reverse proxy; leave unset in production. */
  SHOPIFY_API_ORIGIN: z.string().url().optional(),
  SHOPIFY_API_VERSION: z.string().regex(/^\d{4}-\d{2}$/).default("2026-07"),
  SHOPIFY_DEFAULT_COUNTRY: z.string().length(2).default("IN"),
  SHOPIFY_CUSTOMER_ACCOUNT_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().min(16).optional(),
  KLAVIYO_PRIVATE_API_KEY: z.string().optional(),
  KLAVIYO_LIST_ID: z.string().optional(),
  KLAVIYO_ATELIER_LIST_ID: z.string().optional(),
  JUDGEME_API_TOKEN: z.string().optional(),
  JUDGEME_SHOP_DOMAIN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CONTACT_TO_EMAIL: z.string().email().optional(),
  CONTACT_FROM_EMAIL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Empty strings in .env files are treated as "unset". */
function clean(source: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(source).filter(([, v]) => v !== undefined && v !== ""));
}

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(clean(process.env));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper. */
export function resetEnvCache() {
  cached = null;
}

export function isShopifyConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}

/** Names of required production variables that are currently missing. */
export function missingProductionConfig(): string[] {
  const env = getEnv();
  const missing: string[] = [];
  if (!env.SHOPIFY_STORE_DOMAIN) missing.push("SHOPIFY_STORE_DOMAIN");
  if (!env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) missing.push("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  if (process.env.NEXT_PUBLIC_SITE_URL === undefined) missing.push("NEXT_PUBLIC_SITE_URL");
  return missing;
}
