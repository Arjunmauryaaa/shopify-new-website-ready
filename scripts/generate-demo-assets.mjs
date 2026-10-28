// Renders the demo artwork to public/demo/*.jpg with the Chromium bundled for Playwright.
//   npm run demo:assets
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PRODUCTS, slug } from "../demo/products.mjs";
import { SCENES, productDetail, productFront } from "../demo/art.mjs";

const out = path.resolve("public/demo");
fs.mkdirSync(out, { recursive: true });

const jobs = [];
for (const p of PRODUCTS) {
  p.colors.forEach(([name, hex], i) => jobs.push([`p-${p.handle}-${slug(name)}`, productFront(p.kind, hex, i), 1000, 1250]));
  jobs.push([`p-${p.handle}-detail`, productDetail(p.kind, p.colors[0][1]), 1000, 1250]);
}
const sceneSize = { heroMain: [2000, 1500], heroSecondary: [1000, 1500], panelKnit: [1200, 1500], panelTrouser: [1200, 1600], story: [2400, 1030], look: [1200, 1500], featured: [1200, 1600], about: [1200, 1500], journal1: [1600, 1000], journal2: [1200, 1500], journal3: [1200, 1500] };
for (const [name, [w, h]] of Object.entries(sceneSize)) jobs.push([`scene-${name}`, SCENES[name](), w, h]);
for (let i = 0; i < 6; i++) jobs.push([`social-${i + 1}`, SCENES.social(i), 900, 900]);

const browser = await chromium.launch();
const page = await browser.newPage();
let n = 0;
for (const [name, html, w, h] of jobs) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html);
  await page.screenshot({ path: path.join(out, `${name}.jpg`), type: "jpeg", quality: 84 });
  n++;
}
await browser.close();
console.log(`wrote ${n} images to ${out}`);
