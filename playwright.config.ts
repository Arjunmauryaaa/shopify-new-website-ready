import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const env = {
  E2E: "1",
  SHOPIFY_STORE_DOMAIN: "mock-store.myshopify.com",
  SHOPIFY_API_ORIGIN: "http://localhost:4010",
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: "mock-token",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  NEXT_PUBLIC_BRAND_NAME: "EAST SIDE",
  PORT: String(PORT),
  NEXT_PUBLIC_FREE_SHIPPING_THRESHOLDS: '{"INR":5000}',
  NEXT_PUBLIC_PAYMENT_METHODS: "UPI, Cards, Netbanking",
  NEXT_PUBLIC_DELIVERY_ESTIMATE: "Delivered in 3-5 working days",
  NEXT_PUBLIC_GIFT_WRAP_VARIANT_ID: "gid://shopify/ProductVariant/5002",
  NEXT_PUBLIC_GA4_ID: "G-TEST000000",
};

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Most tests run with cookie consent already declined so the banner never overlaps the UI under test.
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: "consent:v1", value: "denied" }] }] },
  },
  webServer: [
    { command: "node tests/e2e/mock-shopify.mjs", url: "http://localhost:4010/img/1.png", reuseExistingServer: false },
    {
      // wipe .next so the on-disk fetch cache from earlier runs can't answer requests the tests expect to reach the mock
      command: "node -e \"require('fs').rmSync('.next',{recursive:true,force:true})\" && npm run build && npm run start",
      url: `http://localhost:${PORT}`,
      timeout: 300_000,
      reuseExistingServer: false,
      env,
    },
  ],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
