import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { brand } from "@/config/brand";
import { marketOrDefault, MARKETS } from "@/config/markets";
import { Analytics } from "@/components/analytics/analytics";
import { isDemo } from "@/config/demo";
import { MarketProvider } from "@/providers/market-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CartProvider } from "@/providers/cart-provider";
import { UIProvider } from "@/providers/ui-provider";
import { WishlistProvider } from "@/providers/wishlist-provider";
import { siteUrl } from "@/lib/seo";
import "../globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: brand.name, template: `%s — ${brand.name}` },
  description: brand.description,
  openGraph: { siteName: brand.name, type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8F7F4",
};

export function generateStaticParams() {
  return MARKETS.map((m) => ({ locale: m.slug }));
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const market = marketOrDefault((await params).locale);
  return (
    <html lang={market.locale.split("-")[0]} dir={market.dir ?? "ltr"} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <MarketProvider market={market}>
        <CartProvider>
          <WishlistProvider>
            <UIProvider>
              <a href="#main" className="skip-link">Skip to content</a>
              {isDemo && <p className="demo-bar" role="note">Demo storefront — sample products and artwork. Connect Shopify to replace them.</p>}
              <Header />
              <main id="main">{children}</main>
              <Footer />
              <MobileMenu />
              <SearchOverlay />
              <CartDrawer />
              <Analytics />
            </UIProvider>
          </WishlistProvider>
        </CartProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
