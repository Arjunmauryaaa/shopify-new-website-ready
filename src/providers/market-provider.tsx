"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Market } from "@/config/markets";

const MarketContext = createContext<Market | null>(null);

export function MarketProvider({ market, children }: { market: Market; children: ReactNode }) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

export function useMarket(): Market {
  const m = useContext(MarketContext);
  if (!m) throw new Error("useMarket must be used inside <MarketProvider>");
  return m;
}
