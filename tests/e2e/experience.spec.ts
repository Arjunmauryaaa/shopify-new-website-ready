import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Run against the local Storefront API mock. These verify behaviour of the UI layer, not live store data.

test.describe("mobile navigation", () => {
  test("phones get a bottom bar that opens search and the bag; desktop does not", async ({ page, isMobile }) => {
    await page.goto("/en-in");
    const bar = page.getByRole("navigation", { name: "Quick navigation" });
    if (!isMobile) return expect(bar).toBeHidden();
    await expect(bar).toBeVisible();
    await bar.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
    await page.keyboard.press("Escape");
    await bar.getByRole("button", { name: /Open bag/ }).click();
    await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
  });
});

test.describe("search", () => {
  test("empty search offers things to browse and remembers recent terms", async ({ page }) => {
    await page.goto("/en-in");
    await page.getByRole("button", { name: "Search" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog.getByRole("heading", { name: "Browse" })).toBeVisible();
    await page.getByRole("combobox", { name: "Search products" }).fill("Linen");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/search\?q=Linen/);
    await page.getByRole("button", { name: "Search" }).first().click();
    await expect(page.getByRole("heading", { name: "Recent searches" })).toBeVisible();
    await dialog.getByRole("button", { name: "Linen" }).click();
    await expect(page.getByRole("combobox", { name: "Search products" })).toHaveValue("Linen");
  });
});

test.describe("bag confirmation", () => {
  test("adding an item confirms it in the bag", async ({ page }) => {
    await page.goto("/en-in/products/item-2");
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByRole("dialog", { name: "Shopping bag" }).getByRole("status").filter({ hasText: "Added to your bag" })).toBeVisible();
  });
});

test.describe("product gallery", () => {
  test("the full-screen viewer zooms in and out", async ({ page }) => {
    await page.goto("/en-in/products/item-2");
    await page.getByRole("button", { name: "View image full screen" }).click();
    const viewer = page.getByRole("dialog", { name: "Image viewer" });
    await expect(viewer.getByText("100%")).toBeVisible();
    await viewer.getByRole("button", { name: "Zoom in" }).click();
    await expect(viewer.getByText("175%")).toBeVisible();
    await viewer.getByRole("button", { name: "Zoom out" }).click();
    await expect(viewer.getByText("100%")).toBeVisible();
  });
});

test.describe("theme", () => {
  test("the footer toggle switches to dark and the choice persists", async ({ page }) => {
    await page.goto("/en-in");
    await page.getByRole("button", { name: /Switch to dark theme/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: /Switch to light theme/ })).toBeVisible();
  });
});

test.describe("designed states", () => {
  test("404 page keeps the shopper moving", async ({ page }) => {
    await page.goto("/en-in/products/does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue shopping" })).toBeVisible();
  });
});

test.describe("accessibility (axe, serious and critical only)", () => {
  for (const path of ["/en-in", "/en-in/shop", "/en-in/products/item-2", "/en-in/cart", "/en-in/contact"]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
