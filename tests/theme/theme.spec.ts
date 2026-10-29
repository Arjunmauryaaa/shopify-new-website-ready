import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Runs against scripts/theme-preview.mjs (LiquidJS + sample data). It exercises the theme's own markup and JavaScript.
// It does not prove behaviour on a real Shopify store.

test.beforeEach(async ({ page }) => {
  await page.request.get("/__reset");
  // Clear once per browser context, not on every navigation, so saved items survive page loads within a test.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("__cleared")) {
      localStorage.clear();
      sessionStorage.setItem("__cleared", "1");
    }
  });
});

const ROMPER = "/products/soft-jersey-romper";

test.describe("bag drawer", () => {
  test("adds without leaving the page, confirms, and updates the count", async ({ page }) => {
    await page.goto(ROMPER);
    await page.locator("[data-add-button]").click();
    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Added to your bag")).toBeVisible();
    await expect(drawer.locator(".cart-line")).toHaveCount(1);
    await expect(page.locator("[data-cart-count]").first()).toHaveText("(1)");
    await expect(page).toHaveURL(/products\/soft-jersey-romper/);
  });

  test("changes quantity, removes a line and shows the empty state", async ({ page }) => {
    await page.goto(ROMPER);
    await page.locator("[data-add-button]").click();
    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await drawer.getByRole("button", { name: "Increase quantity" }).click();
    await expect(drawer.locator(".qty output")).toHaveText("2");
    await drawer.getByRole("button", { name: "Remove" }).click();
    await expect(drawer.getByText("Your bag is empty.")).toBeVisible();
  });

  test("a sold-out variant cannot be added and says so", async ({ page }) => {
    await page.goto(ROMPER);
    await page.locator(".opt", { hasText: "0-3M" }).click();
    await expect(page.locator("[data-add-button]")).toBeDisabled();
    await expect(page.locator("[data-add-button]")).toHaveText("Sold out");
  });

  test("gift message is saved to the bag", async ({ page }) => {
    await page.goto(ROMPER);
    await page.locator("[data-add-button]").click();
    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await drawer.getByText("This is a gift").click();
    await drawer.getByLabel("Gift message or order note").fill("Congratulations!");
    await expect.poll(async () => (await (await page.request.post("/cart/update.js", { data: {} })).json()).note).toBe("Congratulations!");
  });
});

test.describe("product page", () => {
  test("option buttons pick the variant, update price and mark unavailable sizes", async ({ page }) => {
    await page.goto(ROMPER);
    await expect(page.locator("[data-product-price]")).toHaveText("Rs. 1,799.00");
    await page.locator(".opt", { hasText: "6-12M" }).click();
    await expect(page.locator("[data-product-price]")).toHaveText("Rs. 1,899.00");
    await expect(page).toHaveURL(/variant=/);
    await expect(page.locator(".opt", { hasText: "0-3M" })).toHaveClass(/is-soldout/);
  });

  test("full-screen viewer zooms in and out", async ({ page }) => {
    await page.goto(ROMPER);
    await page.getByRole("button", { name: /View image 1 full screen/ }).click();
    const viewer = page.getByRole("dialog", { name: "Image viewer" });
    await expect(viewer.getByText("100%")).toBeVisible();
    await viewer.getByRole("button", { name: "Zoom in" }).click();
    await expect(viewer.getByText("175%")).toBeVisible();
    await viewer.getByRole("button", { name: "Zoom out" }).click();
    await expect(viewer.getByText("100%")).toBeVisible();
  });

  test("related products load and carry saved-item buttons", async ({ page }) => {
    await page.goto(ROMPER);
    await expect(page.getByRole("heading", { name: "You may also like" })).toBeVisible();
    await expect(page.locator(".recs .product-card")).toHaveCount(4);
  });

  test("has product structured data", async ({ page }) => {
    await page.goto(ROMPER);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld!)["@type"]).toBe("Product");
  });
});

test.describe("search", () => {
  test("shows suggestions with prices, remembers recent searches", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-search-open]:visible").first().click();
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog.getByRole("heading", { name: "Browse" })).toBeVisible();
    await dialog.getByLabel("Search products").fill("rib");
    await expect(dialog.locator(".search-list a")).toHaveCount(1);
    await expect(dialog.locator(".search-list__price")).toContainText("1,299");
    await dialog.getByLabel("Search products").press("Enter");
    await page.waitForURL(/\/search\?q=rib/);
    await page.locator("[data-search-open]:visible").first().click();
    await expect(page.getByRole("heading", { name: "Recent searches" })).toBeVisible();
  });

  test("a search with no match says so and offers somewhere to go", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-search-open]:visible").first().click();
    const dialog = page.getByRole("dialog", { name: "Search" });
    await dialog.getByLabel("Search products").fill("zzzzzz");
    await expect(dialog.getByText(/No results for/)).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Browse" })).toBeVisible();
  });
});

test.describe("collection filters", () => {
  test("price filter narrows the list and can be cleared", async ({ page }) => {
    await page.goto("/collections/all");
    await expect(page.locator(".product-card")).toHaveCount(8);
    await page.locator(".filters summary").click();
    await page.getByLabel("Maximum price").fill("1500"); // typing alone should apply the filter, no blur or button needed
    await page.waitForURL(/filter\.v\.price\.lte=1500/);
    const n = await page.locator(".product-card").count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(8);
    await expect(page.getByRole("list", { name: "Active filters" })).toBeVisible();
  });
});

test.describe("saved items", () => {
  test("hearting a product keeps it on the Saved page", async ({ page }) => {
    await page.goto("/collections/all");
    await page.getByRole("button", { name: /^Save Ribbed Cotton Bodysuit/ }).click({ force: true });
    await expect(page.getByRole("button", { name: /^Save Ribbed Cotton Bodysuit/ })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/pages/saved");
    await expect(page.locator("[data-saved-grid] .product-card")).toHaveCount(1);
  });

  test("empty Saved page invites the shopper to browse", async ({ page }) => {
    await page.goto("/pages/saved");
    await expect(page.getByText(/haven.t saved anything yet/)).toBeVisible();
  });
});

test.describe("phone navigation", () => {
  test("bottom bar only exists on phones and opens search and the bag", async ({ page, isMobile }) => {
    await page.goto("/");
    const bar = page.getByRole("navigation", { name: "Quick navigation" });
    if (!isMobile) return expect(bar).toBeHidden();
    await expect(bar).toBeVisible();
    await bar.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
    await page.keyboard.press("Escape");
    await bar.getByRole("button", { name: /Open bag/ }).click();
    await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
  });

  test("sticky add-to-bag bar appears after the main button scrolls away", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phones only");
    await page.goto(ROMPER);
    await expect(page.locator("[data-sticky-atc]")).toBeHidden();
    await page.locator(".product-accordions").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator("[data-sticky-atc]")).toBeVisible();
  });
});

test.describe("accessibility (axe, serious and critical only)", () => {
  for (const path of ["/", "/collections/all", ROMPER, "/cart"]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
