# Ad landing page and Shopify setup (Health & Personal Care)

## Ad link format

Use this as the destination URL in Meta / Google / other ads:

```
https://YOURSTORE.com/products/PRODUCT-HANDLE?view=express
```

Optional: `&variant=VARIANT_ID` preselects an option, `&qty=2` preselects quantity. Add your UTM tags after these.
The page shows the product, option picker, order summary and a Pay securely button (no menus, no footer links to browse away),
then "Complete your routine" with recommended products that can be added to the same order in one tap.

## Do in Shopify admin

1. **Publish the theme**: Online Store > Themes > Add theme > Connect from GitHub, then Publish.
2. **Branding**: Customize > Theme settings: storefront name, logo. Header: edit the announcement text and menu links (the menu still holds the old baby categories).
3. **Products and collections**: create collections such as Skin care, Hair care, Immunity, Sleep, Oral care, Body care. Link each tile in Customize > Home > Shop by need.
4. **Images and video**: Customize > Home: add a hero photo or short looping video, a "Why choose us" photo, and a reel video (best 9:16, the same creative as your ads).
5. **Recommended products**: install the free **Shopify Search & Discovery** app and set Complementary products per product. Or set a collection in Customize on the ad page ("Recommend from a collection"). Without either, Shopify's related-products guess is used.
6. **Per-product bullets (optional)**: Settings > Custom data > Products > add metafield `custom.highlights` (List of single line text). The ad page lists these as key points.
7. **Payments**: Settings > Payments: activate Razorpay and/or Shopify Payments, plus UPI, cards, wallets, and COD if you offer it. Turn on Shop Pay / Google Pay if you want the optional fast-pay buttons.
8. **Shipping**: Settings > Shipping and delivery: set real rates. Only claim free shipping in the theme if a matching rate exists.
9. **Policies**: Settings > Policies: fill refund, shipping, privacy and terms. They appear in the footer and the ad page.
10. **Checkout look**: Settings > Checkout and customer accounts > Customize: add logo, colours (teal `#2f7a6d`), font, and set the page to one-page checkout so the payment step stays short.
11. **Tracking**: add the Meta and Google channels (Sales channels), confirm the pixel and purchase events fire from checkout.
12. **Reviews**: add only real customer reviews (Customize > Home > Customer reviews, or a reviews app).
13. **Page speed**: compress images and keep videos short.

## Limits you should know

- **You cannot add your own content (recommended products) below the Shopify payment form itself** unless the store is on Shopify Plus (checkout extensibility). So this theme puts the order, payment button and recommendations on the ad page, and the payment form opens next. If you move to Plus, an upsell extension can be added on the checkout page.
- The totals on the ad page are estimates. Shipping, tax and discount codes are finalised on Shopify checkout.
- Fast-pay buttons buy only the main product, not the add-ons. They are off by default for that reason.

## Advertising compliance (health products)

Meta, Google and Indian law (Drugs and Magic Remedies Act, ASCI guidelines) restrict health claims. Do not claim a product cures, treats or prevents a disease, show before and after body images, or use invented reviews or fake countdowns. The theme includes a disclaimer on the home page, footer and ad page; edit it with your legal advice.

## Design notes

- All styling is in `assets/wellness.css` (loaded last); change colours in the `:root` block at the top.
- The new sections are Wellness hero, Shop by need, Why choose us, Video, Customer reviews, FAQ and Health disclaimer.
- Preview locally with `npm run theme:preview`, then open `/products/soft-jersey-romper?view=express`. This is an approximation; confirm on a real Shopify theme preview.
## Dummy media

Run `node scripts/generate-wellness-assets.mjs` to regenerate the placeholder images and video (assets/wh-*.jpg, wh-demo-video.webm). Replace them in the theme editor with real photos and videos.
