# Payment architecture

## Decision: Shopify-hosted checkout with Razorpay as the Shopify payment provider

The storefront creates a Shopify cart through the Storefront API and sends the customer to the `checkoutUrl`
Shopify returns. Razorpay is enabled **inside Shopify admin**, so Shopify's checkout collects and processes payment.

Why this route (your stated preference):
- Shopify remains the source of truth for tax, shipping, discounts, inventory, orders and fulfilment.
- A Shopify order exists only once the payment provider confirms payment — no custom "mark as paid" code, no
  browser-supplied amounts, no secrets in this codebase.
- No card data, Razorpay key secret or webhook secret ever touches this app. For that reason **no `RAZORPAY_*`
  variables are read** (they are listed commented-out in `.env.example` for the alternative only).

Consequences:
- There are no `/order/success`, `/payment/failed` or similar routes. Shopify shows the thank-you / failure /
  cancellation pages (and "return to cart" links back to this site). A success page that anyone can reach by typing a
  URL would be misleading, so none is built.
- The custom Razorpay Checkout + webhook workflow (server-side Razorpay order creation, signature verification, raw-body
  webhook verification, idempotency, Admin API order creation) was **not** built. Per the brief it needs your explicit
  approval and a verified reason Shopify checkout is unsuitable. If you approve it, it is a separate module
  (`src/lib/payments/`) with its own tests.

## What you must do in Shopify (external configuration)

1. Confirm Razorpay is available for your store/market: Shopify admin → Settings → Payments → search "Razorpay"
   (requires an eligible India store and a Razorpay account). Activate it with your **test-mode** keys first.
2. Place a test order through the storefront checkout; confirm the order is created and marked **Paid** in Shopify.
3. Test: failed payment, cancelled payment, duplicate refresh after payment, delayed confirmation. These are handled by
   Shopify + Razorpay, so they must be verified live — they cannot be proven by this repository's tests.
4. Only after that, switch Razorpay to live keys.

If Razorpay is **not** offered for your store, tell me — that is the verified blocker that would justify the custom flow.

## Selling internationally — payment caveat

Razorpay inside Shopify is mainly an India-focused provider; whether it can accept international cards and which
currencies it settles in depends on your Razorpay account (international payments must be enabled by Razorpay) and
on the payment providers Shopify offers for your store's country. Shopify Payments is not available to Indian
merchants. For a global storefront you will likely need to combine Razorpay (INR) with an additional provider
(e.g. PayPal or another Shopify-supported gateway) and set currency rules per market in Shopify Markets.
This must be confirmed in your Shopify admin; it cannot be verified from this repository.
