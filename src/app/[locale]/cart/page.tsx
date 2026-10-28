import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Bag", path: "/cart", noindex: true, locale });
}

export default function CartPage() {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Bag</h1>
      </header>
      <CartView />
    </div>
  );
}
