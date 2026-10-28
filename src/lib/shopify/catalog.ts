import "server-only";
import { isShopifyConfigured } from "@/config/env";
import type { Ctx } from "@/config/markets";
import { shopifyFetch, withContext, ShopifyError } from "./client";
import { CARD_FRAGMENTS, FULL_FRAGMENTS, BASE_FRAGMENTS } from "./fragments";
import type {
  Article,
  Collection,
  FacetGroup,
  PageInfo,
  Product,
  ProductCard,
  ShopPage,
  SortId,
} from "./types";
import { resolveFacetSelection, type FacetSelection } from "./facets";

const TAG = { catalog: "catalog", collections: "collections", content: "content" } as const;

/** Runs a read; when Shopify is unconfigured or fails the page degrades to an empty state rather than crashing. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isShopifyConfigured()) return fallback;
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ShopifyError) {
      console.error(`[shopify] ${e.kind}: ${e.message}`);
      return fallback;
    }
    throw e;
  }
}

/* ------------------------------------------------------------------ products */

export async function getProduct(ctx: Ctx, handle: string): Promise<Product | null> {
  return safe(async () => {
    const data = await shopifyFetch<{ product: Product | null }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query Product($handle: String!) {
          product(handle: $handle) { ...ProductFullFields }
        }
        ${FULL_FRAGMENTS}
      `),
      variables: { handle },
      tags: [TAG.catalog, `product:${handle}`],
    });
    return data.product;
  }, null);
}

export async function getProductsByHandles(ctx: Ctx, handles: string[]): Promise<ProductCard[]> {
  const unique = [...new Set(handles)].slice(0, 50);
  if (unique.length === 0) return [];
  const results = await Promise.all(
    unique.map((handle) =>
      safe(async () => {
        const data = await shopifyFetch<{ product: ProductCard | null }>({
      ctx,
          query: withContext(/* GraphQL */ `
            query ProductCardByHandle($handle: String!) {
              product(handle: $handle) { ...ProductCardFields }
            }
            ${CARD_FRAGMENTS}
          `),
          variables: { handle },
          tags: [TAG.catalog, `product:${handle}`],
        });
        return data.product;
      }, null),
    ),
  );
  return results.filter((p): p is ProductCard => p !== null);
}

export async function getRecommendations(ctx: Ctx, productId: string): Promise<ProductCard[]> {
  return safe(async () => {
    const data = await shopifyFetch<{ productRecommendations: ProductCard[] | null }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query Recommendations($productId: ID!) {
          productRecommendations(productId: $productId) { ...ProductCardFields }
        }
        ${CARD_FRAGMENTS}
      `),
      variables: { productId },
      tags: [TAG.catalog],
    });
    return (data.productRecommendations ?? []).slice(0, 4);
  }, []);
}

/* ------------------------------------------------------------------ listing */

export type ListResult = {
  products: ProductCard[];
  pageInfo: PageInfo;
  facets: FacetGroup[];
  total?: number;
};

const EMPTY_LIST: ListResult = { products: [], pageInfo: { hasNextPage: false, endCursor: null }, facets: [] };

const COLLECTION_SORT: Record<SortId, { sortKey: string; reverse: boolean }> = {
  featured: { sortKey: "COLLECTION_DEFAULT", reverse: false },
  newest: { sortKey: "CREATED", reverse: true },
  "price-asc": { sortKey: "PRICE", reverse: false },
  "price-desc": { sortKey: "PRICE", reverse: true },
  "title-asc": { sortKey: "TITLE", reverse: false },
  "best-selling": { sortKey: "BEST_SELLING", reverse: false },
};

const ROOT_SORT: Record<SortId, { sortKey: string; reverse: boolean }> = {
  featured: { sortKey: "RELEVANCE", reverse: false },
  newest: { sortKey: "CREATED_AT", reverse: true },
  "price-asc": { sortKey: "PRICE", reverse: false },
  "price-desc": { sortKey: "PRICE", reverse: true },
  "title-asc": { sortKey: "TITLE", reverse: false },
  "best-selling": { sortKey: "BEST_SELLING", reverse: false },
};

type RawFilter = {
  id: string;
  label: string;
  type: "LIST" | "PRICE_RANGE" | "BOOLEAN";
  values: { id: string; label: string; count: number; input: string }[];
};

function toFacetGroups(filters: RawFilter[]): { groups: FacetGroup[]; inputs: Map<string, unknown> } {
  const inputs = new Map<string, unknown>();
  const groups: FacetGroup[] = filters.map((f) => {
    if (f.type === "PRICE_RANGE") return { id: f.id, label: f.label, kind: "price", values: [] };
    return {
      id: f.id,
      label: f.label,
      kind: "list",
      values: f.values.map((v) => {
        try {
          inputs.set(v.id, JSON.parse(v.input));
        } catch {
          /* ignore malformed filter input */
        }
        return { id: v.id, label: v.label, count: v.count };
      }),
    };
  });
  return { groups, inputs };
}

const COLLECTION_PRODUCTS = /* GraphQL */ `
  query CollectionProducts(
    $handle: String!
    $first: Int!
    $after: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) {
    collection(handle: $handle) {
      id handle title description descriptionHtml
      seo { title description }
      image { ...ImageFields }
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        nodes { ...ProductCardFields }
        pageInfo { hasNextPage endCursor }
        filters { id label type values { id label count input } }
      }
    }
  }
  ${CARD_FRAGMENTS}
`;

export type CollectionResult = ListResult & { collection: Collection };

export async function getCollection(
  ctx: Ctx,
  handle: string,
  opts: { sort?: SortId; after?: string | null; first?: number; selection?: FacetSelection } = {},
): Promise<CollectionResult | null> {
  const { sort = "featured", after = null, first = 24, selection } = opts;
  return safe(async () => {
    type Raw = {
      collection:
        | (Collection & {
            products: { nodes: ProductCard[]; pageInfo: PageInfo; filters: RawFilter[] };
          })
        | null;
    };
    const run = (filters?: unknown[], cursor: string | null = after) =>
      shopifyFetch<Raw>({
      ctx,
        query: withContext(COLLECTION_PRODUCTS),
        variables: { handle, first, after: cursor, ...COLLECTION_SORT[sort], filters },
        tags: [TAG.catalog, TAG.collections, `collection:${handle}`],
      });

    let filterInputs: unknown[] | undefined;
    if (selection && (selection.values.length > 0 || selection.priceMin || selection.priceMax)) {
      // Facet value ids are resolved to Shopify ProductFilter inputs from an unfiltered (cached) pass.
      const base = await run(undefined, null);
      if (!base.collection) return null;
      const { inputs } = toFacetGroups(base.collection.products.filters);
      filterInputs = resolveFacetSelection(selection, inputs);
    }

    const data = await run(filterInputs);
    if (!data.collection) return null;
    const { products, ...collection } = data.collection;
    return {
      collection,
      products: products.nodes,
      pageInfo: products.pageInfo,
      facets: toFacetGroups(products.filters).groups,
    };
  }, null);
}

const ROOT_PRODUCTS = /* GraphQL */ `
  query AllProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes { ...ProductCardFields }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${CARD_FRAGMENTS}
`;

/** Builds Shopify search syntax for the /shop facets. Values are quoted and escaped. */
export function buildShopQuery(selection: FacetSelection): string {
  const q = (s: string) => `"${s.replace(/["\\]/g, "\\$&")}"`;
  const parts: string[] = [];
  const types = selection.values.filter((v) => v.startsWith("type:")).map((v) => v.slice(5));
  if (types.length) parts.push(`(${types.map((t) => `product_type:${q(t)}`).join(" OR ")})`);
  if (selection.values.includes("availability:in")) parts.push("available_for_sale:true");
  const min = Number(selection.priceMin);
  const max = Number(selection.priceMax);
  if (selection.priceMin && Number.isFinite(min)) parts.push(`variants.price:>=${min}`);
  if (selection.priceMax && Number.isFinite(max)) parts.push(`variants.price:<=${max}`);
  return parts.join(" AND ");
}

export async function getAllProducts(
  ctx: Ctx,
  opts: { sort?: SortId; after?: string | null; first?: number; selection?: FacetSelection } = {},
): Promise<ListResult> {
  const { sort = "featured", after = null, first = 24, selection } = opts;
  return safe(async () => {
    const data = await shopifyFetch<{ products: { nodes: ProductCard[]; pageInfo: PageInfo } }>({
      ctx,
      query: withContext(ROOT_PRODUCTS),
      variables: {
        first,
        after,
        ...ROOT_SORT[sort],
        query: selection ? buildShopQuery(selection) || null : null,
      },
      tags: [TAG.catalog],
    });
    return { products: data.products.nodes, pageInfo: data.products.pageInfo, facets: await getShopFacets(ctx) };
  }, EMPTY_LIST);
}

/** Facets for /shop are derived from real store data (product types) plus availability and price. */
export async function getShopFacets(ctx: Ctx): Promise<FacetGroup[]> {
  return safe(async () => {
    const data = await shopifyFetch<{ productTypes: { nodes: string[] } }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query ProductTypes {
          productTypes(first: 50) { nodes }
        }
      `),
      tags: [TAG.catalog],
    });
    const groups: FacetGroup[] = [
      { id: "availability", label: "Availability", kind: "list", values: [{ id: "availability:in", label: "In stock" }] },
    ];
    const types = data.productTypes.nodes.filter(Boolean);
    if (types.length > 1) {
      groups.push({
        id: "type",
        label: "Category",
        kind: "list",
        values: types.map((t) => ({ id: `type:${t}`, label: t })),
      });
    }
    groups.push({ id: "price", label: "Price", kind: "price", values: [] });
    return groups;
  }, []);
}

export async function getCollections(ctx: Ctx, first = 20): Promise<Collection[]> {
  return safe(async () => {
    const data = await shopifyFetch<{ collections: { nodes: Collection[] } }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query Collections($first: Int!) {
          collections(first: $first, sortKey: TITLE) {
            nodes { id handle title description descriptionHtml seo { title description } image { ...ImageFields } }
          }
        }
        ${BASE_FRAGMENTS}
      `),
      variables: { first },
      tags: [TAG.collections],
    });
    return data.collections.nodes;
  }, []);
}

/* ------------------------------------------------------------------ search */

export async function searchProducts(
  ctx: Ctx,
  term: string,
  opts: { first?: number; after?: string | null } = {},
): Promise<{ products: ProductCard[]; pageInfo: PageInfo; total: number }> {
  const empty = { products: [], pageInfo: { hasNextPage: false, endCursor: null }, total: 0 };
  if (!term.trim()) return empty;
  return safe(async () => {
    const data = await shopifyFetch<{
      search: { nodes: (ProductCard | Record<string, never>)[]; pageInfo: PageInfo; totalCount: number };
    }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query Search($term: String!, $first: Int!, $after: String) {
          search(query: $term, first: $first, after: $after, types: [PRODUCT], prefix: LAST) {
            totalCount
            nodes { ... on Product { ...ProductCardFields } }
            pageInfo { hasNextPage endCursor }
          }
        }
        ${CARD_FRAGMENTS}
      `),
      variables: { term: term.trim().slice(0, 100), first: opts.first ?? 24, after: opts.after ?? null },
      revalidate: 60,
    });
    return {
      products: data.search.nodes.filter((n): n is ProductCard => "handle" in n),
      pageInfo: data.search.pageInfo,
      total: data.search.totalCount,
    };
  }, empty);
}

/* ------------------------------------------------------------------ content */

export async function getPage(ctx: Ctx, handle: string): Promise<ShopPage | null> {
  return safe(async () => {
    const data = await shopifyFetch<{ page: ShopPage | null }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query ShopPage($handle: String!) {
          page(handle: $handle) { id handle title body bodySummary }
        }
      `),
      variables: { handle },
      tags: [TAG.content, `page:${handle}`],
    });
    return data.page;
  }, null);
}

const POLICY_FIELD: Record<string, string> = {
  "privacy-policy": "privacyPolicy",
  "terms-of-service": "termsOfService",
  "refund-policy": "refundPolicy",
  shipping: "shippingPolicy",
};

/** Falls back to the legal policies configured in Shopify admin (Settings > Policies). */
export async function getShopPolicy(ctx: Ctx, handle: string): Promise<ShopPage | null> {
  const field = POLICY_FIELD[handle];
  if (!field) return null;
  return safe(async () => {
    const data = await shopifyFetch<{ shop: Record<string, { id: string; title: string; body: string; handle: string } | null> }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query ShopPolicies {
          shop {
            privacyPolicy { id title body handle }
            termsOfService { id title body handle }
            refundPolicy { id title body handle }
            shippingPolicy { id title body handle }
          }
        }
      `),
      tags: [TAG.content],
    });
    const policy = data.shop[field];
    return policy ? { id: policy.id, handle, title: policy.title, body: policy.body, bodySummary: "" } : null;
  }, null);
}

const ARTICLE_FIELDS = /* GraphQL */ `
  fragment ArticleFields on Article {
    id handle title excerpt contentHtml publishedAt tags
    image { ...ImageFields }
  }
`;

export async function getArticles(
  ctx: Ctx,
  blog: string,
  opts: { first?: number; after?: string | null } = {},
): Promise<{ articles: Article[]; pageInfo: PageInfo }> {
  const empty = { articles: [], pageInfo: { hasNextPage: false, endCursor: null } };
  return safe(async () => {
    const data = await shopifyFetch<{
      blog: { articles: { nodes: Article[]; pageInfo: PageInfo } } | null;
    }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query Articles($blog: String!, $first: Int!, $after: String) {
          blog(handle: $blog) {
            articles(first: $first, after: $after, sortKey: PUBLISHED_AT, reverse: true) {
              nodes { ...ArticleFields }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
        ${BASE_FRAGMENTS}
        ${ARTICLE_FIELDS}
      `),
      variables: { blog, first: opts.first ?? 12, after: opts.after ?? null },
      tags: [TAG.content, `blog:${blog}`],
    });
    if (!data.blog) return empty;
    return {
      articles: data.blog.articles.nodes,
      pageInfo: data.blog.articles.pageInfo,
    };
  }, empty);
}

export async function getArticle(ctx: Ctx, blog: string, slug: string): Promise<Article | null> {
  return safe(async () => {
    const data = await shopifyFetch<{
      blog: { articleByHandle: Article | null } | null;
    }>({
      ctx,
      query: withContext(/* GraphQL */ `
        query ArticleByHandle($blog: String!, $slug: String!) {
          blog(handle: $blog) {
            articleByHandle(handle: $slug) { ...ArticleFields seo { title description } }
          }
        }
        ${BASE_FRAGMENTS}
        ${ARTICLE_FIELDS}
      `),
      variables: { blog, slug },
      tags: [TAG.content, `blog:${blog}`],
    });
    return data.blog?.articleByHandle ?? null;
  }, null);
}

/* ------------------------------------------------------------------ sitemap */

export async function getSitemapHandles(): Promise<{ products: { handle: string; updatedAt: string }[]; collections: { handle: string; updatedAt: string }[] }> {
  const empty = { products: [], collections: [] };
  return safe(async () => {
    const pull = async (field: "products" | "collections") => {
      const out: { handle: string; updatedAt: string }[] = [];
      let after: string | null = null;
      for (let page = 0; page < 10; page++) {
        const data: Record<string, { nodes: { handle: string; updatedAt: string }[]; pageInfo: PageInfo }> = await shopifyFetch({
          query: `query Sitemap${field}($after: String) { ${field}(first: 250, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } } }`,
          variables: { after },
          revalidate: 3600,
          tags: [TAG.catalog],
        });
        out.push(...data[field].nodes);
        if (!data[field].pageInfo.hasNextPage) break;
        after = data[field].pageInfo.endCursor;
      }
      return out;
    };
    const [products, collections] = await Promise.all([pull("products"), pull("collections")]);
    return { products, collections };
  }, empty);
}
