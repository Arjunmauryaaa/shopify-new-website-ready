import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { getPage, getShopPolicy } from "@/lib/shopify/catalog";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; handle: string }> };

/** Pages the storefront links to; shown with a clear notice (not a 404) until their content is published in Shopify. */
const EXPECTED: Record<string, string> = {
  shipping: "Shipping",
  returns: "Returns & exchanges",
  faq: "Frequently asked questions",
  "privacy-policy": "Privacy policy",
  "terms-of-service": "Terms of service",
  "refund-policy": "Refund policy",
};

async function load(locale: string, handle: string) {
  const ctx = ctxOf(marketOrDefault(locale));
  // A Shopify Page (Online Store > Pages) wins; otherwise the matching policy from Settings > Policies.
  return (await getPage(ctx, handle)) ?? (await getShopPolicy(ctx, handle));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, locale } = await params;
  const page = await load(locale, handle);
  const title = page?.title ?? EXPECTED[handle];
  if (!title) return { title: "Page not found" };
  return pageMetadata({ title, description: page?.bodySummary, path: `/pages/${handle}`, locale });
}

export default async function ContentPage({ params }: Props) {
  const { handle, locale } = await params;
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(handle)) notFound();
  const page = await load(locale, handle);
  if (!page && !EXPECTED[handle]) notFound();

  return (
    <div className="page page--narrow">
      <header className="page-head">
        <h1 className="page-title">{page?.title ?? EXPECTED[handle]}</h1>
      </header>
      {page ? (
        <div className="prose" dangerouslySetInnerHTML={{ __html: page.body }} />
      ) : (
        <div className="notice" role="note">
          <p>This page hasn’t been published yet.</p>
          <p className="muted small">
            Add a page with the handle “{handle}” in Shopify admin (Online Store → Pages
            {handle.includes("policy") || handle === "terms-of-service" ? ", or Settings → Policies" : ""}) and it will appear here.
          </p>
          <Link href="/contact" className="text-link">Contact us</Link>
        </div>
      )}
    </div>
  );
}
