"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { localizePath } from "@/config/markets";
import { useMarket } from "@/providers/market-provider";
import { MarketSelector } from "./market-selector";
import { BagIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";
import { useCart } from "@/providers/cart-provider";
import { useUI } from "@/providers/ui-provider";
import { useWishlist } from "@/providers/wishlist-provider";
import { Wordmark } from "./wordmark";

export function Header() {
  const pathname = usePathname();
  const { slug } = useMarket();
  const { setSearchOpen, setMenuOpen } = useUI();
  const { cart, openDrawer } = useCart();
  const { handles } = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overlay = pathname === localizePath(slug, "/") && !scrolled;
  const count = cart?.totalQuantity ?? 0;

  return (
    <header className={`header ${overlay ? `header--overlay header--${brand.home.heroTone}` : "header--solid"}`}>
      <div className="header__inner">
        <nav className="header__left" aria-label="Primary">
          <button type="button" className="icon-btn header__menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </button>
          <ul className="header__links">
            {brand.nav.left.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === localizePath(slug, item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Wordmark className="header__wordmark" />

        <div className="header__right">
          <MarketSelector className="header__market" />
          <ul className="header__links header__links--right">
            {brand.nav.right.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === localizePath(slug, item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="header__desktop-only">
              <Link href="/wishlist">Wishlist{handles.length > 0 ? ` (${handles.length})` : ""}</Link>
            </li>
            <li className="header__desktop-only">
              <Link href="/account">Account</Link>
            </li>
          </ul>
          <button type="button" className="icon-btn header__search" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>
          <button type="button" className="icon-btn bag-btn header__bag" aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`} onClick={openDrawer}>
            <BagIcon />
            <span className="bag-btn__count" data-testid="cart-count" aria-hidden="true">
              {count > 0 ? count : ""}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
