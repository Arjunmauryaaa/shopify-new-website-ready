import { NextResponse, type NextRequest } from "next/server";
import { detectMarket, findMarket, MARKET_COOKIE } from "@/config/markets";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Every storefront URL carries its market (/en-us/...). Un-prefixed requests are redirected to the
 * best market: saved choice → IP country (Vercel/Cloudflare geo headers) → Accept-Language → default.
 * The chosen market is persisted in a cookie so the choice survives across visits.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];
  const current = findMarket(first);

  if (current) {
    const res = NextResponse.next();
    if (request.cookies.get(MARKET_COOKIE)?.value !== current.slug) {
      res.cookies.set(MARKET_COOKIE, current.slug, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
    }
    return res;
  }

  const market = detectMarket({
    cookie: request.cookies.get(MARKET_COOKIE)?.value,
    geoCountry: request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"),
    acceptLanguage: request.headers.get("accept-language"),
  });
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${market.slug}` : `/${market.slug}${pathname}`;
  url.search = search;
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Vary", "Cookie, Accept-Language");
  return res;
}

export const config = {
  // Skip API routes, Next internals, and any path with a file extension (images, robots.txt, sitemap.xml, favicon).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
