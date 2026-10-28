// Dataset used by the Playwright suite. Deterministic, minimal, tied to assertions in tests/e2e.
export function build(ORIGIN) {
const img = (n) => ({ url: `${ORIGIN}/img/${n}.png`, altText: `Mock image ${n}`, width: 80, height: 100 });
const money = (a) => ({ amount: Number(a).toFixed(1), currencyCode: "INR" });

/* ---- catalogue ---- */
function simpleProduct(i) {
  const price = 1000 + i * 100;
  return {
    id: `gid://shopify/Product/${1000 + i}`, handle: `item-${i}`, title: `Item ${i}`, vendor: "Mock", productType: i % 2 ? "Tops" : "Knitwear",
    availableForSale: i !== 7, tags: [], description: `Description for item ${i}`, descriptionHtml: `<p>Description for item ${i}</p>`,
    seo: { title: null, description: null },
    options: [{ id: "o1", name: "Title", values: ["Default Title"] }],
    variants: { nodes: [{ id: `gid://shopify/ProductVariant/${5000 + i}`, title: "Default Title", availableForSale: i !== 7, selectedOptions: [{ name: "Title", value: "Default Title" }], price: money(price), compareAtPrice: null, image: null }] },
    images: { nodes: [img(i % 5), img((i + 1) % 5)] }, featuredImage: img(i % 5),
    priceRange: { minVariantPrice: money(price), maxVariantPrice: money(price) },
    compareAtPriceRange: { minVariantPrice: money(0), maxVariantPrice: money(0) },
    care: null, materials: null,
  };
}

const sizes = ["S", "M", "L"];
const colours = ["Ivory", "Black"];
const shirtVariants = [];
let vid = 9000;
for (const c of colours) for (const s of sizes) {
  const soldOut = c === "Black" && s === "L";
  shirtVariants.push({
    id: `gid://shopify/ProductVariant/${vid++}`, title: `${s} / ${c}`, availableForSale: !soldOut,
    selectedOptions: [{ name: "Size", value: s }, { name: "Color", value: c }],
    price: money(c === "Black" ? 4800 : 4500), compareAtPrice: c === "Black" ? money(5200) : null,
    image: c === "Black" ? img(3) : img(0),
  });
}
const shirt = {
  ...simpleProduct(0), id: "gid://shopify/Product/1", handle: "linen-shirt", title: "Linen Shirt", vendor: "Mock Atelier",
  productType: "Tops", availableForSale: true, description: "A shirt.", descriptionHtml: "<p>A shirt in linen.</p>",
  options: [{ id: "o-size", name: "Size", values: sizes }, { id: "o-color", name: "Color", values: colours }],
  variants: { nodes: shirtVariants },
  images: { nodes: [img(0), img(1), img(2), img(3)] }, featuredImage: img(0),
  priceRange: { minVariantPrice: money(4500), maxVariantPrice: money(4800) },
  compareAtPriceRange: { minVariantPrice: money(5200), maxVariantPrice: money(5200) },
  care: { value: "Wash cold." }, materials: { value: "100% linen." },
};
const products = [shirt, ...Array.from({ length: 30 }, (_, i) => simpleProduct(i + 1))];
  const collectionMeta = (handle, title) => ({
    id: `gid://shopify/Collection/${handle}`, handle, title, description: `${title} description`, descriptionHtml: `<p>${title}</p>`,
    seo: { title: null, description: null }, image: null,
  });
  const collections = { "new-arrivals": collectionMeta("new-arrivals", "New Arrivals"), featured: collectionMeta("featured", "Featured") };
  
  const articles = [1, 2, 3].map((n) => ({
    id: `gid://shopify/Article/${n}`, handle: `story-${n}`, title: `Story ${n}`, excerpt: `Excerpt ${n}`, contentHtml: `<p>Body of story ${n}</p>`,
    publishedAt: `2026-0${n}-10T00:00:00Z`, tags: ["Notes"], image: img(n), seo: { title: null, description: null },
  }));
  
  const pages = { about: { id: "p1", handle: "about", title: "About", body: "<p>About page body.</p>", bodySummary: "About" }, faq: { id: "p2", handle: "faq", title: "FAQ", body: "<p>FAQ body.</p>", bodySummary: "FAQ" } };
  
  
  return { products, collections, articles, pages };
}
