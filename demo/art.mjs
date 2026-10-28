// Procedural editorial artwork for the DEMO storefront: garment silhouettes on tonal studio backdrops.
// Original illustrations drawn in code — not photography and not stock imagery.

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => "#" + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
export const shade = (h, amt) => toHex(hex(h).map((v) => (amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
export const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

/* ------------------------------------------------------------------ garments (800 x 1000 canvas, centred on x=400) */

const G = {
  shirt: (c) => ({
    body: "M300 235 L362 205 Q400 240 438 205 L500 235 L604 268 L694 768 L628 782 L548 440 L548 800 Q400 822 252 800 L252 440 L172 782 L106 768 L196 268 Z",
    detail: `
      <path d="M362 205 Q400 252 438 205 L466 222 Q400 290 334 222 Z" fill="${shade(c, 0.18)}"/>
      <path d="M400 262 V808" stroke="${shade(c, -0.22)}" stroke-width="3"/>
      ${[300, 380, 460, 540, 620, 700, 770].map((y) => `<circle cx="412" cy="${y}" r="5.5" fill="${shade(c, -0.3)}"/>`).join("")}
      <rect x="440" y="330" width="78" height="84" rx="3" fill="none" stroke="${shade(c, -0.2)}" stroke-width="3"/>
      <path d="M122 742 L188 756 M678 742 L612 756" stroke="${shade(c, -0.3)}" stroke-width="5"/>`,
  }),
  knit: (c) => ({
    body: "M312 215 Q400 262 488 215 L566 238 L682 610 L596 636 L544 410 L544 805 L256 805 L256 410 L204 636 L118 610 L234 238 Z",
    detail: `
      <path d="M312 215 Q400 262 488 215 L476 238 Q400 288 324 238 Z" fill="${shade(c, -0.14)}"/>
      ${Array.from({ length: 14 }, (_, i) => `<path d="M${262 + i * 20.3} 770 V805" stroke="${shade(c, -0.25)}" stroke-width="2"/>`).join("")}
      <path d="M256 770 H544" stroke="${shade(c, -0.18)}" stroke-width="3"/>
      <path d="M118 610 L204 636 M682 610 L596 636" stroke="${shade(c, -0.25)}" stroke-width="6"/>
      ${Array.from({ length: 10 }, (_, i) => `<path d="M${300 + i * 22} 300 V740" stroke="${shade(c, -0.06)}" stroke-width="1.5" opacity=".5"/>`).join("")}`,
  }),
  dress: (c) => ({
    body: "M338 120 L358 120 L384 290 Q400 312 416 290 L442 120 L462 120 L474 330 Q500 400 530 470 Q600 700 660 930 Q400 972 140 930 Q200 700 270 470 Q300 400 326 330 Z",
    detail: `
      <path d="M384 290 Q400 330 416 290" fill="none" stroke="${shade(c, -0.25)}" stroke-width="3"/>
      <path d="M330 470 Q400 520 470 470" fill="none" stroke="${shade(c, -0.2)}" stroke-width="3"/>
      <path d="M400 520 Q380 740 330 940 M400 520 Q420 740 470 940 M400 520 Q300 740 230 935 M400 520 Q500 740 570 935" fill="none" stroke="${shade(c, 0.2)}" stroke-width="3" opacity=".55"/>`,
  }),
  trouser: (c) => ({
    body: "M282 150 H518 V196 L596 925 H412 L400 400 L388 925 H204 L282 196 Z",
    detail: `
      <rect x="282" y="150" width="236" height="42" fill="${shade(c, -0.1)}"/>
      <path d="M400 192 V400" stroke="${shade(c, -0.3)}" stroke-width="3"/>
      <circle cx="400" cy="171" r="7" fill="${shade(c, -0.35)}"/>
      <path d="M296 200 L246 925 M504 200 L554 925" stroke="${shade(c, 0.16)}" stroke-width="3" opacity=".55"/>
      <path d="M300 205 Q350 250 395 232 M500 205 Q450 250 405 232" fill="none" stroke="${shade(c, -0.25)}" stroke-width="3"/>`,
  }),
  blazer: (c) => ({
    body: "M296 205 L362 172 L400 310 L438 172 L504 205 L664 336 L630 770 L566 748 L566 835 L234 835 L234 748 L170 770 L136 336 Z",
    detail: `
      <path d="M362 172 L400 310 L330 500 L300 330 Z M438 172 L400 310 L470 500 L500 330 Z" fill="${shade(c, 0.12)}" stroke="${shade(c, -0.25)}" stroke-width="2"/>
      <path d="M400 310 V835" stroke="${shade(c, -0.3)}" stroke-width="3"/>
      <circle cx="414" cy="520" r="9" fill="${shade(c, -0.4)}"/><circle cx="414" cy="620" r="9" fill="${shade(c, -0.4)}"/>
      <path d="M270 640 H350 M450 640 H530" stroke="${shade(c, -0.3)}" stroke-width="4"/>
      <path d="M234 748 V835 M566 748 V835" stroke="${shade(c, -0.14)}" stroke-width="2"/>`,
  }),
  scarf: (c) => ({
    body: "M318 110 Q368 80 440 112 L496 770 Q404 826 322 770 Z",
    detail: `
      <path d="M440 112 Q520 150 560 300 L580 760 Q540 806 496 770 Z" fill="${shade(c, -0.12)}"/>
      ${Array.from({ length: 16 }, (_, i) => `<path d="M${326 + i * 10.5} ${772 - Math.abs(i - 8) * 1.4} v52" stroke="${shade(c, -0.1)}" stroke-width="3" stroke-linecap="round"/>`).join("")}
      <path d="M330 300 Q400 340 470 300 M326 480 Q400 520 482 480 M330 640 Q400 680 490 640" fill="none" stroke="${shade(c, -0.12)}" stroke-width="2" opacity=".6"/>`,
  }),
  tote: (c) => ({
    body: "M190 360 H610 L656 882 H144 Z",
    detail: `
      <path d="M296 362 C296 150 504 150 504 362" fill="none" stroke="${shade(c, -0.2)}" stroke-width="26" stroke-linecap="round"/>
      <path d="M296 362 C296 170 504 170 504 362" fill="none" stroke="${shade(c, 0.15)}" stroke-width="6" stroke-linecap="round"/>
      <path d="M190 360 H610" stroke="${shade(c, -0.3)}" stroke-width="6"/>
      <path d="M170 600 H630" stroke="${shade(c, -0.12)}" stroke-width="2" stroke-dasharray="8 6"/>
      <rect x="372" y="420" width="56" height="40" rx="4" fill="${shade(c, -0.18)}"/>`,
  }),
  skirt: (c) => ({
    body: "M298 200 H502 V244 L650 930 H150 L298 244 Z",
    detail: `
      <rect x="298" y="200" width="204" height="44" fill="${shade(c, -0.1)}"/>
      ${Array.from({ length: 17 }, (_, i) => { const t = i / 16; return `<path d="M${298 + t * 204} 244 L${150 + t * 500} 930" stroke="${shade(c, i % 2 ? 0.14 : -0.16)}" stroke-width="3" opacity=".75"/>`; }).join("")}`,
  }),
  coat: (c) => ({
    body: "M296 160 L360 138 L400 270 L440 138 L504 160 L610 196 L706 830 L640 844 L606 440 L606 940 H194 L194 440 L160 844 L94 830 L190 196 Z",
    detail: `
      <path d="M360 138 L400 270 L320 470 L300 270 Z M440 138 L400 270 L480 470 L500 270 Z" fill="${shade(c, 0.12)}" stroke="${shade(c, -0.22)}" stroke-width="2"/>
      <rect x="160" y="540" width="480" height="46" fill="${shade(c, -0.15)}"/><rect x="384" y="534" width="32" height="58" rx="4" fill="none" stroke="${shade(c, -0.45)}" stroke-width="5"/>
      ${[330, 420, 640, 740].map((y) => `<circle cx="352" cy="${y}" r="9" fill="${shade(c, -0.4)}"/><circle cx="448" cy="${y}" r="9" fill="${shade(c, -0.4)}"/>`).join("")}
      <path d="M296 160 L330 205 L350 160 M504 160 L470 205 L450 160" fill="${shade(c, -0.12)}"/>
      <path d="M400 270 V940" stroke="${shade(c, -0.25)}" stroke-width="2"/>`,
  }),
  tank: (c) => ({
    body: "M322 140 L364 140 Q400 340 436 140 L478 140 L544 430 L534 830 H266 L256 430 Z",
    detail: Array.from({ length: 22 }, (_, i) => `<path d="M${270 + i * 12.5} 440 V820" stroke="${shade(c, -0.1)}" stroke-width="2" opacity=".55"/>`).join(""),
  }),
  belt: (c) => ({
    body: "M110 468 H690 Q704 468 704 482 V518 Q704 532 690 532 H110 Q96 532 96 518 V482 Q96 468 110 468 Z",
    detail: `
      <rect x="96" y="440" width="104" height="120" rx="14" fill="none" stroke="#B89B5A" stroke-width="16"/>
      <path d="M148 440 V560" stroke="#B89B5A" stroke-width="10"/>
      ${[300, 360, 420, 480, 540, 600].map((x) => `<circle cx="${x}" cy="500" r="7" fill="${shade(c, -0.4)}"/>`).join("")}
      <path d="M110 476 H690 M110 524 H690" stroke="${shade(c, -0.25)}" stroke-width="1.5" stroke-dasharray="6 5"/>`,
  }),
};

let uid = 0;
/** One garment as an SVG group, with soft shading and a ground shadow. */
export function garment(kind, color, { x = 0, y = 0, scale = 1, rot = 0, shadow = true } = {}) {
  const g = G[kind](color);
  const id = `g${uid++}`;
  const base = "translate(" + x + " " + y + ") rotate(" + rot + " 400 500) scale(" + scale + ")";
  return `
  <g transform="${base}">
    <defs>
      <linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0.3">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/>
      </linearGradient>
    </defs>
    ${shadow ? `<ellipse cx="400" cy="${kind === "belt" ? 600 : 960}" rx="${kind === "belt" ? 280 : 250}" ry="22" fill="#000" opacity=".16" filter="url(#blur)"/>` : ""}
    <path d="${g.body}" fill="${color}"/>
    <path d="${g.body}" fill="url(#${id})"/>
    ${g.detail}
    <path d="${g.body}" fill="none" stroke="${shade(color, -0.3)}" stroke-width="2.5" stroke-linejoin="round" opacity=".7"/>
  </g>`;
}

/* ------------------------------------------------------------------ shared svg pieces */

export const defs = `
  <defs>
    <filter id="blur" x="-30%" y="-300%" width="160%" height="700%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer>
    </filter>
  </defs>`;

export const grain = (w, h) => `<rect width="${w}" height="${h}" filter="url(#grain)" opacity="1" style="mix-blend-mode:multiply"/>`;

export const backdrop = (w, h, top, bottom, floorY = 0.82) => `
  <defs><linearGradient id="bg${w}${h}${top.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
  <radialGradient id="vg${w}${h}" cx=".5" cy=".4" r=".8"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg${w}${h}${top.slice(1)})"/>
  <rect y="${h * floorY}" width="${w}" height="${h * (1 - floorY)}" fill="${shade(bottom, -0.07)}" opacity=".7"/>
  <rect width="${w}" height="${h}" fill="url(#vg${w}${h})"/>`;

export const arch = (cx, baseY, w, h, fill, opacity = 1) =>
  `<path d="M${cx - w / 2} ${baseY} V${baseY - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${baseY - h + w / 2} V${baseY} Z" fill="${fill}" opacity="${opacity}"/>`;

export const disc = (cx, cy, r, fill, opacity = 1, blur = false) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"${blur ? ' filter="url(#soft)"' : ""}/>`;

const wrap = (w, h, inner) => `<!doctype html><html><body style="margin:0;background:#ddd"><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${inner}${grain(w, h)}</svg></body></html>`;

/* ------------------------------------------------------------------ product images */

/** Front view: garment centred on a tonal studio backdrop that complements the garment colour. */
export function productFront(kind, color, i = 0) {
  const w = 1000, h = 1250;
  const dark = hex(color).reduce((a, b) => a + b, 0) < 300;
  const tints = [["#EDE7DA", "#DDD3C0"], ["#E8DFD2", "#D5C7B3"], ["#E3E4DA", "#CDD0BE"], ["#EAE0DC", "#D8C5BD"]];
  const [top, bottom] = dark ? ["#E6DFD2", "#CFC4B1"] : tints[i % tints.length];
  const s = kind === "belt" ? 1.05 : kind === "scarf" ? 1.05 : 1.1;
  return wrap(w, h, `${backdrop(w, h, top, bottom, 0.84)}
    ${disc(w * 0.5, h * 0.4, 330, mix(top, "#ffffff", 0.45), 0.55, true)}
    ${garment(kind, color, { x: (w - 800 * s) / 2, y: (h - 1000 * s) / 2 - 10, scale: s })}`);
}

/** Close-up of fabric, weave and a construction detail. */
export function productDetail(kind, color) {
  const w = 1000, h = 1250;
  const d = shade(color, -0.22), l = shade(color, 0.16);
  const texture = {
    knit: Array.from({ length: 34 }, (_, i) => `<path d="M${i * 30} 0 q15 ${h / 2} 0 ${h}" stroke="${d}" stroke-width="3" fill="none" opacity=".35"/>`).join(""),
    tank: Array.from({ length: 34 }, (_, i) => `<path d="M${i * 30} 0 V${h}" stroke="${d}" stroke-width="5" opacity=".3"/>`).join(""),
    scarf: Array.from({ length: 60 }, (_, i) => `<path d="M0 ${i * 22} Q${w / 2} ${i * 22 + 10} ${w} ${i * 22}" stroke="${d}" stroke-width="2" fill="none" opacity=".3"/>`).join(""),
    tote: Array.from({ length: 140 }, (_, i) => `<circle cx="${(i * 197) % w}" cy="${(i * 113) % h}" r="${2 + (i % 4)}" fill="${d}" opacity=".18"/>`).join(""),
    belt: Array.from({ length: 140 }, (_, i) => `<circle cx="${(i * 197) % w}" cy="${(i * 113) % h}" r="${2 + (i % 4)}" fill="${d}" opacity=".18"/>`).join(""),
  }[kind] ?? Array.from({ length: 70 }, (_, i) => `<path d="M${(i * 31) % w} 0 L${((i * 31) % w) - 140} ${h}" stroke="${i % 2 ? d : l}" stroke-width="2" opacity=".22"/>`).join("");
  const feature = {
    shirt: `<circle cx="680" cy="470" r="64" fill="${shade(color, -0.12)}" stroke="${d}" stroke-width="4"/><circle cx="665" cy="455" r="6" fill="${d}"/><circle cx="695" cy="455" r="6" fill="${d}"/><circle cx="665" cy="487" r="6" fill="${d}"/><circle cx="695" cy="487" r="6" fill="${d}"/><path d="M0 700 Q400 560 1000 640" stroke="${d}" stroke-width="3" stroke-dasharray="14 9" fill="none"/>`,
    blazer: `<path d="M0 0 L520 700 L0 1250 Z" fill="${l}" opacity=".5"/><circle cx="690" cy="760" r="68" fill="${shade(color, -0.3)}"/><circle cx="690" cy="760" r="44" fill="none" stroke="${shade(color, -0.55)}" stroke-width="4"/>`,
    coat: `<rect x="0" y="560" width="1000" height="110" fill="${d}" opacity=".7"/><rect x="560" y="540" width="120" height="150" rx="12" fill="none" stroke="#B89B5A" stroke-width="16"/>`,
    trouser: `<path d="M500 0 V1250" stroke="${d}" stroke-width="5"/><path d="M0 260 Q500 360 1000 260" stroke="${d}" stroke-width="4" fill="none"/>`,
    skirt: Array.from({ length: 10 }, (_, i) => `<path d="M${i * 110} 0 V${h}" stroke="${i % 2 ? l : d}" stroke-width="22" opacity=".28"/>`).join(""),
    dress: `<path d="M0 1000 Q500 560 1000 900" fill="none" stroke="${l}" stroke-width="70" opacity=".4"/><path d="M0 700 Q500 300 1000 640" fill="none" stroke="${d}" stroke-width="40" opacity=".18"/>`,
    knit: `<path d="M0 940 H1000" stroke="${d}" stroke-width="7"/><path d="M0 1080 H1000" stroke="${d}" stroke-width="7"/>`,
    tank: `<path d="M0 940 H1000" stroke="${d}" stroke-width="5"/>`,
    scarf: Array.from({ length: 28 }, (_, i) => `<path d="M${i * 36 + 10} 980 v230" stroke="${d}" stroke-width="7" stroke-linecap="round"/>`).join(""),
    tote: `<path d="M0 300 H1000" stroke="${d}" stroke-width="8"/><path d="M0 330 H1000" stroke="${l}" stroke-width="3" stroke-dasharray="16 10"/><rect x="380" y="560" width="240" height="160" rx="12" fill="${shade(color, -0.12)}" stroke="${d}" stroke-width="4"/>`,
    belt: `<rect x="60" y="440" width="420" height="380" rx="46" fill="none" stroke="#B89B5A" stroke-width="40"/><path d="M270 440 V820" stroke="#B89B5A" stroke-width="26"/><path d="M0 560 H1000 M0 700 H1000" stroke="${d}" stroke-width="3" stroke-dasharray="14 10"/>`,
  }[kind] ?? "";
  return wrap(w, h, `<rect width="${w}" height="${h}" fill="${color}"/>${texture}${feature}
    <rect width="${w}" height="${h}" fill="url(#dv)"/><defs><linearGradient id="dv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient></defs>`);
}

/* ------------------------------------------------------------------ editorial scenes */

const hanger = (cx, y, color = "#2a2a27") => `<path d="M${cx} ${y} v-26 a14 14 0 1 1 14 -14" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/><path d="M${cx - 150} ${y + 56} L${cx} ${y} L${cx + 150} ${y + 56}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

export const SCENES = {
  /** Wide campaign: arch window, rail with hanging pieces. */
  heroMain: () => {
    const w = 2000, h = 1500;
    return wrap(w, h, `${backdrop(w, h, "#E7D9C4", "#C79C80", 0.86)}
      ${disc(1250, 560, 520, "#F6E7CF", 0.55, true)}
      ${arch(1250, 1290, 640, 1000, "#F3E6D0")}
      ${arch(1250, 1290, 500, 860, "#EAD3B3", 0.9)}
      ${disc(1250, 640, 150, "#FBF2DE", 0.9)}
      <path d="M180 250 H1080" stroke="#2a2a27" stroke-width="8" stroke-linecap="round"/>
      ${hanger(330, 250)}${hanger(620, 250)}${hanger(910, 250)}
      ${garment("coat", "#C8B392", { x: 330 - 400 * 0.62, y: 140, scale: 0.62, shadow: false })}
      ${garment("blazer", "#2A2A27", { x: 620 - 400 * 0.6, y: 130, scale: 0.6, shadow: false })}
      ${garment("shirt", "#EFE9DC", { x: 910 - 400 * 0.6, y: 136, scale: 0.6, shadow: false })}
      ${garment("tote", "#A9733F", { x: 1380, y: 790, scale: 0.55 })}
      <ellipse cx="1000" cy="1290" rx="700" ry="26" fill="#000" opacity=".12" filter="url(#blur)"/>`);
  },
  heroSecondary: () => {
    const w = 1000, h = 1500;
    return wrap(w, h, `${backdrop(w, h, "#8F9170", "#5D5F46", 0.9)}
      ${disc(700, 380, 240, "#C6C7A5", 0.5, true)}
      <path d="M-50 1500 C100 900 300 700 520 640 C760 580 900 300 1100 120 L1100 1500 Z" fill="#767557"/>
      <path d="M-50 1500 C150 1000 330 860 540 790 C760 720 900 480 1100 360 L1100 1500 Z" fill="#8B8A68" opacity=".9"/>
      <path d="M-50 1500 C200 1160 380 1060 600 980 C800 900 930 740 1100 680 L1100 1500 Z" fill="#A3A27F" opacity=".85"/>
      ${garment("scarf", "#B58B5E", { x: 120, y: 300, scale: 0.9, rot: -8 })}`);
  },
  panelKnit: () => {
    const w = 1200, h = 1500;
    return wrap(w, h, `${backdrop(w, h, "#E9DFCC", "#D2C09D", 0.85)}
      ${disc(600, 640, 430, "#B27A62", 0.95)}${disc(600, 640, 300, "#C18F77", 0.8)}
      ${garment("knit", "#D6C6A6", { x: 60, y: 120, scale: 1.2 })}`);
  },
  panelTrouser: () => {
    const w = 1200, h = 1600;
    return wrap(w, h, `${backdrop(w, h, "#D9D5CA", "#B3AC9C", 0.86)}
      ${arch(600, 1380, 760, 1260, "#EAE5D9")}
      ${garment("trouser", "#33332F", { x: 150, y: 120, scale: 1.2 })}
      ${garment("tote", "#A9733F", { x: 640, y: 700, scale: 0.55 })}`);
  },
  story: () => {
    const w = 2400, h = 1030;
    return wrap(w, h, `${backdrop(w, h, "#EFD9BC", "#C99A7A", 0.9)}
      ${disc(1700, 330, 200, "#FBEBCF", 0.95)}${disc(1700, 330, 340, "#FBEBCF", 0.3, true)}
      <path d="M0 1030 L0 700 C300 560 600 640 900 700 C1300 780 1700 620 2400 720 L2400 1030 Z" fill="#B98B6C"/>
      <path d="M0 1030 L0 800 C400 700 800 820 1200 840 C1700 870 2000 760 2400 820 L2400 1030 Z" fill="#A5755A"/>
      <path d="M0 1030 L0 920 C500 880 900 960 1400 940 C1800 920 2100 900 2400 930 L2400 1030 Z" fill="#8E6049"/>
      ${garment("scarf", "#EFE9DC", { x: 260, y: 130, scale: 0.8, rot: 14 })}
      ${garment("coat", "#C8B392", { x: 760, y: 90, scale: 0.78, rot: -4 })}`);
  },
  look: () => {
    const w = 1200, h = 1500;
    // item centres (percent of image) used for the hotspots: blazer 40/42, trousers 40/78, scarf 77/34, tote 76/76
    return wrap(w, h, `${backdrop(w, h, "#E4DDCF", "#C7BAA3", 0.88)}
      ${arch(820, 1320, 640, 1200, "#EDE6D8")}
      ${garment("blazer", "#1B1B19", { x: 480 - 400 * 0.8, y: 160, scale: 0.8 })}
      ${garment("trouser", "#33332F", { x: 480 - 400 * 0.6, y: 790, scale: 0.6, shadow: false })}
      ${garment("scarf", "#B58B5E", { x: 920 - 400 * 0.55, y: 190, scale: 0.55, rot: 6 })}
      ${garment("tote", "#A9733F", { x: 912 - 400 * 0.5, y: 810, scale: 0.5 })}`);
  },
  featured: () => {
    const w = 1200, h = 1600;
    return wrap(w, h, `${backdrop(w, h, "#C6CBB1", "#9DA486", 0.88)}
      ${disc(600, 600, 420, "#DADDC7", 0.6, true)}
      ${garment("shirt", "#767557", { x: 60, y: 420, scale: 0.9, rot: -5, shadow: false })}
      ${garment("shirt", "#D2C3A8", { x: 260, y: 260, scale: 0.9, rot: 3, shadow: false })}
      ${garment("shirt", "#EFE9DC", { x: 160, y: 120, scale: 0.95 })}`);
  },
  about: () => {
    const w = 1200, h = 1500;
    return wrap(w, h, `${backdrop(w, h, "#E8E0D2", "#CFC2AC", 0.9)}
      ${arch(330, 1350, 420, 1000, "#D6C6A6")}${arch(610, 1350, 420, 1200, "#B27A62")}${arch(890, 1350, 420, 900, "#767557")}
      ${disc(610, 330, 90, "#F6EAD3", 0.95)}`);
  },
  journal1: () => {
    const w = 1600, h = 1000;
    return wrap(w, h, `${backdrop(w, h, "#E6DAC6", "#C49A7C", 0.84)}
      ${disc(1180, 360, 220, "#FBEFD8", 0.9)}
      ${garment("dress", "#EFE9DC", { x: 300, y: 10, scale: 0.9 })}
      ${garment("scarf", "#B27A62", { x: 880, y: 140, scale: 0.7, rot: 8 })}`);
  },
  journal2: () => {
    const w = 1200, h = 1500;
    return wrap(w, h, `${backdrop(w, h, "#D5DAE0", "#A9B8C5", 0.88)}
      ${arch(600, 1340, 700, 1180, "#E7ECF0")}
      ${garment("shirt", "#F7F5F0", { x: 60, y: 160, scale: 1.2 })}`);
  },
  journal3: () => {
    const w = 1200, h = 1500;
    return wrap(w, h, `${backdrop(w, h, "#E1D2C9", "#BFA196", 0.88)}
      ${disc(600, 560, 400, "#EBD9CF", 0.7, true)}
      ${garment("coat", "#C8B392", { x: 60, y: 90, scale: 1.2 })}`);
  },
  social: (n) => {
    const w = 900, h = 900;
    const sets = [
      ["#E9DFCC", "#D2C09D", "knit", "#B58B5E"], ["#D9D5CA", "#B3AC9C", "blazer", "#1B1B19"], ["#E3E4DA", "#CDD0BE", "shirt", "#A0A68A"],
      ["#EAE0DC", "#D8C5BD", "dress", "#E1C6BB"], ["#E4DDCF", "#C7BAA3", "tote", "#A9733F"], ["#DCE0DA", "#B7C0B4", "scarf", "#767557"],
    ];
    const [t, b, k, c] = sets[n % sets.length];
    return wrap(w, h, `${backdrop(w, h, t, b, 0.88)}${disc(450, 400, 280, mix(t, "#ffffff", 0.5), 0.6, true)}${garment(k, c, { x: 80, y: 30, scale: 0.84 })}`);
  },
};
