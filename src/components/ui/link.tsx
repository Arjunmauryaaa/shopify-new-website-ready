"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { localizePath } from "@/config/markets";
import { useMarket } from "@/providers/market-provider";

/** Drop-in for next/link that keeps the visitor inside their market: "/shop" → "/en-us/shop". */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const { slug } = useMarket();
  return <NextLink href={typeof href === "string" ? localizePath(slug, href) : href} {...rest} />;
}

/** Programmatic navigation inside the current market. */
export function useLocalRouter() {
  const router = useRouter();
  const { slug } = useMarket();
  return { push: (path: string) => router.push(localizePath(slug, path)) };
}
