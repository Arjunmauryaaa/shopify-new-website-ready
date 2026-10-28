import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { ProductCardView } from "@/components/product/product-card";
import { ProductView } from "@/components/product/product-view";
import { Reviews } from "@/components/product/reviews";
import { getReviews } from "@/lib/reviews";
import { getProduct, getRecommendations } from "@/lib/shopify/catalog";
import { breadcrumbJsonLd, jsonLdString, pageMetadata, productJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, locale } = await params;
  const product = await getProduct(ctxOf(marketOrDefault(locale)), handle);
  if (!product) return { title: "Product not found" };
  return pageMetadata({
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    path: `/products/${handle}`,
    image: product.featuredImage?.url,
    locale,
  });
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { handle, locale } = await params;
  const ctx = ctxOf(marketOrDefault(locale));
  const sp = await searchParams;
  const product = await getProduct(ctx, handle);
  if (!product) notFound();
  const [related, reviews] = await Promise.all([getRecommendations(ctx, product.id), getReviews(product.id)]);
  const variantParam = typeof sp.variant === "string" && /^\d+$/.test(sp.variant) ? sp.variant : undefined;

  return (
    <div className="page page--pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product, locale, reviews)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: product.title, path: `/products/${handle}` },
            ], locale),
          ),
        }}
      />
      <nav aria-label="Breadcrumb" className="crumbs small muted">
        <Link href="/shop">Shop</Link> / <span aria-current="page">{product.title}</span>
      </nav>
      <ProductView product={product} variantParam={variantParam} rating={reviews} />
      <Reviews summary={reviews} locale={marketOrDefault(locale).locale} />
      {related.length > 0 && (
        <section className="section" aria-labelledby="related-title">
          <div className="section__head">
            <h2 id="related-title" className="label">You may also like</h2>
          </div>
          <ul className="grid-products">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCardView product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
