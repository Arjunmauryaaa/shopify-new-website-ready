"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { brand } from "@/config/brand";
import { CloseIcon } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/dialog";
import { useUI } from "@/providers/ui-provider";
import { MarketSelector } from "./market-selector";

export function MobileMenu() {
  const { menuOpen, setMenuOpen, setSearchOpen } = useUI();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  return (
    <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} side="left" label="Menu" className="menu-dialog">
      <div className="drawer">
        <div className="drawer__head">
          <span className="label">Menu</span>
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Mobile">
          <ul className="menu-list">
            {brand.nav.mobile.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="menu-list__btn"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                Search
              </button>
            </li>
          </ul>
        </nav>
        <div className="drawer__foot"><MarketSelector /></div>
      </div>
    </Dialog>
  );
}
