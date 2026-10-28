"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { CloseIcon } from "@/components/ui/icons";
import { localizePath, MARKETS, splitPath } from "@/config/markets";
import { useMarket } from "@/providers/market-provider";

/** Shows the current country/currency and lets the visitor switch market, staying on the same page. */
export function MarketSelector({ className = "" }: { className?: string }) {
  const market = useMarket();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { rest } = splitPath(pathname);

  return (
    <>
      <button type="button" className={`market-btn ${className}`} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {market.label} · {market.currency}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} side="right" label="Country and currency" className="market-dialog">
        <div className="drawer">
          <div className="drawer__head">
            <h2 className="label">Country / region</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <ul className="market-list drawer__scroll">
            {MARKETS.map((m) => (
              <li key={m.slug}>
                <NextLink
                  href={localizePath(m.slug, rest)}
                  hrefLang={m.locale}
                  lang={m.locale}
                  aria-current={m.slug === market.slug ? "true" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>{m.label}</span>
                  <span className="muted">{m.currency}</span>
                </NextLink>
              </li>
            ))}
          </ul>
          <p className="drawer__foot small muted">Prices, shipping and taxes are shown for your selected region.</p>
        </div>
      </Dialog>
    </>
  );
}
