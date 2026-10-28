/**
 * Client-side event layer. Events are forwarded only to the tools that are configured AND loaded
 * (scripts load only after the visitor consents), so every call here is a safe no-op otherwise.
 */

export type Consent = "granted" | "denied" | null;
export const CONSENT_KEY = "consent:v1";
export const CONSENT_EVENT = "consent-change";

export const analyticsConfig = {
  ga4: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  meta: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  klaviyo: process.env.NEXT_PUBLIC_KLAVIYO_COMPANY_ID ?? "",
  googleAds: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "",
};

export const analyticsEnabled = () => Object.values(analyticsConfig).some(Boolean);

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: Exclude<Consent, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable: choice applies to this page view only */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

type Win = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  _learnq?: unknown[];
};

export type TrackItem = { id: string; name: string; price: number; currency: string; variant?: string; quantity?: number };

const toGa = (items: TrackItem[]) =>
  items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1, item_variant: i.variant }));

export type TrackEvent =
  | { name: "view_item"; items: TrackItem[] }
  | { name: "add_to_cart"; items: TrackItem[] }
  | { name: "begin_checkout"; items: TrackItem[]; value: number; currency: string }
  | { name: "search"; term: string }
  | { name: "page_view"; path: string };

export function track(event: TrackEvent) {
  if (typeof window === "undefined" || readConsent() !== "granted") return;
  const w = window as Win;
  const value = "items" in event ? event.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0) : 0;
  const currency = "items" in event ? (event.items[0]?.currency ?? "") : "";

  try {
    switch (event.name) {
      case "view_item":
        w.gtag?.("event", "view_item", { currency, value, items: toGa(event.items) });
        w.fbq?.("track", "ViewContent", { content_ids: event.items.map((i) => i.id), content_type: "product", value, currency });
        w._learnq?.push(["track", "Viewed Product", { ProductID: event.items[0]?.id, ProductName: event.items[0]?.name, Price: event.items[0]?.price }]);
        break;
      case "add_to_cart":
        w.gtag?.("event", "add_to_cart", { currency, value, items: toGa(event.items) });
        w.fbq?.("track", "AddToCart", { content_ids: event.items.map((i) => i.id), content_type: "product", value, currency });
        w._learnq?.push(["track", "Added to Cart", { ProductID: event.items[0]?.id, ProductName: event.items[0]?.name, Price: event.items[0]?.price, Quantity: event.items[0]?.quantity ?? 1 }]);
        break;
      case "begin_checkout":
        w.gtag?.("event", "begin_checkout", { currency: event.currency, value: event.value, items: toGa(event.items) });
        w.fbq?.("track", "InitiateCheckout", { value: event.value, currency: event.currency, num_items: event.items.length });
        w._learnq?.push(["track", "Started Checkout", { value: event.value, currency: event.currency }]);
        break;
      case "search":
        w.gtag?.("event", "search", { search_term: event.term });
        w.fbq?.("track", "Search", { search_string: event.term });
        break;
      case "page_view":
        w.gtag?.("event", "page_view", { page_path: event.path });
        w.fbq?.("track", "PageView");
        break;
    }
  } catch {
    /* analytics must never break shopping */
  }
}
