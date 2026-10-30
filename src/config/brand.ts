/**
 * Central brand + editorial configuration.
 * Everything here is content, not commerce: products, prices, variants and cart data always come from Shopify.
 * Image `src` values left undefined render an explicit development placeholder (never stock photography).
 * Drop campaign files into /public/campaign and reference them as "/campaign/<file>".
 */

export type NavItem = { label: string; href: string };

export type Hotspot = {
  /** position inside the image, percent */
  x: number;
  y: number;
  /** Shopify product handle */
  handle: string;
};

export type CampaignImage = {
  src?: string;
  alt: string;
  /** CSS object-position, e.g. "50% 20%" */
  position?: string;
};

export type EditorialPanel = {
  eyebrow: string;
  caption: string;
  href: string;
  image: CampaignImage;
  /** CSS aspect ratio */
  ratio: string;
};

import { demoOverrides } from "./demo";

const name = process.env.NEXT_PUBLIC_BRAND_NAME || "EAST SIDE";

const base = {
  name,
  tagline: "",
  description: `${name} — a considered collection, photographed and presented with restraint.`,
  locale: "en-IN",

  nav: {
    left: [
      { label: "Shop", href: "/shop" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Journal", href: "/journal" },
    ] satisfies NavItem[],
    right: [{ label: "About", href: "/about" }] satisfies NavItem[],
    mobile: [
      { label: "Shop", href: "/shop" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Journal", href: "/journal" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Account", href: "/account" },
    ] satisfies NavItem[],
  },

  home: {
    /** Header text colour while overlaying the hero: use "light" for dark campaign photography. */
    heroTone: "dark" as "dark" | "light",
    /** Caption colour on the hero photos: "dark" for light imagery, "light" for dark imagery. */
    captionTone: "light" as "dark" | "light",
    hero: {
      main: {
        image: { alt: "Campaign — main image", position: "50% 30%" } as CampaignImage,
        eyebrow: "The Collection",
        caption: "Campaign — look one",
        href: "/shop",
        linkLabel: "Shop the collection",
      },
      secondary: {
        image: { alt: "Campaign — editorial crop", position: "50% 40%" } as CampaignImage,
        caption: "Campaign — detail",
        href: "/collections/new-arrivals",
      },
      /** Desktop column proportions (main : secondary) */
      columns: "2fr 1fr",
    },
    panels: [
      {
        eyebrow: "Collection",
        caption: "The new season",
        href: "/collections/new-arrivals",
        image: { alt: "Editorial panel — new season", position: "50% 30%" },
        ratio: "4 / 5",
      },
      {
        eyebrow: "Edit",
        caption: "Essentials",
        href: "/shop",
        image: { alt: "Editorial panel — essentials", position: "50% 50%" },
        ratio: "3 / 4",
      },
    ] satisfies EditorialPanel[],
    newArrivals: { collection: "new-arrivals", title: "New Arrivals", count: 4 },
    story: {
      eyebrow: "Campaign",
      headline: "Made to be lived in.",
      body: "A short note about the season. Replace this copy in src/config/brand.ts.",
      href: "/about",
      linkLabel: "Read the story",
      image: { alt: "Campaign story", position: "50% 40%" } as CampaignImage,
    },
    featured: {
      collection: "featured",
      eyebrow: "Featured collection",
      title: "The Edit",
      body: "A curated selection from the collection.",
      image: { alt: "Featured collection", position: "50% 40%" } as CampaignImage,
    },
    statement: "Little pieces for the moments that become everything.",
    journal: { blog: "journal", title: "Journal", count: 3 },
  },

  footer: {
    shop: [
      { label: "All products", href: "/shop" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Wishlist", href: "/wishlist" },
    ] satisfies NavItem[],
    service: [
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/pages/shipping" },
      { label: "Returns & exchanges", href: "/pages/returns" },
      { label: "FAQ", href: "/pages/faq" },
    ] satisfies NavItem[],
    about: [
      { label: "About", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "The Atelier", href: "/atelier" },
    ] satisfies NavItem[],
    legal: [
      { label: "Privacy policy", href: "/pages/privacy-policy" },
      { label: "Terms of service", href: "/pages/terms-of-service" },
      { label: "Refund policy", href: "/pages/refund-policy" },
    ] satisfies NavItem[],
    /** Only configured networks render. */
    social: [] as NavItem[],
  },

  support: {
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
    hours: "",
    address: "",
  },

  /**
   * Conversion features. Everything here is optional and hidden until configured; values must match the
   * real shop settings (shipping rates, policies, payment methods).
   */
  commerce: {
    /** e.g. NEXT_PUBLIC_FREE_SHIPPING_THRESHOLDS='{"INR":5000,"USD":75}' */
    freeShippingEnv: process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLDS,
    /** Real payment methods enabled in Shopify, shown as text near checkout. */
    paymentMethods: (process.env.NEXT_PUBLIC_PAYMENT_METHODS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    /** One-line promises that must be true, e.g. "Free returns within 14 days". */
    promises: [] as string[],
    deliveryEstimate: process.env.NEXT_PUBLIC_DELIVERY_ESTIMATE ?? "",
    /** Variant id of a "Gift wrap" product in Shopify; hides the option when empty. */
    giftWrapVariantId: process.env.NEXT_PUBLIC_GIFT_WRAP_VARIANT_ID ?? "",
    lowStockThreshold: 5,
    /** Size chart; empty rows hide the size guide. Fill in your real measurements. */
    sizeGuide: { unit: "cm", measurements: ["Chest", "Waist"], rows: [] } as import("@/lib/commerce").SizeGuide,
  },

  /** "Shop the look": tap hotspots on a campaign image to see and buy the products in it. Hidden until configured. */
  shopTheLook: {
    title: "Shop the look",
    image: { alt: "Shop the look", position: "50% 30%" } as CampaignImage,
    hotspots: [] as Hotspot[],
  },

  /** Hand-picked social posts (real Instagram/TikTok URLs + your own images). Hidden when empty. */
  socialFeed: {
    title: "On Instagram",
    handle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "",
    posts: [] as { image: string; href: string; alt: string }[],
  },

  /** Private client list with early access to new drops. */
  atelier: {
    title: "The Atelier",
    lede: "Early access to new collections, private previews and first call on limited pieces.",
  },

  /** Informational, shown on product pages. Leave empty to hide. Must reflect real policy. */
  productInfo: {
    shipping: "",
    returns: "",
  },
} as const;

export type Brand = typeof base;

function merge<T>(target: T, patch: unknown): T {
  if (Array.isArray(patch) || typeof patch !== "object" || patch === null) return (patch ?? target) as T;
  const out: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    const cur = out[k];
    out[k] = cur && typeof cur === "object" && !Array.isArray(cur) && v && typeof v === "object" && !Array.isArray(v) ? merge(cur, v) : v;
  }
  return out as T;
}

/** Real configuration, or the sample content when NEXT_PUBLIC_DEMO=true. */
export const brand: Brand = process.env.NEXT_PUBLIC_DEMO === "true" ? merge(base, demoOverrides) : base;
