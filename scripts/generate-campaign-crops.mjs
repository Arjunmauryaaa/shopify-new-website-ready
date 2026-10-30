// Cuts distinct detail crops out of the two licensed campaign photos so each homepage section shows a different image.
// Run: node scripts/generate-campaign-crops.mjs   (see docs/ASSET-CREDITS.md for the source photos)
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = { rack: "assets/campaign-baby-clothes-rack.jpeg", flat: "assets/campaign-baby-clothes-flatlay.jpeg" };
// [output name, source, left, top, width, height, output width]
const CROPS = [
  ["es-knit-stripes", "rack", 240, 1780, 1250, 1640, 1100],
  ["es-teddy-jacket", "rack", 1640, 1480, 1040, 1700, 1000],
  ["es-shelf-camera", "rack", 1100, 3000, 1700, 1032, 1200],
  ["es-rack-wide", "rack", 0, 1080, 3024, 1500, 2200],
  ["es-floral-bloomer", "flat", 180, 760, 2360, 2100, 1200],
  ["es-waffle-knit", "flat", 0, 2000, 1500, 2032, 900],
  ["es-pointelle-white", "flat", 880, 2480, 2144, 1552, 1200],
  ["es-lace-beanie", "flat", 0, 0, 3024, 1500, 2000],
];
for (const [name, src, left, top, width, height, out] of CROPS) {
  const file = path.join(ROOT, "assets", `${name}.jpg`);
  await sharp(path.join(ROOT, SRC[src])).extract({ left, top, width, height }).resize({ width: out }).jpeg({ quality: 80, mozjpeg: true }).toFile(file);
  console.log(name, `${out}x${Math.round((out * height) / width)}`);
}
