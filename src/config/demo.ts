/**
 * DEMO overrides, applied only when NEXT_PUBLIC_DEMO=true (see `npm run demo`).
 * Sample copy and generated artwork (public/demo) for previewing the storefront — never real brand content.
 */
export const demoOverrides = {
  description: "Considered clothing in natural fibres and quiet colours.",
  nav: {
    left: [
      { label: "Shop", href: "/shop" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Knitwear", href: "/collections/knitwear" },
      { label: "Outerwear", href: "/collections/outerwear" },
    ],
    mobile: [
      { label: "Shop", href: "/shop" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Knitwear", href: "/collections/knitwear" },
      { label: "Outerwear", href: "/collections/outerwear" },
      { label: "Accessories", href: "/collections/accessories" },
      { label: "Journal", href: "/journal" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Account", href: "/account" },
    ],
  },
  home: {
    captionTone: "dark",
    hero: {
      main: {
        image: { src: "/demo/scene-heroMain.jpg", alt: "Linen, tailoring and a leather tote against an arched window", position: "50% 45%" },
        eyebrow: "Spring Collection",
        caption: "The Linen & Tailoring Edit",
        href: "/collections/featured",
        linkLabel: "Shop the edit",
      },
      secondary: {
        image: { src: "/demo/scene-heroSecondary.jpg", alt: "A merino scarf draped over olive hills", position: "50% 50%" },
        caption: "Merino, in three tones",
        href: "/collections/accessories",
      },
    },
    panels: [
      { eyebrow: "Knitwear", caption: "Cashmere in oat and camel", href: "/collections/knitwear", image: { src: "/demo/scene-panelKnit.jpg", alt: "A cashmere crew knit on a clay circle", position: "50% 50%" }, ratio: "4 / 5" },
      { eyebrow: "Tailoring", caption: "The wide-leg wool trouser", href: "/products/wide-leg-wool-trouser", image: { src: "/demo/scene-panelTrouser.jpg", alt: "A wide-leg trouser and tote in an arch", position: "50% 50%" }, ratio: "3 / 4" },
    ],
    newArrivals: { collection: "new-arrivals", title: "New Arrivals", count: 8 },
    story: {
      eyebrow: "Campaign",
      headline: "Made to be lived in.",
      body: "Natural fibres, quiet colours and cuts designed to be worn often and kept for years.",
      href: "/about",
      linkLabel: "Read the story",
      image: { src: "/demo/scene-story.jpg", alt: "A trench coat and scarf against warm dunes", position: "50% 50%" },
    },
    featured: {
      collection: "featured",
      eyebrow: "Featured collection",
      title: "The Linen & Tailoring Edit",
      body: "Light layers and sharp lines for the warmer months.",
      image: { src: "/demo/scene-featured.jpg", alt: "Stacked linen shirts on sage", position: "50% 50%" },
    },
    statement: "Quiet clothes, made with care — for the way you actually live.",
  },
  shopTheLook: {
    title: "Shop the look",
    image: { src: "/demo/scene-look.jpg", alt: "Blazer, trouser, scarf and tote", position: "50% 50%" },
    hotspots: [
      { x: 40, y: 38, handle: "tailored-blazer" },
      { x: 40, y: 74, handle: "wide-leg-wool-trouser" },
      { x: 80, y: 27, handle: "merino-scarf" },
      { x: 76, y: 72, handle: "leather-tote" },
    ],
  },
  socialFeed: {
    title: "On Instagram",
    handle: "arjunta",
    posts: [1, 2, 3, 4, 5, 6].map((n) => ({ image: `/demo/social-${n}.jpg`, href: `https://www.instagram.com/?demo=${n}`, alt: `Sample post ${n}` })),
  },
  footer: { social: [{ label: "Instagram", href: "https://www.instagram.com/" }] },
  support: { email: "hello@arjunta.example", phone: "+91 00000 00000", hours: "Mon–Sat, 10:00–18:00 IST", address: "" },
  commerce: {
    promises: ["Free returns within 14 days", "Complimentary gift message"],
    sizeGuide: {
      unit: "cm",
      measurements: ["Chest", "Waist"],
      note: "Sample measurements for the demo. Replace with your own size chart.",
      rows: [
        { size: "XS", ranges: { Chest: [78, 83], Waist: [60, 65] } },
        { size: "S", ranges: { Chest: [84, 89], Waist: [66, 71] } },
        { size: "M", ranges: { Chest: [90, 95], Waist: [72, 77] } },
        { size: "L", ranges: { Chest: [96, 102], Waist: [78, 84] } },
        { size: "XL", ranges: { Chest: [103, 110], Waist: [85, 92] } },
      ],
    },
  },
  productInfo: {
    shipping: "Dispatched within 1–2 working days. Free shipping above the threshold shown in your bag.",
    returns: "Return unworn items within 14 days of delivery for a refund or exchange.",
  },
};

export const isDemo = process.env.NEXT_PUBLIC_DEMO === "true";
