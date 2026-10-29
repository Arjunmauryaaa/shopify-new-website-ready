import { defineConfig, devices } from "@playwright/test";

// Tests for the Shopify Liquid theme, run against the local preview (scripts/theme-preview.mjs).
// The preview is an approximation of Shopify's renderer, so these check theme JavaScript and markup,
// not live Shopify behaviour.
export default defineConfig({
  testDir: "tests/theme",
  testMatch: /.*\.spec\.ts/,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:9292" },
  webServer: { command: "node scripts/theme-preview.mjs", url: "http://localhost:9292/", reuseExistingServer: false, timeout: 30_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
