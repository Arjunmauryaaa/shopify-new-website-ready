import type { Metadata } from "next";
import { getEnv } from "@/config/env";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Account", path: "/account", noindex: true, locale });
}

/**
 * Accounts are delegated to Shopify's hosted customer accounts (sign-in, order history, profile),
 * so this storefront never handles customer credentials or order data itself.
 */
export default function AccountPage() {
  const url = getEnv().SHOPIFY_CUSTOMER_ACCOUNT_URL;
  return (
    <div className="page page--narrow">
      <header className="page-head">
        <h1 className="page-title">Account</h1>
      </header>
      {url ? (
        <div className="stack">
          <p>Sign in to view your orders and manage your details. Accounts are hosted securely by Shopify.</p>
          <a className="btn btn--solid" href={url} rel="noopener">Sign in or create an account</a>
        </div>
      ) : (
        <div className="notice" role="note">
          <p>Customer accounts aren’t enabled yet.</p>
          <p className="muted small">Enable customer accounts in Shopify admin and set SHOPIFY_CUSTOMER_ACCOUNT_URL to connect this page.</p>
        </div>
      )}
    </div>
  );
}
