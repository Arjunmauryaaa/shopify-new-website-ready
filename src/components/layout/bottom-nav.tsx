"use client";

import Link from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { localizePath } from "@/config/markets";
import { BagIcon, GridIcon, HeartIcon, HomeIcon, SearchIcon } from "@/components/ui/icons";
import { useMarket } from "@/providers/market-provider";
import { useCart } from "@/providers/cart-provider";
import { useUI } from "@/providers/ui-provider";
import { useWishlist } from "@/providers/wishlist-provider";

/** Thumb-reach navigation for phones. The header's own search and bag buttons are hidden at this width. */
export function BottomNav() {
  const pathname = usePathname();
  const { slug } = useMarket();
  const { setSearchOpen } = useUI();
  const { cart, openDrawer } = useCart();
  const { handles } = useWishlist();
  const count = cart?.totalQuantity ?? 0;
  const is = (href: string) => pathname === localizePath(slug, href);

  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      <Link href="/" aria-current={is("/") ? "page" : undefined}><HomeIcon /><span>Home</span></Link>
      <Link href="/shop" aria-current={is("/shop") ? "page" : undefined}><GridIcon /><span>Shop</span></Link>
      <button type="button" onClick={() => setSearchOpen(true)} aria-haspopup="dialog"><SearchIcon /><span>Search</span></button>
      <Link href="/wishlist" aria-current={is("/wishlist") ? "page" : undefined}>
        <HeartIcon />
        <span>Saved{handles.length > 0 ? ` (${handles.length})` : ""}</span>
      </Link>
      <button type="button" onClick={openDrawer} aria-haspopup="dialog" aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}>
        <span className="bottom-nav__bag"><BagIcon />{count > 0 && <b aria-hidden="true">{count}</b>}</span>
        <span aria-hidden="true">Bag</span>
      </button>
    </nav>
  );
}
