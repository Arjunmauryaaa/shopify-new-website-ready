// Minimal in-memory Shopify Storefront API stand-in used ONLY by the Playwright suite.
// It answers the exact operations the storefront issues, so "tests passed" means "passed against this mock",
// not "verified against live Shopify".
import http from "node:http";
import zlib from "node:zlib";

const PORT = Number(process.env.MOCK_SHOPIFY_PORT || 4010);
const ORIGIN = `http://localhost:${PORT}`;

/* ---- tiny PNG generator (solid colour) so next/image has something real to optimise ---- */
function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(r, g, b, w = 80, h = 100) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * (w * 3 + 1) + 1 + x * 3;
    raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const dataset = await import(process.env.MOCK_DATASET === "demo" ? "../../demo/dataset.mjs" : "./dataset-test.mjs");
const { products, collections, articles, pages } = dataset.build(ORIGIN);
const money = (a) => ({ amount: Number(a).toFixed(1), currencyCode: "INR" });
const productByHandle = new Map(products.map((p) => [p.handle, p]));
const variantById = new Map();
for (const p of products) for (const v of p.variants.nodes) variantById.set(v.id, { variant: v, product: p });

/* ---- cart ---- */
const carts = new Map();
let cartSeq = 0;
function cartView(c) {
  const nodes = c.lines.map((l) => {
    const { variant, product } = variantById.get(l.merchandiseId);
    return {
      id: l.id, quantity: l.quantity,
      cost: { amountPerQuantity: variant.price, totalAmount: money(Number(variant.price.amount) * l.quantity), compareAtAmountPerQuantity: variant.compareAtPrice },
      merchandise: { id: variant.id, title: variant.title, availableForSale: variant.availableForSale, selectedOptions: variant.selectedOptions, image: variant.image ?? product.featuredImage, product: { handle: product.handle, title: product.title } },
    };
  });
  const subtotal = nodes.reduce((s, n) => s + Number(n.cost.totalAmount.amount), 0);
  return {
    id: c.id, checkoutUrl: `${ORIGIN}/checkout/${c.key}`, totalQuantity: nodes.reduce((s, n) => s + n.quantity, 0), note: c.note ?? null, buyerIdentity: { countryCode: c.country },
    cost: { subtotalAmount: money(subtotal), totalAmount: money(subtotal), totalTaxAmount: null },
    discountCodes: c.codes.map((code) => ({ code, applicable: code === "WELCOME10" })), lines: { nodes },
  };
}
const ok = (c) => ({ cart: cartView(c), userErrors: [] });
const err = (message) => ({ cart: null, userErrors: [{ field: ["cartId"], message }] });
function cartFromId(id) {
  return carts.get(id);
}
function addTo(c, lines) {
  for (const { merchandiseId, quantity } of lines) {
    const hit = variantById.get(merchandiseId);
    if (!hit) return "The merchandise does not exist.";
    if (!hit.variant.availableForSale) return "The product is sold out.";
    const existing = c.lines.find((l) => l.merchandiseId === merchandiseId);
    if (existing) existing.quantity += quantity;
    else c.lines.push({ id: `gid://shopify/CartLine/${c.key}-${c.lines.length}-${Date.now()}`, merchandiseId, quantity });
  }
  return null;
}

/* ---- resolver ---- */
function listPage(items, first, after) {
  const start = after ? Number(Buffer.from(after, "base64").toString()) : 0;
  const slice = items.slice(start, start + first);
  const end = start + slice.length;
  return { nodes: slice, pageInfo: { hasNextPage: end < items.length, endCursor: Buffer.from(String(end)).toString("base64") } };
}
const FILTERS = [{ id: "filter.v.availability", label: "Availability", type: "LIST", values: [{ id: "filter.v.availability.1", label: "In stock", count: 29, input: '{"available":true}' }] },
  { id: "filter.v.price", label: "Price", type: "PRICE_RANGE", values: [{ id: "filter.v.price", label: "Price", count: 0, input: '{"price":{"min":0}}' }] }];

function resolve(op, v) {
  switch (true) {
    case /^Product$/.test(op): return { product: productByHandle.get(v.handle) ?? null };
    case /^ProductCardByHandle$/.test(op): return { product: productByHandle.get(v.handle) ?? null };
    case /^Recommendations$/.test(op): return { productRecommendations: products.slice(1, 5) };
    case /^CollectionProducts$/.test(op): {
      const meta = collections[v.handle];
      if (!meta) return { collection: null };
      let items = meta._handles ? meta._handles.map((h) => productByHandle.get(h)).filter(Boolean) : v.handle === "featured" ? products.slice(1, 5) : products;
      const wantsAvailable = (v.filters ?? []).some((f) => f.available === true);
      if (wantsAvailable) items = items.filter((p) => p.availableForSale);
      const price = (v.filters ?? []).find((f) => f.price)?.price;
      if (price) items = items.filter((p) => (price.min == null || Number(p.priceRange.minVariantPrice.amount) >= price.min) && (price.max == null || Number(p.priceRange.minVariantPrice.amount) <= price.max));
      if (v.sortKey === "PRICE") items = [...items].sort((a, b) => (Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount)) * (v.reverse ? -1 : 1));
      const page = listPage(items, v.first, v.after);
      return { collection: { ...meta, products: { ...page, filters: FILTERS } } };
    }
    case /^AllProducts$/.test(op): return { products: listPage(products, v.first, v.after) };
    case /^ProductTypes$/.test(op): return { productTypes: { nodes: [...new Set(products.map((p) => p.productType))] } };
    case /^Collections$/.test(op): return { collections: { nodes: Object.values(collections) } };
    case /^Search$/.test(op): {
      const q = String(v.term).toLowerCase();
      const hits = products.filter((p) => p.title.toLowerCase().includes(q));
      return { search: { totalCount: hits.length, ...listPage(hits, v.first, v.after) } };
    }
    case /^ShopPage$/.test(op): return { page: pages[v.handle] ?? null };
    case /^ShopPolicies$/.test(op): return { shop: { privacyPolicy: null, termsOfService: null, refundPolicy: null, shippingPolicy: null } };
    case /^Articles$/.test(op): return { blog: v.blog === "journal" ? { articles: listPage(articles, v.first, v.after) } : null };
    case /^ArticleByHandle$/.test(op): return { blog: v.blog === "journal" ? { articleByHandle: articles.find((a) => a.handle === v.slug) ?? null } : null };
    case /^Sitemap/.test(op): {
      const field = op.endsWith("products") ? "products" : "collections";
      const nodes = (field === "products" ? products : Object.values(collections)).map((x) => ({ handle: x.handle, updatedAt: "2026-01-01T00:00:00Z" }));
      return { [field]: { nodes, pageInfo: { hasNextPage: false, endCursor: null } } };
    }
    case /^GetCart$/.test(op): { const c = cartFromId(v.cartId); return { cart: c ? cartView(c) : null }; }
    case /^CartCreate$/.test(op): {
      const key = `mock${++cartSeq}`;
      const c = { id: `gid://shopify/Cart/${key}`, key, lines: [], codes: [], country: v.input.buyerIdentity?.countryCode ?? null };
      carts.set(c.id, c);
      const e = addTo(c, v.input.lines ?? []);
      return { cartCreate: e ? err(e) : ok(c) };
    }
    case /^CartLinesAdd$/.test(op): { const c = cartFromId(v.cartId); if (!c) return { cartLinesAdd: err("The specified cart does not exist.") }; const e = addTo(c, v.lines); return { cartLinesAdd: e ? err(e) : ok(c) }; }
    case /^CartLinesUpdate$/.test(op): { const c = cartFromId(v.cartId); if (!c) return { cartLinesUpdate: err("The specified cart does not exist.") }; for (const u of v.lines) { const l = c.lines.find((x) => x.id === u.id); if (l) l.quantity = u.quantity; } return { cartLinesUpdate: ok(c) }; }
    case /^CartLinesRemove$/.test(op): { const c = cartFromId(v.cartId); if (!c) return { cartLinesRemove: err("The specified cart does not exist.") }; c.lines = c.lines.filter((l) => !v.lineIds.includes(l.id)); return { cartLinesRemove: ok(c) }; }
    case /^CartDiscountCodesUpdate$/.test(op): { const c = cartFromId(v.cartId); if (!c) return { cartDiscountCodesUpdate: err("The specified cart does not exist.") }; c.codes = v.discountCodes ?? []; return { cartDiscountCodesUpdate: ok(c) }; }
    case /^CartNoteUpdate$/.test(op): { const c = cartFromId(v.cartId); if (!c) return { cartNoteUpdate: err("The specified cart does not exist.") }; c.note = v.note || null; return { cartNoteUpdate: ok(c) }; }
    case /^CartBuyerIdentityUpdate$/.test(op): { const c = cartFromId(v.cartId); if (!c) return { cartBuyerIdentityUpdate: err("The specified cart does not exist.") }; c.country = v.buyerIdentity.countryCode; return { cartBuyerIdentityUpdate: ok(c) }; }
    default: throw new Error(`mock: unhandled operation ${op}`);
  }
}

const contexts = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, ORIGIN);
  if (req.method === "GET" && url.pathname === "/__contexts") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(contexts.splice(0))); }
  if (req.method === "GET" && url.pathname.startsWith("/img/")) {
    const n = Number(url.pathname.match(/(\d+)/)?.[1] ?? 0);
    res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" });
    return res.end(png(180 - n * 20, 170 - n * 18, 160 - n * 14));
  }
  if (req.method === "GET" && url.pathname.startsWith("/checkout/")) {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end("<h1>Mock Shopify checkout</h1>");
  }
  if (req.method === "POST" && url.pathname.endsWith("/graphql.json")) {
    if (!req.headers["x-shopify-storefront-access-token"]) { res.writeHead(401); return res.end("{}"); }
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      try {
        const { query, variables } = JSON.parse(body);
        const op = query.match(/(?:query|mutation)\s+(\w+)/)[1];
        contexts.push({ op, country: variables?.country, language: variables?.language, inContext: /@inContext\(country: \$country, language: \$language\)/.test(query) });
        const data = resolve(op, variables ?? {});
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data }));
      } catch (e) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: String(e.message) }] }));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(PORT, () => console.log(`mock shopify listening on ${PORT}`));
