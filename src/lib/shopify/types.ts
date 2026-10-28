export type Money = { amount: string; currencyCode: string };

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type SelectedOption = { name: string; value: string };

export type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
  /** Present only when SHOPIFY_INVENTORY_ENABLED=true and the scope is granted. */
  quantityAvailable?: number | null;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  image: ShopifyImage | null;
};

export type ProductOption = { id?: string; name: string; values: string[] };

export type ProductCard = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  availableForSale: boolean;
  tags: string[];
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  featuredImage: ShopifyImage | null;
  images: { nodes: ShopifyImage[] };
  options: ProductOption[];
  variants: { nodes: { id: string; availableForSale: boolean }[] };
};

export type ProductVideo = {
  kind: "file" | "embed";
  sources: { url: string; mimeType: string }[];
  embedUrl?: string;
  poster: ShopifyImage | null;
  alt: string;
};

export type Product = Omit<ProductCard, "variants"> & {
  media: { nodes: RawMedia[] };
  description: string;
  descriptionHtml: string;
  seo: { title: string | null; description: string | null };
  images: { nodes: ShopifyImage[] };
  variants: { nodes: Variant[] };
  care: { value: string } | null;
  materials: { value: string } | null;
};

export type PageInfo = { hasNextPage: boolean; endCursor: string | null };

export type FacetValue = { id: string; label: string; count?: number };
export type FacetGroup = {
  id: string;
  label: string;
  kind: "list" | "price";
  values: FacetValue[];
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image: ShopifyImage | null;
  seo: { title: string | null; description: string | null };
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: {
    amountPerQuantity: Money;
    totalAmount: Money;
    compareAtAmountPerQuantity: Money | null;
  };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    selectedOptions: SelectedOption[];
    image: ShopifyImage | null;
    product: { handle: string; title: string };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note: string | null;
  buyerIdentity?: { countryCode: string | null };
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
  discountCodes: { code: string; applicable: boolean }[];
  lines: { nodes: CartLine[] };
};

export type Article = {
  id: string;
  handle: string;
  title: string;
  excerpt: string | null;
  contentHtml: string;
  publishedAt: string;
  tags: string[];
  image: ShopifyImage | null;
  seo?: { title: string | null; description: string | null };
};

export type ShopPage = {
  id: string;
  handle: string;
  title: string;
  body: string;
  bodySummary: string;
};

export type SortId = "featured" | "newest" | "price-asc" | "price-desc" | "title-asc" | "best-selling";

export type RawMedia = {
  mediaContentType: "IMAGE" | "VIDEO" | "EXTERNAL_VIDEO" | "MODEL_3D";
  alt: string | null;
  sources?: { url: string; mimeType: string }[];
  embedUrl?: string;
  previewImage?: ShopifyImage | null;
};

export function productVideos(product: { media?: { nodes: RawMedia[] } }): ProductVideo[] {
  return (product.media?.nodes ?? []).flatMap((m): ProductVideo[] => {
    if (m.mediaContentType === "VIDEO" && m.sources?.length) {
      return [{ kind: "file", sources: m.sources, poster: m.previewImage ?? null, alt: m.alt ?? "" }];
    }
    if (m.mediaContentType === "EXTERNAL_VIDEO" && m.embedUrl) {
      return [{ kind: "embed", sources: [], embedUrl: m.embedUrl, poster: m.previewImage ?? null, alt: m.alt ?? "" }];
    }
    return [];
  });
}
