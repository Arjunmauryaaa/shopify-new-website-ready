"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type UIValue = {
  searchOpen: boolean;
  menuOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
};

const UIContext = createContext<UIValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const value = useMemo(() => ({ searchOpen, menuOpen, setSearchOpen, setMenuOpen }), [searchOpen, menuOpen]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
