// Runs the storefront in DEMO mode: local Storefront API stand-in with the sample catalogue + the Next.js app.
//   npm run demo           (dev server, hot reload)
//   npm run demo -- --prod (production build + start)
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

const prod = process.argv.includes("--prod");
const port = process.env.PORT || "3000";
const env = {
  ...process.env,
  MOCK_DATASET: "demo",
  NEXT_PUBLIC_DEMO: "true",
  SHOPIFY_STORE_DOMAIN: "demo.myshopify.com",
  SHOPIFY_API_ORIGIN: "http://localhost:4010",
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: "demo",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
  NEXT_PUBLIC_FREE_SHIPPING_THRESHOLDS: '{"INR":15000}',
  NEXT_PUBLIC_PAYMENT_METHODS: "UPI, Cards, Netbanking",
  NEXT_PUBLIC_DELIVERY_ESTIMATE: "Delivered in 3–5 working days",
};

// A stale on-disk fetch cache from earlier runs would answer with old catalogue data.
fs.rmSync(".next", { recursive: true, force: true });

const children = [];
const run = (cmd, args) => {
  const c = spawn(cmd, args, { env, stdio: "inherit" });
  children.push(c);
  return c;
};
const stop = () => children.forEach((c) => c.kill());
process.on("SIGINT", () => (stop(), process.exit(0)));
process.on("exit", stop);

run(process.execPath, ["tests/e2e/mock-shopify.mjs"]);
const next = ["node_modules/next/dist/bin/next"];
if (prod) {
  const b = spawnSync(process.execPath, [...next, "build"], { env, stdio: "inherit" });
  if (b.status !== 0) process.exit(b.status ?? 1);
  run(process.execPath, [...next, "start", "-p", port]);
} else {
  run(process.execPath, [...next, "dev", "-p", port]);
}
