import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: brand.atelier.title, description: brand.atelier.lede, path: "/atelier", locale });
}

export default function AtelierPage() {
  return (
    <div className="page page--narrow">
      <header className="page-head">
        <h1 className="page-title">{brand.atelier.title}</h1>
        <p className="page-lede muted">{brand.atelier.lede}</p>
      </header>
      <NewsletterForm id="atelier" list="atelier" label="Join the client list" button="Request access" success="Thank you — you're on the list." />
    </div>
  );
}
