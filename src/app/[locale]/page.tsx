import { ctxOf, marketOrDefault } from "@/config/markets";
import type { Metadata } from "next";
import { brand } from "@/config/brand";
import {
  CampaignStory,
  EditorialPanels,
  FeaturedCollection,
  Hero,
  JournalPreview,
  NewArrivals,
  NewsletterSection,
  Statement,
} from "@/components/home/sections";
import { ShopTheLookView } from "@/components/home/shop-the-look";
import { SocialFeed } from "@/components/home/social-feed";
import { getAllProducts, getArticles, getCollection, getProductsByHandles } from "@/lib/shopify/catalog";
import { jsonLdString, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: brand.name, description: brand.description, path: "/", locale });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ctx = ctxOf(marketOrDefault(locale));
  const { newArrivals, featured, journal } = brand.home;
  const look = brand.shopTheLook;
  const [arrivalsCollection, featuredCollection, articles, lookProducts] = await Promise.all([
    getCollection(ctx, newArrivals.collection, { first: newArrivals.count, sort: "featured" }),
    getCollection(ctx, featured.collection, { first: 2 }),
    getArticles(ctx, journal.blog, { first: journal.count }),
    getProductsByHandles(ctx, look.hotspots.map((h) => h.handle)),
  ]);

  // If the configured collection doesn't exist yet, fall back to the newest products in the catalogue.
  const arrivals = arrivalsCollection?.products ?? (await getAllProducts(ctx, { sort: "newest", first: newArrivals.count })).products;

  return (
    <div className="home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd(locale)) }} />
      <Hero />
      <EditorialPanels />
      <NewArrivals products={arrivals} />
      <CampaignStory />
      <ShopTheLookView title={look.title} image={look.image} hotspots={look.hotspots} products={lookProducts} />
      {featuredCollection && <FeaturedCollection collection={featuredCollection.collection} products={featuredCollection.products} />}
      <Statement />
      <JournalPreview articles={articles.articles} />
      <SocialFeed />
      <NewsletterSection />
    </div>
  );
}
