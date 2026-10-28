"use client";

import { HeartIcon } from "@/components/ui/icons";
import { useWishlist } from "@/providers/wishlist-provider";

export function WishlistButton({ handle, title, variant = "overlay" }: { handle: string; title: string; variant?: "overlay" | "inline" }) {
  const { has, toggle, ready } = useWishlist();
  const saved = ready && has(handle);
  return (
    <button
      type="button"
      className={`wish-btn wish-btn--${variant}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      onClick={() => toggle(handle)}
    >
      <HeartIcon filled={saved} />
      {variant === "inline" && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
