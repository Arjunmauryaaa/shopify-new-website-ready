"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "wishlist:v1";

type WishlistValue = {
  handles: string[];
  ready: boolean;
  has: (handle: string) => boolean;
  toggle: (handle: string) => void;
  remove: (handle: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}

function read(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((h): h is string => typeof h === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

/** Guest wishlist: product handles only (non-sensitive), persisted in this browser's localStorage. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [handles, setHandles] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage after mount
    setHandles(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setHandles(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: string[]) => {
    setHandles(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the in-memory list still works for this session */
    }
  }, []);

  const value = useMemo<WishlistValue>(
    () => ({
      handles,
      ready,
      has: (h) => handles.includes(h),
      toggle: (h) => persist(handles.includes(h) ? handles.filter((x) => x !== h) : [h, ...handles]),
      remove: (h) => persist(handles.filter((x) => x !== h)),
    }),
    [handles, ready, persist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
