// Single source of truth for DEMO products: used by the image generator and the demo dataset.
// Everything here is sample content for previewing the storefront. It is NOT real inventory.

export const COLOR = {
  ivory: "#EFE9DC", bone: "#E4DCCB", sand: "#D2C3A8", stone: "#B5AC9C", oat: "#D6C6A6", camel: "#B58B5E",
  clay: "#B27A62", terracotta: "#A05F47", olive: "#767557", sage: "#A0A68A", charcoal: "#33332F", black: "#1B1B19",
  sky: "#A8BBCA", blush: "#E1C6BB", white: "#F7F5F0", tan: "#A9733F", grey: "#9A9893",
};

const S5 = ["XS", "S", "M", "L", "XL"];

/** kind selects the silhouette drawn by the generator. */
export const PRODUCTS = [
  {
    handle: "linen-overshirt", title: "Linen Overshirt", kind: "shirt", type: "Tops", price: 8900,
    colors: [["Ivory", COLOR.ivory], ["Sand", COLOR.sand], ["Olive", COLOR.olive]], sizes: S5, soldOut: [["Olive", "XS"], ["Olive", "S"]],
    desc: "<p>A relaxed, boxy overshirt in a washed linen weave. Worn open over a tee or buttoned to the collar, it softens with every wash.</p><p>Chest pocket, shell buttons and a curved hem.</p>",
    materials: "100% linen", care: "Machine wash cold. Dry flat. Warm iron.", collections: ["new-arrivals", "featured", "tops"],
  },
  {
    handle: "cashmere-crew-knit", title: "Cashmere Crew Knit", kind: "knit", type: "Knitwear", price: 14500,
    colors: [["Oat", COLOR.oat], ["Camel", COLOR.camel], ["Charcoal", COLOR.charcoal]], sizes: S5, soldOut: [["Charcoal", "XL"]],
    desc: "<p>A fine-gauge crew neck with a soft hand and a clean ribbed finish. Light enough to layer, warm enough to stand alone.</p>",
    materials: "100% cashmere", care: "Hand wash cool or dry clean. Dry flat.", collections: ["new-arrivals", "knitwear"],
  },
  {
    handle: "silk-slip-dress", title: "Silk Slip Dress", kind: "dress", type: "Dresses", price: 18900,
    colors: [["Ivory", COLOR.ivory], ["Clay", COLOR.clay], ["Black", COLOR.black]], sizes: ["XS", "S", "M", "L"], soldOut: [],
    desc: "<p>A bias-cut slip with a soft cowl neckline and adjustable straps. It moves with the body and falls to a fluid midi length.</p>",
    materials: "100% silk", care: "Dry clean only.", collections: ["new-arrivals", "dresses"],
  },
  {
    handle: "wide-leg-wool-trouser", title: "Wide-Leg Wool Trouser", kind: "trouser", type: "Trousers", price: 11200,
    colors: [["Charcoal", COLOR.charcoal], ["Stone", COLOR.stone]], sizes: S5, soldOut: [["Stone", "XS"], ["Stone", "XL"]],
    desc: "<p>A high-waisted trouser with a generous leg and a sharp front crease. Cut from a mid-weight wool that drapes cleanly.</p>",
    materials: "98% wool, 2% elastane", care: "Dry clean. Press with a cloth.", collections: ["new-arrivals", "trousers"],
  },
  {
    handle: "tailored-blazer", title: "Tailored Blazer", kind: "blazer", type: "Outerwear", price: 21500,
    colors: [["Black", COLOR.black], ["Stone", COLOR.stone]], sizes: S5, soldOut: [],
    desc: "<p>A single-breasted blazer with soft shoulders and a long, clean line. Half-lined for ease and structure that never feels stiff.</p>",
    materials: "Wool blend, viscose lining", care: "Dry clean only.", collections: ["new-arrivals", "outerwear", "featured"],
  },
  {
    handle: "merino-scarf", title: "Merino Scarf", kind: "scarf", type: "Accessories", price: 5900,
    colors: [["Camel", COLOR.camel], ["Grey", COLOR.grey], ["Blush", COLOR.blush]], sizes: null, soldOut: [],
    desc: "<p>A generously sized scarf in brushed merino with a hand-finished fringe. Wrap it, drape it or fold it twice.</p>",
    materials: "100% merino wool", care: "Hand wash cool. Dry flat.", collections: ["accessories", "knitwear", "new-arrivals"],
  },
  {
    handle: "leather-tote", title: "Leather Tote", kind: "tote", type: "Accessories", price: 24000,
    colors: [["Tan", COLOR.tan], ["Black", COLOR.black]], sizes: null, soldOut: [["Black", "Default"]],
    desc: "<p>A structured everyday tote with a roomy interior, flat base and rolled handles. Vegetable-tanned leather develops a patina over time.</p>",
    materials: "Full-grain leather", care: "Wipe with a soft dry cloth. Condition occasionally.", collections: ["accessories", "new-arrivals"],
  },
  {
    handle: "cotton-poplin-shirt", title: "Cotton Poplin Shirt", kind: "shirt", type: "Tops", price: 6900,
    colors: [["White", COLOR.white], ["Sky", COLOR.sky]], sizes: S5, soldOut: [],
    desc: "<p>A crisp, classic shirt with a relaxed fit and a soft collar. The everyday piece you reach for first.</p>",
    materials: "100% cotton poplin", care: "Machine wash warm. Iron while damp.", collections: ["tops", "featured"],
  },
  {
    handle: "pleated-midi-skirt", title: "Pleated Midi Skirt", kind: "skirt", type: "Skirts", price: 9800,
    colors: [["Olive", COLOR.olive], ["Black", COLOR.black]], sizes: ["XS", "S", "M", "L"], soldOut: [],
    desc: "<p>Knife pleats from a fitted waist to a swinging midi hem. Pair with the knit or the overshirt.</p>",
    materials: "Recycled polyester crepe", care: "Machine wash cold, gentle cycle. Hang dry.", collections: ["new-arrivals", "skirts"],
  },
  {
    handle: "belted-trench-coat", title: "Belted Trench Coat", kind: "coat", type: "Outerwear", price: 32000, compareAt: 36000,
    colors: [["Sand", COLOR.sand]], sizes: S5, soldOut: [],
    desc: "<p>A long, double-breasted trench with a storm flap, epaulettes and a belt that cinches or hangs loose.</p>",
    materials: "Cotton gabardine", care: "Dry clean only.", collections: ["outerwear", "featured"],
  },
  {
    handle: "ribbed-knit-tank", title: "Ribbed Knit Tank", kind: "tank", type: "Knitwear", price: 3900,
    colors: [["Ivory", COLOR.ivory], ["Clay", COLOR.clay], ["Charcoal", COLOR.charcoal]], sizes: ["XS", "S", "M", "L"], soldOut: [],
    desc: "<p>A close-fitting tank in a stretch rib that holds its shape. Layer under the blazer or wear on its own.</p>",
    materials: "Cotton-modal blend", care: "Machine wash cold. Lay flat to dry.", collections: ["knitwear", "tops"],
  },
  {
    handle: "leather-belt", title: "Leather Belt", kind: "belt", type: "Accessories", price: 4800,
    colors: [["Tan", COLOR.tan], ["Black", COLOR.black]], sizes: ["S", "M", "L"], soldOut: [["Tan", "S"], ["Tan", "M"], ["Tan", "L"], ["Black", "S"], ["Black", "M"], ["Black", "L"]],
    desc: "<p>A slim belt with a brushed brass buckle. Cut from a single piece of leather and edge-finished by hand.</p>",
    materials: "Full-grain leather, brass", care: "Wipe clean with a dry cloth.", collections: ["accessories"],
  },
];

export const COLLECTIONS = {
  "new-arrivals": { title: "New Arrivals", description: "The latest pieces, just in." },
  featured: { title: "The Linen & Tailoring Edit", description: "Light layers and sharp lines for the warmer months." },
  knitwear: { title: "Knitwear", description: "Soft, considered knits in natural tones." },
  outerwear: { title: "Outerwear", description: "Coats and jackets cut for layering." },
  accessories: { title: "Accessories", description: "Leather, wool and finishing touches." },
  tops: { title: "Tops", description: "Shirts, tanks and everyday essentials." },
  dresses: { title: "Dresses", description: "Fluid silhouettes for day into evening." },
  trousers: { title: "Trousers", description: "Tailored and relaxed cuts." },
  skirts: { title: "Skirts", description: "Pleated and fluid shapes." },
};

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
