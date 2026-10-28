// DEMO dataset for the local Storefront API stand-in (tests/e2e/mock-shopify.mjs with MOCK_DATASET=demo).
// All names, prices, copy and artwork are sample content for previewing the storefront.
import { COLLECTIONS, PRODUCTS, slug } from "./products.mjs";

export function build() {
  const money = (a) => ({ amount: Number(a).toFixed(1), currencyCode: "INR" });
  const img = (name, alt) => ({ url: `/demo/${name}.jpg`, altText: alt, width: 1000, height: 1250 });
  let vid = 7000;

  const products = PRODUCTS.map((p, i) => {
    const sizes = p.sizes ?? [null];
    const variants = [];
    for (const [color] of p.colors) {
      for (const size of sizes) {
        const soldOut = p.soldOut.some(([c, s]) => c === color && (s === size || s === "Default"));
        variants.push({
          id: `gid://shopify/ProductVariant/${vid++}`,
          title: [size, color].filter(Boolean).join(" / "),
          availableForSale: !soldOut,
          selectedOptions: [...(size ? [{ name: "Size", value: size }] : []), { name: "Color", value: color }],
          price: money(p.price),
          compareAtPrice: p.compareAt ? money(p.compareAt) : null,
          image: img(`p-${p.handle}-${slug(color)}`, `${p.title} in ${color}`),
        });
      }
    }
    const front = (c) => img(`p-${p.handle}-${slug(c[0])}`, `${p.title} in ${c[0]}`);
    const images = [front(p.colors[0]), img(`p-${p.handle}-detail`, `${p.title} — detail`), ...p.colors.slice(1).map(front)];
    const available = variants.some((v) => v.availableForSale);
    const price = money(p.price);
    return {
      id: `gid://shopify/Product/${100 + i}`, handle: p.handle, title: p.title, vendor: "Arjunta", productType: p.type,
      availableForSale: available, tags: [], description: p.desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), descriptionHtml: p.desc,
      seo: { title: null, description: null },
      options: [...(p.sizes ? [{ id: `o-size-${i}`, name: "Size", values: p.sizes }] : []), { id: `o-color-${i}`, name: "Color", values: p.colors.map((c) => c[0]) }],
      variants: { nodes: variants }, images: { nodes: images }, featuredImage: images[0], media: { nodes: [] },
      priceRange: { minVariantPrice: price, maxVariantPrice: price },
      compareAtPriceRange: { minVariantPrice: money(p.compareAt ?? 0), maxVariantPrice: money(p.compareAt ?? 0) },
      care: { value: p.care }, materials: { value: p.materials },
    };
  });

  const collections = Object.fromEntries(
    Object.entries(COLLECTIONS).map(([handle, c]) => [
      handle,
      {
        id: `gid://shopify/Collection/${handle}`, handle, title: c.title, description: c.description, descriptionHtml: `<p>${c.description}</p>`,
        seo: { title: null, description: null },
        image: handle === "new-arrivals" ? { url: "/demo/scene-story.jpg", altText: "New arrivals", width: 2400, height: 1030 } : null,
        _handles: PRODUCTS.filter((p) => p.collections.includes(handle)).map((p) => p.handle),
      },
    ]),
  );

  const articles = [
    {
      id: "gid://shopify/Article/1", handle: "dressing-for-warm-days", title: "Dressing for warm days", tags: ["Style"], publishedAt: "2026-09-12T08:00:00Z",
      excerpt: "Light layers, natural fibres and the quiet confidence of an unfussy wardrobe.", image: { url: "/demo/scene-journal1.jpg", altText: "A slip dress and scarf", width: 1600, height: 1000 },
      seo: { title: null, description: null },
      contentHtml: `<p>Warm weather asks for fewer, better things. A linen overshirt that softens with every wash, a silk slip that moves when you do, and a scarf light enough to carry in a bag.</p>
        <h2>Start with texture</h2><p>Natural fibres breathe, drape and age well. Look for a visible weave: it adds depth to a quiet palette without adding noise.</p>
        <h2>Keep the palette tonal</h2><p>Ivory, sand, clay and olive all sit comfortably together. Anchor the look with one dark piece — a tailored trouser or a leather bag.</p>
        <h2>Layer lightly</h2><p>Think in thin layers rather than thick ones: a tank under an overshirt, a scarf for the evening, a blazer over the shoulders.</p>
        <p><em>Sample article for the demo storefront.</em></p>`,
    },
    {
      id: "gid://shopify/Article/2", handle: "the-case-for-a-white-shirt", title: "The case for a white shirt", tags: ["Essentials"], publishedAt: "2026-08-03T08:00:00Z",
      excerpt: "Why the most ordinary piece in the wardrobe is often the most useful.", image: { url: "/demo/scene-journal2.jpg", altText: "A white poplin shirt", width: 1200, height: 1500 },
      seo: { title: null, description: null },
      contentHtml: `<p>A good white shirt does more work than almost anything else you own. It lifts a pair of jeans, softens a suit and holds its own on its own.</p>
        <h2>Fit before fabric</h2><p>Look for a shoulder that sits where your shoulder ends and a body with room to move. A sleeve that can be rolled is a bonus.</p>
        <h2>Care for it</h2><p>Wash cool, iron while damp and hang it to dry. A well-kept shirt looks better after a year than a new one.</p>
        <p><em>Sample article for the demo storefront.</em></p>`,
    },
    {
      id: "gid://shopify/Article/3", handle: "outerwear-notes", title: "Notes on outerwear", tags: ["Outerwear"], publishedAt: "2026-07-18T08:00:00Z",
      excerpt: "A trench, a blazer and the art of the third layer.", image: { url: "/demo/scene-journal3.jpg", altText: "A belted trench coat", width: 1200, height: 1500 },
      seo: { title: null, description: null },
      contentHtml: `<p>The third layer finishes a look. Choose a coat with a clean line and enough room for a knit underneath.</p>
        <h2>The trench</h2><p>Belted it defines the waist; open it falls straight. Either way it works from spring through autumn.</p>
        <h2>The blazer</h2><p>Soft shoulders and a half lining make a blazer easy to wear every day rather than saved for occasions.</p>
        <p><em>Sample article for the demo storefront.</em></p>`,
    },
  ];

  const sample = '<p class="muted"><em>Sample content for the demo storefront. Replace with your own policy text in Shopify admin.</em></p>';
  const page = (handle, title, body) => ({ id: `gid://shopify/Page/${handle}`, handle, title, body: body + sample, bodySummary: title });
  const pages = {
    about: page("about", "About", "<p>Arjunta makes considered clothing in natural fibres and quiet colours — pieces designed to be worn often and kept for years.</p><p>This is placeholder copy for the demo. Tell your own story here: where you began, how you make things and what you believe in.</p>"),
    shipping: page("shipping", "Shipping", "<h2>Delivery</h2><p>Orders are dispatched within 1–2 working days. Delivery usually takes 3–5 working days within India and 7–10 internationally.</p><h2>Shipping costs</h2><p>Shipping is calculated at checkout. Free shipping applies above the threshold shown in your bag.</p>"),
    returns: page("returns", "Returns & exchanges", "<p>Return unworn items with their tags within 14 days of delivery for a refund or exchange.</p><h2>How to return</h2><ol><li>Contact us with your order number.</li><li>Pack the item in its original packaging.</li><li>We refund to the original payment method once it arrives.</li></ol>"),
    faq: page("faq", "Frequently asked questions", "<h2>How do I find my size?</h2><p>Use the size guide on each product page.</p><h2>Do you ship internationally?</h2><p>Yes — choose your country from the selector in the header.</p><h2>How do I care for my order?</h2><p>Each product page lists fibre content and care instructions.</p>"),
    "privacy-policy": page("privacy-policy", "Privacy policy", "<p>This is a sample privacy policy placeholder. It must be replaced with a policy that reflects how your business actually handles personal data.</p>"),
    "terms-of-service": page("terms-of-service", "Terms of service", "<p>This is a sample terms placeholder. Replace it with terms reviewed for your business and jurisdictions.</p>"),
    "refund-policy": page("refund-policy", "Refund policy", "<p>This is a sample refund policy placeholder. Replace it with your real refund terms.</p>"),
  };

  return { products, collections, articles, pages };
}
