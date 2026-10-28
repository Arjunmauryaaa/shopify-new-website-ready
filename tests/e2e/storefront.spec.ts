import { expect, test, type Page } from "@playwright/test";

// These run against a local mock of the Shopify Storefront API (tests/e2e/mock-shopify.mjs).
// Passing here means the storefront behaves correctly against that mock — not that live Shopify is verified.

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 900;


test.describe("home", () => {
  test("renders the editorial composition with a genuinely centred wordmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Campaign", exact: true })).toBeVisible();
    // Unconfigured campaign images are explicit placeholders, never stock photos.
    await expect(page.locator("[data-placeholder='true']").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "New Arrivals" })).toBeVisible();
    await expect(page.getByTestId("product-card").first()).toBeVisible();

    const box = await page.locator(".header .wordmark").boundingBox();
    const vw = page.viewportSize()!.width;
    expect(Math.abs(box!.x + box!.width / 2 - vw / 2)).toBeLessThan(4);
  });

  test("home exposes WebSite structured data and a canonical URL", async ({ page }) => {
    await page.goto("/");
    const ld = await page.locator("script[type='application/ld+json']").allTextContents();
    expect(ld.join("")).toContain("SearchAction");
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /\/en-[a-z]{2}$/);
  });
});

test.describe("shopping journey", () => {
  test("variant selection → add to bag → adjust → checkout link → remove", async ({ page }) => {
    await page.goto("/products/linen-shirt");
    await expect(page.getByRole("heading", { level: 1, name: "Linen Shirt" })).toBeVisible();

    // Default: first available variant (S / Ivory), price from Shopify.
    await expect(page.getByTestId("price")).toContainText("4,500");

    // Black has a compare-at price and a different image; URL reflects the variant.
    await page.getByRole("radio", { name: "Black" }).click();
    await expect(page.getByTestId("price")).toContainText("4,800");
    await expect(page.getByTestId("price")).toContainText("5,200");
    await expect(page).toHaveURL(/variant=\d+/);

    // Black / L is sold out in the mock: it cannot be bought.
    await page.getByRole("radio", { name: /^L/ }).click();
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
    await expect(page.getByTestId("add-to-cart")).toHaveText("Sold out");
    await page.getByRole("radio", { name: "M", exact: true }).click();
    await expect(page.getByTestId("add-to-cart")).toBeEnabled();

    await page.getByTestId("add-to-cart").click();
    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Linen Shirt")).toBeVisible();
    await expect(drawer.getByText("M / Black")).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    // Quantity update is reflected in totals from the (mock) Shopify cart.
    await drawer.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    await expect(drawer.getByText("₹9,600").first()).toBeVisible();

    // Checkout goes to the URL Shopify returned — never a fabricated success page.
    const href = await drawer.getByTestId("checkout-link").getAttribute("href");
    expect(href).toMatch(/^http:\/\/localhost:4010\/checkout\/mock\d+$/);

    // The cart survives a reload (httpOnly cookie session).
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await page.reload();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Bag" })).toBeVisible();
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Your bag is empty.")).toBeVisible();
  });

  test("discount codes are validated by Shopify, not the client", async ({ page }) => {
    await page.goto("/products/item-2");
    await page.getByTestId("add-to-cart").click();
    await page.keyboard.press("Escape");
    await page.goto("/cart");
    await page.getByLabel("Discount code").fill("BOGUS");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/can’t be applied/)).toBeVisible();
    await page.getByLabel("Discount code").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/WELCOME10 applied/)).toBeVisible();
  });

  test("sold-out simple product cannot be added", async ({ page }) => {
    await page.goto("/products/item-7");
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
  });
});

test.describe("discovery", () => {
  test("collection: cursor load-more, sort and filters sync with the URL", async ({ page }) => {
    await page.goto("/collections/new-arrivals");
    const cards = page.getByTestId("product-card");
    await expect(cards).toHaveCount(24);
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(cards).toHaveCount(31);
    await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);

    await page.getByLabel("Sort").selectOption("price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);

    await page.getByRole("button", { name: /^Filter/ }).click();
    const filters = page.getByRole("dialog", { name: "Filters" });
    await filters.getByLabel(/In stock/).check();
    await expect(page).toHaveURL(/f=filter\.v\.availability\.1/);
    await filters.getByRole("button", { name: "View results" }).click();
    await expect(page.getByRole("list", { name: "Active filters" })).toBeVisible();
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).not.toHaveURL(/f=/);
  });

  test("an empty filter result offers recovery", async ({ page }) => {
    await page.goto("/collections/new-arrivals?price_min=999999");
    await expect(page.getByText("No products match these filters.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear all filters" })).toBeVisible();
  });

  test("search overlay: debounced results, keyboard navigation, Escape, no-results recovery", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Search" }).click();
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(page.getByRole("combobox", { name: "Search products" })).toBeFocused();

    await page.getByRole("combobox", { name: "Search products" }).fill("Linen");
    await expect(dialog.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/products\/linen-shirt/);

    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("combobox", { name: "Search products" }).fill("zzzzzz");
    await expect(dialog.getByText(/No results for/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("search page lists real results and handles none", async ({ page }) => {
    await page.goto("/search?q=Item 1");
    await expect(page.getByTestId("product-card").first()).toBeVisible();
    await page.goto("/search?q=nothingmatches");
    await expect(page.getByText(/Nothing matched/)).toBeVisible();
  });

  test("wishlist persists saved products on this device", async ({ page }) => {
    await page.goto("/products/linen-shirt");
    await page.getByRole("button", { name: /Save/ }).first().click();
    await expect(page.getByRole("button", { name: /Saved|Remove Linen Shirt/ }).first()).toBeVisible();
    await page.goto("/wishlist");
    await expect(page.getByRole("link", { name: /Linen Shirt/ })).toBeVisible();
    await page.getByRole("button", { name: /Remove Linen Shirt from wishlist/ }).click();
    await expect(page.getByText("You haven’t saved anything yet.")).toBeVisible();
  });
});

test.describe("content, forms and SEO", () => {
  test("product page ships accurate structured data and metadata", async ({ page }) => {
    await page.goto("/products/linen-shirt");
    const ld = JSON.parse((await page.locator("script[type='application/ld+json']").first().textContent())!);
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers).toMatchObject({ priceCurrency: "INR", lowPrice: 4500, highPrice: 4800 });
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|review/);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /\/products\/linen-shirt$/);
    await expect(page.locator("meta[property='og:title']")).toHaveAttribute("content", /Linen Shirt/);
  });

  test("unknown routes return real 404s", async ({ page, request }) => {
    expect((await request.get("/products/does-not-exist")).status()).toBe(404);
    expect((await request.get("/collections/nope")).status()).toBe(404);
    expect((await request.get("/pages/unknown-page")).status()).toBe(404);
    await page.goto("/products/does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("robots and sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/products/linen-shirt");
    expect(sitemap).toContain("/collections/new-arrivals");
  });

  test("expected policy pages show an honest notice until published; real pages render", async ({ page }) => {
    await page.goto("/pages/shipping");
    await expect(page.getByText("This page hasn’t been published yet.")).toBeVisible();
    await page.goto("/pages/faq");
    await expect(page.getByText("FAQ body.")).toBeVisible();
  });

  test("journal listing and article come from the blog", async ({ page }) => {
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: /Story 3/ })).toBeVisible();
    await page.goto("/journal/story-1");
    await expect(page.getByRole("heading", { level: 1, name: "Story 1" })).toBeVisible();
    await expect(page.getByText("Body of story 1")).toBeVisible();
  });

  test("contact form validates accessibly and never fakes success", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Name").fill("Ada");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Message").fill("Hello, a question about sizing.");
    await page.getByRole("button", { name: "Send message" }).click();
    // No email provider is configured in this environment → the form must report failure, not success.
    await expect(page.getByRole("alert").filter({ hasText: "isn't available" })).toBeVisible();
    await expect(page.getByText(/your message has been sent/i)).toHaveCount(0);
  });

  test("newsletter validates and reports provider unavailability honestly", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#home-newsletter-email");
    await form.fill("not-an-email");
    await page.getByRole("button", { name: "Subscribe" }).first().click();
    await expect(page.getByText("Enter a valid email address.").first()).toBeVisible();
    await form.fill("ada@example.com");
    await page.getByRole("button", { name: "Subscribe" }).first().click();
    await expect(page.getByText("Newsletter sign-up isn't available yet.")).toBeVisible();
    await expect(page.getByText(/you're subscribed/)).toHaveCount(0);
  });

  test("account page is honest when customer accounts are not configured", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("Customer accounts aren’t enabled yet.")).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("mobile menu opens, traps focus, navigates and closes", async ({ page }) => {
    test.skip(!isMobile(page), "mobile-only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Shop" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("desktop navigation shows left/centre/right regions", async ({ page }) => {
    test.skip(isMobile(page), "desktop-only");
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Shop" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  });
});

test.describe("responsive", () => {
  const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];
  for (const w of widths) {
    test(`no horizontal overflow at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      for (const path of ["/", "/shop", "/products/linen-shirt", "/cart", "/journal", "/contact"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} at ${w}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});
