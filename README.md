# Headless luxury storefront (Next.js + Shopify Storefront API)

This repository also includes a native Shopify Online Store theme at its root (`layout/`, `sections/`, `snippets/`, `templates/`, `assets/`, and `config/`). Use Shopify's **Connect from GitHub** flow to add that theme to the store. The `src/` Next.js storefront remains available for a separately hosted headless storefront.

Editorial, image-led storefront. Shopify is the source of truth for products, prices, variants, availability, cart and
checkout. Payments run through Shopify checkout with Razorpay enabled in Shopify — see [docs/PAYMENTS.md](docs/PAYMENTS.md).

## Run

```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev                  # http://localhost:3000
npm run verify               # lint + typecheck + unit tests + production build
npm run test:e2e             # Playwright (builds, starts a local mock of the Storefront API)
```

## Put the theme on the Shopify store URL

The Shopify theme is the version that renders on the store's Shopify URL. After the theme files are pushed to the connected GitHub branch, go to **Online Store → Themes → Add theme → Connect from GitHub**, select this repository and branch, then use **Preview** and **Publish** from the theme card. Publishing is the step that makes the theme the live storefront. Theme images, menus, and text can be adjusted in **Customize**; product, collection, page, and checkout data come from Shopify.

Without Shopify credentials the site still renders (empty states, labelled image placeholders); cart returns 503.

## Credentials to provide

| Variable | Where from |
|---|---|
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify admin → Settings → Apps → Develop apps → Storefront API (scopes: unauthenticated read products/collections/content, cart/checkout, product inventory optional) |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_NAME` | your domain / brand |
| `SHOPIFY_CUSTOMER_ACCOUNT_URL` | Shopify customer accounts URL (enables /account) |
| `KLAVIYO_PRIVATE_API_KEY`, `KLAVIYO_LIST_ID` | newsletter |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | contact form |
| Razorpay | configured **in Shopify admin**, not here |

## Shopify content expected

- Collections with handles `new-arrivals` and `featured` (configurable in `src/config/brand.ts`; new-arrivals falls back to newest products).
- Blog with handle `journal` for /journal.
- Pages: `about`, `shipping`, `returns`, `faq`, `privacy-policy`, `terms-of-service`, `refund-policy` (policies fall back to Settings → Policies). Missing ones show an honest "not published yet" notice.
- Optional product metafields `custom.care` and `custom.materials`.

## Brand & design

- All brand/editorial content: `src/config/brand.ts`. Campaign images: put files in `public/campaign/` and set `src` there; until then labelled placeholders render.
- Design tokens (colour, type, spacing, drawers): top of `src/app/globals.css`.
- Header text over the hero: set `home.heroTone` to `"light"` for dark photography.

## Architecture

`src/lib/shopify/` (client, fragments, catalog, cart, facets) · `src/app/api/*` (validated cart/search/products/newsletter/contact/revalidate) ·
`src/providers/` (cart, wishlist, UI) · `src/components/` · cart id kept in an httpOnly SameSite cookie; totals always from Shopify.
On-demand refresh: `POST /api/revalidate?tag=catalog|collections|content` with header `x-revalidate-secret`.

## Status (honest)

| | |
|---|---|
| Implemented code | all routes in the brief except in-app customer-account auth (delegated to Shopify-hosted accounts) and in-app order status pages (Shopify's) |
| Passed with mocks | 80 unit tests; 96 Playwright tests (desktop 1440 + mobile Pixel 7) against a local Storefront API mock, incl. markets, conversion features and no-overflow at 320–1920px |
| Live integration verified | **none** — no real Shopify, Razorpay, Klaviyo or Resend credentials have been used |
| External config still required | credentials above; Razorpay activation in Shopify; Shopify content; campaign photography |
| Not done | reference screenshot was not in the repo, so design follows the written spec; Lighthouse/Web Vitals not measured; GraphQL queries are hand-written and unverified against the live schema (API version `2026-07`, override with `SHOPIFY_API_VERSION`) |

## Selling worldwide

- **Markets** live in `src/config/markets.ts` and must mirror Shopify admin → Settings → Markets / Languages. Every URL is `/{market}/…` (e.g. `/en-us/shop`).
- `src/proxy.ts` sends un-prefixed URLs to the best market: saved choice (cookie) → IP country (`x-vercel-ip-country` / `cf-ipcountry`; your host must supply one) → `Accept-Language` region → `NEXT_PUBLIC_DEFAULT_MARKET`.
- Every Storefront query carries `@inContext(country, language)`, so **price, currency, availability, duties and translated product/collection/blog/page content come from Shopify Markets**. The cart is created for, and re-pointed to, the market being browsed, so checkout shows the right currency.
- SEO: market-specific canonicals, hreflang for all markets + `x-default`, and a sitemap with one entry per market URL (very large catalogues: split sitemaps, each file is capped at 50,000 URLs).
- Add a market: add a row to `MARKETS`, enable the country in Shopify Markets. Languages other than English also need Shopify translations **and** a UI dictionary (see below).

### Not done yet for full internationalisation
- **UI text is English only.** Product/blog/page content translates through Shopify, but buttons, labels and errors in the code are English strings. Before adding a non-English market, extract them into per-language dictionaries (and have them translated).
- **Right-to-left** layouts: `dir` is wired from the market config, but the CSS still uses physical left/right properties.
- Shopify taxes/duties/shipping rates per country are configured in Shopify, not here.

## Conversion features

| Feature | How it works | Needs |
|---|---|---|
| Buy it now | Creates a separate one-item Shopify cart and goes straight to checkout; the shopper's bag is untouched | — |
| Trust block | Delivery estimate, promises and payment methods near buy/checkout | real values in env / `brand.commerce` (hidden if empty) |
| Free-shipping bar | Compares the Shopify cart subtotal with per-currency thresholds | `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLDS` matching your Shopify rates |
| Upsell "Complete the look" | Shopify `productRecommendations`, with one-tap add for single-variant products | — |
| Gift options | Gift message saved on the Shopify cart (appears on the order); optional gift-wrap line | `NEXT_PUBLIC_GIFT_WRAP_VARIANT_ID` for wrap |
| Quick add | Variant picker and add-to-bag from any product grid | — |
| Back-in-stock alerts | Klaviyo back-in-stock API; success shown only on Klaviyo's 202 | Klaviyo key + Shopify catalog sync + back-in-stock flow |
| Low stock | "Only N left" from real Shopify quantity at or below 5 | `SHOPIFY_INVENTORY_ENABLED=true` + inventory scope |
| Reviews | Real Judge.me reviews, star badge, `aggregateRating` JSON-LD from that data only | Judge.me account + API token |
| Size guide + finder | Chart and "find my size" from your measurements | fill `brand.commerce.sizeGuide.rows` |
| Shop the look | Tappable hotspots on an editorial image linking to real products | image + `brand.shopTheLook.hotspots` |
| Social feed | Hand-picked real posts grid | `brand.socialFeed.posts` |
| The Atelier | `/atelier` private client list into a second Klaviyo list | `KLAVIYO_ATELIER_LIST_ID` |
| Product video | Shopify video / external video appears in the gallery | upload video in Shopify product media |
| Analytics | GA4, Meta Pixel, Klaviyo onsite, Google Ads; view_item, add_to_cart, begin_checkout, search, page_view; loads only after cookie consent | IDs in env |

Not built (needs a paid external app or a decision from you): loyalty/referral programme (Smile.io/Yotpo etc. — they integrate through their own APIs and accounts), Instagram live API feed (needs a Meta app token; the hand-picked grid is provided instead), and purchase-conversion events (the purchase happens on Shopify's checkout, so configure Shopify's Customer Events/pixels or the GA4/Meta Shopify channels for `purchase`).

## Measured performance baseline (Lighthouse, mobile, simulated throttling, local mock data, placeholder images)
Home 85 · Product 82 · Collection 83 performance; accessibility 98–100; best practices 100; SEO 100; CLS 0; TBT 130–190 ms; LCP ≈ 4.1–4.3 s. LCP is dominated by placeholder blocks and the throttled profile — re-measure on the deployed site with real photography (use `priority` hero images, AVIF/WebP via next/image are already on).

## Demo mode (sample data)

`npm run demo` (dev) or `npm run demo -- --prod` starts a local stand-in for the Shopify Storefront API with a complete **sample** catalogue (12 products, 108 variants, 9 collections, 3 journal stories, policy pages) plus the homepage content in `src/config/demo.ts`, and shows a "Demo storefront" bar. The artwork is generated in code (`demo/art.mjs` → `public/demo/*.jpg`; regenerate with `npm run demo:assets`) — original illustrations, not photography. Nothing here is real inventory, policy text or brand content.

To go live: set the real Shopify variables, leave `NEXT_PUBLIC_DEMO` unset, replace the campaign images in `src/config/brand.ts` (or just use real product photos from Shopify), and delete `public/demo` if you no longer want it.

## Shopify Online Store theme (Liquid)

The repo root also holds a Shopify theme (`layout/`, `sections/`, `snippets/`, `templates/`, `config/`, `assets/`) connected to the store through Shopify's GitHub integration. The Next.js app under `src/` is a separate, headless storefront; Shopify ignores it.

**What the theme adds on top of the base editorial theme** (`assets/enhance.js`, `assets/enhance.css`, `sections/cart-drawer.liquid`, `snippets/*`):

| Area | What it does |
| --- | --- |
| Bag | Slide-out drawer, add without leaving the page, quantity and remove, "Added to your bag" confirmation, gift message, free-shipping bar |
| Search | Predictive suggestions with images and prices, recent searches, browse links, helpful no-results state |
| Collections | Filters (availability, price and any filter set in Shopify's Search & Discovery app) with removable chips |
| Product page | Option buttons and colour swatches, sold-out sizes struck through, swipeable gallery on phones, full-screen pinch/wheel zoom, size guide, related products, sticky add-to-bag bar on phones |
| Cards | Second image on hover, swatches, Sale / Sold out tags, quick add for single-variant products, saved-item heart |
| Phones | Bottom navigation bar (Home, Shop, Search, Saved, Bag) |
| SEO | Product, Organization and WebSite structured data, Open Graph and Twitter tags |
| Accessibility | Live-region announcements, native dialogs with focus return, visible focus, 44px touch targets, reduced-motion support |

**Merchant setup (in Shopify admin):**
1. Create a page titled **Saved** and set its template to `page.saved` (the heart buttons and bottom bar link to `/pages/saved`).
2. Optional: create a size/age chart page and pick it under *Customize → Product page → Size guide page*.
3. Theme settings → *Store features*: set a free-shipping threshold only if it matches a real shipping rate; leave it at 0 to hide the bar.
4. Filters come from the Shopify *Search & Discovery* app. Predictive search needs no setup.
5. Colour swatches appear for options that use Shopify's swatch/metaobject values; options without one show text buttons.

**Checking it:**
- `npm run theme:check` runs Shopify's Theme Check (passes with 0 offenses at the time of writing).
- `npm run theme:preview` serves the theme at http://localhost:9292 with **sample data** through LiquidJS. This is an approximation of Shopify's renderer, useful for layout and the theme JavaScript. It is not a substitute for previewing on the real store.
- `npm run test:theme` runs Playwright tests against that preview (bag, search, filters, options, zoom, saved items, phone navigation, axe accessibility scans).

Not verified against a live store: anything that depends on your real data or Shopify services (predictive search endpoint, Section Rendering responses, filter parameter names, accelerated checkout buttons). Preview the theme in Shopify before publishing.
