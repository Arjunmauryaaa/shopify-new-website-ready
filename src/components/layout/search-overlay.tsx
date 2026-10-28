"use client";

import Link, { useLocalRouter } from "@/components/ui/link";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { CloseIcon } from "@/components/ui/icons";
import { ShopifyMedia } from "@/components/ui/media";
import { productPriceDisplay } from "@/lib/format";
import type { ProductCard } from "@/lib/shopify/types";
import { track } from "@/lib/analytics";
import { useMarket } from "@/providers/market-provider";
import { useUI } from "@/providers/ui-provider";

type State = { status: "idle" | "loading" | "done" | "error"; products: ProductCard[]; total: number };

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI();
  return (
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} side="top" label="Search" className="search-dialog">
      <SearchPanel onClose={() => setSearchOpen(false)} />
    </Dialog>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useLocalRouter();
  const { locale, slug } = useMarket();
  const [term, setTerm] = useState("");
  const [state, setState] = useState<State>({ status: "idle", products: [], total: 0 });
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset results when the query is cleared
      setState({ status: "idle", products: [], total: 0 });
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal, headers: { "x-market": slug } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("search failed"))))
        .then((data: { products: ProductCard[]; total: number }) => {
          setState({ status: "done", products: data.products, total: data.total });
          setActive(-1);
        })
        .catch((e: Error) => e.name !== "AbortError" && setState({ status: "error", products: [], total: 0 }));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, slug]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = term.trim();
    if (!q) return;
    track({ name: "search", term: q });
    if (active >= 0 && state.products[active]) router.push(`/products/${state.products[active].handle}`);
    else router.push(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      // <input type="search"> would otherwise just clear itself on Escape.
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, state.products.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    }
  };

  return (
    <div className="search">
      <form className="search__form" role="search" onSubmit={submit}>
        <label htmlFor="site-search" className="visually-hidden">Search products</label>
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          autoComplete="off"
          placeholder="Search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={state.products.length > 0}
          aria-controls="search-results"
          aria-activedescendant={active >= 0 ? `search-opt-${active}` : undefined}
        />
        <button type="button" className="icon-btn" aria-label="Close search" onClick={onClose}>
          <CloseIcon />
        </button>
      </form>

      <div className="search__body" aria-live="polite">
        {state.status === "loading" && <p className="muted">Searching…</p>}
        {state.status === "error" && <p className="form-error">Search is unavailable right now. Please try again.</p>}
        {state.status === "done" && state.products.length === 0 && (
          <p className="muted">
            No results for “{term.trim()}”. Try a different term or <Link href="/shop" onClick={onClose}>browse all products</Link>.
          </p>
        )}
        {state.products.length > 0 && (
          <>
            <ul id="search-results" role="listbox" className="search__list">
              {state.products.map((p, i) => (
                <li key={p.id} id={`search-opt-${i}`} role="option" aria-selected={i === active}>
                  <Link href={`/products/${p.handle}`} onClick={onClose} className={i === active ? "is-active" : undefined}>
                    <ShopifyMedia image={p.featuredImage} ratio="4 / 5" sizes="72px" alt="" className="search__thumb" />
                    <span className="search__title">{p.title}</span>
                    <span className="search__price">{productPriceDisplay(p, locale).price}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/search?q=${encodeURIComponent(term.trim())}`} className="text-link" onClick={onClose}>
              View all {state.total} results
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
