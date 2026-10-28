"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { localizePath } from "@/config/markets";
import { useMarket } from "@/providers/market-provider";

/** Drop-in for next/link that keeps the visitor inside their market: "/shop" → "/en-us/shop". */
export default function Link({ href, onClick, ...rest }: ComponentProps<typeof NextLink>) {
  const { slug } = useMarket();
  const target = typeof href === "string" ? localizePath(slug, href) : href;
  return (
    <NextLink
      href={target}
      onClick={(e) => {
        onClick?.(e);
        // Lets <RouteProgress> show feedback for navigations to a different page.
        if (typeof target === "string" && target.startsWith("/") && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          if (target.split(/[?#]/)[0] !== window.location.pathname) window.dispatchEvent(new Event("route:start"));
        }
      }}
      {...rest}
    />
  );
}

/** Programmatic navigation inside the current market. */
export function useLocalRouter() {
  const router = useRouter();
  const { slug } = useMarket();
  return { push: (path: string) => router.push(localizePath(slug, path)) };
}
