import type { Money } from "@/lib/shopify/types";

/* ---------- free-shipping progress ---------- */

/** Thresholds per currency, e.g. {"INR":5000,"USD":75}. Must mirror the real shipping rates in Shopify. */
export type Thresholds = Record<string, number>;

export function parseThresholds(raw: string | undefined): Thresholds {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([k, v]) => /^[A-Z]{3}$/.test(k) && typeof v === "number" && v > 0));
  } catch {
    return {};
  }
}

export type ShippingProgress = { threshold: Money; remaining: Money; unlocked: boolean; ratio: number };

/** Returns null when no threshold is configured for the cart's currency (the bar is then hidden). */
export function freeShippingProgress(subtotal: Money, thresholds: Thresholds): ShippingProgress | null {
  const limit = thresholds[subtotal.currencyCode];
  if (!limit) return null;
  const amount = Number(subtotal.amount);
  if (!Number.isFinite(amount)) return null;
  const remaining = Math.max(0, limit - amount);
  return {
    threshold: { amount: String(limit), currencyCode: subtotal.currencyCode },
    remaining: { amount: String(remaining), currencyCode: subtotal.currencyCode },
    unlocked: remaining === 0,
    ratio: Math.min(1, amount / limit),
  };
}

/* ---------- size guide / finder ---------- */

export type SizeRow = { size: string; /** measurement name → [min, max] */ ranges: Record<string, [number, number]> };
export type SizeGuide = { unit: "cm" | "in"; measurements: string[]; rows: SizeRow[]; note?: string };

/**
 * Finds the smallest size whose range contains every supplied measurement.
 * Between two sizes (a measurement falls in a gap) the larger size is suggested, as is conventional.
 */
export function recommendSize(guide: SizeGuide, input: Record<string, number>): { size: string; exact: boolean } | null {
  const given = Object.entries(input).filter(([, v]) => Number.isFinite(v) && v > 0);
  if (given.length === 0) return null;
  const fits = guide.rows.find((row) => given.every(([name, v]) => row.ranges[name] && v >= row.ranges[name][0] && v <= row.ranges[name][1]));
  if (fits) return { size: fits.size, exact: true };
  const larger = guide.rows.find((row) => given.every(([name, v]) => row.ranges[name] && v <= row.ranges[name][1]));
  return larger ? { size: larger.size, exact: false } : null;
}

/* ---------- stock ---------- */

/** Only shown when Shopify reports a real quantity at or below the threshold. */
export function lowStockCount(quantity: number | null | undefined, threshold: number): number | null {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return null;
  return quantity > 0 && quantity <= threshold ? quantity : null;
}

/* ---------- reviews ---------- */

export type Review = { id: string; rating: number; title: string; body: string; author: string; createdAt: string; verified: boolean };
export type ReviewSummary = { count: number; average: number; reviews: Review[] };

export function summarizeReviews(reviews: Review[]): ReviewSummary | null {
  const valid = reviews.filter((r) => r.rating >= 1 && r.rating <= 5);
  if (valid.length === 0) return null;
  const average = valid.reduce((s, r) => s + r.rating, 0) / valid.length;
  return { count: valid.length, average: Math.round(average * 10) / 10, reviews: valid };
}

/* ---------- misc ---------- */

export function numericId(gid: string): string | null {
  return /\/(\d+)(?:\?.*)?$/.exec(gid)?.[1] ?? null;
}
