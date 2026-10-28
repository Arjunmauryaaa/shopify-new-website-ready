import { expect, test } from "@playwright/test";

// Run against the local Storefront API mock; it records the `country`/`language` context of every request it receives.
const MOCK = "http://localhost:4010";

type Ctx = { op: string; country?: string; language?: string; inContext: boolean };
const drain = async (request: import("@playwright/test").APIRequestContext): Promise<Ctx[]> => (await request.get(`${MOCK}/__contexts`)).json();

test.describe("market routing", () => {
  test("un-prefixed URLs redirect to the best market: cookie → IP country → Accept-Language → default", async ({ request }) => {
    const hop = async (path: string, headers: Record<string, string> = {}) => {
      const res = await request.get(path, { headers, maxRedirects: 0 });
      return { status: res.status(), location: res.headers()["location"] ?? "" };
    };
    expect(await hop("/")).toMatchObject({ status: 307, location: expect.stringMatching(/\/en-in$/) });
    expect((await hop("/shop?sort=newest", { "x-vercel-ip-country": "US" })).location).toMatch(/\/en-us\/shop\?sort=newest$/);
    expect((await hop("/", { "cf-ipcountry": "GB" })).location).toMatch(/\/en-gb$/);
    expect((await hop("/", { "accept-language": "en-AU,en;q=0.8" })).location).toMatch(/\/en-au$/);
    expect((await hop("/", { "x-vercel-ip-country": "US", cookie: "market=en-sg" })).location).toMatch(/\/en-sg$/);
    expect((await hop("/", { "x-vercel-ip-country": "BR" })).location).toMatch(/\/en-in$/); // unsupported country → default
  });

  test("prefixed URLs are served directly and remember the market in a cookie", async ({ page, context }) => {
    await page.goto("/en-gb/shop");
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();
    expect((await context.cookies()).find((c) => c.name === "market")?.value).toBe("en-gb");
    await page.goto("/shop"); // no prefix → remembered choice wins
    await expect(page).toHaveURL(/\/en-gb\/shop$/);
  });

  test("every internal link stays inside the market", async ({ page }) => {
    await page.goto("/en-us");
    const hrefs = await page.locator("main a[href^='/'], header a[href^='/'], footer a[href^='/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(10);
    expect(hrefs.filter((h) => !h.startsWith("/en-us"))).toEqual([]);
  });

  test("hreflang alternates and a market-specific canonical on every page", async ({ page }) => {
    await page.goto("/en-gb/products/linen-shirt");
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /\/en-gb\/products\/linen-shirt$/);
    const alts = await page.locator("link[rel='alternate'][hreflang]").evaluateAll((els) => els.map((e) => [e.getAttribute("hreflang"), e.getAttribute("href")]));
    const map = Object.fromEntries(alts as string[][]);
    expect(Object.keys(map).sort()).toEqual(["en-AE", "en-AU", "en-CA", "en-DE", "en-GB", "en-IN", "en-SG", "en-US", "x-default"]);
    expect(map["en-US"]).toMatch(/\/en-us\/products\/linen-shirt$/);
    expect(await page.locator("html").getAttribute("lang")).toBe("en");
    const ld = JSON.parse((await page.locator("script[type='application/ld+json']").first().textContent())!);
    expect(ld.url).toMatch(/\/en-gb\/products\/linen-shirt$/);
  });

  test("sitemap lists each market URL with hreflang alternates", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/en-us/products/linen-shirt");
    expect(xml).toContain("/en-in/products/linen-shirt");
    expect(xml).toMatch(/hreflang="en-GB"/);
  });
});

test.describe("market-aware commerce", () => {
  test("Shopify receives the buyer's country and language with @inContext", async ({ page, request }, testInfo) => {
    await drain(request);
    // unique market+product per project, so the data cache cannot answer the request
    const n = testInfo.project.name === "desktop" ? 9 : 10;
    await page.goto(`/en-sg/products/item-${n}`);
    await expect(page.getByRole("heading", { level: 1, name: `Item ${n}` })).toBeVisible();
    const seen = (await drain(request)).filter((c) => c.op === "Product");
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0]).toMatchObject({ country: "SG", language: "EN", inContext: true });
  });

  test("selector switches market on the same page, updates the label, links and cookie", async ({ page, context }) => {
    await page.goto("/en-in/products/linen-shirt");
    const trigger = page.locator("header").getByRole("button", { name: /India · INR/ });
    test.skip(!(await trigger.isVisible()), "desktop header trigger only; mobile covered via menu below");
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Country and currency" });
    await expect(dialog.getByRole("link", { name: /India/ })).toHaveAttribute("aria-current", "true");
    await dialog.getByRole("link", { name: /United States/ }).click();
    await expect(page).toHaveURL(/\/en-us\/products\/linen-shirt(\?variant=\d+)?$/);
    await expect(page.locator("header").getByRole("button", { name: /United States · USD/ })).toBeVisible();
    expect((await context.cookies()).find((c) => c.name === "market")?.value).toBe("en-us");
  });

  test("mobile: market is reachable from the menu", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 1440) >= 900, "mobile only");
    await page.goto("/en-in");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: /India · INR/ }).click();
    await page.getByRole("dialog", { name: "Country and currency" }).getByRole("link", { name: /United Kingdom/ }).click();
    await expect(page).toHaveURL(/\/en-gb$/);
  });

  test("a cart created in one market is re-pointed when the visitor browses another", async ({ page, request }) => {
    await page.goto("/en-in/products/item-3");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await drain(request);
    await page.goto("/en-ae/shop");
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await expect.poll(async () => (await drain(request)).some((c) => c.op === "CartBuyerIdentityUpdate" && c.country === "AE")).toBe(true);
  });

  test("prices are formatted with the market's locale conventions", async ({ page }) => {
    await page.goto("/en-in/products/item-1");
    await expect(page.getByTestId("price")).toContainText("₹1,100");
    await page.goto("/en-de/products/item-1");
    // mock returns INR amounts for every market; the formatting (not the currency) follows the en-DE locale
    await expect(page.getByTestId("price")).toContainText(/1[.,]100/);
  });
});
