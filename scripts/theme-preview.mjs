// Local PREVIEW of the Shopify Liquid theme in this repo, with sample data.
//   npm run theme:preview     ->  http://localhost:9292
//
// This is an approximation built on LiquidJS, NOT Shopify's renderer. It is meant for checking layout, copy and
// the theme JavaScript (bag drawer, search, filters, zoom). Final verification must happen on a real Shopify
// theme preview. Products, prices and images here are sample content only.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { Readable } from "node:stream";
import { Liquid, Tag } from "liquidjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = Number(process.env.PREVIEW_PORT || 9292);
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8").replace(/^﻿/, "");
const exists = (...p) => fs.existsSync(path.join(ROOT, ...p));

/* ---------------------------------------------------------------- sample data */
const MONEY = (cents) => `Rs. ${(cents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const COLORS = { Ivory: "#EFE9DC", Sand: "#D2C3A8", Sage: "#A0A68A", Blush: "#E1C6BB", Sky: "#A8BBCA", Oat: "#D6C6A6" };
const SIZES = ["Newborn", "0-3M", "3-6M", "6-12M"];
const ART = ["linen-overshirt-ivory", "cashmere-crew-knit-camel", "silk-slip-dress-clay", "wide-leg-wool-trouser-stone", "merino-scarf-blush", "pleated-midi-skirt-olive", "cotton-poplin-shirt-sky", "ribbed-knit-tank-clay"];
const NAMES = [
  ["ribbed-cotton-bodysuit", "Ribbed Cotton Bodysuit", 129900, ["Ivory", "Sand", "Sage"]],
  ["knit-baby-cardigan", "Knit Baby Cardigan", 249900, ["Oat", "Blush"]],
  ["soft-jersey-romper", "Soft Jersey Romper", 179900, ["Sky", "Ivory", "Sage"]],
  ["muslin-swaddle-blanket", "Muslin Swaddle Blanket", 149900, ["Ivory", "Sand"]],
  ["knotted-baby-beanie", "Knotted Baby Beanie", 69900, ["Sand", "Blush", "Sage", "Sky"]],
  ["footed-sleepsuit", "Footed Sleepsuit", 219900, ["Ivory", "Sky"]],
  ["wrap-cardigan", "Wrap Cardigan", 239900, ["Oat"]],
  ["everyday-bib-set", "Everyday Bib Set (3 pack)", 89900, ["Ivory"]],
];
let variantId = 9000;
const products = NAMES.map(([handle, title, price, colors], i) => {
  const variants = [];
  const opts = i === 7 ? [] : SIZES;
  for (const color of colors) for (const size of opts.length ? opts : [null]) {
    const soldOut = i === 2 && color === "Sky" && size === "0-3M";
    variants.push({ id: variantId++, options: [size, colors.length > 1 ? color : null].filter(Boolean), available: !soldOut, price: price + (size === "6-12M" ? 10000 : 0), compare_at_price: i === 5 ? price + 40000 : 0 });
  }
  if (i === 7) variants[0].options = ["Default Title"];
  const art = `/demo/p-${ART[i]}.jpg`;
  const art2 = `/demo/p-${ART[(i + 3) % ART.length]}.jpg`;
  const optionDefs = i === 7 ? [{ name: "Title", values: ["Default Title"] }] : [{ name: "Size", values: SIZES }, ...(colors.length > 1 ? [{ name: "Color", values: colors }] : [])];
  return { id: 100 + i, handle, title: `${title} Sample Newborn Baby Unisex`, vendor: "Sample brand", price: Math.min(...variants.map((v) => v.price)), price_varies: new Set(variants.map((v) => v.price)).size > 1, compare_at_price: variants[0].compare_at_price, available: variants.some((v) => v.available), variants, optionDefs, colors, hasOnlyDefault: i === 7, images: [{ src: art, alt: title }, { src: art2, alt: `${title} detail` }, { src: `/demo/p-${ART[(i + 5) % ART.length]}.jpg`, alt: `${title} lifestyle` }], description: `<p>Sample description for ${title}. Replace this with your own product copy in Shopify admin.</p><p>Care: machine wash cool. (Sample text.)</p>`, type: i % 2 ? "Knitwear" : "Basics" };
});
// Short titles are metafield-driven in the theme; the preview strips the filler words for display.
const shapeProduct = (p) => {
  const media = p.images.map((im, k) => ({ id: p.id * 10 + k, media_type: "image", src: im.src, alt: im.alt }));
  const options_with_values = p.optionDefs.map((o) => ({
    name: o.name,
    selected_value: o.values[0],
    values: o.values.map((v, vi) => Object.assign(new String(v), { selected: vi === 0, swatch: o.name === "Color" && COLORS[v] ? { color: COLORS[v] } : null })),
  }));
  const variants = p.variants.map((v) => ({ ...v, title: v.options.join(" / "), featured_media: media[0], image: media[0] }));
  const first = variants.find((v) => v.available) || variants[0];
  return {
    ...p, url: `/products/${p.handle}`, handle: p.handle, media, images: media.map((m) => ({ ...m, url: m.src })), featured_image: media[0], featured_media: media[0],
    variants, selected_or_first_available_variant: first, has_only_default_variant: p.hasOnlyDefault, options_with_values, options: p.optionDefs.map((o) => o.name), object_type: "product", metafields: { custom: { short_title: { value: p.title.replace(/ Sample Newborn.*$/, "") } } },
  };
};
const shaped = products.map(shapeProduct);
const byHandle = (h) => shaped.find((p) => p.handle === h);

const collection = (handle, title, list) => ({
  handle, title, url: handle === "all" ? "/collections/all" : `/collections/${handle}`, description: "", products: list, products_count: list.length, products_size: list.length,
  sort_options: [{ name: "Featured", value: "manual" }, { name: "Price, low to high", value: "price-ascending" }, { name: "Price, high to low", value: "price-descending" }, { name: "Alphabetically, A-Z", value: "title-ascending" }],
  default_sort_by: "manual", sort_by: "manual", filters: [],
});

/* ---------------------------------------------------------------- theme settings */
function jsonc(text) {
  return JSON.parse(text.replace(/^\s*\/\*[\s\S]*?\*\//, ""));
}
const settingsSchema = jsonc(read("config", "settings_schema.json"));
const settingsData = exists("config", "settings_data.json") ? jsonc(read("config", "settings_data.json")) : {};
const globalSettings = {};
for (const group of settingsSchema) for (const s of group.settings || []) if (s.id) globalSettings[s.id] = s.default ?? null;
Object.assign(globalSettings, settingsData.current && typeof settingsData.current === "object" ? settingsData.current : {});

const linklists = {
  "main-menu": { handle: "main-menu", links: [{ title: "New arrivals", url: "/collections/all", current: false }, { title: "Bodysuits", url: "/collections/bodysuits", current: false }, { title: "Knitwear", url: "/collections/knitwear", current: false }, { title: "Journal", url: "/blogs/journal", current: false }] },
  footer: { handle: "footer", links: [{ title: "Search", url: "/search" }, { title: "Shipping", url: "/policies/shipping-policy" }, { title: "Returns", url: "/policies/refund-policy" }] },
};
const pages = { "size-guide": { title: "Size guide", content: "<table><tr><th>Size</th><th>Age</th></tr><tr><td>Newborn</td><td>Up to 1 month</td></tr><tr><td>0-3M</td><td>1-3 months</td></tr></table><p><em>Sample chart for the preview.</em></p>" } };

/* ---------------------------------------------------------------- cart state */
const cartState = { items: [], note: "", attributes: {} };
const cartObject = () => {
  const items = cartState.items.map((l) => {
    const p = byHandle(l.handle);
    const v = p.variants.find((x) => x.id === l.id);
    return { key: String(l.id), id: l.id, quantity: l.quantity, url: p.url, product: p, variant: v, image: p.featured_image, original_line_price: v.price * l.quantity, final_line_price: v.price * l.quantity, product_title: p.title, title: p.title };
  });
  return { item_count: items.reduce((n, i) => n + i.quantity, 0), items, total_price: items.reduce((n, i) => n + i.final_line_price, 0), currency: { iso_code: "INR" }, note: cartState.note, attributes: cartState.attributes };
};

/* ---------------------------------------------------------------- engine */
const engine = new Liquid({ root: [path.join(ROOT, "snippets")], extname: ".liquid", jsTruthy: false, strictVariables: false, strictFilters: false, ownPropertyOnly: false });
const kwargs = (args) => Object.fromEntries(args.filter((a) => Array.isArray(a)));
engine.registerFilter("money", (c) => MONEY(Number(c) || 0));
engine.registerFilter("money_without_currency", (c) => (Number(c) / 100).toFixed(2));
engine.registerFilter("asset_url", (n) => `/assets/${n}`);
engine.registerFilter("stylesheet_tag", (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter("image_url", (img, ...a) => {
  const src = typeof img === "string" ? img : img?.src || img?.url || "";
  const o = kwargs(a);
  return src ? `${src}${o.width ? `?width=${o.width}` : ""}` : "";
});
engine.registerFilter("image_tag", function (url, ...a) {
  const o = kwargs(a);
  const attrs = Object.entries(o).filter(([k]) => !["widths", "sizes"].includes(k)).map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" ");
  return `<img src="${url}" ${o.sizes ? `sizes="${o.sizes}"` : ""} ${attrs}>`;
});
engine.registerFilter("video_tag", () => "<video controls></video>");
engine.registerFilter("external_video_tag", () => "");
engine.registerFilter("payment_button", () => '<div class="shopify-payment-button"><button type="button" class="shopify-payment-button__button">Buy it now</button></div>');
engine.registerFilter("structured_data", (p) => JSON.stringify({ "@context": "http://schema.org/", "@type": "Product", name: p?.title }));
engine.registerFilter("default_pagination", () => "");
engine.registerFilter("at_most", (n, m) => Math.min(Number(n), Number(m)));
engine.registerFilter("at_least", (n, m) => Math.max(Number(n), Number(m)));

// {% form 'product', product, class: 'x', id: 'y', data-ajax-cart: '' %} ... {% endform %}
class FormTag extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.tpls = [];
    this.raw = token.args;
    const stream = this.liquid.parser.parseStream(remain).on("tag:endform", () => stream.stop()).on("template", (t) => this.tpls.push(t)).on("end", () => { throw new Error("{% form %} not closed"); });
    stream.start();
  }
  *render(ctx, emitter) {
    const parts = this.raw.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((s) => s.trim());
    const attrs = [];
    for (const part of parts.slice(1)) {
      const m = part.match(/^([\w-]+)\s*:\s*(.*)$/);
      if (!m) continue;
      const val = yield this.liquid.evalValue(m[2], ctx);
      attrs.push(`${m[1]}="${String(val ?? "")}"`);
    }
    const type = parts[0].replace(/['"]/g, "");
    const action = type === "product" ? "/cart/add" : type === "localization" ? "/localization" : "/cart";
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8" ${attrs.join(" ")}><input type="hidden" name="form_type" value="${type}">`);
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write("</form>");
  }
}
engine.registerTag("form", FormTag);

class PaginateTag extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on("tag:endpaginate", () => stream.stop()).on("template", (t) => this.tpls.push(t)).on("end", () => { throw new Error("{% paginate %} not closed"); });
    stream.start();
  }
  *render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1, current_page: 1 } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
  }
}
engine.registerTag("paginate", PaginateTag);

class SchemaTag extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    const stream = this.liquid.parser.parseStream(remain).on("tag:endschema", () => stream.stop()).on("template", () => {}).on("end", () => { throw new Error("{% schema %} not closed"); });
    stream.start();
  }
  render() {}
}
engine.registerTag("schema", SchemaTag);

class SectionTag extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.replace(/['"]/g, "").trim(); }
  *render(ctx, emitter) { emitter.write(yield renderSection(this.name, this.name, {}, ctx)); }
}
engine.registerTag("section", SectionTag);
class SectionsTag extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.replace(/['"]/g, "").trim(); }
  *render(ctx, emitter) {
    const group = JSON.parse(read("sections", `${this.name}.json`));
    for (const id of group.order) emitter.write(yield renderSection(group.sections[id].type, id, group.sections[id].settings || {}, ctx));
  }
}
engine.registerTag("sections", SectionsTag);
class LayoutTag extends Tag { render() {} }
engine.registerTag("layout", LayoutTag);

function resolveSetting(def, value) {
  const v = value ?? def.default ?? null;
  switch (def.type) {
    case "link_list": return v ? linklists[v] || null : null;
    case "collection": return v ? collectionFor(v) : null;
    case "page": return v ? pages[v] || null : null;
    case "blog": case "image_picker": case "article": case "product": return null;
    default: return v;
  }
}
function collectionFor(handle) {
  if (handle === "all") return collection("all", "All products", shaped);
  if (handle === "bodysuits") return collection(handle, "Bodysuits", shaped.filter((p) => /Bodysuit|Romper|Sleepsuit/.test(p.title)));
  if (handle === "knitwear") return collection(handle, "Knitwear", shaped.filter((p) => p.type === "Knitwear"));
  return null;
}

async function renderSection(type, id, settingValues, parentCtx, blockData = null) {
  const file = path.join(ROOT, "sections", `${type}.liquid`);
  if (!fs.existsSync(file)) return `<!-- missing section ${type} -->`;
  const source = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const schemaMatch = source.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  const schema = schemaMatch ? JSON.parse(schemaMatch[1]) : { settings: [] };
  const settings = {};
  for (const def of schema.settings || []) if (def.id) settings[def.id] = resolveSetting(def, settingValues[def.id]);
  const blocks = (blockData?.order || []).map((bid) => {
    const b = blockData.blocks[bid];
    const def = (schema.blocks || []).find((x) => x.type === b.type) || { settings: [] };
    const bs = {};
    for (const d of def.settings || []) if (d.id) bs[d.id] = resolveSetting(d, (b.settings || {})[d.id]);
    return { id: bid, type: b.type, settings: bs, shopify_attributes: "" };
  });
  const html = await engine.parseAndRender(source, { ...parentCtx.environments, section: { id, settings, type, blocks } }, { globals: parentCtx.environments });
  return `<div id="shopify-section-${id}" class="shopify-section">${html}</div>`;
}

/* ---------------------------------------------------------------- page rendering */
function baseGlobals(url, extra = {}) {
  return {
    shop: { name: "Sample Store", currency: "INR", url: `http://localhost:${PORT}`, description: "Sample store for the theme preview" },
    settings: globalSettings,
    request: { locale: { iso_code: "en" } },
    routes: { root_url: "/", cart_url: "/cart", cart_add_url: "/cart/add", cart_change_url: "/cart/change", cart_update_url: "/cart/update", search_url: "/search", predictive_search_url: "/search/suggest", product_recommendations_url: "/recommendations/products", all_products_collection_url: "/collections/all", account_url: "/account" },
    localization: { available_countries: [], country: { iso_code: "IN" } },
    linklists, pages, cart: cartObject(), canonical_url: `http://localhost:${PORT}${url.pathname}`, page_title: "Preview", page_description: "", current_tags: null,
    content_for_header: "", ...extra,
  };
}

async function renderTemplate(templateName, url, extra = {}) {
  const jsonPath = path.join(ROOT, "templates", `${templateName}.json`);
  const globals = baseGlobals(url, { template: { name: templateName.split(".")[0] }, ...extra });
  const ctx = { environments: globals };
  let body = "";
  if (fs.existsSync(jsonPath)) {
    const t = jsonc(fs.readFileSync(jsonPath, "utf8").replace(/^﻿/, ""));
    for (const id of t.order) body += await renderSection(t.sections[id].type, id, t.sections[id].settings || {}, ctx, t.sections[id].blocks ? { blocks: t.sections[id].blocks, order: t.sections[id].block_order || Object.keys(t.sections[id].blocks) } : null);
  }
  const layout = read("layout", "theme.liquid");
  const note = '<p style="margin:0;padding:6px 12px;background:#171715;color:#fff;font:11px/1.4 sans-serif;text-align:center">Theme preview with sample data. Local approximation, not Shopify\'s renderer.</p>';
  return engine.parseAndRender(layout, { ...globals, content_for_layout: body, content_for_header: note }, { globals });
}

/* ---------------------------------------------------------------- routing */
const MIME = { ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".svg": "image/svg+xml" };
const send = (res, code, type, body) => { res.writeHead(code, { "Content-Type": type }); res.end(body); };
const json = (res, data, code = 200) => send(res, code, "application/json", JSON.stringify(data));
async function body(req) {
  const type = req.headers["content-type"] || "";
  if (type.includes("json")) { const chunks = []; for await (const c of req) chunks.push(c); return JSON.parse(Buffer.concat(chunks).toString() || "{}"); }
  const request = new Request(`http://x${req.url}`, { method: "POST", headers: req.headers, body: Readable.toWeb(req), duplex: "half" });
  const fd = await request.formData();
  return Object.fromEntries(fd.entries());
}
const cartSections = async (names, url) => {
  const out = {};
  const globals = baseGlobals(url);
  for (const n of String(names || "").split(",").filter(Boolean)) out[n] = await renderSection(n, n, {}, { environments: globals });
  return out;
};
function addItems(items) {
  for (const { id, quantity } of items) {
    const p = shaped.find((x) => x.variants.some((v) => v.id === Number(id)));
    if (!p) throw Object.assign(new Error("Cannot find variant"), { status: 404 });
    const v = p.variants.find((x) => x.id === Number(id));
    if (!v.available) throw Object.assign(new Error(`All ${p.title} are sold out.`), { status: 422 });
    const line = cartState.items.find((l) => l.id === Number(id));
    if (line) line.quantity += Number(quantity) || 1; else cartState.items.push({ id: Number(id), handle: p.handle, quantity: Number(quantity) || 1 });
  }
}

function productFilters(list, q) {
  const filters = [];
  const inStock = q.get("filter.v.availability") === "1";
  const max = Math.max(...list.map((p) => p.price));
  filters.push({ label: "Availability", type: "list", param_name: "filter.v.availability", active_values: inStock ? [{ label: "In stock", url_to_remove: "?" }] : [], values: [{ label: "In stock", count: list.filter((p) => p.available).length, param_name: "filter.v.availability", value: "1", active: inStock }] });
  filters.push({ label: "Price", type: "price_range", range_max: max, min_value: { param_name: "filter.v.price.gte", value: q.get("filter.v.price.gte") ? Number(q.get("filter.v.price.gte")) * 100 : null }, max_value: { param_name: "filter.v.price.lte", value: q.get("filter.v.price.lte") ? Number(q.get("filter.v.price.lte")) * 100 : null }, url_to_remove: "?" });
  return filters;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;
    if (p.startsWith("/assets/")) {
      const f = path.join(ROOT, "assets", p.slice(8));
      return fs.existsSync(f) ? send(res, 200, MIME[path.extname(f)] || "application/octet-stream", fs.readFileSync(f)) : send(res, 404, "text/plain", "not found");
    }
    if (p.startsWith("/demo/")) {
      const f = path.join(ROOT, "public", p);
      return fs.existsSync(f) ? send(res, 200, MIME[path.extname(f)] || "image/jpeg", fs.readFileSync(f)) : send(res, 404, "text/plain", "not found");
    }
    if (p === "/__reset") { cartState.items = []; cartState.note = ""; cartState.attributes = {}; return json(res, { ok: true }); }
    if (p === "/cart/add.js" && req.method === "POST") {
      const b = await body(req);
      try {
        addItems(b.items ? b.items : [{ id: b.id, quantity: b.quantity }]);
      } catch (e) { return json(res, { status: e.status || 422, message: "Cart Error", description: e.message }, e.status || 422); }
      return json(res, { ok: true, sections: await cartSections(b.sections, url) });
    }
    if (p === "/cart/change.js" && req.method === "POST") {
      const b = await body(req);
      const line = cartState.items[Number(b.line) - 1];
      if (line) { if (Number(b.quantity) <= 0) cartState.items.splice(Number(b.line) - 1, 1); else line.quantity = Number(b.quantity); }
      return json(res, { ...cartObject(), sections: await cartSections(b.sections, url) });
    }
    if (p === "/cart/update.js" && req.method === "POST") {
      const b = await body(req);
      if (typeof b.note === "string") cartState.note = b.note;
      if (b.attributes) cartState.attributes = Object.fromEntries(Object.entries(b.attributes).filter(([, v]) => v));
      return json(res, cartObject());
    }
    if (p === "/cart" && url.searchParams.get("sections")) return json(res, await cartSections(url.searchParams.get("sections"), url));
    if (p === "/cart" && req.method === "POST") { const b = await body(req); if (typeof b.note === "string") cartState.note = b.note; return send(res, 200, "text/html", "<p>Checkout is handled by Shopify. (Preview stops here.)</p>"); }
    if (p === "/search/suggest.json") {
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const hits = shaped.filter((x) => x.title.toLowerCase().includes(q)).slice(0, 6);
      return json(res, { resources: { results: { products: hits.map((x) => ({ id: x.id, title: x.title.replace(/ Sample Newborn.*$/, ""), handle: x.handle, url: x.url, price: (x.price / 100).toFixed(2), available: x.available, featured_image: { url: x.featured_image.src } })), collections: q.length > 2 && "knit".includes(q.slice(0, 4)) ? [{ title: "Knitwear", url: "/collections/knitwear" }] : [] } } });
    }
    if (p === "/recommendations/products") {
      const id = Number(url.searchParams.get("product_id"));
      const others = shaped.filter((x) => x.id !== id).slice(0, 4);
      const globals = baseGlobals(url, { recommendations: { performed: true, products_count: others.length, products: others } });
      return send(res, 200, "text/html", await renderSection("product-recommendations", "product-recommendations", {}, { environments: globals }));
    }

    let m;
    if (p === "/") return send(res, 200, "text/html", await renderTemplate("index", url));
    if ((m = p.match(/^\/collections\/([\w-]+)$/))) {
      let col = collectionFor(m[1]) || collectionFor("all");
      const q = url.searchParams;
      let list = col.products.slice();
      if (q.get("filter.v.availability") === "1") list = list.filter((x) => x.available);
      if (q.get("filter.v.price.gte")) list = list.filter((x) => x.price >= Number(q.get("filter.v.price.gte")) * 100);
      if (q.get("filter.v.price.lte")) list = list.filter((x) => x.price <= Number(q.get("filter.v.price.lte")) * 100);
      const sort = q.get("sort_by");
      if (sort === "price-ascending") list.sort((a, b) => a.price - b.price);
      if (sort === "price-descending") list.sort((a, b) => b.price - a.price);
      col = { ...col, products: list, products_count: list.length, filters: productFilters(col.products, q), sort_by: sort || "manual" };
      return send(res, 200, "text/html", await renderTemplate("collection", url, { collection: col }));
    }
    if ((m = p.match(/^\/products\/([\w-]+)$/))) {
      const product = byHandle(m[1]);
      if (!product) return send(res, 404, "text/html", "<h1>Not found</h1>");
      if (url.searchParams.get("view") === "card") {
        const globals = baseGlobals(url, { product });
        return send(res, 200, "text/html", await engine.parseAndRender("{% render 'product-card', product: product %}", globals, { globals }));
      }
      return send(res, 200, "text/html", await renderTemplate("product", url, { product, page_title: product.metafields.custom.short_title.value }));
    }
    if (p === "/cart") return send(res, 200, "text/html", await renderTemplate("cart", url));
    if (p === "/pages/saved") return send(res, 200, "text/html", await renderTemplate("page.saved", url, { page: { title: "Saved", content: "" } }));
    if (p === "/search") {
      const q = url.searchParams.get("q") || "";
      const results = q ? shaped.filter((x) => x.title.toLowerCase().includes(q.toLowerCase())) : [];
      return send(res, 200, "text/html", await renderTemplate("search", url, { search: { performed: Boolean(q), terms: q, results, results_count: results.length } }));
    }
    send(res, 404, "text/html", await renderTemplate("404", url));
  } catch (e) {
    console.error(e);
    send(res, 500, "text/plain", String(e.stack || e));
  }
}).listen(PORT, () => console.log(`Theme preview (sample data) on http://localhost:${PORT}`));
