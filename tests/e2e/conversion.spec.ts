import { expect, test } from "@playwright/test";

// Run against the local Storefront API mock. Third-party services (Klaviyo, Judge.me, GA4, Meta) are NOT
// reachable here, so these tests verify behaviour and honest failure states, not live delivery.

test.describe("express checkout & trust", () => {
  test("Buy it now sends the shopper to Shopify's checkout without touching their bag", async ({ page }) => {
    await page.goto("/en-in/products/item-2");
    await expect(page.getByTestId("cart-count")).toHaveText("");
    await page.getByTestId("buy-now").click();
    await page.waitForURL(/localhost:4010\/checkout\/mock\d+$/);
    await page.goto("/en-in/products/item-2");
    await expect(page.getByTestId("cart-count")).toHaveText(""); // bag stays empty
  });

  test("configured delivery estimate and payment methods render near the purchase button", async ({ page }) => {
    await page.goto("/en-in/products/item-2");
    await expect(page.getByText("Delivered in 3-5 working days")).toBeVisible();
    await expect(page.getByText(/UPI · Cards · Netbanking/)).toBeVisible();
  });

  test("sold-out variants offer a back-in-stock alert and never claim success without the provider", async ({ page }) => {
    await page.goto("/en-in/products/item-7");
    await expect(page.getByTestId("buy-now")).toHaveCount(0);
    await page.getByLabel("Notify me when available").fill("not-an-email");
    await page.getByRole("button", { name: "Notify me" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await page.getByLabel("Notify me when available").fill("ada@example.com");
    await page.getByRole("button", { name: "Notify me" }).click();
    await expect(page.getByText("Stock alerts aren't available yet.")).toBeVisible(); // Klaviyo not configured here
    await expect(page.getByText(/back in stock/)).toHaveCount(0);
  });
});

test.describe("cart: free shipping, gifting, upsell", () => {
  test("free-shipping bar tracks the real subtotal against the configured threshold", async ({ page }) => {
    await page.goto("/en-in/products/item-3"); // ₹1,300
    await page.getByTestId("add-to-cart").click();
    const bar = page.getByTestId("free-shipping-bar");
    await expect(bar).toContainText("away from free shipping");
    await expect(bar).toContainText("3,700");
    await expect(bar.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "26");
    for (let i = 0; i < 3; i++) await page.getByRole("dialog", { name: "Shopping bag" }).getByRole("button", { name: "Increase quantity" }).click();
    await expect(bar).toContainText("unlocked free shipping"); // 4 × 1,300 = 5,200 ≥ 5,000
  });

  test("gift message is stored on the Shopify cart and survives reload; gift wrap toggles a real line", async ({ page }) => {
    await page.goto("/en-in/products/item-3");
    await page.getByTestId("add-to-cart").click();
    await page.keyboard.press("Escape");
    await page.goto("/en-in/cart");
    await page.getByText("Gift options").click();
    await page.getByLabel("Gift message").fill("Happy birthday!");
    await page.getByRole("button", { name: "Save message" }).click();
    await expect(page.getByText(/Message saved/)).toBeVisible();
    await page.reload();
    // the section opens by itself when a message is already saved
    await expect(page.getByLabel("Gift message")).toHaveValue("Happy birthday!");

    await page.getByLabel("Add gift wrap").check();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    await page.getByLabel("Add gift wrap").uncheck();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });

  test("upsell suggests Shopify recommendations not already in the bag and adds them", async ({ page }) => {
    await page.goto("/en-in/products/item-3");
    await page.getByTestId("add-to-cart").click();
    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await expect(drawer.getByText("Complete the look")).toBeVisible();
    await drawer.getByRole("button", { name: "Add", exact: true }).first().click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
  });
});

test.describe("discovery helpers", () => {
  test("quick add opens a panel, loads the product and adds to the bag", async ({ page }) => {
    await page.goto("/en-in/collections/new-arrivals");
    await page.getByRole("button", { name: "Quick add Linen Shirt" }).click({ force: true });
    const panel = page.getByRole("dialog", { name: "Quick add Linen Shirt" });
    await expect(panel.getByRole("heading", { name: "Linen Shirt" })).toBeVisible();
    await panel.getByRole("radio", { name: "M", exact: true }).click();
    await panel.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });

  test("size guide stays hidden until real measurements are configured", async ({ page }) => {
    await page.goto("/en-in/products/linen-shirt");
    await expect(page.getByRole("button", { name: "Size guide" })).toHaveCount(0);
  });

  test("shop-the-look, social feed and reviews are absent (not faked) when unconfigured", async ({ page }) => {
    await page.goto("/en-in");
    await expect(page.getByRole("heading", { name: "Shop the look" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /On Instagram/ })).toHaveCount(0);
    await page.goto("/en-in/products/linen-shirt");
    await expect(page.getByRole("heading", { name: "Customer reviews" })).toHaveCount(0);
    expect(await page.locator("script[type='application/ld+json']").allTextContents().then((t) => t.join(""))).not.toContain("aggregateRating");
    await expect(page.getByTestId("low-stock")).toHaveCount(0); // inventory scope not enabled → no fake scarcity
  });
});

test.describe("atelier client list", () => {
  test("page validates and reports provider unavailability honestly", async ({ page }) => {
    await page.goto("/en-in/atelier");
    await expect(page.getByRole("heading", { level: 1, name: "The Atelier" })).toBeVisible();
    await page.getByLabel("Join the client list").fill("ada@example.com");
    await page.getByRole("button", { name: "Request access" }).click();
    await expect(page.getByText("Newsletter sign-up isn't available yet.")).toBeVisible();
    await expect(page.getByText(/on the list/)).toHaveCount(0);
  });
});

test.describe("consent & analytics", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("asks first, loads nothing before consent, and remembers the choice", async ({ page }) => {
    const trackers: string[] = [];
    page.on("request", (r) => /googletagmanager|facebook\.net|klaviyo\.com/.test(r.url()) && trackers.push(r.url()));
    await page.goto("/en-in");
    const banner = page.getByRole("dialog", { name: "Cookie preferences" });
    await expect(banner).toBeVisible();
    await page.waitForTimeout(800);
    expect(trackers).toEqual([]);

    await banner.getByRole("button", { name: "Decline" }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(banner).toBeHidden();
    await page.waitForTimeout(500);
    expect(trackers).toEqual([]); // declined: still nothing loads
  });

  test("accepting loads the configured GA4 tag", async ({ page }) => {
    const gtag = page.waitForRequest((r) => r.url().includes("googletagmanager.com/gtag/js?id=G-TEST000000"), { timeout: 10_000 });
    await page.goto("/en-in");
    await page.getByRole("button", { name: "Accept" }).click();
    await gtag;
  });
});
