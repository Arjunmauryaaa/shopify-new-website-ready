import "server-only";
import { NextResponse } from "next/server";
import { ctxOf, marketOrDefault } from "@/config/markets";

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite=Lax cookies). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser / same-origin GET-like requests
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

/**
 * Small in-memory fixed-window limiter. Adequate per server instance;
 * put a shared limiter (Upstash/Vercel Firewall) in front for multi-instance production.
 */
export function rateLimit(req: Request, key: string, limit: number, windowMs: number): boolean {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const id = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

/** Market chosen by the browsing page, sent by the client as `x-market` (validated against the configured list). */
export function marketCtx(req: Request) {
  return ctxOf(marketOrDefault(req.headers.get("x-market")));
}
