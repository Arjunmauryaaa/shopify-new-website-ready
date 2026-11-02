// Renders DUMMY health & personal care artwork and a short looping video into assets/ (wh-*.jpg, wh-demo-video.webm).
//   node scripts/generate-wellness-assets.mjs
// Replace these in the theme editor with your own photos and videos; they are placeholders only.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const out = path.resolve("assets");

const defs = `<defs>
  <linearGradient id="glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .11 0"/></filter>
  <filter id="sh" x="-30%" y="-10%" width="160%" height="150%"><feDropShadow dx="0" dy="22" stdDeviation="16" flood-color="#1c2622" flood-opacity=".22"/></filter>
</defs>`;

// Each item is drawn in a 400x500 box centred on the canvas.
const ITEMS = {
  serum: (c) => `<g filter="url(#sh)"><rect x="150" y="210" width="100" height="220" rx="18" fill="${c}"/><rect x="150" y="210" width="100" height="220" rx="18" fill="url(#glass)"/><rect x="172" y="180" width="56" height="34" fill="#f2eee6"/><rect x="180" y="110" width="40" height="76" rx="10" fill="#1f3a31"/><ellipse cx="200" cy="108" rx="22" ry="12" fill="#1f3a31"/><rect x="164" y="270" width="72" height="70" rx="8" fill="#fff" opacity=".9"/><rect x="174" y="284" width="52" height="6" rx="3" fill="#1f3a31"/><rect x="174" y="300" width="40" height="4" rx="2" fill="#9db3ad"/></g>`,
  jar: (c) => `<g filter="url(#sh)"><rect x="95" y="260" width="210" height="130" rx="26" fill="${c}"/><rect x="95" y="260" width="210" height="130" rx="26" fill="url(#glass)"/><rect x="88" y="210" width="224" height="62" rx="16" fill="#f2eee6"/><rect x="88" y="210" width="224" height="62" rx="16" fill="url(#glass)"/><rect x="140" y="297" width="120" height="58" rx="8" fill="#fff" opacity=".92"/><rect x="154" y="312" width="70" height="7" rx="3" fill="#1f3a31"/><rect x="154" y="328" width="92" height="4" rx="2" fill="#9db3ad"/></g>`,
  tub: (c) => `<g filter="url(#sh)"><rect x="115" y="190" width="170" height="220" rx="22" fill="${c}"/><rect x="115" y="190" width="170" height="220" rx="22" fill="url(#glass)"/><rect x="108" y="150" width="184" height="56" rx="14" fill="#1f3a31"/><rect x="132" y="250" width="136" height="110" rx="10" fill="#fff" opacity=".92"/><circle cx="170" cy="290" r="14" fill="#1f3a31" opacity=".85"/><rect x="194" y="282" width="60" height="7" rx="3" fill="#1f3a31"/><rect x="194" y="298" width="46" height="4" rx="2" fill="#9db3ad"/><rect x="146" y="332" width="108" height="4" rx="2" fill="#9db3ad"/></g>`,
  tube: (c) => `<g filter="url(#sh)"><path d="M130 130h140l14 270a10 10 0 0 1-10 10H126a10 10 0 0 1-10-10Z" fill="${c}"/><path d="M130 130h140l14 270a10 10 0 0 1-10 10H126a10 10 0 0 1-10-10Z" fill="url(#glass)"/><rect x="126" y="100" width="148" height="38" rx="8" fill="#1f3a31"/><rect x="140" y="410" width="120" height="18" rx="4" fill="${c}" opacity=".8"/><rect x="152" y="210" width="96" height="86" rx="8" fill="#fff" opacity=".92"/><rect x="166" y="228" width="60" height="7" rx="3" fill="#1f3a31"/><rect x="166" y="244" width="68" height="4" rx="2" fill="#9db3ad"/></g>`,
  bottle: (c) => `<g filter="url(#sh)"><path d="M150 190c0-24 10-34 10-52h80c0 18 10 28 10 52v210a22 22 0 0 1-22 22h-56a22 22 0 0 1-22-22Z" fill="${c}"/><path d="M150 190c0-24 10-34 10-52h80c0 18 10 28 10 52v210a22 22 0 0 1-22 22h-56a22 22 0 0 1-22-22Z" fill="url(#glass)"/><rect x="170" y="98" width="60" height="46" rx="8" fill="#1f3a31"/><rect x="165" y="250" width="70" height="100" rx="8" fill="#fff" opacity=".92"/><rect x="176" y="268" width="48" height="7" rx="3" fill="#1f3a31"/><rect x="176" y="284" width="36" height="4" rx="2" fill="#9db3ad"/></g>`,
  soap: (c) => `<g filter="url(#sh)"><rect x="90" y="270" width="220" height="110" rx="34" fill="${c}"/><rect x="90" y="270" width="220" height="110" rx="34" fill="url(#glass)"/><rect x="140" y="304" width="120" height="42" rx="21" fill="#fff" opacity=".35"/><g transform="translate(200 215)" fill="#4a6b5a" opacity=".9"><path d="M0 40C-40 36-62 12-62-22 -22-18 0 4 0 40Z"/><path d="M0 40C40 36 62 12 62-22 22-18 0 4 0 40Z" fill="#9fcfbd"/></g></g>`,
};

const SCENES = {
  p1: ["#e6dccb", "#d9ccb5", "serum", "#4a6b5a"],
  p2: ["#ecd9cd", "#e3c4b3", "jar", "#b4694e"],
  p3: ["#dfe6dc", "#c9d6c9", "tub", "#2a4a3f"],
  p4: ["#e9e0cf", "#d9cdb3", "tube", "#d6b98a"],
  p5: ["#d9ded6", "#c3cbbf", "bottle", "#1c2622"],
  p6: ["#e6dccb", "#dccfb9", "soap", "#a9bfae"],
  p7: ["#f0e3d6", "#e6d1bd", "serum", "#b4694e"],
  p8: ["#e3e9df", "#cfd9cb", "jar", "#1f3a31"],
};

const leaf = (x, y, r, s, o = 0.55) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" opacity="${o}"><path d="M0 0C30-50 90-60 120-20 90 20 30 30 0 0Z" fill="#4a6b5a"/><path d="M0 0C50-12 90-14 120-20" stroke="#1f3a31" stroke-width="3" fill="none"/></g>`;

const productScene = ([a, b, kind, color]) => `<!doctype html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 400 400">
${defs}<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#bg)"/><circle cx="200" cy="215" r="150" fill="#fff" opacity=".28"/>
${leaf(40, 360, -30, 0.7)}${leaf(300, 70, 150, 0.6, 0.4)}
<ellipse cx="200" cy="372" rx="110" ry="10" fill="#1c2622" opacity=".14"/>
<g transform="translate(0 -40) scale(1)">${ITEMS[kind](color)}</g><rect width="400" height="400" filter="url(#grain)"/></svg></body>`;

const heroScene = (w, h) => `<!doctype html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${defs}<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a4a3f"/><stop offset="1" stop-color="#1f3a31"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<circle cx="${w * 0.72}" cy="${h * 0.22}" r="${w * 0.16}" fill="#b4694e" opacity=".9"/><circle cx="${w * 0.2}" cy="${h * 0.8}" r="${w * 0.24}" fill="#f2eee6" opacity=".08"/>
<g transform="translate(${w * 0.1} ${h * 0.86}) scale(${w / 500})">${leaf(0, 0, -50, 1.7, 0.6)}${leaf(380, -40, -130, 1.5, 0.5)}</g>
<ellipse cx="${w / 2}" cy="${h * 0.8}" rx="${w * 0.36}" ry="${h * 0.03}" fill="#16302c" opacity=".14"/>
<g transform="translate(${w * 0.5 - w * 0.42} ${h * 0.76 - w * 0.84}) scale(${w * 0.0021})">${ITEMS.jar("#f2c9b2").replace(/translate\(/g, "translate(")}</g>
<g transform="translate(${w * 0.5 - w * 0.12} ${h * 0.77 - w * 0.98}) scale(${w * 0.0016})">${ITEMS.serum("#a9bfae")}</g>
<g transform="translate(${w * 0.5 + w * 0.05} ${h * 0.77 - w * 0.9}) scale(${w * 0.0015})">${ITEMS.bottle("#b4694e")}</g>
<rect width="${w}" height="${h}" filter="url(#grain)"/></svg></body>`;

const jobs = [
  ...Object.entries(SCENES).map(([k, v]) => [`wh-product-${k.slice(1)}`, productScene(v), 1000, 1000]),
  ["wh-hero", heroScene(1200, 1400), 1200, 1400],
  ["wh-benefits", heroScene(1200, 1500), 1200, 1500],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, html, w, h] of jobs) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html);
  await page.screenshot({ path: path.join(out, `${name}.jpg`), type: "jpeg", quality: 82 });
}
await page.close();

// Dummy 9:16 looping video: products drifting over a soft gradient, recorded from an animated page.
const videoHtml = `<!doctype html><style>
html,body{margin:0;height:100%;overflow:hidden;background:#1f3a31}
.bg{position:absolute;inset:0;background:linear-gradient(160deg,#2a4a3f,#1f3a31);animation:hue 6s ease-in-out infinite alternate}
@keyframes hue{to{filter:hue-rotate(18deg) saturate(1.1)}}
.item{position:absolute;width:62%;left:19%;animation:float 3s ease-in-out infinite alternate}
@keyframes float{from{transform:translateY(12px) rotate(-2deg)}to{transform:translateY(-22px) rotate(2deg)}}
.t{position:absolute;left:0;right:0;bottom:7%;text-align:center;font:600 26px/1.3 system-ui;color:#f2eee6;opacity:.8}
.c{position:absolute;border-radius:50%;background:#fff;opacity:.4;animation:float 4s ease-in-out infinite alternate}
</style><div class="bg"></div><div class="c" style="width:240px;height:240px;left:55%;top:8%"></div><div class="c" style="width:320px;height:320px;left:-10%;top:62%;animation-delay:-2s"></div>
<svg class="item" style="top:20%" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">${defs}${ITEMS.serum("#a9bfae")}</svg>
<svg class="item" style="top:52%;width:50%;left:8%;animation-delay:-1.4s" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">${ITEMS.jar("#e6dccb")}</svg>
<svg class="item" style="top:50%;width:46%;left:50%;animation-delay:-.7s" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">${ITEMS.bottle("#b4694e")}</svg>
<div class="t">Dummy video - replace in theme editor</div>`;
const tmp = path.resolve("test-results", "wellness-video");
fs.rmSync(tmp, { recursive: true, force: true });
const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, recordVideo: { dir: tmp, size: { width: 540, height: 960 } } });
const vp = await ctx.newPage();
await vp.setContent(videoHtml);
await vp.waitForTimeout(6000);
const video = vp.video();
await ctx.close();
fs.copyFileSync(await video.path(), path.join(out, "wh-demo-video.webm"));
await browser.close();
console.log(`wrote ${jobs.length} images and wh-demo-video.webm to ${out}`);
