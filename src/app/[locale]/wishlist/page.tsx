import type { Metadata } from "next";
import { WishlistView } from "@/components/product/wishlist-view";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Wishlist", path: "/wishlist", noindex: true, locale });
}

export default function WishlistPage() {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Wishlist</h1>
        <p className="muted small">Saved on this device only. Your wishlist isn’t linked to an account.</p>
      </header>
      <WishlistView />
    </div>
  );
}
